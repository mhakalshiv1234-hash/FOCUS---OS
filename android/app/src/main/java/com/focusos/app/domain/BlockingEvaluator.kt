package com.focusos.app.domain

object BlockingEvaluator {

    private const val DEBOUNCE_WINDOW_MS = 1_200L

    private val systemUiAllowlist = setOf(
        "android",
        "com.android.systemui",
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",
        "com.android.launcher",
        "com.android.launcher3",
        "com.google.android.apps.nexuslauncher",
        "com.sec.android.app.launcher"
    )

    fun evaluate(
        foregroundPackage: String?,
        selfPackageName: String,
        session: ActiveFocusSession?,
        blockedPackages: Set<String>,
        nowEpochMs: Long,
        lastBlockedPackage: String? = null,
        lastBlockedAtEpochMs: Long = 0L
    ): BlockingDecision {
        if (foregroundPackage.isNullOrBlank()) {
            return BlockingDecision.Allow("empty_package")
        }

        if (session == null || !session.isActive) {
            return BlockingDecision.Allow("no_active_session")
        }

        if (session.isExpired(nowEpochMs)) {
            return BlockingDecision.Allow("session_expired")
        }

        if (foregroundPackage == selfPackageName || systemUiAllowlist.contains(foregroundPackage)) {
            return BlockingDecision.Allow("system_or_self")
        }

        if (AppSelectionFilter.isProtectedSafetyPackage(foregroundPackage, selfPackageName)) {
            return BlockingDecision.Allow("safety_protected")
        }

        if (!blockedPackages.contains(foregroundPackage)) {
            return BlockingDecision.Allow("not_in_blocklist")
        }

        val isWithinDebounce = foregroundPackage == lastBlockedPackage &&
            (nowEpochMs - lastBlockedAtEpochMs) in 0 until DEBOUNCE_WINDOW_MS
        if (isWithinDebounce) {
            return BlockingDecision.Allow("debounced_duplicate_event")
        }

        return BlockingDecision.Block(
            packageName = foregroundPackage,
            remainingMillis = session.remainingMillis(nowEpochMs),
            sessionLabel = session.sessionLabel,
            isNuclearMode = session.isNuclearMode
        )
    }

    fun formatCountdownMillis(millis: Long): String {
        val totalSeconds = (millis.coerceAtLeast(0L) / 1000L)
        val hours = totalSeconds / 3600L
        val minutes = (totalSeconds % 3600L) / 60L
        val seconds = totalSeconds % 60L
        return if (hours > 0) {
            "${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
        } else {
            "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
        }
    }
}
