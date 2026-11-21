package com.focusos.app

import androidx.room.testing.MigrationTestHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.focusos.app.data.local.FocusOsDatabase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException

@RunWith(AndroidJUnit4::class)
class FocusOsDatabaseMigrationTest {

    private val testDbName = "focus_os_migration_test.db"

    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        FocusOsDatabase::class.java,
        emptyList(),
        FrameworkSQLiteOpenHelperFactory()
    )

    @Test
    @Throws(IOException::class)
    fun migrate1To5_preservesMetricsAndMissionsAcrossAllStages() {
        helper.createDatabase(testDbName, 1).apply {
            execSQL(
                """
                INSERT INTO daily_metrics (dateKey, focusMinutes, screenTimeMinutes, distractingMinutes, blockedAttempts, missionsCompleted)
                VALUES ('2026-11-21', 185, 142, 18, 8, 2)
                """.trimIndent()
            )
            execSQL(
                """
                INSERT INTO missions (id, title, subject, targetMinutes, completedMinutes, isCompleted, isActive, createdAtEpochMs)
                VALUES (1, 'Mathematics — Calculus', 'Mathematics', 180, 115, 0, 1, 1763600000000)
                """.trimIndent()
            )
            close()
        }

        val migratedDb = helper.runMigrationsAndValidate(
            testDbName,
            5,
            true,
            FocusOsDatabase.MIGRATION_1_2,
            FocusOsDatabase.MIGRATION_2_3,
            FocusOsDatabase.MIGRATION_3_4,
            FocusOsDatabase.MIGRATION_4_5
        )

        migratedDb.query("SELECT focusMinutes, blockedAttempts FROM daily_metrics WHERE dateKey = '2026-11-21'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals(185, cursor.getInt(0))
            assertEquals(8, cursor.getInt(1))
        }

        migratedDb.query("SELECT title, linkedPackagesCsv FROM missions WHERE id = 1").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("Mathematics — Calculus", cursor.getString(0))
            assertEquals("", cursor.getString(1))
        }

        migratedDb.query("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_schedules'").use { cursor ->
            assertTrue(cursor.moveToFirst())
        }
    }
}
