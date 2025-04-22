
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video, VideoOff } from "lucide-react";

interface CallStatusProps {
  callStatus: string;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  callType?: "audio" | "video";
}

export function CallStatus({
  callStatus,
  onAcceptCall,
  onRejectCall,
  callType = "video"
}: CallStatusProps) {
  console.log("[CallStatus] Rendering with:", { callStatus, callType });

  if (callStatus === "incoming") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 text-center transition-all animate-fade-in">
        <div className="text-3xl font-bold text-[#7C4DFF] mb-6 drop-shadow-sm">
          Incoming {callType} call...
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={onAcceptCall}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            size="lg"
          >
            {callType === "video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
            Accept
          </Button>
          <Button
            onClick={onRejectCall}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
            size="lg"
          >
            {callType === "video" ? <VideoOff className="h-5 w-5" /> : <PhoneOff className="h-5 w-5" />}
            Decline
          </Button>
        </div>
      </div>
    );
  }

  if (callStatus === "missed" || callStatus === "rejected" || callStatus === "ended") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 text-center transition-all animate-fade-in">
        <div className="text-3xl font-bold text-[#7C4DFF] mb-3 drop-shadow-sm">
          {callStatus === "rejected"
            ? `${callType} call rejected`
            : callStatus === "missed"
            ? `${callType} call not answered`
            : `${callType} call ended`}
        </div>
        <Button
          onClick={onRejectCall}
          className="mt-4 border-[#d6bcfa] text-[#7C4DFF] hover:bg-[#f1f0fb]"
          variant="outline"
          tabIndex={0}
        >
          Close
        </Button>
      </div>
    );
  }

  return null;
}
