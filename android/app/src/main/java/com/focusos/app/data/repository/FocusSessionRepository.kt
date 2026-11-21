package com.focusos.app.data.repository

import com.focusos.app.data.local.BlockedAppDao
import com.focusos.app.data.local.BlockedAttemptDao
import com.focusos.app.data.local.BlockedAttemptEntity
import com.focusos.app.data.local.DailyMetricDao
import com.focusos.app.data.local.DailyMetricEntity
import com.focusos.app.data.local.FocusSessionDao
import com.focusos.app.data.local.FocusSessionEntity
import com.focusos.app.data.local.NuclearOverrideDao
import com.focusos.app.data.local.NuclearOverrideLogEntity
import com.focusos.app.domain.ActiveFocusSession
import com.focusos.app.domain.BlockedAttemptLog
import com.focusos.app.domain.EmergencyOverrideLog
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class FocusSessionRepository(
    private val focusSessionDao: FocusSessionDao,
    private val blockedAppDao: BlockedAppDao,
    private val blockedAttemptDao: BlockedAttemptDao,
    private val dailyMetricDao: DailyMetricDao,
    private val nuclearOverrideDao: NuclearOverrideDao
) {
    fun observeActiveSession(): Flow<ActiveFocusSession?> {
        return focusSessionDao.observeActiveSession().map { entity ->
            entity?.let {
                ActiveFocusSession(
                    isActive = it.isActive,
                    sessionLabel = it.sessionLabel,
                    startedAtEpochMs = it.startedAtEpochMs,
                    endsAtEpochMs = it.endsAtEpochMs,
                    durationMinutes = it.durationMinutes,
                    isNuclearMode = it.isNuclearMode
                )
            }
        }
    }

    suspend fun getActiveSessionOnce(): ActiveFocusSession? {
        val entity = focusSessionDao.getSessionOnce() ?: return null
        return ActiveFocusSession(
            isActive = entity.isActive,
            sessionLabel = entity.sessionLabel,
            startedAtEpochMs = entity.startedAtEpochMs,
            endsAtEpochMs = entity.endsAtEpochMs,
            durationMinutes = entity.durationMinutes,
            isNuclearMode = entity.isNuclearMode
        )
    }

    fun observeBlockedPackageMap(): Flow<Map<String, String>> {
        return blockedAppDao.observeBlockedApps().map { rows ->
            rows.associate { it.packageName to it.appName }
        }
    }

    fun observeRecentBlockedAttempts(): Flow<List<BlockedAttemptLog>> {
        return blockedAttemptDao.observeRecentAttempts().map { rows ->
            rows.map {
                BlockedAttemptLog(
                    id = it.id,
                    packageName = it.packageName,
                    appName = it.appName,
                    attemptedAtEpochMs = it.attemptedAtEpochMs
                )
            }
        }
    }

    fun observeRecentOverrides(): Flow<List<EmergencyOverrideLog>> {
        return nuclearOverrideDao.observeRecentOverrides().map { rows ->
            rows.map {
                EmergencyOverrideLog(
                    id = it.id,
                    sessionLabel = it.sessionLabel,
                    reason = it.reason,
                    remainingMillisAtAbort = it.remainingMillisAtAbort,
                    overriddenAtEpochMs = it.overriddenAtEpochMs
                )
            }
        }
    }

    suspend fun startSession(
        durationMinutes: Int,
        sessionLabel: String = "Strict Focus Session",
        isNuclearMode: Boolean = false
    ): ActiveFocusSession {
        val now = System.currentTimeMillis()
        val safeDuration = durationMinutes.coerceIn(1, 480)
        val endsAt = now + safeDuration * 60_000L
        val resolvedLabel = if (isNuclearMode) "Nuclear Discipline Lock" else sessionLabel
        val entity = FocusSessionEntity(
            id = 1,
            isActive = true,
            sessionLabel = resolvedLabel,
            startedAtEpochMs = now,
            endsAtEpochMs = endsAt,
            durationMinutes = safeDuration,
            restoredAtEpochMs = null,
            isNuclearMode = isNuclearMode
        )
        focusSessionDao.upsertSession(entity)
        return ActiveFocusSession(
            isActive = true,
            sessionLabel = resolvedLabel,
            startedAtEpochMs = now,
            endsAtEpochMs = endsAt,
            durationMinutes = safeDuration,
            isNuclearMode = isNuclearMode
        )
    }

    suspend fun emergencyOverrideNuclearSession(reason: String) {
        val now = System.currentTimeMillis()
        val existing = focusSessionDao.getSessionOnce() ?: return
        val remaining = (existing.endsAtEpochMs - now).coerceAtLeast(0L)
        nuclearOverrideDao.insertOverride(
            NuclearOverrideLogEntity(
                sessionLabel = existing.sessionLabel,
                reason = reason.trim(),
                remainingMillisAtAbort = remaining,
                overriddenAtEpochMs = now
            )
        )
        focusSessionDao.deactivateSession(now)
    }

    suspend fun restoreSessionIfExpiredOrEnded(completedNaturally: Boolean) {
        val now = System.currentTimeMillis()
        val existing = focusSessionDao.getSessionOnce() ?: return
        if (!existing.isActive) return

        focusSessionDao.deactivateSession(now)

        if (completedNaturally) {
            val todayKey = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
            val currentMetric = dailyMetricDao.getMetricForDateOnce(todayKey)
            if (currentMetric == null) {
                dailyMetricDao.upsertMetric(
                    DailyMetricEntity(
                        dateKey = todayKey,
                        focusMinutes = existing.durationMinutes,
                        screenTimeMinutes = existing.durationMinutes,
                        distractingMinutes = 0,
                        blockedAttempts = 0,
                        missionsCompleted = 0
                    )
                )
            } else {
                dailyMetricDao.addFocusMinutes(todayKey, existing.durationMinutes)
            }
        }
    }

    suspend fun recordBlockedAttempt(packageName: String, appName: String) {
        val now = System.currentTimeMillis()
        val todayKey = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        blockedAttemptDao.insertAttempt(
            BlockedAttemptEntity(
                packageName = packageName,
                appName = appName,
                attemptedAtEpochMs = now,
                dateKey = todayKey
            )
        )
        val currentMetric = dailyMetricDao.getMetricForDateOnce(todayKey)
        if (currentMetric == null) {
            dailyMetricDao.upsertMetric(
                DailyMetricEntity(
                    dateKey = todayKey,
                    focusMinutes = 0,
                    screenTimeMinutes = 0,
                    distractingMinutes = 0,
                    blockedAttempts = 1,
                    missionsCompleted = 0
                )
            )
        } else {
            dailyMetricDao.incrementBlockedAttempt(todayKey)
        }
    }
}
