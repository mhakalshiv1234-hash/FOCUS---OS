package com.focusos.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.focusos.app.FocusOsApplication
import com.focusos.app.MainActivity
import com.focusos.app.domain.BlockingDecision
import com.focusos.app.domain.BlockingEvaluator
import com.focusos.app.ui.blocking.BlockingShieldActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class FocusSessionForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var monitorJob: Job? = null
    private var lastFallbackBlockedPkg: String? = null
    private var lastFallbackBlockedAt: Long = 0L

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_SESSION) {
            val isConfirmedOverride = intent.getBooleanExtra(EXTRA_CONFIRMED_EMERGENCY_OVERRIDE, false)
            serviceScope.launch {
                val repo = (application as FocusOsApplication).container.focusSessionRepository
                val current = repo.getActiveSessionOnce()
                val now = System.currentTimeMillis()
                val isNuclearLocked = current != null &&
                    current.isActive &&
                    current.isNuclearMode &&
                    !current.isExpired(now)
                if (!isNuclearLocked || isConfirmedOverride) {
                    stopAndRestore(completedNaturally = false)
                }
            }
            return START_STICKY
        }

        val initialNotification = buildSessionNotification("Focus session active", "Starting...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                initialNotification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, initialNotification)
        }

        startMonitoringLoop()
        return START_STICKY
    }

    private fun startMonitoringLoop() {
        monitorJob?.cancel()
        val container = (application as FocusOsApplication).container
        val sessionRepo = container.focusSessionRepository
        val permissionChecker = container.permissionStatusChecker

        monitorJob = serviceScope.launch {
            while (isActive) {
                val session = sessionRepo.observeActiveSession().first()
                val now = System.currentTimeMillis()

                if (session == null || !session.isActive) {
                    stopSelf()
                    break
                }

                if (session.isExpired(now)) {
                    stopAndRestore(completedNaturally = true)
                    break
                }

                val blockedMap = sessionRepo.observeBlockedPackageMap().first()
                val remainingText = BlockingEvaluator.formatCountdownMillis(session.remainingMillis(now))
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val notifTitle = if (session.isNuclearMode) {
                    "NUCLEAR LOCK · $remainingText left"
                } else {
                    "${session.sessionLabel} · $remainingText left"
                }
                val notifSubtitle = if (session.isNuclearMode) {
                    "${blockedMap.size} apps sealed · Emergency calls exempt"
                } else {
                    "${blockedMap.size} distracting apps shielded"
                }
                manager.notify(
                    NOTIFICATION_ID,
                    buildSessionNotification(
                        title = notifTitle,
                        subtitle = notifSubtitle
                    )
                )

                // UsageStatsManager secondary guard in case an app transition bypassed Accessibility
                if (permissionChecker.hasUsageStatsPermission() && blockedMap.isNotEmpty()) {
                    val fgPkg = queryRecentForegroundPackage(now)
                    val decision = BlockingEvaluator.evaluate(
                        foregroundPackage = fgPkg,
                        selfPackageName = packageName,
                        session = session,
                        blockedPackages = blockedMap.keys,
                        nowEpochMs = now,
                        lastBlockedPackage = lastFallbackBlockedPkg,
                        lastBlockedAtEpochMs = lastFallbackBlockedAt
                    )
                    if (decision is BlockingDecision.Block) {
                        lastFallbackBlockedPkg = decision.packageName
                        lastFallbackBlockedAt = now
                        val appName = blockedMap[decision.packageName] ?: decision.packageName
                        sessionRepo.recordBlockedAttempt(decision.packageName, appName)
                        val shieldIntent = Intent(this@FocusSessionForegroundService, BlockingShieldActivity::class.java).apply {
                            addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK or
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                            )
                            putExtra(BlockingShieldActivity.EXTRA_BLOCKED_APP_NAME, appName)
                            putExtra(BlockingShieldActivity.EXTRA_BLOCKED_PACKAGE, decision.packageName)
                            putExtra(BlockingShieldActivity.EXTRA_ENDS_AT_EPOCH_MS, session.endsAtEpochMs)
                            putExtra(BlockingShieldActivity.EXTRA_SESSION_LABEL, decision.sessionLabel)
                            putExtra(BlockingShieldActivity.EXTRA_IS_NUCLEAR_MODE, decision.isNuclearMode)
                        }
                        startActivity(shieldIntent)
                    }
                }

                delay(1_000L)
            }
        }
    }

    private fun queryRecentForegroundPackage(nowEpochMs: Long): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
        val events = usm.queryEvents(nowEpochMs - 4_000L, nowEpochMs)
        val event = UsageEvents.Event()
        var latestPkg: String? = null
        var latestTime = 0L
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED && event.timeStamp >= latestTime) {
                latestTime = event.timeStamp
                latestPkg = event.packageName
            }
        }
        return latestPkg
    }

    private suspend fun stopAndRestore(completedNaturally: Boolean) {
        monitorJob?.cancel()
        (application as FocusOsApplication).container.focusSessionRepository
            .restoreSessionIfExpiredOrEnded(completedNaturally = completedNaturally)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "FOCUS//OS Active Sessions",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent countdown and app-blocking status during active focus sessions"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildSessionNotification(title: String, subtitle: String): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openAppIntent)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    companion object {
        private const val CHANNEL_ID = "focus_os_session_channel"
        private const val NOTIFICATION_ID = 301
        const val ACTION_START_SESSION = "com.focusos.app.action.START_SESSION"
        const val ACTION_STOP_SESSION = "com.focusos.app.action.STOP_SESSION"
        const val EXTRA_CONFIRMED_EMERGENCY_OVERRIDE = "extra_confirmed_emergency_override"

        fun start(context: Context) {
            val intent = Intent(context, FocusSessionForegroundService::class.java).apply {
                action = ACTION_START_SESSION
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context, confirmedEmergencyOverride: Boolean = false) {
            val intent = Intent(context, FocusSessionForegroundService::class.java).apply {
                action = ACTION_STOP_SESSION
                putExtra(EXTRA_CONFIRMED_EMERGENCY_OVERRIDE, confirmedEmergencyOverride)
            }
            context.startService(intent)
        }
    }
}
