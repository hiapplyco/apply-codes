
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { UnifiedAuthProvider } from "@/context/UnifiedAuthContext";
import { NewAuthProvider } from "@/context/NewAuthContext";
import { ClarvidaAuthProvider } from "@/context/ClarvidaAuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ClarvidaProtectedRoute } from "@/components/clarvida/ClarvidaProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { PageTransition } from "@/components/layout/PageTransition";

// Import test utility for debugging
import "./utils/testNymeria";

// Import components directly to avoid any potential lazy loading issues
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import { JobPostingPage } from "@/components/jobs/JobPostingPage";
import { JobEditorPage } from "@/components/jobs/JobEditorPage";
import ContentCreationPage from "@/pages/ContentCreationPage";
import Sourcing from "@/pages/Sourcing";
import Chat from "@/pages/Chat";
import Report from "@/pages/Report";
import Clarvida from "@/pages/Clarvida";
import ClarvidaLogin from "@/pages/ClarvidaLogin";
import PasswordReset from "@/pages/PasswordReset";
import ResetPasswordRequest from "@/pages/ResetPasswordRequest";
import SearchHistory from "@/pages/SearchHistory";
import ProjectDetail from "@/pages/ProjectDetail";
import Profile from "@/pages/Profile";
import MarketingIntegrations from "@/pages/MarketingIntegrations";
import Documentation from "@/pages/Documentation";
import Meeting from "@/pages/MeetingSimplified";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Pricing from "@/pages/Pricing";
import { DashboardAnalytics } from "@/pages/DashboardAnalytics";
import { PageTracker } from "@/components/analytics/PageTracker";
// Firebase test pages removed - migration complete

function App() {
  console.log('App component rendering...');
  // Remove the basename configuration to let React Router handle paths naturally
  return (
    <HelmetProvider>
      <UnifiedAuthProvider>
        <NewAuthProvider>
          <ProjectProvider>
            <ClarvidaAuthProvider>
              <Router>
                <PageTracker />
                <Toaster position="top-center" />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                  <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                  <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                  <Route path="/integrations" element={<PageTransition><MarketingIntegrations /></PageTransition>} />
                  <Route path="/auth/callback" element={<PageTransition><AuthCallback /></PageTransition>} />
                  <Route path="/reset-password-request" element={<PageTransition><ResetPasswordRequest /></PageTransition>} />
                  <Route path="/reset-password" element={<PageTransition><PasswordReset /></PageTransition>} />

                  {/* Firebase migration complete - test routes removed */}

                  {/* Clarvida routes - move these to top level for better visibility */}
                  <Route path="/clarvida/login" element={<PageTransition><ClarvidaLogin /></PageTransition>} />
                  <Route path="/clarvida" element={
                    <ClarvidaProtectedRoute>
                      <PageTransition><Clarvida /></PageTransition>
                    </ClarvidaProtectedRoute>
                  } />

                  {/* Protected routes wrapped in MainLayout */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                      <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                      <Route path="/job-post" element={<PageTransition><JobPostingPage /></PageTransition>} />
                      <Route path="/job-editor/:id" element={<PageTransition><JobEditorPage /></PageTransition>} />

                      {/* Redirect old routes */}
                      <Route path="/linkedin-post" element={<Navigate to="/content-creation" replace />} />
                      <Route path="/screening-room" element={<Navigate to="/meeting" replace />} />
                      <Route path="/search-history" element={<Navigate to="/profile" replace />} />

                      <Route path="/content-creation" element={<PageTransition><ContentCreationPage /></PageTransition>} />
                      <Route path="/sourcing" element={<PageTransition><Sourcing /></PageTransition>} />
                      <Route path="/meeting" element={<PageTransition><Meeting /></PageTransition>} />
                      <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
                      <Route path="/report/:jobId" element={<PageTransition><Report /></PageTransition>} />
                      <Route path="/analytics/:jobId" element={<PageTransition><DashboardAnalytics /></PageTransition>} />
                      <Route path="/projects/:projectId" element={<PageTransition><ProjectDetail /></PageTransition>} />
                      <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                      <Route path="/documentation" element={<PageTransition><Documentation /></PageTransition>} />
                    </Route>
                  </Route>

                  {/* Catch all route - ensure SPA routing works correctly on refresh */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Router>
            </ClarvidaAuthProvider>
          </ProjectProvider>
        </NewAuthProvider>
      </UnifiedAuthProvider>
    </HelmetProvider>
  );
}

export default App;
