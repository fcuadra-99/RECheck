import {
  BookCopy,
  GalleryVerticalEnd,
  LayoutDashboard,
  PencilRuler,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type {
  User,
  Organization,
  NavItem,
  Submissions,
  AppData, SubmTable
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
  subm: Submissions[]
  projects: unknown[];
};

export const data: AppData = {
  user: {
    fname: "shad",
    lname: "cn",
    //role: "Admin Assistant",
    role: "Chairperson",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
    org: "",
  },
  main: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/sdash",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Dashboard Staff",
          url: "/sdash/sub1",
        },
        {
          title: "Dashboard Researcher",
          url: "/sdash/sub2",
        },
        {
          title: "Dash Reviewer",
          url: "/sdash/sub3",
        },
      ],
    },
    {
      title: "Submissions",
      url: "/ssubm",
      icon: BookCopy,
      isActive: true,
      items: [
        {
          title: "Submissons Staff",
          url: "/ssubm/sub1",
        },
        {
          title: "Submissions Researcher",
          url: "/ssubm/sub2",
        },
        {
          title: "Submissions Reviewer",
          url: "/ssubm/sub3",
        },
      ],
    },
    {
      title: "Deviations",
      url: "/sdevi",
      icon: PencilRuler,
      isActive: true,
      items: [
        {
          title: "Devi Sub1",
          url: "/sdevi/sub1",
        },
        {
          title: "Devi Sub2",
          url: "/sdevi/sub2",
        },
        {
          title: "Devi Sub3",
          url: "/sdevi/sub3",
        },
      ],
    },
  ],
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