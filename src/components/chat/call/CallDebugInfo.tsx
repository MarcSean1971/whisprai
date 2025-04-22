
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallDebugInfoProps {
  showDebugInfo: boolean;
  onToggleDebug: () => void;
  connectionDetails?: any;
  connectionQuality?: {
    rtt?: number;
    localCandidates: number;
    remoteCandidates: number;
    quality: string;
  };
}

export function CallDebugInfo({
  showDebugInfo,
  onToggleDebug,
  connectionDetails,
  connectionQuality
}: CallDebugInfoProps) {
  if (!connectionDetails) return null;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(3);
    }
    return value || "unknown";
  };

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
          
          <div className="space-y-1">
            <p>ICE State: {connectionDetails.iceConnectionState || "unknown"}</p>
            <p>ICE Gathering: {connectionDetails.iceGatheringState || "unknown"}</p>
            <p>Connection: {connectionDetails.connectionState || "unknown"}</p>
            <p>Signaling: {connectionDetails.signalingState || "unknown"}</p>
            
            {connectionQuality && (
              <>
                <div className="border-t border-white/20 my-2 pt-2">
                  <p className={cn("font-bold", getQualityColor(connectionQuality.quality))}>
                    Quality: {connectionQuality.quality}
                  </p>
                  {connectionQuality.rtt !== undefined && (
                    <p>Round Trip: {formatValue(connectionQuality.rtt)}ms</p>
                  )}
                  <p>Local Candidates: {connectionQuality.localCandidates}</p>
                  <p>Remote Candidates: {connectionQuality.remoteCandidates}</p>
                </div>
              </>
            )}
            
            <div className="border-t border-white/20 my-2 pt-2">
              <p>ICE Candidates: {connectionDetails.iceCandidates}</p>
              <p>Last Activity: {Date.now() - connectionDetails.lastActivity}ms ago</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
