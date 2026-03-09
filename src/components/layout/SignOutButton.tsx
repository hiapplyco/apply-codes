'use client';

import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import { useNewAuth } from "@/context/NewAuthContext";

export const SignOutButton = memo(function SignOutButton() {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { signOut } = useNewAuth();
  
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast.success('Successfully signed out!');
      router.replace('/');
    } catch {
      toast.error('Failed to sign out');
    }
  }, [router, signOut]);
  
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
