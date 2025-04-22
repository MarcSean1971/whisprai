
import { useRef, useCallback } from 'react';
import { toast } from "sonner";

export function useSignalQueue(peerRef: React.MutableRefObject<any>, connectionStatsRef: React.MutableRefObject<any>) {
  const signalQueueRef = useRef<any[]>([]);
  const processingSignalRef = useRef(false);
  
  const processSignalQueue = useCallback(() => {
    if (processingSignalRef.current || signalQueueRef.current.length === 0 || !peerRef.current) {
      return;
    }
    
    processingSignalRef.current = true;
    const signal = signalQueueRef.current[0];
    
    try {
      console.log("[WebRTC] Processing signal:", signal.type || "ICE candidate");
      peerRef.current.signal(signal);
      signalQueueRef.current.shift();
      connectionStatsRef.current.lastActivity = Date.now();
      
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
    
    signalQueueRef.current.push(signal);
    console.log("[WebRTC] Added signal to queue:", signal.type || "ICE candidate", 
                "Queue length:", signalQueueRef.current.length);
    
    processSignalQueue();
    
    connectionStatsRef.current.lastActivity = Date.now();
  }, [connectionStatsRef, processSignalQueue, peerRef]);

  return {
    processSignalQueue,
    addSignalToQueue,
    signalQueueRef
  };
}
