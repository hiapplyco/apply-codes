import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useClarvidaAuth } from "@/context/ClarvidaAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";

// Define form schema for validation
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

const ClarvidaLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, isAuthenticated } = useClarvidaAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/clarvida";

  // Initialize form with validation
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (values: AuthFormValues) => {
    setIsLoading(true);

    try {
      let result;

      if (isSignUp) {
        result = await signUp(values.email, values.password);
        if (!result.error) {
          toast.success("Account created! Please check your email for verification.");
        }
      } else {
        result = await signIn(values.email, values.password);
        if (!result.error) {
          toast.success("Successfully signed in to Clarvida!");
          navigate(from, { replace: true });
        }
      }

      if (result.error) {
        console.error("Clarvida auth error:", result.error);
        toast.error(result.error.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Clarvida auth unexpected error:", err);
      toast.error("An unexpected error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src="https://jobs.clarvida.com/system/production/assets/442891/original/pathways-hero.jpg"
          alt="Clarvida team"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/90" />
      </div>

      <div className="max-w-md mx-auto px-4 -mt-20 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#0B8A8A] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0B5B5E]">clarvida</h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Recruitment Tools Platform
          </p>
        </div>

        <Card className="shadow-lg rounded-xl p-8 border border-gray-200 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {isSignUp
                ? "Fill in your details to get started"
                : "Sign in to access your recruitment tools"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@clarvida.com"
                        className="border-gray-300 focus:border-[#0B5B5E] focus:ring-[#0B5B5E]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="border-gray-300 focus:border-[#0B5B5E] focus:ring-[#0B5B5E]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isSignUp && (
                <div className="text-right">
                  <Link
                    to="/reset-password-request"
                    className="text-sm text-[#0B5B5E] hover:text-[#0A4F4F] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#D4A03C] hover:bg-[#C4902C] text-white font-semibold py-3 h-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </span>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-[#0B5B5E] hover:text-[#0A4F4F] font-medium"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Clarvida Recruitment Tools
          </p>
          <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500">
            <a href="https://www.clarvida.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B5B5E]">
              Clarvida.com
            </a>
            <span>|</span>
            <a href="https://jobs.clarvida.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B5B5E]">
              Jobs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClarvidaLogin;
