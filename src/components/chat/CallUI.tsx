
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner"; 
import { CallUIRingtone } from "./call/CallUIRingtone";
import { CallControls } from "./call/CallControls";
import { CallVideoView } from "./call/CallVideoView";
import { CallStatus } from "./call/CallStatus";
import { CallDebugInfo } from "./call/CallDebugInfo";

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
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  connectionDetails?: any;
}

export function CallUI({
  localStream,
  remoteStream,
  isAudioMuted,
  onToggleAudio,
  isVideoMuted,
  onToggleVideo,
  onEndCall,
  isConnecting = false,
  callStatus = "connected",
  isScreenSharing = false,
  onToggleScreenShare,
  duration = 0,
  onAcceptCall,
  onRejectCall,
  connectionDetails,
}: CallUIProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const toggleRemoteAudio = () => {
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setRemoteAudioMuted(!remoteAudioMuted);
    }
  };

  React.useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const isRingtoneActive = callStatus === "connecting" || callStatus === "ringing";

  // Function to handle call end and call rejection
  const handleCloseCall = () => {
    if (onRejectCall && (callStatus === "incoming" || callStatus === "missed" || callStatus === "rejected" || callStatus === "ended")) {
      onRejectCall();
    } else {
      onEndCall();
    }
  };

  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className="z-50 flex items-center justify-center p-0 bg-transparent w-full max-w-lg sm:max-w-2xl transition-all overflow-visible"
        style={{
          background: "transparent",
          padding: 0,
          boxShadow: "none",
          minHeight: "unset",
        }}
        onInteractOutside={e => e.preventDefault()}
      >
        <div className="relative flex flex-col w-full max-w-lg sm:max-w-2xl rounded-2xl mx-auto overflow-hidden border border-[#e0ddfa] ring-2 ring-[#d6bcfa] shadow-2xl bg-white max-h-[80vh] min-h-[300px] items-center justify-center transition-all"
             style={{ margin: "auto", background: "#fff", height: "100%", maxHeight: "80vh" }}>
          
          {isRingtoneActive && <CallUIRingtone callStatus={callStatus} />}
          
          <CallVideoView
            localStream={localStream}
            remoteStream={remoteStream}
            isVideoMuted={isVideoMuted}
            isConnecting={isConnecting}
            callStatus={callStatus}
            duration={duration}
            connectionDetails={connectionDetails}
          />

          <CallDebugInfo
            showDebugInfo={showDebugInfo}
            onToggleDebug={() => setShowDebugInfo(!showDebugInfo)}
            connectionDetails={connectionDetails}
          />

          <CallStatus
            callStatus={callStatus}
            onAcceptCall={onAcceptCall}
            onRejectCall={handleCloseCall}
          />

          <div className="relative z-20 w-full bg-white/95 pt-3 pb-5 px-4 flex items-center justify-center border-t border-[#e0ddfa] rounded-b-2xl">
            <CallControls
              isAudioMuted={isAudioMuted}
              onToggleAudio={onToggleAudio}
              isVideoMuted={isVideoMuted}
              onToggleVideo={onToggleVideo}
              onEndCall={onEndCall}
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={onToggleScreenShare}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
              remoteAudioMuted={remoteAudioMuted}
              onToggleRemoteAudio={toggleRemoteAudio}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
