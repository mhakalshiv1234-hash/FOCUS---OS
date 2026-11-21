package com.focusos.app.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val FocusDarkColorScheme = darkColorScheme(
    primary = FocusColors.TacticalCrimsonBright,
    onPrimary = FocusColors.TextPrimary,
    primaryContainer = FocusColors.TacticalCrimsonMuted,
    onPrimaryContainer = FocusColors.TextPrimary,
    secondary = FocusColors.TextSecondary,
    onSecondary = FocusColors.PureBlack,
    background = FocusColors.PureBlack,
    onBackground = FocusColors.TextPrimary,
    surface = FocusColors.CharcoalSurface,
    onSurface = FocusColors.TextPrimary,
    surfaceVariant = FocusColors.CharcoalElevated,
    onSurfaceVariant = FocusColors.TextSecondary,
    outline = FocusColors.HairlineBorder,
    error = FocusColors.TacticalCrimsonBright,
    onError = FocusColors.TextPrimary
)

@Composable
fun FocusOsTheme(
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = FocusColors.PureBlack.toArgb()
            window.navigationBarColor = FocusColors.PureBlack.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = FocusDarkColorScheme,
        typography = FocusTypography,
        content = content
    )
}
