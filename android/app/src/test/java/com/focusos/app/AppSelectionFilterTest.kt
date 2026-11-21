package com.focusos.app

import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.AppSelectionFilter
import com.focusos.app.domain.BlockFilterMode
import com.focusos.app.domain.InstalledAppInfo
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppSelectionFilterTest {

    @Test
    fun categorizesSocialVideoGamesAndBrowserPackagesAccurately() {
        assertEquals(AppCategory.SOCIAL, AppSelectionFilter.categorizePackage("com.instagram.android", "Instagram"))
        assertEquals(AppCategory.VIDEO, AppSelectionFilter.categorizePackage("com.google.android.youtube", "YouTube"))
        assertEquals(AppCategory.GAMES, AppSelectionFilter.categorizePackage("com.supercell.clashroyale", "Clash Royale"))
        assertEquals(AppCategory.BROWSER, AppSelectionFilter.categorizePackage("com.android.chrome", "Chrome"))
    }

    @Test
    fun protectsEssentialSafetyAppsAndSelfPackageFromBlocking() {
        assertTrue(AppSelectionFilter.isProtectedSafetyPackage("com.focusos.app", "com.focusos.app"))
        assertTrue(AppSelectionFilter.isProtectedSafetyPackage("com.google.android.dialer", "com.focusos.app"))
        assertTrue(AppSelectionFilter.isProtectedSafetyPackage("com.android.settings", "com.focusos.app"))
        assertFalse(AppSelectionFilter.isProtectedSafetyPackage("com.instagram.android", "com.focusos.app"))
    }

    @Test
    fun filtersByQueryCategoryAndBlockModeAndSortsBlockedFirst() {
        val apps = listOf(
            InstalledAppInfo("com.android.chrome", "Chrome", AppCategory.BROWSER, isSystemApp = true, isBlocked = false, isProtectedSafetyApp = false),
            InstalledAppInfo("com.instagram.android", "Instagram", AppCategory.SOCIAL, isSystemApp = false, isBlocked = true, isProtectedSafetyApp = false),
            InstalledAppInfo("com.discord", "Discord", AppCategory.SOCIAL, isSystemApp = false, isBlocked = false, isProtectedSafetyApp = false)
        )

        val blockedOnly = AppSelectionFilter.filterAndSort(apps, "", null, BlockFilterMode.BLOCKED_ONLY)
        assertEquals(1, blockedOnly.size)
        assertEquals("Instagram", blockedOnly.first().appName)

        val socialAll = AppSelectionFilter.filterAndSort(apps, "", AppCategory.SOCIAL, BlockFilterMode.ALL)
        assertEquals(listOf("Instagram", "Discord"), socialAll.map { it.appName })
    }
}
