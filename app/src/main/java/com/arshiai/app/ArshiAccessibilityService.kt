package com.arshiai.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Path
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class ArshiAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ArshiAccessibility"
        private var instance: ArshiAccessibilityService? = null

        fun isServiceRunning(): Boolean {
            return instance != null
        }

        fun isAccessibilityEnabled(context: Context): Boolean {
            val expectedServiceName = "${context.packageName}/${ArshiAccessibilityService::class.java.canonicalName}"
            val enabledServicesSetting = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServicesSetting)

            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(expectedServiceName, ignoreCase = true) ||
                    componentName.contains("ArshiAccessibilityService", ignoreCase = true)
                ) {
                    return true
                }
            }
            return false
        }

        fun scrollDown(callback: (Boolean) -> Unit) {
            val service = instance
            if (service == null) {
                Log.w(TAG, "Cannot scroll: Accessibility service is not running")
                callback(false)
                return
            }
            service.performScrollGesture(callback)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "ArshiAI Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Event processing if needed
    }

    override fun onInterrupt() {
        Log.w(TAG, "ArshiAI Accessibility Service Interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "ArshiAI Accessibility Service Destroyed")
    }

    private fun performScrollGesture(callback: (Boolean) -> Unit) {
        val displayMetrics = resources.displayMetrics
        val width = displayMetrics.widthPixels
        val height = displayMetrics.heightPixels

        // Swipe up gesture (scroll down the content)
        val startX = (width / 2).toFloat()
        val startY = (height * 0.75f)
        val endX = startX
        val endY = (height * 0.25f)

        val swipePath = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }

        val gestureBuilder = GestureDescription.Builder()
        gestureBuilder.addStroke(GestureDescription.StrokeDescription(swipePath, 0, 300))

        val gesture = gestureBuilder.build()
        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Scroll gesture completed successfully")
                callback(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Scroll gesture was cancelled")
                callback(false)
            }
        }, null)

        if (!dispatched) {
            Log.e(TAG, "Failed to dispatch scroll gesture")
            callback(false)
        }
    }
}
