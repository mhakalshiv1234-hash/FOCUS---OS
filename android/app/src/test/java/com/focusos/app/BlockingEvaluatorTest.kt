package com.focusos.app

import com.focusos.app.domain.ActiveFocusSession
import com.focusos.app.domain.BlockingDecision
import com.focusos.app.domain.BlockingEvaluator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BlockingEvaluatorTest {

    private val activeSession = ActiveFocusSession(
        isActive = true,
        sessionLabel = "Mathematics Block",
        startedAtEpochMs = 1_000L,
        endsAtEpochMs = 600_000L,
        durationMinutes = 10
    )

    @Test
    fun blocksRestrictedPackageDuringActiveSession() {
        val decision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.instagram.android",
            selfPackageName = "com.focusos.app",
            session = activeSession,
            blockedPackages = setOf("com.instagram.android"),
            nowEpochMs = 10_000L
        )
        assertTrue(decision is BlockingDecision.Block)
        assertEquals("com.instagram.android", (decision as BlockingDecision.Block).packageName)
    }

    @Test
    fun allowsProtectedSafetyPackagesAndSelfEvenIfUnexpectedlyListed() {
        val decision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.google.android.dialer",
            selfPackageName = "com.focusos.app",
            session = activeSession,
            blockedPackages = setOf("com.google.android.dialer"),
            nowEpochMs = 10_000L
        )
        assertTrue(decision is BlockingDecision.Allow)
    }

    @Test
    fun automaticallyAllowsWhenSessionExpires() {
        val decision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.instagram.android",
            selfPackageName = "com.focusos.app",
            session = activeSession,
            blockedPackages = setOf("com.instagram.android"),
            nowEpochMs = 600_000L
        )
        assertTrue(decision is BlockingDecision.Allow)
        assertEquals("session_expired", (decision as BlockingDecision.Allow).reason)
    }

    @Test
    fun debouncesDuplicateWindowEventsWithinThreshold() {
        val decision = BlockingEvaluator.evaluate(
            foregroundPackage = "com.instagram.android",
            selfPackageName = "com.focusos.app",
            session = activeSession,
            blockedPackages = setOf("com.instagram.android"),
            nowEpochMs = 10_500L,
            lastBlockedPackage = "com.instagram.android",
            lastBlockedAtEpochMs = 10_000L
        )
        assertTrue(decision is BlockingDecision.Allow)
        assertEquals("debounced_duplicate_event", (decision as BlockingDecision.Allow).reason)
    }
}
