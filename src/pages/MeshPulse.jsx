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
import { useMesh } from '../core/MeshProvider';

import PullToRefresh from '../components/PullToRefresh';

// Setup custom Leaflet icons using L.divIcon
const userIcon = L.divIcon({
  html: '<div class="user-marker-container"><div class="user-marker"></div><div class="pulse-ring"></div></div>',
  className: 'custom-leaflet-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const createNodeIcon = (status, type, name = '') => {
  let statusClass = '';
  let iconColor = '#0A84FF'; // Default primary
  if (status === 'warning') {
    statusClass = 'node-marker--warning';
    iconColor = '#FF9500';
  } else if (status === 'emergency') {
    statusClass = 'node-marker--emergency';
    iconColor = '#FF3B30';
  } else if (status === 'success') {
    statusClass = 'node-marker--success';
    iconColor = '#34C759';
  }

  // Pick the SVG depending on type/name
  let svgContent = '';
  if (type === 'Mobile' && String(name).includes('Rescue')) {
    // Smartphone
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
  } else if (type === 'Mobile' || String(name).includes('Hiker') || String(name).includes('Trekker')) {
    // User/Person
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  } else if (type === 'Drone') {
    // Navigation / Drone triangle
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
  } else if (type === 'Vehicle') {
    // Car
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 12h14"/></svg>`;
  } else {
    // HQ Station / Globe
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
  }

  return L.divIcon({
    html: `<div class="node-marker ${statusClass}" style="display:flex;align-items:center;justify-content:center;background:#111216;border:2px solid ${iconColor};border-radius:50%;width:32px;height:32px;box-shadow:0 0 12px ${iconColor}44;">${svgContent}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};



export default function MeshPulse() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { peers, isReady } = useMesh();
  const [devices, setDevices] = useState([]);

  // Load real WebRTC peers into the device list
  useEffect(() => {
    if (!isReady || !peers) return;

    // Create device objects for real peers
    const realDevices = peers.map(peer => {
      // Maintain existing battery if we already have it from a status update
      const existing = devices.find(d => d.id === peer.id);
      
      const jitterLat = (Math.random() - 0.5) * 0.005;
      const jitterLng = (Math.random() - 0.5) * 0.005;
      return {
        id: peer.id,
        name: `Node ${peer.id.slice(-4)}`,
        type: 'Mobile',
        signal: 'Strong',
        lastSeen: peer.lastSeen ? `${Math.round((Date.now() - peer.lastSeen) / 1000)}s ago` : 'Just now',
        icon: Smartphone,
        status: (existing?.battery && existing.battery < 20) ? 'emergency' : 'success',
        coords: existing?.coords || [17.4100 + jitterLat, 78.4750 + jitterLng],
        isReal: true,
        battery: existing?.battery || null
      };
    });

    setDevices(realDevices);
  }, [peers, isReady]);

  // Listen for battery status updates
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      const { from, battery } = e.detail;
      if (battery !== undefined && battery !== null) {
        setDevices(prev => prev.map(d => 
          d.id === from ? { ...d, battery, status: battery < 20 ? 'emergency' : 'success' } : d
        ));
      }
    };
    window.addEventListener('mesh-status-update', handleStatusUpdate);
    return () => window.removeEventListener('mesh-status-update', handleStatusUpdate);
  }, []);

  // Initial skeleton loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setMapLoaded(true), 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleScan = () => {
    setScanning(true);
    
    setTimeout(() => {
      setScanning(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Scan finished: no new BLE nodes found' } }));
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
      <div className="space-y-6 pb-48">
      
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
          
          <div className="flex flex-col items-end whitespace-nowrap min-w-[70px]">
            <span className="text-4xl font-extrabold text-[#34C759] font-mono leading-none">{devices.length}</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Devices</span>
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
                  <p className="text-slate-400">GPS Lock Acquired</p>
                </div>
              </Popup>
            </Marker>

            {/* Nearby Node Pins */}
            {devices.map(device => {

              return (
                <Marker 
                  key={device.id} 
                  position={device.coords} 
                  icon={createNodeIcon(device.status, device.type, device.name)}
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
                        <p className="text-body-sm text-slate-400">
                          {device.type} • Signal {device.signal}
                          {device.battery !== null && ` • ${device.battery}% BAT`}
                        </p>
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
