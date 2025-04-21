
import React, { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";

interface LocalVideoViewProps {
  localStream: MediaStream | null;
  isVideoMuted: boolean;
}

export function LocalVideoView({ localStream, isVideoMuted }: LocalVideoViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="absolute bottom-4 right-4 w-1/4 max-w-[150px] aspect-video rounded-lg overflow-hidden shadow-lg">
      <video
        className={`w-full h-full object-cover bg-zinc-800 ${isVideoMuted ? 'hidden' : ''}`}
        autoPlay
        playsInline
        muted
        ref={localVideoRef}
      />
      {isVideoMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <VideoOff className="text-white/50" />
        </div>
      )}
    </div>
  );
}
