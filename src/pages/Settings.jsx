import React, { useState, useEffect } from 'react';
import { 
  User, 
  Copy, 
  Check, 
  Globe, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle, 
  ShieldAlert, 
  Volume2, 
  Smartphone, 
  Eye, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Edit2
} from 'lucide-react';

export default function Settings() {
  const [deviceName, setDeviceName] = useState(localStorage.getItem('setting_device_name') || 'Your Phone');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(deviceName);
  
  // Toggle states
  const [autoConnect, setAutoConnect] = useState(localStorage.getItem('setting_auto_connect') !== 'false');
  const [btFallback, setBtFallback] = useState(localStorage.getItem('setting_bt_fallback') !== 'false');
  const [bgBroadcast, setBgBroadcast] = useState(localStorage.getItem('setting_bg_broadcast') !== 'false');
  
  const [soundAlerts, setSoundAlerts] = useState(localStorage.getItem('setting_sound_alerts') !== 'false');
  const [vibration, setVibration] = useState(localStorage.getItem('setting_vibration') !== 'false');
  
  const [demoMode, setDemoMode] = useState(localStorage.getItem('sharednet_demo_mode') === 'true');
  
  const [highContrast, setHighContrast] = useState(localStorage.getItem('setting_high_contrast') === 'true');
  const [largeText, setLargeText] = useState(localStorage.getItem('setting_large_text') === 'true');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('setting_reduce_motion') === 'true');

  const deviceId = 'SN-WV1K-7842';

  // Apply visual settings on load/toggle
  useEffect(() => {
    // High contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    // Large text
    if (largeText) {
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  }, [largeText]);

  useEffect(() => {
    // Reduce motion
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  const showToast = (type, message) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message } }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceId).then(() => {
      showToast('success', 'Device ID copied to clipboard');
    }).catch(() => {
      // Fallback
      const el = document.createElement('textarea');
      el.value = deviceId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('success', 'Device ID copied to clipboard');
    });
  };

  const handleSaveName = () => {
    setDeviceName(tempName);
    localStorage.setItem('setting_device_name', tempName);
    setIsEditingName(false);
    showToast('success', 'Device name updated');
  };

  // Demo mode handler
  const handleDemoToggle = (val) => {
    setDemoMode(val);
    localStorage.setItem('sharednet_demo_mode', val.toString());
    
    // Seed/clear demo signals
    if (val) {
      // Demo Mode ON
      if (window.sharedNetData) {
        // Expand signals
        window.sharedNetData.signals = [
          {
            id: 'mock-1',
            type: 'received',
            title: 'Hiker-42 Emergency SOS',
            status: 'active',
            time: '4 min ago',
            timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
            location: '120m northeast',
            description: "Distress signal from hiker. Message: 'Twisted ankle, cannot walk. Need medical assistance.'",
            sender: 'Hiker-42',
            range: '120m',
            battery: '34%'
          },
          {
            id: 'demo-sig-1',
            type: 'received',
            title: 'Flood Warning Alert',
            status: 'active',
            time: '1 min ago',
            timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
            location: '1.2km north',
            description: "Flash flood warning issued for local sectors. Evacuate to higher ground immediately.",
            sender: 'BaseCamp',
            range: '1.2km',
            battery: '98%'
          },
          {
            id: 'mock-2',
            type: 'received',
            title: 'Vehicle Collision Alert',
            status: 'resolved',
            time: 'Yesterday, 6:42 PM',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            location: '450m south',
            description: "Multi-vehicle accident reported. Emergency services dispatched. All victims evacuated safely.",
            sender: 'Vehicle-A1',
            range: '450m',
            battery: '82%'
          },
          {
            id: 'demo-sig-2',
            type: 'received',
            title: 'Medical Rescue Resolved',
            status: 'resolved',
            time: 'Yesterday',
            timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            location: '2.1km west',
            description: "Cardiac incident reported. Rescue-01 intercepted and administered first-aid. Patient stabilized and evacuated.",
            sender: 'Rescue-01',
            range: '2.1km',
            battery: '74%'
          },
          {
            id: 'mock-3',
            type: 'sent',
            title: 'Your SOS Signal',
            status: 'sent',
            time: 'Today, 08:15 AM',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            location: 'Your location',
            description: "Test signal sent successfully. 3 nearby devices notified.",
            sender: 'You (Self)',
            range: 'Local Transceiver',
            battery: '84%'
          },
          {
            id: 'demo-sent-1',
            type: 'sent',
            title: 'Grid Status Check-in',
            status: 'sent',
            time: 'Today, 09:12 AM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            location: 'Your location',
            description: "Status Check: Grid-4 secure, transceiver active.",
            sender: 'You (Self)',
            range: 'Local Transceiver',
            battery: '84%'
          },
          {
            id: 'mock-4',
            type: 'sent',
            title: 'Test Ping',
            status: 'sent',
            time: 'Today, 07:30 AM',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            location: 'Your location',
            description: "Network connectivity test. All systems operational.",
            sender: 'You (Self)',
            range: 'Local Transceiver',
            battery: '84%'
          }
        ];
      }
      showToast('info', 'Demo Mode Activated: Expanded telemetry loaded');
    } else {
      // Demo Mode OFF - Reset to default
      if (window.sharedNetData) {
        window.sharedNetData.signals = []; // Trigger re-populate
      }
      showToast('info', 'Demo Mode Deactivated: Standard telemetry restored');
    }
    
    // Dispatch global event so pages update their list / maps immediately
    window.dispatchEvent(new CustomEvent('demo-mode-changed'));
  };

  const handleTestSOS = () => {
    // Directly trigger the SOS sent overlay layout
    window.dispatchEvent(new CustomEvent('trigger-sos-test'));
    showToast('success', 'Bypassing countdown: Mock SOS transmission sent');
  };

  const handleResetNetwork = () => {
    if (confirm("Are you sure you want to reset your local mesh transceivers? This will wipe cached gossip shards.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* ── HEADER ── */}
      <div className="space-y-1">
        <h1 className="text-h1 text-white">Settings</h1>
        <p className="text-body-sm text-slate-400">Configure mesh transceivers & display parameters</p>
      </div>

      {/* ── DEVICE IDENTITY SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Device Identity</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl divide-y divide-slate-800/60">
          
          {/* Row 1: Name */}
          <div className="pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Device Alias</span>
              {isEditingName ? (
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={e => setTempName(e.target.value)} 
                    className="bg-[#2C2C2E] border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0A84FF]"
                    maxLength={15}
                  />
                  <button onClick={handleSaveName} className="p-1 bg-[#34C759] text-white rounded"><Check size={14} /></button>
                </div>
              ) : (
                <span className="text-white text-xs font-semibold">{deviceName}</span>
              )}
            </div>
            {!isEditingName && (
              <button onClick={() => { setTempName(deviceName); setIsEditingName(true); }} className="text-slate-400 hover:text-white p-1">
                <Edit2 size={14} />
              </button>
            )}
          </div>

          {/* Row 2: ID */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Transceiver ID</span>
              <span className="text-slate-400 font-mono text-[10px]">{deviceId}</span>
            </div>
            <button onClick={copyToClipboard} className="text-slate-400 hover:text-[#0A84FF] p-1" aria-label="Copy Device ID">
              <Copy size={14} />
            </button>
          </div>

          {/* Row 3: Role */}
          <div className="pt-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Network Role</span>
              <span className="text-slate-400 text-xs">Propagates background gossip</span>
            </div>
            <span className="status-pill status-pill--success uppercase tracking-wider">
              Relay Node
            </span>
          </div>

        </div>
      </div>

      {/* ── DEMO MODE SECTION (CRITICAL) ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#FF9500] uppercase tracking-widest block pl-1">Hackathon Showcase</span>
        <div 
          className="card p-4 rounded-xl border border-dashed border-[#FF9500]/50 space-y-3"
          style={{ background: 'rgba(255, 149, 0, 0.04)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-bold text-xs">Demo Mode</span>
              <p className="text-[10px] text-[#FF9500] mt-0.5">Populate application with realistic telemetry for presentations.</p>
            </div>
            <ToggleSwitch 
              checked={demoMode} 
              onChange={handleDemoToggle} 
              activeColor="#FF9500"
            />
          </div>
        </div>
      </div>

      {/* ── NETWORK CONFIGURATION SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Network Config</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Auto-Connect to Mesh</span>
              <p className="text-[10px] text-slate-500">Automatically sync with nearest transceivers.</p>
            </div>
            <ToggleSwitch 
              checked={autoConnect} 
              onChange={(val) => { setAutoConnect(val); localStorage.setItem('setting_auto_connect', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Bluetooth Fallback</span>
              <p className="text-[10px] text-slate-500">Auto background synchronization via BLE links.</p>
            </div>
            <ToggleSwitch 
              checked={btFallback} 
              onChange={(val) => { setBtFallback(val); localStorage.setItem('setting_bt_fallback', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Background Broadcasting</span>
              <p className="text-[10px] text-slate-500">Propagate encrypted shards when app is minimized.</p>
            </div>
            <ToggleSwitch 
              checked={bgBroadcast} 
              onChange={(val) => { setBgBroadcast(val); localStorage.setItem('setting_bg_broadcast', val.toString()); }} 
            />
          </div>

          <button 
            onClick={handleResetNetwork}
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-[#FF3B30]/30 hover:bg-[#FF3B30]/5 text-[#FF3B30] text-xs font-bold uppercase rounded-lg transition-colors"
          >
            <ShieldAlert size={14} />
            Reset Local Mesh Node
          </button>
        </div>
      </div>

      {/* ── EMERGENCY PARAMETERS ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Emergency Operations</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Sound Alerts</span>
              <p className="text-[10px] text-slate-500">Play acoustic warning sweeps on incoming alerts.</p>
            </div>
            <ToggleSwitch 
              checked={soundAlerts} 
              onChange={(val) => { setSoundAlerts(val); localStorage.setItem('setting_sound_alerts', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Tactile Haptics</span>
              <p className="text-[10px] text-slate-500">Vibrate patterns during transmissions.</p>
            </div>
            <ToggleSwitch 
              checked={vibration} 
              onChange={(val) => { setVibration(val); localStorage.setItem('setting_vibration', val.toString()); }} 
            />
          </div>

          <button 
            onClick={handleTestSOS}
            className="w-full py-3 bg-[#FF3B30] hover:bg-[#D32F2F] text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-lg shadow-[#FF3B30]/15"
          >
            Test SOS Signal (Instant Beam)
          </button>
        </div>
      </div>

      {/* ── ACCESSIBILITY OPTIONS ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Accessibility</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">High Contrast Mode</span>
              <p className="text-[10px] text-slate-500">Increases borders and visual readability.</p>
            </div>
            <ToggleSwitch 
              checked={highContrast} 
              onChange={(val) => { setHighContrast(val); localStorage.setItem('setting_high_contrast', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Large UI Text</span>
              <p className="text-[10px] text-slate-500">Scales interfaces up to 120% magnification.</p>
            </div>
            <ToggleSwitch 
              checked={largeText} 
              onChange={(val) => { setLargeText(val); localStorage.setItem('setting_large_text', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Reduce Interface Motion</span>
              <p className="text-[10px] text-slate-500">Bypasses visual scale & float animations.</p>
            </div>
            <ToggleSwitch 
              checked={reduceMotion} 
              onChange={(val) => { setReduceMotion(val); localStorage.setItem('setting_reduce_motion', val.toString()); }} 
            />
          </div>
        </div>
      </div>

      {/* ── ABOUT SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">About</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl divide-y divide-slate-800/60 text-xs">
          <div className="pb-3 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Software Version</span>
            <span className="text-white font-semibold">1.0.0 (Hackathon Build)</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Pitch Context</span>
            <span className="text-white font-semibold">Founders Fest 2026</span>
          </div>
          <div className="pt-3 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Repository License</span>
            <a 
              href="https://github.com/abdulquader057-dev/ShardNet-Self-Healing-Information-Network" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#0A84FF] font-semibold flex items-center gap-1 hover:underline"
            >
              <span>GitHub Source</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

// Reusable custom toggle switch component (Instruction 3)
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
