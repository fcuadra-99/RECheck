import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AppBreadcrumb } from './components/parts/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';

import './App.css';

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { MessageCircle } from 'lucide-react';
import { RadixSidebarDemo as AppSidebar } from './components/parts/neo-sidebar';
import { RippleButton } from './components/animate-ui/buttons/ripple';
import STrends from './pages/staff/Trends';
import { toast } from 'sonner';
import SReview from './pages/staff/Submissions/Review';
import { useEffect, useState } from 'react';
import { supabase } from './DB';
import { type User } from '@supabase/supabase-js';
import Profile from './pages/Profile';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sesh, setSesh] = useState({
    fname: '',
    lname: '',
    email: '',
    org: '',
    avatar: '',
    role: '',
  });

  useEffect(() => {
    const getUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    getUserSession();
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setSesh({
        fname: user?.user_metadata?.fname || '',
        lname: user?.user_metadata?.lname || '',
        email: user?.user_metadata?.email || '',
        org: user?.user_metadata?.org || '',
        avatar: user?.user_metadata?.avatar || '',
        role: user?.user_metadata?.role || '',
      });
    } else {
      setSesh({
        fname: '',
        lname: '',
        email: '',
        org: '',
        avatar: '',
        role: '',
      });
    }
  }, [user]);

  const seshempty = !loading && (!user || (!sesh.fname && !sesh.lname && !sesh.email));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signu" element={<SignupPage />} />
          <Route element={seshempty ? (
            <Navigate to="/login" replace />
          ) : (
            <SidebarProvider className='overflow-x-clip'>
              <div className='w-64 fixed h-screen'>
                <AppSidebar
                  fname={sesh.fname}
                  lname={sesh.lname}
                  email={sesh.email}
                  org={sesh.org}
                  avatar={sesh.avatar}
                  role={sesh.role}
                />
              </div>
              <div className='flex-1 pl-0 md:pl-64 min-w-screen bg-background'>
                <div className='py-3 px-5 pb-3 border-b-2 fixed w-full pointer-events-none'>
                  <AppBreadcrumb />
                </div>
                <div className='pl-7 pr-7 py-12 min-w-full scroll-mx-0 z-50'>
                  <Outlet />
                </div>
              </div>

              <RippleButton variant="secondary" size="icon" className="size-10 fixed bg-muted hover:bg-accent bottom-0 right-0 m-5"
                onClick={() => { toast.success("Test") }}>
                <MessageCircle />
              </RippleButton>
            </SidebarProvider>
          )}>
            <Route path="/" element={<SDashboard />} />
            <Route path="/sdash" element={<SDashboard />} />
            <Route path="/sdash/sub1" element={<STrends />} />
            <Route path="/profile" element={
              <Profile
                fname={sesh.fname}
                lname={sesh.lname}
                email={sesh.email}
                org={sesh.org}
                avatar={sesh.avatar}
                role={sesh.role}
              />} />
            <Route path="/ssubm/sub1/sreview" element={<SReview />} />
            <Route path="/sdevi" element={<SDeviations />} />
            <Route path="/ssubm" element={<SSubmissions />} />
            <Route path="/ssubm/sub1" element={<SSubmissions />} />
            <Route path="*" element={<SDashboard />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}