import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNewAuth } from "@/context/NewAuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useNewAuth();

  useEffect(() => {
    // Redirect to dashboard if user is already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF4] to-[#F5F0ED] relative">
      {/* Back to home link - positioned absolutely */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </button>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#8B5CF6] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Apply</h1>
          <p className="text-gray-600">Find qualified candidates with AI-powered search</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AuthForm redirectTo="/dashboard" />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Login;