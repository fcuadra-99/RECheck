import {
  BookCopy,
  GalleryVerticalEnd,
  LayoutDashboard,
  PencilRuler,
  Settings,
  type LucideIcon,
} from "lucide-react"

// Type for user object
type User = {
  name: string;
  role: string;
  email: string;
  avatar: string;
};

// Type for main organization info
type Organization = {
  name: string;
  logo: LucideIcon; // Using LucideIcon type for the icon component
  plan: string;
};

// Type for navigation items (both main and secondary)
type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean; // Optional as it's not present in secondary nav
  items?: {
    title: string;
    url: string;
  }[]; // Optional as secondary nav doesn't have sub-items
};

// Type for the complete data structure
type AppData = {
  user: User;
  main: Organization[];
  navMain: NavItem[];
  navSecondary: NavItem[];
  projects: any[]; // You might want to define a proper type for projects
};

export const data: AppData = {
  user: {
    name: "shadcn",
    role: "Researcher",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
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
          title: "Dash Sub1",
          url: "/sdash/sub1",
        },
        {
          title: "Dash Sub2",
          url: "/sdash/sub2",
        },
        {
          title: "Dash Sub3",
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
          title: "Subm Sub1",
          url: "/ssubm/sub1",
        },
        {
          title: "Subm Sub2",
          url: "/ssubm/sub2",
        },
        {
          title: "Subm Sub3",
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
  projects: [],
};