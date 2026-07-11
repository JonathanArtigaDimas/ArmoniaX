import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

Sound.setCategory('Playback');

const CACHE_DIR = `${RNFS.CachesDirectoryPath}/sounds`;
const NORMAL_TICK_PATH = `${CACHE_DIR}/tick_normal.wav`;
const ACCENT_TICK_PATH = `${CACHE_DIR}/tick_accent.wav`;
const TUNED_PATH = `${CACHE_DIR}/tuned.wav`;

declare const btoa: (input: string) => string;

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

let normalSound: Sound | null = null;
let accentSound: Sound | null = null;
let tunedSound: Sound | null = null;
let isInitialized = false;

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

export function playTick(isAccent: boolean): void {
  const sound = isAccent ? accentSound : normalSound;
  if (sound) {
    sound.setCurrentTime(0);
    sound.play();
  }
}

export function playTunedSound(): void {
  if (tunedSound) {
    tunedSound.setCurrentTime(0);
    tunedSound.play();
  }
}

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
