import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBreadcrumb } from './components/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';


import './App.css';
import { data } from "@/Data"

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { Button } from './components/ui/button';
import { ChevronRightIcon } from 'lucide-react';
import { RadixSidebarDemo } from './components/neo-sidebar';



function App() {
  return (
    <>
      <Router>
        <SidebarProvider>
          <RadixSidebarDemo />
          <div className='bg-background w-screen'>
            <div className='mt-3 ml-4'>
            </div>
            <div className='px-10 py-3'>
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
        </SidebarProvider>
      </Router>
      <Button variant="secondary" size="icon" className="size-8 fixed bg-muted hover:bg-sidebar bottom-0 right-0 m-5">
        <ChevronRightIcon />
      </Button>
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