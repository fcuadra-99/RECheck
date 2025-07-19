import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBreadcrumb } from './components/app-breadcrumb';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

import './App.css';
import { data } from "@/Data"

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { Button } from './components/ui/button';
import { ChevronRightIcon, MessageCircle } from 'lucide-react';
import { RadixSidebarDemo as AppSidebar } from './components/neo-sidebar';
import { RippleButton } from './components/animate-ui/buttons/ripple';
import { Separator } from '@radix-ui/react-separator';



function App() {
  return (
    <>
      <Router>
        <SidebarProvider>
          <div className='flex'>
            <div className='w-64 fixed h-screen'>
              <AppSidebar />
            </div>
            <div className='flex-1 pl-0 md:pl-64 min-w-screen bg-background'> 
              <div className='my-3 mx-4 pb-3 border-b-2'>
                <AppBreadcrumb items={data.navMain} />
              </div>
              <div className='px-10 py-6'>
                <Routes>
                  <Route path="/" element={<SDashboard />} />
                  <Route path="/sdash" element={<SDashboard />} />
                  <Route path="/sdevi" element={<SDeviations />} />
                  <Route path="/ssubm" element={<SSubmissions />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signu" element={<SignupPage />} />
                </Routes>
              </div>
            </div>
          </div>
        </SidebarProvider>
      </Router>
      <RippleButton variant="secondary" size="icon" className="size-10 fixed bg-muted hover:bg-accent bottom-0 right-0 m-5">
        <MessageCircle/>
      </RippleButton>
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