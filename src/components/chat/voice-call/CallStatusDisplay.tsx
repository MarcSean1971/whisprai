
import { AlertCircle, Loader2 } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="font-semibold">{internalError}</div>
        <div className="text-muted-foreground text-sm">Call could not start. Please try again.</div>
      </div>
    );
  }
  if (isConnecting && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Connecting to call...</p>
        {timeoutSecs > 0 && (
          <span className="mt-2 text-sm text-muted-foreground">Will time out in {timeoutSecs}s</span>
        )}
      </div>
    );
  }
  return null;
}
