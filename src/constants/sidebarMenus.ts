

import { LayoutDashboard, BookCopy, User, PencilRuler, Megaphone, FileText, CheckCircle, FileCheck2, FileDown } from "lucide-react";

export const sidebarMenus = {
  Staff: [
  { title: "Dashboard", url: "/sdash", icon: LayoutDashboard },
  { title: "Assign Reviewer", url: "/sassign-reviewer", icon: User },
  { title: "Review Submission", url: "/sreview-submission", icon: BookCopy },
  { title: "Forms Submission", url: "/staff/template-submissions", icon: FileText },
  { title: "Deviation Management", url: "/sdevi", icon: PencilRuler },
  { title: "Resolution Reviews", url: "/staff/resolution-reviews", icon: CheckCircle },
  { title: "Manage Final Reports", url: "/staff/manage-final-reports", icon: FileCheck2 },
  { title: "Create Announcement", url: "/screate-announcement", icon: Megaphone },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  ],
  Researcher: [
    {
      title: "Dashboard",
  url: "/researcher/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Submissions",
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
