package com.focusos.app.ui.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.focusos.app.data.repository.AppBlocklistRepository
import com.focusos.app.data.repository.UsageAnalyticsRepository
import com.focusos.app.domain.AnalyticsUiState
import com.focusos.app.domain.AppCategory
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AnalyticsViewModel(
    private val analyticsRepository: UsageAnalyticsRepository,
    private val blocklistRepository: AppBlocklistRepository
) : ViewModel() {

    val uiState: StateFlow<AnalyticsUiState> = analyticsRepository.observeAnalytics()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = AnalyticsUiState()
        )

    init {
        refreshUsageStats(1)
    }

    fun refreshUsageStats(rangeDays: Int = uiState.value.selectedRangeDays) {
        viewModelScope.launch {
            analyticsRepository.refreshLiveUsageStats(rangeDays)
        }
    }

    fun toggleBlockPackage(packageName: String, appName: String, category: AppCategory, block: Boolean) {
        viewModelScope.launch {
            blocklistRepository.setAppBlocked(packageName, appName, category, block)
        }
    }

    class Factory(
        private val analyticsRepository: UsageAnalyticsRepository,
        private val blocklistRepository: AppBlocklistRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AnalyticsViewModel(analyticsRepository, blocklistRepository) as T
        }
    }
}
