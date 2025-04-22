
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface LoadMoreMessagesProps {
  pullProgress: number
  isLoading: boolean
  isPulling: boolean
  hasNextPage: boolean
}

export function LoadMoreMessages({ pullProgress, isLoading, isPulling, hasNextPage }: LoadMoreMessagesProps) {
  const isMobile = useIsMobile();
  const shouldShow = (isMobile ? (isPulling || isLoading) : isLoading) && hasNextPage;
  
  const message = !hasNextPage 
    ? "No more messages to load" 
    : isMobile 
      ? pullProgress >= 100 
        ? "Release to load more messages" 
        : "Pull down to load more messages"
      : "Loading more messages...";

  return (
    <div 
      className={cn(
        "sticky top-0 z-10 transition-all duration-300 flex flex-col items-center justify-center",
        "bg-gradient-to-b from-background/95 to-transparent backdrop-blur-lg",
        "py-4 px-4 -mx-4 select-none touch-none",
        shouldShow ? "opacity-100 h-24" : "opacity-0 h-0"
      )}
      style={{
        transform: isMobile && isPulling ? `translateY(${Math.min(pullProgress / 2, 50)}%)` : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          isMobile && isPulling && (
            <div className="w-44">
              <Progress value={pullProgress} className="h-2" />
            </div>
          )
        )}
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
}
