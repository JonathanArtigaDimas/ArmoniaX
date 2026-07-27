/**
 * metronomeSound.ts - Generación y reproducción de sonidos para metrónomo y afinador
 *
 * Este módulo genera sonidos WAV programáticamente (sin archivos de audio externos):
 *
 * 1. Tick normal (1200Hz, 20ms) - sonido de metrónomo estándar
 * 2. Tick acento (1800Hz, 25ms) - sonido de primer tiempo
 * 3. Campana de afinado (C-E-G, acorde de Do mayor) - sonido al afinar
 *
 * Los sonidos se generan como WAV con envelope ADSR (Attack, Decay, Sustain, Release)
 * y se escriben al filesystem de la app para reproducción via react-native-sound.
 *
 * La inicialización se hace una vez (initSounds) y los sonidos se reutilizan.
 */
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

// Configurar categoría de audio para que funcione con el interruptor de silencio
Sound.setCategory('Playback');

/** Directorio de caché de sonidos generados */
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/sounds`;
/** Ruta del tick normal en el filesystem */
const NORMAL_TICK_PATH = `${CACHE_DIR}/tick_normal.wav`;
/** Ruta del tick de acento (primer tiempo) */
const ACCENT_TICK_PATH = `${CACHE_DIR}/tick_accent.wav`;
/** Ruta del sonido de campana de afinado (acorde de Do mayor) */
const TUNED_PATH = `${CACHE_DIR}/tuned.wav`;

// Declaración de btoa para conversión base64 en React Native
declare const btoa: (input: string) => string;

/**
 * Escribe el encabezado WAV estándar (44 bytes) en un DataView.
 * Formato: PCM mono 16-bit a la frecuencia de muestreo especificada.
 *
 * @param view - DataView donde escribir
 * @param dataSize - Tamaño de los datos de audio en bytes
 * @param sampleRate - Frecuencia de muestreo (44100 Hz estándar)
 */
function writeWavHeader(view: DataView, dataSize: number, sampleRate: number): void {
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
}

/**
 * Genera datos WAV programáticamente con configuración de sonido personalizable.
 *
 * El sonido se construye muestra por muestra usando:
 * - Osciladores senoidales con armónicos
 * - Envelope ADSR para dar forma al sonido
 * - Amplitud controlada por volumen
 *
 * @param config - Configuración del sonido:
 *   - frequency: Frecuencia en Hz
 *   - durationMs: Duración en milisegundos
 *   - volume: Volumen (0-1, default 0.3)
 *   - attackMs: Tiempo de ataque en ms (default 2)
 *   - decayMs: Tiempo de decaimiento en ms (default 15)
 *   - sustainLevel: Nivel de sostenimiento (0-1, default 0.3)
 *   - harmonics: Array de amplitudes de armónicos (default [1] = solo fundamental)
 * @param sampleRate - Frecuencia de muestreo (default 44100)
 * @returns ArrayBuffer con datos WAV completos (encabezado + audio)
 */
function generateWavData(
  config: {
    frequency: number;
    durationMs: number;
    volume?: number;
    attackMs?: number;
    decayMs?: number;
    sustainLevel?: number;
    harmonics?: number[];
  },
  sampleRate: number = 44100,
): ArrayBuffer {
  const {frequency, durationMs, volume = 0.3, attackMs = 2, decayMs = 15, sustainLevel = 0.3, harmonics = [1]} = config;
  const numSamples = Math.floor(sampleRate * (durationMs / 1000));
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeWavHeader(view, dataSize, sampleRate);

  const amplitude = volume * 32767;
  const attackSamples = Math.floor(sampleRate * (attackMs / 1000));
  const decaySamples = Math.floor(sampleRate * (decayMs / 1000));

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let envelope = 1;

    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else if (i < attackSamples + decaySamples) {
      const decayProgress = (i - attackSamples) / decaySamples;
      envelope = 1 - (1 - sustainLevel) * decayProgress;
    } else {
      const releaseStart = numSamples - Math.floor(sampleRate * 0.005);
      if (i > releaseStart) {
        envelope = sustainLevel * (1 - (i - releaseStart) / (numSamples - releaseStart));
      } else {
        envelope = sustainLevel;
      }
    }

    let sample = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const harmonicAmp = harmonics[h];
      sample += Math.sin(2 * Math.PI * frequency * (h + 1) * t) * harmonicAmp;
    }

    const maxHarmonic = harmonics.reduce((sum, h) => sum + h, 0);
    sample = (sample / maxHarmonic) * amplitude * envelope;

    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(sample))), true);
  }

  return buffer;
}

/**
 * Genera una campana de acorde con múltiples notas superpuestas.
 * Usado para el sonido de "afinado" - suena un acorde de Do mayor (C-E-G).
 *
 * Cada nota tiene:
 * - Ataque rápido (5ms)
 * - Decaimiento exponencial
 * - Armónicos para enriquecer el timbre
 *
 * @param frequencies - Array de frecuencias (ej: [523.25, 659.25, 783.99] = Do-Mi-Sol)
 * @param noteDurationMs - Duración de cada nota individual en ms
 * @param sampleRate - Frecuencia de muestreo
 * @returns ArrayBuffer con WAV de la campana
 */
function generateChimeWav(
  frequencies: number[],
  noteDurationMs: number,
  sampleRate: number = 44100,
): ArrayBuffer {
  const totalDurationMs = noteDurationMs * frequencies.length + 200;
  const numSamples = Math.floor(sampleRate * (totalDurationMs / 1000));
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeWavHeader(view, dataSize, sampleRate);

  const amplitude = 0.25 * 32767;

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    for (let f = 0; f < frequencies.length; f++) {
      const noteStart = Math.floor(sampleRate * (f * noteDurationMs / 1000));
      const noteEnd = Math.floor(sampleRate * ((f + 1) * noteDurationMs / 1000 + 200));
      if (i >= noteStart && i < noteEnd) {
        const noteT = (i - noteStart) / sampleRate;
        const attack = Math.min(1, noteT / 0.005);
        const decay = Math.exp(-noteT * 8);
        const noteSample = Math.sin(2 * Math.PI * frequencies[f] * noteT) * 0.7
          + Math.sin(2 * Math.PI * frequencies[f] * 2 * noteT) * 0.2
          + Math.sin(2 * Math.PI * frequencies[f] * 3 * noteT) * 0.1;
        sample += noteSample * attack * decay;
      }
    }
    sample *= amplitude;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(sample))), true);
  }

  return buffer;
}

/**
 * Convierte un ArrayBuffer a string base64.
 * Necesario para escribir datos binarios via RNFS.writeFile.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Instancia del sonido de tick normal (se reutiliza) */
let normalSound: Sound | null = null;
/** Instancia del sonido de tick de acento (se reutiliza) */
let accentSound: Sound | null = null;
/** Instancia del sonido de campana de afinado (se reutiliza) */
let tunedSound: Sound | null = null;
/** Flag de inicialización para evitar crear sonidos múltiples veces */
let isInitialized = false;

/**
 * Inicializa los sonidos del metrónomo y afinador.
 * Genera archivos WAV temporales en el caché de la app.
 * Se ejecuta una vez al inicio (App.tsx y pantallas que usan audio).
 * Segura de llamar múltiples veces (no regenera si ya está inicializado).
 */
export async function initSounds(): Promise<void> {
  if (isInitialized) return;

  try {
    await RNFS.mkdir(CACHE_DIR);

    const normalWav = generateWavData({
      frequency: 1200,
      durationMs: 20,
      volume: 0.2,
      attackMs: 1,
      decayMs: 12,
      sustainLevel: 0.15,
      harmonics: [1, 0.3, 0.1],
    });
    await RNFS.writeFile(NORMAL_TICK_PATH, arrayBufferToBase64(normalWav), 'base64');

    const accentWav = generateWavData({
      frequency: 1800,
      durationMs: 25,
      volume: 0.3,
      attackMs: 1,
      decayMs: 15,
      sustainLevel: 0.2,
      harmonics: [1, 0.4, 0.15],
    });
    await RNFS.writeFile(ACCENT_TICK_PATH, arrayBufferToBase64(accentWav), 'base64');

    const tunedWav = generateChimeWav([523.25, 659.25, 783.99], 120);
    await RNFS.writeFile(TUNED_PATH, arrayBufferToBase64(tunedWav), 'base64');

    normalSound = new Sound(NORMAL_TICK_PATH, '', (error) => {
      if (error) console.warn('Error loading normal tick:', error);
    });

    accentSound = new Sound(ACCENT_TICK_PATH, '', (error) => {
      if (error) console.warn('Error loading accent tick:', error);
    });

    tunedSound = new Sound(TUNED_PATH, '', (error) => {
      if (error) console.warn('Error loading tuned sound:', error);
    });

    isInitialized = true;
  } catch (error) {
    console.warn('Error initializing sounds:', error);
  }
}

/**
 * Reproduce un tick del metrónomo.
 * @param isAccent - Si es true, suena el tick de acento (más agudo)
 *                   Si es false, suena el tick normal
 */
export function playTick(isAccent: boolean): void {
  const sound = isAccent ? accentSound : normalSound;
  if (sound) {
    sound.setCurrentTime(0);
    sound.play();
  }
}

/**
 * Reproduce el sonido de campana de afinado.
 * Suena un acorde de Do mayor (C-E-G) para indicar que la nota está afinada.
 * Se llama desde MainScreen cuando isTuned cambia a true.
 */
export function playTunedSound(): void {
  if (tunedSound) {
    tunedSound.setCurrentTime(0);
    tunedSound.play();
  }
}

/**
 * Libera los recursos de audio.
 * Se llama al desmontar pantallas que usan audio (cleanup de useEffect).
 * Los sonidos se regenerarán la próxima vez que se llame initSounds().
 */
export function cleanupSounds(): void {
  if (normalSound) {
    normalSound.release();
    normalSound = null;
  }
  if (accentSound) {
    accentSound.release();
    accentSound = null;
  }
  if (tunedSound) {
    tunedSound.release();
    tunedSound = null;
  }
  isInitialized = false;
}
