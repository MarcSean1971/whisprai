import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CallStatus } from './types';
import { useCallStore } from '@/components/call/store';
import { PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDuration } from 'date-fns';

export function ActiveCallDialog() {
  const { 
    showActiveCall, 
    callStatus, 
    callerName, 
    recipientName, 
    endCall, 
    toggleMute, 
    isMuted,
    callDuration,
  } = useCallStore();

  const [localDuration, setLocalDuration] = useState(callDuration);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalDuration(callDuration);
  }, [callDuration]);

  useEffect(() => {
    if (callStatus === CallStatus.IN_PROGRESS) {
      // Start a timer to update the call duration every second
      durationTimerRef.current = setInterval(() => {
        setLocalDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Clear the timer if the call is not in progress
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callStatus]);

  // Format the duration for display (mm:ss)
  const formattedDuration = formatDuration({
    minutes: Math.floor(localDuration / 60),
    seconds: localDuration % 60
  }, { format: ['minutes', 'seconds'], delimiter: ':' });

  // Determine who we're on a call with
  const otherPartyName = callerName || recipientName || 'Unknown';

  // Determine the status display text
  let statusText = 'Call ended';
  if (callStatus === CallStatus.CONNECTING) {
    statusText = `Calling ${otherPartyName}...`;
  } else if (callStatus === CallStatus.IN_PROGRESS) {
    statusText = `On call with ${otherPartyName}`;
  } else if (callStatus === CallStatus.FAILED) {
    statusText = 'Call failed';
  }

  return (
    <Dialog open={showActiveCall} onOpenChange={(isOpen) => !isOpen && endCall()}>
      <DialogContent className="max-w-md text-center">
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {otherPartyName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{otherPartyName}</h3>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {callStatus === CallStatus.IN_PROGRESS && (
              <p className="text-sm font-medium">{formattedDuration}</p>
            )}
          </div>
          
          <div className="flex space-x-4">
            {callStatus === CallStatus.IN_PROGRESS && (
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full h-12 w-12 p-0"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="lg" 
              className="rounded-full h-12 w-12 p-0"
              onClick={endCall}
            >
              <PhoneOff className="h-5 w-5" />
              <span className="sr-only">End call</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
