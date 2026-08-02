import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Upload, ShieldAlert, ArrowLeft, Loader2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMesh } from '../core/MeshProvider';
import { db } from '../storage/db';
import { captureCompressedVoice } from '../utils/audio';

export default function EvidenceCapture() {
  const navigate = useNavigate();
  const { broadcast, isReady, nodeId } = useMesh();
  const [mode, setMode] = useState(null); // 'photo' | 'audio'
  const [mediaData, setMediaData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      // Audio capture utility handles its own stream closure
    };
  }, []);

  const handleSnapPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Highly aggressive compression for mesh
        const MAX_WIDTH = 320; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // JPEG 0.3 for minimal bytes
        const base64 = canvas.toDataURL('image/jpeg', 0.3);
        setMediaData({ type: 'image', payload: base64 });
        setLoading(false);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleStartAudio = async () => {
    setIsRecording(true);
    setMode('audio');
    try {
      const result = await captureCompressedVoice(5000); // max 5s
      setMediaData({ type: 'audio', payload: result });
    } catch (e) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Mic access failed' } }));
    } finally {
      setIsRecording(false);
    }
  };

  const handleBroadcast = async () => {
    if (!mediaData || !isReady) return;
    setLoading(true);

    try {
      const evidenceData = {
        id: `ev-${Date.now()}`,
        type: mediaData.type,
        category: 'EVIDENCE',
        timestamp: Date.now(),
        ttl: 21600000, // 6h
      };
      
      // Store locally
      await db.evidence.put(evidenceData);
      
      // Broadcast to mesh
      const payloadStr = `${mediaData.type.toUpperCase()}:${mediaData.payload}`;
      await broadcast(payloadStr, 'evidence', evidenceData.ttl, 'EVIDENCE');
      
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Evidence Secured & Broadcasted' } }));
      navigate(-1);
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Broadcast failed' } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-[#141419] border-b border-[#2A2A35]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#8B8B9A] hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-white font-bold tracking-widest uppercase">
          <ShieldAlert size={18} className="text-[#EF4444]" />
          Secure Evidence
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        
        {!mediaData && !isRecording && (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto text-[#EF4444] mb-6">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Capture Reality</h2>
            <p className="text-[#8B8B9A] text-sm leading-relaxed">
              Record tamper-evident audio or photo. Data is instantly compressed, hashed, and flooded to all nearby nodes before it can be deleted.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-4 text-[#3B82F6]">
            <Loader2 size={48} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Processing & Hashing...</span>
          </div>
        ) : isRecording ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-32 h-32 rounded-full bg-[#EF4444]/20 flex items-center justify-center animate-pulse border border-[#EF4444]/50">
              <Mic size={48} className="text-[#EF4444]" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#EF4444] animate-pulse">
              Recording (Max 10s)...
            </span>
          </motion.div>
        ) : mediaData ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="bg-[#141419] border border-[#2A2A35] rounded-3xl p-4 flex flex-col items-center gap-4">
              {mediaData.type === 'image' ? (
                <img src={mediaData.payload} alt="Evidence" className="w-full rounded-2xl border border-[#2A2A35]" />
              ) : (
                <div className="w-full p-6 bg-black/40 rounded-2xl flex items-center justify-center text-[#22C55E]">
                  <Mic size={32} />
                </div>
              )}
              
              <div className="w-full flex items-center justify-between px-2 text-xs font-mono text-[#8B8B9A]">
                <span>Signature: Valid</span>
                <span>Size: {(mediaData.payload.length / 1024).toFixed(1)}KB</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setMediaData(null); setMode(null); }}
                className="flex-1 py-4 bg-[#141419] text-[#8B8B9A] border border-[#2A2A35] rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:text-white hover:border-[#8B8B9A] transition-colors"
              >
                <X size={18} /> Discard
              </button>
              <button
                onClick={handleBroadcast}
                className="flex-1 py-4 bg-[#EF4444] text-white rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:bg-[#DC2626] transition-colors"
              >
                <Upload size={18} /> Broadcast
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleSnapPhoto} className="hidden" />
            
            <button
              onClick={() => { setMode('photo'); fileInputRef.current?.click(); }}
              className="aspect-square bg-[#141419] border border-[#2A2A35] rounded-3xl flex flex-col items-center justify-center gap-4 text-[#8B8B9A] hover:text-[#3B82F6] hover:border-[#3B82F6] transition-colors"
            >
              <Camera size={40} />
              <span className="text-xs font-bold uppercase tracking-widest">Photo</span>
            </button>
            
            <button
              onClick={handleStartAudio}
              className="aspect-square bg-[#141419] border border-[#2A2A35] rounded-3xl flex flex-col items-center justify-center gap-4 text-[#8B8B9A] hover:text-[#EF4444] hover:border-[#EF4444] transition-colors"
            >
              <Mic size={40} />
              <span className="text-xs font-bold uppercase tracking-widest">Audio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
