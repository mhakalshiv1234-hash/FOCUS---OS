package com.focusos.app.domain

data class StudyMissionItem(
    val id: Long,
    val title: String,
    val subject: String,
    val targetMinutes: Int,
    val completedMinutes: Int,
    val isCompleted: Boolean,
    val isActive: Boolean,
    val linkedPackages: List<String>
) {
    val progressFraction: Float
        get() = if (targetMinutes <= 0) 0f else (completedMinutes.toFloat() / targetMinutes.toFloat()).coerceIn(0f, 1f)
}

data class DailyBlockScheduleItem(
    val id: Long,
    val label: String,
    val startHour: Int,
    val startMinute: Int,
    val endHour: Int,
    val endMinute: Int,
    val daysMask: Int,
    val isEnabled: Boolean,
    val isNuclearMode: Boolean,
    val linkedMissionId: Long?,
    val linkedPackages: List<String>
)

data class ScheduleEvaluation(
    val activeSchedule: DailyBlockScheduleItem?,
    val activeCount: Int,
    val remainingMillis: Long,
    val nextTriggerSummary: String?
)
