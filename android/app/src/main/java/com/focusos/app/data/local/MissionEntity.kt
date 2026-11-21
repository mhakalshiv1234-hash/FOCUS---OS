package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "missions")
data class MissionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val title: String,
    val subject: String,
    val targetMinutes: Int,
    val completedMinutes: Int,
    val isCompleted: Boolean,
    val isActive: Boolean,
    val createdAtEpochMs: Long,
    val linkedPackagesCsv: String = ""
)
