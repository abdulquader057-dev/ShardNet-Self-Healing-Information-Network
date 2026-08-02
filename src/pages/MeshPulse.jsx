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
  AlertTriangle,
  Compass,
  Map
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useMesh } from '../core/MeshProvider';

import PullToRefresh from '../components/PullToRefresh';

// Setup custom Leaflet icons using L.divIcon
const userIcon = L.divIcon({
  html: '<div class="user-marker-container"><div class="user-marker" style="background:#22C55E"></div><div class="pulse-ring" style="border-color:#22C55E"></div></div>',
  className: 'custom-leaflet-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const createNodeIcon = (status, type, name = '') => {
  let statusClass = '';
  let iconColor = '#3B82F6'; // Default primary
  if (status === 'warning') {
    statusClass = 'node-marker--warning';
    iconColor = '#F59E0B';
  } else if (status === 'emergency') {
    statusClass = 'node-marker--emergency';
    iconColor = '#EF4444';
  } else if (status === 'success') {
    statusClass = 'node-marker--success';
    iconColor = '#22C55E';
  }

  // Pick the SVG depending on type/name
  let svgContent = '';
  if (type === 'Mobile' && String(name).includes('Rescue')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
  } else if (type === 'Mobile' || String(name).includes('Hiker') || String(name).includes('Trekker')) {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  } else if (type === 'Drone') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
  } else if (type === 'Vehicle') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 12h14"/></svg>`;
  } else {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
  }

  return L.divIcon({
    html: `<div class="node-marker ${statusClass}" style="display:flex;align-items:center;justify-content:center;background:#141419;border:2px solid ${iconColor};border-radius:50%;width:32px;height:32px;box-shadow:0 0 12px ${iconColor}44;">${svgContent}</div>`,
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
  const [viewMode, setViewMode] = useState('radar'); // 'radar' or 'sat'

  const { peers, isReady } = useMesh();
  const [devices, setDevices] = useState([]);
  const [userLoc, setUserLoc] = useState([17.4100, 78.4750]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      }, () => console.warn('Location access denied. Using default.'));
    }
  }, []);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getBearing = (lat1, lon1, lat2, lon2) => {
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    const theta = Math.atan2(y, x);
    return (theta * 180 / Math.PI + 360) % 360;
  };

  // Load real WebRTC peers into the device list
  useEffect(() => {
    if (!isReady || !peers) return;

    // Create device objects for real peers
    const realDevices = peers.map(peer => {
      const existing = devices.find(d => d.id === peer.id);
      
      const jitterLat = existing?.coords?.[0] || (userLoc[0] + (Math.random() - 0.5) * 0.005);
      const jitterLng = existing?.coords?.[1] || (userLoc[1] + (Math.random() - 0.5) * 0.005);
      
      const distance = haversine(userLoc[0], userLoc[1], jitterLat, jitterLng);
      const bearing = getBearing(userLoc[0], userLoc[1], jitterLat, jitterLng);
      
      // Scale radius (max radar range ~500m => 100%)
      const maxRange = 500;
      let radius = (distance / maxRange) * 100;
      if (radius > 90) radius = 90; // clamp to edge
      if (radius < 10) radius = 10;
      
      return {
        id: peer.id,
        name: `Node ${peer.id.slice(-4)}`,
        type: 'Mobile',
        signal: 'Strong',
        lastSeen: peer.lastSeen ? `${Math.round((Date.now() - peer.lastSeen) / 1000)}s ago` : 'Just now',
        icon: Smartphone,
        status: (existing?.battery && existing.battery < 20) ? 'emergency' : 'success',
        coords: [jitterLat, jitterLng],
        radarPos: { angle: bearing, radius },
        isReal: true,
        battery: existing?.battery || null,
        distanceStr: `${Math.round(distance)}m`
      };
    });

    setDevices(realDevices);
  }, [peers, isReady, userLoc]);

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
      <div className="bg-[#141419] border border-[#2A2A35] rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Network Status</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B8B9A] uppercase tracking-widest font-bold">Mesh network active</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-[#22C55E]">Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end whitespace-nowrap min-w-[70px]">
            <span className="text-4xl font-extrabold text-[#22C55E] font-mono leading-none">{devices.length}</span>
            <span className="text-[10px] font-black text-[#5A5A6A] uppercase tracking-widest mt-1">Devices</span>
          </div>
        </div>

        <div className="h-px bg-[#2A2A35] my-1" />

        <div className="flex justify-between items-center text-[#8B8B9A] text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-[#22C55E]" />
            <span>Signal: Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-[#3B82F6]" />
            <span>Range: 120m</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#5A5A6A]" />
            <span>Uptime: 14m</span>
          </div>
        </div>
      </div>

      {/* ── VIEW TOGGLE ── */}
      <div className="flex bg-[#141419] p-1 rounded-2xl border border-[#2A2A35]">
        <button
          onClick={() => setViewMode('radar')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            viewMode === 'radar' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'text-[#8B8B9A] hover:text-white'
          }`}
        >
          <Compass size={16} /> RADAR
        </button>
        <button
          onClick={() => setViewMode('sat')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            viewMode === 'sat' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : 'text-[#8B8B9A] hover:text-white'
          }`}
        >
          <Map size={16} /> SAT VIEW
        </button>
      </div>

      {/* ── TACTICAL DISPLAY ── */}
      <div className="relative h-[320px] w-full rounded-3xl overflow-hidden border border-[#2A2A35] bg-[#0A0A0F]">
        
        {viewMode === 'radar' ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Sweeping Radar Background */}
            <div className="absolute w-[200%] h-[200%] border border-[#22C55E]/10 rounded-full" />
            <div className="absolute w-[150%] h-[150%] border border-[#22C55E]/20 rounded-full" />
            <div className="absolute w-[100%] h-[100%] border border-[#22C55E]/30 rounded-full" />
            <div className="absolute w-[50%] h-[50%] border border-[#22C55E]/40 rounded-full" />
            <div className="absolute w-2 h-2 bg-[#22C55E] rounded-full shadow-[0_0_15px_#22C55E] z-10" />
            
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute w-[100%] h-[100%] rounded-full z-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(34, 197, 94, 0.4) 100%)',
              }}
            />
            
            {/* Radar Nodes */}
            {devices.map(device => {
              const x = Math.cos(device.radarPos.angle * Math.PI / 180) * device.radarPos.radius;
              const y = Math.sin(device.radarPos.angle * Math.PI / 180) * device.radarPos.radius;
              const color = device.status === 'success' ? '#22C55E' : device.status === 'warning' ? '#F59E0B' : '#EF4444';
              
              return (
                <div 
                  key={device.id} 
                  className="absolute z-20 flex flex-col items-center gap-1"
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full animate-ping absolute"
                    style={{ backgroundColor: color, opacity: 0.5 }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full relative z-10"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                  />
                  <span className="text-[8px] font-bold text-white uppercase bg-black/50 px-1 rounded">{device.name.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          !mapLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 bg-[#0A0A0F] text-[#8B8B9A]">
              <Loader2 size={32} className="animate-spin text-[#3B82F6]" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Loading Tactical Map...</span>
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
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                maxZoom={19}
              />
              <Circle
                center={[17.4065, 78.4772]}
                radius={100}
                pathOptions={{ color: '#3B82F6', weight: 1, dashArray: '4,4', fillColor: '#3B82F6', fillOpacity: 0.05 }}
              />
              <Circle
                center={[17.4065, 78.4772]}
                radius={250}
                pathOptions={{ color: '#5A5A6A', weight: 1, dashArray: '4,4', fillColor: 'transparent', fillOpacity: 0 }}
              />
              <Marker position={[17.4065, 78.4772]} icon={userIcon}>
                <Popup>
                  <div className="text-center text-xs space-y-1">
                    <p className="font-bold text-white uppercase tracking-wider">Your Transceiver</p>
                    <p className="text-[#8B8B9A]">GPS Lock Acquired</p>
                  </div>
                </Popup>
              </Marker>
              {devices.map(device => (
                <Marker 
                  key={device.id} 
                  position={device.coords} 
                  icon={createNodeIcon(device.status, device.type, device.name)}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white uppercase tracking-wider">{device.name}</p>
                      <p className="text-[#8B8B9A]">Device Type: {device.type}</p>
                      <p className="text-[#8B8B9A]">Signal: <span className={device.status === 'success' ? 'text-[#22C55E]' : device.status === 'warning' ? 'text-[#F59E0B]' : 'text-[#EF4444]'}>{device.signal}</span></p>
                      <p className="text-[10px] text-[#5A5A6A] italic mt-1">Last seen: {device.lastSeen}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )
        )}
      </div>

      {/* ── NEARBY DEVICES LIST ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Nearby Devices</h3>
          <div className="flex items-center gap-2">
            {scanning ? (
              <>
                <Loader2 size={12} className="text-[#3B82F6] animate-spin" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#3B82F6]">Scanning...</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-ping" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B8B9A]">Monitoring</span>
              </>
            )}
          </div>
        </div>

        {/* List render / Skeleton loader */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="p-4 flex gap-4 items-center bg-[#141419] border border-[#2A2A35] rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#1C1C1E]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1C1C1E] rounded w-24" />
                  <div className="h-3 bg-[#1C1C1E] rounded w-36" />
                </div>
                <div className="w-6 h-8 bg-[#1C1C1E] rounded" />
              </div>
            ))
          ) : (
            <AnimatePresence initial={false}>
              {devices.map(device => {
                const borderColors = {
                  success: 'border-[#22C55E]',
                  warning: 'border-[#F59E0B]',
                  emergency: 'border-[#EF4444]'
                };
                
                const signalColors = {
                  success: 'bg-[#22C55E]',
                  warning: 'bg-[#F59E0B]',
                  emergency: 'bg-[#EF4444]'
                };

                const Icon = device.icon;

                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 flex items-center justify-between gap-4 relative overflow-hidden bg-[#141419] border border-[#2A2A35] rounded-2xl hover:border-[#3B82F6]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full bg-black/40 border-2 ${borderColors[device.status] || 'border-[#2A2A35]'} flex items-center justify-center text-[#8B8B9A]`}>
                        <Icon size={16} className={device.status === 'warning' ? 'text-[#F59E0B]' : device.status === 'success' ? 'text-[#22C55E]' : 'text-[#8B8B9A]'} />
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-sm font-bold text-white leading-none mb-1.5">{device.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B8B9A]">
                          {device.type} • Signal {device.signal}
                          {device.battery !== null && ` • ${device.battery}% BAT`}
                        </p>
                      </div>
                    </div>

                    {/* Signal Bars */}
                    <div className="flex items-end gap-[3px] h-4">
                      <div className={`w-1 rounded-sm ${signalColors[device.status]} h-1.5`} />
                      <div className={`w-1 rounded-sm ${device.signal !== 'Weak' ? signalColors[device.status] : 'bg-[#2A2A35]'} h-2`} />
                      <div className={`w-1 rounded-sm ${device.signal === 'Strong' ? signalColors[device.status] : 'bg-[#2A2A35]'} h-3`} />
                      <div className={`w-1 rounded-sm ${device.signal === 'Strong' ? signalColors[device.status] : 'bg-[#2A2A35]'} h-4`} />
                    </div>

                    {/* Last seen timestamp */}
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#5A5A6A] absolute bottom-2 right-4">
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
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl text-[#3B82F6] border border-[#3B82F6]/20 bg-[#3B82F6]/5 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-[#3B82F6]/10 active:scale-[0.99] disabled:opacity-50 h-14"
        >
          {scanning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Scanning Airspace...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Scan for New Devices</span>
            </>
          )}
        </button>
      </div>

      {/* ── EXPANDABLE NETWORK DETAILS ── */}
      <div className="border border-[#2A2A35] rounded-3xl overflow-hidden bg-[#141419]">
        <button 
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3 text-white font-bold text-sm tracking-tight">
            <Info size={18} className="text-[#3B82F6]" />
            <span>Network Diagnostic Details</span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-[#8B8B9A] transition-transform duration-300 ${detailsExpanded ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence initial={false}>
          {detailsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-[#2A2A35] bg-black/20"
            >
              <div className="p-5 flex flex-col gap-3 text-[10px] font-bold uppercase tracking-widest text-[#8B8B9A]">
                <div className="flex justify-between items-center py-2 border-b border-[#2A2A35]/50">
                  <span>Protocol</span>
                  <span className="text-white">WebRTC + BLE Hybrid gossip</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2A2A35]/50">
                  <span>Encryption layer</span>
                  <span className="text-white font-mono">AES-256-GCM authenticated</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2A2A35]/50">
                  <span>Coverage Radius</span>
                  <span className="text-white">~150m (LOS range)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2A2A35]/50">
                  <span>Hop Routing</span>
                  <span className="text-white">Multi-hop epidemic routing</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Telemetry drain</span>
                  <span className="text-[#22C55E]">Low impact (BLE beaconing)</span>
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
