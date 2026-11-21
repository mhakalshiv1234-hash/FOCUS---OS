package com.focusos.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_metrics")
data class DailyMetricEntity(
    @PrimaryKey val dateKey: String,
    val focusMinutes: Int,
    val screenTimeMinutes: Int,
    val distractingMinutes: Int,
    val blockedAttempts: Int,
    val missionsCompleted: Int
)
