import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AppBreadcrumb } from './components/parts/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';

import './App.css';

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { RadixSidebarDemo as AppSidebar } from './components/parts/neo-sidebar';
import { toast } from 'sonner';
import { SReview } from './pages/staff/Submissions/Review';
import { useEffect, useState, type JSX } from 'react';
import { supabase } from './DB';
import { type User } from '@supabase/supabase-js';
import Profile from './pages/Profile';
import RSubmissions from './pages/researcher/Submissions';
import RDashboard from './pages/researcher/Dashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import { ChatPopup } from './pages/researcher/ChatComp';
import Testa from './pages/Testa';

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
function AuthRedirect({ user, children }: { user: User | null; children: JSX.Element }) {
  const isVerified = user?.email_confirmed_at || user?.user_metadata?.email_confirmed;

  if (user && !isVerified) {
    toast.error('Please verify your email first!');
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
  if (profile.role === 'researcher') {
    return <Navigate to="/sdash/sub2" replace />;
  }
  return <Navigate to="/sdash/sub1" replace />;
}

// ----------------------------
// Simple Page Not Found
// ----------------------------
function PageNotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">404 - Page Not Found</h1>
    </div>
  );
}

// ----------------------------
// Sidebar Layout Wrapper
// ----------------------------
function SidebarLayout({ profile, user }: { profile: SessionProfile | null; user: User | null }) {
  return (
    <SidebarProvider className="overflow-x-clip">
      <div className="w-64 fixed h-screen">
        <AppSidebar
          fname={profile?.fname ?? ''}
          lname={profile?.lname ?? ''}
          email={profile?.email ?? ''}
          org={profile?.org ?? ''}
          role={profile?.role ?? ''}
          userId={user?.id ?? ''}
        />
      </div>
      <div className="flex-1 pl-0 md:pl-64 min-w-screen bg-background">
        <div className="py-3 px-5 border-b-2 fixed w-full pointer-events-none">
          <AppBreadcrumb />
        </div>
        <div className="pl-7 pr-7 py-12 min-w-full scroll-mx-0 z-50">
          <Outlet />
        </div>
      </div>
      <ChatPopup userId={user?.id ?? ''} />
    </SidebarProvider>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);

  // ----------------------------
  // Get session + listen for auth
  // ----------------------------
  useEffect(() => {
    let mounted = true;

    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    getUserSession().finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ----------------------------
  // Fetch profile if logged in
  // ----------------------------
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setProfile(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('fname,lname,email,org,avatar,role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (mounted) {
          setProfile({
            fname: data?.fname ?? user.user_metadata?.fname ?? '',
            lname: data?.lname ?? user.user_metadata?.lname ?? '',
            email: data?.email ?? user.email ?? '',
            org: data?.org ?? '',
            avatar: data?.avatar ?? user.user_metadata?.avatar ?? '',
            role: data?.role ?? user.user_metadata?.role ?? '',
          });
        }
      } catch {
        if (mounted) {
          setProfile({
            fname: user.user_metadata?.fname ?? '',
            lname: user.user_metadata?.lname ?? '',
            email: user.email ?? '',
            org: '',
            avatar: user.user_metadata?.avatar ?? '',
            role: user.user_metadata?.role ?? '',
          });
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
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

        {/* Not logged in → always go to /login */}
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
              !(user.email_confirmed_at || user.user_metadata?.email_confirmed)
                ? <Navigate to="/login" replace />
                : <SidebarLayout profile={profile} user={user} />
            }
          >
            {profile && <Route path="/" element={<DefaultRedirect profile={profile} />} />}

            <Route path="/sdash" element={<SDashboard />} />
            <Route path="/sdash/sub1" element={<SDashboard />} />
            <Route path="/sdash/sub2" element={<RDashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/sdevi/sub2" element={<Testa />} />

            <Route path="/ssubm" element={<SSubmissions />} />
            <Route path="/ssubm/sub1" element={<SSubmissions />} />
            <Route path="/ssubm/sub1/sreview" element={<SReview />} />
            <Route path="/ssubm/sub2" element={<RSubmissions />} />

            {/* <Route path="/sdevi/sub1" element={<Testa />} /> */}

            <Route path="/sdevi" element={<SDeviations />} />
            <Route path="/admin/userroles" element={<AdminUsersPage />} />

            <Route path="*" element={<PageNotFound />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}
