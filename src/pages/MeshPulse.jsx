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
  CheckCircle2, 
  Globe, 
  Info,
  Radio
} from 'lucide-react';

export default function MeshPulse() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [devices, setDevices] = useState([
    { id: '1', name: 'Rescue-01', type: 'Mobile', signal: 'Strong', lastSeen: '2m ago', icon: Smartphone, status: 'success' },
    { id: '2', name: 'Hiker-42', type: 'Mobile', signal: 'Strong', lastSeen: '5m ago', icon: User, status: 'success' },
    { id: '3', name: 'Drone-X', type: 'Drone', signal: 'Medium', lastSeen: '1m ago', icon: Navigation, status: 'warning' },
    { id: '4', name: 'Vehicle-A1', type: 'Vehicle', signal: 'Weak', lastSeen: '8m ago', icon: Car, status: 'emergency' }
  ]);
  
  // Constellation coordinate positions inside viewBox="0 0 400 280"
  const [nodes, setNodes] = useState([
    { id: '1', name: 'Rescue-01', cx: 80, cy: 60, icon: Smartphone, status: 'success', active: true },
    { id: '2', name: 'Hiker-42', cx: 320, cy: 70, icon: User, status: 'success', active: true },
    { id: '3', name: 'Drone-X', cx: 90, cy: 220, icon: Navigation, status: 'warning', active: true },
    { id: '4', name: 'Unknown', cx: 310, cy: 210, icon: User, status: 'muted', active: false }
  ]);

  const [scannedCount, setScannedCount] = useState(0);

  // Initial skeleton load for 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleScan = () => {
    setScanning(true);
    
    setTimeout(() => {
      setScanning(false);
      setScannedCount(prev => prev + 1);

      // Check if already scanned to prevent duplicates in list
      if (devices.some(d => d.name === 'Command-Center')) {
        alert("Mesh scan complete. No new nodes found in BLE airspace.");
        return;
      }

      // Add 5th device (Command-Center) to list
      const newDevice = { 
        id: '5', 
        name: 'Command-Center', 
        type: 'HQ Station', 
        signal: 'Strong', 
        lastSeen: 'Just now', 
        icon: Globe, 
        status: 'success' 
      };

      setDevices(prev => [newDevice, ...prev]);

      // Add 5th Node to constellation map (top center)
      const newNode = {
        id: '5',
        name: 'Command-Center',
        cx: 200,
        cy: 40,
        icon: Globe,
        status: 'success',
        active: true
      };
      setNodes(prev => [...prev, newNode]);

      // Alert/notification fallback
      alert("🚨 New Mesh Node Discovered: Command-Center (HQ Station)");
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* ── HEADER TELEMETRY CARD ── */}
      <div className="card-elevated p-6 flex flex-col gap-4" style={{ background: 'var(--glass)' }}>
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

      {/* ── ANIMATED MESH VISUALIZATION ── */}
      <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border border-slate-800" style={{ background: 'var(--bg-primary)' }}>
        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(10,132,255,0.06) 0%, transparent 70%)' }} />
        
        <svg viewBox="0 0 400 280" className="w-full h-full">
          {/* Constellation lines */}
          {nodes.map(node => {
            const isMuted = node.status === 'muted';
            return (
              <g key={`line-${node.id}`}>
                <path
                  d={`M 200,140 L ${node.cx},${node.cy}`}
                  stroke={isMuted ? '#FF9500' : '#38383A'}
                  strokeWidth="1.5"
                  opacity={isMuted ? '0.3' : '1'}
                  className={!isMuted ? 'animate-dash-line' : ''}
                />
                {/* Active traveling dots */}
                {node.active && !isMuted && (
                  <circle r="4" fill="#34C759">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path={`M 200,140 L ${node.cx},${node.cy}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Connection Center node ("You") */}
          <g>
            <foreignObject x="176" y="116" width="48" height="48">
              <div className="w-12 h-12 rounded-full bg-[#0A84FF] flex items-center justify-center text-white border-2 border-white/20 shadow-[0_0_15px_rgba(10,132,255,0.4)]">
                <User size={20} />
              </div>
            </foreignObject>
            <text x="200" y="180" textAnchor="middle" className="text-[10px] font-black fill-white uppercase tracking-widest">You</text>
          </g>

          {/* Surrounding constellation nodes */}
          {nodes.map(node => {
            const isMuted = node.status === 'muted';
            const borderColors = {
              success: 'border-[#34C759]',
              warning: 'border-[#FF9500]',
              emergency: 'border-[#FF3B30]',
              muted: 'border-dashed border-[#48484A]'
            };

            const Icon = node.icon;

            return (
              <g key={`node-${node.id}`}>
                <foreignObject x={node.cx - 18} y={node.cy - 18} width="36" height="36">
                  <div className={`w-9 h-9 rounded-full bg-[#1C1C1E] border-2 ${borderColors[node.status] || 'border-slate-700'} flex items-center justify-center text-slate-300 transition-all duration-200 hover:scale-110 cursor-pointer ${isMuted ? 'opacity-50' : ''}`}>
                    <Icon size={16} className={node.status === 'warning' ? 'text-[#FF9500]' : node.status === 'success' ? 'text-[#34C759]' : 'text-slate-400'} />
                  </div>
                </foreignObject>
                <text 
                  x={node.cx} 
                  y={node.cy + 30} 
                  textAnchor="middle" 
                  className={`text-[9px] font-black uppercase tracking-wider ${isMuted ? 'fill-slate-600 opacity-50' : 'fill-slate-400'}`}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
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
            // Skeleton loader blocks (Instruction 6)
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
  );
}
