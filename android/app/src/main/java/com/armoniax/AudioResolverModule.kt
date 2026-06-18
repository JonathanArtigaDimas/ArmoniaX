package com.armoniax

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt

class AudioResolverModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var audioRecord: AudioRecord? = null
    private var isListening = false
    private var listeningThread: Thread? = null

    private val sampleRate = 44100
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bufferSize = maxOf(AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat), 4096 * 2)
    private val noiseThreshold = 1200
    private val minTauSafety = 4
    private val highFreqGain = 1.5
    private var targetMinHz = 70.0
    private var targetMaxHz = 400.0

    override fun getName(): String = "AudioResolver"

    @ReactMethod
    fun addListener(eventName: String) {
        // Requerido por NativeEventEmitter para control de ciclo de vida
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Requerido por NativeEventEmitter para evitar fugas de memoria
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        if (isListening) {
            promise.resolve("already_listening")
            return
        }

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("AUDIO_INIT_FAILED", "AudioRecord no se pudo inicializar")
                return
            }

            audioRecord?.startRecording()
            isListening = true

            listeningThread = Thread {
                Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
                val readSize = 4096
                val buffer = ShortArray(readSize)
                val processingBuffer = ShortArray(readSize)
                val floatBuffer = FloatArray(readSize)

                while (isListening) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        val useGain = targetMinHz >= 280.0
                        if (useGain) {
                            for (i in 0 until read) {
                                val amplified = (buffer[i].toDouble() * highFreqGain).toInt()
                                processingBuffer[i] = amplified.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                            }
                        } else {
                            System.arraycopy(buffer, 0, processingBuffer, 0, read)
                        }

                        val rawAmplitude = getMaxAmplitude(processingBuffer, read)

                        val alpha = if (targetMinHz > 250.0) 0.95f else 0.90f
                        floatBuffer[0] = processingBuffer[0].toFloat()
                        for (i in 1 until read) {
                            floatBuffer[i] = processingBuffer[i].toFloat() - alpha * processingBuffer[i - 1].toFloat()
                        }
                        for (i in 0 until read) {
                            val clamped = floatBuffer[i].toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
                            processingBuffer[i] = clamped.toShort()
                        }

                        if (rawAmplitude >= noiseThreshold) {
                            val frequency = calculateFrequency(processingBuffer, read)
                            if (frequency > 0.0) {
                                sendEvent("onFrequencyDetected", frequency)
                            }
                        }
                    }
                }
            }.also { it.start() }

            promise.resolve("listening_started")
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Permiso de micrófono no concedido", e)
        } catch (e: Exception) {
            promise.reject("AUDIO_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        isListening = false
        listeningThread?.join(500)
        listeningThread = null

        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
            promise.resolve("listening_stopped")
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setTargetFrequencyRange(minHz: Double, maxHz: Double) {
        targetMinHz = minHz
        targetMaxHz = maxHz
    }

    private fun calculateFrequency(buffer: ShortArray, readCount: Int): Double {
        if (readCount < 2) return 0.0

        val w = readCount / 2
        if (w < minTauSafety) return 0.0

        val minTau = maxOf((sampleRate / targetMaxHz).toInt(), minTauSafety)
        val maxTau = min((sampleRate / targetMinHz).toInt(), w - 1)

        if (minTau >= maxTau) return 0.0

        val yinBuffer = DoubleArray(w)
        yinBuffer[0] = 1.0

        for (tau in 1 until w) {
            var sum = 0.0
            val limit = readCount - tau
            for (i in 0 until limit) {
                val diff = buffer[i].toDouble() - buffer[i + tau].toDouble()
                sum += diff * diff
            }
            yinBuffer[tau] = sum
        }

        var runningSum = 0.0
        for (tau in 1 until w) {
            runningSum += yinBuffer[tau]
            yinBuffer[tau] = if (runningSum > 0.0) yinBuffer[tau] * tau / runningSum else 1.0
        }

        data class ValleyCandidate(val tau: Int, val yinValue: Double)
        val candidates = mutableListOf<ValleyCandidate>()

        var tau = minTau
        while (tau < maxTau) {
            if (yinBuffer[tau] < 0.25) {
                var valley = tau
                while (valley + 1 < maxTau && yinBuffer[valley + 1] < yinBuffer[valley]) {
                    valley++
                }
                candidates.add(ValleyCandidate(valley, yinBuffer[valley]))
                tau = valley + 1
            } else {
                tau++
            }
        }

        if (candidates.isEmpty()) return 0.0

        candidates.sortBy { it.tau }

        val isCharangoMode = targetMinHz >= 280.0

        if (isCharangoMode) {
            for (i in candidates.indices) {
                val candidate = candidates[i]
                val tauAgudo = candidate.tau

                if (tauAgudo >= 100) continue

                val subHarmonicLow = (tauAgudo * 2) - (tauAgudo / 6)
                val subHarmonicHigh = (tauAgudo * 2) + (tauAgudo / 6)

                var subHarmonicIndex = -1
                for (j in candidates.indices) {
                    if (j == i) continue
                    val other = candidates[j]
                    if (other.tau in subHarmonicLow..subHarmonicHigh) {
                        subHarmonicIndex = j
                        break
                    }
                }

                if (subHarmonicIndex >= 0) {
                    return interpolateAndConvert(yinBuffer, tauAgudo, minTau, maxTau)
                }
            }

            for (i in candidates.indices) {
                val candidate = candidates[i]
                if (candidate.tau < 100) {
                    return interpolateAndConvert(yinBuffer, candidate.tau, minTau, maxTau)
                }
            }
        }

        for (i in candidates.indices) {
            val candidate = candidates[i]
            if (candidate.yinValue < 0.15) {
                return interpolateAndConvert(yinBuffer, candidate.tau, minTau, maxTau)
            }
        }

        if (candidates.isNotEmpty()) {
            return interpolateAndConvert(yinBuffer, candidates[0].tau, minTau, maxTau)
        }

        return 0.0
    }

    private fun interpolateAndConvert(yinBuffer: DoubleArray, tau: Int, minTau: Int, maxTau: Int): Double {
        var exactTau = tau.toDouble()

        if (tau > minTau && tau < maxTau) {
            val yLeft = yinBuffer[tau - 1]
            val yCenter = yinBuffer[tau]
            val yRight = yinBuffer[tau + 1]
            val denominator = 2.0 * (yLeft - 2.0 * yCenter + yRight)
            if (abs(denominator) > 1e-10) {
                val delta = (yLeft - yRight) / denominator
                if (abs(delta) <= 1.0) {
                    exactTau = tau + delta
                }
            }
        }

        if (exactTau <= 0) return 0.0

        val frequency = sampleRate / exactTau
        return when {
            frequency < targetMinHz -> 0.0
            frequency > targetMaxHz -> 0.0
            else -> frequency
        }
    }

    private fun getMaxAmplitude(buffer: ShortArray, readCount: Int): Int {
        var max = 0
        for (i in 0 until readCount) {
            val amp = abs(buffer[i].toInt())
            if (amp > max) max = amp
        }
        return max
    }

    private fun sendEvent(eventName: String, data: Double) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
