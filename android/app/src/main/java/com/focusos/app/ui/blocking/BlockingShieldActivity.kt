package com.focusos.app.ui.blocking

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.focusos.app.MainActivity
import com.focusos.app.domain.BlockingEvaluator
import com.focusos.app.ui.theme.FocusColors
import com.focusos.app.ui.theme.FocusOsTheme
import kotlinx.coroutines.delay

class BlockingShieldActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                navigateHomeSafely()
            }
        })

        val appName = intent.getStringExtra(EXTRA_BLOCKED_APP_NAME) ?: "Restricted App"
        val packageName = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: ""
        val endsAtEpochMs = intent.getLongExtra(EXTRA_ENDS_AT_EPOCH_MS, 0L)
        val sessionLabel = intent.getStringExtra(EXTRA_SESSION_LABEL) ?: "Focus Session"
        val isNuclearMode = intent.getBooleanExtra(EXTRA_IS_NUCLEAR_MODE, false)

        setContent {
            FocusOsTheme {
                var remainingMillis by remember {
                    mutableLongStateOf((endsAtEpochMs - System.currentTimeMillis()).coerceAtLeast(0L))
                }

                LaunchedEffect(endsAtEpochMs) {
                    while (true) {
                        val left = (endsAtEpochMs - System.currentTimeMillis()).coerceAtLeast(0L)
                        remainingMillis = left
                        if (left == 0L) {
                            finish()
                            break
                        }
                        delay(1_000L)
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(FocusColors.PureBlack)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        color = FocusColors.CharcoalSurface,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(
                            1.dp,
                            if (isNuclearMode) FocusColors.RegimentalBrass else FocusColors.TacticalCrimsonBright
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = if (isNuclearMode) {
                                    "NUCLEAR LOCK ACTIVE · SETTINGS SEALED"
                                } else {
                                    "FOCUS//OS SHIELD ACTIVE"
                                },
                                style = MaterialTheme.typography.labelMedium,
                                color = if (isNuclearMode) {
                                    FocusColors.RegimentalBrass
                                } else {
                                    FocusColors.TacticalCrimsonBright
                                }
                            )
                            Text(
                                text = "$appName is Blocked",
                                style = MaterialTheme.typography.headlineMedium,
                                color = FocusColors.TextPrimary,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = packageName,
                                style = MaterialTheme.typography.labelSmall,
                                color = FocusColors.TextMuted
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = BlockingEvaluator.formatCountdownMillis(remainingMillis),
                                style = MaterialTheme.typography.displayLarge,
                                color = FocusColors.TextPrimary
                            )
                            Text(
                                text = "Remaining in $sessionLabel",
                                style = MaterialTheme.typography.bodyMedium,
                                color = FocusColors.TextSecondary,
                                textAlign = TextAlign.Center
                            )
                            if (isNuclearMode) {
                                Text(
                                    text = "Emergency dialer & safety calls remain accessible",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = FocusColors.NominalGreen,
                                    textAlign = TextAlign.Center
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { navigateHomeSafely() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = FocusColors.TacticalCrimson,
                                    contentColor = FocusColors.TextPrimary
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Return to Focus")
                            }
                            OutlinedButton(
                                onClick = {
                                    startActivity(Intent(this@BlockingShieldActivity, MainActivity::class.java))
                                    finish()
                                },
                                border = BorderStroke(1.dp, FocusColors.HairlineBorder),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Open FOCUS//OS", color = FocusColors.TextSecondary)
                            }
                        }
                    }
                }
            }
        }
    }

    private fun navigateHomeSafely() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    companion object {
        const val EXTRA_BLOCKED_APP_NAME = "extra_blocked_app_name"
        const val EXTRA_BLOCKED_PACKAGE = "extra_blocked_package"
        const val EXTRA_ENDS_AT_EPOCH_MS = "extra_ends_at_epoch_ms"
        const val EXTRA_SESSION_LABEL = "extra_session_label"
        const val EXTRA_IS_NUCLEAR_MODE = "extra_is_nuclear_mode"
    }
}
