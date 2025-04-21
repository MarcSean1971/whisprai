
import React from "react";
import { Button } from "@/components/ui/button";

interface CallDebugInfoProps {
  showDebugInfo: boolean;
  onToggleDebug: () => void;
  connectionDetails?: any;
}

export function CallDebugInfo({
  showDebugInfo,
  onToggleDebug,
  connectionDetails
}: CallDebugInfoProps) {
  if (!connectionDetails) return null;

  return (
    <>
      <div className="absolute top-2 right-2 z-30">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur border-white/20 text-black hover:bg-white/90"
          onClick={onToggleDebug}
        >
          {showDebugInfo ? "Hide Debug" : "Debug"}
        </Button>
      </div>

      {showDebugInfo && (
        <div className="absolute top-12 right-2 z-30 bg-black/80 text-white p-3 rounded-md text-xs font-mono max-w-[300px] overflow-auto">
          <h4 className="font-bold mb-1">Connection Details:</h4>
          <p>ICE State: {connectionDetails.iceConnectionState || "unknown"}</p>
          <p>ICE Gathering: {connectionDetails.iceGatheringState || "unknown"}</p>
          <p>Connection: {connectionDetails.connectionState || "unknown"}</p>
          <p>Signaling: {connectionDetails.signalingState || "unknown"}</p>
          <p>Candidates: {connectionDetails.iceCandidates}</p>
          <p>Last Activity: {Date.now() - connectionDetails.lastActivity}ms ago</p>
        </div>
      )}
    </>
  );
}
