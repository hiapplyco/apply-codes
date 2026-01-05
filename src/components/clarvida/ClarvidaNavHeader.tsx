import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClarvidaAuth } from '@/context/ClarvidaAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'ENRICH', path: '/clarvida' },
  {
    label: 'OUR TOOLS',
    children: [
      { label: 'Job Description Builder', path: '/clarvida/sourcing' },
      { label: 'Boolean Search', path: '/clarvida/sourcing' },
      { label: 'Candidate Analysis', path: '/clarvida' },
    ],
  },
  { label: 'CONTENT CREATION', path: '/clarvida/sourcing' },
  { label: 'SOURCING', path: '/clarvida/sourcing' },
];

export const ClarvidaNavHeader = () => {
  const { signOut, session, organization } = useClarvidaAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out from Clarvida!');
      navigate('/clarvida/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/clarvida')}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0B8A8A] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-semibold text-[#0B5B5E]">clarvida</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) =>
              item.children ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-sm font-medium text-gray-700 hover:text-[#0B5B5E] hover:bg-[#0B5B5E]/5"
                    >
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {item.children.map((child) => (
                      <DropdownMenuItem
                        key={child.label}
                        onClick={() => navigate(child.path)}
                        className="cursor-pointer"
                      >
                        {child.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => item.path && navigate(item.path)}
                  className={`text-sm font-medium ${
                    isActive(item.path)
                      ? 'text-[#0B5B5E] bg-[#0B5B5E]/10'
                      : 'text-gray-700 hover:text-[#0B5B5E] hover:bg-[#0B5B5E]/5'
                  }`}
                >
                  {item.label}
                </Button>
              )
            )}
          </nav>

          {/* Right side - User menu */}
          <div className="hidden md:flex items-center gap-4">
            {organization && (
              <span className="text-sm text-gray-600">{organization.name}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label} className="space-y-1">
                    <div className="px-3 py-2 text-sm font-medium text-gray-500">
                      {item.label}
                    </div>
                    {item.children.map((child) => (
                      <Button
                        key={child.label}
                        variant="ghost"
                        onClick={() => {
                          navigate(child.path);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start pl-6 text-sm text-gray-700"
                      >
                        {child.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => {
                      item.path && navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start text-sm ${
                      isActive(item.path)
                        ? 'text-[#0B5B5E] bg-[#0B5B5E]/10'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Button>
                )
              )}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-gray-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
