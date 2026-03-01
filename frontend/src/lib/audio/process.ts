/**
 * Lightweight client-side audio processing for recognition:
 * band-pass (80–4000 Hz), silence trim, simple VAD trim, normalize gain, 16 kHz mono WAV.
 * Single pass where possible; no heavy DSP.
 */

import { encodeWav } from "./wavEncoder";

const TARGET_SAMPLE_RATE = 16000;
const BANDPASS_LOW = 80;
const BANDPASS_HIGH = 4000;
const RMS_SILENCE_THRESHOLD = 0.008;
const MIN_VOICE_MS = 120;
const TARGET_RMS = 0.12;

export interface ProcessOptions {
  /** Apply band-pass filter (80–4000 Hz). Default true. */
  bandpass?: boolean;
  /** Trim leading/trailing silence. Default true. */
  trimSilence?: boolean;
  /** Drop leading/trailing non-voice (simple VAD). Default true. */
  trimVad?: boolean;
  /** Normalize gain to target RMS. Default true. */
  normalize?: boolean;
}

const defaultOptions: Required<ProcessOptions> = {
  bandpass: true,
  trimSilence: true,
  trimVad: true,
  normalize: true,
};

function rms(samples: Float32Array, start: number, end: number): number {
  let sum = 0;
  const n = end - start;
  if (n <= 0) return 0;
  for (let i = start; i < end; i++) {
    const v = samples[i];
    sum += v * v;
  }
  return Math.sqrt(sum / n);
}

function trimSilence(samples: Float32Array, sampleRate: number): Float32Array {
  const winLen = Math.floor((50 / 1000) * sampleRate); // 50 ms windows
  const thresh = RMS_SILENCE_THRESHOLD;
  let start = 0;
  let end = samples.length;
  for (let i = 0; i <= samples.length - winLen; i += winLen) {
    if (rms(samples, i, i + winLen) >= thresh) {
      start = i;
      break;
    }
  }
  for (let i = samples.length - winLen; i >= 0; i -= winLen) {
    if (rms(samples, i, i + winLen) >= thresh) {
      end = i + winLen;
      break;
    }
  }
  if (start >= end) return samples;
  return samples.slice(start, end);
}

function trimVad(samples: Float32Array, sampleRate: number): Float32Array {
  const winLen = Math.floor((80 / 1000) * sampleRate);
  const minVoiceFrames = Math.ceil((MIN_VOICE_MS / 1000) * sampleRate / winLen);
  const thresh = RMS_SILENCE_THRESHOLD * 1.5;
  let start = 0;
  let end = samples.length;
  let run = 0;
  for (let i = 0; i <= samples.length - winLen; i += winLen) {
    if (rms(samples, i, i + winLen) >= thresh) {
      run++;
      if (run >= minVoiceFrames) {
        start = Math.max(0, i - winLen * (minVoiceFrames - 1));
        break;
      }
    } else {
      run = 0;
    }
  }
  run = 0;
  for (let i = samples.length - winLen; i >= 0; i -= winLen) {
    if (rms(samples, i, i + winLen) >= thresh) {
      run++;
      if (run >= minVoiceFrames) {
        end = Math.min(samples.length, i + winLen * minVoiceFrames);
        break;
      }
    } else {
      run = 0;
    }
  }
  if (start >= end) return samples;
  return samples.slice(start, end);
}

function normalize(samples: Float32Array, targetRms: number): void {
  const current = rms(samples, 0, samples.length);
  if (current < 1e-6) return;
  const g = targetRms / current;
  for (let i = 0; i < samples.length; i++) {
    let v = samples[i] * g;
    samples[i] = Math.max(-1, Math.min(1, v));
  }
}

/**
 * Process recorded audio: decode, optional band-pass, trim, normalize, resample to 16 kHz mono, encode WAV.
 */
export async function processAudio(
  blob: Blob,
  options: ProcessOptions = {}
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  const duration = audioBuffer.duration;
  const numSamples = Math.ceil(duration * TARGET_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, numSamples, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offline.destination);

  let filterNode: BiquadFilterNode | null = null;
  if (opts.bandpass) {
    filterNode = offline.createBiquadFilter();
    filterNode.type = "bandpass";
    const center = Math.sqrt(BANDPASS_LOW * BANDPASS_HIGH);
    filterNode.frequency.value = center;
    filterNode.Q.value = center / (BANDPASS_HIGH - BANDPASS_LOW);
    source.disconnect();
    source.connect(filterNode);
    filterNode.connect(offline.destination);
  }
  source.start(0);
  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);

  let out: Float32Array = new Float32Array(samples.length);
  out.set(samples);
  if (opts.trimSilence) {
    out = new Float32Array(trimSilence(out, TARGET_SAMPLE_RATE));
  }
  if (opts.trimVad) {
    out = new Float32Array(trimVad(out, TARGET_SAMPLE_RATE));
  }
  if (opts.normalize && out.length > 0) {
    normalize(out, TARGET_RMS);
  }

  return encodeWav(out, TARGET_SAMPLE_RATE);
}

/**
 * Decode multiple blobs, concatenate (resample to 16 kHz), then same pipeline as processAudio.
 * Used for sliding-window recognition (e.g. merge six 1s chunks into a 6s window).
 */
export async function processAudioFromBlobs(
  blobs: Blob[],
  options: ProcessOptions = {}
): Promise<ArrayBuffer> {
  if (blobs.length === 0) throw new Error("processAudioFromBlobs requires at least one blob");
  if (blobs.length === 1) return processAudio(blobs[0], options);

  const opts = { ...defaultOptions, ...options };
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const buffers: AudioBuffer[] = [];
  let totalDuration = 0;
  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const ab = await ctx.decodeAudioData(arrayBuffer.slice(0));
    buffers.push(ab);
    totalDuration += ab.duration;
  }

  const numSamples = Math.ceil(totalDuration * TARGET_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, numSamples, TARGET_SAMPLE_RATE);
  let t = 0;
  for (const ab of buffers) {
    const source = offline.createBufferSource();
    source.buffer = ab;
    source.connect(offline.destination);
    source.start(t);
    t += ab.duration;
  }
  const rendered = await offline.startRendering();
  let samples = rendered.getChannelData(0);

  if (opts.bandpass) {
    const bandpassCtx = new OfflineAudioContext(1, samples.length, TARGET_SAMPLE_RATE);
    const buf = bandpassCtx.createBuffer(1, samples.length, TARGET_SAMPLE_RATE);
    buf.copyToChannel(samples, 0);
    const src = bandpassCtx.createBufferSource();
    src.buffer = buf;
    const filter = bandpassCtx.createBiquadFilter();
    filter.type = "bandpass";
    const center = Math.sqrt(BANDPASS_LOW * BANDPASS_HIGH);
    filter.frequency.value = center;
    filter.Q.value = center / (BANDPASS_HIGH - BANDPASS_LOW);
    src.connect(filter);
    filter.connect(bandpassCtx.destination);
    src.start(0);
    const filtered = await bandpassCtx.startRendering();
    samples = filtered.getChannelData(0);
  }

  let out: Float32Array = new Float32Array(samples.length);
  out.set(samples);
  if (opts.trimSilence) {
    out = new Float32Array(trimSilence(out, TARGET_SAMPLE_RATE));
  }
  if (opts.trimVad) {
    out = new Float32Array(trimVad(out, TARGET_SAMPLE_RATE));
  }
  if (opts.normalize && out.length > 0) {
    normalize(out, TARGET_RMS);
  }

  return encodeWav(out, TARGET_SAMPLE_RATE);
}
