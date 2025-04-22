
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
        setConnectionDetails(getConnectionState());
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
