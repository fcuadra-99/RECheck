import {
  BookCopy,
  LayoutDashboard,
  PencilRuler,
  Settings,
} from "lucide-react"

export const data = {
  user: {
    name: "shadcn",
    role: "Researcher",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
      url: "",
      icon: Settings,
    },
  ],
  projects: [

  ],
}