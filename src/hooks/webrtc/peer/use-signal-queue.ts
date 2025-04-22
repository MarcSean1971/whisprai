
import { useRef, useCallback } from 'react';
import { toast } from "sonner";

export function useSignalQueue(peerRef: React.MutableRefObject<any>, connectionStatsRef: React.MutableRefObject<any>) {
  const signalQueueRef = useRef<any[]>([]);
  const processingSignalRef = useRef(false);
  const offerProcessedRef = useRef(false);
  const answerProcessedRef = useRef(false);
  
  const processSignalQueue = useCallback(() => {
    if (processingSignalRef.current || signalQueueRef.current.length === 0 || !peerRef.current) {
      return;
    }
    
    processingSignalRef.current = true;
    
    // First process any offer/answer before ICE candidates
    const signalIndex = signalQueueRef.current.findIndex(s => s.type === 'offer' || s.type === 'answer');
    const signal = signalIndex >= 0 ? 
      signalQueueRef.current.splice(signalIndex, 1)[0] : 
      signalQueueRef.current.shift();
    
    try {
      if (signal.type === 'offer' && offerProcessedRef.current) {
        console.log("[WebRTC] Skipping duplicate offer");
        processingSignalRef.current = false;
        processSignalQueue();
        return;
      }
      
      if (signal.type === 'answer' && answerProcessedRef.current) {
        console.log("[WebRTC] Skipping duplicate answer");
        processingSignalRef.current = false;
        processSignalQueue();
        return;
      }
      
      console.log("[WebRTC] Processing signal:", signal.type || "ICE candidate");
      peerRef.current.signal(signal);
      connectionStatsRef.current.lastActivity = Date.now();
      
      // Mark offer/answer as processed
      if (signal.type === 'offer') offerProcessedRef.current = true;
      if (signal.type === 'answer') answerProcessedRef.current = true;
      
      setTimeout(() => {
        processingSignalRef.current = false;
        if (signalQueueRef.current.length > 0) {
          processSignalQueue();
        }
      }, 50);
    } catch (e) {
      console.error("[WebRTC] Error processing signal:", e);
      processingSignalRef.current = false;
      
      setTimeout(() => {
        if (peerRef.current) {
          processSignalQueue();
        }
      }, 1000);
    }
  }, [connectionStatsRef, peerRef]);

  const addSignalToQueue = useCallback((signal: any) => {
    if (!peerRef.current) {
      console.warn("[WebRTC] Received signal but peer is not initialized");
      return;
    }
    
    // For better debugging, log what type of signal we're receiving
    const signalType = signal.type || "ICE candidate";
    
    // Check for duplicate signals (same SDP content)
    if (signal.type && signal.sdp) {
      const isDuplicate = signalQueueRef.current.some(
        s => s.type === signal.type && s.sdp === signal.sdp
      );
      if (isDuplicate) {
        console.log(`[WebRTC] Ignoring duplicate ${signal.type} signal`);
        return;
      }
    }
    
    // Add to queue
    signalQueueRef.current.push(signal);
    console.log(`[WebRTC] Added signal to queue: ${signalType}. Queue length: ${signalQueueRef.current.length}`);
    
    // Priority handling for offers and answers
    if (signal.type === 'offer' || signal.type === 'answer') {
      console.log(`[WebRTC] Received ${signal.type}, processing immediately`);
      
      // Reset offer/answer processed state when receiving new ones
      if (signal.type === 'offer') offerProcessedRef.current = false;
      if (signal.type === 'answer') answerProcessedRef.current = false;
    }
    
    processSignalQueue();
    connectionStatsRef.current.lastActivity = Date.now();
  }, [connectionStatsRef, processSignalQueue, peerRef]);

  const resetSignalState = useCallback(() => {
    signalQueueRef.current = [];
    offerProcessedRef.current = false;
    answerProcessedRef.current = false;
    processingSignalRef.current = false;
    console.log("[WebRTC] Signal state reset");
  }, []);

  return {
    processSignalQueue,
    addSignalToQueue,
    resetSignalState,
    signalQueueRef
  };
}
