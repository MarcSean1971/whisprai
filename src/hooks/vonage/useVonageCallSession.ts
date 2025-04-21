
import { useRef, useCallback, useState } from "react";
import { VonageSessionData, VonageError } from "./types";
import { useVonageSession } from "./use-vonage-session";

interface VonageCallSessionProps {
  conversationId?: string;
  recipientId: string;
  initializePublisher: () => any;
  handleStreamCreated: (session: any, event: any) => void;
  destroyPublisher: () => void;
  destroySubscriber: () => void;
  setSession: (session: any) => void;
  maxReconnectAttempts?: number;
  setError: (error: VonageError | null) => void;
  setIsConnecting: (v: boolean) => void;
  setIsConnected: (v: boolean) => void;
}

export function useVonageCallSession({
  conversationId,
  recipientId,
  initializePublisher,
  handleStreamCreated,
  destroyPublisher,
  destroySubscriber,
  setSession,
  maxReconnectAttempts = 3,
  setError,
  setIsConnecting,
  setIsConnected,
}: VonageCallSessionProps) {
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { initializeSession, disconnect: disconnectSession } = useVonageSession({
    conversationId, recipientId
  });

  const connectSession = useCallback(async () => {
    if (!window.OT) {
      setError({ type: 'INITIALIZATION_ERROR', message: "Vonage SDK not loaded" });
      return;
    }
    if (connectionAttempts >= maxReconnectAttempts) {
      setError({
        type: 'INITIALIZATION_ERROR',
        message: `Failed to connect after ${maxReconnectAttempts} attempts`
      });
      setIsConnecting(false);
      return;
    }
    try {
      setIsConnecting(true);
      setError(null);

      const sessionData: VonageSessionData | null = await initializeSession();
      if (!sessionData) {
        setIsConnecting(false);
        setConnectionAttempts(c => c + 1);
        return;
      }

      const otSession = window.OT.initSession(sessionData.apiKey, sessionData.sessionId);
      setSession(otSession);

      otSession.on('streamCreated', (event: any) => handleStreamCreated(otSession, event));
      otSession.on('streamDestroyed', (event: any) => destroySubscriber());
      otSession.on('sessionDisconnected', () => {
        setIsConnected(false);
        destroySubscriber();
      });
      otSession.on('connectionCreated', () => {});
      otSession.on('connectionDestroyed', () => {});

      const pub = initializePublisher();
      if (!pub) {
        setIsConnecting(false);
        setConnectionAttempts(c => c + 1);
        throw new Error('Failed to initialize publisher');
      }

      otSession.connect(sessionData.token, (error: any) => {
        if (error) {
          setError({
            type: 'CONNECTION_ERROR',
            message: "Failed to connect to session: " + error.message,
            originalError: error
          });
          setIsConnecting(false);
          setConnectionAttempts(c => c + 1);
          return;
        }

        otSession.publish(pub, (pubError: any) => {
          if (pubError) {
            setError({
              type: 'PUBLISH_ERROR',
              message: "Failed to publish your stream: " + pubError.message,
              originalError: pubError
            });
            setIsConnecting(false);
            setConnectionAttempts(c => c + 1);
            return;
          }
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionAttempts(0);
        });
      });
    } catch (err: any) {
      setError({
        type: 'INITIALIZATION_ERROR',
        message: err.message || "Failed to set up call",
        originalError: err
      });
      setIsConnecting(false);
      setConnectionAttempts(c => c + 1);
    }
  }, [
    conversationId, recipientId, initializeSession, initializePublisher, handleStreamCreated, 
    destroySubscriber, setError, setIsConnecting, setIsConnected, setSession, maxReconnectAttempts, connectionAttempts
  ]);

  const disconnectAll = useCallback(() => {
    destroyPublisher();
    destroySubscriber();
    disconnectSession();
    setConnectionAttempts(0);
  }, [destroyPublisher, destroySubscriber, disconnectSession]);

  return {
    connectSession,
    disconnectAll,
    connectionAttempts,
  };
}
