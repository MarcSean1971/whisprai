
import { useEffect, useCallback, useRef, useState } from "react";
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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 3;
  
  const {
    session,
    isConnecting,
    isConnected,
    error,
    setError,
    setIsConnecting,
    setIsConnected,
    setSession,
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
      console.log('[Vonage Call] Loading Vonage script');
      loadVonageScript()
        .then(() => {
          console.log('[Vonage Call] Vonage script loaded successfully');
          scriptLoaded.current = true;
        })
        .catch((err) => {
          console.error('[Vonage Call] Failed to load Vonage SDK:', err);
          const vonageError: VonageError = {
            type: 'INITIALIZATION_ERROR',
            message: "Failed to load Vonage SDK: " + err.message,
            originalError: err
          };
          setError(vonageError);
        });
    }
    
    return () => {
      console.log('[Vonage Call] Cleaning up on unmount');
      disconnect();
    };
  }, []);

  const disconnect = useCallback(() => {
    console.log('[Vonage Call] Disconnecting call');
    destroyPublisher();
    destroySubscriber();
    disconnectSession();
    setConnectionAttempts(0);
  }, [destroyPublisher, destroySubscriber, disconnectSession]);

  const connect = useCallback(async () => {
    if (!window.OT) {
      console.error('[Vonage Call] Vonage SDK not loaded');
      setError({
        type: 'INITIALIZATION_ERROR',
        message: "Vonage SDK not loaded"
      });
      return;
    }

    if (isConnected) {
      console.log('[Vonage Call] Already connected');
      return;
    }

    try {
      console.log('[Vonage Call] Connecting to call...');
      setIsConnecting(true);
      setError(null);
      
      // Increment connection attempts
      setConnectionAttempts(prev => prev + 1);
      
      if (connectionAttempts >= maxReconnectAttempts) {
        throw new Error(`Failed to connect after ${maxReconnectAttempts} attempts`);
      }

      const sessionData = await initializeSession();
      if (!sessionData) {
        console.error('[Vonage Call] No session data returned');
        setIsConnecting(false);
        return;
      }

      console.log('[Vonage Call] Creating OT session with:', {
        apiKey: sessionData.apiKey,
        sessionId: sessionData.sessionId
      });
      
      const otSession = window.OT.initSession(sessionData.apiKey, sessionData.sessionId);
      setSession(otSession);

      // Set up event handlers first
      otSession.on('streamCreated', (event: any) => {
        console.log('[Vonage Call] Remote stream created:', event);
        handleStreamCreated(otSession, event);
      });

      otSession.on('streamDestroyed', (event: any) => {
        console.log('[Vonage Call] Remote stream destroyed:', event);
        destroySubscriber();
      });

      otSession.on('sessionDisconnected', (event: any) => {
        console.log('[Vonage Call] Session disconnected:', event);
        setIsConnected(false);
        destroySubscriber();
      });

      otSession.on('connectionCreated', (event: any) => {
        console.log('[Vonage Call] New connection created:', event);
      });

      otSession.on('connectionDestroyed', (event: any) => {
        console.log('[Vonage Call] Connection destroyed:', event);
      });

      // Initialize the publisher (camera/mic)
      console.log('[Vonage Call] Initializing publisher');
      const pub = initializePublisher();
      if (!pub) {
        throw new Error('Failed to initialize publisher');
      }

      // Connect to the session
      console.log('[Vonage Call] Connecting to session with token');
      otSession.connect(sessionData.token, (error: any) => {
        if (error) {
          console.error('[Vonage Call] Error connecting to session:', error);
          setError({
            type: 'CONNECTION_ERROR',
            message: "Failed to connect to session: " + error.message,
            originalError: error
          });
          setIsConnecting(false);
          return;
        }

        console.log('[Vonage Call] Connected to session, publishing stream');
        // Now publish our stream
        otSession.publish(pub, (pubError: any) => {
          if (pubError) {
            console.error('[Vonage Call] Error publishing stream:', pubError);
            setError({
              type: 'PUBLISH_ERROR',
              message: "Failed to publish your stream: " + pubError.message,
              originalError: pubError
            });
            setIsConnecting(false);
            return;
          }

          console.log('[Vonage Call] Stream published successfully');
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionAttempts(0); // Reset counter on success
        });
      });

    } catch (err: any) {
      console.error("[Vonage Call] Error setting up call:", err);
      setError({
        type: 'INITIALIZATION_ERROR',
        message: err.message || "Failed to set up call",
        originalError: err
      });
      setIsConnecting(false);
    }
  }, [
    initializeSession, 
    initializePublisher, 
    handleStreamCreated, 
    setSession,
    isConnected,
    connectionAttempts,
    setError, 
    setIsConnecting, 
    setIsConnected, 
    destroySubscriber
  ]);

  // Add functionality to handle mic and video state
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);

  const handleToggleAudio = useCallback(() => {
    const newState = toggleAudio();
    setIsMicActive(newState);
    return newState;
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    const newState = toggleVideo();
    setIsVideoActive(newState);
    return newState;
  }, [toggleVideo]);

  return {
    isConnecting,
    isConnected,
    hasRemoteParticipant,
    error,
    connect,
    disconnect,
    toggleAudio: handleToggleAudio,
    toggleVideo: handleToggleVideo,
    isMicActive,
    isVideoActive
  };
}
