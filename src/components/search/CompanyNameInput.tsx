
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface CompanyNameInputProps {
  companyName: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
}

export const CompanyNameInput = ({ companyName, isProcessing, onChange }: CompanyNameInputProps) => {
  if (isProcessing) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="companyName" className="text-xl font-bold">Company Name</Label>
      <Input
        id="companyName"
        placeholder="Enter company name"
        value={companyName}
        onChange={(event) => onChange(event.target.value)}
        className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] focus:ring-0 focus:border-black"
      />
    </div>
  );
};
