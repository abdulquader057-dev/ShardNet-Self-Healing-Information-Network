import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Share2, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  Copy,
  Download,
  QrCode
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function ShardViewer() {
  const { shards } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShard, setSelectedShard] = useState(null);

  // Group shards by messageId
  const groupedShards = shards.reduce((acc, shard) => {
    if (!acc[shard.messageId]) acc[shard.messageId] = [];
    acc[shard.messageId].push(shard);
    return acc;
  }, {});

  const messageIds = Object.keys(groupedShards).filter(id => 
    id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">Shard_Inventory</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="QUERY_MESSAGE_ID..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors uppercase font-bold"
        />
      </div>

      <div className="space-y-4">
        {messageIds.length === 0 ? (
          <div className="text-center py-16 text-zinc-800 font-black text-[10px] tracking-widest border border-zinc-900 rounded bg-zinc-900/10 uppercase">
            [ NO_FRAGMENTS_DETECTED_IN_LOCAL_STORAGE ]
          </div>
        ) : (
          messageIds.map(msgId => (
            <div key={msgId} className="space-y-3 p-4 bg-zinc-900/30 border border-zinc-800 rounded relative overflow-hidden group">
              <div className="absolute inset-0 shard-grid opacity-5 group-hover:opacity-10 transition-opacity" />
              
              <div className="flex items-center justify-between px-1 relative z-10">
                <h3 className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">
                  NODE://{msgId.substring(0, 8)}
                </h3>
                <span className="text-[9px] font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {groupedShards[msgId].length} FRAGS
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2 relative z-10">
                {Array.from({ length: groupedShards[msgId][0].totalShards }).map((_, idx) => {
                  const shard = groupedShards[msgId].find(s => s.index === idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => shard && setSelectedShard(shard)}
                      className={cn(
                        "aspect-square rounded border flex items-center justify-center transition-all",
                        shard 
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black glow-emerald" 
                          : "bg-zinc-950 border-zinc-900 text-zinc-800 cursor-not-allowed"
                      )}
                    >
                      {shard ? <Box className="w-5 h-5" /> : <div className="w-1 h-1 rounded-full bg-zinc-800" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedShard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShard(null)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 shard-grid opacity-5 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="text-center space-y-2">
                  <div className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 inline-block mx-auto">TRANSMITTER_READY</div>
                  <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Protocol 0x{selectedShard.messageId.substring(0, 8)}</h3>
                  <p className="text-zinc-500 font-bold text-[9px]">SHARD_INDEX: {selectedShard.index + 1} / {selectedShard.totalShards}</p>
                </div>
                
                <div className="p-4 bg-white rounded-sm">
                  <QRCodeSVG value={JSON.stringify(selectedShard)} size={200} />
                </div>

                <div className="w-full grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedShard));
                        alert('SHARD_DATA copied to clipboard');
                    }}
                    className="flex flex-col items-center gap-2 py-4 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors font-black uppercase text-[10px]"
                  >
                    <Copy className="w-5 h-5 opacity-50" />
                    Copy JSON
                  </button>
                  <button 
                    onClick={() => setSelectedShard(null)}
                    className="flex flex-col items-center gap-2 py-4 bg-emerald-500 text-black hover:bg-emerald-400 transition-colors font-black uppercase text-[10px]"
                  >
                    <QrCode className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
