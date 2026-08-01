import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Audio Synthesizer Engine (Instruction 12)
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
        osc.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now); // D5
        osc.frequency.setValueAtTime(698, now + 0.08); // F5
        osc.frequency.setValueAtTime(880, now + 0.16); // A5
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
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
      } else if (type === 'warning') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
      } else if (type === 'sos') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(1040, now + 0.4);
        osc.frequency.linearRampToValueAtTime(520, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.9);
      }
    } catch(e) {}
  }
};

// Tactile Vibration Mappings (Instruction 12)
const Haptic = {
  tap() {
    try {
      const isVibrateOn = localStorage.getItem('setting_vibration') !== 'false';
      if (isVibrateOn && navigator.vibrate) navigator.vibrate(8);
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
      if (isVibrateOn && navigator.vibrate) navigator.vibrate(200);
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
  // Navigation & States
  const [activeTab, setActiveTab] = useState('home'); // home | scan | pulse | inbox | vault | config
  const [showSplash, setShowSplash] = useState(true);
  const [airGapActive, setAirGapActive] = useState(localStorage.getItem('setting_air_gap') === 'true');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('sharednet_demo_mode') === 'true');
  const [presentationMode, setPresentationMode] = useState(localStorage.getItem('presentation_mode') === 'true');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('setting_high_contrast') === 'true');
  const [largeText, setLargeText] = useState(localStorage.getItem('setting_large_text') === 'true');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('setting_reduce_motion') === 'true');
  const [showHelpers, setShowHelpers] = useState(false);
  const [toasts, setToasts] = useState([]);

  // SOS Countdown state machine (Instruction 10)
  const [sosState, setSosState] = useState('idle'); // idle | countdown | sending | sent
  const [sosTimeLeft, setSosTimeLeft] = useState(3.0);
  const countdownIntervalRef = useRef(null);
  const sendingTimeoutRef = useRef(null);
  const sentTimeoutRef = useRef(null);

  // Map Feature states (Instruction 11)
  const [showMapModal, setShowMapModal] = useState(false);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);

  // Intel drop creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [intelContent, setIntelContent] = useState('');
  const [generatedShards, setGeneratedShards] = useState([]);

  // Safe check status update modal
  const [showSafeCheckModal, setShowSafeCheckModal] = useState(false);

  // Survival Kit sheet
  const [showSurvivalKit, setShowSurvivalKit] = useState(false);

  // About blueprint leaves-behind modal
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);

  // Scan items loading spinner state
  const [isScanning, setIsScanning] = useState(false);

  // Database seed
  const [signals, setSignals] = useState([]);
  const [devices, setDevices] = useState([]);

  const deviceId = 'NODE-5UK5';

  const showToast = (type, message) => {
    const id = Math.random().toString();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);

    const delay = localStorage.getItem('presentation_mode') === 'true' ? 8000 : 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, delay);
  };

  const populateDatabase = (modeActive) => {
    if (modeActive) {
      setDevices([
        { id: '1', name: 'Trekker-09', type: 'Handheld Radio', signal: 'Strong', lastSeen: '2m ago', coords: [28.57, 77.21], status: 'success' },
        { id: '2', name: 'BaseCamp-2', type: 'Gateway Link', signal: 'Weak', lastSeen: '8m ago', coords: [31.41, 76.43], status: 'warning' },
        { id: '3', name: 'NIMHANS-Base', type: 'Medic Node', signal: 'Good', lastSeen: '4m ago', coords: [12.94, 77.58], status: 'success' }
      ]);
      setSignals([
        {
          id: 'sig-1',
          type: 'received',
          title: 'Flood Alert - Bihar',
          status: 'active',
          time: '4m ago',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          location: 'Bihar Risk Zone',
          description: "Flash flood warnings issued. Evacuate local lowlands immediately.",
          sender: 'NDRF-Base',
          range: 'Local Mesh Link',
          battery: '94%'
        }
      ]);
    } else {
      setDevices([]);
      setSignals([]);
    }
  };

  useEffect(() => {
    populateDatabase(demoMode);

    // Splash screen fadeout timer (Instruction 13)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    // Dynamic class bindings
    if (presentationMode) document.documentElement.classList.add('presentation-mode');
    if (highContrast) document.documentElement.classList.add('high-contrast');
    if (largeText) document.documentElement.style.fontSize = '120%';
    if (reduceMotion) document.documentElement.classList.add('reduce-motion');

    // Global tap click haptics & audio binding
    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, a, .feature-card, .nav-item');
      if (target) {
        AudioEngine.play('tap');
        Haptic.tap();
      }
    };
    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      clearTimeout(splashTimer);
    };
  }, []);

  // Keyboard Shortcuts (Instruction 3 of Prompt 7)
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
        populateDatabase(nextDemo);
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

      // Shift + S: Ingest emergency simulation signal
      else if (e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        const simulated = {
          id: `sim-${Date.now()}`,
          type: 'received',
          title: 'Simulated SOS Distress Alert',
          status: 'active',
          time: 'Just now',
          timestamp: new Date().toISOString(),
          location: 'Sector 4 Area',
          description: "SOS Beacon received via BLE gossip link. Medical assistance request initiated.",
          sender: 'Medic-Hub',
          range: '240m',
          battery: '74%'
        };
        setSignals(prev => [simulated, ...prev]);
        AudioEngine.play('sos');
        Haptic.sos();
        showToast('error', 'Demo: Simulated emergency received');
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

      // Shift + H: Toggle helper shortcuts legend
      else if (e.key === 'H' && e.shiftKey) {
        e.preventDefault();
        setShowHelpers(prev => !prev);
      }

      // Tab navigators
      else if (key === 'n') {
        e.preventDefault();
        setActiveTab('home');
      } else if (key === 'e') {
        e.preventDefault();
        setActiveTab('inbox');
      } else if (key === 's') {
        e.preventDefault();
        if (sosState === 'idle') handleSOSStart();
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [demoMode, sosState]);

  // ═══════════════════════════════════════════════════════════════
  // MAP LEAFLET RENDERING ENGINE (Instruction 11)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (showMapModal && !showSplash) {
      const renderTimer = setTimeout(() => {
        const container = document.getElementById('map-container');
        if (!container) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const L = window.L;
        if (!L) return;

        // Initialize Leaflet Map centered on India to view all coordinates
        const map = L.map('map-container', {
          zoomControl: false,
          attributionControl: false,
          tap: false
        }).setView([22.0, 78.0], 5);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;

        const markerGroup = L.layerGroup().addTo(map);
        markerGroupRef.current = markerGroup;

        // 1. User pin (Delhi)
        const userIcon = L.divIcon({
          html: '<div class="user-marker-container"><div class="user-marker"></div><div class="user-marker-pulse"></div></div>',
          className: 'custom-user-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([28.57, 77.21], { icon: userIcon }).addTo(markerGroup);

        // 2. Add Tactical Index locations (Mock data markers)
        const locations = [
          { name: 'AIIMS New Delhi', type: 'HOSPITAL', coords: [28.57, 77.21], color: '#FF3B30' },
          { name: 'Apollo Hospitals Mumbai', type: 'HOSPITAL', coords: [19.02, 72.82], color: '#FF3B30' },
          { name: 'Bhakra Nangal Reservoir', type: 'RESERVOIR', coords: [31.41, 76.43], color: '#0A84FF' },
          { name: 'NDRF Base Ghaziabad', type: 'SHELTER', coords: [28.67, 77.45], color: '#30D158' },
          { name: 'NIMHANS Bangalore', type: 'HOSPITAL', coords: [12.94, 77.58], color: '#FF3B30' },
          { name: 'Indira Sagar Dam', type: 'RESERVOIR', coords: [22.29, 76.47], color: '#0A84FF' },
          { name: 'High-Flood Risk Zone (Bihar)', type: 'DANGER', coords: [25.59, 85.13], color: '#FF9F0A' }
        ];

        locations.forEach(loc => {
          const pinColorClass = loc.type === 'HOSPITAL' ? 'border-[#FF3B30] text-[#FF3B30]' : 
                              loc.type === 'RESERVOIR' ? 'border-[#0A84FF] text-[#0A84FF]' :
                              loc.type === 'SHELTER' ? 'border-[#30D158] text-[#30D158]' : 'border-[#FF9F0A] text-[#FF9F0A]';
          const pinIcon = L.divIcon({
            html: `<div class="map-node-marker" style="border: 2px solid ${loc.color}; color: ${loc.color}; background: #141419;"><i class="ph-bold ph-map-pin"></i></div>`,
            className: 'custom-node-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          L.marker(loc.coords, { icon: pinIcon })
            .addTo(markerGroup)
            .bindPopup(`
              <div style="padding: 2px;">
                <span style="font-size: 8px; font-weight: 800; color: ${loc.color}; text-transform: uppercase;">${loc.type}</span>
                <p style="font-weight:700; color:white; font-size:12px; margin-top:2px;">${loc.name}</p>
                <p style="color:#8E8E93; font-size:10px; margin-top:2px;">Coordinates: ${loc.coords[0]}, ${loc.coords[1]}</p>
              </div>
            `);
        });

      }, 100);

      return () => clearTimeout(renderTimer);
    }
  }, [showMapModal, showSplash]);

  // ═══════════════════════════════════════════════════════════════
  // SOS TRIGGER OVERLAYS (Instruction 10)
  // ═══════════════════════════════════════════════════════════════
  const handleSOSStart = () => {
    setSosState('countdown');
    setSosTimeLeft(3.0);
    AudioEngine.play('warning');
    Haptic.warning();

    let count = 3.0;
    countdownIntervalRef.current = setInterval(() => {
      count -= 0.1;
      setSosTimeLeft(parseFloat(count.toFixed(1)));
      if (Math.abs(count - Math.floor(count)) < 0.05) {
        AudioEngine.play('tap');
      }

      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        triggerSOSBroadcast();
      }
    }, 100);
  };

  const triggerSOSBroadcast = () => {
    setSosState('sending');
    AudioEngine.play('sos');
    Haptic.sos();

    sendingTimeoutRef.current = setTimeout(() => {
      setSosState('sent');
      AudioEngine.play('success');
      Haptic.success();

      // Add to emergency logs
      const mySOS = {
        id: `sos-${Date.now()}`,
        type: 'sent',
        title: 'Emergency SOS Broadcasted',
        status: 'sent',
        time: 'Just now',
        timestamp: new Date().toISOString(),
        location: 'Your Location',
        description: 'Priority distress beacon broadcasted successfully over active BLE and Wi-Fi Gossip links.',
        sender: 'You (Self)',
        range: 'Local Transceiver',
        battery: '84%'
      };
      setSignals(prev => [mySOS, ...prev]);

      sentTimeoutRef.current = setTimeout(() => {
        setSosState('idle');
      }, 4000);

    }, 2000);
  };

  const handleSOSCancel = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sendingTimeoutRef.current) clearTimeout(sendingTimeoutRef.current);
    setSosState('idle');
    AudioEngine.play('error');
    Haptic.error();
    showToast('info', 'SOS Beacon aborted');
  };

  // ═══════════════════════════════════════════════════════════════
  // SHARD INTEL drops CREATOR
  // ═══════════════════════════════════════════════════════════════
  const handleCreateIntelDrop = () => {
    if (!intelContent.trim()) {
      showToast('error', 'Intelligence payload content cannot be blank');
      return;
    }
    
    // Splitting mock shards
    const mockShards = [
      { id: '1', content: `SHARD-A: ${intelContent.substring(0, 10)}...` },
      { id: '2', content: `SHARD-B: ${intelContent.substring(10, 20)}...` }
    ];
    setGeneratedShards(mockShards);
    AudioEngine.play('success');
    Haptic.success();
    showToast('success', 'Intelligence payload sharded into 2 air-gap carriers');
  };

  const handleAirGapToggle = () => {
    const nextGap = !airGapActive;
    setAirGapActive(nextGap);
    localStorage.setItem('setting_air_gap', nextGap.toString());
    AudioEngine.play(nextGap ? 'warning' : 'success');
    Haptic.warning();
    showToast('info', `Air-Gap Transmitters: ${nextGap ? 'MUTED (offline security)' : 'ACTIVE'}`);
  };

  const handleScanNodes = () => {
    setIsScanning(true);
    AudioEngine.play('tap');
    Haptic.tap();

    setTimeout(() => {
      setIsScanning(false);
      const hostFound = devices.some(d => d.name === 'Command-Center');
      if (hostFound) {
        showToast('info', 'No new transceivers found in local BLE airspace.');
      } else {
        const ccNode = {
          id: '5',
          name: 'Command-Center',
          type: 'HQ Hub Station',
          signal: 'Strong',
          lastSeen: 'Just now',
          coords: [28.67, 77.45],
          status: 'success'
        };
        setDevices(prev => [ccNode, ...prev]);
        AudioEngine.play('success');
        Haptic.success();
        showToast('success', 'G gossip sync linked: Command-Center');
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
        showToast('info', 'Presentation Mode Activated (slowed animations)');
      } else {
        document.documentElement.classList.remove('presentation-mode');
        showToast('info', 'Presentation Mode Deactivated');
      }
      setVersionTaps(0);
    } else {
      showToast('info', `Tap version ${5 - nextTaps} more times for presentation settings`);
    }
  };
  const activeEmergency = signals.find(s => s.status === 'active');

  return (
    <div id="app">

      {/* ── TOP HEADER BAR (Instruction 4) ── */}
      <header className="top-header" data-label="Status & Air-Gap">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-magnifying-glass text-[14px]" style={{ color: 'var(--text-tertiary)' }} />
            <span className="caption">SEARCH OFFLINE INFRA</span>
          </div>
          <span className="caption block mt-0.5" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
            NODE ID: {deviceId}
          </span>
        </div>

        {/* Center Logo - Desktop Only */}
        <span className="title-app text-white italic hidden md:block" style={{ fontSize: '1.25rem' }}>
          SharedNet
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Map Feature Trigger Button */}
          <button 
            onClick={() => setShowMapModal(true)}
            className="px-3 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-full text-white flex items-center gap-1.5 h-8 hover:bg-slate-800 transition-colors"
          >
            <i className="ph-bold ph-map-trifold" style={{ fontSize: '12px', color: 'var(--accent-cyan)' }} />
            <span className="badge-text" style={{ color: 'var(--text-secondary)' }}>Map</span>
          </button>

          {/* Air Gap Mute Button */}
          <button 
            onClick={handleAirGapToggle}
            className="px-3 bg-[#FF3B30] rounded-full text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center h-8 transition-transform active:scale-95"
            style={{ 
              backgroundColor: airGapActive ? 'var(--accent-red)' : 'var(--bg-elevated)',
              border: airGapActive ? 'none' : '1px solid var(--border-medium)'
            }}
          >
            {airGapActive ? 'AIR-GAP ON' : 'AIR-GAP OFF'}
          </button>

          {/* Network stability dot indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]"></span>
            <span className="badge-text text-[#30D158]">STABLE</span>
          </div>
        </div>
      </header>

      {/* ── STICKY EMERGENCY BANNER (If Active Alert Exists) ── */}
      {activeEmergency && activeTab === 'home' && (
        <div 
          className="fixed left-4 right-4 p-4 rounded-xl border border-red-500/20 flex items-center justify-between gap-3 shadow-lg z-[50]"
          style={{ 
            top: 'calc(56px + var(--space-3) + env(safe-area-inset-top))', 
            background: 'linear-gradient(135deg, #FF3B30 0%, #C92A2A 100%)' 
          }}
          data-label="Urgent Alerts"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ph-fill ph-siren text-white animate-pulse" style={{ fontSize: '20px' }} />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">ACTIVE EMERGENCY</h4>
              <p className="text-[10px] text-white/90 truncate">{activeEmergency.title} • {activeEmergency.location}</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('inbox')}
            className="px-3 py-1 bg-white text-[#FF3B30] text-[9px] font-bold uppercase rounded active:scale-95 transition-transform"
          >
            Respond
          </button>
        </div>
      )}

      {/* ── MAIN LAYOUT PAGE CONTENT ── */}
      <main className="dashboard">
        
        {/* TAB 1: TACTICAL DASHBOARD GRID */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Feature Cards Grid (Instruction 6) */}
            <div className="feature-grid">
              
              {/* Card 1: EMERGENCY SOS */}
              <div 
                onClick={handleSOSStart}
                className="feature-card feature-card--emergency border-red-550/20"
                data-label="SOS Broadcast Beacon"
              >
                <div className="flex justify-between items-start">
                  <i className="ph-bold ph-shield-warning text-xl text-[#FF3B30]" />
                  <span className="badge-text px-2 py-0.5 bg-[#FF3B30]/10 text-[#FF3B30] rounded-full border border-[#FF3B30]/20">
                    PRIORITY BEACON
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="heading-lg text-white">EMERGENCY SOS</h3>
                  <p className="body text-slate-400">
                    Broadcast priority medical or distress beacon to all nearby nodes in the mesh. Operates offline without cellular infrastructure.
                  </p>
                </div>
              </div>

              {/* Card 2: NETWORK INTEL */}
              <div 
                onClick={() => setActiveTab('pulse')}
                className="feature-card"
                data-label="Telemetry Network Stats"
              >
                <div className="flex justify-between items-start">
                  <i className="ph-bold ph-activity text-xl text-[#0A84FF]" />
                  <span className="caption text-slate-500">TELEMETRY</span>
                </div>
                <div className="space-y-2">
                  <h3 className="heading-lg text-white">NETWORK INTEL</h3>
                  <div className="flex gap-6 pt-1">
                    <div>
                      <span className="caption block">ACTIVE SHARDS</span>
                      <span className="stat-number text-[#0A84FF]">1</span>
                    </div>
                    <div>
                      <span className="caption block">RECONSTRUCTED</span>
                      <span className="stat-number text-[#30D158]">1</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/60">
                    <span className="caption">SIGNAL INTEGRITY</span>
                    <span className="badge-text text-[#30D158] font-black">98.4% NOMINAL</span>
                  </div>
                </div>
              </div>

              {/* Card 3: INTEL DROP */}
              <div 
                onClick={() => setShowCreateModal(true)}
                className="feature-card"
                data-label="Encrypted Intel Sharder"
              >
                <div className="flex justify-between items-start">
                  <i className="ph-bold ph-stack text-xl text-[#0A84FF]" />
                  <span className="caption">SHARE CRITICAL DATA</span>
                </div>
                <h3 className="heading-lg text-white">INTEL DROP</h3>
              </div>

              {/* Card 4: SAFE CHECK */}
              <div 
                onClick={() => setShowSafeCheckModal(true)}
                className="feature-card"
                data-label="Update Status"
              >
                <div className="flex justify-between items-start">
                  <i className="ph-bold ph-check-circle text-xl text-[#30D158]" />
                  <span className="caption">UPDATE YOUR STATUS</span>
                </div>
                <h3 className="heading-lg text-white">SAFE CHECK</h3>
              </div>

              {/* Card 5: SURVIVAL KIT */}
              <div 
                onClick={() => setShowSurvivalKit(true)}
                className="feature-card md:col-span-2 lg:col-span-3 flex-row items-center justify-between"
                data-label="Survival Resources Kit"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="w-10 h-10 rounded-full bg-[#BF5AF2]/10 border border-[#BF5AF2]/20 flex items-center justify-center text-[#BF5AF2]">
                    <i className="ph-bold ph-heart" style={{ fontSize: '20px' }} />
                  </div>
                  <div>
                    <h3 className="heading-lg text-white">SURVIVAL KIT</h3>
                    <span className="caption text-[#BF5AF2] block mt-0.5">FIRST AID • SIGNAL TOOLS • GUIDELINES</span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSurvivalKit(true); }}
                  className="w-12 h-12 rounded-full bg-[#BF5AF2]/15 border border-[#BF5AF2]/30 flex items-center justify-center text-[#BF5AF2] hover:bg-[#BF5AF2]/25 active:scale-95 transition-transform"
                >
                  <i className="ph-bold ph-lightning" style={{ fontSize: '20px' }} />
                </button>
              </div>

            </div>

            {/* Tactical Tools Scroll Section (Instruction 7 & 8) */}
            <div className="space-y-2">
              <span className="caption block text-center text-slate-500 py-2">EXPLORE TACTICAL TOOLS</span>
              
              <button 
                onClick={() => { setShowAboutModal(true); AudioEngine.play('success'); }}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-xl h-12 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-2">
                  <i className="ph-bold ph-book-open text-slate-400" />
                  <span className="heading-md text-slate-300">TACTICAL INDEX</span>
                </div>
                <i className="ph-bold ph-chevron-down text-slate-400" />
              </button>

              <div className="tactical-index" data-label="Tactical Index scroll box">
                {[
                  { id: '1', type: 'HOSPITAL', name: 'AIIMS New Delhi', coords: '28.57, 77.21', colorClass: 'text-[#FF3B30]' },
                  { id: '2', type: 'HOSPITAL', name: 'Apollo Mumbai', coords: '19.02, 72.82', colorClass: 'text-[#FF3B30]' },
                  { id: '3', type: 'RESERVOIR', name: 'Bhakra Reservoir', coords: '31.41, 76.43', colorClass: 'text-[#0A84FF]' },
                  { id: '4', type: 'SHELTER', name: 'NDRF Ghaziabad', coords: '28.67, 77.45', colorClass: 'text-[#30D158]' },
                  { id: '5', type: 'HOSPITAL', name: 'NIMHANS Bangalore', coords: '12.94, 77.58', colorClass: 'text-[#FF3B30]' },
                  { id: '6', type: 'RESERVOIR', name: 'Indira Dam', coords: '22.29, 76.47', colorClass: 'text-[#0A84FF]' },
                  { id: '7', type: 'DANGER', name: 'Flood Zone Bihar', coords: '25.59, 85.13', colorClass: 'text-[#FF9F0A]' }
                ].map(item => (
                  <div key={item.id} className="tactical-card">
                    <span className={`badge-text font-black ${item.colorClass}`}>{item.type}</span>
                    <span className="heading-md text-white truncate mt-1 block max-w-[140px]">{item.name}</span>
                    <span className="caption block text-slate-600 mt-0.5">{item.coords}</span>
                    <div className="flex gap-2 justify-end mt-2 text-slate-600 text-xs">
                      <i className="ph-bold ph-map-pin" />
                      <i className="ph-bold ph-navigation-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MESH SCAN OVERLAY */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <h2 className="heading-lg text-white">Airspace Scanner</h2>
            <p className="body">Searching local radio channels for adjacent repeater systems.</p>

            <div className="card text-center py-10 space-y-3">
              {isScanning ? (
                <>
                  <i className="ph-bold ph-radar animate-spin text-4xl text-[#0A84FF] block mx-auto" />
                  <span className="heading-md text-white font-bold block">Pinging Airspace...</span>
                </>
              ) : (
                <>
                  <i className="ph-bold ph-radio text-4xl text-slate-600 block mx-auto" />
                  <span className="heading-md text-white font-bold block">Scan Finished</span>
                  <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-normal">
                    Click trigger below to search for emergency channels.
                  </p>
                </>
              )}
            </div>

            <button 
              onClick={handleScanNodes}
              disabled={isScanning}
              className="btn-primary"
            >
              {isScanning ? 'Syncing...' : 'Scan BLE gossip transceivers'}
            </button>
          </div>
        )}

        {/* TAB 3: NETWORK PULSE STATS */}
        {activeTab === 'pulse' && (
          <div className="space-y-4">
            <h2 className="heading-lg text-white">Network Telemetry</h2>
            
            <div className="card flex-row justify-between items-center p-4">
              <div>
                <span className="caption block">Telemetry Channel</span>
                <span className="heading-md text-white block mt-0.5">Secure Direct Connection</span>
              </div>
              <span className="status-pill status-pill--success uppercase tracking-wider">
                Stable Link
              </span>
            </div>

            <div className="card flex-row justify-between items-center p-4">
              <div>
                <span className="caption block">Payload Security</span>
                <span className="heading-md text-white block mt-0.5">End-to-End Encrypted</span>
              </div>
              <span className="status-pill status-pill--success uppercase tracking-wider">
                AES-255 Secure
              </span>
            </div>

            <div className="space-y-2">
              <span className="caption block pl-1">Adjacent Repeaters</span>
              {devices.length === 0 ? (
                <div className="card text-center py-6 text-slate-600 text-xs">
                  No transceivers found. Switch on Demo Mode in Config.
                </div>
              ) : (
                devices.map(d => (
                  <div key={d.id} className="card flex-row justify-between items-center p-4">
                    <div>
                      <span className="text-xs font-bold text-white block">{d.name}</span>
                      <span className="text-[10px] text-slate-500">{d.type}</span>
                    </div>
                    <span className="caption text-slate-400">Signal: {d.signal}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EMERGENCIES INBOX Timeline */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <h2 className="heading-lg text-white">Mesh Distress Log</h2>

            {signals.length === 0 ? (
              <div className="card text-center py-10 space-y-2 text-slate-600">
                <i className="ph-bold ph-shield-check text-4xl block mx-auto" />
                <span className="heading-md text-white font-bold block">No distress beacons</span>
                <p className="text-xs text-slate-500">All local mesh repeaters report green check.</p>
              </div>
            ) : (
              <div className="timeline">
                {signals.map(s => (
                  <div key={s.id} className="timeline-item">
                    <span className={`timeline-dot ${s.status}`} />
                    
                    <div className="card p-4">
                      <div className="flex justify-between items-center">
                        <span className="caption text-slate-500">{s.time}</span>
                        <span className="badge-text text-[#FF3B30]">{s.status}</span>
                      </div>
                      <h4 className="heading-md text-white mt-1">{s.title}</h4>
                      <p className="body mt-1">{s.description}</p>
                      
                      {s.status === 'active' && (
                        <button 
                          onClick={() => handleMarkResolved(s.id)}
                          className="mt-3 px-3 py-1.5 bg-[#30D158] text-white rounded text-[10px] font-bold uppercase active:scale-95 transition-transform"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VAULT SHARD INTEGRATOR */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <h2 className="heading-lg text-white">Vault Integrator</h2>
            <p className="body">Re-assemble fragmented air-gap coordinates payload shards from local memory.</p>

            <div className="card text-center py-8 text-slate-600 text-xs">
              Vault storage locked. Use Intel Drop on home screen to create message shards.
            </div>
          </div>
        )}

        {/* TAB 6: CONFIG SYSTEM PARAMETERS */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <h2 className="heading-lg text-white">System Config</h2>

            {/* Showcase */}
            <div className="card border-dashed border-[#FF9F0A]/40" style={{ background: 'rgba(255,159,10,0.03)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-white block">Demo Showcase Mode</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Seeds simulated transceivers for review.</p>
                </div>
                <ToggleSwitch 
                  checked={demoMode} 
                  onChange={(val) => {
                    setDemoMode(val);
                    localStorage.setItem('sharednet_demo_mode', val.toString());
                    populateDatabase(val);
                    AudioEngine.play(val ? 'success' : 'warning');
                    showToast('info', `Demo Mode ${val ? 'Activated' : 'Deactivated'}`);
                  }}
                  activeColor="#FF9F0A"
                />
              </div>
            </div>

            {/* Display preferences */}
            <div className="card space-y-4 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-white">High Contrast borders</span>
                  <p className="text-[10px] text-slate-500">Increases structural readability.</p>
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
                  <span className="text-xs font-semibold text-white">Sound Sirens</span>
                  <p className="text-[10px] text-slate-500">Sound alarm chime notifications.</p>
                </div>
                <ToggleSwitch 
                  checked={soundAlerts} 
                  onChange={(val) => {
                    setSoundAlerts(val);
                    localStorage.setItem('setting_sound_alerts', val.toString());
                  }} 
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-white">Tactile Vibrate</span>
                  <p className="text-[10px] text-slate-500">Vibrate alert sweeps.</p>
                </div>
                <ToggleSwitch 
                  checked={vibration} 
                  onChange={(val) => {
                    setVibration(val);
                    localStorage.setItem('setting_vibration', val.toString());
                  }} 
                />
              </div>
            </div>

            {/* Version taps presentation */}
            <div className="card p-4" onClick={handleVersionClick} style={{ cursor: 'pointer' }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Software Version</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>1.0.0 (Hackathon Build)</span>
                  {presentationMode && <span className="bg-[#FF9F0A] text-black px-1.5 py-0.5 rounded text-[8px] font-black uppercase">PRES</span>}
                </span>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── SOS FLOATING TRIGGER BUTTON (Instruction 10) ── */}
      {sosState === 'idle' && !showSplash && (
        <button 
          onClick={handleSOSStart}
          className="sos-fab animate-pulse"
          data-label="SOS FAB"
        >
          <i className="ph-fill ph-shield text-white" style={{ fontSize: '22px' }} />
          <span style={{ fontSize: '9px', fontWeight: 800 }}>SOS</span>
        </button>
      )}

      {/* ── BOTTOM NAVIGATION 6 TABS BAR (Instruction 9) ── */}
      {!showSplash && (
        <nav className="bottom-nav" data-label="Tactical Navigation">
          <button onClick={() => setActiveTab('home')} className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
            <i className="ph-bold ph-house" style={{ fontSize: '20px' }} />
            <span>HOME</span>
          </button>
          
          <button onClick={() => setActiveTab('scan')} className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`}>
            <i className="ph-bold ph-radar" style={{ fontSize: '20px' }} />
            <span>SCAN</span>
          </button>
          
          <button onClick={() => setActiveTab('pulse')} className={`nav-item ${activeTab === 'pulse' ? 'active' : ''}`}>
            <i className="ph-bold ph-activity" style={{ fontSize: '20px' }} />
            <span>PULSE</span>
          </button>
          
          <button onClick={() => setActiveTab('inbox')} className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}>
            <i className="ph-bold ph-tray" style={{ fontSize: '20px' }} />
            <span>INBOX</span>
          </button>

          <button onClick={() => setActiveTab('vault')} className={`nav-item ${activeTab === 'vault' ? 'active' : ''}`}>
            <i className="ph-bold ph-lock-key" style={{ fontSize: '20px' }} />
            <span>VAULT</span>
          </button>

          <button onClick={() => setActiveTab('config')} className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}>
            <i className="ph-bold ph-gear" style={{ fontSize: '20px' }} />
            <span>CONFIG</span>
          </button>

          <div className="hidden sm:flex bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30 px-3 py-1.5 rounded-full badge-text">
            SYSTEM READY
          </div>
        </nav>
      )}

      {/* ── TACTICAL DEDICATED FULL-SCREEN MAP MODAL (Instruction 11) ── */}
      <AnimatePresence>
        {showMapModal && (
          <div className="map-modal" role="dialog" aria-modal="true">
            <header className="map-header">
              <span className="heading-lg text-white">TACTICAL MAP</span>
              <button 
                onClick={() => setShowMapModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close Map"
              >
                <i className="ph-bold ph-x" style={{ fontSize: '20px' }} />
              </button>
            </header>

            <div id="map-container">
              {/* Recenter button */}
              <button 
                onClick={() => {
                  if (mapInstanceRef.current) mapInstanceRef.current.setView([22.0, 78.0], 5);
                  showToast('info', 'Centering map on India coordinates');
                }} 
                className="map-recenter-btn pointer-events-auto"
                style={{ zIndex: 1000 }}
              >
                <i className="ph-bold ph-crosshair" />
                <span>Recenter Map</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SOS BEACON COUNTDOWN INTERACTIVE DIALOG ── */}
      <AnimatePresence>
        {sosState === 'countdown' && (
          <div className="sos-countdown-dialog" role="dialog" aria-modal="true">
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }} className="space-y-6">
              <h2 className="heading-lg text-white">SOS BEACON ACTIVATE</h2>
              <p className="body text-slate-400">Broadcasting emergency coordinates in:</p>
              
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <svg className="absolute -rotate-90" width="128" height="128">
                  <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="58" 
                    stroke="var(--accent-red)" 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (sosTimeLeft / 3.0) * 364.4}
                    style={{ transition: 'stroke-dashoffset 100ms linear' }}
                  />
                </svg>
                <span className="stat-number text-white" style={{ fontSize: '2.5rem' }}>{Math.ceil(sosTimeLeft)}</span>
              </div>

              <button 
                onClick={handleSOSCancel}
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-700 active:scale-95 transition-transform"
              >
                Abort Beacon
              </button>
            </div>
          </div>
        )}

        {sosState === 'sending' && (
          <div className="sos-countdown-dialog" role="dialog" aria-modal="true">
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }} className="space-y-4">
              <i className="ph-bold ph-spinner animate-spin text-4xl text-[#FF3B30] block mx-auto" />
              <h2 className="heading-lg text-white">Broadcasting...</h2>
              <p className="body text-slate-400">Propagating distress coordinates via Gossip repeaters.</p>
            </div>
          </div>
        )}

        {sosState === 'sent' && (
          <div className="sos-countdown-dialog" role="dialog" aria-modal="true" style={{ background: '#0A0A0F' }}>
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }} className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#30D158]/10 border border-[#30D158] flex items-center justify-center mx-auto text-[#30D158]">
                <i className="ph-bold ph-check text-3xl" />
              </div>
              <h2 className="heading-lg text-white">Transmission Successful</h2>
              <p className="body text-slate-400">Distress packet repeaters are echoing alert coordinates.</p>
              <button 
                onClick={() => setSosState('idle')}
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-700 active:scale-95 transition-transform"
              >
                Close Dialog
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INTEL DROP GENERATOR SHEET MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-details-backdrop" role="dialog" aria-modal="true">
            <div className="modal-details-sheet">
              <div className="flex justify-between items-start">
                <div>
                  <span className="caption">Intel Drop Creator</span>
                  <h3 className="heading-lg text-white">Shard Intelligence Drop</h3>
                </div>
                <button onClick={() => { setShowCreateModal(false); setIntelContent(''); setGeneratedShards([]); }} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"><i className="ph-bold ph-x" /></button>
              </div>

              <div className="h-[1px] bg-slate-800 my-1" />

              <div className="space-y-1.5">
                <span className="caption">Distress intel payload copy</span>
                <textarea 
                  value={intelContent}
                  onChange={e => setIntelContent(e.target.value)}
                  placeholder="Enter medical status check, missing personnel names, or coordinates info..."
                  className="w-full h-24 bg-[#141419] border border-slate-800 text-white text-xs rounded-lg p-3 focus:outline-none focus:border-[#0A84FF] resize-none"
                />
              </div>

              {generatedShards.length > 0 && (
                <div className="space-y-2">
                  <span className="caption block">Generated Shard segments</span>
                  <div className="space-y-1">
                    {generatedShards.map(sh => (
                      <div key={sh.id} className="p-2.5 bg-[#2C2C2E]/20 border border-slate-850 rounded text-[10px] text-slate-400 font-mono">
                        {sh.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleCreateIntelDrop}
                  className="flex-1 py-3.5 bg-[#0A84FF] text-white rounded-xl text-xs font-bold uppercase active:scale-95 transition-transform"
                >
                  Generate Shard Elements
                </button>
                <button 
                  onClick={() => { setShowCreateModal(false); setIntelContent(''); setGeneratedShards([]); }}
                  className="flex-1 py-3.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SAFE CHECK STATUS UPDATE MODAL ── */}
      <AnimatePresence>
        {showSafeCheckModal && (
          <div className="modal-details-backdrop" role="dialog" aria-modal="true">
            <div className="modal-details-sheet">
              <div className="flex justify-between items-start">
                <div>
                  <span className="caption">Safe Check Status Update</span>
                  <h3 className="heading-lg text-white">Broadcast Your Status</h3>
                </div>
                <button onClick={() => setShowSafeCheckModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"><i className="ph-bold ph-x" /></button>
              </div>

              <div className="h-[1px] bg-slate-800 my-1" />

              <div className="space-y-2.5">
                {[
                  { label: 'GREEN (SAFE - INTACT)', type: 'success', colorClass: 'bg-[#30D158] text-[#30D158]' },
                  { label: 'AMBER (STABLE - NEED UTILITIES)', type: 'warning', colorClass: 'bg-[#FF9F0A] text-[#FF9F0A]' },
                  { label: 'RED (DISTRESS - NEED IMMEDIATE ASSISTANCE)', type: 'error', colorClass: 'bg-[#FF3B30] text-[#FF3B30]' }
                ].map(opt => (
                  <button 
                    key={opt.label}
                    onClick={() => {
                      showToast(opt.type, `Status Broadcasted: ${opt.label}`);
                      setShowSafeCheckModal(false);
                      AudioEngine.play('success');
                      Haptic.success();
                    }}
                    className="w-full py-4 rounded-xl bg-[#2C2C2E]/30 border border-slate-800 text-xs font-bold uppercase hover:bg-slate-850 active:scale-98 transition-all flex items-center gap-3 px-4"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.type === 'success' ? '#30D158' : opt.type === 'warning' ? '#FF9F0A' : '#FF3B30' }} />
                    <span className="text-white text-left truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SURVIVAL KIT RESOURCES DETAILS SHEET ── */}
      <AnimatePresence>
        {showSurvivalKit && (
          <div className="modal-details-backdrop" role="dialog" aria-modal="true">
            <div className="modal-details-sheet">
              <div className="flex justify-between items-start">
                <div>
                  <span className="caption">Survival Resources Guide</span>
                  <h3 className="heading-lg text-white">Disaster Survival Tools</h3>
                </div>
                <button onClick={() => setShowSurvivalKit(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"><i className="ph-bold ph-x" /></button>
              </div>

              <div className="h-[1px] bg-slate-800 my-1" />

              <div className="space-y-3 text-xs leading-relaxed text-slate-400 max-h-[280px] overflow-y-auto pr-1 scroll-momentum-container no-scrollbar">
                <div className="space-y-1">
                  <strong className="text-white">🚨 Signal Mirror Flash Codes</strong>
                  <p>In blackout grids: 3 short flashes, 3 long flashes, 3 short flashes for standard SOS. Aim flash reflection coordinates at rescue crafts.</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-white">💊 Basic First Aid Actions</strong>
                  <p>Apply direct pressure to open wounds. If fracture is suspected, immobilize the limb with straight twigs and splint bindings.</p>
                </div>
                <div className="space-y-1">
                  <strong className="text-white">📻 Airspace Gossip repeats</strong>
                  <p>Keep Bluetooth activated. Gossip protocols propagate distress packet repeaters over adjacent transceivers automatically.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSurvivalKit(false)}
                className="w-full py-4 bg-[#BF5AF2] text-white rounded-xl font-bold text-xs uppercase hover:bg-fuchsia-600 active:scale-95 transition-transform"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ABOUT SYSTEM bluePRINT MODAL ── */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="modal-details-backdrop" role="dialog" aria-modal="true">
            <div className="modal-details-sheet relative z-10" style={{ maxHeight: '85%' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                <div>
                  <h3 className="heading-lg text-white">SharedNet Blueprint</h3>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Founders Fest 2026 Build</span>
                </div>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <i className="ph-bold ph-x" style={{ fontSize: '18px' }} />
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
                  <span className="text-[9px] text-[#FF9F0A] font-black uppercase tracking-widest block">Scan to Run App</span>
                  
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

      {/* ── KEYBOARD DEMO HELPERS CONSOLE PANEL (Shift + H) ── */}
      {showHelpers && (
        <div className="fixed bottom-24 left-4 z-[9999] p-4 bg-[#1C1C1E] border border-slate-850 rounded-xl max-w-[280px] text-[10px] text-slate-400 space-y-2 shadow-2xl pointer-events-auto">
          <div className="flex justify-between items-center text-white font-bold uppercase tracking-wider">
            <span>Demo Console</span>
            <button onClick={() => setShowHelpers(false)} className="text-slate-500 hover:text-white"><i className="ph-bold ph-x" /></button>
          </div>
          <div className="h-[1px] bg-slate-800" />
          <ul className="space-y-1 list-disc pl-3">
            <li><b className="text-[#FF9F0A]">Shift + D</b>: Toggle Demo Mode</li>
            <li><b className="text-[#FF3B30]">Shift + S</b>: Ingest Emergency Beacon</li>
            <li><b className="text-[#0A84FF]">Shift + T</b>: Age alerts by 1 hour</li>
            <li><b className="text-slate-200">Shift + R</b>: Nuclear Database Wipe</li>
            <li><b className="text-slate-200">Shift + H</b>: Close panel</li>
          </ul>
        </div>
      )}

      {/* ── TOAST OVERLAYS DRAWER ── */}
      <div className="toast-container pointer-events-none" style={{ position: 'fixed', top: '56px', left: 0, right: 0, zIndex: 'var(--z-toast)' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className={`toast-overlay ${toast.type}`}
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

      {/* ── BOOT SPLASH SCREEN LAYOUT (Instruction 13) ── */}
      {showSplash && (
        <div id="splash" style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 'var(--z-splash)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
          <div className="w-16 h-16 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.2)]">
            <i className="ph-fill ph-shield-check text-[#0A84FF] animate-pulse" style={{ fontSize: '32px' }} />
          </div>
          <h1 className="title-app text-white uppercase tracking-[0.2em] italic mt-2" style={{ fontSize: '1.75rem' }}>SharedNet</h1>
          <p className="caption" style={{ color: 'var(--text-secondary)' }}>Emergency Mesh Network</p>
        </div>
      )}

    </div>
  );

  function handleMarkResolved(id) {
    setSignals(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: 'resolved' };
      }
      return s;
    }));
    AudioEngine.play('success');
    Haptic.success();
    showToast('success', 'Incident marked resolved across mesh repeaters');
  }
}

// Reusable Custom Toggle Switch primitive
function ToggleSwitch({ checked, onChange, activeColor = '#30D158' }) {
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
