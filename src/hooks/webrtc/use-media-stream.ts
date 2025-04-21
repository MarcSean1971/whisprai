
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function useMediaStream() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    let stopped = false;
    
    async function getMedia() {
      try {
        const constraints = {
          audio: true,
          video: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!stopped) {
          console.log("[WebRTC] Got local media stream");
          setLocalStream(stream);
          originalStreamRef.current = stream;
        }
      } catch (e: any) {
        if (!stopped) {
          console.error("[WebRTC] Media error:", e);
          
          if (e.name === "NotAllowedError") {
            toast.error("Camera and microphone access denied. Please check your permissions.");
          } else if (e.name === "NotFoundError") {
            toast.error("No camera or microphone found. Trying audio only...");
            try {
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setLocalStream(audioOnlyStream);
              originalStreamRef.current = audioOnlyStream;
            } catch (audioErr) {
              toast.error("Could not access microphone. Call cannot proceed.");
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
  }, []);

  return { localStream, originalStreamRef, setLocalStream };
}
