import { type LucideIcon } from "lucide-react";
export type { User, Organization, NavItem, Submissions, AppData, SubmTable, };
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
export declare function generateNav(role: string): NavItem[];
export declare const data: AppData;
