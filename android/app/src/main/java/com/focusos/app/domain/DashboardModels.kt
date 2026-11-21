package com.focusos.app.domain

data class WeeklyFocusDay(
    val dateKey: String,
    val dayLabel: String,
    val focusMinutes: Int,
    val distractingMinutes: Int
)

data class ActiveMissionSummary(
    val id: Long,
    val title: String,
    val subject: String,
    val targetMinutes: Int,
    val completedMinutes: Int,
    val isCompleted: Boolean
) {
    val progressFraction: Float
        get() = if (targetMinutes <= 0) 0f else (completedMinutes.toFloat() / targetMinutes.toFloat()).coerceIn(0f, 1f)
}

data class PermissionReadiness(
    val usageAccessGranted: Boolean,
    val accessibilityServiceEnabled: Boolean
) {
    val isBlockingEngineReady: Boolean
        get() = usageAccessGranted && accessibilityServiceEnabled
}

data class BatteryUsageAdvisory(
    val headline: String,
    val detail: String,
    val isElevated: Boolean = false
)

data class DashboardUiState(
    val isLoading: Boolean = true,
    val currentDateLabel: String = "",
    val dailyFocusTargetMinutes: Int = 240,
    val focusMinutesToday: Int = 0,
    val screenTimeMinutesToday: Int = 0,
    val distractingMinutesToday: Int = 0,
    val blockedAttemptsToday: Int = 0,
    val completedMissionsToday: Int = 0,
    val totalMissionsToday: Int = 0,
    val activeMission: ActiveMissionSummary? = null,
    val availableMissions: List<ActiveMissionSummary> = emptyList(),
    val weeklyHistory: List<WeeklyFocusDay> = emptyList(),
    val disciplineBreakdown: DisciplineScoreBreakdown = DisciplineScoreBreakdown(
        totalScore = 0,
        focusComponent = 0,
        missionComponent = 0,
        resistanceBonus = 0,
        distractionPenalty = 0,
        statusLabel = "At Risk"
    ),
    val permissionReadiness: PermissionReadiness = PermissionReadiness(
        usageAccessGranted = false,
        accessibilityServiceEnabled = false
    ),
    val batteryAdvisory: BatteryUsageAdvisory? = null
)
