package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey val id: Int = 1,
    val isActive: Boolean,
    val sessionLabel: String,
    val startedAtEpochMs: Long,
    val endsAtEpochMs: Long,
    val durationMinutes: Int,
    val restoredAtEpochMs: Long?,
    val isNuclearMode: Boolean = false
)
