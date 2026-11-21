package com.focusos.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.Security
import androidx.compose.ui.graphics.vector.ImageVector

enum class FocusDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val stageTag: String
) {
    Dashboard(
        route = "dashboard",
        label = "Command",
        icon = Icons.Outlined.Dashboard,
        stageTag = "Stage 1"
    ),
    Shield(
        route = "shield",
        label = "Shield",
        icon = Icons.Outlined.Security,
        stageTag = "Stages 2–4"
    ),
    Missions(
        route = "missions",
        label = "Missions",
        icon = Icons.Outlined.Flag,
        stageTag = "Stage 5"
    ),
    Analytics(
        route = "analytics",
        label = "Analytics",
        icon = Icons.Outlined.Analytics,
        stageTag = "Stage 6"
    )
}
