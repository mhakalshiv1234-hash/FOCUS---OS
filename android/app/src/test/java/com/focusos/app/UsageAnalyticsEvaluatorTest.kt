package com.focusos.app

import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.AppUsageStatItem
import com.focusos.app.domain.UsageAnalyticsEvaluator
import com.focusos.app.domain.WeeklyFocusDay
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UsageAnalyticsEvaluatorTest {

    @Test
    fun summarizeUsageAggregatesDistractingProductiveAndBlocklistStatus() {
        val apps = listOf(
            AppUsageStatItem("com.google.android.youtube", "YouTube", AppCategory.VIDEO, 45, 9, false, false),
            AppUsageStatItem("com.instagram.android", "Instagram", AppCategory.SOCIAL, 25, 14, false, false),
            AppUsageStatItem("md.obsidian", "Obsidian", AppCategory.PRODUCTIVITY, 50, 4, false, false),
            AppUsageStatItem("com.android.chrome", "Chrome", AppCategory.BROWSER, 20, 6, false, false)
        )

        val summary = UsageAnalyticsEvaluator.summarizeUsage(
            rawApps = apps,
            blockedPackages = setOf("com.instagram.android"),
            focusMinutesToday = 140
        )

        assertEquals(140, summary.totalScreenTimeMinutes)
        assertEquals(70, summary.distractingMinutes)
        assertEquals(50, summary.productiveMinutes)
        assertEquals(20, summary.otherMinutes)
        assertEquals(50, summary.distractionSharePct)
        assertEquals(2.0, summary.focusToDistractionRatio, 0.01)
        assertEquals("com.google.android.youtube", summary.topDistractingApp?.packageName)
        assertTrue(summary.apps.first { it.packageName == "com.instagram.android" }.isBlocklisted)
    }

    @Test
    fun computeWeeklyTrendsCalculatesStreakBestDayAndScoreDelta() {
        val history = listOf(
            WeeklyFocusDay("D-6", "Sat", focusMinutes = 120, distractingMinutes = 60),
            WeeklyFocusDay("D-5", "Sun", focusMinutes = 180, distractingMinutes = 20),
            WeeklyFocusDay("D-4", "Mon", focusMinutes = 210, distractingMinutes = 15),
            WeeklyFocusDay("D-3", "Tue", focusMinutes = 240, distractingMinutes = 10)
        )

        val trend = UsageAnalyticsEvaluator.computeWeeklyTrends(
            history = history,
            dailyScreenTimes = listOf(220, 190, 180, 160),
            focusTargetMinutes = 240,
            plannedMissionsCount = 4
        )

        assertEquals(3, trend.focusStreakDays)
        assertEquals("Tue", trend.bestDayLabel)
        assertTrue(trend.deltaFromStartPts > 0)
        assertEquals(188, trend.avgFocusMinutes)
        assertEquals(188, trend.avgScreenTimeMinutes)
    }
}
