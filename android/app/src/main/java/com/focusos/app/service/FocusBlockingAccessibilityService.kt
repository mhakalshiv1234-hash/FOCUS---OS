package com.focusos.app.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import com.focusos.app.FocusOsApplication
import com.focusos.app.domain.ActiveFocusSession
import com.focusos.app.domain.BlockingDecision
import com.focusos.app.domain.BlockingEvaluator
import com.focusos.app.ui.blocking.BlockingShieldActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class FocusBlockingAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    @Volatile
    private var currentSession: ActiveFocusSession? = null

    @Volatile
    private var blockedAppNames: Map<String, String> = emptyMap()

    private var lastBlockedPackage: String? = null
    private var lastBlockedAtEpochMs: Long = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        val container = (application as FocusOsApplication).container
        val repo = container.focusSessionRepository

        serviceScope.launch {
            repo.observeActiveSession().collectLatest { session ->
                currentSession = session
            }
        }
        serviceScope.launch {
            repo.observeBlockedPackageMap().collectLatest { map ->
                blockedAppNames = map
            }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }
        val foregroundPkg = event.packageName?.toString() ?: return
        val now = System.currentTimeMillis()
        val session = currentSession

        // Automatically restore if session expired while running
        if (session != null && session.isExpired(now)) {
            serviceScope.launch(Dispatchers.IO) {
                (application as FocusOsApplication).container.focusSessionRepository
                    .restoreSessionIfExpiredOrEnded(completedNaturally = true)
            }
            return
        }

        val decision = BlockingEvaluator.evaluate(
            foregroundPackage = foregroundPkg,
            selfPackageName = packageName,
            session = session,
            blockedPackages = blockedAppNames.keys,
            nowEpochMs = now,
            lastBlockedPackage = lastBlockedPackage,
            lastBlockedAtEpochMs = lastBlockedAtEpochMs
        )

        if (decision is BlockingDecision.Block) {
            lastBlockedPackage = decision.packageName
            lastBlockedAtEpochMs = now

            val appName = blockedAppNames[decision.packageName] ?: decision.packageName
            serviceScope.launch(Dispatchers.IO) {
                (application as FocusOsApplication).container.focusSessionRepository
                    .recordBlockedAttempt(decision.packageName, appName)
            }

            // Pull user out of restricted app and present full-screen FOCUS//OS shield
            performGlobalAction(GLOBAL_ACTION_HOME)
            val shieldIntent = Intent(this, BlockingShieldActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
                putExtra(BlockingShieldActivity.EXTRA_BLOCKED_APP_NAME, appName)
                putExtra(BlockingShieldActivity.EXTRA_BLOCKED_PACKAGE, decision.packageName)
                putExtra(BlockingShieldActivity.EXTRA_ENDS_AT_EPOCH_MS, session?.endsAtEpochMs ?: 0L)
                putExtra(BlockingShieldActivity.EXTRA_SESSION_LABEL, decision.sessionLabel)
                putExtra(BlockingShieldActivity.EXTRA_IS_NUCLEAR_MODE, decision.isNuclearMode)
            }
            startActivity(shieldIntent)
        }
    }

    override fun onInterrupt() {
        // Required override; service remains bound until user disables in Settings
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
