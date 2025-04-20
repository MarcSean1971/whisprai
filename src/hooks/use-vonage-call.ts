import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadVonageScript } from "@/lib/vonage-loader";

interface UseVonageCallProps {
  publisherElement: string;
  subscriberElement: string;
  recipientId: string;
  conversationId?: string;
}

export function useVonageCall({
  publisherElement,
  subscriberElement,
  recipientId,
  conversationId = 'default'
}: UseVonageCallProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const publisherRef = useRef<any>(null);
  const subscriberRef = useRef<any>(null);
  
  const scriptLoaded = useRef(false);
  
  useEffect(() => {
    if (!scriptLoaded.current) {
      loadVonageScript()
        .then(() => {
          scriptLoaded.current = true;
        })
        .catch((err) => {
          setError("Failed to load Vonage SDK: " + err.message);
        });
    }
    
    return () => {
      disconnect();
    };
  }, []);
  
  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        if (publisherRef.current) {
          sessionRef.current.unpublish(publisherRef.current);
          publisherRef.current.destroy();
          publisherRef.current = null;
        }
        
        if (subscriberRef.current) {
          sessionRef.current.unsubscribe(subscriberRef.current);
          subscriberRef.current = null;
        }
        
        sessionRef.current.disconnect();
        sessionRef.current = null;
      } catch (err) {
        console.error("Error disconnecting from session:", err);
      }
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setHasRemoteParticipant(false);
  }, []);
  
  const connect = useCallback(async () => {
    if (!conversationId || !recipientId || !window.OT) {
      setError("Missing required parameters or Vonage SDK not loaded");
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      const { data, error: sessionError } = await supabase.functions.invoke('vonage-session', {
        body: { 
          conversationId, 
          recipientId 
        }
      });
      
      if (sessionError || !data) {
        throw new Error(sessionError?.message || "Failed to create session");
      }
      
      const { sessionId, token, apiKey } = data;
      
      if (!sessionId || !token || !apiKey) {
        throw new Error("Invalid session data received");
      }
      
      sessionRef.current = window.OT.initSession(apiKey, sessionId);
      
      sessionRef.current.on('streamCreated', (event: any) => {
        const subscribeOptions = {
          insertMode: 'append',
          width: '100%',
          height: '100%',
          appendTo: subscriberElement,
          subscribeToAudio: true,
          subscribeToVideo: true
        };
        
        subscriberRef.current = sessionRef.current.subscribe(
          event.stream,
          subscribeOptions
        );
        
        subscriberRef.current.on('connected', () => {
          setHasRemoteParticipant(true);
        });
        
        subscriberRef.current.on('destroyed', () => {
          console.log('Subscriber destroyed');
        });
        
        subscriberRef.current.on('error', (error: any) => {
          console.error('Error subscribing to stream:', error);
        });
      });
      
      sessionRef.current.on('streamDestroyed', (event: any) => {
        setHasRemoteParticipant(false);
        if (subscriberRef.current) {
          subscriberRef.current = null;
        }
      });
      
      const publisherOptions = {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        publishAudio: true,
        publishVideo: false,
      };
      
      publisherRef.current = window.OT.initPublisher(
        publisherElement,
        publisherOptions
      );
      
      publisherRef.current.on('error', (error: any) => {
        console.error('Error initializing publisher:', error);
        setError("Could not access camera/microphone");
      });
      
      sessionRef.current.connect(token, (error: any) => {
        if (error) {
          console.error('Error connecting to session:', error);
          setError("Failed to connect to session");
          setIsConnecting(false);
          return;
        }
        
        sessionRef.current.publish(publisherRef.current, (pubError: any) => {
          if (pubError) {
            console.error('Error publishing stream:', pubError);
            setError("Failed to publish your stream");
            setIsConnecting(false);
            return;
          }
          
          setIsConnected(true);
          setIsConnecting(false);
        });
      });
      
    } catch (err: any) {
      console.error("Error setting up call:", err);
      setError(err.message || "Failed to set up call");
      setIsConnecting(false);
    }
  }, [conversationId, recipientId, publisherElement, subscriberElement]);
  
  const toggleVideo = useCallback(() => {
    if (publisherRef.current) {
      const hasVideo = publisherRef.current.getSettings().videoSource !== null;
      publisherRef.current.publishVideo(!hasVideo);
    }
  }, []);
  
  const toggleAudio = useCallback(() => {
    if (publisherRef.current) {
      const hasAudio = publisherRef.current.getSettings().audioSource !== null;
      publisherRef.current.publishAudio(!hasAudio);
    }
  }, []);
  
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
