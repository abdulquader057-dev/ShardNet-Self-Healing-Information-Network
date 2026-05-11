/**
 * ShardNet Audio SOS Generator
 * Uses Web Audio API to generate a high-frequency rhythmic alarm without external files.
 */

import { safeInterval } from '../core/stability';

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let interval = null;

export const startAudioSOS = () => {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();

  let state = false;
  interval = safeInterval(() => {
    state = !state;
    const now = audioCtx.currentTime;
    gainNode.gain.setTargetAtTime(state ? 0.5 : 0, now, 0.05);
  }, 500);
};

export const stopAudioSOS = () => {
  if (!audioCtx) return;
  
  clearInterval(interval);
  oscillator.stop();
  audioCtx.close();
  
  audioCtx = null;
  oscillator = null;
  gainNode = null;
  interval = null;
};
