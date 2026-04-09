import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/DB";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
    history_id: number;
    history_date: string;
    history_type: string | null;
    paper_id: number | null;
    comment: string | null;
    action: string | null;
    status?: string | null;
    proposal_title?: string;
    proposal_status?: string;
    read?: boolean;
}

interface NotificationBellProps {
    userId: string;
}

const STORAGE_KEY = "read_notifications";

const getReadNotifications = (): Set<number> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return new Set(stored ? JSON.parse(stored) : []);
    } catch {
        return new Set();
    }
};

const saveReadNotifications = (readIds: Set<number>) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch (error) {
        console.error("Failed to save read notifications:", error);
    }
};

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [open, setOpen] = useState(false);
    const [readNotifications, setReadNotifications] = useState<Set<number>>(getReadNotifications());
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: proposals } = await supabase
                .from("proposals")
                .select("proposal_id, proposal_title, status")
                .eq("researcher", userId);

            if (!proposals || proposals.length === 0) {
                setNotifications([]);
                setHasUnread(false);
                return;
            }

            const proposalIds = proposals.map(p => p.proposal_id);

            const { data: history } = await supabase
                .from("history")
                .select("*")
                .in("paper_id", proposalIds)
                .order("history_date", { ascending: false })
                .limit(50);

            if (!history) return;

            const notificationsWithTitles = history.map(h => {
                const proposal = proposals.find(p => p.proposal_id === h.paper_id);
                return {
                    ...h,
                    proposal_title: proposal?.proposal_title || "Unknown Proposal",
                    proposal_status: proposal?.status || "",
                };
            });

            setNotifications(notificationsWithTitles);

            const currentReadIds = getReadNotifications();
            const hasNewNotifications = notificationsWithTitles.some(
                n => !currentReadIds.has(n.history_id)
            );
            setHasUnread(hasNewNotifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        fetchNotifications();

        const historyChannel = supabase
            .channel(`history-changes-${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'history' },
                () => { fetchNotifications(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(historyChannel);
        };
    }, [userId, fetchNotifications]);

    // Mark all as read when dropdown opens
    useEffect(() => {
        if (open && notifications.length > 0) {
            const newReadIds = new Set(readNotifications);
            notifications.forEach(n => newReadIds.add(n.history_id));
            setReadNotifications(newReadIds);
            saveReadNotifications(newReadIds);
            setHasUnread(false);
        }
        if (!open) setPage(1);
    }, [open]);

    const getNotificationMessage = (notification: Notification): { main: string; subtext: string } => {
        const action = notification.action || notification.history_type || "";
        const status = notification.status || "";

        if (action === "ADVISOR_APPROVED") {
            if (status === "Forms Check" || status.includes("Forms")) {
                return { main: "Advisor approved Phase 3 forms", subtext: `Moved to: ${status}` };
            }
            return { main: "Advisor approved your proposal", subtext: `Moved to: ${status}` };
        }
        if (action === "ADVISOR_REJECTED") {
            return { main: "Advisor rejected your submission", subtext: `Moved to: ${status}` };
        }
        if (action === "Submit Phase") {
            const phaseInfo = getPhaseFromStatus(status);
            return {
                main: phaseInfo ? `${phaseInfo} submitted` : "Phase submitted",
                subtext: `Moved to: ${status}`
            };
        }
        if (action === "Submit Revisions") {
            return { main: "Revisions submitted", subtext: `Moved to: ${status}` };
        }
        if (action.includes("APPROVE") || action.includes("approve")) {
            return { main: "Submission approved", subtext: status ? `Moved to: ${status}` : "" };
        }
        if (action.includes("REJECT") || action.includes("reject")) {
            return { main: "Submission requires revision", subtext: status ? `Moved to: ${status}` : "" };
        }
        if (action.includes("ASSIGN") || action.includes("assign")) {
            return { main: "Reviewer assigned to your submission", subtext: "" };
        }
        if (notification.comment) {
            return { main: notification.comment, subtext: status ? `Moved to: ${status}` : "" };
        }
        return { main: "Update on your submission", subtext: status ? `Moved to: ${status}` : "" };
    };

    const getPhaseFromStatus = (status: string): string | null => {
        if (status.includes("Manuscript") || status === "Check Manuscript" || status === "Resend Manuscript") {
            return "Phase 1: Manuscript";
        }
        if (status === "Risk Assessment") {
            return "Phase 2: Risk Assessment";
        }
        if (status.includes("Forms") || status === "Send Forms" || status === "Forms Check" || status === "Resend Forms") {
            return "Phase 3: Forms";
        }
        if (status === "Deploy Queue" || status.includes("Revision")) {
            return "Phase 4: Deployment";
        }
        if (status.includes("Review") || status === "Assign Review" || status === "Proposal Review") {
            return "Phase 5: Review";
        }
        if (status === "Data Collection" || status.includes("Deviation") || status.includes("Study Report")) {
            return "Phase 6: Data Collection";
        }
        if (status.includes("Report") || status.includes("Archive")) {
            return "Phase 7: Final Report";
        }
        return null;
    };

    const getNotificationColor = (notification: Notification): string => {
        const action = notification.action || notification.history_type || "";
        
        if (action.includes("APPROVE") || action.includes("approve")) {
            return "text-green-600";
        }
        if (action.includes("REJECT") || action.includes("reject")) {
            return "text-red-600";
        }
        if (action.includes("ASSIGN") || action.includes("assign")) {
            return "text-blue-600";
        }
        return "text-gray-600";
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
                <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        No notifications yet
                    </div>
                ) : (
                    <>
                        <div className="divide-y">
                            {notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((notification) => {
                                const message = getNotificationMessage(notification);
                                const isRead = readNotifications.has(notification.history_id);
                                return (
                                    <div
                                        key={notification.history_id}
                                        className={cn(
                                            "p-3 hover:bg-accent cursor-pointer transition-colors",
                                            !isRead && "bg-blue-50/50"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn("w-1 rounded-full flex-shrink-0", getNotificationColor(notification))} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {message.main}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate mb-1">
                                                    Proposal title: {notification.proposal_title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(notification.history_date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {notifications.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-2 py-1 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <span>Page {page} of {Math.ceil(notifications.length / PAGE_SIZE)}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(notifications.length / PAGE_SIZE), p + 1))}
                                    disabled={page >= Math.ceil(notifications.length / PAGE_SIZE)}
                                    className="px-2 py-1 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
