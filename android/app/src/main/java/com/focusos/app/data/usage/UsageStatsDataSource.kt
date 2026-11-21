package com.focusos.app.data.usage

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import com.focusos.app.domain.AppSelectionFilter
import com.focusos.app.domain.AppUsageStatItem
import java.time.LocalDate
import java.time.ZoneId

/**
 * Queries real Android UsageStatsManager events to compute exact foreground screen time
 * and launch counts per package without relying on Stage 1 baseline seed numbers.
 */
class UsageStatsDataSource(private val context: Context) {

    fun queryAppUsageSinceMidnight(daysBack: Int = 0): List<AppUsageStatItem> {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return emptyList()
        val pm = context.packageManager

        val zone = ZoneId.systemDefault()
        val startDate = LocalDate.now().minusDays(daysBack.toLong().coerceAtLeast(0L))
        val startEpochMs = startDate.atStartOfDay(zone).toInstant().toEpochMilli()
        val endEpochMs = System.currentTimeMillis()
        if (endEpochMs <= startEpochMs) return emptyList()

        val events = usm.queryEvents(startEpochMs, endEpochMs)
        val event = UsageEvents.Event()

        val activeForegroundStart = mutableMapOf<String, Long>()
        val totalForegroundMs = mutableMapOf<String, Long>()
        val launchCounts = mutableMapOf<String, Int>()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue
            if (pkg == context.packageName) continue

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    activeForegroundStart[pkg] = event.timeStamp
                    launchCounts[pkg] = (launchCounts[pkg] ?: 0) + 1
                }
                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    val startedAt = activeForegroundStart.remove(pkg)
                    if (startedAt != null && event.timeStamp >= startedAt) {
                        totalForegroundMs[pkg] = (totalForegroundMs[pkg] ?: 0L) + (event.timeStamp - startedAt)
                    }
                }
            }
        }

        // Close any currently active foreground session up to endEpochMs
        for ((pkg, startedAt) in activeForegroundStart) {
            if (endEpochMs >= startedAt) {
                totalForegroundMs[pkg] = (totalForegroundMs[pkg] ?: 0L) + (endEpochMs - startedAt)
            }
        }

        val allPackages = (totalForegroundMs.keys + launchCounts.keys).distinct()
        return allPackages.mapNotNull { pkg ->
            val mins = ((totalForegroundMs[pkg] ?: 0L) / 60_000L).toInt()
            val launches = launchCounts[pkg] ?: 0
            if (mins <= 0 && launches <= 0) return@mapNotNull null

            val appName = resolveAppLabel(pm, pkg)
            val category = AppSelectionFilter.categorizePackage(pkg, appName)
            AppUsageStatItem(
                packageName = pkg,
                appName = appName,
                category = category,
                minutesUsed = mins,
                launchCount = launches,
                isDistracting = false,
                isBlocklisted = false
            )
        }
    }

    private fun resolveAppLabel(pm: PackageManager, packageName: String): String {
        return runCatching {
            val info = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(info).toString()
        }.getOrElse {
            packageName.substringAfterLast('.').replaceFirstChar { it.uppercase() }
        }
    }
}
