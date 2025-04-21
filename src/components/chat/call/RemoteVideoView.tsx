
import React, { useEffect, useRef } from "react";
import { VideoStatusOverlay } from "./overlays/VideoStatusOverlay";
import { AudioOnlyView } from "./overlays/AudioOnlyView";
import { CallTimer } from "./CallTimer";

interface RemoteVideoViewProps {
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  callStatus: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  connectionDetails?: any;
  callType?: "audio" | "video";
  children?: React.ReactNode;
  duration?: number;
}

export function RemoteVideoView({
  remoteStream,
  isConnecting,
  callStatus,
  videoRef,
  connectionDetails,
  callType = "video",
  children,
  duration = 0,
}: RemoteVideoViewProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || internalVideoRef;

  useEffect(() => {
    if (ref.current && remoteStream) {
      ref.current.srcObject = remoteStream;
    }
  }, [remoteStream, ref]);

  const isAudioOnlyCall = callType === "audio";
  const showAudioOnlyView = isAudioOnlyCall && callStatus === "connected" && !isConnecting;

  return (
    <div className="relative flex-1 w-full h-full bg-white">
      <VideoStatusOverlay
        isConnecting={isConnecting}
        callStatus={callStatus}
        connectionDetails={connectionDetails}
      />
      
      {showAudioOnlyView ? (
        <AudioOnlyView duration={duration} />
      ) : (
        <>
          <video
            className={`w-full h-full object-cover bg-white ${isAudioOnlyCall ? "hidden" : ""}`}
            autoPlay
            playsInline
            ref={ref}
          />
          {isAudioOnlyCall && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f1f0fb]">
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[#7C4DFF] mx-auto flex items-center justify-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div className="text-lg font-medium text-[#4b3a6b]">
                  Audio Call in Progress
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
}
