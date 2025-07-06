
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const LoadMoreButton = ({ onClick, isLoading }: LoadMoreButtonProps) => {
  return (
    <div className="mt-6 flex justify-center">
      <button 
        onClick={onClick}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
            Loading More Results...
          </>
        ) : (
          'Load More Results (Next 10)'
        )}
      </button>
    </div>
  );
};
