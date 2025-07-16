import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar';
import { AppBreadcrumb } from './components/app-breadcrumb';
import './App.css';
import { data } from "@/Data"

import SDashboard from './pages/staff/Dashboard';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import SSettings from './pages/staff/Settings';

import { SidebarProvider } from './components/ui/sidebar';

function App() {
  return (
    <Router>
      <SidebarProvider>
        <AppSidebar />
        <div className='bg-background w-screen'>
          <div className='mt-3 ml-4'>
            <AppBreadcrumb items={data.navMain} />
          </div>
          <div className='px-10 py-3'>
            <Routes>
              <Route path="/" element={<SDashboard />} />
              <Route path="/sdash" element={<SDashboard />} />
              <Route path="/sdevi" element={<SDeviations />} />
              <Route path="/ssubm" element={<SSubmissions />} />
              <Route path="/ssett" element={<SSettings />} />
            </Routes>
          </div>
        </div>
      </SidebarProvider>
    </Router>

  );
}

export default App;