
import React from "react";

interface CallMediaStreamsProps {
  publisherRef: React.RefObject<HTMLDivElement>;
  subscriberRef: React.RefObject<HTMLDivElement>;
  hasRemoteParticipant: boolean;
  isConnected: boolean;
  recipientName: string;
}

export function CallMediaStreams({
  publisherRef,
  subscriberRef,
  hasRemoteParticipant,
  isConnected,
  recipientName
}: CallMediaStreamsProps) {
  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={subscriberRef}
        id="subscriber-container"
        className={`bg-muted rounded-md w-full h-full ${!hasRemoteParticipant ? 'hidden' : ''}`}
      />
      <div
        ref={publisherRef}
        id="publisher-container"
        className={`bg-primary-foreground rounded-md ${hasRemoteParticipant ? 'absolute top-2 right-2 w-1/4 h-1/4 z-10' : 'w-full h-full'}`}
      />
      {!hasRemoteParticipant && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Waiting for {recipientName} to join...</p>
        </div>
      )}
    </div>
  );
}
