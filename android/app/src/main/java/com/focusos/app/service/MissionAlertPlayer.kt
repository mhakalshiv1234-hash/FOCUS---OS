package com.focusos.app.service

import android.media.AudioManager
import android.media.ToneGenerator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Plays a subtle non-intrusive dual notification tone when an active study mission
 * reaches its configured target duration.
 */
object MissionAlertPlayer {

    fun playTargetReachedChime(scope: CoroutineScope, volumePercent: Int = 45) {
        scope.launch(Dispatchers.Default) {
            var generator: ToneGenerator? = null
            try {
                generator = ToneGenerator(
                    AudioManager.STREAM_NOTIFICATION,
                    volumePercent.coerceIn(10, 80)
                )
                generator.startTone(ToneGenerator.TONE_PROP_ACK, 140)
                delay(180L)
                generator.startTone(ToneGenerator.TONE_PROP_BEEP2, 180)
                delay(240L)
            } catch (_: RuntimeException) {
                // Ignore audio focus / hardware unavailability on restricted devices
            } finally {
                generator?.release()
            }
        }
    }
}
