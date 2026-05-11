import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Clock, 
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function MessageList({ messages }) {
  const { deleteMessage } = useStore();

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-700 border border-zinc-800 rounded-lg bg-zinc-900/20">
        <Clock className="w-10 h-10 mb-4 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest">No Encrypted Records Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((msg) => (
        <MessageCard 
          key={msg.messageId} 
          msg={msg} 
          onDelete={() => deleteMessage(msg.messageId)}
        />
      ))}
    </div>
  );
}

function MessageCard({ msg, onDelete }) {
  const isCompleted = msg.status === 'completed';
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const priorityConfig = {
    emergency: { label: 'EMERGENCY', color: 'emerald', text: 'emerald-400' },
    important: { label: 'PRIORITY', color: 'amber', text: 'amber-500' },
    normal: { label: 'NORMAL', color: 'zinc', text: 'zinc-500' },
  };

  const config = priorityConfig[msg.priority] || priorityConfig.normal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-zinc-900/30 border-l-4 p-4 transition-all group",
        isCompleted ? "border-emerald-500 bg-emerald-950/10" : `border-${config.color}-500/50`
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-black uppercase tracking-widest", `text-${config.text}`)}>
              {config.label}
            </span>
            {isCompleted && <Unlock className="w-3 h-3 text-emerald-500" />}
          </div>
          <span className="text-[9px] text-zinc-600 font-bold">{timeStr}</span>
        </div>
        
        <div className="flex-1">
          {isCompleted ? (
            <p className="text-zinc-200 text-sm leading-snug font-medium">{msg.content}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-500 text-[11px] italic">[RECONSTRUCTING MESSAGE {msg.messageId.substring(0, 6)}...]</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase">Status: PENDING</span>
                <div className="flex-1 h-1 bg-zinc-800">
                  <div className="h-full bg-amber-500 animate-pulse w-1/3" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50">
          <span className="text-[9px] text-zinc-600 font-mono">ID: 0x{msg.messageId.substring(0, 8)}</span>
          <button 
            onClick={onDelete}
            className="p-1 text-zinc-700 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
