
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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-0 sm:p-6 max-w-full max-h-full m-0 rounded-none sm:rounded-lg sm:max-w-4xl sm:max-h-[90vh]"
        onInteractOutside={e => e.preventDefault()}>
        <div className="relative flex flex-col w-full h-full bg-black overflow-hidden">
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
      </DialogContent>
    </Dialog>
  );
}
