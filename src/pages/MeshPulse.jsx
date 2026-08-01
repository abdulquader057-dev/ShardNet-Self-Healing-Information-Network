import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  ArrowLeftRight, 
  Clock, 
  Smartphone, 
  User, 
  Navigation, 
  Car, 
  Search, 
  ChevronDown, 
  Loader2, 
  Globe, 
  Info,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

import PullToRefresh from '../components/PullToRefresh';

// Setup custom Leaflet icons using L.divIcon
const userIcon = L.divIcon({
  html: '<div class="user-marker-container"><div class="user-marker"></div><div class="pulse-ring"></div></div>',
  className: 'custom-leaflet-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const createNodeIcon = (status, type) => {
  let statusClass = '';
  if (status === 'warning') statusClass = 'node-marker--warning';
  else if (status === 'emergency') statusClass = 'node-marker--emergency';

  let iconClass = 'ph-bold ph-device-mobile';
  if (type === 'Drone' || type === 'HQ Station') iconClass = 'ph-bold ph-paper-plane-tilt';
  else if (type === 'Vehicle') iconClass = 'ph-bold ph-car';
  else if (type === 'Mobile') iconClass = 'ph-bold ph-device-mobile';

  return L.divIcon({
    html: `<div class="node-marker ${statusClass}"><i class="${iconClass}" style="font-size: 16px;"></i></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const emergencySirenIcon = L.divIcon({
  html: '<div class="emergency-siren-marker"><i class="ph-fill ph-siren" style="font-size: 18px;"></i><div class="emergency-pulse-ring"></div></div>',
  className: 'custom-leaflet-icon',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

export default function MeshPulse() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getInitialDevices = () => {
    const isDemo = localStorage.getItem('sharednet_demo_mode') === 'true';
    const base = [
      { id: '1', name: 'Rescue-01', type: 'Mobile', signal: 'Strong', lastSeen: '2m ago', icon: Smartphone, status: 'success', coords: [17.4100, 78.4750] },
      { id: '2', name: 'Hiker-42', type: 'Mobile', signal: 'Strong', lastSeen: '5m ago', icon: User, status: 'success', coords: [17.4040, 78.4800] },
      { id: '3', name: 'Drone-X', type: 'Drone', signal: 'Medium', lastSeen: '1m ago', icon: Navigation, status: 'warning', coords: [17.4080, 78.4720] },
      { id: '4', name: 'Vehicle-A1', type: 'Vehicle', signal: 'Weak', lastSeen: '8m ago', icon: Car, status: 'emergency', coords: [17.4020, 78.4780] }
    ];
    if (isDemo) {
      return [
        ...base,
        { id: 'demo-dev-1', name: 'Trekker-09', type: 'Mobile', signal: 'Strong', lastSeen: '1m ago', icon: Smartphone, status: 'success', coords: [17.4010, 78.4700] },
        { id: 'demo-dev-2', name: 'BaseCamp', type: 'HQ Station', signal: 'Strong', lastSeen: 'Just now', icon: Globe, status: 'success', coords: [17.4150, 78.4850] }
      ];
    }
    return base;
  };

  const [devices, setDevices] = useState(getInitialDevices());

  // Initial skeleton loader and demo-mode event listeners
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setMapLoaded(true), 300);
    }, 1500);

    const handleDemoChange = () => {
      setDevices(getInitialDevices());
    };
    window.addEventListener('demo-mode-changed', handleDemoChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('demo-mode-changed', handleDemoChange);
    };
  }, []);

  const handleScan = () => {
    setScanning(true);
    
    setTimeout(() => {
      setScanning(false);

      if (devices.some(d => d.name === 'Command-Center')) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Scan finished: no new BLE nodes' } }));
        return;
      }

      // Add 5th device (Command-Center) to list & map
      const newDevice = { 
        id: '5', 
        name: 'Command-Center', 
        type: 'HQ Station', 
        signal: 'Strong', 
        lastSeen: 'Just now', 
        icon: Globe, 
        status: 'success',
        coords: [17.4120, 78.4790]
      };

      setDevices(prev => [newDevice, ...prev]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: '🚨 Discovered Mesh Node: Command-Center' } }));
    }, 3000);
  };

  const handleRefresh = () => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false);
        resolve();
      }, 1500);
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 pb-28">
      
      {/* ── HEADER TELEMETRY CARD ── */}
      <div 
        className="card-elevated p-6 flex flex-col gap-4" 
        style={{ background: 'var(--glass)' }}
        data-label="Grid Status"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-h2 text-white">Network Status</h2>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-slate-400">Mesh network active</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span className="text-caption text-[#34C759]">Live</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-hero text-[#34C759] font-mono leading-none block">{devices.length}</span>
            <span className="text-caption text-slate-500">Devices</span>
          </div>
        </div>

        <div className="h-[1px] bg-slate-800/60 my-1" />

        <div className="flex justify-between items-center text-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-[#34C759]" />
            <span>Signal: Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-[#0A84FF]" />
            <span>Range: 120m</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <span>Uptime: 14m</span>
          </div>
        </div>
      </div>

      {/* ── DARK-THEMED INTERACTIVE LEAFLET MAP ── */}
      <div 
        id="network-map" 
        className="relative h-[320px] w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0A0A0F]"
        data-label="Tactical Map"
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 bg-[#0A0A0F] text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#0A84FF]" />
            <span className="text-xs uppercase font-black tracking-widest">Loading Tactical Map...</span>
          </div>
        ) : (
          <MapContainer
            center={[17.4065, 78.4772]}
            zoom={14}
            zoomControl={false}
            attributionControl={false}
            tap={false}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            {/* CartoDB Dark Matter Tiles (No API key required) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {/* Range Circles (Instruction 6) */}
            <Circle
              center={[17.4065, 78.4772]}
              radius={100}
              pathOptions={{
                color: 'var(--action, #0A84FF)',
                weight: 1,
                dashArray: '4,4',
                fillColor: 'var(--action, #0A84FF)',
                fillOpacity: 0.05
              }}
            />
            <Circle
              center={[17.4065, 78.4772]}
              radius={250}
              pathOptions={{
                color: 'var(--text-tertiary, #636366)',
                weight: 1,
                dashArray: '4,4',
                fillColor: 'transparent',
                fillOpacity: 0
              }}
            />

            {/* Center User Location Marker */}
            <Marker position={[17.4065, 78.4772]} icon={userIcon}>
              <Popup>
                <div className="text-center text-xs space-y-1">
                  <p className="font-bold text-white uppercase tracking-wider">Your Transceiver</p>
                  <p className="text-slate-400">GPS Lock: Delhi Sector (Mock)</p>
                </div>
              </Popup>
            </Marker>

            {/* Active Emergency Signal Marker at Hiker-42 coordinates */}
            <Marker position={[17.4040, 78.4800]} icon={emergencySirenIcon}>
              <Popup>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold uppercase tracking-wider">
                    <AlertTriangle size={14} />
                    <span>Active Emergency</span>
                  </div>
                  <div className="h-[1px] bg-slate-800" />
                  <p className="font-bold text-white">Node: Hiker-42</p>
                  <p className="text-slate-400 leading-normal">Reported distress beacon 4 mins ago.</p>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'SOS Response Broadcasted across mesh' } }))}
                    className="w-full mt-2 py-2 bg-[#FF3B30] text-white rounded font-bold text-[10px] uppercase tracking-wider text-center"
                  >
                    Tap to Respond
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* Nearby Node Pins */}
            {devices.map(device => {
              // Hiker-42 has a siren marker instead of standard node marker
              if (device.name === 'Hiker-42') return null;

              return (
                <Marker 
                  key={device.id} 
                  position={device.coords} 
                  icon={createNodeIcon(device.status, device.type)}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white uppercase tracking-wider">{device.name}</p>
                      <p className="text-slate-400">Device Type: {device.type}</p>
                      <p className="text-slate-400">Signal: <span className={device.status === 'success' ? 'text-[#34C759]' : device.status === 'warning' ? 'text-[#FF9500]' : 'text-[#FF3B30]'}>{device.signal}</span></p>
                      <p className="text-[10px] text-slate-500 italic mt-1">Last seen: {device.lastSeen}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* ── NEARBY DEVICES LIST ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-h3 text-white">Nearby Devices</h3>
          <div className="flex items-center gap-2">
            {scanning ? (
              <>
                <Loader2 size={16} className="text-[#0A84FF] animate-spin" />
                <span className="text-body-sm text-[#0A84FF] font-semibold">Scanning Airspace...</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-ping" />
                <span className="text-body-sm text-slate-400">Monitoring</span>
              </>
            )}
          </div>
        </div>

        {/* List render / Skeleton loader */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card p-4 flex gap-4 items-center bg-[#1C1C1E] border border-[#38383A] animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#2C2C2E]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#2C2C2E] rounded w-24" />
                  <div className="h-3 bg-[#2C2C2E] rounded w-36" />
                </div>
                <div className="w-6 h-8 bg-[#2C2C2E] rounded" />
              </div>
            ))
          ) : (
            <AnimatePresence initial={false}>
              {devices.map(device => {
                const borderColors = {
                  success: 'border-[#34C759]',
                  warning: 'border-[#FF9500]',
                  emergency: 'border-[#FF3B30]'
                };
                
                const signalColors = {
                  success: 'bg-[#34C759]',
                  warning: 'bg-[#FF9500]',
                  emergency: 'bg-[#FF3B30]'
                };

                const Icon = device.icon;

                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="card p-4 flex items-center justify-between gap-4 relative overflow-hidden bg-[#1C1C1E] border border-[#38383A] rounded-xl hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full bg-[#2C2C2E] border-2 ${borderColors[device.status] || 'border-slate-700'} flex items-center justify-center text-slate-300`}>
                        <Icon size={18} className={device.status === 'warning' ? 'text-[#FF9500]' : device.status === 'success' ? 'text-[#34C759]' : 'text-slate-400'} />
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-body font-semibold text-white leading-none mb-1">{device.name}</p>
                        <p className="text-body-sm text-slate-400">{device.type} • Signal {device.signal}</p>
                      </div>
                    </div>

                    {/* Signal Bars */}
                    <div className="flex items-end gap-0.5 h-5">
                      <div className={`w-0.5 rounded-sm ${signalColors[device.status]} h-2`} />
                      <div className={`w-0.5 rounded-sm ${device.signal !== 'Weak' ? signalColors[device.status] : 'bg-slate-700'} h-3`} />
                      <div className={`w-0.5 rounded-sm ${device.signal === 'Strong' ? signalColors[device.status] : 'bg-slate-700'} h-4`} />
                      <div className={`w-0.5 rounded-sm ${device.signal === 'Strong' ? signalColors[device.status] : 'bg-slate-700'} h-5`} />
                    </div>

                    {/* Last seen timestamp */}
                    <span className="text-caption text-slate-600 absolute bottom-2 right-4">
                      {device.lastSeen}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── SCAN BUTTON ── */}
        <button
          onClick={handleScan}
          disabled={scanning || loading}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl text-[#0A84FF] border border-dashed border-[#0A84FF] font-bold transition-all hover:bg-[#0A84FF]/5 active:scale-[0.99] disabled:opacity-50"
          style={{
            height: '48px',
            fontSize: '15px'
          }}
        >
          {scanning ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Scanning Airspace...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Scan for New Devices</span>
            </>
          )}
        </button>
      </div>

      {/* ── EXPANDABLE NETWORK DETAILS ── */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#1C1C1E]">
        <button 
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info size={16} className="text-[#0A84FF]" />
            <span>Network Diagnostic Details</span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-slate-400 transition-transform duration-300 ${detailsExpanded ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence initial={false}>
          {detailsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-slate-800 bg-[#0d1117]/30"
            >
              <div className="p-4 flex flex-col gap-3 text-xs text-slate-400">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="font-medium">Protocol</span>
                  <span className="text-white font-bold">WebRTC + BLE Hybrid gossip</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="font-medium">Encryption layer</span>
                  <span className="text-white font-bold font-mono">AES-256-GCM authenticated</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="font-medium">Coverage Radius</span>
                  <span className="text-white font-bold">~150m (LOS range)</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="font-medium">Hop Routing</span>
                  <span className="text-white font-bold">Multi-hop epidemic routing</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-medium">Telemetry drain</span>
                  <span className="text-[#34C759] font-bold">Low impact (BLE beaconing)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
    </PullToRefresh>
  );
}
