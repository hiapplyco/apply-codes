import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PerplexitySearchModal } from './PerplexitySearchModal';

interface PerplexitySearchButtonProps {
  onSearchResult?: (content: { text: string; query: string; searchId?: string }) => void;
  projectId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PerplexitySearchButton({
  onSearchResult,
  projectId,
  className = '',
  size = 'md',
}: PerplexitySearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchResult = (content: { text: string; query: string; searchId?: string }) => {
    if (onSearchResult) {
      onSearchResult(content);
    }
    setIsModalOpen(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          flex items-center gap-2
          bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] 
          text-white font-semibold rounded-lg
          hover:shadow-lg hover:shadow-[#8A2BE2]/20
          transition-all duration-200
          ${sizeClasses[size]}
          ${className}
        `}
      >
        <Search className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        Search the Internet
      </button>

      <PerplexitySearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearchResult={handleSearchResult}
        projectId={projectId}
      />
    </>
  );
}
