package com.focusos.app.domain

import kotlin.math.roundToInt

object UsageAnalyticsEvaluator {

    fun isDistractingCategory(category: AppCategory): Boolean {
        return category == AppCategory.SOCIAL ||
            category == AppCategory.VIDEO ||
            category == AppCategory.GAMES
    }

    fun summarizeUsage(
        rawApps: List<AppUsageStatItem>,
        blockedPackages: Set<String>,
        focusMinutesToday: Int
    ): UsageAnalyticsSummary {
        val normalized = rawApps
            .filter { it.minutesUsed > 0 || it.launchCount > 0 }
            .map { app ->
                val distracting = isDistractingCategory(app.category)
                app.copy(
                    isDistracting = distracting,
                    isBlocklisted = app.packageName in blockedPackages
                )
            }
            .sortedWith(compareByDescending<AppUsageStatItem> { it.minutesUsed }.thenBy { it.appName.lowercase() })

        val totalScreen = normalized.sumOf { it.minutesUsed }
        val distracting = normalized.filter { it.isDistracting }.sumOf { it.minutesUsed }
        val productive = normalized.filter { it.category == AppCategory.PRODUCTIVITY }.sumOf { it.minutesUsed }
        val other = (totalScreen - distracting - productive).coerceAtLeast(0)

        val distractionSharePct = if (totalScreen > 0) {
            ((distracting.toDouble() / totalScreen) * 100.0).roundToInt().coerceIn(0, 100)
        } else {
            0
        }

        val ratio = if (distracting > 0) {
            ((focusMinutesToday.toDouble() / distracting) * 10.0).roundToInt() / 10.0
        } else if (focusMinutesToday > 0) {
            focusMinutesToday.toDouble()
        } else {
            0.0
        }

        val categories = AppCategory.entries
            .map { cat ->
                val mins = normalized.filter { it.category == cat }.sumOf { it.minutesUsed }
                val share = if (totalScreen > 0) {
                    ((mins.toDouble() / totalScreen) * 100.0).roundToInt().coerceIn(0, 100)
                } else {
                    0
                }
                CategoryUsageBreakdown(category = cat, totalMinutes = mins, sharePct = share)
            }
            .filter { it.totalMinutes > 0 }
            .sortedByDescending { it.totalMinutes }

        return UsageAnalyticsSummary(
            totalScreenTimeMinutes = totalScreen,
            distractingMinutes = distracting,
            productiveMinutes = productive,
            otherMinutes = other,
            distractionSharePct = distractionSharePct,
            focusToDistractionRatio = ratio,
            topDistractingApp = normalized.firstOrNull { it.isDistracting },
            categoryBreakdown = categories,
            apps = normalized
        )
    }

    fun computeWeeklyTrends(
        history: List<WeeklyFocusDay>,
        dailyScreenTimes: List<Int>,
        focusTargetMinutes: Int,
        plannedMissionsCount: Int
    ): WeeklyTrendSummary {
        if (history.isEmpty()) {
            return WeeklyTrendSummary(0, 0, 0, 0, 0, "--", 0, 0)
        }

        val scores = history.map { day ->
            val breakdown = DisciplineCalculator.calculate(
                DisciplineScoreInput(
                    focusMinutesToday = day.focusMinutes,
                    focusTargetMinutes = focusTargetMinutes,
                    distractingMinutesToday = day.distractingMinutes,
                    blockedAttemptsResisted = 4,
                    completedMissionsToday = 2,
                    plannedMissionsToday = plannedMissionsCount.coerceAtLeast(1)
                )
            )
            day.dayLabel to breakdown.totalScore
        }

        var streak = 0
        for (i in scores.indices.reversed()) {
            if (scores[i].second >= 70 || history[i].focusMinutes >= (focusTargetMinutes * 0.75)) {
                streak += 1
            } else {
                break
            }
        }

        val best = scores.maxByOrNull { it.second } ?: ("--" to 0)
        val delta = if (scores.size >= 2) scores.last().second - scores.first().second else 0

        val avgFocus = (history.sumOf { it.focusMinutes }.toDouble() / history.size).roundToInt()
        val avgScreen = if (dailyScreenTimes.isNotEmpty()) {
            (dailyScreenTimes.sum().toDouble() / dailyScreenTimes.size).roundToInt()
        } else {
            0
        }
        val avgDist = (history.sumOf { it.distractingMinutes }.toDouble() / history.size).roundToInt()
        val avgScore = (scores.sumOf { it.second }.toDouble() / scores.size).roundToInt()

        return WeeklyTrendSummary(
            avgFocusMinutes = avgFocus,
            avgScreenTimeMinutes = avgScreen,
            avgDistractingMinutes = avgDist,
            avgDisciplineScore = avgScore,
            focusStreakDays = streak,
            bestDayLabel = best.first,
            bestDayScore = best.second,
            deltaFromStartPts = delta
        )
    }
}
