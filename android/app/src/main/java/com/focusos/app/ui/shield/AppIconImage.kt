package com.focusos.app.ui.shield

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.focusos.app.ui.theme.FocusColors

@Composable
fun AppIconImage(
    packageName: String,
    appName: String,
    loadIcon: suspend (String) -> Bitmap?,
    modifier: Modifier = Modifier
) {
    val bitmap by produceState<Bitmap?>(initialValue = null, key1 = packageName) {
        value = loadIcon(packageName)
    }

    val shape = RoundedCornerShape(10.dp)
    if (bitmap != null) {
        Image(
            bitmap = bitmap!!.asImageBitmap(),
            contentDescription = "$appName icon",
            modifier = modifier
                .size(40.dp)
                .clip(shape)
        )
    } else {
        Box(
            modifier = modifier
                .size(40.dp)
                .background(FocusColors.CharcoalElevated, shape)
                .border(1.dp, FocusColors.HairlineBorder, shape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = appName.take(1).uppercase(),
                style = MaterialTheme.typography.titleMedium,
                color = FocusColors.TextSecondary
            )
        }
    }
}
