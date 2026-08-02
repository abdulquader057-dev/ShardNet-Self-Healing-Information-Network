// SHARDNET FEEDBACK LAYER (SOUND & HAPTICS)

let sharedAudioContext = null;

export const AudioEngine = {
  play(type) {
    // Respect settings sound status
    const soundEnabled = localStorage.getItem('setting_sound_alerts') !== 'false';
    if (!soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      if (!sharedAudioContext) {
        sharedAudioContext = new AudioContext();
      }
      const ctx = sharedAudioContext;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const now = ctx.currentTime;

      if (type === 'tap') {
        // Subtle confirm tap: 800Hz sine, 0.05s, vol 0.15
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } 
      else if (type === 'success') {
        // Positive resolution: 523Hz then 784Hz, 0.12s each, sine, vol 0.3
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(784, now + 0.12);
        gain2.gain.setValueAtTime(0.3, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.24);
      } 
      else if (type === 'error') {
        // Low failure buzz: 200Hz square, 0.3s, vol 0.2
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } 
      else if (type === 'warning') {
        // Warning alert: 400Hz sine, 0.15s, vol 0.25
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } 
      else if (type === 'sos') {
        // SOS beacon: 3 short beeps (800Hz, 0.1s) + 1 long tone (600Hz, 0.4s), vol 0.4
        const playBeep = (freq, start, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.4, now + start);
          gain.gain.setValueAtTime(0.4, now + start + duration - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + duration);
        };

        // 3 short dots
        playBeep(800, 0, 0.1);
        playBeep(800, 0.2, 0.1);
        playBeep(800, 0.4, 0.1);
        // 1 long dash
        playBeep(600, 0.6, 0.4);
      } 
      else if (type === 'receive') {
        // Ascending two-tone: 440Hz -> 660Hz, 0.2s, vol 0.3
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } 
      else if (type === 'send') {
        // Descending two-tone: 660Hz -> 440Hz, 0.2s, vol 0.3
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  }
};

export const Haptic = {
  vibrate(pattern) {
    const vibrationEnabled = localStorage.getItem('setting_vibration') !== 'false';
    if (!vibrationEnabled) return;

    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn("Haptic Vibration unsupported:", e);
    }
  },

  tap() {
    this.vibrate(10); // Light click confirmation
  },

  success() {
    this.vibrate([50, 100, 50]); // Two clean short pulses
  },

  warning() {
    this.vibrate([100, 50, 100]); // Alternating alerts
  },

  error() {
    this.vibrate(300); // Strong warning buzz
  },

  sos() {
    this.vibrate([200, 100, 200, 100, 200]); // SOS vibration cadence
  }
};
