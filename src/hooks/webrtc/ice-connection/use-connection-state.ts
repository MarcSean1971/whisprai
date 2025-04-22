
import { useState, useRef } from 'react';
import { IceConnectionStats } from './types';

export function useConnectionState() {
  const [isIceGathering, setIsIceGathering] = useState(false);
  const [iceCandidate, setIceCandidate] = useState(0);
  const connectionStatsRef = useRef<IceConnectionStats>({
    connectionState: null,
    iceConnectionState: null,
    iceGatheringState: null,
    signalingState: null,
    iceCandidates: 0,
    lastActivity: Date.now()
  });
  const connectionTimeoutRef = useRef<number | null>(null);

  const clearConnectionTimeout = () => {
    if (connectionTimeoutRef.current) {
      window.clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  };

  const startConnectionTimeout = (callback: () => void, timeout: number) => {
    clearConnectionTimeout();
    connectionTimeoutRef.current = window.setTimeout(callback, timeout);
  };

  return {
    isIceGathering,
    setIsIceGathering,
    iceCandidate,
    setIceCandidate,
    connectionStatsRef,
    connectionTimeoutRef,
    clearConnectionTimeout,
    startConnectionTimeout
  };
}
