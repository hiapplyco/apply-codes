'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const ClarvidaFooter = () => {
  const router = useRouter();

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Corporate Opportunities */}
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Recruitment Tools
            </h2>
            <p className="text-gray-600 mb-6">
              Access powerful AI-driven recruitment tools to streamline your hiring process.
              Build job descriptions, generate boolean searches, and analyze candidates.
            </p>
            <Button
              onClick={() => router.push('/clarvida/sourcing')}
              className="bg-[#D4A03C] hover:bg-[#C4902C] text-white"
            >
              Get Started
            </Button>
          </div>

          {/* Support */}
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Need Help?
            </h2>
            <p className="text-gray-600 mb-6">
              Our team is here to support you. Whether you need assistance with
              the tools or have questions about best practices, we're ready to help.
            </p>
            <Button
              variant="outline"
              className="border-[#0B5B5E] text-[#0B5B5E] hover:bg-[#0B5B5E] hover:text-white"
            >
              Contact Support
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0B8A8A] flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} Clarvida Recruitment Tools
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="https://www.clarvida.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B5B5E]">
                Clarvida.com
              </a>
              <a href="https://jobs.clarvida.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B5B5E]">
                Jobs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
