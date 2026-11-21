package com.focusos.app.data.repository

import android.accessibilityservice.AccessibilityServiceInfo
import android.app.AppOpsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.focusos.app.domain.PermissionReadiness
import com.focusos.app.service.FocusBlockingAccessibilityService

class PermissionStatusChecker(private val context: Context) {

    fun checkReadiness(): PermissionReadiness {
        return PermissionReadiness(
            usageAccessGranted = hasUsageStatsPermission(),
            accessibilityServiceEnabled = isFocusAccessibilityServiceEnabled()
        )
    }

    fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = appOps.unsafeCheckOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun isFocusAccessibilityServiceEnabled(): Boolean {
        val expectedComponent = ComponentName(context, FocusBlockingAccessibilityService::class.java)
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        if (!enabledServicesSetting.isNullOrBlank()) {
            val flattened = expectedComponent.flattenToString()
            val shortFlattened = expectedComponent.flattenToShortString()
            val enabledList = enabledServicesSetting.split(':')
            if (enabledList.any { it.equals(flattened, ignoreCase = true) || it.equals(shortFlattened, ignoreCase = true) }) {
                return true
            }
        }

        val accessibilityManager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
            ?: return false
        val runningServices = accessibilityManager.getEnabledAccessibilityServiceList(
            AccessibilityServiceInfo.FEEDBACK_GENERIC
        )
        return runningServices.any { info ->
            val serviceInfo = info.resolveInfo?.serviceInfo ?: return@any false
            serviceInfo.packageName == context.packageName &&
                serviceInfo.name == FocusBlockingAccessibilityService::class.java.name
        }
    }

    fun buildUsageAccessIntent(): Intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    fun buildAccessibilitySettingsIntent(): Intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
}
