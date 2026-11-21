package com.focusos.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "focus_os_prefs")

class UserPreferencesRepository(private val context: Context) {

    private object Keys {
        val DAILY_FOCUS_TARGET_MINUTES = intPreferencesKey("daily_focus_target_minutes")
    }

    val dailyFocusTargetMinutes: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[Keys.DAILY_FOCUS_TARGET_MINUTES] ?: 240
    }

    suspend fun setDailyFocusTargetMinutes(minutes: Int) {
        context.dataStore.edit { prefs ->
            prefs[Keys.DAILY_FOCUS_TARGET_MINUTES] = minutes.coerceIn(30, 720)
        }
    }
}
