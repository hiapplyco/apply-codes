import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/context/UnifiedAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn, signUp, isLoading } = useUnifiedAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(isSignUp ? 'Account created successfully!' : 'Successfully signed in!');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-full max-w-md flex flex-col items-center">
          <img
            src="/lovable-uploads/a36a9030-18dd-4eec-bf47-21de5406f97b.png"
            alt="Purple Squirrel"
            className="w-48 h-48 object-contain mb-4"
          />
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-[#8B5CF6] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300">
            Even a blind nut can find a <span className="text-[#8B5CF6] font-extrabold">Purple Squirrel</span>
          </h1>
          <p className="text-gray-600 text-lg text-center">
            Generate powerful search strings for recruiting
          </p>
        </div>
      </div>
      <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#FFFBF4] p-6 rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg text-white font-bold"
          >
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#8B5CF6] hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;