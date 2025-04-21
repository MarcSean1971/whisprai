
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

  // Main card styling for responsiveness and centering
  const wrapperClass = `
    fixed inset-0 z-50 flex items-center justify-center
    bg-[#f1f0fb] bg-opacity-95
    p-0
    transition-all
  `;
  const cardClass = `
    relative flex flex-col w-full h-full max-w-lg max-h-[85vh]
    sm:max-w-2xl sm:max-h-[85vh]
    rounded-2xl mx-auto overflow-hidden
    border border-[#e0ddfa]
    ring-2 ring-[#d6bcfa]
    shadow-xl
    items-center justify-center
    transition-all
    bg-white
  `;

  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className={wrapperClass}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          background: "#f1f0fb",
          boxShadow: "0 4px 36px 0 rgba(80, 46, 203, 0.10)",
        }}
        onInteractOutside={e => e.preventDefault()}
      >
        {/* Centered, light, responsive card */}
        <div
          className={cardClass}
          style={{
            margin: "auto",
            boxShadow: "0 4px 36px 0 rgba(80, 46, 203, 0.10)",
            background: "#fff",
          }}
        >
          {/* Remote video section or connecting indicator */}
          <div className="relative w-full h-full flex-1 flex items-center justify-center bg-white">
            <RemoteVideoView
              remoteStream={remoteStream}
              isConnecting={isConnecting}
              callStatus={callStatus}
              videoRef={remoteVideoRef}
            >
              <LocalVideoView localStream={localStream} isVideoMuted={isVideoMuted} />
              <CallTimer duration={duration} />
              {/* Ringtone always included */}
              <CallUIRingtone callStatus={callStatus} />
            </RemoteVideoView>
            {/* Overlay for "Call Not Answered." */}
            {(callStatus === "missed" || callStatus === "rejected" || callStatus === "ended") && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 text-center transition-all animate-fade-in">
                <div className="text-3xl font-bold text-[#7C4DFF] mb-3 drop-shadow-sm">
                  {callStatus === "rejected"
                    ? "Call rejected"
                    : callStatus === "missed"
                    ? "Call not answered"
                    : "Call ended"}
                </div>
                <Button
                  onClick={onEndCall}
                  className="mt-4 border-[#d6bcfa] text-[#7C4DFF] hover:bg-[#f1f0fb]"
                  variant="outline"
                  tabIndex={0}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
          {/* Call controls bar */}
          <div className="relative z-20 w-full bg-white/80 pt-3 pb-5 px-4 flex items-center justify-center border-t border-[#e0ddfa]">
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
