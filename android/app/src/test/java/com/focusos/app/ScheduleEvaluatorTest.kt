package com.focusos.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime

class ScheduleEvaluatorTest {

    @Test
    fun `matches same day schedule within exact hour and minute bounds`() {
        val schedule = DailyBlockScheduleItem(
            id = 1L,
            label = "Morning Calculus",
            startHour = 5,
            startMinute = 30,
            endHour = 8,
            endMinute = 0,
            daysMask = ScheduleEvaluator.WEEKDAYS_MASK,
            isEnabled = true,
            isNuclearMode = false,
            linkedMissionId = 1L,
            linkedPackages = emptyList()
        )
        // 2026-11-16 is Monday
        assertTrue(ScheduleEvaluator.isScheduleActiveAt(schedule, LocalDateTime.of(2026, 11, 16, 6, 15)))
        assertFalse(ScheduleEvaluator.isScheduleActiveAt(schedule, LocalDateTime.of(2026, 11, 16, 8, 0)))
        // 2026-11-15 is Sunday
        assertFalse(ScheduleEvaluator.isScheduleActiveAt(schedule, LocalDateTime.of(2026, 11, 15, 6, 15)))
    }

    @Test
    fun `handles overnight wraparound schedules across midnight`() {
        val schedule = DailyBlockScheduleItem(
            id = 2L,
            label = "Night Standdown",
            startHour = 22,
            startMinute = 0,
            endHour = 5,
            endMinute = 0,
            daysMask = ScheduleEvaluator.dayBitForIsoValue(5), // Friday only
            isEnabled = true,
            isNuclearMode = true,
            linkedMissionId = null,
            linkedPackages = emptyList()
        )
        // Saturday 02:30 AM spills from Friday 22:00
        val satEarly = ZonedDateTime.of(2026, 11, 21, 2, 30, 0, 0, ZoneId.of("UTC"))
        assertTrue(ScheduleEvaluator.isScheduleActiveAt(schedule, satEarly.toLocalDateTime()))
        assertEquals(150 * 60_000L, ScheduleEvaluator.computeRemainingMillis(schedule, satEarly))
    }

    @Test
    fun `resolveEffectiveBlocklist seals base list in nuclear mode and strips safety packages`() {
        val merged = ScheduleEvaluator.resolveEffectiveBlocklist(
            baseBlockedPackages = setOf("com.google.android.youtube"),
            missionLinkedPackages = listOf("com.instagram.android", "com.android.dialer"),
            isNuclearLockActive = false
        )
        assertEquals(setOf("com.google.android.youtube", "com.instagram.android"), merged)

        val sealed = ScheduleEvaluator.resolveEffectiveBlocklist(
            baseBlockedPackages = setOf("com.google.android.youtube"),
            missionLinkedPackages = listOf("com.instagram.android"),
            isNuclearLockActive = true
        )
        assertEquals(setOf("com.google.android.youtube"), sealed)
    }

    @Test
    fun `evaluateSchedules prioritizes nuclear window over standard window`() {
        val now = ZonedDateTime.of(2026, 11, 16, 6, 0, 0, 0, ZoneId.of("UTC"))
        val standard = DailyBlockScheduleItem(1L, "Standard", 5, 0, 8, 0, ScheduleEvaluator.WEEKDAYS_MASK, true, false, null, emptyList())
        val nuclear = DailyBlockScheduleItem(2L, "Nuclear", 5, 30, 7, 0, ScheduleEvaluator.WEEKDAYS_MASK, true, true, 1L, emptyList())

        val eval = ScheduleEvaluator.evaluateSchedules(listOf(standard, nuclear), now)
        assertEquals(2, eval.activeCount)
        assertNotNull(eval.activeSchedule)
        assertEquals(2L, eval.activeSchedule?.id)
    }
}
