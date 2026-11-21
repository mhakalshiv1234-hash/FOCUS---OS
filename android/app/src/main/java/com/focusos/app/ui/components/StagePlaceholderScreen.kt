package com.focusos.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.focusos.app.ui.theme.FocusColors

@Composable
fun StagePlaceholderScreen(
    title: String,
    stageTag: String,
    description: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(FocusColors.PureBlack)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = FocusColors.TextPrimary
        )
        Surface(
            color = FocusColors.CharcoalSurface,
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, FocusColors.HairlineBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Scheduled for $stageTag",
                    style = MaterialTheme.typography.labelMedium,
                    color = FocusColors.TacticalCrimsonBright
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = FocusColors.TextSecondary
                )
            }
        }
    }
}
