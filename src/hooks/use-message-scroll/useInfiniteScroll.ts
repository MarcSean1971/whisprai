
import { useEffect } from 'react';

interface UseInfiniteScrollOptions {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  refetch?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function useInfiniteScroll({
  loadMoreRef,
  refetch,
  hasNextPage = false,
  isFetchingNextPage = false
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!refetch || !hasNextPage || isFetchingNextPage) return;

    console.log('[Scroll] Setting up Intersection Observer', {
      hasNextPage,
      isFetchingNextPage,
      refetchAvailable: !!refetch
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('[Scroll] Loading more messages - intersection detected');
          refetch();
        }
      },
      { 
        rootMargin: '200px 0px 0px 0px',
        threshold: 0
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [refetch, hasNextPage, isFetchingNextPage, loadMoreRef]);
}
