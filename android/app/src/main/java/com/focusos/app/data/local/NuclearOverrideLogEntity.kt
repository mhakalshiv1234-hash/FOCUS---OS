package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "nuclear_override_logs")
data class NuclearOverrideLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val sessionLabel: String,
    val reason: String,
    val remainingMillisAtAbort: Long,
    val overriddenAtEpochMs: Long
)
