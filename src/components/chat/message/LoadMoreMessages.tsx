
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadMoreMessagesProps {
  pullProgress: number
  isLoading: boolean
  isPulling: boolean
  hasNextPage: boolean
}

export function LoadMoreMessages({ pullProgress, isLoading, isPulling, hasNextPage }: LoadMoreMessagesProps) {
  const shouldShow = (isPulling || isLoading) && hasNextPage;
  const message = !hasNextPage 
    ? "No more messages to load" 
    : pullProgress >= 100 
      ? "Release to load more messages" 
      : "Pull down to load more messages";

  return (
    <div 
      className={cn(
        "sticky top-0 z-10 transition-all duration-300 flex flex-col items-center justify-center",
        "bg-gradient-to-b from-background/95 to-transparent backdrop-blur-lg",
        "py-3 px-4 -mx-4 select-none touch-none",
        shouldShow ? "opacity-100 h-20" : "opacity-0 h-0"
      )}
      style={{
        transform: `translateY(${Math.min(pullProgress / 2, 50)}%)`,
      }}
    >
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="w-40">
            <Progress value={pullProgress} className="h-1.5" />
          </div>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {isLoading ? "Loading messages..." : message}
        </span>
      </div>
    </div>
  )
}
