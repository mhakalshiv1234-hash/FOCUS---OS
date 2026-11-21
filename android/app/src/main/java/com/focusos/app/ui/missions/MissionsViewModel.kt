package com.focusos.app.ui.missions

import kotlinx.coroutines.flow.map
import com.focusos.app.domain.InstalledAppInfo
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.focusos.app.data.repository.AppBlocklistRepository
import com.focusos.app.data.repository.FocusSessionRepository
import com.focusos.app.data.repository.MissionScheduleRepository
import com.focusos.app.domain.DailyBlockScheduleItem
import com.focusos.app.domain.NuclearModePolicy
import com.focusos.app.domain.ScheduleEvaluation
import com.focusos.app.domain.ScheduleEvaluator
import com.focusos.app.domain.StudyMissionItem
import com.focusos.app.service.FocusSessionForegroundService
import com.focusos.app.service.MissionStudyService
import com.focusos.app.service.ScheduleAlarmScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.ZonedDateTime

data class MissionsUiState(
    val missions: List<StudyMissionItem> = emptyList(),
    val schedules: List<DailyBlockScheduleItem> = emptyList(),
    val installedApps: List<InstalledAppInfo> = emptyList(),
    val scheduleEvaluation: ScheduleEvaluation = ScheduleEvaluation(null, 0, 0L, null),
    val isNuclearLocked: Boolean = false,
    val statusNotice: String? = null
)

class MissionsViewModel(
    application: Application,
    private val missionScheduleRepository: MissionScheduleRepository,
    private val focusSessionRepository: FocusSessionRepository,
    appBlocklistRepository: AppBlocklistRepository
) : AndroidViewModel(application) {

    private val statusNotice = MutableStateFlow<String?>(null)

    val uiState: StateFlow<MissionsUiState> = combine(
        missionScheduleRepository.observeMissions(),
        missionScheduleRepository.observeSchedules(),
        appBlocklistRepository.observeAppsWithBlockState().map { it.swcond },
        focusSessionRepository.observeActiveSession(),
        statusNotice
    ) { missions, schedules, apps, session, notice ->
        val nowMs = System.currentTimeMillis()
        val locked = NuclearModePolicy.isNuclearLockActive(session, nowMs)
        val evaluation = ScheduleEvaluator.evaluateSchedules(schedules, ZonedDateTime.now())
        MissionsUiState(
            missions = missions,
            schedules = schedules,
            installedApps = apps,
            scheduleEvaluation = evaluation,
            isNuclearLocked = locked,
            statusNotice = notice
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = MissionsUiState()
    )

    fun saveMission(
        editingId: Long?,
        title: String,
        subject: String,
        targetMinutes: Int,
        linkedPackages: List<String>
    ) {
        if (title.isBlank() || subject.isBlank() || targetMinutes < 15) {
            statusNotice.value = "Provide a valid mission title, subject, and >= 15m duration."
            return
        }
        viewModelScope.launch {
            if (editingId == null) {
                missionScheduleRepository.createMission(title, subject, targetMinutes, linkedPackages)
                statusNotice.value = "Created study mission: ${title.trim()}"
            } else {
                missionScheduleRepository.updateMission(editingId, title, subject, targetMinutes, linkedPackages)
                statusNotice.value = "Updated study mission: ${title.trim()}"
            }
        }
    }

    fun deleteMission(missionId: Long) {
        viewModelScope.launch {
            missionScheduleRepository.deleteMission(missionId)
            statusNotice.value = "Mission removed"
        }
    }

    fun setActiveAndLaunchStudyBlock(mission: StudyMissionItem, focusMinutes: Int = 30) {
        viewModelScope.launch {
            val existing = focusSessionRepository.getActiveSessionOnce()
            val locked = NuclearModePolicy.isNuclearLockActive(existing, System.currentTimeMillis())
            if (locked) {
                statusNotice.value = "Nuclear lock active — study timer started without altering sealed blocklist."
            } else {
                missionScheduleRepository.mergeLinkedPackagesIntoBlocklist(
                    linkedPackages = mission.linkedPackages,
                    isNuclearLockActive = false
                )
                focusSessionRepository.startSession(
                    durationMinutes = focusMinutes,
                    sessionLabel = mission.subject,
                    isNuclearMode = false
                )
                FocusSessionForegroundService.start(getApplication())
            }
            missionScheduleRepository.setActiveMission(mission.id)
            MissionStudyService.start(getApplication(), mission.id)
        }
    }

    fun stopStudyService() {
        MissionStudyService.stop(getApplication())
    }

    fun saveSchedule(
        label: String,
        startHour: Int,
        startMinute: Int,
        endHour: Int,
        endMinute: Int,
        daysMask: Int,
        isNuclearMode: Boolean,
        linkedMissionId: Long?,
        linkedPackages: List<String>
    ) {
        if (label.isBlank() || daysMask == 0) {
            statusNotice.value = "Enter schedule label and select at least one day."
            return
        }
        viewModelScope.launch {
            missionScheduleRepository.upsertSchedule(
                label = label,
                startHour = startHour,
                startMinute = startMinute,
                endHour = endHour,
                endMinute = endMinute,
                daysMask = daysMask,
                isNuclearMode = isNuclearMode,
                linkedMissionId = linkedMissionId,
                linkedPackages = linkedPackages
            )
            val all = missionScheduleRepository.observeSchedules().first()
            ScheduleAlarmScheduler.rescheduleAlarms(getApplication(), all)
            ScheduleAlarmScheduler.ensureWatchdogScheduled(getApplication())
            statusNotice.value = "Scheduled recurring block: ${label.trim()}"
        }
    }

    fun toggleScheduleEnabled(scheduleId: Long, enabled: Boolean) {
        viewModelScope.launch {
            missionScheduleRepository.setScheduleEnabled(scheduleId, enabled)
            val all = missionScheduleRepository.observeSchedules().first()
            ScheduleAlarmScheduler.rescheduleAlarms(getApplication(), all)
        }
    }

    fun deleteSchedule(scheduleId: Long) {
        viewModelScope.launch {
            missionScheduleRepository.deleteSchedule(scheduleId)
            val all = missionScheduleRepository.observeSchedules().first()
            ScheduleAlarmScheduler.rescheduleAlarms(getApplication(), all)
        }
    }

    class Factory(
        private val application: Application,
        private val missionScheduleRepository: MissionScheduleRepository,
        private val focusSessionRepository: FocusSessionRepository,
        private val appBlocklistRepository: AppBlocklistRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return MissionsViewModel(
                application = application,
                missionScheduleRepository = missionScheduleRepository,
                focusSessionRepository = focusSessionRepository,
                appBlocklistRepository = appBlocklistRepository
            ) as T
        }
    }
}
