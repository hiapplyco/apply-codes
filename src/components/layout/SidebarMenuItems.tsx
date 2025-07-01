
import { memo } from "react";
import { Home, Video, Theater, PhoneCall, MessageSquare, Search, PlusCircle, LayoutDashboard, Clock, User, Users } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Define the menu item type with optional disabled property
export type MenuItem = {
  title: string;
  path: string;
  icon: React.ComponentType<any>;
  disabled?: boolean;
  tooltip?: string;
};

// Memoize menu items array to prevent recreation on each render
export const menuItems: MenuItem[] = [
  { 
    title: 'Sourcing', 
    path: '/sourcing', 
    icon: Search,
    tooltip: 'Generate powerful boolean searches to find perfect candidates across LinkedIn, Indeed, and other platforms'
  },
  { 
    title: 'Search History', 
    path: '/search-history', 
    icon: Clock,
    tooltip: 'View your search database, saved candidates, and manage recruitment projects'
  },
  { 
    title: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard,
    tooltip: 'Access all recruitment tools and see your activity overview'
  },
  { 
    title: 'Screening Room', 
    path: '/screening-room', 
    icon: Video,
    tooltip: 'Conduct AI-assisted video interviews and get instant candidate evaluations'
  },
  { 
    title: 'Meeting', 
    path: '/meeting', 
    icon: Users,
    tooltip: 'All-in-one space for kickoffs, interviews, and screening calls with AI assistance'
  },
  { 
    title: 'Create Content', 
    path: '/content-creation', 
    icon: PlusCircle,
    tooltip: 'Generate engaging LinkedIn posts and job postings to attract top talent'
  },
  { 
    title: 'Chat', 
    path: '/chat', 
    icon: MessageSquare,
    tooltip: 'Your AI recruitment copilot for real-time guidance and task automation'
  },
  { 
    title: 'Profile', 
    path: '/profile', 
    icon: User,
    tooltip: 'Manage your account settings and view usage analytics'
  },
];

// Custom SidebarMenuItem component to handle disabled state
export const SidebarMenuItemWithDisabled = memo(({ 
  item, 
  pathname, 
  navigate 
}: { 
  item: MenuItem; 
  pathname: string; 
  navigate: (path: string) => void;
}) => {
  const { state } = useSidebar();
  const isActive = pathname === item.path;
  const isCollapsed = state === "collapsed";
  
  const buttonContent = (
    <>
      <item.icon className="h-6 w-6" />
      {!isCollapsed && (
        <span className="transition-opacity duration-300">
          {item.title}
          {item.disabled && (
            <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2">
              Disabled
            </span>
          )}
        </span>
      )}
    </>
  );
  
  const buttonClasses = `w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
    isActive 
      ? "text-black bg-white" 
      : item.disabled 
        ? "text-gray-400 cursor-not-allowed" 
        : "text-gray-600 hover:text-gray-900 hover:bg-[#F1F0FB]/50"
  }`;
  
  return (
    <li className="relative py-1">
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={buttonClasses}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
            >
              {buttonContent}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{item.title} {item.disabled && "(Disabled)"}</p>
              {item.tooltip && <p className="text-xs text-gray-600">{item.tooltip}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={buttonClasses}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
            >
              {buttonContent}
            </button>
          </TooltipTrigger>
          {item.tooltip && (
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">{item.tooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </li>
  );
});

SidebarMenuItemWithDisabled.displayName = "SidebarMenuItemWithDisabled";

// Menu content component
export const SidebarMenuContent = memo(({ 
  pathname, 
  handleNavigation 
}: { 
  pathname: string; 
  handleNavigation: (path: string) => void;
}) => {
  return (
    <ul className="flex w-full min-w-0 flex-col gap-1">
      {menuItems.map((item) => (
        <SidebarMenuItemWithDisabled
          key={item.path}
          item={item}
          pathname={pathname}
          navigate={handleNavigation}
        />
      ))}
    </ul>
  );
});

SidebarMenuContent.displayName = "SidebarMenuContent";
