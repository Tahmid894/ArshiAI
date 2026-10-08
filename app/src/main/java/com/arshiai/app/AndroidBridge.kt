package com.arshiai.app

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.provider.Settings
import android.telephony.SmsManager
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONObject

class AndroidBridge(
    private val context: Context,
    private val callbackHandler: BridgeCallbackHandler?
) {

    interface BridgeCallbackHandler {
        fun onStartSpeechRecognition(language: String)
        fun onStopSpeechRecognition()
        fun onSpeakText(text: String, language: String, speed: Float)
        fun onPostResultToWeb(resultJson: String)
    }

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
    private var isTorchOn = false

    companion object {
        private const val TAG = "AndroidBridge"
    }

    // ==========================================
    // 1. App Launchers (YouTube, WhatsApp, etc.)
    // ==========================================

    @JavascriptInterface
    fun openYouTube(): String {
        val packageName = "com.google.android.youtube"
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)

        val result = JSONObject()
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            result.put("success", true)
            result.put("message", "YouTube ওপেন করা হচ্ছে...")
        } else {
            result.put("success", false)
            result.put("message", "YouTube ইনস্টল করা নেই।")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun openWhatsApp(): String {
        val packageName = "com.whatsapp"
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)

        val result = JSONObject()
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            result.put("success", true)
            result.put("message", "WhatsApp ওপেন করা হচ্ছে...")
        } else {
            result.put("success", false)
            result.put("message", "WhatsApp ইনস্টল করা নেই।")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun openChrome(): String {
        val packageName = "com.android.chrome"
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName) ?: Intent(Intent.ACTION_VIEW, Uri.parse("https://google.com"))

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val result = JSONObject()
        return try {
            context.startActivity(launchIntent)
            result.put("success", true)
            result.put("message", "Google Chrome ওপেন করা হচ্ছে...")
            result.toString()
        } catch (e: Exception) {
            result.put("success", false)
            result.put("message", "Chrome খুলতে ত্রুটি হয়েছে।")
            result.toString()
        }
    }

    @JavascriptInterface
    fun openFacebook(): String {
        val packageName = "com.facebook.katana"
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)

        val result = JSONObject()
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            result.put("success", true)
            result.put("message", "Facebook ওপেন করা হচ্ছে...")
        } else {
            // Fallback to browser
            val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://facebook.com")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
            result.put("success", true)
            result.put("message", "ব্রাউজারে Facebook ওপেন করা হচ্ছে...")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun openApp(appName: String): String {
        val lower = appName.lowercase()
        return when {
            lower.contains("youtube") || lower.contains("ইউটিউব") -> openYouTube()
            lower.contains("whatsapp") || lower.contains("হোয়াটসঅ্যাপ") -> openWhatsApp()
            lower.contains("chrome") || lower.contains("ক্রোম") -> openChrome()
            lower.contains("facebook") || lower.contains("ফেসবুক") -> openFacebook()
            else -> {
                val result = JSONObject()
                result.put("success", false)
                result.put("message", "$appName ইনস্টল বা সক্রিয় নেই।")
                result.toString()
            }
        }
    }

    // ==========================================
    // 2. Accessibility Automation & Scrolling
    // ==========================================

    @JavascriptInterface
    fun isAccessibilityServiceEnabled(): Boolean {
        return ArshiAccessibilityService.isAccessibilityEnabled(context)
    }

    @JavascriptInterface
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    @JavascriptInterface
    fun scrollDown(): String {
        val result = JSONObject()
        if (!ArshiAccessibilityService.isAccessibilityEnabled(context)) {
            result.put("success", false)
            result.put("message", "ArshiAI Automation চালানোর জন্য Accessibility Service চালু করুন।")
            return result.toString()
        }

        var dispatchedSuccessfully = false
        val lock = Object()
        synchronized(lock) {
            ArshiAccessibilityService.scrollDown { success ->
                dispatchedSuccessfully = success
                synchronized(lock) {
                    lock.notify()
                }
            }
            try {
                // Wait briefly for gesture result
                lock.wait(500)
            } catch (e: InterruptedException) {
                Log.e(TAG, "Scroll gesture wait interrupted", e)
            }
        }

        result.put("success", dispatchedSuccessfully)
        result.put("message", if (dispatchedSuccessfully) "স্ক্রলিং সম্পন্ন হয়েছে।" else "স্ক্রলিং সম্পন্ন করা যায়নি।")
        return result.toString()
    }

    @JavascriptInterface
    fun scroll(direction: String): String {
        return scrollDown()
    }

    // ==========================================
    // 3. Audio & Volume Control
    // ==========================================

    @JavascriptInterface
    fun setVolumeUp(): String {
        val result = JSONObject()
        if (audioManager != null) {
            audioManager.adjustStreamVolume(
                AudioManager.STREAM_MUSIC,
                AudioManager.ADJUST_RAISE,
                AudioManager.FLAG_SHOW_UI
            )
            result.put("success", true)
            result.put("message", "ভলিউম বাড়ানো হয়েছে।")
        } else {
            result.put("success", false)
            result.put("message", "অডিও ম্যানেজার পাওয়া যায়নি।")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun setVolumeDown(): String {
        val result = JSONObject()
        if (audioManager != null) {
            audioManager.adjustStreamVolume(
                AudioManager.STREAM_MUSIC,
                AudioManager.ADJUST_LOWER,
                AudioManager.FLAG_SHOW_UI
            )
            result.put("success", true)
            result.put("message", "ভলিউম কমানো হয়েছে।")
        } else {
            result.put("success", false)
            result.put("message", "অডিও ম্যানেজার পাওয়া যায়নি।")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun setVolume(direction: String): String {
        return if (direction.lowercase() == "up") setVolumeUp() else setVolumeDown()
    }

    // ==========================================
    // 4. Torch / Flashlight
    // ==========================================

    @JavascriptInterface
    fun toggleFlashlight(): String {
        val result = JSONObject()
        try {
            if (cameraManager != null) {
                val cameraId = cameraManager.cameraIdList.firstOrNull()
                if (cameraId != null) {
                    isTorchOn = !isTorchOn
                    cameraManager.setTorchMode(cameraId, isTorchOn)
                    result.put("success", true)
                    result.put("message", if (isTorchOn) "টর্চ অন করা হয়েছে।" else "টর্চ অফ করা হয়েছে।")
                    return result.toString()
                }
            }
            result.put("success", false)
            result.put("message", "ডিভাইস ক্যামেরা ফ্ল্যাশলাইট পাওয়া যায়নি।")
        } catch (e: Exception) {
            result.put("success", false)
            result.put("message", "ফ্ল্যাশলাইট পরিচালনায় ত্রুটি: ${e.message}")
        }
        return result.toString()
    }

    // ==========================================
    // 5. Phone Call & SMS
    // ==========================================

    @JavascriptInterface
    fun makePhoneCall(phoneNumber: String): String {
        val result = JSONObject()
        try {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            result.put("success", true)
            result.put("message", "$phoneNumber-এ কল ডায়াল করা হচ্ছে...")
        } catch (e: Exception) {
            result.put("success", false)
            result.put("message", "কল করতে ত্রুটি হয়েছে: ${e.message}")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun makeCall(recipient: String): String {
        return makePhoneCall(recipient)
    }

    @JavascriptInterface
    fun sendSMS(phoneNumber: String, message: String): String {
        val result = JSONObject()
        try {
            val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:$phoneNumber")).apply {
                putExtra("sms_body", message)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            result.put("success", true)
            result.put("message", "$phoneNumber-কে SMS অ্যাপ প্রস্তুত করা হয়েছে।")
        } catch (e: Exception) {
            result.put("success", false)
            result.put("message", "SMS প্রস্তুতি ব্যর্থ: ${e.message}")
        }
        return result.toString()
    }

    @JavascriptInterface
    fun sendWhatsAppMessage(recipient: String, message: String): String {
        val result = JSONObject()
        try {
            val sendIntent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(message)}")
                `package` = "com.whatsapp"
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(sendIntent)
            result.put("success", true)
            result.put("message", "$recipient-কে WhatsApp বার্তা পাঠানো হচ্ছে...")
        } catch (e: Exception) {
            result.put("success", false)
            result.put("message", "WhatsApp বার্তা পাঠানো যায়নি: ${e.message}")
        }
        return result.toString()
    }

    // ==========================================
    // 6. Native Voice & TTS Integration
    // ==========================================

    @JavascriptInterface
    fun startVoiceRecognition(language: String) {
        callbackHandler?.onStartSpeechRecognition(language)
    }

    @JavascriptInterface
    fun stopVoiceRecognition() {
        callbackHandler?.onStopSpeechRecognition()
    }

    @JavascriptInterface
    fun speak(text: String, language: String, speed: Float) {
        callbackHandler?.onSpeakText(text, language, speed)
    }
}
