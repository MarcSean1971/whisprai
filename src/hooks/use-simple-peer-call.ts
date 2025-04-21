
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '@/integrations/supabase/client';

interface UseSimplePeerCallOptions {
  callId: string; 
  isInitiator: boolean;
  onStreamReceived?: (stream: MediaStream) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSimplePeerCall({
  callId,
  isInitiator,
  onStreamReceived,
  onConnect,
  onDisconnect,
  onError
}: UseSimplePeerCallOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const channelRef = useRef<any>(null);
  
  // Initialize media and peer connection
  const initialize = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get user media (audio only by default)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isVideoActive 
      });
      
      setLocalStream(mediaStream);
      
      // Create peer connection
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: mediaStream,
        trickle: true
      });
      
      peer.on('signal', (data) => {
        // Send signaling data via Supabase Realtime
        const signalData = JSON.stringify(data);
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { callId, data: signalData }
          });
        }
        
        // Also save to database as fallback
        supabase
          .from('active_calls')
          .update({
            signaling_data: { [isInitiator ? 'offer' : 'answer']: signalData }
          })
          .eq('id', callId)
          .then(({ error }) => {
            if (error) console.error("[SimplePeer] Error saving signal data:", error);
          });
      });
      
      peer.on('connect', () => {
        console.log("[SimplePeer] Connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        if (onConnect) onConnect();
      });
      
      peer.on('stream', (stream) => {
        console.log("[SimplePeer] Remote stream received");
        setRemoteStream(stream);
        if (onStreamReceived) onStreamReceived(stream);
      });
      
      peer.on('error', (err) => {
        console.error("[SimplePeer] Connection error:", err);
        setError(err);
        setIsConnecting(false);
        setIsConnected(false);
        if (onError) onError(err);
      });
      
      peer.on('close', () => {
        console.log("[SimplePeer] Connection closed");
        setIsConnected(false);
        setIsConnecting(false);
        if (onDisconnect) onDisconnect();
      });
      
      peerRef.current = peer;
      
    } catch (err) {
      console.error("[SimplePeer] Error initializing media devices:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnecting(false);
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    }
  };
  
  // Setup signaling channel
  useEffect(() => {
    if (!callId) return;
    
    const channel = supabase.channel(`call-${callId}`);
    
    channel
      .on('broadcast', { event: 'signal' }, (payload) => {
        if (payload.payload?.callId === callId && peerRef.current) {
          try {
            const signalData = JSON.parse(payload.payload.data);
            console.log("[SimplePeer] Received signal data", signalData);
            peerRef.current.signal(signalData);
          } catch (err) {
            console.error("[SimplePeer] Error processing signal data:", err);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("[SimplePeer] Subscribed to signaling channel");
          channelRef.current = channel;
        } else {
          console.log("[SimplePeer] Signaling channel status:", status);
        }
      });
    
    // Check for existing signaling data in the database
    const checkExistingSignalingData = async () => {
      const { data } = await supabase
        .from('active_calls')
        .select('signaling_data')
        .eq('id', callId)
        .single();
      
      if (data?.signaling_data) {
        const key = isInitiator ? 'answer' : 'offer';
        const signalData = data.signaling_data[key];
        
        if (signalData && peerRef.current) {
          try {
            console.log(`[SimplePeer] Found existing ${key} in database`);
            peerRef.current.signal(JSON.parse(signalData));
          } catch (err) {
            console.error("[SimplePeer] Error processing existing signal data:", err);
          }
        }
      }
    };
    
    if (!isInitiator) {
      checkExistingSignalingData();
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, isInitiator]);
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicActive(audioTracks[0]?.enabled ?? false);
    }
  };
  
  // Toggle video
  const toggleVideo = async () => {
    // If we're turning video on and don't have it yet
    if (!isVideoActive && localStream) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (videoTrack && peerRef.current) {
          localStream.addTrack(videoTrack);
          peerRef.current.addTrack(videoTrack, localStream);
          setIsVideoActive(true);
        }
      } catch (err) {
        console.error("[SimplePeer] Error adding video:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } 
    // If we're turning video off
    else if (isVideoActive && localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        localStream.removeTrack(track);
        track.stop();
        if (peerRef.current) {
          peerRef.current.removeTrack(track, localStream);
        }
      });
      setIsVideoActive(false);
    }
  };
  
  // Disconnect and clean up
  const disconnect = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  };
  
  return {
    initialize,
    disconnect,
    toggleAudio,
    toggleVideo,
    isConnected,
    isConnecting,
    isMicActive,
    isVideoActive,
    localStream,
    remoteStream,
    error
  };
}
