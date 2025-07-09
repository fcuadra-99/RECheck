import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Nav from "./assets/components/Nav";

import SDashboard from "./pages/staff/Dashboard";
import SDeviations from "./pages/staff/Deviations";
import SSubmissions from "./pages/staff/Submission";

import RDashboard from "./pages/researcher/Dashboard";
import RRevisions from "./pages/researcher/Revisions";
import RSubmissions from "./pages/researcher/Submission";

import NoPage from "./pages/NoPage";
import Login from "./assets/components/Login"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Nav />}>
          <Route index element={<Login />} />


          <Route path="sDash" element={<SDashboard />} />
          <Route path="sDevi" element={<SDeviations />} />
          <Route path="sSubm" element={<SSubmissions />} />

          <Route path="rDash" element={<RDashboard />} />
          <Route path="rRevi" element={<RRevisions />} />
          <Route path="rSubm" element={<RSubmissions />} />

          <Route path="*" element={<NoPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);