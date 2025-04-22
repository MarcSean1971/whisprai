
import React from "react";
import { ConnectionDetails } from "../types";

interface VideoStatusOverlayProps {
  isConnecting: boolean;
  callStatus: string;
  connectionDetails?: ConnectionDetails;
}

export function VideoStatusOverlay({
  isConnecting,
  callStatus,
  connectionDetails,
}: VideoStatusOverlayProps) {
  const getConnectionMessage = () => {
    if (callStatus === "connecting" && connectionDetails) {
      if (connectionDetails.iceGatheringState === "gathering") {
        return `Finding connection paths (${connectionDetails.iceCandidates} found)...`;
      } else if (
        connectionDetails.iceGatheringState === "complete" &&
        connectionDetails.iceConnectionState === "checking"
      ) {
        return "Testing connection paths...";
      } else if (connectionDetails.iceConnectionState === "failed") {
        return "Connection failed. Check your network settings.";
      } else if (connectionDetails.iceConnectionState === "disconnected") {
        return "Connection lost. Attempting to reconnect...";
      }
      return "Establishing secure connection...";
    }
    return callStatus === "incoming"
      ? "Incoming call..."
      : callStatus === "calling"
      ? "Calling..."
      : "Ringing...";
  };

  const getDetailedMessage = () => {
    if (connectionDetails) {
      if (connectionDetails.iceConnectionState === "checking") {
        return "Testing direct connection routes between devices...";
      } else if (connectionDetails.iceConnectionState === "failed") {
        return "Failed to establish a connection. Check your firewall settings or try using a different network.";
      } else if (connectionDetails.connectionState === "connecting") {
        const candidates = connectionDetails.iceCandidates || 0;
        return `Found ${candidates} possible connection ${candidates === 1 ? 'path' : 'paths'}`;
      }
    }
    return "";
  };

  if (!isConnecting) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f1f0fb]/85 z-10 transition-all animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="animate-pulse text-[#7C4DFF] text-xl font-medium mb-2">
          {getConnectionMessage()}
        </div>
        <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-[#d6bcfa] rounded-full"></div>

        {connectionDetails && (
          <div className="mt-4 text-xs text-[#4b3a6b] max-w-[280px] text-center">
            {getDetailedMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
