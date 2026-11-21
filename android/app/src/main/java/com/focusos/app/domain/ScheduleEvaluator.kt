package com.focusos.app.domain

import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.TemporalAdjusters

object ScheduleEvaluator {

    const val ALL_DAYS_MASK = 0b1111111
    const val WEEKDAYS_MASK = 0b0011111

    fun dayBitForIsoValue(isoDayOfWeek: Int): Int {
        val clamped = isoDayOfWeek.coerceIn(1, 7)
        return 1 shl (clamped - 1)
    }

    fun isDayIncluded(daysMask: Int, dayOfWeek: DayOfWeek): Boolean {
        val bit = dayBitForIsoValue(dayOfWeek.value)
        return (daysMask and bit) != 0
    }

    fun formatTime24h(hour: Int, minute: Int): String {
        val safeH = hour.coerceIn(0, 23)
        val safeM = minute.coerceIn(0, 59)
        return String.format("%02d:%02d", safeH, safeM)
    }

    fun formatDaysMaskCompact(daysMask: Int): String {
        if ((daysMask and ALL_DAYS_MASK) == ALL_DAYS_MASK) return "Daily"
        if ((daysMask and ALL_DAYS_MASK) == WEEKDAYS_MASK) return "Mon–Fri"
        val names = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        val selected = names.indices
            .filter { (daysMask and (1 shl it)) != 0 }
            .map { names[it] }
        return if (selected.isEmpty()) "No Days" else selected.joinToString(", ")
    }

    fun encodePackagesCsv(packages: List<String>): String {
        return packages
            .asSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() && !AppSelectionFilter.isProtectedSafetyPackage(it) }
            .distinct()
            .joinToString(",")
    }

    fun decodePackagesCsv(csv: String): List<String> {
        if (csv.isBlank()) return emptyList()
        return csv.split(',')
            .map { it.trim() }
            .filter { it.isNotEmpty() && !AppSelectionFilter.isProtectedSafetyPackage(it) }
            .distinct()
    }

    fun resolveEffectiveBlocklist(
        baseBlockedPackages: Set<String>,
        missionLinkedPackages: List<String>,
        isNuclearLockActive: Boolean
    ): Set<String> {
        val safeBase = baseBlockedPackages.filterNot { AppSelectionFilter.isProtectedSafetyPackage(it) }.toSet()
        if (isNuclearLockActive) {
            return safeBase
        }
        val safeLinked = missionLinkedPackages.filterNot { AppSelectionFilter.isProtectedSafetyPackage(it) }
        return safeBase + safeLinked
    }

    fun isScheduleActiveAt(schedule: DailyBlockScheduleItem, now: LocalDateTime): Boolean {
        if (!schedule.isEnabled || (schedule.daysMask and ALL_DAYS_MASK) == 0) {
            return false
        }
        val startMin = schedule.startHour * 60 + schedule.startMinute
        val endMin = schedule.endHour * 60 + schedule.endMinute
        if (startMin == endMin) return false
        val nowMin = now.hour * 60 + now.minute

        return if (endMin > startMin) {
            isDayIncluded(schedule.daysMask, now.dayOfWeek) && nowMin in startMin until endMin
        } else {
            val activeLateTonight = isDayIncluded(schedule.daysMask, now.dayOfWeek) && nowMin >= startMin
            val yesterday = now.dayOfWeek.minus(1)
            val activeEarlyMorning = isDayIncluded(schedule.daysMask, yesterday) && nowMin < endMin
            activeLateTonight || activeEarlyMorning
        }
    }

    fun computeRemainingMillis(schedule: DailyBlockScheduleItem, now: ZonedDateTime): Long {
        val local = now.toLocalDateTime()
        if (!isScheduleActiveAt(schedule, local)) return 0L

        val startMin = schedule.startHour * 60 + schedule.startMinute
        val endMin = schedule.endHour * 60 + schedule.endMinute
        val nowMin = local.hour * 60 + local.minute
        val remainingMinutes = when {
            endMin > startMin -> endMin - nowMin
            nowMin >= startMin -> (24 * 60 - nowMin) + endMin
            else -> endMin - nowMin
        }
        return (remainingMinutes * 60_000L - local.second * 1_000L).coerceAtLeast(0L)
    }

    fun computeNextTriggerEpochMs(
        schedule: DailyBlockScheduleItem,
        now: ZonedDateTime = ZonedDateTime.now(ZoneId.systemDefault())
    ): Long? {
        if (!schedule.isEnabled || (schedule.daysMask and ALL_DAYS_MASK) == 0) return null
        val localNow = now.toLocalDateTime()
        for (offset in 0..7) {
            val candidateDate = localNow.toLocalDate().plusDays(offset.toLong())
            if (!isDayIncluded(schedule.daysMask, candidateDate.dayOfWeek)) continue
            val candidateZoned = candidateDate
                .atTime(schedule.startHour, schedule.startMinute)
                .atZone(now.zone)
            if (candidateZoned.isAfter(now)) {
                return candidateZoned.toInstant().toEpochMilli()
            }
        }
        val nextWeek = localNow.toLocalDate()
            .with(TemporalAdjusters.next(localNow.dayOfWeek))
            .atTime(schedule.startHour, schedule.startMinute)
            .atZone(now.zone)
        return nextWeek.toInstant().toEpochMilli()
    }

    fun evaluateSchedules(
        schedules: List<DailyBlockScheduleItem>,
        now: ZonedDateTime
    ): ScheduleEvaluation {
        val local = now.toLocalDateTime()
        val active = schedules.filter { isScheduleActiveAt(it, local) }
        val prioritized = active.sortedWith(
            compareByDescending<DailyBlockScheduleItem> { it.isNuclearMode }
                .thenByDescending { computeRemainingMillis(it, now) }
        )
        val top = prioritized.firstOrNull()
        if (top != null) {
            return ScheduleEvaluation(
                activeSchedule = top,
                activeCount = active.size,
                remainingMillis = computeRemainingMillis(top, now),
                nextTriggerSummary = "Active until ${formatTime24h(top.endHour, top.endMinute)}"
            )
        }

        val earliestNext = schedules
            .asSequence()
            .filter { it.isEnabled }
            .mapNotNull { sched ->
                computeNextTriggerEpochMs(sched, now)?.let { epoch -> sched to epoch }
            }
            .minByOrNull { it.second }

        val summary = earliestNext?.first?.let { sched ->
            "${sched.label} · ${formatTime24h(sched.startHour, sched.startMinute)}"
        }

        return ScheduleEvaluation(
            activeSchedule = null,
            activeCount = 0,
            remainingMillis = 0L,
            nextTriggerSummary = summary
        )
    }
}
