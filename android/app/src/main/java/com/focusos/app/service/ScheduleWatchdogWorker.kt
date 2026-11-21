package com.focusos.app.service

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.focusos.app.FocusOsApplication
import com.focusos.app.domain.NuclearModePolicy
import com.focusos.app.domain.ScheduleEvaluator
import java.time.ZonedDateTime

/**
 * WorkManager safety net executing periodically to reconcile scheduled focus windows
 * in case OEM battery savers delayed an AlarmManager broadcast.
 */
class ScheduleWatchdogWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? FocusOsApplication ?: return Result.success()
        val missionRepo = app.container.missionScheduleRepository
        val sessionRepo = app.container.focusSessionRepository

        val schedules = missionRepo.getEnabledSchedulesOnce()
        val now = ZonedDateTime.now()
        val eval = ScheduleEvaluator.evaluateSchedules(schedules, now)

        val activeSchedule = eval.activeSchedule
        if (activeSchedule != null && eval.remainingMillis > 60_000L) {
            val currentSession = sessionRepo.getActiveSessionOnce()
            val nowMs = System.currentTimeMillis()
            val nuclearLocked = NuclearModePolicy.isNuclearLockActive(currentSession, nowMs)
            if (currentSession == null || !currentSession.isActive || currentSession.isExpired(nowMs)) {
                missionRepo.mergeLinkedPackagesIntoBlocklist(
                    linkedPackages = activeSchedule.linkedPackages,
                    isNuclearLockActive = nuclearLocked
                )
                val durationMinutes = ((eval.remainingMillis + 59_999L) / 60_000L).toInt().coerceIn(1, 480)
                sessionRepo.startSession(
                    durationMinutes = durationMinutes,
                    sessionLabel = activeSchedule.label,
                    isNuclearMode = activeSchedule.isNuclearMode
                )
                FocusSessionForegroundService.start(app)
            }
        }

        ScheduleAlarmScheduler.rescheduleAlarms(app, schedules)
        return Result.success()
    }
}
