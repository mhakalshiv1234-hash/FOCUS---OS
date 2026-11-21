package com.focusos.app.domain

enum class AppCategory(val label: String) {
    SOCIAL("Social"),
    VIDEO("Video"),
    GAMES("Games"),
    BROWSER("Browser"),
    PRODUCTIVITY("Productivity"),
    OTHER("Other")
}

enum class BlockFilterMode(val label: String) {
    ALL("All"),
    BLOCKED_ONLY("Blocked"),
    UNBLOCKED_ONLY("Allowed")
}

data class InstalledAppInfo(
    val packageName: String,
    val appName: String,
    val category: AppCategory,
    val isSystemApp: Boolean,
    val isBlocked: Boolean,
    val isProtectedSafetyApp: Boolean
)

data class AppSelectionUiState(
    val isLoading: Boolean = true,
    val apps: List<InstalledAppInfo> = emptyList(),
    val searchQuery: String = "",
    val selectedCategory: AppCategory? = null,
    val filterMode: BlockFilterMode = BlockFilterMode.ALL,
    val totalInstalledCount: Int = 0,
    val totalBlockedCount: Int = 0,
    val activeSession: ActiveFocusSession? = null,
    val nuclearModeSelected: Boolean = false,
    val isNuclearLocked: Boolean = false,
    val remainingMillis: Long = 0L,
    val accessibilityEnabled: Boolean = false,
    val usageAccessGranted: Boolean = false,
    val recentAttempts: List<BlockedAttemptLog> = emptyList(),
    val recentOverrides: List<EmergencyOverrideLog> = emptyList(),
    val errorMessage: String? = null
)
