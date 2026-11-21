package com.focusos.app.domain

data class ActiveFocusSession(
    val isActive: Boolean = false,
    val sessionLabel: String = "Deep Focus",
    val startedAtEpochMs: Long = 0L,
    val endsAtEpochMs: Long = 0L,
    val durationMinutes: Int = 25,
    val isNuclearMode: Boolean = false
) {
    fun remainingMillis(nowEpochMs: Long): Long {
        if (!isActive) return 0L
        return (endsAtEpochMs - nowEpochMs).coerceAtLeast(0L)
    }

    fun isExpired(nowEpochMs: Long): Boolean {
        return isActive && nowEpochMs >= endsAtEpochMs
    }
}

sealed class BlockingDecision {
    data class Allow(val reason: String) : BlockingDecision()
    data class Block(
        val packageName: String,
        val remainingMillis: Long,
        val sessionLabel: String,
        val isNuclearMode: Boolean = false
    ) : BlockingDecision()
}

data class BlockedAttemptLog(
    val id: Long,
    val packageName: String,
    val appName: String,
    val attemptedAtEpochMs: Long
)

data class EmergencyOverrideEvaluation(
    val allowed: Boolean,
    val reasonValid: Boolean,
    val phraseMatches: Boolean,
    val delayComplete: Boolean,
    val message: String
)

data class EmergencyOverrideLog(
    val id: Long,
    val sessionLabel: String,
    val reason: String,
    val remainingMillisAtAbort: Long,
    val overriddenAtEpochMs: Long
)
