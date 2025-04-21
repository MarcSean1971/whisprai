
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Maximize2, Volume2, VolumeX
} from "lucide-react";

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
}

export function CallControls({
  isAudioMuted, onToggleAudio,
  isVideoMuted, onToggleVideo,
  onEndCall,
  isScreenSharing = false, onToggleScreenShare,
  isFullScreen, onToggleFullScreen,
  remoteAudioMuted, onToggleRemoteAudio,
}: CallControlsProps) {
  return (
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
        onClick={onToggleFullScreen}
        aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
      >
        <Maximize2 />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={`h-12 w-12 rounded-full ${remoteAudioMuted ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600' : 'bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20'}`}
        onClick={onToggleRemoteAudio}
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
  );
}
