package com.focusos.app

import com.focusos.app.domain.DisciplineCalculator
import com.focusos.app.domain.DisciplineScoreInput
import org.junit.Assert.assertEquals
import org.junit.Test

class DisciplineCalculatorTest {

    @Test
    fun calculatesPerfectScoreWhenTargetsAndMissionsMetWithoutExcessDistraction() {
        val result = DisciplineCalculator.calculate(
            DisciplineScoreInput(
                focusMinutesToday = 240,
                focusTargetMinutes = 240,
                distractingMinutesToday = 10,
                blockedAttemptsResisted = 5,
                completedMissionsToday = 4,
                plannedMissionsToday = 4
            )
        )
        assertEquals(100, result.totalScore)
        assertEquals("Disciplined", result.statusLabel)
    }

    @Test
    fun appliesDistractionPenaltyBeyondFifteenMinuteGraceWindow() {
        val result = DisciplineCalculator.calculate(
            DisciplineScoreInput(
                focusMinutesToday = 120,
                focusTargetMinutes = 240,
                distractingMinutesToday = 55,
                blockedAttemptsResisted = 0,
                completedMissionsToday = 1,
                plannedMissionsToday = 2
            )
        )
        // Focus: 28, Mission: 15, Resisted: 0, Penalty: (55-15)*0.5 = 20 -> 23
        assertEquals(20, result.distractionPenalty)
        assertEquals(23, result.totalScore)
        assertEquals("Compromised", result.statusLabel)
    }

    @Test
    fun clampsScoreToZeroWhenPenaltiesExceedEarnings() {
        val result = DisciplineCalculator.calculate(
            DisciplineScoreInput(
                focusMinutesToday = 0,
                focusTargetMinutes = 240,
                distractingMinutesToday = 200,
                blockedAttemptsResisted = 0,
                completedMissionsToday = 0,
                plannedMissionsToday = 3
            )
        )
        assertEquals(0, result.totalScore)
    }
}
