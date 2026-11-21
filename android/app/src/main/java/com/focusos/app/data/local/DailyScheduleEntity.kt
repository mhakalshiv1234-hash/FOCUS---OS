package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_schedules")
data class DailyScheduleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val label: String,
    val startHour: Int,
    val startMinute: Int,
    val endHour: Int,
    val endMinute: Int,
    val daysMask: Int,
    val isEnabled: Boolean,
    val isNuclearMode: Boolean,
    val linkedMissionId: Long?,
    val linkedPackagesCsv: String,
    val createdAtEpochMs: Long
)
