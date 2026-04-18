import {
  BookCopy,
  BookDashed,
  ClipboardCheck,
  ClipboardEditIcon,
  FileCheck,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings,
  UserCheck,
  History,
  type LucideIcon,
} from "lucide-react"

export type {
  User,
  Organization,
  NavItem,
  Submissions,
  AppData,
  SubmTable,
};

type User = {
  fname: string;
  lname: string;
  role: string;
  email: string;
  avatar: string;
  org: string;
};

type Organization = {
  name: string;
  logo: LucideIcon;
  plan: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    role: string;
  }[];
};

type SubmTable = {
  proposal_id: string;
  proposal_title: string;
  status: string;
};

type Submissions = {
    month: string;
    External: number;
    Graduate: number;
    Undergraduate: number;
};

type AppData = {
  user: User;
  main: Organization[];
  navMain: NavItem[];
  navSecondary: NavItem[];
  subm: Submissions[];
  projects: unknown[];
};

// ====== BASE NAV CONFIG ======
const navConfig = {
  dashboard: {
    title: "Dashboard",
    url: "/sdash",
    icon: LayoutDashboard,
    items: [
      { title: "My Dashboard", url: "/sdash/sub1", role: "Admin Assistant" },
      { title: "My Dashboard", url: "/sdash/sub1", role: "Researcher" },
      { title: "My Dashboard", url: "/sdash/sub1", role: "Reviewer" },
      { title: "My Dashboard", url: "/sdash/sub1", role: "Chairperson" },
    ],
  },
  submissions: {
    title: "Submissions",
    url: "/ssubm",
    icon: BookCopy,
    items: [
      { title: "Manage Submissions", url: "/ssubm/sub1", role: "Admin Assistant" },
      { title: "Manage Submissions", url: "/ssubm/sub1", role: "Chairperson" },
      { title: "My Submissions", url: "/ssubm/sub2", role: "Researcher" },
      { title: "Review Submissions", url: "/ssubm/sub3", role: "Reviewer" },
      { title: "Review Submissions", url: "/ssubm/sub3", role: "Chairperson" },
      { title: "Advisor Submissions", url: "/ssubm/sub4", role: "Advisor" },
      { title: "Advisor Submissions", url: "/ssubm/sub4", role: "Admin" },
    ],
  },
  deviations: {
    title: "Deviations",
    url: "/sdevi",
    icon: BookDashed,
    items: [
      { title: "Report Deviation", url: "/sdevi/report", role: "Researcher" },
      { title: "My Deviations", url: "/sdevi/submitted", role: "Researcher" },
      { title: "Deviations", url: "/chairperson/deviations", role: "Chairperson" },
      { title: "Resolution Reviews", url: "/chairperson/resolution-reviews", role: "Chairperson" },
    ],
  },
  postApproval: {
    title: "Post Approval",
    url: "/researcher/post-approval-forms",
    icon: ClipboardEditIcon,
    items: [
      { title: "New Form", url: "/researcher/post-approval-forms", role: "Researcher" },
      { title: "Forms Submitted", url: "/researcher/template-submissions", role: "Researcher" },
    ],
  },
  finalReports: {
    title: "Final Reports",
    url: "/researcher/final-report",
    icon: FileCheck,
    items: [
      { title: "My Reports", url: "/researcher/final-report", role: "Researcher" },
      { title: "Manage Reports", url: "/chairperson/final-reports", role: "Chairperson" },
      { title: "Assigned Reports", url: "/reviewer/final-reports", role: "Reviewer" },
      { title: "Assigned Reports", url: "/staff/final-reports", role: "Admin Assistant" },
    ],
  },
  formsReview: {
    title: "Post Approval Forms",
    url: "/chairperson/template-submissions",
    icon: ClipboardCheck,
    items: [
      { title: "Submissions", url: "/chairperson/template-submissions", role: "Chairperson" },
    ],
  },
  reviewerFormsReview: {
    title: "Assigned Forms",
    url: "/reviewer/template-submissions",
    icon: ClipboardCheck,
    items: [
      { title: "Assigned Forms", url: "/reviewer/template-submissions", role: "Reviewer" },
    ],
  },
  staffFormsReview: {
    title: "Assigned Forms",
    url: "/staff/template-submissions",
    icon: ClipboardCheck,
    items: [
      { title: "Assigned Forms", url: "/staff/template-submissions", role: "Admin Assistant" },
    ],
  },
  researcherHistory: {
    title: "Researcher History",
    url: "/chairperson/researcher-history",
    icon: History,
    items: [
      { title: "View History", url: "/chairperson/researcher-history", role: "Chairperson" },
    ],
  },
  admin: {
    title: "Admin",
    url: "/admin",
    icon: UserCheck,
    items: [
      { title: "User Management", url: "/admin/userroles", role: "Admin" },
      { title: "Document Management", url: "/admin/documents", role: "Admin" },
      { title: "Document Prototype", url: "/admin/documents-prototype", role: "Admin" },
      { title: "Phase Management", url: "/admin/phases", role: "Admin" },
    ],
  },
};

// ====== NAV FILTER FUNCTION ======
export function generateNav(role: string): NavItem[] {
  const roleIsAdmin = role === "Admin";
  const roleIsChair = role === "Chairperson";

  const filteredNav = Object.values(navConfig)
    .map((section) => {
      let items = section.items ?? [];

      // Admin sees everything
      if (roleIsAdmin) {
        // Remove duplicate child items by title within this section
        const uniqueItems = new Map();
        items.forEach(item => {
          if (!uniqueItems.has(item.title)) {
            uniqueItems.set(item.title, item);
          }
        });
        items = Array.from(uniqueItems.values());

        return {
          ...section,
          isActive: true,
          items,
        };
      }

      // Chairperson sees ONLY Chairperson items
      if (roleIsChair) {
        if (section.title === "Admin") {
          return null; // skip Admin section entirely
        }
        items = items.filter((i) => i.role === "Chairperson");

        return items.length > 0
          ? { ...section, isActive: true, items }
          : null;
      }

      // Everyone else gets only their allowed sub-items
      items = items.filter((i) => i.role === role);

      return items.length > 0
        ? { ...section, isActive: true, items }
        : null;
    })
    .filter(Boolean) as NavItem[];

  return filteredNav;
}

// ====== APP DATA ======
export const data: AppData = {
  user: {
    fname: "shad",
    lname: "cn",
    role: "Chairperson", // change dynamically
    email: "m@example.com",
    avatar: "/avatars/avatar.png",
    org: "",
  },
  main: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: generateNav("Admin"),
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ],
  subm: [],
  projects: [],
};
