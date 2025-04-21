
import React from "react";
import { AudioButton } from "./controls/AudioButton";
import { VideoButton } from "./controls/VideoButton";
import { ScreenShareButton } from "./controls/ScreenShareButton";
import { CallUIFullScreenButton } from "./CallUIFullScreenButton";
import { AudioOutputButton } from "./controls/AudioOutputButton";
import { EndCallButton } from "./controls/EndCallButton";

interface CallControlsProps {
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isVideoMuted: boolean;
  onToggleVideo: () => void;
  onEndCall: () => void;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  remoteAudioMuted: boolean;
  onToggleRemoteAudio: () => void;
  callType?: "audio" | "video";
}

export function CallControls({
  isAudioMuted,
  onToggleAudio,
  isVideoMuted,
  onToggleVideo,
  onEndCall,
  isScreenSharing = false,
  onToggleScreenShare,
  isFullScreen,
  onToggleFullScreen,
  remoteAudioMuted,
  onToggleRemoteAudio,
  callType = "video",
}: CallControlsProps) {
  const isAudioCall = callType === "audio";

  return (
    <div className="flex gap-3 justify-center p-4">
      <AudioButton isAudioMuted={isAudioMuted} onToggleAudio={onToggleAudio} />
      
      {!isAudioCall && (
        <VideoButton isVideoMuted={isVideoMuted} onToggleVideo={onToggleVideo} />
      )}
      
      {!isAudioCall && onToggleScreenShare && (
        <ScreenShareButton
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={onToggleScreenShare}
        />
      )}
      
      {!isAudioCall && (
        <CallUIFullScreenButton
          isFullScreen={isFullScreen}
          onToggleFullScreen={onToggleFullScreen}
        />
      )}
      
      <AudioOutputButton
        remoteAudioMuted={remoteAudioMuted}
        onToggleRemoteAudio={onToggleRemoteAudio}
      />
      
      <EndCallButton onEndCall={onEndCall} />
    </div>
  );
}
