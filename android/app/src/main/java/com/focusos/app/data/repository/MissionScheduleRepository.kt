package com.focusos.app.data.repository

import com.focusos.app.data.local.BlockedAppDao
import com.focusos.app.data.local.BlockedAppEntity
import com.focusos.app.data.local.DailyMetricDao
import com.focusos.app.data.local.DailyMetricEntity
import com.focusos.app.data.local.DailyScheduleDao
import com.focusos.app.data.local.DailyScheduleEntity
import com.focusos.app.data.local.MissionDao
import com.focusos.app.data.local.MissionEntity
import com.focusos.app.domain.AppSelectionFilter
import com.focusos.app.domain.DailyBlockScheduleItem
import com.focusos.app.domain.ScheduleEvaluator
import com.focusos.app.domain.StudyMissionItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class MissionScheduleRepository(
    private val missionDao: MissionDao,
    private val dailyScheduleDao: DailyScheduleDao,
    private val blockedAppDao: BlockedAppDao,
    private val dailyMetricDao: DailyMetricDao
) {
    fun observeMissions(): Flow<List<StudyMissionItem>> {
        return missionDao.observeAllMissions().map { rows ->
            rows.map { row ->
                StudyMissionItem(
                    id = row.id,
                    title = row.title,
                    subject = row.subject,
                    targetMinutes = row.targetMinutes,
                    completedMinutes = row.completedMinutes,
                    isCompleted = row.isCompleted,
                    isActive = row.isActive,
                    linkedPackages = ScheduleEvaluator.decodePackagesCsv(row.linkedPackagesCsv)
                )
            }
        }
    }

    fun observeSchedules(): Flow<List<DailyBlockScheduleItem>> {
        return dailyScheduleDao.observeAllSchedules().map { rows ->
            rows.map { row ->
                DailyBlockScheduleItem(
                    id = row.id,
                    label = row.label,
                    startHour = row.startHour,
                    startMinute = row.startMinute,
                    endHour = row.endHour,
                    endMinute = row.endMinute,
                    daysMask = row.daysMask,
                    isEnabled = row.isEnabled,
                    isNuclearMode = row.isNuclearMode,
                    linkedMissionId = row.linkedMissionId,
                    linkedPackages = ScheduleEvaluator.decodePackagesCsv(row.linkedPackagesCsv)
                )
            }
        }
    }

    suspend fun getEnabledSchedulesOnce(): List<DailyBlockScheduleItem> {
        return dailyScheduleDao.getEnabledSchedulesOnce().map { row ->
            DailyBlockScheduleItem(
                id = row.id,
                label = row.label,
                startHour = row.startHour,
                startMinute = row.startMinute,
                endHour = row.endHour,
                endMinute = row.endMinute,
                daysMask = row.daysMask,
                isEnabled = row.isEnabled,
                isNuclearMode = row.isNuclearMode,
                linkedMissionId = row.linkedMissionId,
                linkedPackages = ScheduleEvaluator.decodePackagesCsv(row.linkedPackagesCsv)
            )
        }
    }

    suspend fun getMissionById(missionId: Long): StudyMissionItem? {
        val row = missionDao.getMissionByIdOnce(missionId) ?: return null
        return StudyMissionItem(
            id = row.id,
            title = row.title,
            subject = row.subject,
            targetMinutes = row.targetMinutes,
            completedMinutes = row.completedMinutes,
            isCompleted = row.isCompleted,
            isActive = row.isActive,
            linkedPackages = ScheduleEvaluator.decodePackagesCsv(row.linkedPackagesCsv)
        )
    }

    suspend fun createMission(
        title: String,
        subject: String,
        targetMinutes: Int,
        linkedPackages: List<String>
    ): Long {
        val safeTarget = targetMinutes.coerceIn(15, 480)
        return missionDao.insertMission(
            MissionEntity(
                title = title.trim(),
                subject = subject.trim(),
                targetMinutes = safeTarget,
                completedMinutes = 0,
                isCompleted = false,
                isActive = false,
                createdAtEpochMs = System.currentTimeMillis(),
                linkedPackagesCsv = ScheduleEvaluator.encodePackagesCsv(linkedPackages)
            )
        )
    }

    suspend fun updateMission(
        missionId: Long,
        title: String,
        subject: String,
        targetMinutes: Int,
        linkedPackages: List<String>
    ) {
        val safeTarget = targetMinutes.coerceIn(15, 480)
        missionDao.updateMissionDetails(
            missionId = missionId,
            title = title.trim(),
            subject = subject.trim(),
            targetMinutes = safeTarget,
            linkedPackagesCsv = ScheduleEvaluator.encodePackagesCsv(linkedPackages)
        )
    }

    suspend fun deleteMission(missionId: Long) {
        missionDao.deleteMissionById(missionId)
    }

    suspend fun setActiveMission(missionId: Long) {
        missionDao.setActiveMission(missionId)
    }

    /**
     * Records 1+ study minutes on both the active mission and DailyMetricEntity, returning true
     * if this increment just transitioned the mission to completed.
     */
    suspend fun recordStudyMinute(missionId: Long, deltaMinutes: Int = 1): Boolean {
        val before = missionDao.getMissionByIdOnce(missionId) ?: return false
        val wasCompleted = before.isCompleted || before.completedMinutes >= before.targetMinutes
        missionDao.addMissionMinutes(missionId, deltaMinutes)
        val after = missionDao.getMissionByIdOnce(missionId) ?: return false

        val todayKey = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        val existingMetric = dailyMetricDao.getMetricForDateOnce(todayKey)
        if (existingMetric == null) {
            dailyMetricDao.upsertMetric(
                DailyMetricEntity(
                    dateKey = todayKey,
                    focusMinutes = deltaMinutes,
                    screenTimeMinutes = deltaMinutes,
                    distractingMinutes = 0,
                    blockedAttempts = 0,
                    missionsCompleted = if (!wasCompleted && after.isCompleted) 1 else 0
                )
            )
        } else {
            dailyMetricDao.addFocusMinutes(todayKey, deltaMinutes)
            if (!wasCompleted && after.isCompleted) {
                dailyMetricDao.incrementMissionsCompleted(todayKey)
            }
        }

        return !wasCompleted && after.isCompleted
    }

    suspend fun upsertSchedule(
        id: Long = 0L,
        label: String,
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int,
        daysMask: Int,
        isNuclearMode: Boolean,
        linkedMissionId: Long?,
        linkedPackages: List<String>
    ): Long {
        return dailyScheduleDao.upsertSchedule(
            DailyScheduleEntity(
                id = id,
                label = label.trim(),
                startHour = startHour.coerceIn(0, 23),
                startMinute = startMinute.coerceIn(0, 59),
                endHour = endHour.coerceIn(0, 23),
                endMinute = endMinute.coerceIn(0, 59),
                daysMask = daysMask,
                isEnabled = true,
                isNuclearMode = isNuclearMode,
                linkedMissionId = linkedMissionId,
                linkedPackagesCsv = ScheduleEvaluator.encodePackagesCsv(linkedPackages),
                createdAtEpochMs = System.currentTimeMillis()
            )
        )
    }

    suspend fun setScheduleEnabled(scheduleId: Long, enabled: Boolean) {
        dailyScheduleDao.setScheduleEnabled(scheduleId, enabled)
    }

    suspend fun deleteSchedule(scheduleId: Long) {
        dailyScheduleDao.deleteScheduleById(scheduleId)
    }

    /**
     * Ensures mission/schedule linked packages are included in blocked_apps unless Nuclear Mode locks edits.
     */
    suspend fun mergeLinkedPackagesIntoBlocklist(
        linkedPackages: List<String>,
        isNuclearLockActive: Boolean
    ) {
        if (isNuclearLockActive) return
        val existing = blockedAppDao.observeBlockedApps().first().associateBy { it.packageName }
        val merged = ScheduleEvaluator.resolveEffectiveBlocklist(
            baseBlockedPackages = existing.keys,
            missionLinkedPackages = linkedPackages,
            isNuclearLockActive = false
        )
        val additions = merged.filter { it !in existing.keys && !AppSelectionFilter.isProtectedSafetyPackage(it) }
        if (additions.isNotEmpty()) {
            val now = System.currentTimeMillis()
            blockedAppDao.upsertAll(
                additions.map { pkg ->
                    val shortName = pkg.substringAfterLast('.').replaceFirstChar { it.uppercase() }
                    BlockedAppEntity(
                        packageName = pkg,
                        appName = shortName,
                        category = AppSelectionFilter.categorizePackage(pkg, shortName).name,
                        addedAtEpochMs = now
                    )
                }
            )
        }
    }
}
