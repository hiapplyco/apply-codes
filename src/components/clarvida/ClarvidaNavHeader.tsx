'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClarvidaAuth } from '@/context/ClarvidaAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

export const ClarvidaNavHeader = () => {
  const { signOut, organization } = useClarvidaAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out from Clarvida!');
      router.replace('/clarvida/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Clarvida SVG from website */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => router.push('/clarvida')}
          >
            <img
              src="https://www.clarvida.com/wp-content/uploads/2024/06/Clarvida_Logo_Horizontal_SM-Scaled.svg"
              alt="Clarvida"
              className="h-8 w-auto"
            />
          </div>

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
              <div className="pt-2">
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
