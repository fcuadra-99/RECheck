import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar';
import './App.css';

import SDashboard from './pages/staff/Dashboard';
import SDeviations from './pages/staff/Deviations';
import SSubmissions from './pages/staff/Submissions';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

function App() {
  return (
    <Router>
      <SidebarProvider>
        <AppSidebar />
        <div className='bg-background w-screen'>
          <SidebarTrigger />
          <Routes>
            <Route path="/" element={<SDashboard />} />
            <Route path="/dashboard" element={<SDeviations />} />
            <Route path="/submissions" element={<SSubmissions />} />
          </Routes>
        </div>

      </SidebarProvider>

    </Router>

  );
}

export default App;