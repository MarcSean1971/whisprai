
import React, { useEffect, useRef } from "react";

interface RemoteVideoViewProps {
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  callStatus: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  connectionDetails?: any;
  children?: React.ReactNode; // for overlays (like CallTimer or LocalVideoView)
}

export function RemoteVideoView({
  remoteStream,
  isConnecting,
  callStatus,
  videoRef,
  connectionDetails,
  children
}: RemoteVideoViewProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || internalVideoRef;

  useEffect(() => {
    if (ref.current && remoteStream) {
      ref.current.srcObject = remoteStream;
    }
  }, [remoteStream, ref]);

  // Get a more detailed connection status message
  const getConnectionMessage = () => {
    if (callStatus === "connecting" && connectionDetails) {
      if (connectionDetails.iceGatheringState === "gathering") {
        return `Finding connection paths (${connectionDetails.iceCandidates} found)...`;
      } else if (connectionDetails.iceGatheringState === "complete" && 
                connectionDetails.iceConnectionState === "checking") {
        return "Testing connection...";
      } else if (connectionDetails.iceConnectionState === "failed") {
        return "Connection failed. Networks may be incompatible.";
      } else if (connectionDetails.iceConnectionState === "disconnected") {
        return "Connection was lost. Reconnecting...";
      }
      return "Connecting...";
    }
    return callStatus === "incoming" ? "Incoming call..." : 
           callStatus === "calling" ? "Calling..." : "Ringing...";
  };

  return (
    <div className="relative flex-1 w-full h-full bg-white">
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f1f0fb]/85 z-10 transition-all animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="animate-pulse text-[#7C4DFF] text-xl font-medium mb-2">
              {getConnectionMessage()}
            </div>
            <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-[#d6bcfa] rounded-full"></div>
            
            {/* Connection details for debugging */}
            {connectionDetails && (
              <div className="mt-4 text-xs text-[#4b3a6b] max-w-[280px] text-center">
                {connectionDetails.iceConnectionState === "checking" && 
                  "Testing direct connection routes between devices..."}
                {connectionDetails.iceConnectionState === "failed" && 
                  "Failed to establish a direct connection. A relay server may be needed."}
                {connectionDetails.connectionState === "connecting" && 
                  `Found ${connectionDetails.iceCandidates} possible connection paths.`}
              </div>
            )}
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
