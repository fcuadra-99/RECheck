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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DecisionLetterForm from "@/components/forms/DecisionLetterForm";
import { toast } from "sonner";

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

    const [userRole, setUserRole] = useState<string | null>(null);
    const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
    const [isEditingDecisionLetter, setIsEditingDecisionLetter] = useState(false);
    const [decisionLetterData, setDecisionLetterData] = useState<Record<string, any>>({});
    const [isSavingDecisionLetter, setIsSavingDecisionLetter] = useState(false);
    const [proposalDetails, setProposalDetails] = useState<{title: string, protocolCode: string, researcherName: string} | null>(null);

    // Fetch user's role on mount/userId change
    useEffect(() => {
        if (!userId) return;
        const fetchRole = async () => {
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", userId)
                    .single();
                if (data) {
                    setUserRole(data.role);
                }
            } catch (err) {
                console.error("Failed to fetch user role for notifications:", err);
            }
        };
        fetchRole();
    }, [userId]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            // Get user's role first if not already loaded, otherwise use loaded role
            let role = userRole;
            if (!role) {
                const { data } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", userId)
                    .single();
                role = data?.role || null;
            }

            let historyData: any[] = [];
            let proposalsData: any[] = [];

            if (role === "Admin Assistant" || role === "admin assistant") {
                // Admin Assistant: passed_to_admin notifications
                const { data: history } = await supabase
                    .from("history")
                    .select("*")
                    .eq("history_type", "passed_to_admin")
                    .order("history_date", { ascending: false })
                    .limit(50);

                historyData = history || [];

                if (historyData.length > 0) {
                    const uniquePaperIds = Array.from(new Set(historyData.map(h => h.paper_id).filter(Boolean)));
                    const { data: proposals } = await supabase
                        .from("proposals")
                        .select("proposal_id, proposal_title, status")
                        .in("proposal_id", uniquePaperIds);
                    proposalsData = proposals || [];
                }
            } else if (role === "Chairperson" || role === "chairperson") {
                // Chairperson: passed_back_to_chairperson + researcher notifications
                const { data: resProposals } = await supabase
                    .from("proposals")
                    .select("proposal_id, proposal_title, status")
                    .eq("researcher", userId);

                const resProposalIds = resProposals?.map(p => p.proposal_id) || [];

                const { data: historyPassedBack } = await supabase
                    .from("history")
                    .select("*")
                    .eq("history_type", "passed_back_to_chairperson")
                    .order("history_date", { ascending: false })
                    .limit(50);

                let historyRes: any[] = [];
                if (resProposalIds.length > 0) {
                    const { data } = await supabase
                        .from("history")
                        .select("*")
                        .in("paper_id", resProposalIds)
                        .order("history_date", { ascending: false })
                        .limit(50);
                    historyRes = data || [];
                }

                const combined = [...(historyPassedBack || []), ...historyRes];
                combined.sort((a, b) => new Date(b.history_date).getTime() - new Date(a.history_date).getTime());
                historyData = combined.slice(0, 50);

                if (historyData.length > 0) {
                    const uniquePaperIds = Array.from(new Set(historyData.map(h => h.paper_id).filter(Boolean)));
                    const { data: proposals } = await supabase
                        .from("proposals")
                        .select("proposal_id, proposal_title, status")
                        .in("proposal_id", uniquePaperIds);
                    proposalsData = proposals || [];
                }
            } else {
                // Researcher workflow
                const { data: proposals } = await supabase
                    .from("proposals")
                    .select("proposal_id, proposal_title, status")
                    .eq("researcher", userId);

                proposalsData = proposals || [];

                if (proposalsData.length > 0) {
                    const proposalIds = proposalsData.map(p => p.proposal_id);
                    const { data: history } = await supabase
                        .from("history")
                        .select("*")
                        .in("paper_id", proposalIds)
                        .not("history_type", "eq", "passed_to_admin")
                        .not("history_type", "eq", "passed_back_to_chairperson")
                        .order("history_date", { ascending: false })
                        .limit(50);
                    historyData = history || [];
                }
            }

            const notificationsWithTitles = historyData.map(h => {
                const proposal = proposalsData.find(p => p.proposal_id === h.paper_id);
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
    }, [userId, userRole]);

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

        if (action === "PASSED_TO_ADMIN" || notification.history_type === "passed_to_admin") {
            return { main: "Chairperson passed Decision Letter for date input", subtext: "Dates check required" };
        }
        if (action === "PASSED_BACK_TO_CHAIRPERSON" || notification.history_type === "passed_back_to_chairperson") {
            return { main: "Admin Assistant updated Decision Letter dates", subtext: "Ready for final submission" };
        }
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
        
        if (action === "PASSED_TO_ADMIN" || action === "PASSED_BACK_TO_CHAIRPERSON" || action.includes("passed_")) {
            return "text-purple-600";
        }
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

    const handleNotificationClick = async (notification: Notification) => {
        if (notification.history_type === "passed_to_admin" || notification.history_type === "passed_back_to_chairperson") {
            const proposalId = notification.paper_id;
            if (!proposalId) return;

            const loadingToastId = toast.loading("Loading Decision Letter...");
            try {
                const { data: proposal } = await supabase
                    .from("proposals")
                    .select("proposal_title, protocol_id, researcher")
                    .eq("proposal_id", proposalId)
                    .single();

                if (proposal) {
                    const { data: researcherProfile } = await supabase
                        .from("profiles")
                        .select("fname, lname")
                        .eq("id", proposal.researcher)
                        .single();

                    const researcherName = researcherProfile 
                        ? `${researcherProfile.fname ?? ""} ${researcherProfile.lname ?? ""}`.trim()
                        : "";

                    setProposalDetails({
                        title: proposal.proposal_title,
                        protocolCode: proposal.protocol_id || "",
                        researcherName
                    });
                }

                const { data: fileBlob, error } = await supabase.storage
                    .from('documents')
                    .download(`${proposalId}/Decisions/Decision_Letter_Draft.json`);

                if (!error && fileBlob) {
                    const text = await fileBlob.text();
                    const parsed = JSON.parse(text);
                    setDecisionLetterData(parsed || {});
                } else {
                    setDecisionLetterData({});
                }

                setSelectedProposalId(proposalId);
                setIsEditingDecisionLetter(true);
                setOpen(false);
                toast.dismiss(loadingToastId);
            } catch (err) {
                console.error("Error loading notification decision letter draft:", err);
                toast.error("Failed to load decision letter draft", { id: loadingToastId });
            }
        }
    };

    const handleSaveAdminDecisionLetter = async () => {
        if (!selectedProposalId || isSavingDecisionLetter) return;
        setIsSavingDecisionLetter(true);

        const loadingId = toast.loading(userRole === "Admin Assistant" || userRole === "admin assistant" ? "Sending back to Chairperson..." : "Saving Decision Letter...");
        try {
            const json = JSON.stringify(decisionLetterData, null, 2);
            const uploadPath = `${selectedProposalId}/Decisions/Decision_Letter_Draft.json`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            if (userRole === "Admin Assistant" || userRole === "admin assistant") {
                const historyData = {
                    history_type: "passed_back_to_chairperson",
                    paper_id: selectedProposalId,
                    comment: "Admin Assistant updated Decision Letter dates and passed it back to Chairperson",
                    actor: userId,
                    action: "PASSED_BACK_TO_CHAIRPERSON",
                    history_date: new Date().toISOString(),
                };

                const { error: historyError } = await supabase.from("history").insert(historyData);
                if (historyError) throw historyError;

                toast.success("Decision Letter sent back to Chairperson", { id: loadingId });
            } else {
                toast.success("Decision Letter draft saved", { id: loadingId });
            }

            setIsEditingDecisionLetter(false);
            fetchNotifications();
        } catch (err: any) {
            console.error("Error saving decision letter from notification:", err);
            toast.error(`Error: ${err.message || 'Unknown error'}`, { id: loadingId });
        } finally {
            setIsSavingDecisionLetter(false);
        }
    };

    return (
        <>
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
                                            onClick={() => handleNotificationClick(notification)}
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

            {isEditingDecisionLetter && selectedProposalId && proposalDetails && (
                <Dialog open={isEditingDecisionLetter} onOpenChange={setIsEditingDecisionLetter}>
                    <DialogContent 
                        className="max-h-[90vh] overflow-y-auto p-6 bg-white"
                        style={{ maxWidth: '950px', width: '95vw' }}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                            <div>
                                <DialogTitle className="text-lg font-bold">Decision Letter Form</DialogTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Proposal: {proposalDetails.title} ({proposalDetails.protocolCode})
                                </p>
                            </div>
                        </DialogHeader>

                        <div className="my-4">
                            <DecisionLetterForm
                                savedData={decisionLetterData}
                                onSave={(patch) => setDecisionLetterData((prev) => ({ ...prev, ...patch }))}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsEditingDecisionLetter(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSaveAdminDecisionLetter}
                                disabled={isSavingDecisionLetter}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSavingDecisionLetter 
                                    ? "Sending..." 
                                    : (userRole === "Admin Assistant" || userRole === "admin assistant" ? "Send back to Chairperson" : "Save Changes")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
