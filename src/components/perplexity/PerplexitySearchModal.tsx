import React, { useState } from 'react';
import { toast } from 'sonner';
import { functionBridge } from '@/lib/function-bridge';

interface PerplexitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResult: (content: { text: string; query: string; searchId?: string }) => void;
  projectId?: string;
}

export function PerplexitySearchModal({ isOpen, onClose, onSearchResult, projectId }: PerplexitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await functionBridge.perplexitySearch({ query, projectId });

      const answer = data.choices?.[0]?.message?.content;
      onSearchResult({ text: answer, query, searchId: data.searchId });
      toast.success('Search successful!');
      onClose();
    } catch (error) {
      console.error('Perplexity search failed:', error);
      toast.error('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4 text-black">Search the Internet</h2>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your search query..."
          className="w-full p-3 border-2 border-black rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={4}
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-black rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  );
}
