
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useCallStore } from "@/components/call/store/useCallStore";
import { CallStatus } from "@/components/call/useTwilioVoice";

export function ActiveCallDialog() {
  const { 
    callStatus, 
    callerName, 
    recipientName,
    showActiveCall,
    isMuted,
    toggleMute,
    endCall,
    callDuration,
    updateCallDuration
  } = useCallStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Start timer when call is in progress
  useEffect(() => {
    let intervalId: number;
    
    if (callStatus === CallStatus.IN_PROGRESS) {
      intervalId = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          updateCallDuration(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [callStatus, updateCallDuration]);
  
  // Format the timer as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine the display name based on whether this is an outgoing or incoming call
  const displayName = callStatus === CallStatus.CONNECTING || callStatus === CallStatus.RINGING 
    ? recipientName 
    : callerName;
  
  // Determine call status text
  const getStatusText = () => {
    switch (callStatus) {
      case CallStatus.CONNECTING:
        return "Initiating call...";
      case CallStatus.RINGING:
        return "Ringing...";
      case CallStatus.IN_PROGRESS:
        return formatTime(elapsedTime);
      default:
        return "Call in progress";
    }
  };

  return (
    <Dialog open={showActiveCall} onOpenChange={(open) => {
      if (!open) endCall();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            {callStatus === CallStatus.IN_PROGRESS ? (
              <span>Call in progress</span>
            ) : (
              <span>Calling {displayName || "..."}</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl font-semibold">
              {displayName ? displayName[0].toUpperCase() : "?"}
            </span>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium">{displayName || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <div className="flex w-full justify-center gap-4">
            {callStatus === CallStatus.IN_PROGRESS && (
              <Button
                type="button"
                variant="outline"
                onClick={toggleMute}
                className="rounded-full h-12 w-12 p-0"
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              </Button>
            )}
            
            <Button
              type="button"
              variant="destructive"
              onClick={endCall}
              className="rounded-full h-12 w-12 p-0"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="sr-only">End Call</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
