import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CIRCUMFERENCE = 364.4; // 2 * Math.PI * 58

export default function SOSButtonFlow() {
  const [state, setState] = useState('idle'); // idle | countdown | sending | sent | cancelled
  const [timeLeft, setTimeLeft] = useState(3.0);
  const navigate = useNavigate();

  const countdownIntervalRef = useRef(null);
  const sendingTimeoutRef = useRef(null);
  const sentTimeoutRef = useRef(null);
  const cancelTimeoutRef = useRef(null);
  
  // Track last tick integer to play ticking sound only on full seconds (3, 2, 1)
  const lastTickRef = useRef(4);

  // Sound Engine using Web Audio API
  const playSound = (type, options = {}) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'beep') {
        // SOS Button Tap: 200Hz, 0.1s, square wave, volume 0.3
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'tick') {
        // Countdown Tick: 800Hz, 0.05s, sine wave, volume 0.2
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'chime') {
        // Success Chime: 523Hz then 784Hz, 0.15s each, sine wave, volume 0.4
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(784, now + 0.15);
        gain2.gain.setValueAtTime(0.4, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.3);
      } else if (type === 'cancel') {
        // Cancel Descending Tone: 400Hz to 200Hz over 0.2s, volume 0.2
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser policy:", e);
    }
  };

  // Vibration Engine
  const triggerVibrate = (pattern) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn("Vibration API not supported:", e);
    }
  };

  const handleTrigger = () => {
    playSound('beep');
    triggerVibrate(200);
    setState('countdown');
    setTimeLeft(3.0);
    lastTickRef.current = 4;
  };

  // Custom Event Listeners to trigger SOS from settings/home in the app
  useEffect(() => {
    const handleSOSEvent = () => {
      if (state === 'idle') {
        handleTrigger();
      }
    };
    const handleSOSTestEvent = () => {
      if (state === 'idle') {
        // Direct test SOS bypass: jump straight to sending state
        playSound('beep');
        triggerVibrate(200);
        triggerBroadcast();
      }
    };
    window.addEventListener('trigger-sos', handleSOSEvent);
    window.addEventListener('trigger-sos-test', handleSOSTestEvent);
    return () => {
      window.removeEventListener('trigger-sos', handleSOSEvent);
      window.removeEventListener('trigger-sos-test', handleSOSTestEvent);
    };
  }, [state]);

  // State Machine logic
  useEffect(() => {
    if (state === 'countdown') {
      const step = 0.05; // 50ms steps for smooth circle transition
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - step;
          
          // Check if we hit a new full second tick (e.g. 3, 2, 1)
          const currentTickInt = Math.ceil(next);
          if (currentTickInt < lastTickRef.current && currentTickInt > 0) {
            playSound('tick');
            lastTickRef.current = currentTickInt;
          }

          if (next <= 0) {
            clearInterval(countdownIntervalRef.current);
            triggerBroadcast();
            return 0;
          }
          return parseFloat(next.toFixed(2));
        });
      }, 50);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [state]);

  const triggerBroadcast = () => {
    setState('sending');
    sendingTimeoutRef.current = setTimeout(() => {
      // Complete Broadcast
      playSound('chime');
      triggerVibrate([100, 100, 100]);

      // Add to emergency signals history (window.sharedNetData)
      if (!window.sharedNetData) window.sharedNetData = { signals: [] };
      if (!window.sharedNetData.signals) window.sharedNetData.signals = [];
      
      const newSignal = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        type: 'sent',
        title: 'Your SOS Signal',
        status: 'sent',
        time: 'Just now',
        timestamp: new Date().toISOString(),
        location: 'Your location',
        description: 'Critical SOS distress beacon broadcast successfully via proximity BLE and Wi-Fi transceivers.',
        sender: 'You (Self)',
        range: 'Local Transceiver',
        battery: '84%'
      };
      
      window.sharedNetData.signals.push(newSignal);

      // Dispatch global event so the feed updates dynamically if open
      window.dispatchEvent(new CustomEvent('demo-mode-changed'));

      setState('sent');
      
      // Auto dismiss after 5 seconds
      sentTimeoutRef.current = setTimeout(() => {
        setState('idle');
      }, 5000);
    }, 2000);
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sendingTimeoutRef.current) clearTimeout(sendingTimeoutRef.current);
    
    playSound('cancel');
    setState('cancelled');
    
    cancelTimeoutRef.current = setTimeout(() => {
      setState('idle');
    }, 500);
  };

  const handleDismiss = () => {
    if (sentTimeoutRef.current) clearTimeout(sentTimeoutRef.current);
    setState('idle');
  };

  const handleViewStatus = () => {
    if (sentTimeoutRef.current) clearTimeout(sentTimeoutRef.current);
    setState('idle');
    // Navigate to pulse telemetry / bluetooth mesh pulse view
    navigate('/pulse');
  };

  // Keyboard trap focus for overlay accessibility
  useEffect(() => {
    if (state === 'countdown') {
      const handleKeyDown = (e) => {
        if (e.key === 'Tab' || e.key === 'Escape') {
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [state]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (sendingTimeoutRef.current) clearTimeout(sendingTimeoutRef.current);
      if (sentTimeoutRef.current) clearTimeout(sentTimeoutRef.current);
      if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
    };
  }, []);

  const progressOffset = CIRCUMFERENCE - (timeLeft / 3.0) * CIRCUMFERENCE;

  return (
    <>
      {/* ── STATE 1: IDLE BUTTON ── */}
      {state === 'idle' && (
        <button
          onClick={handleTrigger}
          className="sos-trigger"
          aria-label="Emergency SOS Button. Tap to initiate 3-second countdown distress beacon."
          style={{ touchAction: 'manipulation' }}
        >
          <i className="ph-fill ph-shield-warning" style={{ fontSize: '32px' }} aria-hidden="true"></i>
          <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', letterSpacing: '1px' }}>SOS</span>
        </button>
      )}

      {/* ── STATE 2: COUNTDOWN OVERLAY ── */}
      {state === 'countdown' && (
        <div className="sos-overlay" role="dialog" aria-modal="true" aria-labelledby="sos-countdown-title">
          <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
            
            {/* SVG circular countdown container */}
            <div className="relative w-[130px] h-[130px] flex items-center justify-center">
              <svg width="130" height="130" className="absolute -rotate-90">
                <circle
                  cx="65"
                  cy="65"
                  r="58"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r="58"
                  stroke="var(--emergency, #FF3B30)"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  className="transition-all duration-75 ease-linear"
                />
              </svg>
              {/* Center Countdown number */}
              <div 
                id="sos-countdown-title"
                className="text-white font-bold" 
                style={{ fontSize: '36px', zIndex: 10 }}
              >
                {Math.ceil(timeLeft)}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h2 className="text-xl font-bold uppercase tracking-wide text-white">Distress Countdown</h2>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Broadcasting emergency coordinates to all nearby nodes in the mesh network.
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="mt-6 w-full flex items-center justify-center rounded-xl font-bold animate-pulse"
              style={{
                height: '56px',
                background: 'var(--bg-elevated, #2C2C2E)',
                border: '1px solid var(--border-medium, #48484A)',
                color: '#FFF',
                cursor: 'pointer',
                fontSize: '16px',
                letterSpacing: '0.5px'
              }}
              aria-label="Cancel emergency broadcast"
              autoFocus
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 3: SENDING OVERLAY ── */}
      {state === 'sending' && (
        <div className="sos-overlay" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-[#0A84FF] mb-2">
              <i className="ph-bold ph-spinner animate-spin" style={{ fontSize: '40px' }} aria-hidden="true"></i>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">Broadcasting...</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Replicating packets and negotiating peer nodes in mesh range.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 4: SENT OVERLAY ── */}
      {state === 'sent' && (
        <div className="sos-overlay" role="dialog" aria-modal="true" aria-labelledby="sos-sent-title">
          <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-[#34C759] mb-2 shadow-[0_0_20px_rgba(52,199,89,0.2)]">
              <i className="ph-fill ph-check-circle" style={{ fontSize: '48px' }} aria-hidden="true"></i>
            </div>

            <div className="space-y-2">
              <h2 id="sos-sent-title" className="text-2xl font-bold tracking-tight text-white italic">SIGNAL SENT</h2>
              <p className="text-sm text-slate-400">
                Distress beacon successfully mirrored across network.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[#34C759] text-xs font-bold mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> 3 Nearby Devices Notified
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                onClick={handleViewStatus}
                className="w-full flex items-center justify-center rounded-xl font-bold bg-[#0A84FF]"
                style={{ height: '48px', color: '#FFF' }}
              >
                View Status
              </button>
              <button
                onClick={handleDismiss}
                className="w-full flex items-center justify-center rounded-xl font-bold bg-transparent border border-[#0A84FF] text-[#0A84FF]"
                style={{ height: '48px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 5: CANCELLED FLASH OVERLAY ── */}
      {state === 'cancelled' && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center animate-fade-in"
          style={{ background: 'var(--bg-surface, #1C1C1E)' }}
          role="status"
          aria-live="assertive"
        >
          <div className="text-center space-y-2">
            <i className="ph-bold ph-x-circle text-rose-500" style={{ fontSize: '48px' }} aria-hidden="true"></i>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Signal Cancelled</h2>
          </div>
        </div>
      )}
    </>
  );
}
