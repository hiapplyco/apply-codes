
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isGenerating: boolean;
}

export const ChatInput = ({ input, setInput, handleSubmit, isLoading, isGenerating }: ChatInputProps) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask questions about your data..."
        className={cn(
          "border-2 border-black rounded-lg p-4 resize-none max-h-32 overflow-y-auto",
          (isLoading || isGenerating) && "bg-gray-100 text-gray-400"
        )}
        rows={3}
        disabled={isLoading || isGenerating}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          className={cn(
            "bg-purple-600 text-white hover:bg-purple-700",
            "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
            (isLoading || isGenerating || !input.trim()) && "opacity-50 cursor-not-allowed"
          )}
          disabled={isLoading || isGenerating || !input.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send Message'
          )}
        </Button>
      </div>
    </form>
  );
};
