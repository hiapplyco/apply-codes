
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";

export interface ContentTextareaProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isActive?: boolean;
}

export const ContentTextarea = ({ 
  content, 
  onChange, 
  placeholder = "Enter content here...",
  onFocus,
  onBlur,
  isActive = false
}: ContentTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>("90vh");
  const initialHeight = 200; // Initial height in pixels
  const maxExpansionPercentage = 0.1; // Maximum 10% expansion
  
  // Dynamically calculate max height on mount and window resize
  useEffect(() => {
    const updateMaxHeight = () => {
      // Set to 90% of viewport height as maximum boundary
      const availableHeight = window.innerHeight * 0.9;
      setMaxHeight(`${availableHeight}px`);
    };
    
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);

  // Auto-resize the textarea based on content, with limited expansion
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to initial value
      textareaRef.current.style.height = `${initialHeight}px`;
      
      // Get actual content height
      const contentHeight = textareaRef.current.scrollHeight;
      
      // Calculate maximum allowed height (initial height + 10%)
      const maxAllowedHeight = initialHeight * (1 + maxExpansionPercentage);
      
      // Determine final height (bounded by maxAllowedHeight and maxHeight)
      const maxHeightInPx = parseFloat(maxHeight);
      const finalHeight = Math.min(
        Math.min(contentHeight, maxAllowedHeight),
        maxHeightInPx
      );
      
      // Apply the new height
      textareaRef.current.style.height = `${finalHeight}px`;
    }
  }, [content, maxHeight]);

  const borderClass = isActive 
    ? "border-[#8B5CF6] shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]" 
    : "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]";

  return (
    <Textarea
      ref={textareaRef}
      placeholder={placeholder}
      className={`min-h-[150px] h-[200px] overflow-y-auto border-4 ${borderClass} focus:ring-0 focus:border-[#8B5CF6] transition-all`}
      value={content}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ 
        maxHeight,
        height: `${initialHeight}px`,
        resize: "vertical"
      }}
    />
  );
};
