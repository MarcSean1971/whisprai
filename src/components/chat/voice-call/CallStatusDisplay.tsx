
import { AlertCircle, Loader2, Phone, PhoneOff } from "lucide-react";
import React from "react";

interface CallStatusDisplayProps {
  internalError: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  timeoutSecs?: number;
  recipientName: string;
  showEndBanner: boolean;
}

export function CallStatusDisplay({
  internalError,
  isConnecting,
  isConnected,
  timeoutSecs = 0,
  recipientName,
  showEndBanner
}: CallStatusDisplayProps) {
  if (internalError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="font-semibold text-center">{internalError}</div>
        <div className="text-muted-foreground text-sm text-center max-w-xs">
          {internalError.includes("offline") ? 
            `${recipientName} appears to be offline. Try again later.` : 
            internalError.includes("ended") ? 
              "Call has ended" : 
              "Call could not start. Please try again."}
        </div>
      </div>
    );
  }
  
  if (showEndBanner) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
          <PhoneOff className="h-8 w-8 text-secondary" />
        </div>
        <div className="font-semibold">Call ended</div>
      </div>
    );
  }
  
  if (isConnecting && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="font-semibold">Connecting to call...</div>
        <div>Calling {recipientName}...</div>
        {timeoutSecs > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            Will time out in <span className="font-medium">{timeoutSecs}s</span>
          </div>
        )}
      </div>
    );
  }
  
  if (isConnected && !isConnecting) {
    return (
      <div className="absolute top-2 left-2 z-20 flex items-center opacity-70">
        <Phone className="h-3 w-3 text-green-500 mr-1" />
        <span className="text-xs">Call connected</span>
      </div>
    );
  }
  
  return null;
}
