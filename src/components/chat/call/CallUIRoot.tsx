
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
import { Volume2, VolumeX, PhoneOff, Monitor, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";

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
  onAcceptCall?: () => void;  // New prop
  onRejectCall?: () => void;  // New prop
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
  onAcceptCall,
  onRejectCall,
}: CallUIRootProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

  const toggleRemoteAudio = () => {
    if (remoteStream) {
      const audioTracks = remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setRemoteAudioMuted(!remoteAudioMuted);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const isRingtoneActive = callStatus === "connecting" || callStatus === "ringing";

  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className={`
          z-50 flex items-center justify-center p-0 bg-transparent
          w-full max-w-lg sm:max-w-2xl
          transition-all
          overflow-visible
        `}
        style={{
          background: "transparent",
          padding: 0,
          boxShadow: "none",
          minHeight: "unset",
        }}
        onInteractOutside={e => e.preventDefault()}
      >
        <div
          className={`
            relative flex flex-col w-full
            max-w-lg sm:max-w-2xl
            rounded-2xl mx-auto overflow-hidden
            border border-[#e0ddfa]
            ring-2 ring-[#d6bcfa]
            shadow-2xl
            bg-white
            max-h-[80vh]
            min-h-[300px]
            items-center justify-center
            transition-all
          `}
          style={{
            margin: "auto",
            background: "#fff",
            height: "100%",
            maxHeight: "80vh",
          }}
        >
          <div className="relative w-full flex-1 flex items-center justify-center bg-white rounded-2xl max-h-[60vh] min-h-[220px]">
            {isRingtoneActive && <CallUIRingtone callStatus={callStatus} />}
            <RemoteVideoView
              remoteStream={remoteStream}
              isConnecting={isConnecting}
              callStatus={callStatus}
              videoRef={remoteVideoRef}
            >
              <LocalVideoView localStream={localStream} isVideoMuted={isVideoMuted} />
              {duration > 0 && <CallTimer duration={duration} />}
            </RemoteVideoView>

            {/* Show accept/reject buttons when call is incoming */}
            {callStatus === "incoming" && onAcceptCall && onRejectCall && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 text-center transition-all animate-fade-in">
                <div className="text-3xl font-bold text-[#7C4DFF] mb-6 drop-shadow-sm">
                  Incoming call...
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={onAcceptCall}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    size="lg"
                  >
                    <Phone className="h-5 w-5" />
                    Accept
                  </Button>
                  <Button
                    onClick={onRejectCall}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    size="lg"
                  >
                    <PhoneOff className="h-5 w-5" />
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Call ended states */}
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
