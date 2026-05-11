import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, QrCode, Shield, Share2, Zap, Database, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, getAllShards, getAllMessages, getNodeIdentity } from '../storage/db';
import QRCode from 'react-qr-code';
import { beamSignal } from '../utils/sharing';

/**
 * ShardNet Mesh Pulse (Batch Relay)
 * Bundles multiple shards into a single high-density signal for rapid A->B->C propagation.
 * Now includes ECR (Emergency Consensus Reconstruction) proofs.
 */
const MeshPulse = () => {
  const navigate = useNavigate();
  const [shards, setShards] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [pulseData, setPulseData] = useState(null);

  useEffect(() => {
    getAllShards().then(setShards);
  }, []);

  const generatePulse = async () => {
    const bundle = shards
      .filter((_, idx) => selectedIndices.has(idx))
      .map(s => ({
        id: s.id,
        mId: s.messageId,
        idx: s.shardIndex,
        tot: s.totalShards,
        data: s.data,
        oNode: s.originNodeId,
        exp: s.expiry,
        geo: s.geo
      }));

    // Fetch all reconstructed messages to include ECR proofs
    const messages = await getAllMessages();
    const nodeId = await getNodeIdentity();
    const proofs = messages
      .filter(m => m.consensusHash)
      .map(m => ({
        mId: m.messageId,
        h: m.consensusHash,
        n: nodeId
      }));

    // Create a compact bundle format
    setPulseData({
      type: 'mesh_pulse',
      v: 2, 
      payload: bundle,
      proofs // ECR Proofs
    });
  };

  const toggleShard = (idx) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 glass rounded-none text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tight">Mesh Pulse</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-Hop Batch Relay</p>
        </div>
      </header>

      {pulseData ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-8 rounded-none border-white/10 space-y-8 text-center"
        >
          <div className="inline-block p-6 bg-white rounded-none shadow-2xl">
            <QRCode 
              value={JSON.stringify(pulseData)} 
              size={220}
              level="M"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Broadcasting Bundle</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              Contains {pulseData.payload.length} Fragments
            </p>
            
            <button 
              onClick={() => beamSignal(pulseData, 'Mesh Pulse')}
              className="w-full py-4 bg-secondary text-white rounded-none font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-secondary/20"
            >
              <Zap size={18} />
              Native Proximity Beam
            </button>
            
            <button 
              onClick={() => setPulseData(null)}
              className="w-full py-4 bg-white/5 text-slate-400 rounded-none font-black uppercase tracking-widest border border-white/10"
            >
              Adjust Payload
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="glass p-6 rounded-none border-white/5 bg-primary/5 border-primary/20 flex items-center gap-4 overflow-hidden">
            <div className="p-3 bg-primary/20 rounded-none text-primary shrink-0">
              <Share2 size={24} />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Select fragments to bundle into a single high-density relay signal. 
              This enables rapid propagation across the mesh.
            </p>
          </div>

          {shards.length === 0 ? (
            <div className="glass p-16 rounded-none border-dashed border-white/5 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Database className="text-slate-800" size={40} />
              </div>
              <div className="space-y-2">
                <p className="text-slate-500 font-black italic uppercase tracking-[0.3em] text-xs">No Fragments Available</p>
                <p className="text-[10px] text-slate-700 uppercase font-black tracking-widest">
                  Scan QR codes or receive mesh signals to cache fragments for batch relay.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {shards.map((shard, idx) => (
                <button
                  key={shard.id}
                  onClick={() => toggleShard(idx)}
                  className={`p-5 rounded-none border-2 transition-all flex items-center justify-between overflow-hidden ${
                    selectedIndices.has(idx) 
                      ? 'bg-primary/10 border-primary text-white' 
                      : 'bg-white/5 border-white/5 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Database size={18} className={`shrink-0 ${selectedIndices.has(idx) ? 'text-primary' : 'text-slate-700'}`} />
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">
                        Message: {shard.messageId.substring(0, 8)}
                      </p>
                      <p className="text-xs font-bold uppercase italic truncate">
                        Fragment {shard.shardIndex + 1} of {shard.totalShards}
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedIndices.has(idx) ? 'border-primary bg-primary' : 'border-slate-700'
                  }`}>
                    {selectedIndices.has(idx) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedIndices.size > 0 && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={generatePulse}
              className="fixed bottom-24 left-4 right-4 py-5 bg-primary text-white rounded-none font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 z-50 border-4 border-white/20"
            >
              <QrCode size={24} />
              Generate Mesh Pulse ({selectedIndices.size})
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MeshPulse;
