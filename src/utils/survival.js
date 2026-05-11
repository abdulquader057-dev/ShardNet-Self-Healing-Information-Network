/**
 * ShardNet Survival Utilities
 * Handles hardware-level emergency triggers (Flashlight, Battery, Motion)
 */

// 🔦 3. FLASHLIGHT SOS MODE
let flashlightInterval = null;
export const toggleFlashlightSOS = async (active) => {
  if (!active) {
    if (flashlightInterval) clearInterval(flashlightInterval);
    flashlightInterval = null;
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      let state = false;
      flashlightInterval = safeInterval(async () => {
        state = !state;
        await track.applyConstraints({ advanced: [{ torch: state }] });
        // SOS Pattern: ... --- ... (simplified for now to rhythmic strobe)
      }, 300);
    }
  } catch (e) {
    console.warn("Flashlight control not supported on this browser/device.");
  }
};

import { safeCall, safeInterval } from '../core/stability';

// 🔋 7. CRITICAL BATTERY AUTO MODE
export const monitorBattery = (onCritical) => {
  if (!navigator.getBattery) return;

  navigator.getBattery().then(battery => {
    const check = () => {
      if (battery.level <= 0.05) { // 5%
        safeCall(onCritical, "Battery Critical Callback");
      }
    };
    battery.addEventListener('levelchange', check);
    check();
  });
};

// 🆘 10. AUTO SOS (SHAKE DETECTION)
let lastShake = 0;
export const initShakeDetection = (onShake) => {
  if (!window.DeviceMotionEvent) return;

  window.addEventListener('devicemotion', (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const threshold = 25;
    const delta = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);

    if (delta > threshold) {
      const now = Date.now();
      if (now - lastShake > 2000) { // Throttle
        lastShake = now;
        safeCall(onShake, "Shake Detection Callback");
      }
    }
  });
};

// 🏥 5. OFFLINE FIRST AID DATA
export const FIRST_AID_GUIDE = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    steps: [
      'Check scene safety',
      'Check responsiveness',
      'Call for help / SOS',
      'Push hard & fast in center of chest',
      '100-120 compressions per minute'
    ]
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    steps: [
      'Apply direct pressure with clean cloth',
      'Maintain pressure until help arrives',
      'If bleeding doesn\'t stop, use tourniquet',
      'Tie 2 inches above wound'
    ]
  },
  {
    id: 'choking',
    title: 'Choking',
    steps: [
      'Give 5 back blows between shoulder blades',
      'Give 5 abdominal thrusts (Heimlich)',
      'Repeat until object is forced out'
    ]
  }
];
