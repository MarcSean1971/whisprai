
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '@/integrations/supabase/client';
import { ActiveCall } from './use-active-calls';

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
  
  const initialize = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: isVideoActive 
      });
      
      setLocalStream(mediaStream);
      
      const peer = new SimplePeer({
        initiator: isInitiator,
        stream: mediaStream,
        trickle: true
      });
      
      peer.on('signal', (data) => {
        const signalData = JSON.stringify(data);
        
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { callId, data: signalData }
          });
        }
        
        // The original code tried to update signaling_data in the active_calls table
        // Since that column no longer exists, we'll use only real-time channels for signaling
        console.log('[SimplePeer] Signal data generated - using realtime channel for signaling');
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
    
    // The original checkExistingSignalingData function pulled signaling data from the database
    // Since that column no longer exists, we're removing this functionality and
    // relying solely on the real-time channel for signaling
    console.log("[SimplePeer] Using only real-time signaling");
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, isInitiator]);
  
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicActive(audioTracks[0]?.enabled ?? false);
    }
  };
  
  const toggleVideo = async () => {
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
    else if (isVideoActive && localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        localStream.removeTrack(track);
        track.stop();
      });
      setIsVideoActive(false);
    }
  };
  
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
