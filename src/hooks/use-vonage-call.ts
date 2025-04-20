import { useEffect, useCallback, useRef } from "react";
import { loadVonageScript } from "@/lib/vonage-loader";
import { useVonageSession } from "./vonage/use-vonage-session";
import { useVonagePublisher } from "./vonage/use-vonage-publisher";
import { useVonageSubscriber } from "./vonage/use-vonage-subscriber";
import { VonageCallOptions, VonageError } from "./vonage/types";

export function useVonageCall({
  publisherRef,
  subscriberRef,
  recipientId,
  conversationId = 'default'
}: VonageCallOptions) {
  const scriptLoaded = useRef(false);
  
  const {
    session,
    isConnecting,
    isConnected,
    error,
    setError,
    setIsConnecting,
    setIsConnected,
    initializeSession,
    disconnect: disconnectSession
  } = useVonageSession({ conversationId, recipientId });

  const {
    publisher,
    initializePublisher,
    destroyPublisher,
    toggleAudio,
    toggleVideo
  } = useVonagePublisher({ 
    publisherRef,
    onError: setError
  });

  const {
    hasRemoteParticipant,
    handleStreamCreated,
    destroySubscriber
  } = useVonageSubscriber({ subscriberRef });

  useEffect(() => {
    if (!scriptLoaded.current) {
      loadVonageScript()
        .then(() => {
          scriptLoaded.current = true;
        })
        .catch((err) => {
          const vonageError: VonageError = {
            type: 'INITIALIZATION_ERROR',
            message: "Failed to load Vonage SDK: " + err.message,
            originalError: err
          };
          setError(vonageError);
        });
    }
    
    return () => {
      disconnect();
    };
  }, []);

  const disconnect = useCallback(() => {
    destroyPublisher();
    destroySubscriber();
    disconnectSession();
  }, [destroyPublisher, destroySubscriber, disconnectSession]);

  const connect = useCallback(async () => {
    if (!window.OT) {
      setError({
        type: 'INITIALIZATION_ERROR',
        message: "Vonage SDK not loaded"
      });
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const sessionData = await initializeSession();
      if (!sessionData) return;

      const session = window.OT.initSession(sessionData.apiKey, sessionData.sessionId);

      session.on('streamCreated', (event: any) => {
        handleStreamCreated(session, event);
      });

      session.on('streamDestroyed', () => {
        destroySubscriber();
      });

      const publisher = initializePublisher();

      session.connect(sessionData.token, (error: any) => {
        if (error) {
          console.error('Error connecting to session:', error);
          setError({
            type: 'CONNECTION_ERROR',
            message: "Failed to connect to session",
            originalError: error
          });
          setIsConnecting(false);
          return;
        }

        session.publish(publisher, (pubError: any) => {
          if (pubError) {
            console.error('Error publishing stream:', pubError);
            setError({
              type: 'PUBLISH_ERROR',
              message: "Failed to publish your stream",
              originalError: pubError
            });
            setIsConnecting(false);
            return;
          }

          setIsConnected(true);
          setIsConnecting(false);
        });
      });

    } catch (err: any) {
      console.error("Error setting up call:", err);
      setError({
        type: 'INITIALIZATION_ERROR',
        message: err.message || "Failed to set up call",
        originalError: err
      });
      setIsConnecting(false);
    }
  }, [initializeSession, initializePublisher, handleStreamCreated]);

  return {
    isConnecting,
    isConnected,
    hasRemoteParticipant,
    error,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio
  };
}
