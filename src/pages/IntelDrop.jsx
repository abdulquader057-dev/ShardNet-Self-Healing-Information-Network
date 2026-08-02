import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileImage, FileArchive, Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useMesh } from '../core/MeshProvider';
import { db } from '../storage/db';

export default function IntelDrop() {
  const { broadcast, nodeId, isReady } = useMesh();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Load previously received files from DB or keep in memory
  // For this demo, we'll listen to mesh events directly
  useEffect(() => {
    const handleFileReceive = (e) => {
      const msg = e.detail;
      if (msg.type === 'file') {
        try {
          const fileData = JSON.parse(msg.plaintext);
          setReceivedFiles(prev => [{
            id: msg.id,
            name: fileData.name,
            type: fileData.fileType,
            dataUrl: fileData.dataUrl,
            sender: msg.from,
            timestamp: msg.timestamp
          }, ...prev]);
        } catch(err) {
          console.warn("Failed to parse file", err);
        }
      }
    };
    
    window.addEventListener('mesh-file-received', handleFileReceive);
    return () => window.removeEventListener('mesh-file-received', handleFileReceive);
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Limit file size to 500KB for the WebRTC demo to ensure fast transmission
    if (selected.size > 500 * 1024) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'error', message: 'File too large. Limit is 500KB for offline mesh.' } 
      }));
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selected);
  };

  const handleSend = async () => {
    if (!file || !preview || !isReady) return;

    setIsSending(true);

    const payload = JSON.stringify({
      name: file.name,
      fileType: file.type,
      dataUrl: preview
    });

    try {
      // Broadcast file with high TTL
      await broadcast(payload, 'file', 15);
      
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'success', message: 'Intel Drop broadcasted successfully!' } 
      }));
      
      setFile(null);
      setPreview(null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'error', message: 'Failed to send Intel Drop.' } 
      }));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-48 px-6 pt-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-white flex items-center gap-3">
            <FileArchive className="text-[#0A84FF]" size={28} />
            Intel Drop
          </h1>
          <p className="text-body-sm text-slate-400">Offline P2P Media Transfer</p>
        </div>
      </div>

      {/* Send Section */}
      <div className="card p-6 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#0A84FF] transition-colors bg-[#0A0A0F]"
          >
            <Upload size={32} className="text-slate-500" />
            <div className="text-center">
              <p className="text-sm font-bold text-white">Select File to Broadcast</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Max 500KB (Images/Docs)</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept="image/*,.pdf,.txt"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <FileImage size={24} className="text-[#34C759]" />
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setPreview(null); }} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {file.type.startsWith('image/') && (
              <div className="w-full h-32 bg-[#0A0A0F] rounded-lg overflow-hidden border border-slate-800 flex justify-center items-center">
                <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
              </div>
            )}

            <button 
              onClick={handleSend}
              disabled={isSending || !isReady}
              className="btn-premium w-full bg-[#0A84FF] text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <>Broadcasting...</>
              ) : (
                <><Send size={16} /> Broadcast to Mesh</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Received Files Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Received Intel</h3>
        {receivedFiles.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
            <ShieldAlert className="mx-auto mb-2 text-slate-600" size={24} />
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">No files intercepted</p>
          </div>
        ) : (
          receivedFiles.map(rf => (
            <div key={rf.id} className="p-4 bento-card border-white/5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white text-sm truncate">{rf.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">From: {rf.sender.slice(0, 8)}</p>
                </div>
                <CheckCircle2 size={16} className="text-[#34C759]" />
              </div>
              
              {rf.type.startsWith('image/') && (
                <img src={rf.dataUrl} alt="Received" className="w-full rounded-lg max-h-48 object-cover border border-slate-800" />
              )}
              
              <a 
                href={rf.dataUrl} 
                download={rf.name}
                className="block text-center w-full py-2 bg-[#2C2C2E] rounded-lg text-xs font-bold text-white uppercase tracking-wider"
              >
                Save File
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
