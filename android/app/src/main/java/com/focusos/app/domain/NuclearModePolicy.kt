package com.focusos.app.domain

object NuclearModePolicy {

    const val EMERGENCY_OVERRIDE_PHRASE = "ABORT NUCLEAR LOCK"
    const val OVERRIDE_HOLD_SECONDS = 5
    const val MINIMUM_REASON_LENGTH = 12

    fun isNuclearLockActive(session: ActiveFocusSession?, nowEpochMs: Long): Boolean {
        return session != null &&
            session.isActive &&
            session.isNuclearMode &&
            !session.isExpired(nowEpochMs)
    }

    fun canModifySessionSettings(session: ActiveFocusSession?, nowEpochMs: Long): Boolean {
        return !isNuclearLockActive(session, nowEpochMs)
    }

    fun evaluateEmergencyOverride(
        reason: String,
        typedPhrase: String,
        remainingDelaySeconds: Int
    ): EmergencyOverrideEvaluation {
        val cleanReason = reason.trim()
        val cleanPhrase = typedPhrase.trim().uppercase()
        val reasonValid = cleanReason.length >= MINIMUM_REASON_LENGTH
        val phraseMatches = cleanPhrase == EMERGENCY_OVERRIDE_PHRASE
        val delayComplete = remainingDelaySeconds <= 0

        if (!delayComplete) {
            return EmergencyOverrideEvaluation(
                allowed = false,
                reasonValid = reasonValid,
                phraseMatches = phraseMatches,
                delayComplete = false,
                message = "Security hold active: wait ${remainingDelaySeconds}s before override unlocks."
            )
        }
        if (!reasonValid) {
            return EmergencyOverrideEvaluation(
                allowed = false,
                reasonValid = false,
                phraseMatches = phraseMatches,
                delayComplete = true,
                message = "Enter an emergency reason of at least $MINIMUM_REASON_LENGTH characters."
            )
        }
        if (!phraseMatches) {
            return EmergencyOverrideEvaluation(
                allowed = false,
                reasonValid = true,
                phraseMatches = false,
                delayComplete = true,
                message = "Type \"$EMERGENCY_OVERRIDE_PHRASE\" exactly to authorize override."
            )
        }
        return EmergencyOverrideEvaluation(
            allowed = true,
            reasonValid = true,
            phraseMatches = true,
            delayComplete = true,
            message = "Emergency override verified. Nuclear lock can now be lifted."
        )
    }
}
