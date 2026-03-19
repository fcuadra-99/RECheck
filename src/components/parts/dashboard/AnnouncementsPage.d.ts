type Profile = {
    fname: string;
    lname: string;
    email: string;
    org: string;
    avatar: string;
    role: string;
} | null;
export interface DashboardStats {
    total: number;
    pending: number;
    completed: number;
}
export type StatsLoader = () => Promise<DashboardStats>;
export interface AnnouncementsPageProps {
    user: any;
    profile: Profile;
    statsLoader: StatsLoader;
}
export default function AnnouncementsPage({ user, profile, statsLoader }: AnnouncementsPageProps): import("react/jsx-runtime").JSX.Element;
export {};
