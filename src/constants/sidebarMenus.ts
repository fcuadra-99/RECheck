

import { LayoutDashboard, BookCopy, User, PencilRuler, Megaphone, FileText, CheckCircle } from "lucide-react";

export const sidebarMenus = {
  Staff: [
  { title: "Dashboard", url: "/sdash", icon: LayoutDashboard },
  { title: "Assign Reviewer", url: "/sassign-reviewer", icon: User },
  { title: "Review Submission", url: "/sreview-submission", icon: BookCopy },
  { title: "Deviation Management", url: "/sdevi", icon: PencilRuler },
  { title: "Resolution Reviews", url: "/staff/resolution-reviews", icon: CheckCircle },
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
      title: "Forms",
      url: "/researcher/forms",
      icon: FileText,
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
