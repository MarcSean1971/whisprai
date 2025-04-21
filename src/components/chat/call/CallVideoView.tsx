
import React from "react";
import { LocalVideoView } from "./LocalVideoView";
import { RemoteVideoView } from "./RemoteVideoView";
import { CallTimer } from "./CallTimer";

interface CallVideoViewProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoMuted: boolean;
  isConnecting: boolean;
  callStatus: string;
  duration: number;
  connectionDetails?: any;
  callType?: "audio" | "video";
}

export function CallVideoView({
  localStream,
  remoteStream,
  isVideoMuted,
  isConnecting,
  callStatus,
  duration,
  connectionDetails,
  callType = "video"
}: CallVideoViewProps) {
  return (
    <div className="relative w-full flex-1 flex items-center justify-center bg-white rounded-2xl max-h-[60vh] min-h-[220px]">
      <RemoteVideoView
        remoteStream={remoteStream}
        isConnecting={isConnecting}
        callStatus={callStatus}
        connectionDetails={connectionDetails}
        callType={callType}
        duration={duration} // Pass duration prop to RemoteVideoView
      >
        {callType === "video" && (
          <LocalVideoView localStream={localStream} isVideoMuted={isVideoMuted} />
        )}
        {duration > 0 && <CallTimer duration={duration} />}
      </RemoteVideoView>
    </div>
  );
}
