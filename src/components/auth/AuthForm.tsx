import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { PhoneAuth } from "./PhoneAuth";
import { Mail, Phone } from "lucide-react";

interface AuthFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function AuthForm({ redirectTo, onSuccess }: AuthFormProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  return (
    <div className="space-y-6">
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
        /* Supabase Auth UI for Email/Password */
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                background: '#8B5CF6',
                border: '2px solid black',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 20px',
              },
              input: {
                border: '2px solid black',
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                borderRadius: '4px',
                padding: '10px',
              },
              label: {
                color: '#44332A',
                fontWeight: 'medium',
              },
              loader: {
                color: '#8B5CF6',
              },
              message: {
                color: '#ef4444',
                fontSize: '14px',
                marginTop: '4px',
              },
            },
            variables: {
              default: {
                colors: {
                  brand: '#8B5CF6',
                  brandAccent: '#7c4ef3',
                },
              },
            },
          }}
          theme="light"
          providers={[]} // We're handling social providers ourselves
          redirectTo={redirectTo || `${window.location.origin}/reset-password`}
          onlyThirdPartyProviders={false}
          socialLayout="vertical"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Don't have an account? Sign up",
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create password',
                button_label: 'Sign up',
                loading_button_label: 'Creating account...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
              forgotten_password: {
                link_text: 'Forgot your password?',
                button_label: 'Send reset instructions',
                loading_button_label: 'Sending instructions...',
              },
            },
          }}
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