"use client";

import { Archive, BarChart3, Check, ClipboardList, Clock, FileStack, FileText, Flag, RefreshCcw, Rocket, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Plus, Eye } from "lucide-react";
import { supabase } from "@/DB";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import SubmissionDetails from "./submdetails";
import NewProposalDialog from "./newpropdiag";
/* ----------------- types ----------------- */
interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string | null;
    status: string;
    date: string;
}

interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
}

/* ----------------- component ----------------- */
export default function SubmissionsPage() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // new proposal modal
    const [newProposalOpen, setNewProposalOpen] = useState(false);

    /* fetch initial data */
    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                const uid = userData?.user?.id || null;
                if (mounted) setUserId(uid);

                const { data: proposals, error } = await supabase.from("proposals").select("*").order("date", { ascending: false });
                if (error) throw error;
                const projs = (proposals || []) as Submission[];
                if (mounted) setSubmissions(projs);

                const profileIds = projs.map((p) => p.researcher).filter(Boolean);
                if (profileIds.length) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from("profiles")
                        .select("id, fname, lname, category")
                        .in("id", profileIds);
                    if (profilesError) throw profilesError;
                    if (mounted) setProfiles(profilesData || []);
                } else if (mounted) setProfiles([]);

                // default active submission: the most recent of this user if any
                if (uid) {
                    const userSubs = projs.filter((p: any) => p.researcher === uid);
                    if (userSubs.length && mounted) setActiveSubmission(userSubs[0]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchAll();
        return () => {
            mounted = false;
        };
    }, []);

    /* derived: user's submissions and displayed (max 3) */
    const userSubmissions = submissions
        .filter((s) => s.researcher === userId)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const displayedSubmissions = userSubmissions.slice(0, 3);

    /* convenience lookup */
    // const getProfileName = (id: string | null) => {
    //     if (!id) return "Unknown";
    //     const p = profiles.find((x) => x.id === id);
    //     return p ? `${p.lname}, ${p.fname}` : "Unknown";
    // };

    const getActionLabel = (status: string) => {
        switch (status) {
            case "Send Manuscript":
                return "Submit";
            case "Check Manuscript":
                return "View";
            case "Resend Manuscript":
                return "Resubmit";
            case "Risk Assessment":
                return "View";
            case "Send Forms":
                return "Submit";
            case "Forms Check":
                return "View";
            case "Resend Forms":
                return "Resubmit";
            case "Deploy Queue":
                return "View";
            case "Data Collection":
                return "View";
            case "Send Revision":
                return "Submit";
            default:
                return "View";
        }
    };

    const handleOpenSubmission = (submission: any) => {
        setActiveSubmission(prev =>
            prev?.proposal_id === submission.proposal_id ? null : submission
        );
    };

    /* ---------- UI ---------- */
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                    <FileStack className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Submissions</h1>
                    <p className="text-sm text-gray-500">
                        {userSubmissions.length}/3 Proposals Available
                    </p>
                </div>
            </div>

            {/* submissions table */}
            <div className="rounded-md border overflow-x-auto">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border w-96">Title</TableHead>
                            <TableHead className="border w-48">Status</TableHead>
                            <TableHead className="border w-40">Review Type</TableHead>
                            <TableHead className="border w-40">Date</TableHead>
                            <TableHead className="border w-44 whitespace-nowrap text-center">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            Array.from({ length: 3 }).map((_, index) => {
                                const submission = displayedSubmissions[index];
                                return submission ? (
                                    <TableRow
                                        key={submission.proposal_id}
                                        className={cn(
                                            "cursor-pointer hover:bg-gray-50/50",
                                            activeSubmission?.proposal_id === submission.proposal_id && "bg-primary/5"
                                        )}
                                        onClick={() => setActiveSubmission(submission)}
                                    >
                                        <TableCell className="border overflow-hidden">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <span className="font-medium truncate">{submission.proposal_title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <Badge
                                                variant={submission.status.includes("Resend") ? "destructive" : "outline"}
                                                className={cn(
                                                    "font-medium inline-flex items-center gap-1",
                                                    submission.status.includes("Check") && "bg-yellow-50 text-yellow-700 border-yellow-300",
                                                    submission.status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300",
                                                    submission.status === "Data Collection" && "bg-blue-50 text-blue-700 border-blue-300"
                                                )}
                                            >
                                                {/* Add all status-specific icons */}
                                                {submission.status.includes("Resend") && <RefreshCcw className="w-3 h-3" />}
                                                {submission.status.includes("Check") && <Clock className="w-3 h-3" />}
                                                {submission.status === "Deploy Queue" && <Check className="w-3 h-3" />}
                                                {submission.status === "Data Collection" && <BarChart3 className="w-3 h-3" />}
                                                {submission.status === "Risk Assessment" && <Shield className="w-3 h-3" />}
                                                {submission.status.includes("Forms") && !submission.status.includes("Send") && <ClipboardList className="w-3 h-3" />}
                                                {submission.status.includes("Revision") && <Rocket className="w-3 h-3" />}
                                                {submission.status.includes("Review") && <Users className="w-3 h-3" />}
                                                {submission.status.includes("Deviation") && <Flag className="w-3 h-3" />}
                                                {submission.status.includes("Archive") && <Archive className="w-3 h-3" />}
                                                {submission.status.includes("Send") && !submission.status.includes("Resend") && <FileText className="w-3 h-3" />}
                                                {submission.status.includes("Assign") && <Users className="w-3 h-3" />}
                                                {submission.status.includes("Proposal") && <FileText className="w-3 h-3" />}
                                                {submission.status.includes("Study Report") && <BarChart3 className="w-3 h-3" />}

                                                <span className="truncate">{submission.status}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="border text-gray-600">
                                            {submission.review_type ? (
                                                <Badge variant="outline" className="text-xs">
                                                    {submission.review_type}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="border text-gray-600">
                                            {new Date(submission.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="border w-1 whitespace-nowrap text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <RippleButton
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 px-2",
                                                                activeSubmission?.proposal_id === submission.proposal_id
                                                                    ? "text-primary bg-primary/10"
                                                                    : "text-gray-600 hover:text-primary"
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenSubmission(submission);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            <span className="text-sm">{getActionLabel(submission.status)}</span>
                                                        </RippleButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{activeSubmission?.proposal_id === submission.proposal_id ? 'Hide details' : 'View details'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                        <TableRow key={`empty-${index}`} className="hover:bg-gray-50/50">
                                        <TableCell className="border text-gray-400 italic">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                <span className="truncate">Available Slot</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <Badge variant="outline" className="text-gray-400 border-gray-200">Not Started</Badge>
                                        </TableCell>
                                        <TableCell className="border text-gray-400">—</TableCell>
                                        <TableCell className="border text-gray-400">—</TableCell>
                                        <TableCell className="border w-1 whitespace-nowrap text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <RippleButton
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-gray-600 hover:text-primary"
                                                            onClick={() => setNewProposalOpen(true)}
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            <span className="text-sm">New</span>
                                                        </RippleButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Create a new proposal</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* submission details */}
            <SubmissionDetails
                activeSubmission={activeSubmission}
                profiles={profiles}
                userId={userId}
                onSubmissionUpdate={(updatedSubmission) => {
                    setSubmissions(prev =>
                        prev.map(s =>
                            s.proposal_id === updatedSubmission.proposal_id ? updatedSubmission : s
                        )
                    );
                    setActiveSubmission(updatedSubmission);
                }}
            />

            {/* new proposal dialog */}
            <NewProposalDialog
                open={newProposalOpen}
                onOpenChange={setNewProposalOpen}
                profiles={profiles}
                userId={userId}
                onProposalCreated={(newProposal) => {
                    setSubmissions(prev => [newProposal, ...prev]);
                    setActiveSubmission(newProposal);
                }}
            />
        </div>
    );
}