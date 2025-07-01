import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface NoContactInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  candidateName: string;
}

export const NoContactInfoDialog: React.FC<NoContactInfoDialogProps> = ({
  isOpen,
  onClose,
  onSearch,
  candidateName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <span className="text-6xl">😔</span>
            <span>No Contact Info Available</span>
          </DialogTitle>
          <DialogDescription className="pt-4 space-y-3">
            <p className="text-base">
              Sorry, we couldn't find any contact information for <strong>{candidateName}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>What this means:</strong> This person hasn't made their contact information publicly available, 
                and even with our advanced data collection and enrichment capabilities, we're unable to locate it.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              You can try searching manually with different parameters, or move on to other candidates.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button
            onClick={() => {
              onSearch();
              onClose();
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Manually
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};