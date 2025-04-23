
import React from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  isOnline: boolean;
  className?: string;
  showLabel?: boolean;
  onRetry?: () => void;
}

export function NetworkStatus({ 
  isOnline, 
  className,
  showLabel = false,
  onRetry
}: NetworkStatusProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5", 
        isOnline ? "text-green-500" : "text-destructive",
        className
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      
      {showLabel && (
        <span className="text-xs font-medium">
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
      
      {!isOnline && onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs underline hover:text-primary ml-2"
          type="button"
        >
          Retry
        </button>
      )}
    </div>
  );
}
