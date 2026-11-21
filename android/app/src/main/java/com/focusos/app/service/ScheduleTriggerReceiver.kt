package com.focusos.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.focusos.app.FocusOsApplication
import com.focusos.app.domain.NuclearModePolicy
import com.focusos.app.domain.ScheduleEvaluator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.ZonedDateTime

class ScheduleTriggerReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != ACTION_SCHEDULE_WINDOW_START) return
        val pendingResult = goAsync()
        val app = context.applicationContext as? FocusOsApplication ?: run {
            pendingResult.finish()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val missionScheduleRepo = app.container.missionScheduleRepository
                val sessionRepo = app.container.focusSessionRepository
                val schedules = missionScheduleRepo.getEnabledSchedulesOnce()
                val now = ZonedDateTime.now()
                val evaluation = ScheduleEvaluator.evaluateSchedules(schedules, now)
                val activeSchedule = evaluation.activeSchedule

                if (activeSchedule != null && evaluation.remainingMillis > 60_000L) {
                    val existing = sessionRepo.getActiveSessionOnce()
                    val nowMs = System.currentTimeMillis()
                    val locked = NuclearModePolicy.isNuclearLockActive(existing, nowMs)
                    if (existing == null || !existing.isActive || existing.isExpired(nowMs)) {
                        missionScheduleRepo.mergeLinkedPackagesIntoBlocklist(
                            linkedPackages = activeSchedule.linkedPackages,
                            isNuclearLockActive = locked
                        )
                        val durationMins = ((evaluation.remainingMillis + 59_999L) / 60_000L).toInt().coerceIn(1, 480)
                        sessionRepo.startSession(
                            durationMinutes = durationMins,
                            sessionLabel = activeSchedule.label,
                            isNuclearMode = activeSchedule.isNuclearMode
                        )
                        FocusSessionForegroundService.start(app)
                        activeSchedule.linkedMissionId?.let { missionId ->
                            missionScheduleRepo.setActiveMission(missionId)
                            MissionStudyService.start(app, missionId)
                        }
                    }
                }
                ScheduleAlarmScheduler.rescheduleAlarms(app, schedules)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_SCHEDULE_WINDOW_START = "com.focusos.app.action.SCHEDULE_WINDOW_START"
        const val EXTRA_SCHEDULE_ID = "extra_schedule_id"
    }
}
