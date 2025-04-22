
import { useState, useCallback, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { useConnectionQuality } from '../ice-connection/use-connection-quality';

interface UseConnectionStateManagerProps {
  peerRef: React.MutableRefObject<any>;
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useConnectionStateManager({ peerRef, connectionStatsRef }: UseConnectionStateManagerProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  
  const connectionQuality = useConnectionQuality(peerRef);

  const getConnectionState = useCallback(() => {
    return {
      ...connectionStatsRef.current,
      quality: connectionQuality
    };
  }, [connectionStatsRef, connectionQuality]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (peerRef.current) {
        const currentState = getConnectionState();
        setConnectionDetails(currentState);
        
        // Update connection status based on peer state
        if (currentState?.iceConnectionState === 'connected') {
          setIsConnecting(false);
        } else if (currentState?.iceConnectionState === 'failed') {
          console.error('[WebRTC] ICE connection failed:', currentState);
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [getConnectionState, peerRef]);

  return {
    isConnecting,
    setIsConnecting,
    connectionStatus,
    setConnectionStatus,
    connectionDetails,
    getConnectionState,
    connectionQuality
  };
}
