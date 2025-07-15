import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './components/ui/sidebar';
import { SidebarTrigger } from './components/ui/sidebar';
import { Sidenav } from './components/sidenav';
import './App.css'

import SDashboard from './pages/staff/Dashboard';
import SDeviations from './pages/staff/Deviations';
import SSubmissions from './pages/staff/Submissions';

function App() {

  return (
    <Router>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidenav />
          <SidebarTrigger />
          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<SDashboard />} />
              <Route path="/sSubm" element={<SSubmissions />} />
              <Route path="/sDevi" element={<SDeviations />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </Router>
  )
}

export default App
