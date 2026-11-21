package com.focusos.app.ui.shield

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.focusos.app.data.repository.AppBlocklistRepository
import com.focusos.app.data.repository.FocusSessionRepository
import com.focusos.app.data.repository.PermissionStatusChecker
import com.focusos.app.domain.ActiveFocusSession
import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.AppSelectionFilter
import com.focusos.app.domain.AppSelectionUiState
import com.focusos.app.domain.BlockFilterMode
import com.focusos.app.domain.BlockedAttemptLog
import com.focusos.app.domain.EmergencyOverrideLog
import com.focusos.app.domain.InstalledAppInfo
import com.focusos.app.domain.NuclearModePolicy
import com.focusos.app.domain.PermissionReadiness
import com.focusos.app.service.FocusSessionForegroundService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AppSelectionViewModel(
    private val application: Application,
    private val repository: AppBlocklistRepository,
    private val sessionRepository: FocusSessionRepository,
    private val permissionStatusChecker: PermissionStatusChecker
) : ViewModel() {

    private val searchQuery = MutableStateFlow("")
    private val selectedCategory = MutableStateFlow<AppCategory?>(null)
    private val filterMode = MutableStateFlow(BlockFilterMode.ALL)
    private val nuclearModeSelected = MutableStateFlow(false)
    private val errorMessage = MutableStateFlow<String?>(null)
    private val readinessState = MutableStateFlow(permissionStatusChecker.checkReadiness())

    private val tickerFlow = flow {
        while (true) {
            emit(System.currentTimeMillis())
            delay(1_000L)
        }
    }

    val uiState: StateFlow<AppSelectionUiState> = combine(
        repository.observeAppsWithBlockState(),
        searchQuery,
        selectedCategory,
        filterMode,
        nuclearModeSelected,
        sessionRepository.observeActiveSession(),
        sessionRepository.observeRecentBlockedAttempts(),
        sessionRepository.observeRecentOverrides(),
        readinessState,
        tickerFlow,
        errorMessage
    ) { values ->
        val (isLoaded, allApps) = values[0] as Pair<Boolean, List<InstalledAppInfo>>
        val query = values[1] as String
        val category = values[2] as AppCategory?
        val mode = values[3] as BlockFilterMode
        val nuclearSelected = values[4] as Boolean
        val session = values[5] as ActiveFocusSession?
        @Suppress("UNCHECKED_CAST")
        val attempts = values[6] as List<BlockedAttemptLog>
        @Suppress("UNCHECKED_CAST")
        val overrides = values[7] as List<EmergencyOverrideLog>
        val readiness = values[8] as PermissionReadiness
        val now = values[9] as Long
        val error = values[10] as String?

        val filtered = AppSelectionFilter.filterAndSort(
            apps = allApps,
            query = query,
            category = category,
            filterMode = mode
        )
        val liveSession = session?.takeIf { it.isActive && !it.isExpired(now) }
        val remaining = liveSession?.remainingMillis(now) ?: 0L
        val nuclearLocked = NuclearModePolicy.isNuclearLockActive(liveSession, now)

        AppSelectionUiState(
            isLoading = !isLoaded,
            apps = filtered,
            searchQuery = query,
            selectedCategory = category,
            filterMode = mode,
            totalInstalledCount = allApps.size,
            totalBlockedCount = allApps.count { it.isBlocked },
            activeSession = liveSession,
            nuclearModeSelected = nuclearSelected,
            isNuclearLocked = nuclearLocked,
            remainingMillis = remaining,
            accessibilityEnabled = readiness.accessibilityServiceEnabled,
            usageAccessGranted = readiness.usageAccessGranted,
            recentAttempts = attempts,
            recentOverrides = overrides,
            errorMessage = error
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = AppSelectionUiState()
    )

    init {
        refreshInstalledApps()
        refreshPermissions()
    }

    fun refreshInstalledApps() {
        viewModelScope.launch {
            runCatching {
                errorMessage.value = null
                repository.refreshInstalledApps()
            }.onFailure { throwable ->
                errorMessage.value = throwable.message ?: "Unable to enumerate installed apps."
            }
        }
    }

    fun refreshPermissions() {
        readinessState.value = permissionStatusChecker.checkReadiness()
    }

    fun onToggleNuclearModeSelected(enabled: Boolean) {
        nuclearModeSelected.value = enabled
    }

    fun startFocusSession(durationMinutes: Int, isNuclearMode: Boolean = nuclearModeSelected.value) {
        viewModelScope.launch {
            sessionRepository.startSession(
                durationMinutes = durationMinutes,
                isNuclearMode = isNuclearMode
            )
            FocusSessionForegroundService.start(application)
        }
    }

    fun stopAndRestoreSession() {
        viewModelScope.launch {
            val current = sessionRepository.getActiveSessionOnce()
            if (!NuclearModePolicy.canModifySessionSettings(current, System.currentTimeMillis())) {
                errorMessage.value = "Nuclear Mode active: use Emergency Override to unlock settings."
                return@launch
            }
            sessionRepository.restoreSessionIfExpiredOrEnded(completedNaturally = false)
            FocusSessionForegroundService.stop(application)
        }
    }

    fun confirmEmergencyOverride(reason: String, typedPhrase: String, remainingDelaySeconds: Int): Boolean {
        val evaluation = NuclearModePolicy.evaluateEmergencyOverride(
            reason = reason,
            typedPhrase = typedPhrase,
            remainingDelaySeconds = remainingDelaySeconds
        )
        if (!evaluation.allowed) {
            errorMessage.value = evaluation.message
            return false
        }
        viewModelScope.launch {
            sessionRepository.emergencyOverrideNuclearSession(reason = reason)
            FocusSessionForegroundService.stop(application, confirmedEmergencyOverride = true)
            errorMessage.value = null
        }
        return true
    }

    fun onSearchQueryChange(query: String) {
        searchQuery.value = query
    }

    fun onCategorySelected(category: AppCategory?) {
        selectedCategory.value = category
    }

    fun onFilterModeSelected(mode: BlockFilterMode) {
        filterMode.value = mode
    }

    fun onToggleAppBlocked(app: InstalledAppInfo, blocked: Boolean) {
        viewModelScope.launch {
            val current = sessionRepository.getActiveSessionOnce()
            if (!NuclearModePolicy.canModifySessionSettings(current, System.currentTimeMillis())) {
                return@launch
            }
            repository.setAppBlocked(app, blocked)
        }
    }

    fun onSelectDistractingPreset() {
        viewModelScope.launch {
            val current = sessionRepository.getActiveSessionOnce()
            if (!NuclearModePolicy.canModifySessionSettings(current, System.currentTimeMillis())) {
                return@launch
            }
            repository.blockDetectedDistractingApps()
        }
    }

    fun onClearBlocklist() {
        viewModelScope.launch {
            val current = sessionRepository.getActiveSessionOnce()
            if (!NuclearModePolicy.canModifySessionSettings(current, System.currentTimeMillis())) {
                return@launch
            }
            repository.clearBlocklist()
        }
    }

    suspend fun loadIconBitmap(packageName: String): Bitmap? {
        return repository.loadIconBitmap(packageName)
    }

    class Factory(
        private val application: Application,
        private val repository: AppBlocklistRepository,
        private val sessionRepository: FocusSessionRepository,
        private val permissionStatusChecker: PermissionStatusChecker
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AppSelectionViewModel(
                application = application,
                repository = repository,
                sessionRepository = sessionRepository,
                permissionStatusChecker = permissionStatusChecker
            ) as T
        }
    }
}
