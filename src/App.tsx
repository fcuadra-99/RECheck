import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, Navigate } from 'react-router-dom';
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

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUserSession();
  }, []);

  //fix sesh stuff

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signu" element={<SignupPage />} />
          <Route element={
            <SidebarProvider className='overflow-x-clip'>
              <div className='w-64 fixed h-screen'>
                <AppSidebar />
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
          }>

            <Route path="/" element={<SDashboard />} />
            <Route path="/sdash" element={<SDashboard />} />
            <Route path="/sdash/sub1" element={<STrends />} />
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

// function App() {
//   return (
//     <>
//       <Router>
//         <SidebarProvider>
//           <RadixSidebarDemo/>
//           <div className='bg-background w-screen'>
//             <div className='mt-3 ml-4'>
//             </div>
//             <div className='px-10 py-3'>
//               <Routes>
//                   <Route path="/" element={<SDashboard />} />
//                   <Route path="/sdash" element={<SDashboard />} />
//                   <Route path="/sdevi" element={<SDeviations />} />
//                   <Route path="/ssubm" element={<SSubmissions />} />
//                   <Route path="/login" element={<LoginPage />} />
//                   <Route path="/signu" element={<SignupPage />} />
//               </Routes>
//             </div>
//           </div>
//         </SidebarProvider>
//       </Router>
//       <Button variant="secondary" size="icon" className="size-8 fixed bg-muted hover:bg-sidebar bottom-0 right-0 m-5">
//         <ChevronRightIcon />
//       </Button>
//     </>
//   );
// }

export default App;