import { Outlet } from "react-router-dom";
import { useEffect, memo, useState } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { NavigationProgress } from "./NavigationProgress";
import { useNavigation } from "@/hooks/useNavigation";
import { Menu, X } from "lucide-react";
import { SidebarNew } from "./SidebarNew";
import { cn } from "@/lib/utils";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";

const MainLayoutComponent = () => {
  const { isNavigating, progress, handleNavigation, currentPath } = useNavigation();
  const { user, isLoading, isAuthenticated } = useNewAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Define sidebar widths
  const sidebarOpenWidth = "20rem"; // 320px
  const sidebarClosedWidth = "5rem"; // 80px

  return (
    <div className="min-h-screen w-full bg-[#F1F0FB] overflow-hidden">
      {/* Desktop Sidebar - Fixed Position */}
      <div
        className="hidden lg:block fixed left-0 top-0 h-full transition-all duration-300 z-30"
        style={{ width: sidebarOpen ? sidebarOpenWidth : sidebarClosedWidth }}
      >
        <SidebarNew
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          pathname={currentPath}
          handleNavigation={handleNavigation}
          isMobile={false}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <SidebarNew
          isOpen={true}
          onToggle={() => setMobileDrawerOpen(false)}
          pathname={currentPath}
          handleNavigation={handleNavigation}
          isMobile={true}
        />
      </div>

      {/* Main Content - Responsive padding */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        "lg:pl-[5rem]", // Default collapsed width on desktop
        sidebarOpen && "lg:pl-[20rem]" // Expanded width when open
      )}>
        <div className="w-full h-full overflow-x-hidden">
          <div className="p-4 lg:p-6 h-screen flex flex-col">
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <button
                  onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                  className="lg:hidden h-10 w-10 rounded-md border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 flex items-center justify-center shadow-sm"
                >
                  {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <NavigationProgress
                  isNavigating={isNavigating}
                  progress={progress}
                />
              </div>
              <SubscriptionBanner />
              <div
                className={`transition-opacity duration-300 flex-1 min-h-0 ${isNavigating ? 'opacity-50' : 'opacity-100'
                  }`}
              >
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainLayout = memo(MainLayoutComponent);
export default MainLayout;