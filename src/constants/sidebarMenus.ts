

import { LayoutDashboard, BookCopy, User, PencilRuler, Megaphone, FileText, CheckCircle, FileCheck2, FileDown } from "lucide-react";

export const sidebarMenus = {
  Chairperson: [
  { title: "Dashboard", url: "/chairperson/dashboard", icon: LayoutDashboard },
  { title: "Assign Reviewer", url: "/chairperson/assign-reviewer", icon: User },
  { title: "Review Submission", url: "/chairperson/review-submission", icon: BookCopy },
  { title: "Forms Submission", url: "/chairperson/template-submissions", icon: FileText },
  { title: "Deviation Reports", url: "/chairperson/deviations", icon: PencilRuler },
  { title: "Deviation Resolutions", url: "/chairperson/resolution-reviews", icon: CheckCircle },
  { title: "Manage Final Reports", url: "/chairperson/manage-final-reports", icon: FileCheck2 },
  { title: "Create Announcement", url: "/chairperson/create-announcement", icon: Megaphone },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  ],
  Researcher: [
    {
      title: "Dashboard",
  url: "/researcher/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Deviation Submitted",
  url: "/researcher/submissions",
      icon: BookCopy,
    },
    {
      title: "Post Approval Forms",
      url: "/researcher/forms-templates",
      icon: FileText,
    },
    {
      title: "Submitted Forms",
      url: "/researcher/template-submissions",
      icon: FileDown,
    },
    {
      title: "Final Report Submission",
      url: "/researcher/final-reports",
      icon: FileCheck2,
    },
  { title: "Deviation Reports", url: "/rdevi1", icon: PencilRuler },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  ],
  Reviewer: [
    {
      title: "Dashboard",
      url: "/reviewer/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Assigned Reviews",
  
  url: "/reviewerreviews",
      icon: BookCopy,
    },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  ],
};
