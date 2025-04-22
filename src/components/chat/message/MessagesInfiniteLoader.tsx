
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MessagesInfiniteLoaderProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function MessagesInfiniteLoader({ 
  onLoadMore, 
  hasMore, 
  isLoading 
}: MessagesInfiniteLoaderProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!hasMore) return;
    
    const currentLoaderRef = loaderRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    
    observerRef.current = observer;
    
    return () => {
      if (currentLoaderRef && observerRef.current) {
        observerRef.current.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);
  
  return (
    <div
      ref={loaderRef}
      className="flex justify-center py-2 -mt-2"
    >
      {isLoading && (
        <div className="space-y-2 w-full max-w-[300px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      )}
    </div>
  );
}
