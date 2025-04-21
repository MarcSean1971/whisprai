
import React from "react";
import { CallUIRoot } from "./call/CallUIRoot";

interface CallUIProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isVideoMuted: boolean;
  onToggleVideo: () => void;
  onEndCall: () => void;
  isConnecting?: boolean;
  callStatus?: string;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
  duration?: number;
  onAcceptCall?: () => void;  // New prop
  onRejectCall?: () => void;  // New prop
}

export function CallUI(props: CallUIProps) {
  return <CallUIRoot {...props} />;
}
