
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface LoadMoreMessagesProps {
  isLoading: boolean;
  hasNextPage: boolean;
}

export function LoadMoreMessages({ isLoading, hasNextPage }: LoadMoreMessagesProps) {
  const [showLoader, setShowLoader] = useState(false);
  
  // Only show the loader if we're actually loading AND there are more pages
  // Add a small delay to prevent flashing for quick loads
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading && hasNextPage) {
      timeout = setTimeout(() => {
        setShowLoader(true);
      }, 300);
    } else {
      setShowLoader(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, hasNextPage]);
  
  // Don't render anything if not needed
  if (!showLoader && !isLoading) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "sticky top-0 z-10 transition-all duration-300",
        "bg-gradient-to-b from-background/95 to-transparent backdrop-blur-lg",
        "py-4 px-4 -mx-4 select-none flex flex-col items-center justify-center",
        showLoader ? "opacity-100 h-24" : "opacity-0 h-0"
      )}
    >
      <div className="flex items-center gap-3">
        {showLoader && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {isLoading ? "Loading more messages..." : ""}
        </span>
      </div>
    </div>
  );
}
