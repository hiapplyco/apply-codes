
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Users, Briefcase } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchType } from "./types";

export interface SearchTypeToggleProps {
  value: SearchType;
  onValueChange: (value: SearchType) => void;
}

export const SearchTypeToggle = ({ value, onValueChange }: SearchTypeToggleProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="w-full mb-6">
        <Select value={value} onValueChange={(value) => onValueChange(value as SearchType)}>
          <SelectTrigger className="w-full border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <SelectValue placeholder="Select search type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-black">
            <SelectItem value="candidates">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Candidates
              </div>
            </SelectItem>
            <SelectItem value="candidates-at-company">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Candidates at Company
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(value: string) => value && onValueChange(value as SearchType)}
        className="border-4 border-black p-2 rounded-lg bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <ToggleGroupItem 
          value="candidates" 
          aria-label="Search for candidates"
          className="data-[state=on]:bg-[#8B5CF6] data-[state=on]:text-white hover:bg-[#8B5CF6]/20"
        >
          <Users className="h-4 w-4 mr-2" />
          Candidates
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="candidates-at-company" 
          aria-label="Search for candidates at company"
          className="data-[state=on]:bg-[#F97316] data-[state=on]:text-white hover:bg-[#F97316]/20"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Candidates at Company
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
