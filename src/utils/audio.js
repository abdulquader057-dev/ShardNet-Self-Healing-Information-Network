/**
 * ShardNet Adaptive Voice Intelligence
 * Handles extreme audio compression and STT fallback for disaster scenarios.
 */

/**
 * Captures a short voice segment with aggressive compression.
 * Returns a Promise resolving to { blob, dataUrl, textFallback }
 */
export const captureCompressedVoice = async (durationMs = 5000) => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // We use the lowest possible bitrate and mono audio
      const RecorderClass = window.MediaRecorder || window.webkitMediaRecorder;
      if (!RecorderClass) {
        throw new Error("Voice hardware unavailable");
      }

      const mediaRecorder = new RecorderClass(stream, options);
      const audioChunks = [];

      // STT Fallback (Parallel)
      let textFallback = '';
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      let recognition = null;
      
      if (SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (event) => {
            textFallback = event.results[0][0].transcript;
          };
          recognition.start();
        } catch (e) {
          console.warn("STT Engine failed to start", e);
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          resolve({
            blob: audioBlob,
            dataUrl: reader.result,
            textFallback: textFallback.trim(),
            size: audioBlob.size
          });
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (recognition) recognition.stop();
      };

      mediaRecorder.start();
      
      // Auto-stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);

    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Checks if a voice payload is small enough for the QR mesh.
 * If not, suggests falling back to the STT text.
 */
export const optimizeVoicePayload = (voiceData, maxBytes = 12000) => {
  if (voiceData.size <= maxBytes) {
    return { 
      type: 'voice', 
      payload: voiceData.dataUrl,
      size: voiceData.size 
    };
  }
  
  return { 
    type: 'text_fallback', 
    payload: voiceData.textFallback || '[Voice too large for mesh]',
    size: (voiceData.textFallback || '').length
  };
};
