package com.focusos.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class FocusOsComposeUiTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun dashboardRendersDisciplineScoreAndBottomNavigationTabsWork() {
        composeRule.onNodeWithText("FOCUS//OS").assertIsDisplayed()
        composeRule.onNodeWithText("Discipline Score").assertIsDisplayed()
        composeRule.onNodeWithText("Active Mission").assertIsDisplayed()

        composeRule.onNodeWithText("Shield").performClick()
        composeRule.onNodeWithText("App Shield & Nuclear Lock").assertIsDisplayed()

        composeRule.onNodeWithText("Missions").performClick()
        composeRule.onNodeWithText("Missions & Scheduling").assertIsDisplayed()

        composeRule.onNodeWithText("Analytics").performClick()
        composeRule.onNodeWithText("Discipline Analytics").assertIsDisplayed()

        composeRule.onNodeWithText("Command").performClick()
        composeRule.onNodeWithText("Discipline Score").assertIsDisplayed()
    }
}
