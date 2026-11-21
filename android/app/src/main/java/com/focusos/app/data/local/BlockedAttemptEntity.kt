package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "blocked_attempts")
data class BlockedAttemptEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val packageName: String,
    val appName: String,
    val attemptedAtEpochMs: Long,
    val dateKey: String
)
