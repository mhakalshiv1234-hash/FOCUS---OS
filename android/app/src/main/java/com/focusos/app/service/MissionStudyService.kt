package com.focusos.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.focusos.app.FocusOsApplication
import com.focusos.app.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Foreground countdown service dedicated to tracking active study mission progress
 * and playing MissionAlertPlayer audio feedback upon reaching mission target minutes.
 */
class MissionStudyService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var studyJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_STUDY) {
            studyJob?.cancel()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        val missionId = intent?.getLongExtra(EXTRA_MISSION_ID, -1L) ?: -1L
        val notification = buildNotification("Study Mission Active", "Initializing timer...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        startCountdown(missionId)
        return START_STICKY
    }

    private fun startCountdown(missionId: Long) {
        studyJob?.cancel()
        val repo = (application as FocusOsApplication).container.missionScheduleRepository
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        studyJob = serviceScope.launch {
            if (missionId <= 0L) {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return@launch
            }

            var secondsInCurrentMinute = 0
            while (isActive) {
                val mission = repo.getMissionById(missionId)
                if (mission == null || mission.isCompleted) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    break
                }

                val remainingTotalSeconds = ((mission.targetMinutes - mission.completedMinutes) * 60 - secondsInCurrentMinute)
                    .coerceAtLeast(0)
                val minsLeft = remainingTotalSeconds / 60
                val secsLeft = remainingTotalSeconds % 60
                val countdownLabel = String.format("%02d:%02d left", minsLeft, secsLeft)

                manager.notify(
                    NOTIFICATION_ID,
                    buildNotification(
                        title = "${mission.subject} · $countdownLabel",
                        subtitle = "${mission.completedMinutes}/${mission.targetMinutes} min · ${mission.title}"
                    )
                )

                delay(1_000L)
                secondsInCurrentMinute += 1
                if (secondsInCurrentMinute >= 60) {
                    secondsInCurrentMinute = 0
                    val newlyCompleted = repo.recordStudyMinute(missionId, deltaMinutes = 1)
                    if (newlyCompleted) {
                        MissionAlertPlayer.playTargetReachedChime(serviceScope)
                        stopForeground(STOP_FOREGROUND_REMOVE)
                        stopSelf()
                        break
                    }
                }
            }
        }
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Study Mission Countdowns",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Displays live remaining study countdown for the active mission"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, subtitle: String): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            1,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openIntent)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    companion object {
        private const val CHANNEL_ID = "focus_os_mission_timer_channel"
        private const val NOTIFICATION_ID = 302
        const val ACTION_START_STUDY = "com.focusos.app.action.START_MISSION_STUDY"
        const val ACTION_STOP_STUDY = "com.focusos.app.action.STOP_MISSION_STUDY"
        const val EXTRA_MISSION_ID = "extra_mission_id"

        fun start(context: Context, missionId: Long) {
            val intent = Intent(context, MissionStudyService::class.java).apply {
                action = ACTION_START_STUDY
                putExtra(EXTRA_MISSION_ID, missionId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, MissionStudyService::class.java).apply {
                action = ACTION_STOP_STUDY
            }
            context.startService(intent)
        }
    }
}
