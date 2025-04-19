import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect } from "react";
import { CallStatus } from './types';
import { useCallStore } from '@/components/call/store';

export function IncomingCallDialog() {
  const { 
    callStatus, 
    callerName, 
    showIncomingCall,
    acceptCall,
    rejectCall
  } = useCallStore();

  // Play ringtone when there's an incoming call
  useEffect(() => {
    if (showIncomingCall) {
      const ringtone = new Audio('/sounds/ringtone.mp3');
      ringtone.loop = true;
      ringtone.play().catch(e => console.error('Error playing ringtone:', e));
      
      return () => {
        ringtone.pause();
        ringtone.currentTime = 0;
      };
    }
  }, [showIncomingCall]);

  return (
    <Dialog open={showIncomingCall} onOpenChange={(open) => {
      if (!open) rejectCall();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500 animate-pulse" />
            Incoming Call
          </DialogTitle>
          <DialogDescription>
            {callerName || "Someone"} is calling you
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl font-semibold">
              {callerName ? callerName[0].toUpperCase() : "?"}
            </span>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={rejectCall}
              className="w-[45%] gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Decline
            </Button>
            
            <Button
              type="button"
              variant="default"
              onClick={acceptCall}
              className="w-[45%] gap-2 bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-4 w-4" />
              Answer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
