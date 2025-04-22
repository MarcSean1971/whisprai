
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MutableRefObject } from "react";

interface MessagesInfiniteLoaderProps {
  isFetchingNextPage: boolean;
  loaderRef: ((node: HTMLDivElement | null) => void) | MutableRefObject<HTMLDivElement | null>;
}

export function MessagesInfiniteLoader({ 
  isFetchingNextPage, 
  loaderRef 
}: MessagesInfiniteLoaderProps) {
  return (
    <div 
      ref={typeof loaderRef === 'function' ? loaderRef : (node) => {
        if (loaderRef && 'current' in loaderRef) {
          loaderRef.current = node;
        }
      }} 
      className="h-4 flex justify-center"
    >
      {isFetchingNextPage && (
        <Button variant="ghost" size="sm" disabled className="py-2">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading more messages...
        </Button>
      )}
    </div>
  );
}
