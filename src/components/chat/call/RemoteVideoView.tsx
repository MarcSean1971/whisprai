
import React, { useEffect, useRef } from "react";

interface RemoteVideoViewProps {
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  callStatus: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  children?: React.ReactNode; // for overlays (like CallTimer or LocalVideoView)
}

export function RemoteVideoView({
  remoteStream,
  isConnecting,
  callStatus,
  videoRef,
  children
}: RemoteVideoViewProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || internalVideoRef;

  useEffect(() => {
    if (ref.current && remoteStream) {
      ref.current.srcObject = remoteStream;
    }
  }, [remoteStream, ref]);

  return (
    <div className="relative flex-1 w-full h-full bg-white">
      {isConnecting && (
        // Light theme spinner overlay, centered!
        <div className="absolute inset-0 flex items-center justify-center bg-[#f1f0fb]/85 z-10 transition-all animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="animate-pulse text-[#7C4DFF] text-xl font-medium mb-2">
              {callStatus === 'connecting' ? 'Connecting...' : 'Ringing...'}
            </div>
            <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-[#d6bcfa] rounded-full"></div>
          </div>
        </div>
      )}
      <video
        className="w-full h-full object-cover bg-white"
        autoPlay
        playsInline
        ref={ref}
      />
      {children}
    </div>
  );
}
