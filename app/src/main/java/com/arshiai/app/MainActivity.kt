package com.arshiai.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.Locale

class MainActivity : AppCompatActivity(), AndroidBridge.BridgeCallbackHandler, TextToSpeech.OnInitListener {

    companion object {
        private const val TAG = "ArshiMainActivity"
        private const val PERMISSIONS_REQUEST_CODE = 2001
    }

    private lateinit var webView: WebView
    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Setup WebView programmatically or as main content view
        webView = WebView(this)
        setContentView(webView)

        setupWebView()
        checkAndRequestPermissions()
        initTextToSpeech()
        initSpeechRecognizer()

        // Load the ArshiAI web application
        loadArshiApp()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT

        val bridge = AndroidBridge(this, this)
        webView.addJavascriptInterface(bridge, "AndroidBridge")
        webView.addJavascriptInterface(bridge, "AndroidNativeBridge")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                // Automatically grant microphone permissions for Web Speech / getUserMedia inside WebView
                request?.let {
                    val requestedResources = it.resources
                    for (r in requestedResources) {
                        if (r == PermissionRequest.RESOURCE_AUDIO_CAPTURE) {
                            it.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                            return
                        }
                    }
                    it.grant(it.resources)
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "ArshiAI Page loaded successfully: $url")
            }
        }
    }

    private fun loadArshiApp() {
        // Try local assets first if bundled, otherwise fallback to development URL
        webView.loadUrl("file:///android_asset/dist/index.html")
    }

    private fun checkAndRequestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS
        )

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSIONS_REQUEST_CODE)
        }
    }

    // ==========================================
    // Speech Recognition Implementation
    // ==========================================

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        notifyWeb("onReadyForSpeech", "{}")
                    }

                    override fun onBeginningOfSpeech() {
                        notifyWeb("onBeginningOfSpeech", "{}")
                    }

                    override fun onRmsChanged(rmsdB: Float) {
                        // Volume level change
                    }

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        notifyWeb("onEndOfSpeech", "{}")
                    }

                    override fun onError(error: Int) {
                        val errorMsg = getSpeechErrorString(error)
                        notifyWeb("onError", "{\"error\": $error, \"message\": \"$errorMsg\"}")
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        notifyWeb("onResults", "{\"text\": \"$text\"}")
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        notifyWeb("onPartialResults", "{\"text\": \"$text\"}")
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    private fun getSpeechErrorString(errorCode: Int): String {
        return when (errorCode) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
            else -> "Speech recognition error ($errorCode)"
        }
    }

    override fun onStartSpeechRecognition(language: String) {
        runOnUiThread {
            if (speechRecognizer == null) {
                initSpeechRecognizer()
            }
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                val langTag = if (language.lowercase().startsWith("en")) "en-US" else "bn-BD"
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, langTag)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            }
            speechRecognizer?.startListening(intent)
        }
    }

    override fun onStopSpeechRecognition() {
        runOnUiThread {
            speechRecognizer?.stopListening()
        }
    }

    // ==========================================
    // Text-To-Speech Implementation
    // ==========================================

    private fun initTextToSpeech() {
        textToSpeech = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            // Default to Bengali if available, otherwise English
            val bnLocale = Locale("bn", "BD")
            val available = textToSpeech?.isLanguageAvailable(bnLocale)
            if (available == TextToSpeech.LANG_AVAILABLE || available == TextToSpeech.LANG_COUNTRY_AVAILABLE) {
                textToSpeech?.language = bnLocale
            } else {
                textToSpeech?.language = Locale.US
            }
        }
    }

    override fun onSpeakText(text: String, language: String, speed: Float) {
        if (!isTtsReady || textToSpeech == null) return
        runOnUiThread {
            val locale = if (language.lowercase().startsWith("en")) Locale.US else Locale("bn", "BD")
            textToSpeech?.language = locale
            textToSpeech?.setSpeechRate(speed.coerceIn(0.5f, 2.0f))
            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "arshi_tts_${System.currentTimeMillis()}")
        }
    }

    override fun onPostResultToWeb(resultJson: String) {
        notifyWeb("onBridgeActionResult", resultJson)
    }

    private fun notifyWeb(event: String, payloadJson: String) {
        runOnUiThread {
            val script = "if (window.onAndroidBridgeEvent) { window.onAndroidBridgeEvent('$event', $payloadJson); }"
            webView.evaluateJavascript(script, null)
        }
    }

    override fun onDestroy() {
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        super.onDestroy()
    }
}
