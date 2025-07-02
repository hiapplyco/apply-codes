import { useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.1,
  rootMargin = '100px'
}: UseInfiniteScrollProps) => {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: false
  });

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && inView) {
      onLoadMore();
    }
  }, [hasMore, isLoading, inView, onLoadMore]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  return {
    ref,
    inView
  };
};