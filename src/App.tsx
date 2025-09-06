
        
import ReviewSubmission from './pages/staff/ReviewSubmission';
import AssignReviewer from './pages/staff/AssignReviewer';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AppBreadcrumb } from './components/parts/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';

import './App.css';
import { data } from "@/Data"

import CorrectiveActionRequest from './pages/staff/CorrectiveActionRequest';
import SDashboard from './pages/staff/Dashboard';
import CreateAnnouncement from './pages/CreateAnnouncement';
import Message from './pages/Message';
import SSubmissions from './pages/staff/Submissions';
import SDeviations from './pages/staff/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { MessageCircle } from 'lucide-react';
import { RadixSidebarDemo as AppSidebar } from './components/parts/neo-sidebar';
import { RippleButton } from './components/animate-ui/buttons/ripple';
import STrends from './pages/staff/Trends';
import RDeviations from './pages/researcher/Deviations';
import FeedbackDetail from './pages/researcher/FeedbackDetail';
import RSubmissions from './pages/researcher/Submissions';
import DeviationDetail from './pages/staff/DeviationDetail';
import DeviationReportForm from './pages/researcher/DeviationReportForm';
import ReviewerDashboard from './pages/reviewer/Dashboard';
import RDashboard from './pages/researcher/Dashboard';
import AssignedReviews from './pages/reviewer/AssignedReviews';
import ReviewDetails from './pages/reviewer/ReviewDetails';
import Announcements from './pages/Announcements';
import RForms from './pages/researcher/Forms';
import ResolutionReviews from './pages/staff/ResolutionReviews';
import ResolutionDetail from './pages/staff/ResolutionDetail';


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
            {/* Staff routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SDashboard />
              </ProtectedRoute>
            } />
            <Route path="/sdash" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SDashboard />
              </ProtectedRoute>
            } />
            <Route path="/sdash/sub1" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <STrends />
              </ProtectedRoute>
            } />
            <Route path="/sassign-reviewer" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <AssignReviewer />
              </ProtectedRoute>
            } />
            <Route path="/sreview-submission" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <ReviewSubmission />
              </ProtectedRoute>
            } />
            <Route path="/sdevi" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SDeviations />
              </ProtectedRoute>
            } />
            <Route path="/staff/deviations/:id" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <DeviationDetail />
              </ProtectedRoute>
            } />
            <Route path="/ssubm" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/ssubm/sub1" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <SSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/screate-announcement" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <CreateAnnouncement />
              </ProtectedRoute>
            } />
            <Route path="/smessages" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <Message />
              </ProtectedRoute>
            } />
            <Route path="/staff/corrective-action-request" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <CorrectiveActionRequest />
              </ProtectedRoute>
            } />
            <Route path="/staff/resolution-reviews" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <ResolutionReviews />
              </ProtectedRoute>
            } />
            <Route path="/staff/resolution-detail/:id" element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <ResolutionDetail />
              </ProtectedRoute>
            } />
            {/* Reviewer routes */}
            <Route path="/reviewer/dashboard" element={
              <ProtectedRoute allowedRoles={["Reviewer"]}>
                <ReviewerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reviewerreviews" element={
              <ProtectedRoute allowedRoles={["Reviewer"]}>
                <AssignedReviews />
              </ProtectedRoute>
            } />
            <Route path="/reviewer/review-details" element={
              <ProtectedRoute allowedRoles={["Reviewer"]}>
                <ReviewDetails />
              </ProtectedRoute>
            } />
            {/* Researcher routes */}
            <Route path="/researcher/dashboard" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <RDashboard />
              </ProtectedRoute>
            } />
            <Route path="/researcher/feedback/:id" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <FeedbackDetail />
              </ProtectedRoute>
            } />
            <Route path="/researcher/submissions" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <RSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/researcher/forms" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <RForms />
              </ProtectedRoute>
            } />
            {/* Researcher deviation routes */}
            <Route path="/rdevi" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <RDeviations />
              </ProtectedRoute>
            } />
            <Route path="/rdevi1" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <DeviationReportForm />
              </ProtectedRoute>
            } />
            {/* Announcements - accessible to Staff, Researcher, Reviewer */}
            <Route path="/announcements" element={
              <ProtectedRoute allowedRoles={["Staff","Researcher","Reviewer"]}>
                <Announcements />
              </ProtectedRoute>
            } />
            {/* Fallback */}
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