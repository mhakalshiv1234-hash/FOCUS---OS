package com.focusos.app.service

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.focusos.app.domain.DailyBlockScheduleItem
import com.focusos.app.domain.ScheduleEvaluator
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit

object ScheduleAlarmScheduler {

    private const val PERIODIC_WORK_NAME = "focus_os_schedule_watchdog"
    private const val REQUEST_CODE_TRIGGER_BASE = 4100

    fun ensureWatchdogScheduled(context: Context) {
        val request = PeriodicWorkRequestBuilder<ScheduleWatchdogWorker>(
            15,
            TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    fun rescheduleAlarms(context: Context, schedules: List<DailyBlockScheduleItem>) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val now = ZonedDateTime.now()

        schedules.forEach { schedule ->
            val requestCode = REQUEST_CODE_TRIGGER_BASE + (schedule.id.toInt() and 0x0FFF)
            val intent = Intent(context, ScheduleTriggerReceiver::class.java).apply {
                action = ScheduleTriggerReceiver.ACTION_SCHEDULE_WINDOW_START
                putExtra(ScheduleTriggerReceiver.EXTRA_SCHEDULE_ID, schedule.id)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (!schedule.isEnabled) {
                alarmManager.cancel(pendingIntent)
                return@forEach
            }

            val nextEpoch = ScheduleEvaluator.computeNextTriggerEpochMs(schedule, now) ?: return@forEach
            val canUseExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.canScheduleExactAlarms()
            } else {
                true
            }

            if (canUseExact) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextEpoch, pendingIntent)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextEpoch, pendingIntent)
            }
        }
    }
}
