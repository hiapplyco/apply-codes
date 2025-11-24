import { useState } from "react";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { PhoneAuth } from "./PhoneAuth";
import { Mail, Phone, UserPlus, LogIn } from "lucide-react";
import { FirebaseEmailAuthForm } from "./FirebaseEmailAuthForm";

interface AuthFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function AuthForm({ redirectTo, onSuccess }: AuthFormProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  return (
    <div className="space-y-6">
      {/* Sign In / Sign Up Tabs */}
      <div className="flex rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-6">
        <button
          onClick={() => setView('sign_in')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
            view === 'sign_in'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </button>
        <button
          onClick={() => setView('sign_up')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors border-l-2 border-black ${
            view === 'sign_up'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </button>
      </div>

      {/* Tab Buttons for Email/Phone */}
      <div className="flex rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
            authMethod === 'email'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          onClick={() => setAuthMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors border-l-2 border-black ${
            authMethod === 'phone'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Phone className="h-4 w-4" />
          Phone
        </button>
      </div>
      
      {/* Auth Forms */}
      {authMethod === 'email' ? (
        /* Firebase Email/Password Auth Form */
        <FirebaseEmailAuthForm
          view={view}
          onSuccess={onSuccess}
          redirectTo={redirectTo}
        />
      ) : (
        /* Phone Authentication */
        <PhoneAuth onSuccess={onSuccess} redirectTo={redirectTo} />
      )}
      
      {/* Social Auth Buttons - Google, LinkedIn, etc. */}
      <SocialAuthButtons onSuccess={onSuccess} redirectTo={redirectTo} />
    </div>
  );
}