
import { useCallback, useState } from "react";
import { VonageSessionData, VonageError } from "./types";
import { useVonageSession } from "./use-vonage-session";
import { supabase } from "@/integrations/supabase/client";

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
  const { 
    initializeSession, 
    disconnect: disconnectSession,
    clearSessionCache 
  } = useVonageSession({
    conversationId, 
    recipientId
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
      
      // Find the active call if it exists
      const { data: user } = await supabase.auth.getUser();
      
      if (!user?.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const { data: activeCall } = await supabase
        .from('active_calls')
        .select('*')
        .or(`caller_id.eq.${user.user.id},recipient_id.eq.${user.user.id}`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log("[VonageCallSession] Found active call:", activeCall);

      // Get session data from the server, passing callId if we have it
      const sessionData: VonageSessionData | null = await initializeSession(
        activeCall?.id || undefined
      );
      
      if (!sessionData) {
        console.error("[VonageCallSession] Failed to get session data");
        setIsConnecting(false);
        setConnectionAttempts(c => c + 1);
        // Clear session cache to force a fresh attempt next time
        clearSessionCache();
        return;
      }

      console.log("[VonageCallSession] Initializing OT session with:", {
        apiKey: sessionData.apiKey,
        sessionId: sessionData.sessionId
      });

      const otSession = window.OT.initSession(sessionData.apiKey, sessionData.sessionId);
      setSession(otSession);

      otSession.on('streamCreated', (event: any) => handleStreamCreated(otSession, event));
      otSession.on('streamDestroyed', (event: any) => destroySubscriber());
      otSession.on('sessionDisconnected', (event: any) => {
        console.log("[VonageCallSession] Session disconnected:", event);
        setIsConnected(false);
        destroySubscriber();
      });
      otSession.on('connectionCreated', (event: any) => {
        console.log("[VonageCallSession] Connection created:", event);
      });
      otSession.on('connectionDestroyed', (event: any) => {
        console.log("[VonageCallSession] Connection destroyed:", event);
      });

      console.log("[VonageCallSession] Initializing publisher");
      const pub = initializePublisher();
      if (!pub) {
        console.error("[VonageCallSession] Failed to initialize publisher");
        setIsConnecting(false);
        setConnectionAttempts(c => c + 1);
        clearSessionCache();
        throw new Error('Failed to initialize publisher');
      }

      console.log("[VonageCallSession] Connecting to session with token");
      otSession.connect(sessionData.token, (error: any) => {
        if (error) {
          console.error("[VonageCallSession] Connection error:", error);
          setError({
            type: 'CONNECTION_ERROR',
            message: "Failed to connect to session: " + error.message,
            originalError: error
          });
          setIsConnecting(false);
          setConnectionAttempts(c => c + 1);
          clearSessionCache();
          return;
        }

        console.log("[VonageCallSession] Connected to session, publishing stream");
        otSession.publish(pub, (pubError: any) => {
          if (pubError) {
            console.error("[VonageCallSession] Publish error:", pubError);
            setError({
              type: 'PUBLISH_ERROR',
              message: "Failed to publish your stream: " + pubError.message,
              originalError: pubError
            });
            setIsConnecting(false);
            setConnectionAttempts(c => c + 1);
            clearSessionCache();
            return;
          }
          console.log("[VonageCallSession] Successfully published stream");
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionAttempts(0);
        });
      });
    } catch (err: any) {
      console.error("[VonageCallSession] Connection error:", err);
      setError({
        type: 'INITIALIZATION_ERROR',
        message: err.message || "Failed to set up call",
        originalError: err
      });
      setIsConnecting(false);
      setConnectionAttempts(c => c + 1);
      clearSessionCache();
    }
  }, [
    conversationId, recipientId, initializeSession, initializePublisher, handleStreamCreated, 
    destroySubscriber, setError, setIsConnecting, setIsConnected, setSession, maxReconnectAttempts, 
    connectionAttempts, clearSessionCache, destroyPublisher
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
