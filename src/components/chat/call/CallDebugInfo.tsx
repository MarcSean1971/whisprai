
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
  const [showIceServers, setShowIceServers] = React.useState(false);
  
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
  
  // Get ICE servers from localStorage for debugging
  const getIceServersInfo = () => {
    try {
      const cachedData = localStorage.getItem('webrtc-ice-servers-cache');
      if (!cachedData) return "No cached ICE servers";
      
      const cache = JSON.parse(cachedData);
      if (!cache.servers || !Array.isArray(cache.servers)) return "Invalid ICE servers cache";
      
      return cache.servers.map((server: any, index: number) => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        const type = urls[0].startsWith('stun') ? 'STUN' : 'TURN';
        const hasCredentials = !!(server.username && server.credential);
        
        return (
          <div key={index} className="mb-1 border-b border-white/10 pb-1">
            <p className="font-bold">{type} Server #{index + 1}:</p>
            <p className="break-all text-xs">{urls.join(', ')}</p>
            {hasCredentials && <p className="text-green-400">Has valid credentials</p>}
          </div>
        );
      });
    } catch (e) {
      return "Error parsing ICE servers: " + (e as Error).message;
    }
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
        <div className="absolute top-12 right-2 z-30 bg-black/80 text-white p-3 rounded-md text-xs font-mono max-w-[350px] max-h-[500px] overflow-auto">
          <h4 className="font-bold mb-1">Connection Details:</h4>
          
          <div className="space-y-1">
            <p>ICE State: <span className={getIceConnectionStateColor(connectionDetails.iceConnectionState)}>
              {connectionDetails.iceConnectionState || "unknown"}
            </span></p>
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

            <div className="border-t border-white/20 my-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs bg-white/10 text-white mb-2"
                onClick={() => setShowIceServers(!showIceServers)}
              >
                {showIceServers ? "Hide ICE Servers" : "Show ICE Servers"}
              </Button>
              
              {showIceServers && (
                <div className="mt-2 border border-white/20 p-2 rounded">
                  <h5 className="font-bold mb-1">ICE Servers:</h5>
                  {getIceServersInfo()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper for coloring ICE connection states
function getIceConnectionStateColor(state: string | null): string {
  if (!state) return "";
  
  switch (state) {
    case "connected":
    case "completed":
      return "text-green-400";
    case "checking":
      return "text-yellow-400";
    case "disconnected":
      return "text-orange-400";
    case "failed":
      return "text-red-400";
    default:
      return "";
  }
}
