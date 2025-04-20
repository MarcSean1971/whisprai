
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseVonageSessionProps {
  conversationId?: string;
  recipientId: string;
}

export function useVonageSession({ conversationId = 'default', recipientId }: UseVonageSessionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);

  const initializeSession = useCallback(async () => {
    if (!conversationId || !recipientId) {
      setError("Missing required parameters");
      return null;
    }

    try {
      const { data, error: sessionError } = await supabase.functions.invoke('vonage-session', {
        body: { conversationId, recipientId }
      });

      if (sessionError || !data) {
        throw new Error(sessionError?.message || "Failed to create session");
      }

      const { sessionId, token, apiKey } = data;

      if (!sessionId || !token || !apiKey) {
        throw new Error("Invalid session data received");
      }

      sessionRef.current = window.OT.initSession(apiKey, sessionId);
      return { sessionId, token, apiKey };
    } catch (err: any) {
      setError(err.message || "Failed to initialize session");
      return null;
    }
  }, [conversationId, recipientId]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.disconnect();
        sessionRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);
      } catch (err) {
        console.error("Error disconnecting from session:", err);
      }
    }
  }, []);

  return {
    session: sessionRef.current,
    isConnecting,
    isConnected,
    error,
    setIsConnecting,
    setIsConnected,
    setError,
    initializeSession,
    disconnect
  };
}
