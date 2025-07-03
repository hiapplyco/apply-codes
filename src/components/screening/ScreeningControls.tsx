
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface DailyCallFrame {
  leave: () => Promise<void>;
  destroy: () => void;
  participants: () => Record<string, unknown>;
  localAudio: () => boolean;
  localVideo: () => boolean;
  setLocalAudio: (enabled: boolean) => Promise<void>;
  setLocalVideo: (enabled: boolean) => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
}

interface ScreeningControlsProps {
  onToggleChat: () => void;
  onScreenShare: () => void;
  callFrame: DailyCallFrame | null;
}

export const ScreeningControls = ({ 
  onToggleChat, 
  onScreenShare,
  callFrame
}: ScreeningControlsProps) => {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveScreening = async () => {
    setIsLeaving(true);
    try {
      // If there's a callFrame, use it to leave the meeting
      if (callFrame) {
        await callFrame.leave();
      }
      
      // Navigate away or do other cleanup
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error leaving screening:', error);
      toast.error('Failed to leave screening properly');
      // Force navigation as a fallback
      window.location.href = '/dashboard';
    } finally {
      setIsLeaving(false);
      setIsLeaveDialogOpen(false);
    }
  };

  return (
    <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave Screening</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this screening session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsLeaveDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLeaveScreening}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
