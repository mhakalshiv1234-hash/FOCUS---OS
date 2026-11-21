package com.focusos.app.data.repository

import com.focusos.app.data.local.BlockedAppDao
import com.focusos.app.data.local.DailyMetricDao
import com.focusos.app.data.local.DailyMetricEntity
import com.focusos.app.data.local.MissionDao
import com.focusos.app.data.preferences.UserPreferencesRepository
import com.focusos.app.data.usage.UsageStatsDataSource
import com.focusos.app.domain.AnalyticsUiState
import com.focusos.app.domain.AppUsageStatItem
import com.focusos.app.domain.UsageAnalyticsEvaluator
import com.focusos.app.domain.WeeklyFocusDay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

class UsageAnalyticsRepository(
    private val usageStatsDataSource: UsageStatsDataSource,
    private val dailyMetricDao: DailyMetricDao,
    private val blockedAppDao: BlockedAppDao,
    private val missionDao: MissionDao,
    private val preferencesRepository: UserPreferencesRepository,
    private val permissionStatusChecker: PermissionStatusChecker
) {
    private val usageAccessState = MutableStateFlow(permissionStatusChecker.hasUsageStatsPermission())
    private val selectedRangeDays = MutableStateFlow(1)
    private val liveAppUsage = MutableStateFlow<List<AppUsageStatItem>>(emptyList())

    suspend fun refreshLiveUsageStats(rangeDays: Int = selectedRangeDays.value) {
        selectedRangeDays.value = rangeDays
        val granted = permissionStatusChecker.hasUsageStatsPermission()
        usageAccessState.value = granted

        if (!granted) {
            liveAppUsage.value = emptyList()
            return
        }

        val queried = withContext(Dispatchers.IO) {
            usageStatsDataSource.queryAppUsageSinceMidnight(daysBack = (rangeDays - 1).coerceAtLeast(0))
        }
        liveAppUsage.value = queried

        // Replace Stage 1 baseline seed metrics for today with real UsageStats totals
        if (rangeDays == 1) {
            val todayUsage = UsageAnalyticsEvaluator.summarizeUsage(
                rawApps = queried,
                blockedPackages = emptySet(),
                focusMinutesToday = 0
            )
            val todayKey = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
            val existing = dailyMetricDao.getMetricForDateOnce(todayKey)
            if (existing == null) {
                dailyMetricDao.upsertMetric(
                    DailyMetricEntity(
                        dateKey = todayKey,
                        focusMinutes = 0,
                        screenTimeMinutes = todayUsage.totalScreenTimeMinutes,
                        distractingMinutes = todayUsage.distractingMinutes,
                        blockedAttempts = 0,
                        missionsCompleted = 0
                    )
                )
            } else {
                dailyMetricDao.updateUsageMetrics(
                    dateKey = todayKey,
                    screenTimeMinutes = todayUsage.totalScreenTimeMinutes,
                    distractingMinutes = todayUsage.distractingMinutes
                )
            }
        }
    }

    fun observeAnalytics(): Flow<AnalyticsUiState> {
        val todayKey = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        return combine(
            usageAccessState,
            selectedRangeDays,
            liveAppUsage,
            blockedAppDao.observeBlockedApps(),
            dailyMetricDao.observeLastSevenDays(),
            missionDao.observeAllMissions(),
            preferencesRepository.dailyFocusTargetMinutes
        ) { values ->
            val granted = values[0] as Boolean
            val rangeDays = values[1] as Int
            @Suppress("UNCHECKED_CAST")
            val apps = values[2] as List<AppUsageStatItem>
            @Suppress("UNCHECKED_CAST")
            val blockedRows = values[3] as List<com.focusos.app.data.local.BlockedAppEntity>
            @Suppress("UNCHECKED_CAST")
            val weekRows = values[4] as List<DailyMetricEntity>
            @Suppress("UNCHECKED_CAST")
            val missions = values[5] as List<com.focusos.app.data.local.MissionEntity>
            val targetMinutes = values[6] as Int

            val blockedSet = blockedRows.map { it.packageName }.toSet()
            val todayFocus = weekRows.firstOrNull { it.dateKey == todayKey }?.focusMinutes ?: 0

            val summary = if (granted) {
                UsageAnalyticsEvaluator.summarizeUsage(
                    rawApps = apps,
                    blockedPackages = blockedSet,
                    focusMinutesToday = todayFocus
                )
            } else {
                UsageAnalyticsEvaluator.summarizeUsage(
                    rawApps = emptyList(),
                    blockedPackages = blockedSet,
                    focusMinutesToday = todayFocus
                )
            }

            val sortedWeek = weekRows.sortedBy { it.dateKey }
            val weeklyHistory = sortedWeek.map { row ->
                val parsed = runCatching { LocalDate.parse(row.dateKey) }.getOrNull()
                val label = parsed?.dayOfWeek?.getDisplayName(TextStyle.SHORT, Locale.US) ?: row.dateKey
                WeeklyFocusDay(
                    dateKey = row.dateKey,
                    dayLabel = label,
                    focusMinutes = row.focusMinutes,
                    distractingMinutes = row.distractingMinutes
                )
            }
            val trend = UsageAnalyticsEvaluator.computeWeeklyTrends(
                history = weeklyHistory,
                dailyScreenTimes = sortedWeek.map { it.screenTimeMinutes },
                focusTargetMinutes = targetMinutes,
                plannedMissionsCount = missions.size
            )

            AnalyticsUiState(
                isLoading = false,
                usageAccessGranted = granted,
                selectedRangeDays = rangeDays,
                summary = summary,
                weeklyTrend = trend,
                weeklyHistory = weeklyHistory
            )
        }
    }
}
