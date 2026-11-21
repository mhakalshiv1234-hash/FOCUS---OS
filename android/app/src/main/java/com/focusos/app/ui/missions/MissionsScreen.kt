package com.focusos.app.ui.missions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.focusos.app.domain.DailyBlockScheduleItem
import com.focusos.app.domain.ScheduleEvaluator
import com.focusos.app.domain.StudyMissionItem
import com.focusos.app.ui.theme.FocusColors

@Composable
fun MissionsScreen(
    uiState: MissionsUiState,
    onSaveMission: (Long?, String, String, Int, List<String>) -> Unit,
    onDeleteMission: (Long) -> Unit,
    onLaunchStudyBlock: (StudyMissionItem) -> Unit,
    onSaveSchedule: (String, Int, Int, Int, Int, Int, Boolean, Long?, List<String>) -> Unit,
    onToggleScheduleEnabled: (Long, Boolean) -> Unit,
    onDeleteSchedule: (Long) -> Unit
) {
    var showMissionDialog by remember { mutableStateOf(false) }
    var editingMission by remember { mutableStateOf<StudyMissionItem?>(null) }
    var showScheduleDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Missions & Scheduling",
                    style = MaterialTheme.typography.headlineMedium,
                    color = FocusColors.TextPrimary
                )
                Text(
                    text = uiState.scheduleEvaluation.nextTriggerSummary
                        ?: "Configure custom study missions and automated recurring block windows.",
                    style = MaterialTheme.typography.bodySmall,
                    color = FocusColors.TextSecondary
                )
                uiState.statusNotice?.let { notice ->
                    Text(
                        text = notice,
                        style = MaterialTheme.typography.bodySmall,
                        color = FocusColors.RegimentalBrass
                    )
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Study Missions (${uiState.missions.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
                Button(
                    onClick = {
                        editingMission = null
                        showMissionDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = FocusColors.TacticalCrimson,
                        contentColor = FocusColors.TextPrimary
                    ),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("New Mission")
                }
            }
        }

        items(uiState.missions, key = { "mission-${it.id}" }) { mission ->
            MissionCardItem(
                mission = mission,
                onEdit = {
                    editingMission = mission
                    showMissionDialog = true
                },
                onDelete = { onDeleteMission(mission.id) },
                onLaunchBlock = { onLaunchStudyBlock(mission) }
            )
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Daily Block Schedules (${uiState.schedules.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = FocusColors.TextPrimary
                )
                OutlinedButton(
                    onClick = { showScheduleDialog = true },
                    border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("New Schedule", color = FocusColors.TextPrimary)
                }
            }
        }

        items(uiState.schedules, key = { "sched-${it.id}" }) { schedule ->
            ScheduleCardItem(
                schedule = schedule,
                isActiveNow = uiState.scheduleEvaluation.activeSchedule?.id == schedule.id,
                onToggleEnabled = { enabled -> onToggleScheduleEnabled(schedule.id, enabled) },
                onDelete = { onDeleteSchedule(schedule.id) }
            )
        }
    }

    if (showMissionDialog) {
        MissionEditorDialog(
            initial = editingMission,
            onDismiss = { showMissionDialog = false },
            onConfirm = { title, subject, targetMinutes, linked ->
                onSaveMission(editingMission?.id, title, subject, targetMinutes, linked)
                showMissionDialog = false
            }
        )
    }

    if (showScheduleDialog) {
        ScheduleCreatorDialog(
            onDismiss = { showScheduleDialog = false },
            onConfirm = { label, sh, sm, eh, em, mask, nuclear ->
                onSaveSchedule(label, sh, sm, eh, em, mask, nuclear, null, emptyList())
                showScheduleDialog = false
            }
        )
    }
}

@Composable
private fun MissionCardItem(
    mission: StudyMissionItem,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onLaunchBlock: () -> Unit
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(
            width = 1.dp,
            color = if (mission.isActive) FocusColors.TacticalCrimsonBright else FocusColors.HairlineBorder
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = mission.title,
                        style = MaterialTheme.typography.titleSmall,
                        color = FocusColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "${mission.subject} · ${mission.completedMinutes}/${mission.targetMinutes} min" +
                            if (mission.linkedPackages.isNotEmpty()) " · ${mission.linkedPackages.size} linked apps" else "",
                        style = MaterialTheme.typography.labelSmall,
                        color = FocusColors.TextSecondary
                    )
                }
                Text(
                    text = if (mission.isCompleted) "Completed" else if (mission.isActive) "Active" else "Standby",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (mission.isCompleted) FocusColors.NominalGreen else if (mission.isActive) FocusColors.RegimentalBrass else FocusColors.TextMuted
                )
            }

            LinearProgressIndicator(
                progress = { mission.progressFraction },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = if (mission.isCompleted) FocusColors.NominalGreen else FocusColors.TacticalCrimsonBright,
                trackColor = FocusColors.CharcoalElevated
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onLaunchBlock,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = FocusColors.TacticalCrimson,
                        contentColor = FocusColors.TextPrimary
                    ),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Start Study Block")
                }
                OutlinedButton(
                    onClick = onEdit,
                    border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("Edit", color = FocusColors.TextPrimary)
                }
                TextButton(onClick = onDelete) {
                    Text("Delete", color = FocusColors.TextMuted)
                }
            }
        }
    }
}

@Composable
private fun ScheduleCardItem(
    schedule: DailyBlockScheduleItem,
    isActiveNow: Boolean,
    onToggleEnabled: (Boolean) -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        color = FocusColors.CharcoalSurface,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(
            width = 1.dp,
            color = if (isActiveNow) FocusColors.RegimentalBrass else FocusColors.HairlineBorder
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = schedule.label,
                    style = MaterialTheme.typography.titleSmall,
                    color = FocusColors.TextPrimary
                )
                Text(
                    text = "${ScheduleEvaluator.formatTime24h(schedule.startHour, schedule.startMinute)} – " +
                        "${ScheduleEvaluator.formatTime24h(schedule.endHour, schedule.endMinute)} · " +
                        ScheduleEvaluator.formatDaysMaskCompact(schedule.daysMask) +
                        if (schedule.isNuclearMode) " · Nuclear Lock" else "",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isActiveNow) FocusColors.RegimentalBrass else FocusColors.TextSecondary
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(
                    checked = schedule.isEnabled,
                    onCheckedChange = onToggleEnabled,
                    colors = SwitchDefaults.colors(checkedTrackColor = FocusColors.TacticalCrimson)
                )
                TextButton(onClick = onDelete) {
                    Text("Delete", color = FocusColors.TextMuted)
                }
            }
        }
    }
}

@Composable
private fun MissionEditorDialog(
    initial: StudyMissionItem?,
    onDismiss: () -> Unit,
    onConfirm: (String, String, Int, List<String>) -> Unit
) {
    var title by remember { mutableStateOf(initial?.title ?: "") }
    var subject by remember { mutableStateOf(initial?.subject ?: "") }
    var targetMinutes by remember { mutableIntStateOf(initial?.targetMinutes ?: 60) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = FocusColors.CharcoalSurface,
        titleContentColor = FocusColors.TextPrimary,
        textContentColor = FocusColors.TextSecondary,
        title = { Text(if (initial == null) "New Study Mission" else "Edit Study Mission") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Mission Title") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = subject,
                    onValueChange = { subject = it },
                    label = { Text("Subject") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = targetMinutes.toString(),
                    onValueChange = { targetMinutes = it.filter { c -> c.isDigit() }.toIntOrNull() ?: 60 },
                    label = { Text("Target Minutes (15–480)") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(title, subject, targetMinutes, initial?.linkedPackages ?: emptyList()) },
                colors = ButtonDefaults.buttonColors(containerColor = FocusColors.TacticalCrimson)
            ) {
                Text("Save Mission")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = FocusColors.TextSecondary)
            }
        }
    )
}

@Composable
private fun ScheduleCreatorDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Int, Int, Int, Int, Int, Boolean) -> Unit
) {
    var label by remember { mutableStateOf("Morning Deep Study") }
    var startHour by remember { mutableIntStateOf(6) }
    var endHour by remember { mutableIntStateOf(8) }
    var isNuclear by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = FocusColors.CharcoalSurface,
        titleContentColor = FocusColors.TextPrimary,
        textContentColor = FocusColors.TextSecondary,
        title = { Text("New Daily Block Schedule") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it },
                    label = { Text("Schedule Label") },
                    singleLine = true
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = startHour.toString(),
                        onValueChange = { startHour = (it.filter { c -> c.isDigit() }.toIntOrNull() ?: 6).coerceIn(0, 23) },
                        label = { Text("Start Hr") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = endHour.toString(),
                        onValueChange = { endHour = (it.filter { c -> c.isDigit() }.toIntOrNull() ?: 8).coerceIn(0, 23) },
                        label = { Text("End Hr") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Enforce Nuclear Mode")
                    Switch(checked = isNuclear, onCheckedChange = { isNuclear = it })
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(label, startHour, 0, endHour, 0, ScheduleEvaluator.ALL_DAYS_MASK, isNuclear) },
                colors = ButtonDefaults.buttonColors(containerColor = FocusColors.TacticalCrimson)
            ) {
                Text("Save Schedule")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = FocusColors.TextSecondary)
            }
        }
    )
}
