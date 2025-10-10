
        
import ReviewSubmission from './pages/chairperson/ReviewSubmission';
import AssignReviewer from './pages/chairperson/AssignReviewer';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AppBreadcrumb } from './components/parts/app-breadcrumb';
import { SidebarProvider } from './components/ui/sidebar';

import './App.css';
import { data } from "@/Data"

import CorrectiveActionRequest from './pages/chairperson/CorrectiveActionRequest';
import SDashboard from './pages/chairperson/Dashboard';
import CreateAnnouncement from './pages/CreateAnnouncement';
import Message from './pages/Message';
import SSubmissions from './pages/chairperson/Submissions';
import SDeviations from './pages/chairperson/Deviations';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import { MessageCircle } from 'lucide-react';
import { RadixSidebarDemo as AppSidebar } from './components/parts/neo-sidebar';
import { RippleButton } from './components/animate-ui/buttons/ripple';
import STrends from './pages/chairperson/Trends';
import RDeviations from './pages/researcher/Deviations';
import FeedbackDetail from './pages/researcher/FeedbackDetail';
import RSubmissions from './pages/researcher/Submissions';
import DeviationDetail from './pages/chairperson/DeviationDetail';
import DeviationReportForm from './pages/researcher/DeviationReportForm';
import ReviewerDashboard from './pages/reviewer/Dashboard';
import RDashboard from './pages/researcher/Dashboard';
import AssignedReviews from './pages/reviewer/AssignedReviews';
import ReviewDetails from './pages/reviewer/ReviewDetails';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';

import FormsTemplates from './pages/researcher/FormsTemplates';
import ResolutionReviews from './pages/chairperson/ResolutionReviews';
import ResolutionDetail from './pages/chairperson/ResolutionDetail';
import TemplateSubmissions from './pages/chairperson/TemplateSubmissions';
import TemplateSubmissionDetail from './pages/chairperson/TemplateSubmissionDetail';
import ResearcherTemplateSubmissions from './pages/researcher/TemplateSubmissions';
import ResearcherTemplateSubmissionDetail from './pages/researcher/TemplateSubmissionDetail';
import ManageFinalReports from './pages/chairperson/ManageFinalReports';
import FinalReportSubmission from './pages/researcher/FinalReportSubmission';


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
            {/* Chairperson routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <SDashboard />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/dashboard" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <SDashboard />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/trends" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <STrends />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/assign-reviewer" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <AssignReviewer />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/review-submission" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <ReviewSubmission />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/deviations" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <SDeviations />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/deviations/:id" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <DeviationDetail />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/submissions" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <SSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/submissions/detail" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <SSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/create-announcement" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <CreateAnnouncement />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/messages" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <Message />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/corrective-action-request" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <CorrectiveActionRequest />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/resolution-reviews" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <ResolutionReviews />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/resolution-detail/:id" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <ResolutionDetail />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/template-submissions" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <TemplateSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/template-submissions/:id" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <TemplateSubmissionDetail />
              </ProtectedRoute>
            } />
            <Route path="/chairperson/manage-final-reports" element={
              <ProtectedRoute allowedRoles={["Chairperson"]}>
                <ManageFinalReports />
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
            <Route path="/researcher/forms-templates" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <FormsTemplates />
              </ProtectedRoute>
            } />
            <Route path="/researcher/template-submissions" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <ResearcherTemplateSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/researcher/template-submissions/:id" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <ResearcherTemplateSubmissionDetail />
              </ProtectedRoute>
            } />
            <Route path="/researcher/final-reports" element={
              <ProtectedRoute allowedRoles={["Researcher"]}>
                <FinalReportSubmission />
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
            {/* Announcements - accessible to Chairperson, Researcher, Reviewer */}
            <Route path="/announcements" element={
              <ProtectedRoute allowedRoles={["Chairperson","Researcher","Reviewer"]}>
                <Announcements />
              </ProtectedRoute>
            } />
            <Route path="/announcements/:id" element={
              <ProtectedRoute allowedRoles={["Chairperson","Researcher","Reviewer"]}>
                <AnnouncementDetail />
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