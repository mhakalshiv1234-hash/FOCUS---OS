package com.focusos.app.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.focusos.app.domain.AnalyticsUiState
import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.DisciplineCalculator
import com.focusos.app.ui.theme.FocusColors

@Composable
fun AnalyticsScreen(
    uiState: AnalyticsUiState,
    onSelectRangeDays: (Int) -> Unit,
    onRefreshUsageStats: () -> Unit,
    onToggleBlockApp: (packageName: String, appName: String, category: AppCategory, block: Boolean) -> Unit,
    onOpenUsageAccessSettings: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(FocusColors.PureBlack)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Discipline Analytics",
                        style = MaterialTheme.typography.headlineMedium,
                        color = FocusColors.TextPrimary
                    )
                    Text(
                        text = "UsageStatsManager screen time & 7-day trend",
                        style = MaterialTheme.typography.bodySmall,
                        color = FocusColors.TextSecondary
                    )
                }
                OutlinedButton(onClick = onRefreshUsageStats) {
                    Text("Refresh", color = FocusColors.TextPrimary)
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(1 to "Today", 7 to "7 Days").forEach { (days, label) ->
                    FilterChip(
                        selected = uiState.selectedRangeDays == days,
                        onClick = { onSelectRangeDays(days) },
                        label = { Text(label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = FocusColors.TacticalCrimson,
                            selectedLabelColor = FocusColors.TextPrimary
                        )
                    )
                }
            }
        }

        if (!uiState.usageAccessGranted) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(FocusColors.CharcoalSurface)
                        .border(1.dp, FocusColors.BorderSubtle, RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Usage Access Permission Required",
                        style = MaterialTheme.typography.titleMedium,
                        color = FocusColors.TextPrimary
                    )
                    Text(
                        text = "Grant PACKAGE_USAGE_STATS in Android Settings so FOCUS//OS can replace baseline estimates with real foreground screen time and distracting app totals.",
                        style = MaterialTheme.typography.bodySmall,
                        color = FocusColors.TextSecondary
                    )
                    Button(
                        onClick = onOpenUsageAccessSettings,
                        colors = ButtonDefaults.buttonColors(containerColor = FocusColors.TacticalCrimson)
                    ) {
                        Text("Grant Usage Access")
                    }
                }
            }
        } else {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    AnalyticsStatCard(
                        label = "Screen Time",
                        value = DisciplineCalculator.formatMinutesCompact(uiState.summary.totalScreenTimeMinutes),
                        modifier = Modifier.weight(1f)
                    )
                    AnalyticsStatCard(
                        label = "Distracting",
                        value = DisciplineCalculator.formatMinutesCompact(uiState.summary.distractingMinutes),
                        accentRed = uiState.summary.distractingMinutes > 15,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    AnalyticsStatCard(
                        label = "7d Avg Score",
                        value = "${uiState.weeklyTrend.avgDisciplineScore}/100",
                        modifier = Modifier.weight(1f)
                    )
                    AnalyticsStatCard(
                        label = "Focus Streak",
                        value = "${uiState.weeklyTrend.focusStreakDays}d",
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            if (uiState.summary.apps.isNotEmpty()) {
                item {
                    Text(
                        text = "App Screen Time Breakdown (${uiState.summary.apps.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = FocusColors.TextPrimary
                    )
                }

                items(uiState.summary.apps, key = { it.packageName }) { app ->
                    val maxMins = uiState.summary.apps.first().minutesUsed.coerceAtLeast(1)
                    val fraction = (app.minutesUsed.toFloat() / maxMins).coerceIn(0f, 1f)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(FocusColors.CharcoalSurface)
                            .border(1.dp, FocusColors.BorderSubtle, RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = app.appName,
                                    color = FocusColors.TextPrimary,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${app.category.name} · ${app.launchCount} launches",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = FocusColors.TextMuted
                                )
                            }
                            Text(
                                text = DisciplineCalculator.formatMinutesCompact(app.minutesUsed),
                                style = MaterialTheme.typography.titleMedium,
                                color = if (app.isDistracting) FocusColors.TacticalCrimsonBright else FocusColors.TextPrimary
                            )
                        }
                        LinearProgressIndicator(
                            progress = { fraction },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = if (app.isDistracting) FocusColors.TacticalCrimson else FocusColors.NominalGreen,
                            trackColor = FocusColors.PureBlack
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            OutlinedButton(
                                onClick = {
                                    onToggleBlockApp(
                                        app.packageName,
                                        app.appName,
                                        app.category,
                                        !app.isBlocklisted
                                    )
                                }
                            ) {
                                Text(
                                    text = if (app.isBlocklisted) "Shielded" else "Shield App",
                                    color = if (app.isBlocklisted) FocusColors.TacticalCrimsonBright else FocusColors.TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun AnalyticsStatCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    accentRed: Boolean = false
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(FocusColors.CharcoalSurface)
            .border(1.dp, FocusColors.BorderSubtle, RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(text = label, style = MaterialTheme.typography.bodySmall, color = FocusColors.TextSecondary)
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                color = if (accentRed) FocusColors.TacticalCrimsonBright else FocusColors.TextPrimary
            )
        }
    }
}
