package com.armoniax

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import kotlinx.coroutines.*
import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.text.Normalizer
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import com.tom_roush.pdfbox.text.TextPosition
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader

class PDFScannerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = "PDFScanner"

    private data class CantoInfo(
        val titulo: String,
        val numeroCanto: String,
        val pagina: Int,
    )

    companion object {
        private var initialized = false
        private var cachedDocument: PDDocument? = null
        private var cachedIndex: Map<String, CantoInfo>? = null
        private val diacriticsRegex = "\\p{InCombiningDiacriticalMarks}+".toRegex()
    }

    private fun removeDiacritics(text: String): String {
        val normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
        return normalized.replace(diacriticsRegex, "")
    }

    private fun ensureInitialized(context: Context) {
        if (!initialized) {
            PDFBoxResourceLoader.init(context)
            initialized = true
        }
    }

    private fun getDocument(context: Context): PDDocument {
        cachedDocument?.let { return it }
        val pdfBytes = loadPdfFromAssets(context, "iResucitó-es-US.pdf")
        val doc = PDDocument.load(pdfBytes)
        cachedDocument = doc
        return doc
    }

    private fun buildIndex(context: Context): Map<String, CantoInfo> {
        cachedIndex?.let { return it }

        val document = getDocument(context)
        val stripper = PDFTextStripper()
        val totalPages = document.numberOfPages
        val index = mutableMapOf<String, CantoInfo>()

        for (pageNum in 1..totalPages) {
            stripper.startPage = pageNum
            stripper.endPage = pageNum
            val pageText = stripper.getText(document)

            val lines = pageText.lines().map { it.trim() }.filter { it.isNotEmpty() }
            if (lines.size < 2) continue

            var cantoNumber = ""
            for (index2 in lines.indices.reversed()) {
                val line = lines[index2]
                if (line.length in 1..4 && line.all { it.isDigit() }) {
                    cantoNumber = line
                    break
                }
            }
            if (cantoNumber.isEmpty()) continue

            val titleLines = lines.subList(0, minOf(1, lines.size))
            val titulo = titleLines.joinToString(" ")
            val tituloNormalized = removeDiacritics(titulo.lowercase())

            index[tituloNormalized] = CantoInfo(
                titulo = titulo,
                numeroCanto = cantoNumber,
                pagina = pageNum,
            )
        }

        cachedIndex = index
        return index
    }

    @ReactMethod
    fun buscarCantoEnPDF(nombreCanto: String, promise: Promise) {
        moduleScope.launch {
            try {
                val context = reactApplicationContext
                ensureInitialized(context)

                val index = buildIndex(context)
                val queryLower = removeDiacritics(nombreCanto.trim().lowercase())

                val results = Arguments.createArray()

                for ((_, canto) in index) {
                    val titleNormalized = removeDiacritics(canto.titulo.lowercase())
                    if (titleNormalized.contains(queryLower)) {
                        val result = Arguments.createMap().apply {
                            putString("titulo", canto.titulo)
                            putString("numeroCanto", canto.numeroCanto)
                            putString("pagina", canto.pagina.toString())
                        }
                        results.pushMap(result)
                    }
                }

                withContext(Dispatchers.Main) {
                    if (results.size() > 0) {
                        val response = Arguments.createMap().apply {
                            putString("status", "success")
                            putArray("results", results)
                        }
                        promise.resolve(response)
                    } else {
                        val response = Arguments.createMap().apply {
                            putString("status", "not_found")
                        }
                        promise.resolve(response)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("PDF_SCAN_ERROR", e.message, e)
                }
            }
        }
    }

    private fun loadPdfFromAssets(context: Context, fileName: String): ByteArray {
        return context.assets.open(fileName).use { input ->
            val tempFile = File(context.cacheDir, "temp_scan_$fileName")
            FileOutputStream(tempFile).use { output ->
                input.copyTo(output)
            }
            tempFile.readBytes()
        }
    }

    @ReactMethod
    fun extractPageText(pages: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        moduleScope.launch {
            try {
                val context = reactApplicationContext
                ensureInitialized(context)
                val document = getDocument(context)
                val stripper = PDFTextStripper()
                val allText = StringBuilder()

                for (i in 0 until pages.size()) {
                    val pageNum = pages.getInt(i)
                    stripper.startPage = pageNum
                    stripper.endPage = pageNum
                    val pageText = stripper.getText(document)
                    allText.append(pageText)
                    if (i < pages.size() - 1) {
                        allText.append("\n\n---\n\n")
                    }
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(allText.toString())
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("EXTRACT_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun extractDebugInfo(pageNum: Int, promise: Promise) {
        Log.d("PDFScanner", "extractDebugInfo called with page=$pageNum")
        moduleScope.launch {
            try {
                val context = reactApplicationContext
                ensureInitialized(context)
                val document = getDocument(context)

                data class CharInfo(
                    val char: String,
                    val x: Float,
                    val y: Float,
                    val fontSize: Float,
                    val width: Float,
                )

                val chars = mutableListOf<CharInfo>()

                val stripper = object : PDFTextStripper() {
                    override fun processTextPosition(text: TextPosition) {
                        super.processTextPosition(text)
                        chars.add(CharInfo(
                            char = text.unicode,
                            x = text.xDirAdj,
                            y = text.yDirAdj,
                            fontSize = text.fontSize,
                            width = text.widthDirAdj,
                        ))
                    }
                }
                stripper.sortByPosition = true
                stripper.startPage = pageNum
                stripper.endPage = pageNum
                stripper.getText(document)

                Log.d("PDFScanner", "extractDebugInfo page=$pageNum, chars=${chars.size}")

                val yThreshold = 10.0f
                val lines = mutableListOf<MutableList<CharInfo>>()
                var currentLine = mutableListOf<CharInfo>()
                var lastY = -1.0f

                for (ch in chars) {
                    if (lastY < 0 || Math.abs(ch.y - lastY) < yThreshold) {
                        currentLine.add(ch)
                    } else {
                        if (currentLine.isNotEmpty()) lines.add(currentLine)
                        currentLine = mutableListOf(ch)
                    }
                    lastY = ch.y
                }
                if (currentLine.isNotEmpty()) lines.add(currentLine)

                Log.d("PDFScanner", "extractDebugInfo lines=${lines.size}")

                val result = Arguments.createArray()
                for (line in lines) {
                    val lineText = line.joinToString("") { it.char }
                    val avgY = line.map { it.y }.average().toFloat()
                    val avgFontSize = line.map { it.fontSize }.average().toFloat()
                    val minX = line.minOf { it.x }
                    val maxX = line.maxOf { it.x + it.width }

                    val lineMap = Arguments.createMap().apply {
                        putString("text", lineText)
                        putDouble("y", avgY.toDouble())
                        putDouble("fontSize", avgFontSize.toDouble())
                        putDouble("x", minX.toDouble())
                        putDouble("width", (maxX - minX).toDouble())
                    }
                    result.pushMap(lineMap)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                Log.e("PDFScanner", "extractDebugInfo error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    promise.reject("DEBUG_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun extractFormattedText(pages: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        Log.d("PDFScanner", "extractFormattedText called with ${pages.size()} pages")
        moduleScope.launch {
            try {
                val context = reactApplicationContext
                ensureInitialized(context)
                val document = getDocument(context)

                data class CharInfo(
                    val char: String,
                    val x: Float,
                    val y: Float,
                    val fontSize: Float,
                    val width: Float,
                )

                val yThreshold = 5.0f
                val CHORD_FONT_THRESHOLD = 7.3f

                val allResult = Arguments.createArray()

                for (p in 0 until pages.size()) {
                    val pageNum = pages.getInt(p)
                    val chars = mutableListOf<CharInfo>()

                    val stripper = object : PDFTextStripper() {
                        override fun processTextPosition(text: TextPosition) {
                            super.processTextPosition(text)
                            chars.add(CharInfo(
                                char = text.unicode,
                                x = text.xDirAdj,
                                y = text.yDirAdj,
                                fontSize = text.fontSize,
                                width = text.widthDirAdj,
                            ))
                        }
                    }
                    stripper.sortByPosition = true
                    stripper.startPage = pageNum
                    stripper.endPage = pageNum
                    stripper.getText(document)

                    val visualLines = mutableListOf<MutableList<CharInfo>>()
                    var currentLine = mutableListOf<CharInfo>()
                    var lastY = -1.0f

                    for (ch in chars) {
                        if (lastY < 0 || Math.abs(ch.y - lastY) < yThreshold) {
                            currentLine.add(ch)
                        } else {
                            if (currentLine.isNotEmpty()) visualLines.add(currentLine)
                            currentLine = mutableListOf(ch)
                        }
                        lastY = ch.y
                    }
                    if (currentLine.isNotEmpty()) visualLines.add(currentLine)

                    val result = Arguments.createArray()

                    for (line in visualLines) {
                        val sortedByX = line.sortedBy { it.x }

                        val chordChars = sortedByX.filter { it.fontSize < CHORD_FONT_THRESHOLD }
                        val lyricChars = sortedByX.filter { it.fontSize >= CHORD_FONT_THRESHOLD }

                        if (chordChars.isEmpty() && lyricChars.isEmpty()) continue

                        val chordText = chordChars.joinToString("") { it.char }.trim()
                        val lyricText = lyricChars.joinToString("") { it.char }.trim()

                        if (chordText.isEmpty() && lyricText.isEmpty()) continue

                        val lineMap = Arguments.createMap().apply {
                            putString("chordText", chordText)
                            putString("lyricText", lyricText)
                        }
                        result.pushMap(lineMap)
                    }

                    val merged = Arguments.createArray()
                    var pendingChords = ""

                    for (i in 0 until result.size()) {
                        val line = result.getMap(i)
                        val chord = line?.getString("chordText") ?: ""
                        val lyric = line?.getString("lyricText") ?: ""

                        if (lyric.isEmpty() && chord.isNotEmpty()) {
                            pendingChords = if (pendingChords.isEmpty()) chord
                                            else "$pendingChords $chord"
                        } else {
                            val finalChord = if (pendingChords.isNotEmpty()) {
                                if (chord.isNotEmpty()) "$pendingChords $chord" else pendingChords
                            } else chord
                            pendingChords = ""

                            val mergedLine = Arguments.createMap().apply {
                                putString("chordText", finalChord)
                                putString("lyricText", lyric)
                            }
                            merged.pushMap(mergedLine)
                        }
                    }

                    if (pendingChords.isNotEmpty()) {
                        val mergedLine = Arguments.createMap().apply {
                            putString("chordText", pendingChords)
                            putString("lyricText", "")
                        }
                        merged.pushMap(mergedLine)
                    }

                    for (i in 0 until merged.size()) {
                        allResult.pushMap(merged.getMap(i))
                    }
                }

                Log.d("PDFScanner", "extractFormattedText total=${allResult.size()} lines")

                withContext(Dispatchers.Main) {
                    promise.resolve(allResult)
                }
            } catch (e: Exception) {
                Log.e("PDFScanner", "extractFormattedText error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    promise.reject("FORMAT_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun extractChordProAligned(pages: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        Log.d("PDFScanner", "extractChordProAligned called with ${pages.size()} pages")
        moduleScope.launch {
            try {
                val context = reactApplicationContext
                ensureInitialized(context)
                val document = getDocument(context)

                data class CharInfo(
                    val char: String,
                    val x: Float,
                    val y: Float,
                    val fontSize: Float,
                    val width: Float,
                )

                val yThreshold = 5.0f
                val CHORD_FONT_THRESHOLD = 7.3f
                val CHORD_GROUPING_GAP = 5.0f
                val SPACE_GAP_THRESHOLD = 15.0f

                val allResult = Arguments.createArray()

                for (p in 0 until pages.size()) {
                    val pageNum = pages.getInt(p)
                    val chars = mutableListOf<CharInfo>()

                    val stripper = object : PDFTextStripper() {
                        override fun processTextPosition(text: TextPosition) {
                            super.processTextPosition(text)
                            chars.add(CharInfo(
                                char = text.unicode,
                                x = text.xDirAdj,
                                y = text.yDirAdj,
                                fontSize = text.fontSize,
                                width = text.widthDirAdj,
                            ))
                        }
                    }
                    stripper.sortByPosition = true
                    stripper.startPage = pageNum
                    stripper.endPage = pageNum
                    stripper.getText(document)

                    val visualLines = mutableListOf<MutableList<CharInfo>>()
                    var currentLine = mutableListOf<CharInfo>()
                    var lastY = -1.0f

                    for (ch in chars) {
                        if (lastY < 0 || Math.abs(ch.y - lastY) < yThreshold) {
                            currentLine.add(ch)
                        } else {
                            if (currentLine.isNotEmpty()) visualLines.add(currentLine)
                            currentLine = mutableListOf(ch)
                        }
                        lastY = ch.y
                    }
                    if (currentLine.isNotEmpty()) visualLines.add(currentLine)

                    data class ChordInfo(
                        val name: String,
                        val startX: Float,
                    )

                    data class RawLine(
                        val chords: List<ChordInfo>,
                        val lyricChars: List<CharInfo>,
                    )

                    val rawLines = mutableListOf<RawLine>()

                    for (line in visualLines) {
                        val sortedByX = line.sortedBy { it.x }

                        val chordChars = sortedByX.filter { it.fontSize < CHORD_FONT_THRESHOLD }
                        val lyricChars = sortedByX.filter { it.fontSize >= CHORD_FONT_THRESHOLD }

                        val chordGroups = mutableListOf<ChordInfo>()
                        if (chordChars.isNotEmpty()) {
                            var groupChars = mutableListOf<CharInfo>(chordChars[0])
                            for (i in 1 until chordChars.size) {
                                val prev = chordChars[i - 1]
                                val curr = chordChars[i]
                                if (curr.x - prev.x < CHORD_GROUPING_GAP) {
                                    groupChars.add(curr)
                                } else {
                                    val name = groupChars.joinToString("") { it.char }
                                    val startX = groupChars.first().x
                                    chordGroups.add(ChordInfo(name, startX))
                                    groupChars = mutableListOf(curr)
                                }
                            }
                            if (groupChars.isNotEmpty()) {
                                val name = groupChars.joinToString("") { it.char }
                                val startX = groupChars.first().x
                                chordGroups.add(ChordInfo(name, startX))
                            }
                        }

                        rawLines.add(RawLine(chordGroups, lyricChars))
                    }

                    val mergedLines = mutableListOf<RawLine>()
                    var pendingChords = mutableListOf<ChordInfo>()

                    for (raw in rawLines) {
                        if (raw.lyricChars.isEmpty() && raw.chords.isNotEmpty()) {
                            pendingChords.addAll(raw.chords)
                        } else {
                            val allChords = pendingChords + raw.chords
                            pendingChords = mutableListOf()
                            mergedLines.add(RawLine(allChords, raw.lyricChars))
                        }
                    }
                    if (pendingChords.isNotEmpty()) {
                        mergedLines.add(RawLine(pendingChords, emptyList()))
                    }

                    for (merged in mergedLines) {
                        val lyricChars = merged.lyricChars
                        val chords = merged.chords

                        if (lyricChars.isEmpty() && chords.isEmpty()) continue

                        val lyricBuilder = StringBuilder()
                        val lyricXPositions = mutableListOf<Float>()

                        for (i in lyricChars.indices) {
                            val ch = lyricChars[i]
                            if (i > 0) {
                                val prevChar = lyricChars[i - 1]
                                val gap = ch.x - prevChar.x
                                if (gap > SPACE_GAP_THRESHOLD) {
                                    lyricBuilder.append(" ")
                                    lyricXPositions.add(prevChar.x + prevChar.width + (gap - prevChar.width) / 2)
                                }
                            }
                            lyricBuilder.append(ch.char)
                            lyricXPositions.add(ch.x)
                        }

                        val lyricText = lyricBuilder.toString()

                        val chordPositions = Arguments.createArray()

                        for (chord in chords) {
                            var bestIndex = 0
                            var bestDist = Float.MAX_VALUE

                            for (i in lyricXPositions.indices) {
                                val dist = Math.abs(lyricXPositions[i] - chord.startX)
                                if (dist < bestDist) {
                                    bestDist = dist
                                    bestIndex = i
                                }
                            }

                            if (lyricXPositions.isEmpty()) {
                                bestIndex = 0
                            }

                            val posMap = Arguments.createMap().apply {
                                putString("chord", chord.name)
                                putInt("position", bestIndex)
                            }
                            chordPositions.pushMap(posMap)
                        }

                        val lineMap = Arguments.createMap().apply {
                            putString("lyricText", lyricText)
                            putArray("chordPositions", chordPositions)
                        }
                        allResult.pushMap(lineMap)
                    }
                }

                Log.d("PDFScanner", "extractChordProAligned total=${allResult.size()} lines")

                withContext(Dispatchers.Main) {
                    promise.resolve(allResult)
                }
            } catch (e: Exception) {
                Log.e("PDFScanner", "extractChordProAligned error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    promise.reject("CHORDPRO_ALIGN_ERROR", e.message, e)
                }
            }
        }
    }
}
