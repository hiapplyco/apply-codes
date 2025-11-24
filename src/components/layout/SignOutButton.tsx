
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import { useNewAuth } from "@/context/NewAuthContext";

export const SignOutButton = memo(function SignOutButton() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { signOut } = useNewAuth();
  
  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success('Successfully signed out!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  }, [navigate, signOut]);
  
  const buttonContent = (
    <>
      <LogOut className="h-5 w-5" />
      {!isCollapsed && <span>Sign Out</span>}
    </>
  );
  
  return isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-[#F1F0FB]/50"
          onClick={handleSignOut}
        >
          {buttonContent}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        Sign Out
      </TooltipContent>
    </Tooltip>
  ) : (
    <Button
      variant="ghost"
      className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-[#F1F0FB]/50"
      onClick={handleSignOut}
    >
      {buttonContent}
    </Button>
  );
});
