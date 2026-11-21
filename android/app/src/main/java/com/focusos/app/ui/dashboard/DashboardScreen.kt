package com.focusos.app.ui.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.focusos.app.domain.ActiveMissionSummary
import com.focusos.app.domain.BatteryUsageAdvisory
import com.focusos.app.domain.DashboardUiState
import com.focusos.app.domain.DisciplineCalculator
import com.focusos.app.domain.WeeklyFocusDay
import com.focusos.app.ui.theme.FocusColors

@Composable
fun DashboardScreen(
    uiState: DashboardUiState,
    onSetFocusTarget: (Int) -> Unit,
    onSelectMission: (Long) -> Unit,
    onOpenUsageAccessSettings: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showTargetSelector by remember { mutableStateOf(false) }

    if (uiState.isLoading) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(FocusColors.PureBlack),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = FocusColors.TacticalCrimsonBright)
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(FocusColors.PureBlack),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            CommandHeader(
                dateLabel = uiState.currentDateLabel,
                targetMinutes = uiState.dailyFocusTargetMinutes,
                onEditTargetClick = { showTargetSelector = !showTargetSelector }
            )
        }

        if (showTargetSelector) {
            item {
                TargetSelectorPanel(
                    currentTargetMinutes = uiState.dailyFocusTargetMinutes,
                    onSelectTarget = {
                        onSetFocusTarget(it)
                        showTargetSelector = false
                    }
                )
            }
        }

        if (uiState.batteryAdvisory != null) {
            item {
                BatteryUsageAdvisoryCard(advisory = uiState.batteryAdvisory)
            }
        }

        item {
            DisciplineScoreCard(uiState = uiState)
        }

        item {
            TodayTelemetryGrid(uiState = uiState)
        }

        item {
            ActiveMissionPanel(
                activeMission = uiState.activeMission,
                allMissions = uiState.availableMissions,
                completedCount = uiState.completedMissionsToday,
                totalCount = uiState.totalMissionsToday,
                onSelectMission = onSelectMission
            )
        }

        item {
            WeeklyFocusPanel(weeklyHistory = uiState.weeklyHistory)
        }

        item {
            PermissionReadinessPanel(
                usageAccessGranted = uiState.permissionReadiness.usageAccessGranted,
                accessibilityEnabled = uiState.permissionReadiness.accessibilityServiceEnabled,
                onOpenUsageAccessSettings = onOpenUsageAccessSettings,
                onOpenAccessibilitySettings = onOpenAccessibilitySettings
            )
        }

        item { Spacer(modifier = Modifier.height(12.dp)) }
    }
}

@Composable
private fun CommandHeader(
    dateLabel: String,
    targetMinutes: Int,
    onEditTargetClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "FOCUS//OS",
                style = MaterialTheme.typography.headlineMedium,
                color = FocusColors.TextPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "$dateLabel · Target ${DisciplineCalculator.formatMinutesCompact(targetMinutes)}",
                style = MaterialTheme.typography.labelMedium,
                color = FocusColors.TextSecondary
            )
        }

        OutlinedButton(
            onClick = onEditTargetClick,
            border = BorderStroke(1.dp, FocusColors.HairlineBorder),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = FocusColors.TextPrimary),
            shape = RoundedCornerShape(6.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(
                text = "Set Target",
                style = MaterialTheme.typography.labelMedium
            )
        }
    }
}

@Composable
private fun BatteryUsageAdvisoryCard(advisory: BatteryUsageAdvisory) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(
            width = 1.dp,
            color = FocusColors.WarningAmber.copy(alpha = if (advisory.isElevated) 0.5f else 0.3f)
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = advisory.headline,
                style = MaterialTheme.typography.labelMedium,
                color = FocusColors.WarningAmber
            )
            Text(
                text = advisory.detail,
                style = MaterialTheme.typography.labelSmall,
                color = FocusColors.TextSecondary
            )
        }
    }
}

@Composable
private fun TargetSelectorPanel(
    currentTargetMinutes: Int,
    onSelectTarget: (Int) -> Unit
) {
    val presets = listOf(120, 180, 240, 300, 360)
    Surface(
        color = FocusColors.CharcoalElevated,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                text = "Daily Focus Target",
                style = MaterialTheme.typography.titleMedium,
                color = FocusColors.TextPrimary
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                presets.forEach { preset ->
                    val selected = preset == currentTargetMinutes
                    Button(
                        onClick = { onSelectTarget(preset) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selected) FocusColors.TacticalCrimson else FocusColors.CharcoalSurface,
                            contentColor = FocusColors.TextPrimary
                        ),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "${preset / 60}h",
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DisciplineScoreCard(uiState: DashboardUiState) {
    val breakdown = uiState.disciplineBreakdown
    val animatedProgress by animateFloatAsState(
        targetValue = (breakdown.totalScore / 100f).coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 450),
        label = "discipline_score_arc"
    )

    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Discipline Score",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
                Text(
                    text = breakdown.statusLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (breakdown.totalScore >= 65) FocusColors.TextSecondary else FocusColors.TacticalCrimsonBright
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Focus +${breakdown.focusComponent} · Missions +${breakdown.missionComponent}",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.TextSecondary
                )
                Text(
                    text = "Resisted +${breakdown.resistanceBonus} · Penalty -${breakdown.distractionPenalty}",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.TextMuted
                )
            }

            Box(
                modifier = Modifier.size(104.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 9.dp.toPx()
                    drawArc(
                        color = FocusColors.HairlineBorder,
                        startAngle = 135f,
                        sweepAngle = 270f,
                        useCenter = false,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                    drawArc(
                        color = FocusColors.TacticalCrimsonBright,
                        startAngle = 135f,
                        sweepAngle = 270f * animatedProgress,
                        useCenter = false,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${breakdown.totalScore}",
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 28.sp),
                        color = FocusColors.TextPrimary
                    )
                    Text(
                        text = "/ 100",
                        style = MaterialTheme.typography.labelSmall,
                        color = FocusColors.TextMuted
                    )
                }
            }
        }
    }
}

@Composable
private fun TodayTelemetryGrid(uiState: DashboardUiState) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricTile(
                label = "Today's Focus",
                value = DisciplineCalculator.formatMinutesCompact(uiState.focusMinutesToday),
                subtext = "Goal ${DisciplineCalculator.formatMinutesCompact(uiState.dailyFocusTargetMinutes)}",
                accentRed = false,
                modifier = Modifier.weight(1f)
            )
            MetricTile(
                label = "Daily Screen Time",
                value = DisciplineCalculator.formatMinutesCompact(uiState.screenTimeMinutesToday),
                subtext = if (uiState.permissionReadiness.usageAccessGranted) {
                    "UsageStatsManager live"
                } else {
                    "Grant Usage Access"
                },
                accentRed = false,
                modifier = Modifier.weight(1f)
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricTile(
                label = "Distracting Usage",
                value = DisciplineCalculator.formatMinutesCompact(uiState.distractingMinutesToday),
                subtext = "15m grace threshold",
                accentRed = uiState.distractingMinutesToday > 15,
                modifier = Modifier.weight(1f)
            )
            MetricTile(
                label = "Blocked Attempts",
                value = "${uiState.blockedAttemptsToday}",
                subtext = "Missions ${uiState.completedMissionsToday}/${uiState.totalMissionsToday}",
                accentRed = false,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun MetricTile(
    label: String,
    value: String,
    subtext: String,
    accentRed: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = FocusColors.TextSecondary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = if (accentRed) FocusColors.TacticalCrimsonBright else FocusColors.TextPrimary
            )
            Text(
                text = subtext,
                style = MaterialTheme.typography.labelSmall,
                color = FocusColors.TextMuted
            )
        }
    }
}

@Composable
private fun ActiveMissionPanel(
    activeMission: ActiveMissionSummary?,
    allMissions: List<ActiveMissionSummary>,
    completedCount: Int,
    totalCount: Int,
    onSelectMission: (Long) -> Unit
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Mission",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
                Text(
                    text = "$completedCount of $totalCount completed",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.TextSecondary
                )
            }

            if (activeMission != null) {
                Text(
                    text = activeMission.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = FocusColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                LinearProgressIndicator(
                    progress = { activeMission.progressFraction },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    color = FocusColors.TacticalCrimsonBright,
                    trackColor = FocusColors.HairlineBorder
                )
                Text(
                    text = "${DisciplineCalculator.formatMinutesCompact(activeMission.completedMinutes)} / ${DisciplineCalculator.formatMinutesCompact(activeMission.targetMinutes)}",
                    style = MaterialTheme.typography.labelMedium,
                    color = FocusColors.TextSecondary
                )
            }

            if (allMissions.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    allMissions.forEach { mission ->
                        val isSelected = mission.id == activeMission?.id
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = if (isSelected) FocusColors.CharcoalElevated else FocusColors.PureBlack,
                                    shape = RoundedCornerShape(6.dp)
                                )
                                .clickable { onSelectMission(mission.id) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = mission.subject,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (isSelected) FocusColors.TextPrimary else FocusColors.TextSecondary
                            )
                            Text(
                                text = if (mission.isCompleted) "Done" else DisciplineCalculator.formatMinutesCompact(mission.targetMinutes),
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isSelected) FocusColors.TacticalCrimsonBright else FocusColors.TextMuted
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WeeklyFocusPanel(weeklyHistory: List<WeeklyFocusDay>) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Weekly Focus",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
                val weeklyTotal = weeklyHistory.sumOf { it.focusMinutes }
                Text(
                    text = "${DisciplineCalculator.formatMinutesCompact(weeklyTotal)} total",
                    style = MaterialTheme.typography.labelMedium,
                    color = FocusColors.TextSecondary
                )
            }

            if (weeklyHistory.isNotEmpty()) {
                val maxFocus = (weeklyHistory.maxOfOrNull { it.focusMinutes } ?: 1).coerceAtLeast(60)
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(96.dp)
                ) {
                    val count = weeklyHistory.size
                    val slotWidth = size.width / count.toFloat()
                    val barWidth = (slotWidth * 0.45f).coerceAtMost(28.dp.toPx())
                    weeklyHistory.forEachIndexed { idx, day ->
                        val ratio = (day.focusMinutes.toFloat() / maxFocus.toFloat()).coerceIn(0.05f, 1f)
                        val barHeight = size.height * ratio
                        val left = idx * slotWidth + (slotWidth - barWidth) / 2f
                        drawRoundRect(
                            color = if (idx == weeklyHistory.lastIndex) FocusColors.TacticalCrimsonBright else FocusColors.TextSecondary,
                            topLeft = Offset(left, size.height - barHeight),
                            size = Size(barWidth, barHeight),
                            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    weeklyHistory.forEach { day ->
                        Text(
                            text = day.dayLabel,
                            style = MaterialTheme.typography.labelSmall,
                            color = FocusColors.TextMuted
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionReadinessPanel(
    usageAccessGranted: Boolean,
    accessibilityEnabled: Boolean,
    onOpenUsageAccessSettings: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "System Readiness (Stage 1)",
                style = MaterialTheme.typography.titleMedium,
                color = FocusColors.TextPrimary
            )
            Text(
                text = "Stage 1 tracks persistent Room/DataStore discipline baselines. Real foreground app blocking activates in Stage 3 once Usage Access and Accessibility Service are wired and enabled.",
                style = MaterialTheme.typography.bodyMedium,
                color = FocusColors.TextSecondary
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Usage Access",
                        style = MaterialTheme.typography.bodyMedium,
                        color = FocusColors.TextPrimary
                    )
                    Text(
                        text = if (usageAccessGranted) "Granted" else "Not granted",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (usageAccessGranted) FocusColors.NominalGreen else FocusColors.WarningAmber
                    )
                }
                OutlinedButton(
                    onClick = onOpenUsageAccessSettings,
                    border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("Settings", style = MaterialTheme.typography.labelMedium, color = FocusColors.TextPrimary)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Accessibility Service",
                        style = MaterialTheme.typography.bodyMedium,
                        color = FocusColors.TextPrimary
                    )
                    Text(
                        text = if (accessibilityEnabled) "Active" else "Pending Stage 3 implementation",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (accessibilityEnabled) FocusColors.NominalGreen else FocusColors.TextMuted
                    )
                }
                OutlinedButton(
                    onClick = onOpenAccessibilitySettings,
                    border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("Inspect", style = MaterialTheme.typography.labelMedium, color = FocusColors.TextPrimary)
                }
            }
        }
    }
}
