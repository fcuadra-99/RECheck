import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AppBreadcrumb } from './components/parts/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';

import './App.css';
import { data } from "@/Data"

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { MessageCircle } from 'lucide-react';
import { RadixSidebarDemo as AppSidebar } from './components/parts/neo-sidebar';
import { RippleButton } from './components/animate-ui/buttons/ripple';
import STrends from './pages/staff/Trends';


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signu" element={<SignupPage />} />

          <Route element={
            <SidebarProvider className='overflow-x-hidden'>
              <div className='w-64 fixed h-screen overflow-x-clip'>
                <AppSidebar />
              </div>
              <div className='flex-1 pl-0 md:pl-64 min-w-screen bg-background'>
                <div className='py-3 px-5 pb-3 border-b-2 fixed w-full z-10 pointer-events-none'>
                  <AppBreadcrumb items={data.navMain} />
                </div>
                <div className='pl-7 pr-7 py-12 min-w-full scroll-mx-0'>
                  <Outlet />
                </div>
              </div>

              <RippleButton variant="secondary" size="icon" className="size-10 fixed bg-muted hover:bg-accent bottom-0 right-0 m-5">
                <MessageCircle />
              </RippleButton>
            </SidebarProvider>

          }>
            <Route path="/" element={<SDashboard />} />
            <Route path="/sdash" element={<SDashboard />} />
            <Route path="/sdash/sub1" element={<STrends />} />
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