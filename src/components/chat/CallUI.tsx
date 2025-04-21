
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Maximize2, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

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
}: CallUIProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [remoteAudioMuted, setRemoteAudioMuted] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Play a ringtone sound if the call is connecting/ringing
  useEffect(() => {
    const audio = new Audio('/sounds/ringtone.mp3');
    
    if (callStatus === 'connecting' || callStatus === 'ringing') {
      audio.loop = true;
      audio.play().catch(e => console.error('Could not play ringtone:', e));
    }
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [callStatus]);

  return (
    <Dialog open={true} modal={true}>
      <DialogContent className="fixed inset-0 z-50 flex flex-col items-center justify-center p-0 sm:p-6 max-w-full max-h-full m-0 rounded-none sm:rounded-lg sm:max-w-4xl sm:max-h-[90vh]" onInteractOutside={e => e.preventDefault()}>
        <div className="relative flex flex-col w-full h-full bg-black overflow-hidden">
          {/* Main video area (remote stream) */}
          <div className="relative flex-1 w-full h-full bg-zinc-900">
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-pulse text-white text-xl mb-2">
                    {callStatus === 'connecting' ? 'Connecting...' : 'Ringing...'}
                  </div>
                  <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-white rounded-full"></div>
                </div>
              </div>
            )}
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover bg-black"
              autoPlay
              playsInline
              ref={(el) => {
                if (el && remoteStream) {
                  el.srcObject = remoteStream;
                  remoteVideoRef.current = el;
                }
              }}
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-1/4 max-w-[150px] aspect-video rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                className={`w-full h-full object-cover bg-zinc-800 ${isVideoMuted ? 'hidden' : ''}`}
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && localStream) {
                    el.srcObject = localStream;
                    localVideoRef.current = el;
                  }
                }}
              />
              {isVideoMuted && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <VideoOff className="text-white/50" />
                </div>
              )}
            </div>
            
            {/* Call duration timer */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {formatDuration(duration)}
            </div>
          </div>
          
          {/* Call controls */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-3 justify-center p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${isAudioMuted ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600' : 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20'}`}
              onClick={onToggleAudio}
              aria-label={isAudioMuted ? "Unmute mic" : "Mute mic"}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${isVideoMuted ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600' : 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20'}`}
              onClick={onToggleVideo}
              aria-label={isVideoMuted ? "Enable video" : "Disable video"}
            >
              {isVideoMuted ? <VideoOff /> : <Video />}
            </Button>
            
            {onToggleScreenShare && (
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-full ${isScreenSharing ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600' : 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20'}`}
                onClick={onToggleScreenShare}
                aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
              >
                <Monitor />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
              onClick={toggleFullScreen}
              aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              <Maximize2 />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${remoteAudioMuted ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600' : 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20'}`}
              onClick={toggleRemoteAudio}
              aria-label={remoteAudioMuted ? "Unmute call" : "Mute call"}
            >
              {remoteAudioMuted ? <VolumeX /> : <Volume2 />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onEndCall}
              aria-label="End call"
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
