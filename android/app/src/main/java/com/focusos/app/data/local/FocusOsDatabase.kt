package com.focusos.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Database(
    entities = [
        DailyMetricEntity::class,
        MissionEntity::class,
        BlockedAppEntity::class,
        FocusSessionEntity::class,
        BlockedAttemptEntity::class,
        NuclearOverrideLogEntity::class,
        DailyScheduleEntity::class
    ],
    version = 5,
    exportSchema = true
)
abstract class FocusOsDatabase : RoomDatabase() {
    abstract fun dailyMetricDao(): DailyMetricDao
    abstract fun missionDao(): MissionDao
    abstract fun blockedAppDao(): BlockedAppDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun blockedAttemptDao(): BlockedAttemptDao
    abstract fun nuclearOverrideDao(): NuclearOverrideDao
    abstract fun dailyScheduleDao(): DailyScheduleDao

    companion object {
        @Volatile
        private var INSTANCE: FocusOsDatabase? = null

        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `blocked_apps` (
                        `packageName` TEXT NOT NULL,
                        `appName` TEXT NOT NULL,
                        `category` TEXT NOT NULL,
                        `addedAtEpochMs` INTEGER NOT NULL,
                        PRIMARY KEY(`packageName`)
                    )
                    """.trimIndent()
                )
            }
        }

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `focus_sessions` (
                        `id` INTEGER NOT NULL,
                        `isActive` INTEGER NOT NULL,
                        `sessionLabel` TEXT NOT NULL,
                        `startedAtEpochMs` INTEGER NOT NULL,
                        `endsAtEpochMs` INTEGER NOT NULL,
                        `durationMinutes` INTEGER NOT NULL,
                        `restoredAtEpochMs` INTEGER,
                        PRIMARY KEY(`id`)
                    )
                    """.trimIndent()
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `blocked_attempts` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `packageName` TEXT NOT NULL,
                        `appName` TEXT NOT NULL,
                        `attemptedAtEpochMs` INTEGER NOT NULL,
                        `dateKey` TEXT NOT NULL
                    )
                    """.trimIndent()
                )
            }
        }

        val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE `focus_sessions` ADD COLUMN `isNuclearMode` INTEGER NOT NULL DEFAULT 0"
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `nuclear_override_logs` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `sessionLabel` TEXT NOT NULL,
                        `reason` TEXT NOT NULL,
                        `remainingMillisAtAbort` INTEGER NOT NULL,
                        `overriddenAtEpochMs` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
            }
        }

        val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "ALTER TABLE `missions` ADD COLUMN `linkedPackagesCsv` TEXT NOT NULL DEFAULT ''"
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `daily_schedules` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `label` TEXT NOT NULL,
                        `startHour` INTEGER NOT NULL,
                        `startMinute` INTEGER NOT NULL,
                        `endHour` INTEGER NOT NULL,
                        `endMinute` INTEGER NOT NULL,
                        `daysMask` INTEGER NOT NULL,
                        `isEnabled` INTEGER NOT NULL,
                        `isNuclearMode` INTEGER NOT NULL,
                        `linkedMissionId` INTEGER,
                        `linkedPackagesCsv` TEXT NOT NULL,
                        `createdAtEpochMs` INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
            }
        }

        fun getInstance(context: Context): FocusOsDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    FocusOsDatabase::class.java,
                    "focus_os.db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
                    .addCallback(SeedDatabaseCallback())
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }

    private class SeedDatabaseCallback : Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            val database = INSTANCE ?: return
            CoroutineScope(Dispatchers.IO).launch {
                val today = LocalDate.now()
                val fmt = DateTimeFormatter.ISO_LOCAL_DATE

                // Stage 1 initial baseline metrics persisted in Room; real usage stats populate in Stage 2/6
                val seedDays = listOf(
                    DailyMetricEntity(today.minusDays(6).format(fmt), focusMinutes = 145, screenTimeMinutes = 230, distractingMinutes = 52, blockedAttempts = 4, missionsCompleted = 1),
                    DailyMetricEntity(today.minusDays(5).format(fmt), focusMinutes = 190, screenTimeMinutes = 205, distractingMinutes = 34, blockedAttempts = 7, missionsCompleted = 2),
                    DailyMetricEntity(today.minusDays(4).format(fmt), focusMinutes = 160, screenTimeMinutes = 240, distractingMinutes = 48, blockedAttempts = 5, missionsCompleted = 1),
                    DailyMetricEntity(today.minusDays(3).format(fmt), focusMinutes = 215, screenTimeMinutes = 195, distractingMinutes = 22, blockedAttempts = 9, missionsCompleted = 2),
                    DailyMetricEntity(today.minusDays(2).format(fmt), focusMinutes = 240, screenTimeMinutes = 180, distractingMinutes = 14, blockedAttempts = 11, missionsCompleted = 3),
                    DailyMetricEntity(today.minusDays(1).format(fmt), focusMinutes = 205, screenTimeMinutes = 210, distractingMinutes = 28, blockedAttempts = 6, missionsCompleted = 2),
                    DailyMetricEntity(today.format(fmt), focusMinutes = 185, screenTimeMinutes = 142, distractingMinutes = 18, blockedAttempts = 8, missionsCompleted = 2)
                )
                database.dailyMetricDao().insertAllIgnore(seedDays)

                val now = System.currentTimeMillis()
                val seedMissions = listOf(
                    MissionEntity(
                        title = "Mathematics — Calculus Problem Set",
                        subject = "Mathematics",
                        targetMinutes = 180,
                        completedMinutes = 115,
                        isCompleted = false,
                        isActive = true,
                        createdAtEpochMs = now,
                        linkedPackagesCsv = "com.zhiliaoapp.musically,com.google.android.youtube,com.instagram.android"
                    ),
                    MissionEntity(
                        title = "English — Critical Reading & Essays",
                        subject = "English",
                        targetMinutes = 60,
                        completedMinutes = 60,
                        isCompleted = true,
                        isActive = false,
                        createdAtEpochMs = now + 1,
                        linkedPackagesCsv = "com.google.android.youtube"
                    ),
                    MissionEntity(
                        title = "General Ability Test — Timed Drill",
                        subject = "General Ability Test",
                        targetMinutes = 120,
                        completedMinutes = 40,
                        isCompleted = false,
                        isActive = false,
                        createdAtEpochMs = now + 2,
                        linkedPackagesCsv = "com.zhiliaoapp.musically,com.instagram.android,com.reddit.frontpage"
                    ),
                    MissionEntity(
                        title = "Personal Reading — Deep Work Chapter",
                        subject = "Personal Reading",
                        targetMinutes = 30,
                        completedMinutes = 30,
                        isCompleted = true,
                        isActive = false,
                        createdAtEpochMs = now + 3,
                        linkedPackagesCsv = ""
                    )
                )
                database.missionDao().insertAll(seedMissions)

                val seedSchedules = listOf(
                    DailyScheduleEntity(
                        label = "Morning Drill & Calculus Block",
                        startHour = 5,
                        startMinute = 30,
                        endHour = 8,
                        endMinute = 0,
                        daysMask = 0b0111111, // Mon–Sat
                        isEnabled = true,
                        isNuclearMode = false,
                        linkedMissionId = 1L,
                        linkedPackagesCsv = "com.zhiliaoapp.musically,com.google.android.youtube,com.instagram.android",
                        createdAtEpochMs = now
                    ),
                    DailyScheduleEntity(
                        label = "Evening Quiet Study & GAT Prep",
                        startHour = 19,
                        startMinute = 0,
                        endHour = 21,
                        endMinute = 30,
                        daysMask = 0b1111111, // Daily
                        isEnabled = true,
                        isNuclearMode = true,
                        linkedMissionId = 3L,
                        linkedPackagesCsv = "com.zhiliaoapp.musically,com.google.android.youtube,com.instagram.android,com.reddit.frontpage",
                        createdAtEpochMs = now + 1
                    )
                )
                database.dailyScheduleDao().insertAll(seedSchedules)
            }
        }
    }
}
