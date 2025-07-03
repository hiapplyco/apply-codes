
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlDialogProps {
  showDialog: boolean;
  urlInput: string;
  isScrapingUrl: boolean;
  onClose: () => void;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
}

export const UrlDialog = ({
  showDialog,
  urlInput,
  isScrapingUrl,
  onClose,
  onUrlChange,
  onSubmit
}: UrlDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] animate-in fade-in-0 zoom-in-95">
        <DialogHeader>
          <DialogTitle>Add Website URL</DialogTitle>
          <DialogDescription>
            Enter the URL of the website you want to analyze. The content will be processed and added to your search.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(event) => onUrlChange(event.target.value)}
              className="w-full"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSubmit();
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!urlInput.trim() || isScrapingUrl}
            >
              {isScrapingUrl ? 'Processing...' : 'Add Content'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
