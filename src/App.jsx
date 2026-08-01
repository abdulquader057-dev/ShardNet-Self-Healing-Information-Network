import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// GLOBAL ACCESSIBILITY FEEDBACK ENGINES
// ═══════════════════════════════════════════════════════════════
const AudioEngine = {
  play(type) {
    try {
      const isSoundOn = localStorage.getItem('setting_sound_alerts') !== 'false';
      if (!isSoundOn) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); 
        osc.frequency.setValueAtTime(659, now + 0.08); 
        osc.frequency.setValueAtTime(784, now + 0.16); 
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.25);
      } else if (type === 'warning') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
      } else if (type === 'sos') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
        osc.frequency.linearRampToValueAtTime(500, now + 0.6);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.8);
      }
    } catch (e) {
      console.warn("Audio blocked", e);
    }
  }
};

const Haptic = {
  tap() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) navigator.vibrate(10);
    } catch(e) {}
  },
  success() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) navigator.vibrate([40, 40, 40]);
    } catch(e) {}
  },
  warning() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) navigator.vibrate([80, 40, 80]);
    } catch(e) {}
  },
  error() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) navigator.vibrate(250);
    } catch(e) {}
  },
  sos() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) {
        navigator.vibrate([100, 100, 100, 100, 100, 100, 300, 100, 300, 100, 300, 100, 100, 100, 100, 100, 100]);
      }
    } catch(e) {}
  }
};

export default function App() {
  // Screens & Navigation (Instruction 5 & 7)
  const [activeTab, setActiveTab] = useState('network'); 
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(localStorage.getItem('sharednet_onboarded') === 'true');
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  // Status metrics & identity
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deviceAlias, setDeviceAlias] = useState(localStorage.getItem('setting_device_name') || 'WV1K');
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [tempAlias, setTempAlias] = useState(deviceAlias);
  const [toasts, setToasts] = useState([]);
  
  // Settings & Showcase
  const [demoMode, setDemoMode] = useState(localStorage.getItem('sharednet_demo_mode') === 'true');
  const [presentationMode, setPresentationMode] = useState(localStorage.getItem('presentation_mode') === 'true');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('setting_high_contrast') === 'true');
  const [largeText, setLargeText] = useState(localStorage.getItem('setting_large_text') === 'true');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('setting_reduce_motion') === 'true');
  const [soundAlerts, setSoundAlerts] = useState(localStorage.getItem('setting_sound_alerts') !== 'false');
  const [vibration, setVibration] = useState(localStorage.getItem('setting_vibration') !== 'false');

  // Pitch helper overlays
  const [showHelpers, setShowHelpers] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);

  // SOS Engine States (Instruction 9)
  const [sosState, setSosState] = useState('idle'); // idle | countdown | sending | sent | cancelled
  const [sosTimeLeft, setSosTimeLeft] = useState(3.0);
  const countdownIntervalRef = useRef(null);
  const sendingTimeoutRef = useRef(null);
  const sentTimeoutRef = useRef(null);

  // Signals Feed & Connected Devices Database
  const [signals, setSignals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [activeEmergencyBannerDismissed, setActiveEmergencyBannerDismissed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Map references
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════
  // REUSABLE DISPATCHERS
  // ═══════════════════════════════════════════════════════════════
  const showToast = (type, message) => {
    const id = Math.random().toString();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);

    const delay = localStorage.getItem('presentation_mode') === 'true' ? 8000 : 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, delay);
  };

  // Seed mock databases depending on Demo Mode
  const populateDatabases = (modeActive) => {
    if (modeActive) {
      setDevices([
        { id: '1', name: 'Trekker-09', type: 'Handheld Radio', signal: 'Strong', lastSeen: '2m ago', coords: [17.4080, 78.4750], status: 'success' },
        { id: '2', name: 'Medic-Hub', type: 'HQ Station', signal: 'Good', lastSeen: '4m ago', coords: [17.4020, 78.4710], status: 'success' },
        { id: '3', name: 'BaseCamp-2', type: 'Gateway Link', signal: 'Weak', lastSeen: '8m ago', coords: [17.4110, 78.4820], status: 'warning' },
        { id: '4', name: 'Hiker-42', type: 'Mobile Node', signal: 'Critical', lastSeen: '12m ago', coords: [17.4040, 78.4800], status: 'emergency' }
      ]);
      setSignals([
        {
          id: 'sig-1',
          type: 'received',
          title: 'Hiker-42 Emergency SOS',
          status: 'active',
          time: '4m ago',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          location: '120m northeast',
          description: "Distress signal from hiker. Message: 'Twisted ankle, cannot walk. Need medical assistance.'",
          sender: 'Hiker-42',
          range: '120m',
          battery: '34%'
        },
        {
          id: 'sig-2',
          type: 'received',
          title: 'BaseCamp Water Advisory',
          status: 'resolved',
          time: '2h ago',
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          location: '2.1km north',
          description: "River levels peaked, danger has passed. Local bridge remains closed.",
          sender: 'BaseCamp-2',
          range: '2.1km',
          battery: '98%'
        }
      ]);
    } else {
      setDevices([]);
      setSignals([]);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATIONS & GLOBAL LISTENERS
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    populateDatabases(demoMode);

    // Fade out splash screen after 1.5s (Instruction 17)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    // Online detection listeners
    const goOnline = () => {
      setIsOnline(true);
      showToast('success', 'Network connection linked');
    };
    const goOffline = () => {
      setIsOnline(false);
      showToast('error', 'Searching for nearby devices...');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Global click haptics & audio binding
    const handleGlobalClick = (e) => {
      const button = e.target.closest('button, a, .nav-tab, .card');
      if (button) {
        AudioEngine.play('tap');
        Haptic.tap();
      }
    };
    document.addEventListener('click', handleGlobalClick);

    // Presentation mode initial sync
    if (presentationMode) document.documentElement.classList.add('presentation-mode');
    if (highContrast) document.documentElement.classList.add('high-contrast');
    if (largeText) document.documentElement.style.fontSize = '120%';
    if (reduceMotion) document.documentElement.classList.add('reduce-motion');

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('click', handleGlobalClick);
      clearTimeout(splashTimer);
    };
  }, []);

  // Keyboard Demo Controller Shortcuts (Instruction 3 of Prompt 7)
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Shift + D: Toggle Demo Mode
      if (e.key === 'D' && e.shiftKey) {
        e.preventDefault();
        const nextDemo = !demoMode;
        setDemoMode(nextDemo);
        localStorage.setItem('sharednet_demo_mode', nextDemo.toString());
        populateDatabases(nextDemo);
        AudioEngine.play(nextDemo ? 'success' : 'warning');
        Haptic.warning();
        showToast('info', `Demo Mode ${nextDemo ? 'Activated' : 'Deactivated'}`);
      }

      // Shift + R: Reset all data
      else if (e.key === 'R' && e.shiftKey) {
        e.preventDefault();
        AudioEngine.play('error');
        Haptic.error();
        localStorage.clear();
        window.location.reload();
      }

      // Shift + S: Simulate emergency incoming signal
      else if (e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        const simSig = {
          id: `sim-${Date.now()}`,
          type: 'received',
          title: 'Trekker-09 Emergency SOS',
          status: 'active',
          time: 'Just now',
          timestamp: new Date().toISOString(),
          location: '320m northwest',
          description: "Incoming signal: 'Injured trekker, coordinates shared. Need urgent evacuation.'",
          sender: 'Trekker-09',
          range: '320m',
          battery: '52%'
        };
        setSignals(prev => [simSig, ...prev]);
        AudioEngine.play('sos');
        Haptic.sos();
        showToast('error', 'Simulated emergency alert received');
        setActiveEmergencyBannerDismissed(false);
      }

      // Shift + T: Advance timestamps by 1 hour
      else if (e.key === 'T' && e.shiftKey) {
        e.preventDefault();
        setSignals(prev => prev.map(s => ({
          ...s,
          timestamp: new Date(new Date(s.timestamp).getTime() - 60 * 60 * 1000).toISOString(),
          time: '1h older'
        })));
        AudioEngine.play('success');
        Haptic.tap();
        showToast('info', 'Demo: Advanced timestamps by 1 hour');
      }

      // Shift + H: Toggle helper panel
      else if (e.key === 'H' && e.shiftKey) {
        e.preventDefault();
        setShowHelpers(prev => !prev);
      }

      // Tab switcher shortcuts: N (Network), E (Feed)
      else if (key === 'n') {
        e.preventDefault();
        setActiveTab('network');
      } else if (key === 'e') {
        e.preventDefault();
        setActiveTab('feed');
      } else if (key === 's') {
        e.preventDefault();
        if (sosState === 'idle') handleSOSStart();
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [demoMode, sosState]);

  // ═══════════════════════════════════════════════════════════════
  // MAP LEAFLET RENDERING ENGINE (Instruction 8)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab === 'map' && !showSplash && onboarded) {
      const renderTimer = setTimeout(() => {
        const mapDom = document.getElementById('map-container');
        if (!mapDom) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const L = window.L;
        if (!L) return;

        // Initialize Leaflet Map centered on Hyderabad
        const map = L.map('map-container', {
          zoomControl: false,
          attributionControl: false,
          tap: false
        }).setView([17.4065, 78.4772], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;

        const markerGroup = L.layerGroup().addTo(map);
        markerGroupRef.current = markerGroup;

        // 1. User pin
        const userIcon = L.divIcon({
          html: '<div class="user-marker-container"><div class="user-marker"></div><div class="user-marker-pulse"></div></div>',
          className: 'custom-user-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([17.4065, 78.4772], { icon: userIcon }).addTo(markerGroup);

        // 2. Mesh Node pins
        devices.forEach(d => {
          if (d.name === 'Hiker-42') return; // rendering emergency siren pin instead
          const nodeIcon = L.divIcon({
            html: `<div class="map-node-marker ${d.status}"><i class="ph-bold ${d.status === 'success' ? 'ph-check-circle' : 'ph-warning'}"></i></div>`,
            className: 'custom-node-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          L.marker(d.coords, { icon: nodeIcon })
            .addTo(markerGroup)
            .bindPopup(`
              <div style="padding: 2px;">
                <p style="font-weight:700; color:white; font-size:12px; margin-bottom:2px;">${d.name}</p>
                <p style="color:#8E8E93; font-size:10px;">Type: ${d.type} • Signal: ${d.signal}</p>
                <p style="color:#8E8E93; font-size:10px; font-style:italic; margin-top:4px;">Last seen ${d.lastSeen}</p>
              </div>
            `);
        });

        // 3. Active Emergency Siren Marker
        const hasActiveEmergency = signals.find(s => s.status === 'active');
        if (hasActiveEmergency) {
          const emergencyIcon = L.divIcon({
            html: '<div class="map-node-marker emergency"><i class="ph-fill ph-siren" style="font-size:20px;"></i></div>',
            className: 'custom-emergency-marker',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });
          L.marker([17.4040, 78.4800], { icon: emergencyIcon })
            .addTo(markerGroup)
            .bindPopup(`
              <div style="padding: 2px;">
                <p style="font-weight:900; color:#FF3B30; font-size:12px; text-transform:uppercase; margin-bottom:2px;">🚨 Active Emergency</p>
                <p style="font-weight:700; color:white; font-size:11px;">Node: Hiker-42</p>
                <p style="color:#8E8E93; font-size:10px; margin-top:2px;">Twisted ankle, cannot walk. Need medical assistance.</p>
              </div>
            `, { closeButton: false }).openPopup();
        }

      }, 100);

      return () => clearTimeout(renderTimer);
    }
  }, [activeTab, showSplash, onboarded, devices, signals]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([17.4065, 78.4772], 14);
      showToast('info', 'Centering map on current location');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SOS TRIGGER SEQUENCE (Instruction 9)
  // ═══════════════════════════════════════════════════════════════
  const handleSOSStart = () => {
    setSosState('countdown');
    setSosTimeLeft(3.0);
    AudioEngine.play('warning');
    Haptic.warning();

    let ticks = 3;
    countdownIntervalRef.current = setInterval(() => {
      ticks -= 0.1;
      setSosTimeLeft(parseFloat(ticks.toFixed(1)));
      if (Math.abs(ticks - Math.floor(ticks)) < 0.05) {
        AudioEngine.play('tap');
      }

      if (ticks <= 0) {
        clearInterval(countdownIntervalRef.current);
        handleSOSBroadcast();
      }
    }, 100);
  };

  const handleSOSBroadcast = () => {
    setSosState('sending');
    AudioEngine.play('sos');
    Haptic.sos();

    sendingTimeoutRef.current = setTimeout(() => {
      setSosState('sent');
      AudioEngine.play('success');
      Haptic.success();

      // Injects sent message to timeline database
      const mySOS = {
        id: `sos-${Date.now()}`,
        type: 'sent',
        title: 'Emergency SOS Sent',
        status: 'sent',
        time: 'Just now',
        timestamp: new Date().toISOString(),
        location: 'Your location',
        description: 'Distress beacon propagated successfully across adjacent transceivers.',
        sender: 'You (Self)',
        range: 'Local Transceiver',
        battery: '84%'
      };
      setSignals(prev => [mySOS, ...prev]);

      // Auto dismiss sent modal after 4.5s
      sentTimeoutRef.current = setTimeout(() => {
        setSosState('idle');
      }, 4500);

    }, 2000);
  };

  const handleSOSCancel = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sendingTimeoutRef.current) clearTimeout(sendingTimeoutRef.current);
    setSosState('idle');
    AudioEngine.play('error');
    Haptic.error();
    showToast('info', 'Emergency SOS cancelled');
  };

  // ═══════════════════════════════════════════════════════════════
  // TIMELINE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const handleMarkResolved = (id) => {
    setSignals(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: 'resolved' };
      }
      return s;
    }));
    if (selectedSignal && selectedSignal.id === id) {
      setSelectedSignal(null);
    }
    AudioEngine.play('success');
    Haptic.success();
    showToast('success', 'Alert resolved and mesh network notified');
  };

  const handleScanForDevices = () => {
    setIsScanning(true);
    AudioEngine.play('tap');
    Haptic.tap();

    setTimeout(() => {
      setIsScanning(false);
      const hostFound = devices.some(d => d.name === 'Command-Center');
      if (hostFound) {
        showToast('info', 'No new mesh devices found nearby.');
      } else {
        const ccNode = {
          id: '5',
          name: 'Command-Center',
          type: 'Station Hub',
          signal: 'Strong',
          lastSeen: 'Just now',
          coords: [17.4120, 78.4790],
          status: 'success'
        };
        setDevices(prev => [ccNode, ...prev]);
        AudioEngine.play('success');
        Haptic.success();
        showToast('success', 'Connected to new device: Command-Center');
      }
    }, 2500);
  };

  const handleVersionClick = () => {
    const nextTaps = versionTaps + 1;
    setVersionTaps(nextTaps);

    if (nextTaps >= 5) {
      const nextPres = !presentationMode;
      setPresentationMode(nextPres);
      localStorage.setItem('presentation_mode', nextPres.toString());
      if (nextPres) {
        document.documentElement.classList.add('presentation-mode');
        showToast('info', 'Presentation Mode: Animations slowed for display');
      } else {
        document.documentElement.classList.remove('presentation-mode');
        showToast('info', 'Presentation Mode Disabled');
      }
      setVersionTaps(0);
    } else {
      showToast('info', `Tap version ${5 - nextTaps} more times for presentation settings`);
    }
  };

  const handleFinishOnboarding = () => {
    setOnboarded(true);
    localStorage.setItem('sharednet_onboarded', 'true');
    AudioEngine.play('success');
    Haptic.success();
  };

  // Render variables
  const activeEmergency = signals.find(s => s.status === 'active');

  return (
    <div id="app" className={`${presentationMode ? 'presentation-mode' : ''} ${highContrast ? 'high-contrast' : ''}`}>
      
      {/* ── TOP STATUS BAR (Instruction 6) ── */}
      <header className="status-bar" data-label="Status Bar">
        <span style={{ fontWeight: 600, fontSize: '13px' }}>09:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 8px #34C759' }}></span>
          <span className="text-caption" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>Mesh Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
          <i className="ph-fill ph-battery-full" style={{ color: 'var(--success)', fontSize: '18px' }} />
          <span>84%</span>
        </div>
      </header>

      {/* ── STICKY ACTIVE BANNER (Instruction 11) ── */}
      {activeEmergency && !activeEmergencyBannerDismissed && activeTab !== 'map' && (
        <div 
          className="fixed left-4 right-4 p-4 rounded-xl border border-red-500/20 flex items-center justify-between gap-3 shadow-lg z-[50]"
          style={{ 
            top: 'calc(48px + var(--space-3) + env(safe-area-inset-top))', 
            background: 'linear-gradient(135deg, #FF3B30 0%, #C92A2A 100%)' 
          }}
          data-label="Active emergency notification"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 animate-pulse">
              <i className="ph-fill ph-siren" style={{ fontSize: '22px' }} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full block w-fit mb-0.5">Alert Priority</span>
              <p className="text-xs font-bold text-white truncate">{activeEmergency.title}</p>
              <p className="text-[10px] text-white/80">{activeEmergency.time} • {activeEmergency.location}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              onClick={() => setSelectedSignal(activeEmergency)}
              className="px-3 py-1.5 bg-white text-[#FF3B30] text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-transform"
            >
              Respond
            </button>
            <button 
              onClick={() => setActiveEmergencyBannerDismissed(true)}
              className="text-white/80 hover:text-white p-1"
              aria-label="Dismiss banner"
            >
              <i className="ph-bold ph-x" style={{ fontSize: '16px' }} />
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 1: NETWORK VIEW (Instruction 10) ── */}
      <section className={`screen ${activeTab === 'network' ? 'active' : ''}`} id="screen-network">
        <div className="screen-content">
          <div className="space-y-1">
            <h1 className="text-h1 text-white">Network Status</h1>
            <p className="text-body-sm">Your mesh network connections</p>
          </div>

          <div className="card-elevated" style={{ padding: 'var(--space-5)' }} data-label="Primary node link data">
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <div>
                <span className="text-caption block mb-1">State</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 10px #34C759' }}></span>
                  <span className="text-h2 text-white font-bold">Network Active</span>
                </div>
              </div>
              <span className="text-[10px] bg-[#2C2C2E] text-slate-300 font-bold px-2.5 py-1 rounded-full border border-slate-700">
                {devices.length} Connected
              </span>
            </div>

            <div className="h-[1px] bg-slate-800 my-2" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div>
                <i className="ph-bold ph-wifi-high text-[#0A84FF] text-xl" />
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mt-1">Signal</span>
                <span className="text-xs font-bold text-white">{devices.length > 0 ? 'Strong' : 'Searching'}</span>
              </div>
              <div>
                <i className="ph-bold ph-arrows-left-right text-[#FF9500] text-xl" />
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mt-1">Range</span>
                <span className="text-xs font-bold text-white">~120m</span>
              </div>
              <div>
                <i className="ph-bold ph-clock text-[#5AC8FA] text-xl" />
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mt-1">Uptime</span>
                <span className="text-xs font-bold text-white">14m</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-caption block pl-1">Connected Devices</span>

            {devices.length === 0 ? (
              <div className="card text-center py-8 space-y-2">
                <i className="ph-bold ph-shield-check text-4xl text-slate-600 block mx-auto" />
                <span className="text-h3 text-white font-bold block">No one nearby yet</span>
                <p className="text-xs text-slate-500 leading-normal max-w-[280px] mx-auto">
                  No other active transceivers detected. Move closer to other emergency responders.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {devices.map(device => {
                  const statusColors = {
                    success: 'border-emerald-500 text-emerald-500',
                    warning: 'border-amber-500 text-amber-500',
                    emergency: 'border-red-500 text-red-500 animate-pulse'
                  };

                  return (
                    <div key={device.id} className="card flex-row items-center justify-between" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`w-11 h-11 rounded-full bg-[#2C2C2E] border-2 flex items-center justify-center shrink-0 ${statusColors[device.status]}`}>
                          <i className={`ph-bold ${device.status === 'emergency' ? 'ph-siren' : 'ph-cell-signal-high'}`} style={{ fontSize: '20px' }} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{device.name}</span>
                          <span className="text-[10px] text-slate-500 block">{device.type} • {device.signal} Link</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                        <span className="text-[9px] text-slate-500 italic">seen {device.lastSeen}</span>
                        {/* Signal bars */}
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'end', height: '14px' }}>
                          <div className="w-[3px] bg-emerald-500" style={{ height: '4px', borderRadius: '1px' }} />
                          <div className="w-[3px] bg-emerald-500" style={{ height: '7px', borderRadius: '1px' }} />
                          <div className="w-[3px] bg-emerald-500" style={{ height: '10px', borderRadius: '1px' }} />
                          <div className="w-[3px] bg-emerald-500" style={{ height: '13px', borderRadius: '1px', opacity: device.status === 'warning' ? 0.3 : 1 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button 
              onClick={handleScanForDevices}
              disabled={isScanning}
              className="btn-outline mt-2"
              data-label="Scan Trigger"
            >
              {isScanning ? (
                <>
                  <i className="ph-bold ph-spinner animate-spin" />
                  <span>Searching Airspace...</span>
                </>
              ) : (
                <>
                  <i className="ph-bold ph-magnifying-glass" />
                  <span>Scan for Connected Devices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── SCREEN 2: DEDICATED MAP SCREEN (Instruction 8) ── */}
      <section className={`screen ${activeTab === 'map' ? 'active' : ''}`} id="screen-map">
        <div id="map-container">
          <button onClick={handleRecenter} className="map-recenter-btn">
            <i className="ph-bold ph-crosshair" />
            <span>Recenter</span>
          </button>
        </div>
      </section>

      {/* ── SCREEN 3: ALERTS / EMERGENCY FEED (Instruction 11) ── */}
      <section className={`screen ${activeTab === 'feed' ? 'active' : ''}`} id="screen-feed">
        <div className="screen-content">
          <div className="space-y-1">
            <h1 className="text-h1 text-white">Emergency Feed</h1>
            <p className="text-body-sm">Distress alerts from surrounding transceivers</p>
          </div>

          {signals.length === 0 ? (
            <div className="card text-center py-12 space-y-3">
              <i className="ph-bold ph-shield-check text-5xl text-[#34C759] block mx-auto animate-pulse" />
              <span className="text-h2 text-white font-bold block">No active emergencies</span>
              <p className="text-xs text-slate-500 leading-normal max-w-[240px] mx-auto">
                No distress beacons detected. Mesh network airspace is quiet.
              </p>
            </div>
          ) : (
            <div className="timeline mt-2" data-label="Mesh timeline logs">
              {signals.map(sig => {
                const isEmergency = sig.status === 'active';
                const isResolved = sig.status === 'resolved';
                
                return (
                  <div key={sig.id} className="timeline-item">
                    <span className={`timeline-dot ${sig.status}`} />
                    
                    <div 
                      onClick={() => setSelectedSignal(sig)}
                      className="card cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider block text-slate-500 mb-0.5">{sig.time}</span>
                          <h4 className="text-xs font-bold text-white">{sig.title}</h4>
                        </div>
                        <span className={`status-pill uppercase tracking-wider ${isEmergency ? 'status-pill--danger' : isResolved ? 'status-pill--success' : 'status-pill--info'}`}>
                          {sig.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {sig.description}
                      </p>
                      
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/60 justify-end">
                        {isEmergency && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkResolved(sig.id); }}
                            className="px-3 py-1 bg-[#34C759] text-white rounded text-[9px] font-bold uppercase active:scale-95 transition-transform"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button className="px-3 py-1 bg-transparent border border-slate-700 text-slate-400 rounded text-[9px] font-bold uppercase hover:bg-slate-800">
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── SCREEN 4: SETTINGS VIEW (Instruction 12) ── */}
      <section className={`screen ${activeTab === 'settings' ? 'active' : ''}`} id="screen-settings">
        <div className="screen-content">
          <div className="space-y-1">
            <h1 className="text-h1 text-white">Settings</h1>
            <p className="text-body-sm">Configure mesh transceivers & parameters</p>
          </div>

          {/* Group 1: Device Info */}
          <div className="space-y-2">
            <span className="text-caption block pl-1">Device Identity</span>
            <div className="card bg-[#1C1C1E] border-slate-800 rounded-xl divide-y divide-slate-800/60" style={{ gap: 0, padding: 0 }}>
              
              <div className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Device Alias</span>
                  {isEditingAlias ? (
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="text" 
                        value={tempAlias} 
                        onChange={e => setTempAlias(e.target.value)} 
                        className="bg-[#2C2C2E] border border-slate-700 text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#0A84FF]"
                        maxLength={12}
                      />
                      <button onClick={handleSaveName} className="p-1 bg-[#34C759] text-white rounded"><i className="ph-bold ph-check" /></button>
                    </div>
                  ) : (
                    <span className="text-white text-xs font-semibold">{deviceAlias}</span>
                  )}
                </div>
                {!isEditingAlias && (
                  <button onClick={() => { setTempAlias(deviceAlias); setIsEditingAlias(true); }} className="text-slate-400 hover:text-white p-1">
                    <i className="ph-bold ph-pencil" />
                  </button>
                )}
              </div>

              <div className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Mesh Role</span>
                  <span className="text-slate-400 text-xs">Propagates emergency signals</span>
                </div>
                <span className="status-pill status-pill--success uppercase tracking-wider">
                  Relay Node
                </span>
              </div>
            </div>
          </div>

          {/* Group 2: Hackathon Showcase */}
          <div className="space-y-2">
            <span className="text-caption block pl-1 text-[#FF9500]">Hackathon Showcase</span>
            <div className="card border-dashed border-[#FF9500]/50" style={{ background: 'rgba(255,149,0,0.04)', padding: '16px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-bold text-xs">Demo Mode</span>
                  <p className="text-[10px] text-[#FF9500] mt-0.5">Seeds simulated transceivers for judges.</p>
                </div>
                <ToggleSwitch 
                  checked={demoMode} 
                  onChange={(val) => {
                    setDemoMode(val);
                    localStorage.setItem('sharednet_demo_mode', val.toString());
                    populateDatabases(val);
                    AudioEngine.play(val ? 'success' : 'warning');
                    showToast('info', `Demo Mode ${val ? 'ON' : 'OFF'}`);
                  }}
                  activeColor="#FF9500"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Operations Config */}
          <div className="space-y-2">
            <span className="text-caption block pl-1">Operations Config</span>
            <div className="card bg-[#1C1C1E] border-slate-800 rounded-xl space-y-4" style={{ padding: '16px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold text-xs">Sound Alerts</span>
                  <p className="text-[10px] text-slate-500">Play acoustic siren sweeps.</p>
                </div>
                <ToggleSwitch 
                  checked={soundAlerts} 
                  onChange={(val) => { setSoundAlerts(val); localStorage.setItem('setting_sound_alerts', val.toString()); }} 
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold text-xs">Tactile Haptics</span>
                  <p className="text-[10px] text-slate-500">Vibrate patterns during alerts.</p>
                </div>
                <ToggleSwitch 
                  checked={vibration} 
                  onChange={(val) => { setVibration(val); localStorage.setItem('setting_vibration', val.toString()); }} 
                />
              </div>

              <button 
                onClick={handleTestSOS}
                className="w-full py-3 bg-[#FF3B30] text-white text-xs font-bold uppercase rounded-lg active:scale-95 transition-transform"
              >
                Test SOS (Instant Beam)
              </button>
            </div>
          </div>

          {/* Group 4: Accessibility */}
          <div className="space-y-2">
            <span className="text-caption block pl-1">Accessibility</span>
            <div className="card bg-[#1C1C1E] border-slate-800 rounded-xl space-y-4" style={{ padding: '16px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold text-xs">High Contrast Mode</span>
                  <p className="text-[10px] text-slate-500">Increases border and link visibility.</p>
                </div>
                <ToggleSwitch 
                  checked={highContrast} 
                  onChange={(val) => {
                    setHighContrast(val);
                    localStorage.setItem('setting_high_contrast', val.toString());
                    if (val) document.documentElement.classList.add('high-contrast');
                    else document.documentElement.classList.remove('high-contrast');
                  }} 
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold text-xs">Large UI Text</span>
                  <p className="text-[10px] text-slate-500">Scale layout typography by 120%.</p>
                </div>
                <ToggleSwitch 
                  checked={largeText} 
                  onChange={(val) => {
                    setLargeText(val);
                    localStorage.setItem('setting_large_text', val.toString());
                    if (val) document.documentElement.style.fontSize = '120%';
                    else document.documentElement.style.fontSize = '100%';
                  }} 
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold text-xs">Reduce Motion</span>
                  <p className="text-[10px] text-slate-500">Deactivates structural transitions.</p>
                </div>
                <ToggleSwitch 
                  checked={reduceMotion} 
                  onChange={(val) => {
                    setReduceMotion(val);
                    localStorage.setItem('setting_reduce_motion', val.toString());
                    if (val) document.documentElement.classList.add('reduce-motion');
                    else document.documentElement.classList.remove('reduce-motion');
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Group 5: About Section */}
          <div className="space-y-2">
            <span className="text-caption block pl-1">About</span>
            <div className="card bg-[#1C1C1E] border-slate-800 rounded-xl divide-y divide-slate-800/60 text-xs" style={{ gap: 0, padding: 0 }}>
              <div 
                onClick={handleVersionClick} 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
              >
                <span className="text-slate-500 font-medium text-xs">Software Version</span>
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <span>1.0.0 (Hackathon Build)</span>
                  {presentationMode && <span className="bg-[#FF9500] text-black px-1.5 py-0.5 rounded text-[8px] font-black uppercase">PRES</span>}
                </span>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 font-medium text-xs">Pitch Location</span>
                <span className="text-white font-semibold">Founders Fest 2026</span>
              </div>

              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 font-medium text-xs">Project Blueprint</span>
                <button 
                  onClick={() => { setShowAboutModal(true); AudioEngine.play('success'); }}
                  className="text-[#0A84FF] font-semibold text-xs hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Open Blueprint
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOS FLOATING ACTION BUTTON (Instruction 9) ── */}
      {sosState === 'idle' && !showSplash && onboarded && (
        <button 
          onClick={handleSOSStart} 
          className="sos-fab"
          data-label="SOS FAB"
        >
          <i className="ph-fill ph-siren" style={{ fontSize: '28px' }} />
          <span>SOS</span>
        </button>
      )}

      {/* ── BOTTOM NAVIGATION TAB BAR (Instruction 7) ── */}
      {!showSplash && onboarded && (
        <nav className="bottom-nav" data-label="Bottom Navigation">
          <button 
            onClick={() => setActiveTab('network')} 
            className={`nav-tab ${activeTab === 'network' ? 'active' : ''}`}
          >
            <i className={`ph-bold ph-globe ${activeTab === 'network' ? 'text-2xl' : 'text-xl'}`} />
            <span>Network</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('map')} 
            className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
          >
            <i className={`ph-bold ph-map-trifold ${activeTab === 'map' ? 'text-2xl' : 'text-xl'}`} />
            <span>Map</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('feed')} 
            className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
          >
            <i className={`ph-bold ph-bell ${activeTab === 'feed' ? 'text-2xl' : 'text-xl'}`} />
            <span>Alerts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <i className={`ph-bold ph-gear ${activeTab === 'settings' ? 'text-2xl' : 'text-xl'}`} />
            <span>Settings</span>
          </button>
        </nav>
      )}

      {/* ── SOS COUNTDOWN OVERLAY (Instruction 9 & 15) ── */}
      <AnimatePresence>
        {sosState === 'countdown' && (
          <div className="sos-overlay" role="dialog" aria-modal="true">
            <div style={{ textAlign: 'center', spaceY: '24px', maxWidth: '320px', width: '100%' }}>
              <h2 className="text-hero text-white mb-2">BROADCASTING</h2>
              <p className="text-body-sm text-slate-400 mb-8">
                Your emergency beacon will be sent across all nearby devices in:
              </p>

              {/* Countdown circle */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-8">
                <svg className="absolute -rotate-90" width="144" height="144">
                  <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="64" 
                    stroke="var(--emergency)" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={402.1}
                    strokeDashoffset={402.1 - (sosTimeLeft / 3.0) * 402.1}
                    style={{ transition: 'stroke-dashoffset 100ms linear' }}
                  />
                </svg>
                <span className="text-hero text-white" style={{ fontSize: '3rem' }}>{Math.ceil(sosTimeLeft)}</span>
              </div>

              <button 
                onClick={handleSOSCancel}
                className="btn-emergency w-full"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'white' }}
              >
                Cancel Broadcast
              </button>
            </div>
          </div>
        )}

        {sosState === 'sending' && (
          <div className="sos-overlay" role="dialog" aria-modal="true">
            <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%', spaceY: '16px' }}>
              <i className="ph-bold ph-spinner animate-spin text-5xl text-[#FF3B30] mb-4 block mx-auto" />
              <h2 className="text-h2 text-white">Broadcasting...</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Propagating distress coordinates via adjacent radio transmitters.
              </p>
            </div>
          </div>
        )}

        {sosState === 'sent' && (
          <div className="sos-overlay" role="dialog" aria-modal="true" style={{ background: '#0A0A0F' }}>
            <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%', spaceY: '24px' }}>
              <div className="w-20 h-20 rounded-full bg-[#34C759]/10 border-2 border-[#34C759] flex items-center justify-center mx-auto mb-6">
                <i className="ph-bold ph-check text-4xl text-[#34C759]" />
              </div>
              <h2 className="text-h1 text-white mb-2">Signal Sent</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Your emergency beacon was broadcasted successfully. Nearby devices are acting as signal repeaters.
              </p>
              <button 
                onClick={() => setSosState('idle')}
                className="btn-primary"
                style={{ background: 'var(--bg-elevated)', color: 'white' }}
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOAST STACKS (Instruction 2) ── */}
      <div className="toast-container pointer-events-none" style={{ position: 'absolute', top: '48px', left: 0, right: 0, zIndex: 'var(--z-toast)' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`toast-box ${toast.type}`}
            >
              <span className="text-xs text-white font-bold">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white pointer-events-auto"
              >
                <i className="ph-bold ph-x" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── EMERGENCY DETAIL SHEET MODAL (Instruction 11) ── */}
      <AnimatePresence>
        {selectedSignal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="absolute inset-0" onClick={() => setSelectedSignal(null)} />
            
            <div className="modal-sheet">
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                <div>
                  <span className="text-caption text-slate-500 mb-1 block">{selectedSignal.time} • {selectedSignal.location}</span>
                  <h3 className="text-h2 text-white font-black">{selectedSignal.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedSignal(null)}
                  className="icon-btn"
                  aria-label="Close modal"
                >
                  <i className="ph-bold ph-x" style={{ fontSize: '20px' }} />
                </button>
              </div>

              <div className="h-[1px] bg-slate-800" />

              <div className="space-y-1">
                <span className="text-caption block">Coordinates Description</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#2C2C2E]/30 p-3 rounded-lg border border-slate-800">
                  {selectedSignal.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="p-3 bg-[#2C2C2E]/20 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Device Source</span>
                  <span className="text-xs font-bold text-white block mt-0.5">{selectedSignal.sender}</span>
                </div>
                <div className="p-3 bg-[#2C2C2E]/20 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Device Battery</span>
                  <span className="text-xs font-bold text-white block mt-0.5">{selectedSignal.battery}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {selectedSignal.status === 'active' && (
                  <button 
                    onClick={() => handleMarkResolved(selectedSignal.id)}
                    className="flex-1 h-12 bg-[#34C759] text-white rounded-xl font-bold text-xs uppercase active:scale-95 transition-transform"
                  >
                    Mark Resolved
                  </button>
                )}
                <button 
                  onClick={() => setSelectedSignal(null)}
                  className="flex-1 h-12 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase active:scale-95 transition-transform"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── JUDGE ABOUT bluePRINT MODAL (Instruction 4) ── */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="absolute inset-0" onClick={() => setShowAboutModal(false)} />
            
            <div className="modal-sheet relative z-10" style={{ maxHeight: '85%' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                <div>
                  <h3 className="text-h2 text-white font-black uppercase italic tracking-tight">SharedNet Blueprint</h3>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Founders Fest 2026 Build</span>
                </div>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="icon-btn"
                >
                  <i className="ph-bold ph-x" style={{ fontSize: '20px' }} />
                </button>
              </div>

              <div className="h-[1px] bg-slate-800" />

              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>
                  <strong className="text-white">Emergency communication when everything else fails.</strong>
                </p>
                <p>
                  When natural disasters, remote location hiking accidents, or infrastructure attacks sever communications, SharedNet forms a self-healing mesh network using WebRTC data channels and Bluetooth Low Energy.
                </p>
                <p>
                  Every phone becomes a repeater. Sharded messages hop from device to device until they reach coordinates of help.
                </p>
                <div>
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider block mb-1">Technical Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['WebRTC GATT', 'BLE Gossiping', 'AES-256-GCM', 'Offline Cache PWA'].map(tech => (
                      <span key={tech} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[8px] font-bold">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#2C2C2E]/40 border border-slate-800 p-4 rounded-lg text-center space-y-2 my-2">
                  <span className="text-[9px] text-[#FF9500] font-black uppercase tracking-widest block">Scan to Run App</span>
                  
                  {/* Mock inline SVG QR code */}
                  <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto bg-white p-1.5 rounded">
                    <rect x="0" y="0" width="30" height="30" fill="black" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="black" />
                    <rect x="70" y="0" width="30" height="30" fill="black" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="80" y="10" width="10" height="10" fill="black" />
                    <rect x="0" y="70" width="30" height="30" fill="black" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="10" y="80" width="10" height="10" fill="black" />
                    <rect x="75" y="75" width="10" height="10" fill="black" />
                    <rect x="78" y="78" width="4" height="4" fill="white" />
                    <rect x="35" y="5" width="10" height="5" fill="black" />
                    <rect x="55" y="10" width="5" height="15" fill="black" />
                    <rect x="40" y="25" width="15" height="5" fill="black" />
                    <rect x="5" y="45" width="15" height="10" fill="black" />
                    <rect x="25" y="35" width="5" height="20" fill="black" />
                    <rect x="35" y="45" width="20" height="5" fill="black" />
                    <rect x="45" y="55" width="5" height="15" fill="black" />
                    <rect x="15" y="60" width="10" height="5" fill="black" />
                    <rect x="65" y="35" width="15" height="5" fill="black" />
                    <rect x="60" y="50" width="5" height="15" fill="black" />
                    <rect x="85" y="45" width="10" height="10" fill="black" />
                    <rect x="70" y="60" width="10" height="5" fill="black" />
                  </svg>
                  
                  <p className="text-[9px] text-slate-500 leading-normal">Open on judge devices to test decentralized links</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <a 
                  href="https://github.com/abdulquader057-dev/ShardNet-Self-Healing-Information-Network" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 h-12 bg-transparent border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase hover:bg-slate-800"
                >
                  <i className="ph-bold ph-github-logo" style={{ fontSize: '18px' }} />
                  <span>Repository</span>
                </a>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="flex-1 h-12 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase active:scale-95 transition-transform"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── KEYBOARD DEMO HELPERS CONSOLE (Shift + H) ── */}
      {showHelpers && (
        <div className="fixed bottom-24 left-4 z-[9999] p-4 bg-[#1C1C1E] border border-slate-850 rounded-xl max-w-[280px] text-[10px] text-slate-400 space-y-2 shadow-2xl pointer-events-auto">
          <div className="flex justify-between items-center text-white font-bold uppercase tracking-wider">
            <span>Demo Console</span>
            <button onClick={() => setShowHelpers(false)} className="text-slate-500 hover:text-white"><i className="ph-bold ph-x" /></button>
          </div>
          <div className="h-[1px] bg-slate-800" />
          <ul className="space-y-1 list-disc pl-3">
            <li><b className="text-[#FF9500]">Shift + D</b>: Toggle Demo Mode</li>
            <li><b className="text-[#FF3B30]">Shift + S</b>: Ingest Emergency Beacon</li>
            <li><b className="text-[#0A84FF]">Shift + T</b>: Age alerts by 1 hour</li>
            <li><b className="text-slate-200">Shift + R</b>: Nuclear Database Wipe</li>
            <li><b className="text-slate-200">Shift + H</b>: Close panel</li>
          </ul>
        </div>
      )}

      {/* ── FIRST-TIME ONBOARDING FLOW OVERLAY (Instruction 1) ── */}
      {!onboarded && (
        <div className="onboarding fixed inset-0 z-[100000] bg-[#0A0A0F] flex flex-col justify-between p-6">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(10,132,255,0.06) 0%, transparent 65%)' }} />

          <div className="flex justify-end z-10">
            <button 
              onClick={handleFinishOnboarding}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider py-2 px-4"
            >
              Skip
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto z-10">
            <AnimatePresence mode="wait">
              {onboardingSlide === 0 && (
                <motion.div
                  key="slide0"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-[#0A84FF]/10 flex items-center justify-center border border-[#0A84FF]/20 shadow-[0_0_20px_rgba(10,132,255,0.15)]">
                    <i className="ph-fill ph-broadcast text-[#0A84FF] animate-pulse" style={{ fontSize: '56px' }} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">No Signal?<br/>No Problem.</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      SharedNet links phone transceivers peer-to-peer. No internet or towers required.
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingSlide === 1 && (
                <motion.div
                  key="slide1"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-[#FF3B30]/10 flex items-center justify-center border border-[#FF3B30]/20 shadow-[0_0_20px_rgba(255,59,48,0.15)]">
                    <i className="ph-fill ph-siren text-[#FF3B30] animate-bounce" style={{ fontSize: '56px' }} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">One Tap SOS</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Broadcast coordinates instantly in flash floods, earthquakes, or coordinate rescue beacons with nearby repeaters.
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingSlide === 2 && (
                <motion.div
                  key="slide2"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center border border-[#34C759]/20 shadow-[0_0_20px_rgba(52,199,89,0.15)]">
                    <i className="ph-fill ph-shield-check text-[#34C759]" style={{ fontSize: '56px' }} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">You're Protected</h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your transceiver is secure, end-to-end encrypted, and ready to act as a lifeline in disaster grids.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6 max-w-sm w-full mx-auto z-10 pb-6">
            <div className="flex justify-center items-center gap-2">
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    onboardingSlide === idx 
                      ? 'w-6 bg-[#0A84FF]' 
                      : 'w-2 bg-[#2C2C2E]'
                  }`}
                />
              ))}
            </div>

            <div className="space-y-2">
              {onboardingSlide < 2 ? (
                <button
                  onClick={() => {
                    setOnboardingSlide(prev => prev + 1);
                    AudioEngine.play('tap');
                    Haptic.tap();
                  }}
                  className="w-full py-4 bg-[#0A84FF] text-white rounded-xl font-bold text-sm uppercase tracking-wider active:scale-[0.99] transition-transform"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinishOnboarding}
                  className="w-full py-4 bg-[#34C759] text-white rounded-xl font-bold text-sm uppercase tracking-wider active:scale-[0.99] transition-transform"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SPLASH SCREEN (Instruction 17) ── */}
      {showSplash && (
        <div id="splash" className="z-[999999]">
          <div className="w-16 h-16 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.2)]">
            <i className="ph-fill ph-shield-check text-[#0A84FF] animate-pulse" style={{ fontSize: '32px' }} />
          </div>
          <h1 className="text-hero text-white uppercase tracking-[0.2em] italic mt-2">SharedNet</h1>
          <p className="text-body-sm text-slate-500">Emergency Mesh Network</p>
        </div>
      )}

    </div>
  );

  // Helper functions inside component scope
  function handleSaveName() {
    setDeviceAlias(tempAlias);
    localStorage.setItem('setting_device_name', tempAlias);
    setIsEditingAlias(false);
    showToast('success', 'Alias updated');
  }

  function handleTestSOS() {
    AudioEngine.play('warning');
    Haptic.warning();
    if (confirm("⚠️ Trigger emergency SOS test signal?")) {
      handleSOSBroadcast();
    }
  }
}

// Custom Toggle Switch primitive
function ToggleSwitch({ checked, onChange, activeColor = '#34C759' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors duration-200 ease-in-out cursor-pointer rounded-full outline-none focus:ring-1 focus:ring-[#0A84FF]/40"
      style={{
        width: '52px',
        height: '32px',
        backgroundColor: checked ? activeColor : 'var(--bg-elevated, #2C2C2E)'
      }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform duration-200 ease-in-out"
        style={{
          width: '28px',
          height: '28px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
          marginTop: '2px',
          verticalAlign: 'top'
        }}
      />
    </button>
  );
}
