import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VoiceRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          onRecordingComplete(base64Audio);
        };
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'error', message: 'Microphone access denied.' } 
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`w-[50px] h-[50px] shrink-0 rounded-xl flex items-center justify-center transition-colors ${
        isRecording ? 'bg-[#FF3B30] text-white animate-pulse' : 'bg-[#1C1C1E] border border-slate-700 text-slate-400 hover:text-white'
      }`}
    >
      {isRecording ? <Square size={20} /> : <Mic size={20} />}
    </button>
  );
}
