
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Search, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SearchHeaderProps } from "../types";

export const SearchHeader = ({
  searchString,
  setSearchString,
  handleSearch,
  handleExport,
  handleCopySearchString,
  isLoading,
  resultsExist
}: SearchHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Google Search Results</h2>
        <div className="space-x-2">
          <Button
            onClick={() => handleSearch?.()}
            disabled={isLoading}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!resultsExist}
            variant="outline"
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg border-2 border-black">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm text-gray-600">Search String:</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopySearchString}
            className="hover:bg-gray-200"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          value={searchString}
          onChange={(event) => setSearchString?.(event.target.value)}
          className="mt-2 font-mono text-sm resize-none focus:ring-2 focus:ring-black"
          rows={4}
        />
      </div>
    </div>
  );
};
