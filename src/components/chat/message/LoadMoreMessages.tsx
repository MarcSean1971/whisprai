
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadMoreMessagesProps {
  isLoading: boolean;
  hasNextPage: boolean;
}

export function LoadMoreMessages({ isLoading, hasNextPage }: LoadMoreMessagesProps) {
  const shouldShow = isLoading && hasNextPage;
  
  return (
    <div 
      className={cn(
        "sticky top-0 z-10 transition-all duration-300",
        "bg-gradient-to-b from-background/95 to-transparent backdrop-blur-lg",
        "py-4 px-4 -mx-4 select-none flex flex-col items-center justify-center",
        shouldShow ? "opacity-100 h-24" : "opacity-0 h-0"
      )}
    >
      <div className="flex items-center gap-3">
        {isLoading && hasNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {!hasNextPage ? "No more messages" : "Loading more messages..."}
        </span>
      </div>
    </div>
  );
}
