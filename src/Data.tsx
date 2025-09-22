import {
  BookCopy,
  GalleryVerticalEnd,
  LayoutDashboard,
  PencilRuler,
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
      { title: "Dashboard Staff", url: "/sdash/staff", role: "Admin Assistant" },
      { title: "Dashboard Researcher", url: "/sdash/sub2", role: "Researcher" },
      { title: "Dashboard Reviewer", url: "/sdash/reviewer", role: "Reviewer" },
      { title: "Dashboard Chairperson", url: "/sdash/chair", role: "Chairperson" },
    ],
  },
  submissions: {
    title: "Submissions",
    url: "/ssubm",
    icon: BookCopy,
    items: [
      { title: "Submissions Staff", url: "/ssubm/sub1", role: "Admin Assistant" },
      { title: "Submissions Researcher", url: "/ssubm/sub2", role: "Researcher" },
      { title: "Submissions Reviewer", url: "/ssubm/reviewer", role: "Reviewer" },
      { title: "Submissions Chairperson", url: "/ssubm/chair", role: "Chairperson" },
    ],
  },
  deviations: {
    title: "Deviations",
    url: "/sdevi",
    icon: PencilRuler,
    items: [
      { title: "Deviations Staff", url: "/sdevi/sub1", role: "Admin Assistant" },
      { title: "Deviations Researcher", url: "/sdevi/sub2", role: "Researcher" },
      { title: "Deviations Reviewer", url: "/sdevi/reviewer", role: "Reviewer" },
      { title: "Deviations Chairperson", url: "/sdevi/chair", role: "Chairperson" },
    ],
  },
  admin: {
    title: "Admin",
    url: "/admin",
    icon: UserCheck,
    items: [
      { title: "User Management", url: "/admin/userroles", role: "Admin" },
    ],
  },
};

// ====== NAV FILTER FUNCTION ======
export function generateNav(role: string): NavItem[] {
  const roleIsAdmin = role === "Admin";
  const roleIsChair = role === "Chairperson";

  return Object.values(navConfig)
    .map((section) => {
      let items = section.items ?? [];

      // Admin sees everything
      if (roleIsAdmin) {
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
