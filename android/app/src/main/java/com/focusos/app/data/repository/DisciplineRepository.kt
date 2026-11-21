package com.focusos.app.data.repository

import com.focusos.app.data.local.DailyMetricDao
import com.focusos.app.data.local.MissionDao
import com.focusos.app.data.preferences.UserPreferencesRepository
import com.focusos.app.domain.ActiveMissionSummary
import com.focusos.app.domain.DashboardUiState
import com.focusos.app.domain.DisciplineCalculator
import com.focusos.app.domain.DisciplineScoreInput
import com.focusos.app.domain.PermissionReadiness
import com.focusos.app.domain.WeeklyFocusDay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

class DisciplineRepository(
    private val dailyMetricDao: DailyMetricDao,
    private val missionDao: MissionDao,
    private val preferencesRepository: UserPreferencesRepository,
    private val permissionStatusChecker: PermissionStatusChecker
) {
    private val permissionState = MutableStateFlow(permissionStatusChecker.checkReadiness())

    fun refreshPermissions() {
        permissionState.value = permissionStatusChecker.checkReadiness()
    }

    fun observeDashboard(): Flow<DashboardUiState> {
        val today = LocalDate.now()
        val todayKey = today.format(DateTimeFormatter.ISO_LOCAL_DATE)
        val dateDisplay = today.format(DateTimeFormatter.ofPattern("EEE, MMM d", Locale.US))

        return combine(
            dailyMetricDao.observeMetricForDate(todayKey),
            dailyMetricDao.observeLastSevenDays(),
            missionDao.observeAllMissions(),
            preferencesRepository.dailyFocusTargetMinutes,
            permissionState
        ) { todayMetric, weekRows, missionRows, targetMinutes, readiness ->
            val focusMinutes = todayMetric?.focusMinutes ?: 0
            val screenMinutes = todayMetric?.screenTimeMinutes ?: 0
            val distractingMinutes = todayMetric?.distractingMinutes ?: 0
            val blockedAttempts = todayMetric?.blockedAttempts ?: 0

            val missions = missionRows.map { entity ->
                ActiveMissionSummary(
                    id = entity.id,
                    title = entity.title,
                    subject = entity.subject,
                    targetMinutes = entity.targetMinutes,
                    completedMinutes = entity.completedMinutes,
                    isCompleted = entity.isCompleted
                )
            }
            val activeMissionEntity = missionRows.firstOrNull { it.isActive } ?: missionRows.firstOrNull()
            val activeMission = activeMissionEntity?.let { entity ->
                missions.firstOrNull { it.id == entity.id }
            }

            val completedCount = missions.count { it.isCompleted }
            val totalCount = missions.size

            val breakdown = DisciplineCalculator.calculate(
                DisciplineScoreInput(
                    focusMinutesToday = focusMinutes,
                    focusTargetMinutes = targetMinutes,
                    distractingMinutesToday = distractingMinutes,
                    blockedAttemptsResisted = blockedAttempts,
                    completedMissionsToday = completedCount,
                    plannedMissionsToday = totalCount
                )
            )

            val weekly = weekRows
                .sortedBy { it.dateKey }
                .map { row ->
                    val parsed = runCatching { LocalDate.parse(row.dateKey) }.getOrNull()
                    val label = parsed?.dayOfWeek?.getDisplayName(TextStyle.SHORT, Locale.US) ?: row.dateKey
                    WeeklyFocusDay(
                        dateKey = row.dateKey,
                        dayLabel = label,
                        focusMinutes = row.focusMinutes,
                        distractingMinutes = row.distractingMinutes
                    )
                }

            DashboardUiState(
                isLoading = false,
                currentDateLabel = dateDisplay,
                dailyFocusTargetMinutes = targetMinutes,
                focusMinutesToday = focusMinutes,
                screenTimeMinutesToday = screenMinutes,
                distractingMinutesToday = distractingMinutes,
                blockedAttemptsToday = blockedAttempts,
                completedMissionsToday = completedCount,
                totalMissionsToday = totalCount,
                activeMission = activeMission,
                availableMissions = missions,
                weeklyHistory = weekly,
                disciplineBreakdown = breakdown,
                permissionReadiness = readiness
            )
        }
    }

    suspend fun updateDailyFocusTarget(minutes: Int) {
        preferencesRepository.setDailyFocusTargetMinutes(minutes)
    }

    suspend fun selectActiveMission(missionId: Long) {
        missionDao.setActiveMission(missionId)
    }

    fun getPermissionChecker(): PermissionStatusChecker = permissionStatusChecker
}
