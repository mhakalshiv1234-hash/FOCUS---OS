package com.focusos.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.focusos.app.data.repository.DisciplineRepository
import com.focusos.app.domain.DashboardUiState
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val repository: DisciplineRepository
) : ViewModel() {

    val uiState: StateFlow<DashboardUiState> = repository.observeDashboard()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = DashboardUiState()
        )

    fun refreshPermissions() {
        repository.refreshPermissions()
    }

    fun setDailyFocusTarget(minutes: Int) {
        viewModelScope.launch {
            repository.updateDailyFocusTarget(minutes)
        }
    }

    fun selectActiveMission(missionId: Long) {
        viewModelScope.launch {
            repository.selectActiveMission(missionId)
        }
    }

    class Factory(private val repository: DisciplineRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DashboardViewModel(repository) as T
        }
    }
}
