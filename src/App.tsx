import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, Link } from "react-router-dom";
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
// Redirect wrapper for login/signup
// ----------------------------
function AuthRedirect({
  user,
  children,
}: {
  user: User | null;
  children: JSX.Element;
}) {
  const isVerified = user?.email_confirmed_at || user?.user_metadata?.email_confirmed;

  if (user && !isVerified) {
    toast.error("Please verify your email first!");
    return <Navigate to="/login" replace />;
  }

  if (user && isVerified) {
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
      to={profile.role === "researcher" ? "/sdash/sub2" : "/sdash/sub1"}
      replace
    />
  );
}

// ----------------------------
// Simple 404 Page
// ----------------------------
function PageNotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">404 - Page Not Found</h1>
      <Link to="/" className="ml-3 text-blue-500 underline">
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
        <div className="pl-7 pr-7 py-16 min-w-full z-50 bg-red-50">
          <Outlet />
        </div>
      </div>

      <ChatPopup userId={user?.id ?? ""} />
    </SidebarProvider>
  );
}

// ----------------------------
// App Component
// ----------------------------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);

  // Get Supabase session and listen for changes
  useEffect(() => {
    let mounted = true;

    const getUserSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    getUserSession();

    return () => {
      mounted = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

  // Fetch user profile if logged in
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
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
        if (mounted) {
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
  }, [user]);

  // Loading state
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public pages */}
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

        {/* If not logged in → always redirect to /login */}
        {!user && (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<PageNotFound />} />
          </>
        )}

        {/* Authenticated layout */}
        {user && (
          <Route
            element={
              !(user.email_confirmed_at || user.user_metadata?.email_confirmed) ? (
                <Navigate to="/login" replace />
              ) : (
                <SidebarLayout profile={profile} user={user} />
              )
            }
          >
            {profile && (
              <Route path="/" element={<DefaultRedirect profile={profile} />} />
            )}

            {/* Dashboard */}
            <Route path="/sdash" element={<SDashboard user={user} profile={profile} />} />
            <Route path="/sdash/sub1" element={<SDashboard user={user} profile={profile} />} />
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

            {/* Fallback */}
            <Route path="*" element={<PageNotFound />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}
