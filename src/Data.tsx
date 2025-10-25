import {
  BookCopy,
  ClipboardCheck,
  FileCheck,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings,
  UserCheck,
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
  desktop: number;
  mobile: number;
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
      { title: "My Dashboard", url: "/sdash", role: "Admin Assistant" },
      { title: "My Dashboard", url: "/sdash/sub2", role: "Researcher" },
      { title: "My Dashboard", url: "/sdash/sub2", role: "Reviewer" },
      { title: "My Dashboard", url: "/sdash", role: "Chairperson" },
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
    ],
  },
  deviations: {
    title: "Deviations",
    url: "/sdevi",
    icon: BookCopy,
    items: [
      { title: "Manage Deviations", url: "/sdevi", role: "Admin Assistant" },
      { title: "Report Deviation", url: "/sdevi/report", role: "Researcher" },
      { title: "My Deviations", url: "/sdevi/submitted", role: "Researcher" },
      { title: "Deviations", url: "/chairperson/deviations", role: "Chairperson" },
      { title: "Resolution Reviews", url: "/chairperson/resolution-reviews", role: "Chairperson" },
    ],
  },
  postApproval: {
    title: "Post Approval",
    url: "/researcher/post-approval-forms",
    icon: ClipboardCheck,
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
  admin: {
    title: "Admin",
    url: "/admin",
    icon: UserCheck,
    items: [
      { title: "User Management", url: "/admin/userroles", role: "Admin" },
      { title: "Phase Management", url: "/sdevi/sub2", role: "Admin" },
      { title: "Files Management", url: "/sdevi/sub1", role: "Admin" },

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
  subm: [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ],
  projects: [],
};
