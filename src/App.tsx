import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState, type JSX } from "react";
import { toast } from "sonner";
import { supabase } from "./DB";
import { type User } from "@supabase/supabase-js";

import { AppBreadcrumb } from "./components/parts/app-breadcrumb";
import { SidebarProvider } from "./components/ui/sidebar";
import { RadixSidebarDemo as AppSidebar } from "./components/parts/neo-sidebar";
import { ChatPopup } from "./pages/researcher/ChatComp";

import SDashboard from "./pages/staff/Dashboard";
import SSubmissions from "./pages/staff/Submissions";
import SDeviations from "./pages/staff/Deviations";
import ChairpersonDeviations from "./pages/chairperson/Deviations";
import DeviationDetail from "./pages/chairperson/DeviationDetail";
import CorrectiveActionRequest from "./pages/chairperson/CorrectiveActionRequest";
import ResolutionReviews from "./pages/chairperson/ResolutionReviews";
import ResolutionDetail from "./pages/chairperson/ResolutionDetail";
import ChairpersonTemplateSubmissions from "./pages/chairperson/TemplateSubmissions";
import ChairpersonTemplateSubmissionDetail from "./pages/chairperson/TemplateSubmissionDetail";
import ManageFinalReports from "./pages/chairperson/ManageFinalReport";
import FinalReportDetail from "./pages/chairperson/FinalReportDetail";
import { SReview } from "./pages/staff/Submissions/Review";
import RDashboard from "./pages/researcher/Dashboard";
import RSubmissions from "./pages/researcher/Submissions";
import FeedbackDetail from "./pages/researcher/FeedbackDetail";
import DeviationReportForm from "./pages/researcher/Deviation";
import RDeviationSubmissions from "./pages/researcher/DeviationSubmitted";
import PostApprovalForms from "./pages/researcher/PostApprovalForms";
import TemplateSubmissions from "./pages/researcher/TemplateSubmissions";
import TemplateSubmissionDetail from "./pages/researcher/TemplateSubmissionDetail";
import FinalReportSubmission from "./pages/researcher/FinalReportSubmission";
import ReviewerPage from "./pages/reviewer/Submissions";
import AdminUsersPage from "./pages/AdminUsersPage";
import Profile from "./pages/Profile";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import Testa from "./pages/Testa";
import Testb from "./pages/Testb";

import "./App.css";
import { ResetForm } from "./components/parts/reset";

// ----------------------------
// Session Profile Interface
// ----------------------------
interface SessionProfile {
  fname: string;
  lname: string;
  email: string;
  org: string;
  avatar: string;
  role: string;
}

// ----------------------------
// Enhanced AuthRedirect that allows reset flow
// ----------------------------
function AuthRedirect({
  user,
  children,
}: {
  user: User | null;
  children: JSX.Element;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check if this is a password reset flow
  const isResetFlow = location.pathname === '/reset' &&
    (searchParams.has('access_token') ||
      (searchParams.has('type') && searchParams.get('type') === 'recovery'));

  // Allow access to reset page even if user has session (this is the key fix)
  if (location.pathname === '/reset' && isResetFlow) {
    return children;
  }

  const isVerified = user?.email_confirmed_at || user?.user_metadata?.email_confirmed;

  if (user && !isVerified && location.pathname !== '/reset') {
    toast.error("Please verify your email first!");
    return <Navigate to="/login" replace />;
  }

  // Don't redirect if user is verified and trying to access reset page
  if (user && isVerified && location.pathname === '/reset') {
    return children;
  }

  if (user && isVerified && location.pathname !== '/reset') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ----------------------------
// Role-based redirect for "/"
// ----------------------------
function DefaultRedirect({ profile }: { profile: SessionProfile }) {
  return (
    <Navigate
      to={profile.role === "researcher" ? "/My_Dashboard" : "/Dashboard"}
      replace
    />
  );
}

// ----------------------------
// Simple 404 Page
// ----------------------------
function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">404 - Page Not Found</h1>
      <Link to="/" className="mt-4 text-blue-500 underline">
        Go Home
      </Link>
    </div>
  );
}

// ----------------------------
// Sidebar Layout
// ----------------------------
function SidebarLayout({
  profile,
  user,
}: {
  profile: SessionProfile | null;
  user: User | null;
}) {
  return (
    <SidebarProvider className="overflow-x-clip">
      <div className="w-64 fixed h-screen">
        <AppSidebar
          fname={profile?.fname ?? ""}
          lname={profile?.lname ?? ""}
          email={profile?.email ?? ""}
          org={profile?.org ?? ""}
          role={profile?.role ?? ""}
          userId={user?.id ?? ""}
        />
      </div>

      <div className="flex-1 pl-0 md:pl-64 min-w-screen bg-background">
        <AppBreadcrumb />
        <div className="pl-7 pr-7 py-16 min-w-full">
          <Outlet />
        </div>
      </div>

      <ChatPopup userId={user?.id ?? ""} />
    </SidebarProvider>
  );
}

// ----------------------------
// Public Layout (for login, signup, reset)
// ----------------------------
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {children}
    </div>
  );
}

// ----------------------------
// Main App Component
// ----------------------------
function AppContent() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check if this is a password reset flow
  const isResetFlow = location.pathname === '/reset' &&
    (searchParams.has('access_token') ||
      (searchParams.has('type') && searchParams.get('type') === 'recovery'));

  // Get Supabase session and listen for changes
  useEffect(() => {
    let mounted = true;

    const getUserSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
        }

        // Special handling: if we're in reset flow, we might have a recovery session
        if (isResetFlow && session) {
          setUser(session.user);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      // Handle password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    getUserSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isResetFlow]);

  // Fetch user profile if logged in (but not for reset flow)
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user || isResetFlow) {
        if (!isResetFlow) {
          setProfile(null);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("fname,lname,email,org,avatar,role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (mounted) {
          setProfile({
            fname: data?.fname ?? user.user_metadata?.fname ?? "",
            lname: data?.lname ?? user.user_metadata?.lname ?? "",
            email: data?.email ?? user.email ?? "",
            org: data?.org ?? "",
            avatar: data?.avatar ?? user.user_metadata?.avatar ?? "",
            role: data?.role ?? user.user_metadata?.role ?? "",
          });
        }
      } catch {
        if (mounted && !isResetFlow) {
          setProfile({
            fname: user.user_metadata?.fname ?? "",
            lname: user.user_metadata?.lname ?? "",
            email: user.email ?? "",
            org: "",
            avatar: user.user_metadata?.avatar ?? "",
            role: user.user_metadata?.role ?? "",
          });
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user, isResetFlow]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - accessible without authentication */}
      <Route
        path="/login"
        element={
          <AuthRedirect user={user}>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/signu"
        element={
          <AuthRedirect user={user}>
            <SignupPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/reset"
        element={
          <PublicLayout>
            <AuthRedirect user={user}>
              <ResetForm />
            </AuthRedirect>
          </PublicLayout>
        }
      />

      {/* Authenticated routes */}
      <Route
        element={
          user && (user.email_confirmed_at || user.user_metadata?.email_confirmed) ? (
            <SidebarLayout profile={profile} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {/* Default redirect based on role */}
        {profile && (
          <Route path="/" element={<DefaultRedirect profile={profile} />} />
        )}

        {/* Dashboard */}
        <Route path="/Dashboard" element={<SDashboard user={user} profile={profile} />} />
        <Route path="/My_Dashboard" element={<SDashboard user={user} profile={profile} />} />
        <Route path="/sdash/sub2" element={<RDashboard user={user} profile={profile} />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Deviations */}
        <Route path="/researcher/deviations/feedback/:id" element={<FeedbackDetail />} />
        <Route path="/researcher/post-approval-forms" element={<PostApprovalForms />} />
        <Route path="/researcher/template-submissions" element={<TemplateSubmissions />} />
        <Route path="/researcher/template-submissions/:id" element={<TemplateSubmissionDetail />} />
        <Route path="/researcher/final-report" element={<FinalReportSubmission />} />
        <Route path="/chairperson/corrective-action-request" element={<CorrectiveActionRequest />} />
        <Route path="/chairperson/deviations/:id" element={<DeviationDetail />} />
        <Route path="/chairperson/deviations" element={<ChairpersonDeviations />} />
        <Route path="/chairperson/resolution-reviews" element={<ResolutionReviews />} />
        <Route path="/chairperson/resolution-detail/:id" element={<ResolutionDetail />} />
        <Route path="/chairperson/template-submissions" element={<ChairpersonTemplateSubmissions />} />
        <Route path="/chairperson/template-submissions/:id" element={<ChairpersonTemplateSubmissionDetail />} />
        <Route path="/chairperson/final-reports" element={<ManageFinalReports />} />
        <Route path="/chairperson/final-reports/:id" element={<FinalReportDetail />} />
        <Route path="/sdevi" element={<SDeviations />} />
        <Route path="/sdevi/sub1" element={<Testa />} />
        <Route path="/sdevi/sub2" element={<Testb />} />
        <Route path="/sdevi/report" element={<DeviationReportForm />} />
        <Route path="/sdevi/submitted" element={<RDeviationSubmissions />} />

        {/* Submissions */}
        <Route path="/ssubm" element={<SSubmissions />} />
        <Route path="/ssubm/sub1" element={<SSubmissions />} />
        <Route path="/ssubm/sub1/sreview" element={<SReview />} />
        <Route path="/ssubm/sub2" element={<RSubmissions />} />
        <Route path="/ssubm/sub3" element={<ReviewerPage />} />

        {/* Admin */}
        <Route path="/admin/userroles" element={<AdminUsersPage />} />
      </Route>

      {/* Fallback routes */}
      <Route path="/" element={
        user ? (
          <Navigate to="/Dashboard" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

// ----------------------------
// Root App Component with Router
// ----------------------------
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}