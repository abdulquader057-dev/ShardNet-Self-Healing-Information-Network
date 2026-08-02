import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Globe, Shield, Map as MapIcon, Crosshair, ChevronUp, ChevronDown } from 'lucide-react';
import { getLocationSafe } from '../utils/geo';
import { safeInterval } from '../core/stability';
import { GLOBAL_HUBS, INFRA_ICONS } from '../data/emergencyData';

/* ─── Fix Vite's broken Leaflet default icons (Removing CDN dependency) ─── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/favicon.svg', // Fallback to local
  iconUrl:       '/favicon.svg',
  shadowUrl:     '/favicon.svg',
});

/* ─── Survival DivIcon Generator ───────────────────────────────────────── */
const createInfraIcon = (type) => {
  const cfg = INFRA_ICONS[type] || INFRA_ICONS.generic;
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div style="
        width:30px;height:30px;border-radius:8px;
        background:${cfg.color};border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 10px ${cfg.color}88;
        font-size:16px;
      ">
        ${cfg.emoji}
      </div>`
  });
};

const youAreHereIcon = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `
    <div style="
      width:20px;height:20px;border-radius:50%;
      background:rgba(59,130,246,0.25);
      border:2px solid #3b82f6;
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">
      <div style="width:8px;height:8px;border-radius:50%;background:#3b82f6;box-shadow:0 0 8px 3px rgba(59,130,246,0.6);"></div>
      <div style="position:absolute;width:32px;height:32px;border-radius:50%;border:2px solid rgba(59,130,246,0.35);top:-8px;left:-8px;animation:ripple 2s ease-out infinite;"></div>
    </div>`,
});

/* ─── Sub-component: Capture Map Instance ─────────────────────────────── */
function MapInstanceCapture({ setMap }) {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
}

/* ─── Sub-component: High-Accuracy Tracker ────────────────────────────── */
function LiveLocation({ onLocation }) {
  const map = useMap();
  const [pos, setPos] = useState(null);
  const hasCentred = useRef(false);

  const triggerLocation = useCallback(async () => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Acquiring GPS lock...' } }));
    const loc = await getLocationSafe();
    if (loc.lat !== 0 || loc.lng !== 0) {
      const fullLoc = { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy || 100 };
      setPos(fullLoc);
      onLocation(fullLoc);
      if (map && map.getContainer()) {
        try {
          map.flyTo([loc.lat, loc.lng], 16, { animate: true, duration: 1.5 });
          hasCentred.current = true;
        } catch (e) {
          console.warn("🛡️ MAP_SHIELD: flyTo deferred");
        }
      }
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'GPS Locked.' } }));
    } else {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'GPS Failed. Check permissions.' } }));
    }
  }, [map, onLocation]);

  useEffect(() => {
    let isMounted = true;
    async function syncLocation() {
      const loc = await getLocationSafe();
      if (!isMounted) return;
      if (loc.lat !== 0 || loc.lng !== 0) {
        const fullLoc = { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy || 100 };
        setPos(fullLoc);
        onLocation(fullLoc);
        
        // SAFE FLY-TO: Ensure map is loaded and panes exist
        if (!hasCentred.current && map && map.getContainer()) {
          try {
            map.flyTo([loc.lat, loc.lng], 16, { animate: true, duration: 2 });
            hasCentred.current = true;
          } catch (e) {
            console.warn("🛡️ MAP_SHIELD: flyTo deferred - map not ready");
          }
        }
      }
    }
    syncLocation();
    const interval = safeInterval(syncLocation, 10000);
    
    // Listen for manual trigger event
    window.addEventListener('trigger-locate-me', triggerLocation);
    
    return () => { 
      isMounted = false; 
      clearInterval(interval); 
      window.removeEventListener('trigger-locate-me', triggerLocation);
    };
  }, [map, onLocation, triggerLocation]);

  if (!pos) return null;
  return (
    <>
      <Circle center={[pos.lat, pos.lng]} radius={pos.accuracy} pathOptions={{ color: '#3b82f6', fillOpacity: 0.08, weight: 1, dashArray: '4 4' }} />
      <Marker position={[pos.lat, pos.lng]} icon={youAreHereIcon} />
    </>
  );
}

/* ─── Tactical Map Component ───────────────────────────────────────────── */
const MeshMap = ({ messages = [], zoom = 13, minimal = false }) => {
  const [mounted,  setMounted]  = useState(false);
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('local'); // local, global
  const [searchQuery, setSearchQuery] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const panToHub = (hub) => {
    // SAFE PAN: Verify instance and container status
    if (mapInstance && mapInstance.getContainer()) {
      try {
        mapInstance.flyTo([hub.lat, hub.lng], 15);
      } catch (e) {
        console.error("🛡️ MAP_SHIELD: Tactical pan failed", e);
      }
    }
  };

  const searchResults = GLOBAL_HUBS.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return <div className="h-full w-full bg-black flex items-center justify-center text-primary font-mono text-[10px]">INITIALIZING MESH-GRID...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0a0a0c', gap: '8px' }}>
      <style>{`@keyframes ripple { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
      
      {/* Removed SEARCH OFFLINE HUD per user request for clean map */}

      {/* ── MAP CONTAINER ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
        <MapContainer
          center={[28.6139, 77.2090]} // START AT NEW DELHI FOR INDIA FOCUS
          zoom={zoom}
          zoomControl={true}
          attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
      >
        <MapInstanceCapture setMap={setMapInstance} />
        <TileLayer url={navigator.onLine ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : ""} className="mesh-tile" />
        
        {/* 🗺️ ABSOLUTE OFFLINE GRID */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.2 }}>
           <div style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
        </div>

        <LiveLocation onLocation={setLocation} />


        {/* ── INFRASTRUCTURE NODES (GLOBAL & LOCAL DISCOVERY) ── */}
        {[
          ...GLOBAL_HUBS
        ].map(hub => (
          <Marker key={hub.id} position={[hub.lat, hub.lng]} icon={createInfraIcon(hub.type)}>
            <Popup>
              <div style={{ padding: '4px', textAlign: 'center' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: INFRA_ICONS[hub.type].color, textTransform: 'uppercase', margin: 0 }}>{hub.type}</p>
                <p style={{ fontSize: 11, fontWeight: 800, margin: '2px 0' }}>{hub.name}</p>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{hub.info}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── MESH SIGNALS ── */}
        {messages.filter(m => m.geo).map(msg => (
          <Marker key={msg.messageId} position={[msg.geo.lat, msg.geo.lng]}>
             <Popup><p style={{ fontSize: 11, fontWeight: 700 }}>"{msg.message}"</p></Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── LIVE GPS COORDINATE BADGE ── */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        background: 'rgba(9,11,20,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.3)', borderRadius: 24,
        padding: '6px 6px 6px 12px', display: 'flex', alignItems: 'center', gap: 12,
        pointerEvents: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10 }}>📍</span>
          {location ? (
            <>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#e2e8f0', fontFamily: 'monospace' }}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b' }}>
                ±{Math.round(location.accuracy)}m
              </span>
            </>
          ) : (
            <span style={{ fontSize: 9, fontWeight: 900, color: '#ef4444' }}>OFFLINE</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('trigger-locate-me'));
            }}
            style={{ 
              background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', 
              padding: '4px 12px', borderRadius: 16, fontSize: 8, fontWeight: 900, 
              cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            LOCATE
          </button>
          {location && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
                window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Coordinates copied to clipboard' } }));
              }}
              style={{ 
                background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', 
                padding: '4px 12px', borderRadius: 16, fontSize: 8, fontWeight: 900, 
                cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              COPY
            </button>
          )}
        </div>
      </div>

      {/* ── LIVE GPS TOP-RIGHT PILL ── */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        background: 'rgba(9,11,20,0.95)', border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
        pointerEvents: 'none'
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#e2e8f0', letterSpacing: 1 }}>LIVE GPS</span>
      </div>

      </div>

      {/* Removed TACTICAL OVERLAY per user request for clean map */}
    </div>
  );
};

export default MeshMap;

