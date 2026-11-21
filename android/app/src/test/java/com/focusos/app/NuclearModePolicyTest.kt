package com.focusos.app

import com.focusos.app.domain.ActiveFocusSession
import com.focusos.app.domain.BlockingDecision
import com.focusos.app.domain.BlockingEvaluator
import com.focusos.app.domain.NuclearModePolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NuclearModePolicyTest {

    private val nuclearSession = ActiveFocusSession(
        isActive = true,
        sessionLabel = "Nuclear Discipline Lock",
        startedAtEpochMs = 1_000L,
        endsAtEpochMs = 1_800_000L,
        durationMinutes = 30,
        isNuclearMode = true
    )

    @Test
    fun `nuclear mode locks settings until expiration and keeps dialer exempt`() {
        assertTrue(NuclearModePolicy.isNuclearLockActive(nuclearSession, 50_000L))
        assertFalse(NuclearModePolicy.canModifySessionSettings(nuclearSession, 50_000L))
        assertTrue(NuclearModePolicy.canModifySessionSettings(nuclearSession, 1_800_000L))

        val dialerDecision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.android.emergency",
            selfPackageName = "com.focusos.app",
            session = nuclearSession,
            blockedPackages = setOf("com.android.emergency", "com.instagram.android"),
            nowEpochMs = 50_000L
        )
        assertEquals(BlockingDecision.Allow("safety_protected"), dialerDecision)

        val blockedDecision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.instagram.android",
            selfPackageName = "com.focusos.app",
            session = nuclearSession,
            blockedPackages = setOf("com.instagram.android"),
            nowEpochMs = 50_000L
        )
        assertTrue(blockedDecision is BlockingDecision.Block)
        assertTrue((blockedDecision as BlockingDecision.Block).isNuclearMode)
    }

    @Test
    fun `emergency override requires security delay, valid reason, and exact phrase`() {
        val blockedByDelay = NuclearModePolicy.evaluateEmergencyOverride(
            reason = "Urgent family medical transport",
            typedPhrase = NuclearModePolicy.EMERGENCY_OVERRIDE_PHRASE,
            remainingDelaySeconds = 2
        )
        assertFalse(blockedByDelay.allowed)
        assertFalse(blockedByDelay.delayComplete)

        val blockedByShortReason = NuclearModePolicy.evaluateEmergencyOverride(
            reason = "short",
            typedPhrase = NuclearModePolicy.EMERGENCY_OVERRIDE_PHRASE,
            remainingDelaySeconds = 0
        )
        assertFalse(blockedByShortReason.allowed)
        assertFalse(blockedByShortReason.reasonValid)

        val blockedByPhrase = NuclearModePolicy.evaluateEmergencyOverride(
            reason = "Urgent family medical transport",
            typedPhrase = "stop now",
            remainingDelaySeconds = 0
        )
        assertFalse(blockedByPhrase.allowed)
        assertFalse(blockedByPhrase.phraseMatches)

        val authorized = NuclearModePolicy.evaluateEmergencyOverride(
            reason = "Urgent family medical transport",
            typedPhrase = " abort nuclear lock ",
            remainingDelaySeconds = 0
        )
        assertTrue(authorized.allowed)
    }
}
