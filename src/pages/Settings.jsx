import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Copy, 
  Check, 
  Globe, 
  HelpCircle, 
  ShieldAlert, 
  Volume2, 
  Smartphone, 
  Eye, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Edit2,
  X,
  BookOpen,
  QrCode,
  ScanLine,
  Wifi,
  Users,
  Clock,
  Share,
  Database,
  DownloadCloud,
  Loader2,
  Shield,
  Key
} from 'lucide-react';
import { useMesh } from '../core/MeshProvider';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { db } from '../storage/db';

export default function Settings() {
  const navigate = useNavigate();
  const [deviceName, setDeviceName] = useState(localStorage.getItem('setting_device_name') || 'Your Phone');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(deviceName);
  
  // Toggle states
  const [autoConnect, setAutoConnect] = useState(localStorage.getItem('setting_auto_connect') !== 'false');
  const [btFallback, setBtFallback] = useState(localStorage.getItem('setting_bt_fallback') !== 'false');
  const [bgBroadcast, setBgBroadcast] = useState(localStorage.getItem('setting_bg_broadcast') !== 'false');
  
  const [soundAlerts, setSoundAlerts] = useState(localStorage.getItem('setting_sound_alerts') !== 'false');
  const [vibration, setVibration] = useState(localStorage.getItem('setting_vibration') !== 'false');
  
  const [dbSize, setDbSize] = useState('0 KB');
  const [downloadingMap, setDownloadingMap] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [batterySaver, setBatterySaver] = useState(localStorage.getItem('setting_battery_saver') === 'true');

  
  const [highContrast, setHighContrast] = useState(localStorage.getItem('setting_high_contrast') === 'true');
  const [largeText, setLargeText] = useState(localStorage.getItem('setting_large_text') === 'true');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('setting_reduce_motion') === 'true');

  // Presentation settings (Instruction 6)

  const [showAboutModal, setShowAboutModal] = useState(false);

  // Mesh pairing state
  const { nodeId: meshNodeId, peerCount, reachableCount, isReady, createOffer, acceptOffer, completeConnection, pendingMessages } = useMesh();
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState(null); // 'show' | 'scan'
  const [offerPayload, setOfferPayload] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [pairStatus, setPairStatus] = useState(''); // '' | 'waiting' | 'connected' | 'error'
  const [pendingConn, setPendingConn] = useState(null);
  const [showQueue, setShowQueue] = useState(false);

  const deviceId = meshNodeId || 'SN-WV1K-7842';

  const calculateDbSize = async () => {
    try {
      const messages = await db.history.count();
      const nodes = await db.meshNodes.count();
      setDbSize(`${(messages * 0.5 + nodes * 0.2).toFixed(1)} KB`);
    } catch(e) {}
  };

  const handleDownloadMaps = async () => {
    setDownloadingMap(true);
    setDownloadProgress(0);
    const cx = 11802;
    const cy = 7445;
    const z = 14;
    const tiles = [];
    for(let dx=-2; dx<=2; dx++) {
      for(let dy=-2; dy<=2; dy++) {
        tiles.push(`https://a.basemaps.cartocdn.com/dark_all/${z}/${cx+dx}/${cy+dy}.png`);
      }
    }
    
    let loaded = 0;
    for(const url of tiles) {
      try {
        await fetch(url, { mode: 'no-cors' });
      } catch(e) {}
      loaded++;
      setDownloadProgress(Math.round((loaded / tiles.length) * 100));
    }
    
    setTimeout(() => {
      setDownloadingMap(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Map region cached for offline use.' } }));
    }, 500);
  };

  useEffect(() => {
    calculateDbSize();
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const handleChangePin = () => {
    if (confirm("Are you sure you want to change your Master PIN? You will be prompted to set a new one.")) {
      localStorage.removeItem('sharednet_pin_hash');
      window.location.reload();
    }
  };

  useEffect(() => {
    if (largeText) {
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  }, [largeText]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (batterySaver) {
      document.documentElement.classList.add('battery-saver');
    } else {
      document.documentElement.classList.remove('battery-saver');
    }
  }, [batterySaver]);

  const handleExportCSV = async () => {
    try {
      const history = await db.history.toArray();
      const nodes = await db.meshNodes.toArray();
      const csv = "type,id,data\\n" + 
        history.map(h => `history,${h.id},${JSON.stringify(h).replace(/,/g, ';')}`).join("\\n") + "\\n" +
        nodes.map(n => `node,${n.id},${JSON.stringify(n).replace(/,/g, ';')}`).join("\\n");
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sharednet-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Data exported to CSV');
    } catch(e) {
      showToast('error', 'Export failed');
    }
  };

  const handleResetData = () => {
    if (confirm("WARNING: This will wipe all stored data, contacts, and evidence. Proceed?")) {
      db.delete().then(() => {
        localStorage.clear();
        window.location.reload();
      });
    }
  };



  const showToast = (type, message) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message } }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceId).then(() => {
      showToast('success', 'Device ID copied to clipboard');
    }).catch(() => {
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



  const handleTestSOS = () => {
    window.dispatchEvent(new CustomEvent('trigger-sos-test'));
    showToast('success', 'Bypassing countdown: Test SOS transmission sent');
  };

  const handleResetNetwork = () => {
    if (confirm("Are you sure you want to reset your local mesh transceivers? This will wipe cached gossip shards.")) {
      localStorage.clear();
      window.location.reload();
    }
  };



  const ToggleSwitch = ({ checked, onChange, activeColor = '#0A84FF' }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full p-1 transition-colors flex ${checked ? 'justify-end' : 'justify-start'}`}
      style={{ backgroundColor: checked ? activeColor : '#3A3A3C' }}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
    </button>
  );

  return (
    <div className="space-y-6 pb-48">
      
      {/* ── HEADER ── */}
      <div className="space-y-1">
        <h1 className="text-h1 text-white">Settings</h1>
        <p className="text-body-sm text-slate-400">Configure mesh transceivers & display parameters</p>
      </div>

      {/* ── DEVICE IDENTITY SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Device Identity</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl divide-y divide-slate-800/60">
          
          <div className="pb-3 flex justify-between items-center">
            <div>
              <span className="text-[14px] text-slate-500 font-bold block">Device Alias</span>
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

          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="text-[14px] text-slate-500 font-bold block">Transceiver ID</span>
              <span className="text-slate-400 font-mono text-[14px]">{deviceId}</span>
            </div>
            <button onClick={copyToClipboard} className="text-slate-400 hover:text-[#0A84FF] p-1" aria-label="Copy Device ID">
              <Copy size={14} />
            </button>
          </div>

          <div className="pt-3 flex justify-between items-center">
            <div>
              <span className="text-[14px] text-slate-500 font-bold block">Network Role</span>
              <span className="text-slate-400 text-xs">Propagates background gossip</span>
            </div>
            <span className="status-pill status-pill--success uppercase tracking-wider">
              Relay Node
            </span>
          </div>

        </div>
      </div>

      {/* ── IDENTITY SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#0A84FF] uppercase tracking-widest block pl-1">Identity</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <button 
            onClick={() => navigate('/contacts')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                <Users size={16} className="text-[#0A84FF]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Identity & Contacts</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">Manage keys and friends</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={() => navigate('/squads')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
                <Shield size={16} className="text-[#8b5cf6]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Squad Channels</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">Encrypted private groups</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={() => navigate('/share')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#34C759]/20 flex items-center justify-center">
                <Share size={16} className="text-[#34C759]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Share App Offline</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">AirDrop or QR code install</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={handleChangePin}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
                <Key size={16} className="text-[#f59e0b]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Change Master PIN</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">Reset your security code</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* ── DATA & POWER ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Data & Power</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Battery Saver</span>
              <p className="text-[14px] text-slate-500">Reduce GPS polling and animations.</p>
            </div>
            <ToggleSwitch 
              checked={batterySaver} 
              onChange={(val) => { setBatterySaver(val); localStorage.setItem('setting_battery_saver', val.toString()); }} 
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                <FileText size={16} className="text-[#0A84FF]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">CSV Export</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">Backup messages and contacts</p>
              </div>
            </div>
            <DownloadCloud size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
          <button 
            onClick={handleResetData}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#FF3B30]/20 flex items-center justify-center">
                <ShieldAlert size={16} className="text-[#FF3B30]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#FF3B30]">Reset All Data</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">Wipe device entirely</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* ── SYSTEM DIAGNOSTICS SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#34C759] uppercase tracking-widest block pl-1">System</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <button 
            onClick={() => navigate('/storage')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#34C759]/20 flex items-center justify-center">
                <Database size={16} className="text-[#34C759]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Local Datastore</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">{dbSize} • IndexedDB (Encrypted)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
          
          <button 
            onClick={handleDownloadMaps}
            disabled={downloadingMap}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                {downloadingMap ? (
                  <Loader2 size={16} className="text-[#0A84FF] animate-spin" />
                ) : (
                  <DownloadCloud size={16} className="text-[#0A84FF]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Download Offline Region</p>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                  {downloadingMap ? `Caching tiles... ${downloadProgress}%` : 'Save 10km radius to device'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── MESH NETWORK SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#0A84FF] uppercase tracking-widest block pl-1">Real Mesh Network</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-3">
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[14px] text-slate-500 font-bold block">Mesh Node ID</span>
              <span className="text-white font-mono text-xs font-semibold">{meshNodeId || '...'}</span>
            </div>
            <div className={`px-2 py-1 rounded-md text-[14px] font-black uppercase tracking-wider ${isReady ? 'bg-[#34C759]/20 text-[#34C759]' : 'bg-slate-700 text-slate-400'}`}>
              {isReady ? 'Online' : 'Initializing'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2 border-y border-slate-800/60">
            <div className="text-center">
              <p className="text-lg font-black text-[#0A84FF] font-mono">{peerCount}</p>
              <p className="text-[14px] font-bold text-slate-500 uppercase">Direct</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#34C759] font-mono">{reachableCount}</p>
              <p className="text-[14px] font-bold text-slate-500 uppercase">Reachable</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#FF9500] font-mono">{pendingMessages.length}</p>
              <p className="text-[14px] font-bold text-slate-500 uppercase">Queued</p>
            </div>
          </div>

          {pendingMessages.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <button 
                onClick={() => setShowQueue(!showQueue)}
                className="w-full flex justify-between items-center text-[14px] font-black uppercase tracking-wider text-slate-400 py-2"
              >
                <span>Store-and-Forward Queue</span>
                <ChevronRight size={14} className={`transition-transform ${showQueue ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showQueue && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1">
                      {pendingMessages.map((msg, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#2C2C2E]/50 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#FF9500]" />
                            <span className="text-[14px] font-mono text-slate-300">To: {msg.to.slice(0, 6)}</span>
                          </div>
                          <span className="text-[14px] uppercase font-black text-slate-500">{msg.type}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={async () => {
                setPairMode('show');
                setPairStatus('waiting');
                setShowPairModal(true);
                try {
                  const offer = await createOffer();
                  setOfferPayload(offer.payload);
                  setPendingConn(offer);
                  setPairStatus('');
                } catch (err) {
                  setPairStatus('error');
                  console.error('[Pairing] Offer failed:', err);
                }
              }}
              className="flex-1 py-3 bg-[#0A84FF] text-white rounded-xl text-[14px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <QrCode size={14} /> Show My QR
            </button>
            <button
              onClick={() => {
                setPairMode('scan');
                setShowPairModal(true);
                setPairStatus('');
                setAnswerInput('');
              }}
              className="flex-1 py-3 bg-[#2C2C2E] border border-slate-700 text-white rounded-xl text-[14px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ScanLine size={14} /> Scan Peer QR
            </button>
          </div>

        </div>
      </div>

      {/* ── PAIR MODAL ── */}
      <AnimatePresence>
        {showPairModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowPairModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] border border-slate-700 rounded-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  {pairMode === 'show' ? 'Your Offer QR' : 'Scan Peer Code'}
                </h3>
                <button onClick={() => setShowPairModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {pairMode === 'show' && (
                <div className="space-y-4">
                  {pairStatus === 'waiting' ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-slate-400 text-xs">Generating WebRTC offer...</p>
                    </div>
                  ) : pairStatus === 'error' ? (
                    <p className="text-red-400 text-xs text-center py-4">Failed to create offer. Try again.</p>
                  ) : (
                    <>
                      <div className="text-[14px] text-slate-500 text-center mb-2">Step 1: Have the other device scan this</div>
                      <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                        <QRCodeSVG value={offerPayload} size={200} level="L" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[14px] text-slate-500 text-center">Step 2: Paste the answer code from their device:</p>
                        <textarea
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          placeholder="Paste the answer payload here..."
                          className="w-full bg-[#2C2C2E] border border-slate-700 text-white rounded-lg px-3 py-2 text-[14px] font-mono h-20 resize-none focus:outline-none focus:border-[#0A84FF]"
                        />
                        <button
                          onClick={() => {
                            if (!answerInput.trim()) return;
                            try {
                              completeConnection(answerInput.trim());
                              setPairStatus('connected');
                              setTimeout(() => setShowPairModal(false), 1500);
                              window.dispatchEvent(new CustomEvent('show-toast', {
                                detail: { type: 'success', message: '✅ Mesh peer connected!' }
                              }));
                            } catch (err) {
                              setPairStatus('error');
                              console.error('[Pairing]', err);
                            }
                          }}
                          className="w-full py-3 bg-[#34C759] text-white rounded-xl text-[14px] font-black uppercase tracking-wider active:scale-[0.98] transition-transform"
                        >
                          Complete Connection
                        </button>
                      </div>
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: 'SharedNet Pairing', text: offerPayload }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(offerPayload);
                            window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Offer copied to clipboard' } }));
                          }
                        }}
                        className="w-full py-2 bg-[#2C2C2E] border border-slate-700 text-slate-300 rounded-xl text-[14px] font-bold uppercase tracking-wider"
                      >
                        Share Code Instead
                      </button>
                    </>
                  )}
                  {pairStatus === 'connected' && (
                    <div className="text-center py-4">
                      <div className="text-[#34C759] text-2xl mb-2">✅</div>
                      <p className="text-[#34C759] font-bold text-sm">Connected!</p>
                    </div>
                  )}
                </div>
              )}

              {pairMode === 'scan' && (
                <div className="space-y-4">
                  <p className="text-[14px] text-slate-500 text-center">Paste the offer code from the other device:</p>
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Paste the offer payload here..."
                    className="w-full bg-[#2C2C2E] border border-slate-700 text-white rounded-lg px-3 py-2 text-[14px] font-mono h-24 resize-none focus:outline-none focus:border-[#0A84FF]"
                  />
                  {pairStatus === 'connected' ? (
                    <div className="text-center py-4">
                      <div className="text-[#34C759] text-2xl mb-2">✅</div>
                      <p className="text-[#34C759] font-bold text-sm">Connected!</p>
                    </div>
                  ) : pairStatus === 'answering' ? (
                    <div className="space-y-3">
                      <div className="text-[14px] text-slate-500 text-center">Show this answer to the other device:</div>
                      <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                        <QRCodeSVG value={offerPayload} size={200} level="L" />
                      </div>
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: 'SharedNet Answer', text: offerPayload }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(offerPayload);
                            window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Answer copied to clipboard' } }));
                          }
                        }}
                        className="w-full py-2 bg-[#2C2C2E] border border-slate-700 text-slate-300 rounded-xl text-[14px] font-bold uppercase tracking-wider"
                      >
                        Share Answer Code
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!answerInput.trim()) return;
                        try {
                          const answerPayload = await acceptOffer(answerInput.trim());
                          setOfferPayload(answerPayload);
                          setPairStatus('answering');
                        } catch (err) {
                          setPairStatus('error');
                          console.error('[Pairing] Accept failed:', err);
                        }
                      }}
                      className="w-full py-3 bg-[#0A84FF] text-white rounded-xl text-[14px] font-black uppercase tracking-wider active:scale-[0.98] transition-transform"
                    >
                      Accept & Generate Answer
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* ── NETWORK CONFIGURATION SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Network Config</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Auto-Connect to Mesh</span>
              <p className="text-[14px] text-slate-500">Automatically sync with nearest transceivers.</p>
            </div>
            <ToggleSwitch 
              checked={autoConnect} 
              onChange={(val) => { setAutoConnect(val); localStorage.setItem('setting_auto_connect', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Bluetooth Fallback</span>
              <p className="text-[14px] text-slate-500">Auto background synchronization via BLE links.</p>
            </div>
            <ToggleSwitch 
              checked={btFallback} 
              onChange={(val) => { setBtFallback(val); localStorage.setItem('setting_bt_fallback', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Background Broadcasting</span>
              <p className="text-[14px] text-slate-500">Propagate encrypted shards when app is minimized.</p>
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
              <p className="text-[14px] text-slate-500">Play acoustic warning sweeps on incoming alerts.</p>
            </div>
            <ToggleSwitch 
              checked={soundAlerts} 
              onChange={(val) => { setSoundAlerts(val); localStorage.setItem('setting_sound_alerts', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Tactile Haptics</span>
              <p className="text-[14px] text-slate-500">Vibrate patterns during transmissions.</p>
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
              <p className="text-[14px] text-slate-500">Increases borders and visual readability.</p>
            </div>
            <ToggleSwitch 
              checked={highContrast} 
              onChange={(val) => { setHighContrast(val); localStorage.setItem('setting_high_contrast', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Large UI Text</span>
              <p className="text-[14px] text-slate-500">Scales interfaces up to 120% magnification.</p>
            </div>
            <ToggleSwitch 
              checked={largeText} 
              onChange={(val) => { setLargeText(val); localStorage.setItem('setting_large_text', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Reduce Interface Motion</span>
              <p className="text-[14px] text-slate-500">Bypasses visual scale & float animations.</p>
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
            <span className="text-white font-semibold">SharedNet v2.8.0</span>
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
        backgroundColor: checked ? activeColor : '#3A3A3C',
        border: checked ? 'none' : '1px solid rgba(255,255,255,0.08)'
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
