package com.focusos.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.focusos.app.ui.analytics.AnalyticsScreen
import com.focusos.app.ui.analytics.AnalyticsViewModel
import com.focusos.app.ui.dashboard.DashboardScreen
import com.focusos.app.ui.dashboard.DashboardViewModel
import com.focusos.app.ui.missions.MissionsScreen
import com.focusos.app.ui.missions.MissionsViewModel
import com.focusos.app.ui.navigation.FocusDestination
import com.focusos.app.ui.shield.AppSelectionScreen
import com.focusos.app.ui.shield.AppSelectionViewModel
import com.focusos.app.ui.theme.FocusColors
import com.focusos.app.ui.theme.FocusOsTheme

class MainActivity : ComponentActivity() {

    private lateinit var dashboardViewModel: DashboardViewModel
    private lateinit var shieldViewModel: AppSelectionViewModel
    private lateinit var analyticsViewModel: AnalyticsViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val appContainer = (application as FocusOsApplication).container

        setContent {
            FocusOsTheme {
                val vm: DashboardViewModel = viewModel(
                    factory = DashboardViewModel.Factory(appContainer.disciplineRepository)
                )
                val shieldVm: AppSelectionViewModel = viewModel(
                    factory = AppSelectionViewModel.Factory(
                        application = application,
                        repository = appContainer.appBlocklistRepository,
                        sessionRepository = appContainer.focusSessionRepository,
                        permissionStatusChecker = appContainer.permissionStatusChecker
                    )
                )
                val missionsVm: MissionsViewModel = viewModel(
                    factory = MissionsViewModel.Factory(
                        application = application,
                        missionScheduleRepository = appContainer.missionScheduleRepository,
                        focusSessionRepository = appContainer.focusSessionRepository,
                        appBlocklistRepository = appContainer.appBlocklistRepository
                    )
                )
                val analyticsVm: AnalyticsViewModel = viewModel(
                    factory = AnalyticsViewModel.Factory(
                        analyticsRepository = appContainer.usageAnalyticsRepository,
                        blocklistRepository = appContainer.appBlocklistRepository
                    )
                )
                dashboardViewModel = vm
                shieldViewModel = shieldVm
                analyticsViewModel = analyticsVm
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                val shieldUiState by shieldVm.uiState.collectAsStateWithLifecycle()
                val missionsUiState by missionsVm.uiState.collectAsStateWithLifecycle()
                val analyticsUiState by analyticsVm.uiState.collectAsStateWithLifecycle()

                val navController = rememberNavController()
                val backStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = backStackEntry?.destination?.route

                Scaffold(
                    containerColor = FocusColors.PureBlack,
                    bottomBar = {
                        NavigationBar(containerColor = FocusColors.CharcoalSurface) {
                            FocusDestination.entries.forEach { dest ->
                                val selected = currentRoute == dest.route
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = {
                                        navController.navigate(dest.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    icon = { Icon(dest.icon, contentDescription = dest.label) },
                                    label = { Text(dest.label) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = FocusColors.TacticalCrimsonBright,
                                        selectedTextColor = FocusColors.TextPrimary,
                                        unselectedIconColor = FocusColors.TextMuted,
                                        unselectedTextColor = FocusColors.TextMuted,
                                        indicatorColor = FocusColors.TacticalCrimsonMuted
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = FocusDestination.Dashboard.route,
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable(FocusDestination.Dashboard.route) {
                            DashboardScreen(
                                uiState = uiState,
                                onSetFocusTarget = vm::setDailyFocusTarget,
                                onSelectMission = vm::selectActiveMission,
                                onOpenUsageAccessSettings = {
                                    startActivity(appContainer.permissionStatusChecker.buildUsageAccessIntent())
                                },
                                onOpenAccessibilitySettings = {
                                    startActivity(appContainer.permissionStatusChecker.buildAccessibilitySettingsIntent())
                                }
                            )
                        }
                        composable(FocusDestination.Shield.route) {
                            AppSelectionScreen(
                                uiState = shieldUiState,
                                onSearchQueryChange = shieldVm::onSearchQueryChange,
                                onCategorySelected = shieldVm::onCategorySelected,
                                onFilterModeSelected = shieldVm::onFilterModeSelected,
                                onToggleAppBlocked = shieldVm::onToggleAppBlocked,
                                onSelectDistractingPreset = shieldVm::onSelectDistractingPreset,
                                onClearBlocklist = shieldVm::onClearBlocklist,
                                onRefreshApps = shieldVm::refreshInstalledApps,
                                onToggleNuclearMode = shieldVm::onToggleNuclearModeSelected,
                                onStartSession = { mins -> shieldVm.startFocusSession(mins) },
                                onStopSession = shieldVm::stopAndRestoreSession,
                                onConfirmEmergencyOverride = shieldVm::confirmEmergencyOverride,
                                onOpenAccessibilitySettings = {
                                    startActivity(appContainer.permissionStatusChecker.buildAccessibilitySettingsIntent())
                                },
                                onOpenUsageAccessSettings = {
                                    startActivity(appContainer.permissionStatusChecker.buildUsageAccessIntent())
                                },
                                loadIconBitmap = shieldVm::loadIconBitmap
                            )
                        }
                        composable(FocusDestination.Missions.route) {
                            MissionsScreen(
                                uiState = missionsUiState,
                                onSaveMission = missionsVm::saveMission,
                                onDeleteMission = missionsVm::deleteMission,
                                onLaunchStudyBlock = { mission ->
                                    missionsVm.setActiveAndLaunchStudyBlock(mission)
                                },
                                onSaveSchedule = missionsVm::saveSchedule,
                                onToggleScheduleEnabled = missionsVm::toggleScheduleEnabled,
                                onDeleteSchedule = missionsVm::deleteSchedule
                            )
                        }
                        composable(FocusDestination.Analytics.route) {
                            AnalyticsScreen(
                                uiState = analyticsUiState,
                                onSelectRangeDays = { days -> analyticsVm.refreshUsageStats(days) },
                                onRefreshUsageStats = { analyticsVm.refreshUsageStats() },
                                onToggleBlockApp = analyticsVm::toggleBlockPackage,
                                onOpenUsageAccessSettings = {
                                    startActivity(appContainer.permissionStatusChecker.buildUsageAccessIntent())
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::dashboardViewModel.isInitialized) {
            dashboardViewModel.refreshPermissions()
        }
        if (::shieldViewModel.isInitialized) {
            shieldViewModel.refreshPermissions()
        }
        if (::analyticsViewModel.isInitialized) {
            analyticsViewModel.refreshUsageStats()
        }
    }
}
