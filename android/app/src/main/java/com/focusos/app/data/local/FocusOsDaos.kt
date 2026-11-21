package com.focusos.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DailyMetricDao {
    @Query("SELECT * FROM daily_metrics WHERE dateKey = :dateKey LIMIT 1")
    fun observeMetricForDate(dateKey: String): Flow<DailyMetricEntity?>

    @Query("SELECT * FROM daily_metrics WHERE dateKey = :dateKey LIMIT 1")
    suspend fun getMetricForDateOnce(dateKey: String): DailyMetricEntity?

    @Query("SELECT * FROM daily_metrics ORDER BY dateKey DESC LIMIT 7")
    fun observeLastSevenDays(): Flow<List<DailyMetricEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMetric(metric: DailyMetricEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAllIgnore(metrics: List<DailyMetricEntity>)

    @Query("UPDATE daily_metrics SET blockedAttempts = blockedAttempts + 1 WHERE dateKey = :dateKey")
    suspend fun incrementBlockedAttempt(dateKey: String)

    @Query("UPDATE daily_metrics SET focusMinutes = focusMinutes + :minutes, screenTimeMinutes = screenTimeMinutes + :minutes WHERE dateKey = :dateKey")
    suspend fun addFocusMinutes(dateKey: String, minutes: Int)

    @Query("UPDATE daily_metrics SET missionsCompleted = missionsCompleted + 1 WHERE dateKey = :dateKey")
    suspend fun incrementMissionsCompleted(dateKey: String)

    @Query("UPDATE daily_metrics SET screenTimeMinutes = :screenTimeMinutes, distractingMinutes = :distractingMinutes WHERE dateKey = :dateKey")
    suspend fun updateUsageMetrics(dateKey: String, screenTimeMinutes: Int, distractingMinutes: Int)
}

@Dao
interface MissionDao {
    @Query("SELECT * FROM missions ORDER BY isActive DESC, createdAtEpochMs ASC")
    fun observeAllMissions(): Flow<List<MissionEntity>>

    @Query("SELECT * FROM missions WHERE id = :missionId LIMIT 1")
    suspend fun getMissionByIdOnce(missionId: Long): MissionEntity?

    @Query("UPDATE missions SET isActive = CASE WHEN id = :missionId THEN 1 ELSE 0 END")
    suspend fun setActiveMission(missionId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMission(mission: MissionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(missions: List<MissionEntity>)

    @Query(
        """
        UPDATE missions
        SET title = :title,
            subject = :subject,
            targetMinutes = :targetMinutes,
            isCompleted = CASE WHEN completedMinutes >= :targetMinutes THEN 1 ELSE 0 END,
            linkedPackagesCsv = :linkedPackagesCsv
        WHERE id = :missionId
        """
    )
    suspend fun updateMissionDetails(
        missionId: Long,
        title: String,
        subject: String,
        targetMinutes: Int,
        linkedPackagesCsv: String
    )

    @Query(
        """
        UPDATE missions
        SET completedMinutes = MIN(targetMinutes, completedMinutes + :deltaMinutes),
            isCompleted = CASE WHEN (completedMinutes + :deltaMinutes) >= targetMinutes THEN 1 ELSE 0 END
        WHERE id = :missionId
        """
    )
    suspend fun addMissionMinutes(missionId: Long, deltaMinutes: Int)

    @Query("DELETE FROM missions WHERE id = :missionId")
    suspend fun deleteMissionById(missionId: Long)
}

@Dao
interface BlockedAppDao {
    @Query("SELECT * FROM blocked_apps ORDER BY appName ASC")
    fun observeBlockedApps(): Flow<List<BlockedAppEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBlockedApp(app: BlockedAppEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(apps: List<BlockedAppEntity>)

    @Query("DELETE FROM blocked_apps WHERE packageName = :packageName")
    suspend fun removeBlockedApp(packageName: String)

    @Query("DELETE FROM blocked_apps")
    suspend fun clearAll()
}

@Dao
interface FocusSessionDao {
    @Query("SELECT * FROM focus_sessions WHERE id = 1 LIMIT 1")
    fun observeActiveSession(): Flow<FocusSessionEntity?>

    @Query("SELECT * FROM focus_sessions WHERE id = 1 LIMIT 1")
    suspend fun getSessionOnce(): FocusSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSession(session: FocusSessionEntity)

    @Query("UPDATE focus_sessions SET isActive = 0, restoredAtEpochMs = :restoredAtEpochMs WHERE id = 1")
    suspend fun deactivateSession(restoredAtEpochMs: Long)
}

@Dao
interface BlockedAttemptDao {
    @Insert
    suspend fun insertAttempt(attempt: BlockedAttemptEntity)

    @Query("SELECT * FROM blocked_attempts ORDER BY attemptedAtEpochMs DESC LIMIT 20")
    fun observeRecentAttempts(): Flow<List<BlockedAttemptEntity>>

    @Query("SELECT COUNT(*) FROM blocked_attempts WHERE dateKey = :dateKey")
    fun observeAttemptCountForDate(dateKey: String): Flow<Int>
}

@Dao
interface NuclearOverrideDao {
    @Insert
    suspend fun insertOverride(entry: NuclearOverrideLogEntity)

    @Query("SELECT * FROM nuclear_override_logs ORDER BY overriddenAtEpochMs DESC LIMIT 15")
    fun observeRecentOverrides(): Flow<List<NuclearOverrideLogEntity>>
}

@Dao
interface DailyScheduleDao {
    @Query("SELECT * FROM daily_schedules ORDER BY startHour ASC, startMinute ASC")
    fun observeAllSchedules(): Flow<List<DailyScheduleEntity>>

    @Query("SELECT * FROM daily_schedules WHERE isEnabled = 1")
    suspend fun getEnabledSchedulesOnce(): List<DailyScheduleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSchedule(schedule: DailyScheduleEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(schedules: List<DailyScheduleEntity>)

    @Query("UPDATE daily_schedules SET isEnabled = :enabled WHERE id = :scheduleId")
    suspend fun setScheduleEnabled(scheduleId: Long, enabled: Boolean)

    @Query("DELETE FROM daily_schedules WHERE id = :scheduleId")
    suspend fun deleteScheduleById(scheduleId: Long)
}

