import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Check, QrCode, Download, Info, AlertTriangle, Map, Activity, User, Globe, Camera, Volume2, Mic, Loader2, Maximize, X, Zap, Share2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { createShards } from '../core/sharding';
import { saveShard, getNodeIdentity, getAllMessages, addLog } from '../storage/db';
import { safeInterval } from '../core/stability';
import { generateShardQR } from '../utils/qr';
import { getCurrentPosition, formatCoords } from '../utils/geo';
import { captureCompressedVoice, optimizeVoicePayload } from '../utils/audio';
import { shareImage, downloadImage } from '../utils/sharing';

const categories = [
  { id: 'Info', icon: <Info size={18} />, label: 'Standard Info' },
  { id: 'Emergency', icon: <AlertTriangle size={18} />, label: 'Emergency' },
  { id: 'Safe Route', icon: <Map size={18} />, label: 'Safe Route' },
  { id: 'Medical', icon: <Activity size={18} />, label: 'Medical' },
];

const CreateMessage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(mode === 'sos' ? 3 : mode === 'safe' ? 1 : 2);
  const [category, setCategory] = useState(mode === 'sos' ? 'Emergency' : mode === 'safe' ? 'Safe Route' : 'Info');
  const [location, setLocation] = useState('Sector 7G');
  const [prevMessages, setPrevMessages] = useState([]);
  const [selectedPrev, setSelectedPrev] = useState(null);
  const [nodeId, setNodeId] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [generatedShards, setGeneratedShards] = useState([]);
  const [qrCodes, setQrCodes] = useState({});
  const [useGeo, setUseGeo] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isManualBurstActive, setIsManualBurstActive] = useState(false);
  const [burstIndex, setBurstIndex] = useState(0);

  useEffect(() => {
    getNodeIdentity().then(setNodeId);
    getAllMessages().then(setPrevMessages);
    
    // Auto-fetch GPS if SOS
    if(mode === 'sos') {
       fetchGPS();
    }
  }, [mode]);

  useEffect(() => {
    if (isManualBurstActive && generatedShards.length > 0) {
      // Toggle Wakelock if available to prevent screen dimming
      let wakeLock = null;
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(w => wakeLock = w).catch(()=>{});
      }
      const t = safeInterval(() => {
        setBurstIndex(i => (i + 1) % generatedShards.length);
      }, 600); // Super fast cycle
      return () => {
        clearInterval(t);
        if(wakeLock) wakeLock.release().catch(()=>{});
      };
    }
  }, [isManualBurstActive, generatedShards]);

  const fetchGPS = async () => {
    setGeoLoading(true);
    try {
      const pos = await getCurrentPosition();
      setGeoData(pos);
      setUseGeo(true);
      setLocation(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
    } catch (e) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'GPS signal too weak or unavailable' } }));
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSnapScene = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
         const canvas = document.createElement('canvas');
         const MAX_WIDTH = 250; // Extremely small to fit in mesh
         const scaleSize = MAX_WIDTH / img.width;
         canvas.width = MAX_WIDTH;
         canvas.height = img.height * scaleSize;
         const ctx = canvas.getContext('2d');
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         const base64 = canvas.toDataURL('image/jpeg', 0.3); // High compression
         setImagePreview(base64);
         setMessage(`[PHOTO EVIDENCE ATTACHED]`);
      }
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!message.trim() && !imagePreview && !audioPreview) return;
    setIsManualBurstActive(false);
    setLoading(true);
    try {
      let finalPayload = message;
      if (audioPreview) finalPayload = `AUDIO:${audioPreview}`;
      else if (imagePreview) finalPayload = `IMAGE:${imagePreview}`;

      if (mode === 'sos') {
        const profile = localStorage.getItem('shardnet_emergency_profile');
        if (profile) {
          const p = JSON.parse(profile);
          finalPayload += `\n\n--- SOS IDENTITY ---\nName: ${p.name}\nBlood: ${p.bloodGroup}\nContact: ${p.contact}\nNotes: ${p.notes}`;
        }
      }

      const shards = await createShards(finalPayload, category, nodeId, priority, location, selectedPrev, geoData);
      
      for (const shard of shards) await saveShard(shard);

      const qrs = {};
      for (const shard of shards) {
        qrs[shard.id] = await generateShardQR(shard);
      }

      setGeneratedShards(shards);
      setQrCodes(qrs);
      await addLog(`Successfully sharded intelligence at ${location}.`, 'success');
      
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Signal creation failed: ' + (err.message || 'Unknown error') } }));
    } finally {
      setLoading(false);
    }
  };

  if (isManualBurstActive && generatedShards.length > 0) {
    const activeShard = generatedShards[burstIndex];
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
        <button onClick={() => setIsManualBurstActive(false)} className="absolute top-8 right-8 p-4 bg-black/10 rounded-full text-black">
           <X size={32} />
        </button>
        <div className="text-black font-black text-2xl mb-8 uppercase tracking-widest text-center">
          BURST MODE ACTIVE<br/>
          <span className="text-sm text-red-600">SCREEN BRIGHTNESS MAXIMIZED</span>
        </div>
        <img src={qrCodes[activeShard.id]} alt="Burst QR" className="w-[90vw] max-w-md aspect-square" />
        <div className="mt-8 text-black font-black text-xl">
          SHARD {activeShard.shardIndex + 1} / {activeShard.totalShards}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${mode==='sos' ? 'bg-danger text-white' : 'bg-primary/20 text-primary'}`}>
          {mode === 'sos' ? <AlertTriangle size={24} /> : <Send size={24} />}
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          {mode === 'sos' ? 'CRITICAL DISPATCH' : 'Inject Information'}
        </h2>
      </div>

      {!generatedShards.length ? (
        <form onSubmit={handleCreate} className={`glass p-8 rounded-3xl space-y-8 ${mode==='sos' ? 'border-danger bg-danger/10' : 'border-white/5'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Originating Node</p>
                  <p className="text-sm font-bold font-mono">{nodeId}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm font-bold"
                    placeholder="Enter sector or street..."
                  />
                </div>
                <button 
                  type="button" onClick={fetchGPS}
                  className={`px-4 rounded-2xl border-2 transition-all ${useGeo ? 'bg-secondary/20 text-secondary border-secondary/40' : 'bg-white/5 text-slate-600 border-white/10'}`}
                  title="Attach GPS Coordinates"
                >
                  <Map size={20} className={geoLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Information Category</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      category === cat.id 
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    {cat.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Broadcast Priority</label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p} type="button" onClick={() => setPriority(p)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      priority === p 
                        ? (p===3 ? 'bg-danger/20 border-danger text-danger shadow-lg shadow-danger/20' : 'bg-accent/20 border-accent text-accent shadow-lg shadow-accent/10') 
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <span className="text-lg font-black">{p}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">{p === 1 ? 'Low' : p === 2 ? 'Med' : 'High'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Intel Input</label>
              <div className="flex gap-2">
                {(audioPreview || imagePreview) && (
                  <button type="button" onClick={() => { setAudioPreview(null); setImagePreview(null); setMessage(''); }} className="text-[10px] font-black text-danger uppercase tracking-widest hover:underline">
                    Clear Media
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative group">
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-3xl p-6 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[160px] text-lg font-medium ${(audioPreview || imagePreview) ? 'opacity-30 pointer-events-none' : ''}`}
                placeholder={(audioPreview || imagePreview) ? "Media captured. Ready for sharding." : "Type your critical information..."}
                required={!audioPreview && !imagePreview}
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                {/* Image Capture */}
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleSnapScene} className="hidden" />
                <button
                  type="button" onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-2xl transition-all shadow-xl ${imagePreview ? 'bg-secondary text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                >
                  <Camera size={24} />
                </button>

                {/* Voice Capture */}
                <button
                  type="button"
                  onMouseDown={() => {
                    setIsRecording(true);
                    captureCompressedVoice(5000).then(result => {
                      setIsRecording(false);
                      setVoiceProcessing(true);
                      const optimized = optimizeVoicePayload(result);
                      if (optimized.type === 'voice') {
                        setAudioPreview(optimized.payload);
                        setMessage(`[Encrypted Voice Intelligence]`);
                      }
                      setVoiceProcessing(false);
                    }).catch(e => { setIsRecording(false); setVoiceProcessing(false); });
                  }}
                  onMouseUp={() => setIsRecording(false)}
                  className={`p-4 rounded-2xl transition-all shadow-xl ${
                    isRecording ? 'bg-danger text-white scale-110' : voiceProcessing ? 'bg-primary/20 text-primary animate-pulse' : audioPreview ? 'bg-secondary text-white' : 'bg-white/5 text-slate-500 hover:text-white'
                  }`}
                >
                  {voiceProcessing ? <Loader2 size={24} className="animate-spin" /> : audioPreview ? <Volume2 size={24} /> : <Mic size={24} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full py-5 text-white rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${mode==='sos' ? 'bg-danger hover:bg-danger/80 shadow-danger/20' : 'bg-primary hover:bg-primary/80 shadow-primary/20'}`}
          >
            {loading ? 'CALCULATING FRAGMENTS...' : mode === 'sos' ? <><AlertTriangle size={20} /> INITIATE EMERGENCY SHARDING</> : <><Zap size={20} /> INITIALIZE SECURE SHARDING</>}
          </button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">Message split into {generatedShards.length} shards. Distribute them via QR codes.</p>
            <button onClick={() => { setGeneratedShards([]); setMessage(''); setAudioPreview(null); setImagePreview(null); }} className="text-primary text-sm font-bold hover:underline">
              CREATE ANOTHER
            </button>
          </div>

          <button
            onClick={() => setIsManualBurstActive(true)}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 transition"
          >
            <Maximize size={20} />
            ENTER FULL-SCREEN BURST MODE
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedShards.map((shard, index) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={shard.id} className="glass p-6 rounded-3xl border-white/5 flex flex-col items-center gap-6">
                <div className="w-full flex justify-between items-center">
                  <span className="bg-primary/20 text-primary text-xs font-black px-3 py-1 rounded-full">SHARD {shard.shardIndex + 1} / {shard.totalShards}</span>
                  <span className="text-slate-500 text-xs">ID: {shard.id.split('-')[0]}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-primary/10 shadow-inner">
                  <img src={qrCodes[shard.id]} alt={`Shard ${index}`} className="w-40 h-40" />
                  <p className="text-[8px] text-center font-black text-slate-300 uppercase tracking-widest mt-2">Scan to Collect</p>
                </div>
                <div className="w-full flex gap-2">
                  <button 
                    onClick={() => shareImage(qrCodes[shard.id], `shard-${shard.id}.png`).catch(e => window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Sharing failed. Use Download instead.' } })))}
                    className="flex-1 py-3 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary transition-all"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <button 
                    onClick={() => downloadImage(qrCodes[shard.id], `shard-${shard.id}.png`)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMessage;
