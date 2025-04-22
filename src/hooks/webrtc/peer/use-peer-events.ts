
import { useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";
import { ConnectionStatus } from "../types";

interface UsePeerEventsProps {
  onSignal: (data: any) => void;
  onConnect: () => void;
  onStream: (stream: MediaStream) => void;
  onClose: () => void;
  onError: (error: Error) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  connectionStatsRef: React.MutableRefObject<any>;
  setIceCandidate: (cb: (prev: number) => number) => void;
  clearConnectionTimeout: () => void;
}

export function usePeerEvents({
  onSignal,
  onConnect,
  onStream,
  onClose,
  onError,
  setConnectionStatus,
  connectionStatsRef,
  setIceCandidate,
  clearConnectionTimeout,
}: UsePeerEventsProps) {
  const setupPeerEvents = useCallback((peer: Peer.Instance) => {
    // Track if we've already called onConnect to prevent duplicate calls
    let connectionEstablished = false;
    
    peer.on("signal", data => {
      try {
        console.log("[WebRTC] Generated signal:", data.type || "ICE candidate");
        
        // Buffer ICE candidates to avoid overwhelming the signaling channel
        if (data.type === 'candidate') {
          connectionStatsRef.current.iceCandidates++;
          connectionStatsRef.current.lastActivity = Date.now();
          setIceCandidate(prev => prev + 1);
          
          // Throttle ICE candidate signaling to avoid overwhelming
          setTimeout(() => {
            onSignal(data);
          }, 50);
        } else {
          // Send offer/answer immediately
          onSignal(data);
        }
      } catch (err) {
        console.error("[WebRTC] Error in signal event handler:", err);
      }
    });

    peer.on("connect", () => {
      try {
        if (connectionEstablished) {
          console.log("[WebRTC] Ignoring duplicate connect event");
          return;
        }
        
        connectionEstablished = true;
        console.log("[WebRTC] Peer connection established successfully!");
        setConnectionStatus("connected");
        onConnect();
        clearConnectionTimeout();
        toast.success("Call connected");
      } catch (err) {
        console.error("[WebRTC] Error in connect event handler:", err);
      }
    });

    peer.on("stream", remote => {
      try {
        console.log("[WebRTC] Received remote stream");
        if (remote && remote.getTracks().length > 0) {
          onStream(remote);
        } else {
          console.warn("[WebRTC] Received empty remote stream");
        }
      } catch (err) {
        console.error("[WebRTC] Error in stream event handler:", err);
      }
    });

    peer.on("error", err => {
      try {
        console.error("[WebRTC] Peer connection error:", err);
        
        // Check if the error is fatal
        const errorMessage = err.message.toLowerCase();
        const isFatal = errorMessage.includes("failed") || 
                       errorMessage.includes("closed") ||
                       errorMessage.includes("cannot read property");
        
        if (isFatal) {
          toast.error(`Connection error: ${err.message}`);
          setConnectionStatus("error");
          onError(err);
        } else {
          // Non-fatal errors may be recoverable
          console.warn("[WebRTC] Non-fatal error, continuing");
        }
      } catch (innerErr) {
        console.error("[WebRTC] Error in error event handler:", innerErr);
        setConnectionStatus("error");
      }
    });

    peer.on("close", () => {
      try {
        console.log("[WebRTC] Peer connection closed");
        setConnectionStatus("ended");
        onClose();
      } catch (err) {
        console.error("[WebRTC] Error in close event handler:", err);
      }
    });
    
    // Track negotiation needed events
    try {
      const rtcPeerConnection = (peer as any)._pc;
      if (rtcPeerConnection) {
        rtcPeerConnection.onnegotiationneeded = () => {
          console.log("[WebRTC] Negotiation needed event");
          connectionStatsRef.current.lastActivity = Date.now();
        };
      }
    } catch (err) {
      console.error("[WebRTC] Error setting up negotiation handler:", err);
    }
  }, [
    onSignal, 
    onConnect, 
    onStream, 
    onClose, 
    onError, 
    setConnectionStatus, 
    connectionStatsRef, 
    setIceCandidate, 
    clearConnectionTimeout
  ]);

  return { setupPeerEvents };
}
