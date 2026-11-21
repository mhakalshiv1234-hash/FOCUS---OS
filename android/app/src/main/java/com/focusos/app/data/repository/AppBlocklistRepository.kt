package com.focusos.app.data.repository

import android.graphics.Bitmap
import com.focusos.app.data.apps.DetectedInstalledApp
import com.focusos.app.data.apps.InstalledAppsProvider
import com.focusos.app.data.local.BlockedAppDao
import com.focusos.app.data.local.BlockedAppEntity
import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.InstalledAppInfo
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine

class AppBlocklistRepository(
    private val installedAppsProvider: InstalledAppsProvider,
    private val blockedAppDao: BlockedAppDao
) {
    private val detectedAppsFlow = MutableStateFlow<List<DetectedInstalledApp>>(emptyList())
    private val loadedOnce = MutableStateFlow(false)

    suspend fun refreshInstalledApps() {
        val apps = installedAppsProvider.loadLaunchableApps()
        detectedAppsFlow.value = apps
        loadedOnce.value = true
    }

    fun observeAppsWithBlockState(): Flow<Pair<Boolean, List<InstalledAppInfo>>> {
        return combine(
            loadedOnce,
            detectedAppsFlow,
            blockedAppDao.observeBlockedApps()
        ) { isLoaded, detected, blockedRows ->
            val blockedSet = blockedRows.map { it.packageName }.toHashSet()
            val mapped = detected.map { app ->
                InstalledAppInfo(
                    packageName = app.packageName,
                    appName = app.appName,
                    category = app.category,
                    isSystemApp = app.isSystemApp,
                    isBlocked = blockedSet.contains(app.packageName) && !app.isProtectedSafetyApp,
                    isProtectedSafetyApp = app.isProtectedSafetyApp
                )
            }
            isLoaded to mapped
        }
    }

    suspend fun setAppBlocked(app: InstalledAppInfo, blocked: Boolean) {
        if (app.isProtectedSafetyApp) return
        if (blocked) {
            blockedAppDao.upsertBlockedApp(
                BlockedAppEntity(
                    packageName = app.packageName,
                    appName = app.appName,
                    category = app.category.name,
                    addedAtEpochMs = System.currentTimeMillis()
                )
            )
        } else {
            blockedAppDao.removeBlockedApp(app.packageName)
        }
    }

    suspend fun blockDetectedDistractingApps() {
        val now = System.currentTimeMillis()
        val entities = detectedAppsFlow.value
            .filter { app ->
                !app.isProtectedSafetyApp &&
                    (app.category == AppCategory.SOCIAL ||
                        app.category == AppCategory.VIDEO ||
                        app.category == AppCategory.GAMES)
            }
            .map { app ->
                BlockedAppEntity(
                    packageName = app.packageName,
                    appName = app.appName,
                    category = app.category.name,
                    addedAtEpochMs = now
                )
            }
        if (entities.isNotEmpty()) {
            blockedAppDao.upsertAll(entities)
        }
    }

    suspend fun clearBlocklist() {
        blockedAppDao.clearAll()
    }

    suspend fun loadIconBitmap(packageName: String): Bitmap? {
        return installedAppsProvider.loadAppIconBitmap(packageName)
    }
}
