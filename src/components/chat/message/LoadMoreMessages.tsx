
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
        "bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm",
        "py-2 px-4 -mx-4",
        shouldShow ? "opacity-100 h-16" : "opacity-0 h-0"
      )}
    >
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <div className="w-32">
            <Progress value={pullProgress} className="h-1" />
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {isLoading ? "Loading messages..." : message}
        </span>
      </div>
    </div>
  )
}
