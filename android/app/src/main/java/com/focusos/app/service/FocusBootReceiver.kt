package com.focusos.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.focusos.app.FocusOsApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Restores persistent Focus / Nuclear Mode sessions after a device reboot or package update.
 * Honest OS scope: standard Android allows BOOT_COMPLETED recovery, though Safe Mode boots
 * disable third-party AccessibilityServices and foreground enforcement until normal boot.
 */
class FocusBootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) {
            return
        }

        val pendingResult = goAsync()
        val app = context.applicationContext as? FocusOsApplication ?: run {
            pendingResult.finish()
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val repo = app.container.focusSessionRepository
                val session = repo.getActiveSessionOnce()
                val now = System.currentTimeMillis()
                if (session != null && session.isActive) {
                    if (session.isExpired(now)) {
                        repo.restoreSessionIfExpiredOrEnded(completedNaturally = true)
                    } else {
                        FocusSessionForegroundService.start(app)
                    }
                }
                val schedules = app.container.missionScheduleRepository.getEnabledSchedulesOnce()
                ScheduleAlarmScheduler.ensureWatchdogScheduled(app)
                ScheduleAlarmScheduler.rescheduleAlarms(app, schedules)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
