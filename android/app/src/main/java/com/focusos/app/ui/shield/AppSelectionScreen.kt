package com.focusos.app.ui.shield

import android.graphics.Bitmap
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.focusos.app.domain.AppCategory
import com.focusos.app.domain.AppSelectionUiState
import com.focusos.app.domain.BlockFilterMode
import com.focusos.app.domain.BlockingEvaluator
import com.focusos.app.domain.InstalledAppInfo
import com.focusos.app.domain.NuclearModePolicy
import com.focusos.app.ui.theme.FocusColors
import kotlinx.coroutines.delay

@Composable
fun AppSelectionScreen(
    uiState: AppSelectionUiState,
    onSearchQueryChange: (String) -> Unit,
    onCategorySelected: (AppCategory?) -> Unit,
    onFilterModeSelected: (BlockFilterMode) -> Unit,
    onToggleAppBlocked: (InstalledAppInfo, Boolean) -> Unit,
    onSelectDistractingPreset: () -> Unit,
    onClearBlocklist: () -> Unit,
    onRefreshApps: () -> Unit,
    onToggleNuclearMode: (Boolean) -> Unit,
    onStartSession: (Int) -> Unit,
    onStopSession: () -> Unit,
    onConfirmEmergencyOverride: (String, String, Int) -> Boolean,
    onOpenAccessibilitySettings: () -> Unit,
    onOpenUsageAccessSettings: () -> Unit,
    loadIconBitmap: suspend (String) -> Bitmap?,
    modifier: Modifier = Modifier
) {
    var showOverrideDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FocusColors.PureBlack)
            .padding(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "App Shield & Nuclear Lock",
                    style = MaterialTheme.typography.headlineMedium,
                    color = FocusColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = buildString {
                        append("${uiState.totalBlockedCount} blocklisted · ${uiState.totalInstalledCount} installed")
                        if (uiState.isNuclearLocked) append(" · Settings Locked")
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = if (uiState.isNuclearLocked) FocusColors.RegimentalBrass else FocusColors.TextSecondary
                )
            }
            OutlinedButton(
                onClick = onRefreshApps,
                border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                shape = RoundedCornerShape(6.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text("Scan", style = MaterialTheme.typography.labelMedium, color = FocusColors.TextPrimary)
            }
        }

        BlockingEnginePanel(
            uiState = uiState,
            onToggleNuclearMode = onToggleNuclearMode,
            onStartSession = onStartSession,
            onStopSession = onStopSession,
            onRequestEmergencyOverride = { showOverrideDialog = true },
            onOpenAccessibilitySettings = onOpenAccessibilitySettings,
            onOpenUsageAccessSettings = onOpenUsageAccessSettings
        )

        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchQueryChange,
            singleLine = true,
            placeholder = {
                Text("Search installed apps or packages...", color = FocusColors.TextMuted)
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = FocusColors.CharcoalSurface,
                unfocusedContainerColor = FocusColors.CharcoalSurface,
                focusedBorderColor = FocusColors.TacticalCrimsonBright,
                unfocusedBorderColor = FocusColors.HairlineBorder,
                focusedTextColor = FocusColors.TextPrimary,
                unfocusedTextColor = FocusColors.TextPrimary
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BlockFilterMode.entries.forEach { mode ->
                val selected = uiState.filterMode == mode
                FilterChip(
                    selected = selected,
                    onClick = { onFilterModeSelected(mode) },
                    label = { Text(mode.label, style = MaterialTheme.typography.labelSmall) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = FocusColors.TacticalCrimson,
                        selectedLabelColor = FocusColors.TextPrimary,
                        containerColor = FocusColors.CharcoalSurface,
                        labelColor = FocusColors.TextSecondary
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selected,
                        borderColor = FocusColors.HairlineBorder,
                        selectedBorderColor = FocusColors.TacticalCrimsonBright
                    )
                )
            }

            AppCategory.entries.forEach { category ->
                val selected = uiState.selectedCategory == category
                FilterChip(
                    selected = selected,
                    onClick = {
                        onCategorySelected(if (selected) null else category)
                    },
                    label = { Text(category.label, style = MaterialTheme.typography.labelSmall) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = FocusColors.CharcoalElevated,
                        selectedLabelColor = FocusColors.TextPrimary,
                        containerColor = FocusColors.PureBlack,
                        labelColor = FocusColors.TextMuted
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selected,
                        borderColor = FocusColors.HairlineBorder,
                        selectedBorderColor = FocusColors.TextSecondary
                    )
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onSelectDistractingPreset,
                enabled = !uiState.isNuclearLocked,
                border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = FocusColors.TextPrimary),
                shape = RoundedCornerShape(6.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("Select Social & Video", style = MaterialTheme.typography.labelSmall)
            }
            OutlinedButton(
                onClick = onClearBlocklist,
                enabled = !uiState.isNuclearLocked,
                border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = FocusColors.TextSecondary),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text("Clear", style = MaterialTheme.typography.labelSmall)
            }
        }

        when {
            uiState.isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = FocusColors.TacticalCrimsonBright)
                }
            }
            uiState.errorMessage != null -> {
                Surface(
                    color = FocusColors.CharcoalSurface,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, FocusColors.TacticalCrimsonBright),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = uiState.errorMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = FocusColors.TacticalCrimsonBright,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
            uiState.apps.isEmpty() -> {
                Surface(
                    color = FocusColors.CharcoalSurface,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "No installed apps match the current filter.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = FocusColors.TextSecondary,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.apps, key = { it.packageName }) { app ->
                        AppRowItem(
                            app = app,
                            isSettingsLocked = uiState.isNuclearLocked,
                            loadIconBitmap = loadIconBitmap,
                            onToggleBlocked = { blocked -> onToggleAppBlocked(app, blocked) }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(12.dp)) }
                }
            }
        }
    }

    if (showOverrideDialog && uiState.isNuclearLocked) {
        EmergencyOverrideDialog(
            sessionLabel = uiState.activeSession?.sessionLabel ?: "Nuclear Discipline Lock",
            remainingMillis = uiState.remainingMillis,
            onDismiss = { showOverrideDialog = false },
            onConfirm = { reason, phrase, delayLeft ->
                if (onConfirmEmergencyOverride(reason, phrase, delayLeft)) {
                    showOverrideDialog = false
                }
            }
        )
    }
}

@Composable
private fun BlockingEnginePanel(
    uiState: AppSelectionUiState,
    onToggleNuclearMode: (Boolean) -> Unit,
    onStartSession: (Int) -> Unit,
    onStopSession: () -> Unit,
    onRequestEmergencyOverride: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit,
    onOpenUsageAccessSettings: () -> Unit
) {
    val activeSession = uiState.activeSession
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(
            width = 1.dp,
            color = when {
                uiState.isNuclearLocked -> FocusColors.RegimentalBrass
                activeSession != null -> FocusColors.TacticalCrimsonBright
                else -> FocusColors.HairlineBorder
            }
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (!uiState.accessibilityEnabled || !uiState.usageAccessGranted) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (!uiState.accessibilityEnabled) "Accessibility Shield Disabled" else "Usage Access Recommended",
                            style = MaterialTheme.typography.bodyMedium,
                            color = FocusColors.WarningAmber,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Enable FOCUS//OS Accessibility Service to enforce real foreground blocking.",
                            style = MaterialTheme.typography.labelSmall,
                            color = FocusColors.TextSecondary
                        )
                    }
                    OutlinedButton(
                        onClick = if (!uiState.accessibilityEnabled) onOpenAccessibilitySettings else onOpenUsageAccessSettings,
                        border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text("Enable", style = MaterialTheme.typography.labelSmall, color = FocusColors.TextPrimary)
                    }
                }
            }

            if (activeSession != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (uiState.isNuclearLocked) {
                                "NUCLEAR LOCK ACTIVE · SETTINGS SEALED"
                            } else {
                                "Blocking Active · ${activeSession.sessionLabel}"
                            },
                            style = MaterialTheme.typography.labelMedium,
                            color = if (uiState.isNuclearLocked) {
                                FocusColors.RegimentalBrass
                            } else {
                                FocusColors.TacticalCrimsonBright
                            }
                        )
                        Text(
                            text = "${BlockingEvaluator.formatCountdownMillis(uiState.remainingMillis)} remaining · ${uiState.totalBlockedCount} apps restricted",
                            style = MaterialTheme.typography.titleMedium,
                            color = FocusColors.TextPrimary
                        )
                    }
                    if (uiState.isNuclearLocked) {
                        OutlinedButton(
                            onClick = onRequestEmergencyOverride,
                            border = BorderStroke(1.dp, FocusColors.TacticalCrimsonBright),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                "Emergency Override",
                                style = MaterialTheme.typography.labelSmall,
                                color = FocusColors.TacticalCrimsonBright
                            )
                        }
                    } else {
                        OutlinedButton(
                            onClick = onStopSession,
                            border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("End & Restore", style = MaterialTheme.typography.labelSmall, color = FocusColors.TextPrimary)
                        }
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Nuclear Mode",
                            style = MaterialTheme.typography.bodyMedium,
                            color = FocusColors.RegimentalBrass,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Locks blocklist settings, persists across reboot, requires emergency override",
                            style = MaterialTheme.typography.labelSmall,
                            color = FocusColors.TextMuted
                        )
                    }
                    Switch(
                        checked = uiState.nuclearModeSelected,
                        onCheckedChange = onToggleNuclearMode,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = FocusColors.PureBlack,
                            checkedTrackColor = FocusColors.RegimentalBrass,
                            uncheckedThumbColor = FocusColors.TextSecondary,
                            uncheckedTrackColor = FocusColors.PureBlack,
                            uncheckedBorderColor = FocusColors.HairlineBorder
                        )
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    listOf(25, 45, 60).forEach { mins ->
                        Button(
                            onClick = { onStartSession(mins) },
                            enabled = uiState.totalBlockedCount > 0,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (uiState.nuclearModeSelected) {
                                    FocusColors.RegimentalBrass
                                } else {
                                    FocusColors.TacticalCrimson
                                },
                                contentColor = if (uiState.nuclearModeSelected) {
                                    FocusColors.PureBlack
                                } else {
                                    FocusColors.TextPrimary
                                },
                                disabledContainerColor = FocusColors.CharcoalElevated,
                                disabledContentColor = FocusColors.TextMuted
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = if (uiState.nuclearModeSelected) "Nuclear ${mins}m" else "Lock ${mins}m",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }

            Text(
                text = "Safety: Dialer & 112/911 calls stay accessible. Reboot recovery uses FocusBootReceiver; Safe Mode & uninstall limits require Device Owner.",
                style = MaterialTheme.typography.labelSmall,
                color = FocusColors.TextMuted
            )

            if (uiState.recentAttempts.isNotEmpty()) {
                val latest = uiState.recentAttempts.first()
                Text(
                    text = "Last intercepted: ${latest.appName} (${uiState.recentAttempts.size} logged)",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.TextMuted
                )
            }
        }
    }
}

@Composable
private fun EmergencyOverrideDialog(
    sessionLabel: String,
    remainingMillis: Long,
    onDismiss: () -> Unit,
    onConfirm: (reason: String, typedPhrase: String, remainingDelaySeconds: Int) -> Unit
) {
    var reason by remember { mutableStateOf("") }
    var typedPhrase by remember { mutableStateOf("") }
    var delayLeft by remember { mutableIntStateOf(NuclearModePolicy.OVERRIDE_HOLD_SECONDS) }

    LaunchedEffect(Unit) {
        while (delayLeft > 0) {
            delay(1_000L)
            delayLeft -= 1
        }
    }

    val eval = NuclearModePolicy.evaluateEmergencyOverride(
        reason = reason,
        typedPhrase = typedPhrase,
        remainingDelaySeconds = delayLeft
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = FocusColors.CharcoalSurface,
        titleContentColor = FocusColors.TextPrimary,
        textContentColor = FocusColors.TextSecondary,
        title = {
            Column {
                Text(
                    text = "EMERGENCY OVERRIDE",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.RegimentalBrass
                )
                Text(
                    text = "Abort $sessionLabel?",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Remaining lock: ${BlockingEvaluator.formatCountdownMillis(remainingMillis)} · Security wait: ${if (delayLeft > 0) "${delayLeft}s" else "Cleared"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (delayLeft > 0) FocusColors.RegimentalBrass else FocusColors.NominalGreen
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Emergency reason (min 12 chars)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = typedPhrase,
                    onValueChange = { typedPhrase = it },
                    label = { Text("Type: ${NuclearModePolicy.EMERGENCY_OVERRIDE_PHRASE}") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = eval.message,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (eval.allowed) FocusColors.NominalGreen else FocusColors.TextMuted
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(reason, typedPhrase, delayLeft) },
                enabled = eval.allowed,
                colors = ButtonDefaults.buttonColors(
                    containerColor = FocusColors.TacticalCrimson,
                    contentColor = FocusColors.TextPrimary
                )
            ) {
                Text("Confirm Override")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Keep Locked", color = FocusColors.TextSecondary)
            }
        }
    )
}

@Composable
private fun AppRowItem(
    app: InstalledAppInfo,
    isSettingsLocked: Boolean,
    loadIconBitmap: suspend (String) -> Bitmap?,
    onToggleBlocked: (Boolean) -> Unit
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(
            width = 1.dp,
            color = if (app.isBlocked) FocusColors.TacticalCrimson else FocusColors.HairlineBorder
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AppIconImage(
                packageName = app.packageName,
                appName = app.appName,
                loadIcon = loadIconBitmap
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = app.appName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = FocusColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${app.category.label} · ${app.packageName}",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.TextMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (app.isProtectedSafetyApp) {
                Text(
                    text = "Protected",
                    style = MaterialTheme.typography.labelSmall,
                    color = FocusColors.NominalGreen
                )
            } else {
                Switch(
                    checked = app.isBlocked,
                    enabled = !isSettingsLocked,
                    onCheckedChange = onToggleBlocked,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = FocusColors.TextPrimary,
                        checkedTrackColor = FocusColors.TacticalCrimsonBright,
                        uncheckedThumbColor = FocusColors.TextSecondary,
                        uncheckedTrackColor = FocusColors.PureBlack,
                        uncheckedBorderColor = FocusColors.HairlineBorder
                    )
                )
            }
        }
    }
}
