package com.focusos.app.domain

object AppSelectionFilter {

    private val protectedPrefixes = listOf(
        "com.android.dialer",
        "com.google.android.dialer",
        "com.samsung.android.dialer",
        "com.android.phone",
        "com.android.server.telecom",
        "com.android.emergency",
        "com.android.settings"
    )

    private val socialKeywords = listOf(
        "instagram", "whatsapp", "snapchat", "facebook", "orca", "twitter", "x.android",
        "reddit", "discord", "telegram", "threads", "linkedin", "pinterest", "tumblr"
    )

    private val videoKeywords = listOf(
        "youtube", "netflix", "twitch", "musically", "tiktok", "primevideo", "disney",
        "hulu", "vimeo", "hotstar", "crunchyroll"
    )

    private val browserKeywords = listOf(
        "chrome", "firefox", "brave", "opera", "duckduckgo", "edge", "browser", "vivaldi"
    )

    private val gameKeywords = listOf(
        "supercell", "roblox", "pubg", "garena", "riotgames", "minecraft", "activision",
        "ea.gp", "gameloft", "king.", "mojang", "niantic"
    )

    private val productivityKeywords = listOf(
        "docs", "sheets", "notion", "obsidian", "anki", "khanacademy", "coursera",
        "duolingo", "quizlet", "classroom", "acrobat", "calendar", "keep"
    )

    fun isProtectedSafetyPackage(packageName: String = "com.focusos.app"): Boolean {
        if (packageName == selfPackageName) return true
        val lower = packageName.lowercase()
        return protectedPrefixes.any { lower == it || lower.startsWith("$it.") }
    }

    fun categorizePackage(packageName: String, appName: String): AppCategory {
        val target = "${packageName.lowercase()} ${appName.lowercase()}"
        return when {
            socialKeywords.any { target.contains(it) } -> AppCategory.SOCIAL
            videoKeywords.any { target.contains(it) } -> AppCategory.VIDEO
            gameKeywords.any { target.contains(it) } -> AppCategory.GAMES
            browserKeywords.any { target.contains(it) } -> AppCategory.BROWSER
            productivityKeywords.any { target.contains(it) } -> AppCategory.PRODUCTIVITY
            else -> AppCategory.OTHER
        }
    }

    fun filterAndSort(
        apps: List<InstalledAppInfo>,
        query: String,
        category: AppCategory?,
        filterMode: BlockFilterMode
    ): List<InstalledAppInfo> {
        val trimmed = query.trim().lowercase()
        return apps.filter { app ->
            val matchesQuery = trimmed.isEmpty() ||
                app.appName.lowercase().contains(trimmed) ||
                app.packageName.lowercase().contains(trimmed)
            val matchesCategory = category == null || app.category == category
            val matchesMode = when (filterMode) {
                BlockFilterMode.ALL -> true
                BlockFilterMode.BLOCKED_ONLY -> app.isBlocked
                BlockFilterMode.UNBLOCKED_ONLY -> !app.isBlocked
            }
            matchesQuery && matchesCategory && matchesMode
        }.sortedWith(
            compareByDescending<InstalledAppInfo> { it.isBlocked }
                .thenBy { it.appName.lowercase() }
        )
    }
}
