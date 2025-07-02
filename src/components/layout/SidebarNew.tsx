import { memo, useCallback } from "react";
import { 
  Home, 
  Theater, 
  PhoneCall, 
  MessageSquare, 
  Search, 
  PlusCircle, 
  LayoutDashboard, 
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Plug
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export type MenuItem = {
  title: string;
  path: string;
  icon: React.ComponentType<{className?: string}>;
  disabled?: boolean;
};

const menuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Create Content', path: '/content-creation', icon: PlusCircle },
  { title: 'Sourcing', path: '/sourcing', icon: Search },
  { title: 'Meeting', path: '/meeting', icon: Users },
  { title: 'Integrations', path: '/integrations', icon: Plug },
  { title: 'Profile', path: '/profile', icon: User },
  { title: 'Chat', path: '/chat', icon: MessageSquare },
];

interface SidebarNewProps {
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  handleNavigation: (path: string) => void;
  isMobile: boolean;
}

export const SidebarNew = memo(({ 
  isOpen, 
  onToggle, 
  pathname, 
  handleNavigation,
  isMobile
}: SidebarNewProps) => {
  const navigate = useNavigate();
  
  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully signed out!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  }, [navigate]);

  const handleItemClick = (path: string, disabled?: boolean) => {
    if (disabled) return;
    handleNavigation(path);
    if (isMobile) {
      onToggle(); // Close mobile drawer after navigation
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/Apply2025logo.png" 
            alt="Apply" 
            className={cn(
              "transition-all duration-300",
              isOpen ? "h-10 w-auto" : "h-8 w-8 object-contain"
            )}
          />
          {isOpen && (
            <span className="text-xl font-semibold text-gray-900">Apply</span>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center h-9 w-9 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        )}
        {isMobile && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <nav className="px-3">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleItemClick(item.path, item.disabled)}
                    disabled={item.disabled}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                      isActive 
                        ? "bg-purple-600 text-white shadow-md" 
                        : item.disabled 
                          ? "text-gray-400 cursor-not-allowed opacity-50" 
                          : "text-gray-700 hover:bg-purple-50 hover:text-purple-700",
                      !isOpen && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0 transition-transform duration-200",
                      isOpen ? "h-5 w-5" : "h-6 w-6",
                      !item.disabled && !isActive && "group-hover:scale-110"
                    )} />
                    {isOpen && (
                      <span className="flex-1 text-left">
                        {item.title}
                        {item.disabled && (
                          <span className="text-xs font-medium bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full ml-2">
                            Coming Soon
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-gray-50">
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
            "text-red-600 hover:bg-red-600 hover:text-white",
            !isOpen && "justify-center px-2"
          )}
        >
          <LogOut className={cn(
            "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
            isOpen ? "h-5 w-5" : "h-6 w-6"
          )} />
          {isOpen && <span className="flex-1 text-left font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
});

SidebarNew.displayName = "SidebarNew";