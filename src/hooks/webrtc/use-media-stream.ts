
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

type CallType = "audio" | "video";

export function useMediaStream(callType: CallType = "video") {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    let stopped = false;
    
    async function getMedia() {
      try {
        // Set constraints based on call type
        const constraints = {
          audio: true,
          video: callType === "video"
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!stopped) {
          console.log(`[WebRTC] Got local media stream (${callType} call)`);
          setLocalStream(stream);
          originalStreamRef.current = stream;
        }
      } catch (e: any) {
        if (!stopped) {
          console.error("[WebRTC] Media error:", e);
          
          if (e.name === "NotAllowedError") {
            const permissionMessage = callType === "video" 
              ? "Camera and microphone access denied. Please check your permissions."
              : "Microphone access denied. Please check your permissions.";
            toast.error(permissionMessage);
          } else if (e.name === "NotFoundError") {
            if (callType === "video") {
              toast.error("No camera or microphone found. Trying audio only...");
              try {
                const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(audioOnlyStream);
                originalStreamRef.current = audioOnlyStream;
              } catch (audioErr) {
                toast.error("Could not access microphone. Call cannot proceed.");
              }
            } else {
              toast.error("No microphone found. Call cannot proceed.");
            }
          } else {
            toast.error(`Media error: ${e.message}`);
          }
        }
      }
    }
    
    getMedia();
    
    return () => {
      stopped = true;
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [callType]);

  return { localStream, originalStreamRef, setLocalStream };
}
