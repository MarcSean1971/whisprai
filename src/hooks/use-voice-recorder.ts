
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const durationInterval = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const silenceTimer = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      console.log('Microphone access granted');
      stream.current = mediaStream;

      // Set up audio analysis for silence detection
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(mediaStream);
      source.connect(analyser.current);
      analyser.current.fftSize = 2048;

      // Monitor audio levels
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!isRecording || !analyser.current) return;
        
        analyser.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average < 1) { // Threshold for silence
          if (!silenceTimer.current) {
            silenceTimer.current = window.setTimeout(() => {
              console.log('No audio detected for 3 seconds, showing warning');
              toast.warning('No audio detected. Please check your microphone.');
            }, 3000);
          }
        } else {
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
        }
        
        if (isRecording) {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      // Explicitly set MIME type for better cross-browser compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      console.log('Using MIME type:', mimeType);
      
      mediaRecorder.current = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      audioChunks.current = [];
      setRecordingDuration(0);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received audio chunk:', event.data.size, 'bytes');
          audioChunks.current.push(event.data);
        } else {
          console.warn('Received empty audio chunk');
        }
      };

      if (durationInterval.current) {
        window.clearInterval(durationInterval.current);
      }
      
      durationInterval.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.current.start(100);
      setIsRecording(true);
      requestAnimationFrame(checkAudioLevel);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(error instanceof Error ? error.message : 'Could not access microphone');
      throw error;
    }
  }, [isRecording]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const cleanup = () => {
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }

        if (audioContext.current) {
          audioContext.current.close();
          audioContext.current = null;
        }

        if (stream.current) {
          stream.current.getTracks().forEach(track => {
            track.stop();
            console.log('Audio track stopped:', track.id);
          });
          stream.current = null;
        }

        if (durationInterval.current) {
          window.clearInterval(durationInterval.current);
          durationInterval.current = null;
        }

        setIsRecording(false);
      };

      if (!mediaRecorder.current || !isRecording) {
        console.log('No active recording to stop');
        cleanup();
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        console.log('Recording stopped, creating audio blob from', audioChunks.current.length, 'chunks');
        
        if (audioChunks.current.length === 0) {
          console.warn('No audio chunks recorded');
          cleanup();
          resolve(null);
          return;
        }
        
        const audioBlob = new Blob(audioChunks.current, { 
          type: mediaRecorder.current?.mimeType || 'audio/webm;codecs=opus'
        });
        
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        
        if (audioBlob.size < 1000) { // Check if blob is too small (less than 1KB)
          console.warn('Audio blob is too small, might be empty');
          toast.error('No audio was recorded. Please try again.');
          cleanup();
          resolve(null);
          return;
        }
        
        cleanup();
        audioChunks.current = [];
        resolve(audioBlob);
      };
      
      try {
        mediaRecorder.current.stop();
        console.log('Stopped recording and released microphone');
      } catch (error) {
        console.error('Error stopping recording:', error);
        cleanup();
        resolve(null);
      }
    });
  }, [isRecording]);

  const convertBlobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          console.log('Converted audio blob to base64, length:', base64Data.length);
          resolve(base64Data);
        } catch (error) {
          console.error('Error extracting base64 data:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('Error converting blob to base64:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    convertBlobToBase64
  };
}
