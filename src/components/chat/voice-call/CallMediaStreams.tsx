
import React from "react";
import { Loader2 } from "lucide-react";

interface CallMediaStreamsProps {
  publisherRef: React.RefObject<HTMLDivElement>;
  subscriberRef: React.RefObject<HTMLDivElement>;
  hasRemoteParticipant: boolean;
  isConnected: boolean;
  recipientName: string;
  isVideoActive?: boolean;
}

export function CallMediaStreams({
  publisherRef,
  subscriberRef,
  hasRemoteParticipant,
  isConnected,
  recipientName,
  isVideoActive = false
}: CallMediaStreamsProps) {
  return (
    <div className="relative h-full flex flex-col">
      {/* Remote participant stream */}
      <div
        ref={subscriberRef}
        id="subscriber-container"
        className={`bg-muted rounded-md w-full h-full ${!hasRemoteParticipant ? 'hidden' : ''}`}
      >
        {hasRemoteParticipant && isConnected && (
          <div className="absolute top-2 left-2 z-10 bg-background/70 px-2 py-1 rounded text-xs">
            {recipientName}
          </div>
        )}
      </div>
      
      {/* Local stream (publisher) */}
      <div
        ref={publisherRef}
        id="publisher-container"
        className={`bg-primary-foreground rounded-md ${
          hasRemoteParticipant 
            ? 'absolute top-2 right-2 w-1/4 h-1/4 z-10 shadow-lg border border-primary/20' 
            : 'w-full h-full flex items-center justify-center'
        } ${isVideoActive ? '' : 'bg-background/80'}`}
      >
        {!isVideoActive && !hasRemoteParticipant && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl text-primary">{recipientName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Waiting for participant to join */}
      {!hasRemoteParticipant && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 bg-background/80 p-4 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-center">
              Waiting for {recipientName} to join...
            </p>
          </div>
        </div>
      )}
      
      {/* Connection overlay - visual feedback */}
      {isConnected && (
        <div className="absolute top-2 left-2 z-20 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
          <span className="text-xs text-muted-foreground">Connected</span>
        </div>
      )}
    </div>
  );
}
