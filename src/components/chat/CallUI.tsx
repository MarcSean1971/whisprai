
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface CallUIProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  isVideoMuted: boolean;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function CallUI({
  localStream,
  remoteStream,
  isAudioMuted,
  onToggleAudio,
  isVideoMuted,
  onToggleVideo,
  onEndCall,
}: CallUIProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl max-w-sm w-full flex flex-col items-center gap-4">
        <div className="flex gap-2 w-full justify-around">
          <video
            className="w-24 h-24 rounded-md bg-black"
            autoPlay
            playsInline
            muted
            ref={(el) => {
              if (el && localStream) el.srcObject = localStream;
            }}
          />
          <video
            className="w-24 h-24 rounded-md bg-black"
            autoPlay
            playsInline
            ref={(el) => {
              if (el && remoteStream) el.srcObject = remoteStream;
            }}
          />
        </div>
        <div className="flex gap-4 mt-4 w-full justify-center">
          <Button
            variant="outline"
            size="icon"
            className={isAudioMuted ? "bg-red-100 text-red-600" : ""}
            onClick={onToggleAudio}
            aria-label={isAudioMuted ? "Unmute mic" : "Mute mic"}
          >
            {isAudioMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={isVideoMuted ? "bg-red-100 text-red-600" : ""}
            onClick={onToggleVideo}
            aria-label={isVideoMuted ? "Enable video" : "Disable video"}
          >
            {isVideoMuted ? <VideoOff /> : <Video />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            aria-label="End call"
          >
            <PhoneOff />
          </Button>
        </div>
      </div>
    </div>
  );
}
