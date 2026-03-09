'use client';

import { memo, useCallback } from "react";
import {
  MessageSquare,
  Search,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Book,
  UserSearch,
  Video,
  Briefcase,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useNewAuth } from "@/context/NewAuthContext";

export type MenuItem = {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  /** Additional path prefixes that should highlight this item */
  matchPrefixes?: string[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "RECRUIT",
    items: [
      { title: "Search", path: "/sourcing", icon: Search },
      { title: "Contact Finder", path: "/enrichment", icon: UserSearch },
      {
        title: "Job Posting",
        path: "/job-post",
        icon: Briefcase,
        matchPrefixes: ["/job-editor"],
      },
    ],
  },
  {
    label: "ENGAGE",
    items: [
      { title: "Interviews", path: "/meeting", icon: Video },
      { title: "AI Assistant", path: "/chat", icon: MessageSquare },
      { title: "Content Studio", path: "/content-creation", icon: PlusCircle },
    ],
  },
];

const dashboardItem: MenuItem = {
  title: "Dashboard",
  path: "/dashboard",
  icon: LayoutDashboard,
  matchPrefixes: ["/report", "/analytics", "/projects"],
};

const bottomItems: MenuItem[] = [
  { title: "Documentation", path: "/documentation", icon: Book },
  { title: "Settings", path: "/profile", icon: Settings },
];

function isItemActive(item: MenuItem, pathname: string): boolean {
  if (pathname === item.path) return true;
  if (item.matchPrefixes) {
    return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }
  return false;
}

interface SidebarNewProps {
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  handleNavigation: (path: string) => void;
  isMobile: boolean;
}

const NavButton = memo(({
  item,
  isActive,
  isOpen,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <li>
    <button
      onClick={onClick}
      disabled={item.disabled}
      title={!isOpen ? item.title : undefined}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group min-h-[44px]",
        isActive
          ? "bg-purple-600 text-white shadow-md"
          : item.disabled
            ? "text-gray-400 cursor-not-allowed opacity-50"
            : "text-gray-700 hover:bg-purple-50 hover:text-purple-700",
        !isOpen && "justify-center px-2"
      )}
    >
      <item.icon
        className={cn(
          "flex-shrink-0 transition-transform duration-200",
          "h-5 w-5",
          !item.disabled && !isActive && "group-hover:scale-110"
        )}
      />
      {isOpen && (
        <span className="flex-1 text-left text-sm">
          {item.title}
          {item.disabled && (
            <span className="text-xs font-medium bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full ml-2">
              Soon
            </span>
          )}
        </span>
      )}
    </button>
  </li>
));
NavButton.displayName = "NavButton";

export const SidebarNew = memo(({
  isOpen,
  onToggle,
  pathname,
  handleNavigation,
  isMobile,
}: SidebarNewProps) => {
  const router = useRouter();
  const { signOut } = useNewAuth();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast.success("Successfully signed out!");
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  }, [router, signOut]);

  const handleItemClick = useCallback(
    (path: string, disabled?: boolean) => {
      if (disabled) return;
      handleNavigation(path);
      if (isMobile) onToggle();
    },
    [handleNavigation, isMobile, onToggle]
  );

  return (
    <div className="h-screen flex flex-col bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className={cn("flex items-center", isOpen ? "flex-1 justify-center" : "")}>
          <img
            src="/assets/apply-logo-gradient.png"
            alt="Apply"
            className={cn(
              "transition-all duration-300 object-contain",
              isOpen ? "h-12" : "h-10"
            )}
          />
        </div>
        {!isMobile && (
          <button
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden lg:flex items-center justify-center h-9 w-9 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex-shrink-0 ml-2"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        )}
        {isMobile && (
          <button
            onClick={onToggle}
            aria-label="Close sidebar"
            className="flex items-center justify-center h-11 w-11 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <nav aria-label="Main navigation" className="px-3 flex flex-col gap-1">
          {/* Dashboard — standalone at top */}
          <ul className="space-y-1">
            <NavButton
              item={dashboardItem}
              isActive={isItemActive(dashboardItem, pathname)}
              isOpen={isOpen}
              onClick={() => handleItemClick(dashboardItem.path)}
            />
          </ul>

          {/* Grouped sections */}
          {menuGroups.map((group) => (
            <div key={group.label} className="mt-4">
              {isOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    {group.label}
                  </span>
                </div>
              )}
              {!isOpen && <div className="border-t border-gray-200 my-2 mx-2" />}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavButton
                    key={item.path}
                    item={item}
                    isActive={isItemActive(item, pathname)}
                    isOpen={isOpen}
                    onClick={() => handleItemClick(item.path, item.disabled)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom pinned items */}
      <div className="border-t border-gray-200 px-3 py-2 flex-shrink-0">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={isItemActive(item, pathname)}
              isOpen={isOpen}
              onClick={() => handleItemClick(item.path, item.disabled)}
            />
          ))}
        </ul>
      </div>

      {/* Sign Out */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-gray-50">
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group min-h-[44px]",
            "text-red-600 hover:bg-red-600 hover:text-white",
            !isOpen && "justify-center px-2"
          )}
        >
          <LogOut
            className={cn(
              "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
              isOpen ? "h-5 w-5" : "h-5 w-5"
            )}
          />
          {isOpen && <span className="flex-1 text-left text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
});

SidebarNew.displayName = "SidebarNew";
