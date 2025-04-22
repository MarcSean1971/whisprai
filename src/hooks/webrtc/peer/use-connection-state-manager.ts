
import { useState, useCallback, useEffect } from 'react';
import { ConnectionStatus } from '../types';

interface UseConnectionStateManagerProps {
  peerRef: React.MutableRefObject<any>;
  connectionStatsRef: React.MutableRefObject<any>;
}

export function useConnectionStateManager({ peerRef, connectionStatsRef }: UseConnectionStateManagerProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  const getConnectionState = useCallback(() => {
    return connectionStatsRef.current;
  }, [connectionStatsRef]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (peerRef.current) {
        const currentState = getConnectionState();
        setConnectionDetails(currentState);
        
        // Update connection status based on peer state
        if (currentState?.iceConnectionState === 'connected') {
          setIsConnecting(false);
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
    getConnectionState
  };
}
