package com.focusos.app.data.apps

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.LruCache
import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.AppSelectionFilter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class DetectedInstalledApp(
    val packageName: String,
    val appName: String,
    val category: AppCategory,
    val isSystemApp: Boolean,
    val isProtectedSafetyApp: Boolean
)

class InstalledAppsProvider(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager

    // Cache decoded 96x96 icon bitmaps to keep Compose LazyColumn scrolling smooth
    private val iconCache = object : LruCache<String, Bitmap>(120) {}

    suspend fun loadLaunchableApps(): List<DetectedInstalledApp> = withContext(Dispatchers.IO) {
        val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(
                launcherIntent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(launcherIntent, PackageManager.MATCH_ALL)
        }

        val seenPackages = HashSet<String>()
        val detected = ArrayList<DetectedInstalledApp>(resolveInfos.size)

        for (resolveInfo in resolveInfos) {
            val activityInfo = resolveInfo.activityInfo ?: continue
            val pkg = activityInfo.packageName ?: continue
            if (pkg == context.packageName || !seenPackages.add(pkg)) {
                continue
            }

            val appInfo = activityInfo.applicationInfo
            val label = resolveInfo.loadLabel(packageManager)?.toString()?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?: pkg

            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val isProtected = AppSelectionFilter.isProtectedSafetyPackage(
                packageName = pkg,
                selfPackageName = context.packageName
            )
            val category = AppSelectionFilter.categorizePackage(
                packageName = pkg,
                appName = label
            )

            detected.add(
                DetectedInstalledApp(
                    packageName = pkg,
                    appName = label,
                    category = category,
                    isSystemApp = isSystem,
                    isProtectedSafetyApp = isProtected
                )
            )
        }

        detected.sortedBy { it.appName.lowercase() }
    }

    suspend fun loadAppIconBitmap(packageName: String): Bitmap? = withContext(Dispatchers.IO) {
        iconCache.get(packageName)?.let { return@withContext it }

        val drawable = runCatching {
            packageManager.getApplicationIcon(packageName)
        }.getOrNull() ?: return@withContext null

        val bitmap = drawableToBitmap(drawable, sizePx = 96)
        iconCache.put(packageName, bitmap)
        bitmap
    }

    private fun drawableToBitmap(drawable: Drawable, sizePx: Int): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            val src = drawable.bitmap
            if (src.width == sizePx && src.height == sizePx) {
                return src
            }
            return Bitmap.createScaledBitmap(src, sizePx, sizePx, true)
        }

        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
