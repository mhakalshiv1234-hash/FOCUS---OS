package com.focusos.app

import android.app.Application
import com.focusos.app.data.apps.InstalledAppsProvider
import com.focusos.app.data.local.FocusOsDatabase
import com.focusos.app.data.preferences.UserPreferencesRepository
import com.focusos.app.data.repository.AppBlocklistRepository
import com.focusos.app.data.repository.DisciplineRepository
import com.focusos.app.data.repository.FocusSessionRepository
import com.focusos.app.data.repository.MissionScheduleRepository
import com.focusos.app.data.repository.PermissionStatusChecker
import com.focusos.app.data.repository.UsageAnalyticsRepository
import com.focusos.app.data.usage.UsageStatsDataSource
import com.focusos.app.service.ScheduleAlarmScheduler

class AppContainer(application: Application) {
    private val database: FocusOsDatabase by lazy {
        FocusOsDatabase.getInstance(application)
    }

    private val preferencesRepository: UserPreferencesRepository by lazy {
        UserPreferencesRepository(application)
    }

    private val installedAppsProvider: InstalledAppsProvider by lazy {
        InstalledAppsProvider(application)
    }

    val permissionStatusChecker: PermissionStatusChecker by lazy {
        PermissionStatusChecker(application)
    }

    private val usageStatsDataSource: UsageStatsDataSource by lazy {
        UsageStatsDataSource(application)
    }

    val disciplineRepository: DisciplineRepository by lazy {
        DisciplineRepository(
            dailyMetricDao = database.dailyMetricDao(),
            missionDao = database.missionDao(),
            preferencesRepository = preferencesRepository,
            permissionStatusChecker = permissionStatusChecker
        )
    }

    val appBlocklistRepository: AppBlocklistRepository by lazy {
        AppBlocklistRepository(
            installedAppsProvider = installedAppsProvider,
            blockedAppDao = database.blockedAppDao()
        )
    }

    val focusSessionRepository: FocusSessionRepository by lazy {
        FocusSessionRepository(
            focusSessionDao = database.focusSessionDao(),
            blockedAppDao = database.blockedAppDao(),
            blockedAttemptDao = database.blockedAttemptDao(),
            dailyMetricDao = database.dailyMetricDao(),
            nuclearOverrideDao = database.nuclearOverrideDao()
        )
    }

    val missionScheduleRepository: MissionScheduleRepository by lazy {
        MissionScheduleRepository(
            missionDao = database.missionDao(),
            dailyScheduleDao = database.dailyScheduleDao(),
            blockedAppDao = database.blockedAppDao(),
            dailyMetricDao = database.dailyMetricDao()
        )
    }

    val usageAnalyticsRepository: UsageAnalyticsRepository by lazy {
        UsageAnalyticsRepository(
            usageStatsDataSource = usageStatsDataSource,
            dailyMetricDao = database.dailyMetricDao(),
            blockedAppDao = database.blockedAppDao(),
            missionDao = database.missionDao(),
            preferencesRepository = preferencesRepository,
            permissionStatusChecker = permissionStatusChecker
        )
    }
}

class FocusOsApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        ScheduleAlarmScheduler.ensureWatchdogScheduled(this)
    }
}
