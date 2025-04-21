
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CallControls } from "./CallControls";
import { CallTimer } from "./CallTimer";
import { LocalVideoView } from "./LocalVideoView";
import { RemoteVideoView } from "./RemoteVideoView";
import { CallUIFullScreenButton } from "./CallUIFullScreenButton";
import { CallUIRingtone } from "./CallUIRingtone";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, PhoneOff, Monitor, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface CallUIRootProps {
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
}

export function CallUIRoot({
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
}: CallUIRootProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Handle full screen toggle
  const toggleFullScreen = () => {
    if (!remoteVideoRef.current) return;

    if (!document.fullscreenElement) {
      remoteVideoRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Handle toggling remote audio
  const toggleRemoteAudio = () => {
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setRemoteAudioMuted(!remoteAudioMuted);
    }
  };

  // Listen for full screen change
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className="
          fixed z-50 inset-0 p-0 flex items-center justify-center
          bg-[rgba(26,31,44,0.93)] sm:p-0
          !m-0
          border-none
          shadow-2xl
          !max-w-none !w-screen !h-screen
          sm:!max-w-2xl sm:!max-h-[90vh] sm:rounded-2xl sm:mx-auto
          overflow-hidden
          transition-all
        "
        style={{
          // On small screens take up full, on md+ be centered and sized
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        onInteractOutside={e => e.preventDefault()}
      >
        <div
          className="
            flex flex-col bg-[#221F26] relative
            w-full h-full max-w-[500px] max-h-[80vh]
            sm:max-w-[680px] sm:max-h-[80vh]
            rounded-2xl overflow-hidden ring-1 ring-neutral-800 shadow-2xl
            items-center justify-center
          "
          style={{
            margin: "auto",
            boxShadow: "0 4px 36px 0 rgba(80, 46, 203, 0.19)",
          }}
        >
          <div className="relative w-full h-full flex-1 flex items-center justify-center">
            <RemoteVideoView
              remoteStream={remoteStream}
              isConnecting={isConnecting}
              callStatus={callStatus}
              videoRef={remoteVideoRef}
            >
              <LocalVideoView localStream={localStream} isVideoMuted={isVideoMuted} />
              <CallTimer duration={duration} />
              <CallUIRingtone callStatus={callStatus} />
            </RemoteVideoView>
          </div>
          <div className="relative z-20 w-full bg-black/40 pt-4 pb-6 px-4 flex items-center justify-center">
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
