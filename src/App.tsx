
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ClarvidaAuthProvider } from "@/context/ClarvidaAuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClarvidaProtectedRoute } from "@/components/clarvida/ClarvidaProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";

// Import test utility for debugging
import "./utils/testNymeria";

// Import components directly to avoid any potential lazy loading issues
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import { JobPostingPage } from "@/components/jobs/JobPostingPage";
import { JobEditorPage } from "@/components/jobs/JobEditorPage";
import ContentCreationPage from "@/pages/ContentCreationPage";
import Sourcing from "@/pages/Sourcing";
import ScreeningRoom from "@/pages/ScreeningRoom";
import InterviewPrep from "@/pages/InterviewPrep";
import KickoffCall from "@/pages/KickoffCall";
import { KickoffCallPage } from "@/components/interview/KickoffCallPage";
import Chat from "@/pages/Chat";
import Report from "@/pages/Report";
import Clarvida from "@/pages/Clarvida";
import ClarvidaLogin from "@/pages/ClarvidaLogin";
import PasswordReset from "@/pages/PasswordReset";
import ResetPasswordRequest from "@/pages/ResetPasswordRequest";
import SearchHistory from "@/pages/SearchHistory";
import ProjectDetail from "@/pages/ProjectDetail";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";

function App() {
  // Remove the basename configuration to let React Router handle paths naturally
  return (
    <AuthProvider>
      <ProjectProvider>
        <ClarvidaAuthProvider>
          <Router>
            <Toaster position="top-center" />
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password-request" element={<ResetPasswordRequest />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            
            {/* Clarvida routes - move these to top level for better visibility */}
            <Route path="/clarvida/login" element={<ClarvidaLogin />} />
            <Route path="/clarvida" element={
              <ClarvidaProtectedRoute>
                <Clarvida />
              </ClarvidaProtectedRoute>
            } />

            {/* Protected routes wrapped in MainLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/job-post" element={<JobPostingPage />} />
                <Route path="/job-editor/:id" element={<JobEditorPage />} />
                
                {/* Redirect old linkedin-post route to content-creation */}
                <Route path="/linkedin-post" element={<Navigate to="/content-creation" replace />} />
                
                <Route path="/content-creation" element={<ContentCreationPage />} />
                <Route path="/sourcing" element={<Sourcing />} />
                <Route path="/screening-room" element={<ScreeningRoom />} />
                <Route path="/interview-prep" element={<InterviewPrep />} />
                <Route path="/kickoff-call" element={<KickoffCall />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/report/:jobId" element={<Report />} />
                <Route path="/search-history" element={<SearchHistory />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Catch all route - ensure SPA routing works correctly on refresh */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ClarvidaAuthProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
