package com.focusos.app.domain

data class AppUsageStatItem(
    val packageName: String,
    val appName: String,
    val category: AppCategory,
    val minutesUsed: Int,
    val launchCount: Int,
    val isDistracting: Boolean,
    val isBlocklisted: Boolean
)

data class CategoryUsageBreakdown(
    val category: AppCategory,
    val totalMinutes: Int,
    val sharePct: Int
)

data class WeeklyTrendSummary(
    val avgFocusMinutes: Int,
    val avgScreenTimeMinutes: Int,
    val avgDistractingMinutes: Int,
    val avgDisciplineScore: Int,
    val focusStreakDays: Int,
    val bestDayLabel: String,
    val bestDayScore: Int,
    val deltaFromStartPts: Int
)

data class UsageAnalyticsSummary(
    val totalScreenTimeMinutes: Int,
    val distractingMinutes: Int,
    val productiveMinutes: Int,
    val otherMinutes: Int,
    val distractionSharePct: Int,
    val focusToDistractionRatio: Double,
    val topDistractingApp: AppUsageStatItem?,
    val categoryBreakdown: List<CategoryUsageBreakdown>,
    val apps: List<AppUsageStatItem>
)

data class AnalyticsUiState(
    val isLoading: Boolean = true,
    val usageAccessGranted: Boolean = false,
    val selectedRangeDays: Int = 1,
    val summary: UsageAnalyticsSummary = UsageAnalyticsSummary(
        totalScreenTimeMinutes = 0,
        distractingMinutes = 0,
        productiveMinutes = 0,
        otherMinutes = 0,
        distractionSharePct = 0,
        focusToDistractionRatio = 0.0,
        topDistractingApp = null,
        categoryBreakdown = emptyList(),
        apps = emptyList()
    ),
    val weeklyTrend: WeeklyTrendSummary = WeeklyTrendSummary(
        avgFocusMinutes = 0,
        avgScreenTimeMinutes = 0,
        avgDistractingMinutes = 0,
        avgDisciplineScore = 0,
        focusStreakDays = 0,
        bestDayLabel = "--",
        bestDayScore = 0,
        deltaFromStartPts = 0
    ),
    val weeklyHistory: List<WeeklyFocusDay> = emptyList()
)
