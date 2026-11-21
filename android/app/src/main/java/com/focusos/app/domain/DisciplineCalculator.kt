package com.focusos.app.domain

import kotlin.math.roundToInt

data class DisciplineScoreInput(
    val focusMinutesToday: Int,
    val focusTargetMinutes: Int,
    val distractingMinutesToday: Int,
    val blockedAttemptsResisted: Int,
    val completedMissionsToday: Int,
    val plannedMissionsToday: Int
)

data class DisciplineScoreBreakdown(
    val totalScore: Int,
    val focusComponent: Int,
    val missionComponent: Int,
    val resistanceBonus: Int,
    val distractionPenalty: Int,
    val statusLabel: String
)

object DisciplineCalculator {

    /**
     * Computes a deterministic 0..100 Discipline Score:
     * - Up to 55 pts from reaching the daily focus target.
     * - Up to 30 pts from completing planned missions.
     * - Up to 15 pts bonus for resisting blocked-app temptations (3 pts each, capped at 15).
     * - Penalty of 0.5 pt per distracting minute beyond a 15-minute grace allowance (capped at -40).
     */
    fun calculate(input: DisciplineScoreInput): DisciplineScoreBreakdown {
        val safeTarget = input.focusTargetMinutes.coerceAtLeast(30)
        val focusRatio = (input.focusMinutesToday.toDouble() / safeTarget.toDouble()).coerceIn(0.0, 1.0)
        val focusComponent = (focusRatio * 55.0).roundToInt()

        val missionRatio = if (input.plannedMissionsToday <= 0) {
            if (input.completedMissionsToday > 0) 1.0 else 0.0
        } else {
            (input.completedMissionsToday.toDouble() / input.plannedMissionsToday.toDouble()).coerceIn(0.0, 1.0)
        }
        val missionComponent = (missionRatio * 30.0).roundToInt()

        val resistanceBonus = (input.blockedAttemptsResisted.coerceAtLeast(0) * 3).coerceAtMost(15)

        val excessDistraction = (input.distractingMinutesToday - 15).coerceAtLeast(0)
        val distractionPenalty = (excessDistraction * 0.5).roundToInt().coerceAtMost(40)

        val raw = focusComponent + missionComponent + resistanceBonus - distractionPenalty
        val clamped = raw.coerceIn(0, 100)

        val statusLabel = when {
            clamped >= 85 -> "Disciplined"
            clamped >= 65 -> "Steady"
            clamped >= 40 -> "At Risk"
            else -> "Compromised"
        }

        return DisciplineScoreBreakdown(
            totalScore = clamped,
            focusComponent = focusComponent,
            missionComponent = missionComponent,
            resistanceBonus = resistanceBonus,
            distractionPenalty = distractionPenalty,
            statusLabel = statusLabel
        )
    }

    fun formatMinutesCompact(totalMinutes: Int): String {
        val safe = totalMinutes.coerceAtLeast(0)
        val hours = safe / 60
        val minutes = safe % 60
        return if (hours > 0) {
            "${hours}h ${minutes.toString().padStart(2, '0')}m"
        } else {
            "${minutes}m"
        }
    }
}
