"use client";

import { FileText, Download, Eye, Check, X, User, Calendar, MessageSquare, Send, FileStack } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { Label } from "recharts";

/* ----------------- types ----------------- */
interface Submission {
    proposal_id: number;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string;
    status: string;
    date: string;
    assigned_reviewer: string; // Reviewer who is assigned this proposal
}

interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
}

interface DocumentItem {
    name: string;
    url: string;
    phase: 'phase1' | 'phase3'; // Documents from phase 1 or phase 3
}

interface ReviewRecommendation {
    recommendation: 'approve' | 'revisions';
    comments: string;
}

/* ----------------- component ----------------- */
export default function ReviewerPage() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [submissionDocuments, setSubmissionDocuments] = useState<DocumentItem[]>([]);
    const [recommendation, setRecommendation] = useState<ReviewRecommendation>({
        recommendation: 'approve',
        comments: ''
    });

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");

    // user
    const [userId, setUserId] = useState<string | null>(null);

    userId;

    /* fetch initial data - only proposals assigned to current reviewer */
    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                const uid = userData?.user?.id || null;
                if (mounted) setUserId(uid);

                if (!uid) {
                    toast.error("Not authenticated");
                    return;
                }

                const { data: proposals, error } = await supabase
                    .from("proposals")
                    .select("*")
                    .eq("reviewer", uid)
                    .eq("status", "Assigned")
                    .order("date", { ascending: false });

                if (error) throw error;
                const projs = (proposals || []) as Submission[];
                if (mounted) setSubmissions(projs);

                // Get researcher profiles
                const researcherIds = projs.map((p) => p.researcher).filter(Boolean);
                if (researcherIds.length) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from("profiles")
                        .select("id, fname, lname, category")
                        .in("id", researcherIds);
                    if (profilesError) throw profilesError;
                    if (mounted) setProfiles(profilesData || []);
                } else if (mounted) setProfiles([]);

                // Set first submission as active if any
                if (projs.length > 0 && mounted) {
                    setActiveSubmission(projs[0]);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load submissions");
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchAll();
        return () => {
            mounted = false;
        };
    }, []);

    /* When active submission changes, load its documents */
    useEffect(() => {
        const loadSubmissionDocuments = async () => {
            if (!activeSubmission) {
                setSubmissionDocuments([]);
                return;
            }

            try {
                const documents: DocumentItem[] = [];

                // Load Phase 1 documents (Manuscript phase)
                const phase1Files = await listStoredFilesForPhase(activeSubmission.proposal_id, 'phase1');
                documents.push(...phase1Files.map(file => ({
                    ...file,
                    phase: 'phase1' as const
                })));

                // Load Phase 3 documents (Forms phase)
                const phase3Files = await listStoredFilesForPhase(activeSubmission.proposal_id, 'phase3');
                documents.push(...phase3Files.map(file => ({
                    ...file,
                    phase: 'phase3' as const
                })));

                setSubmissionDocuments(documents);
            } catch (err) {
                console.error("Failed to load documents:", err);
                toast.error("Failed to load submission documents");
            }
        };

        loadSubmissionDocuments();
        setRecommendation({
            recommendation: 'approve',
            comments: ''
        });
    }, [activeSubmission]);

    /* List stored files for a phase */
    const listStoredFilesForPhase = async (submissionId: number, phase: 'phase1' | 'phase3'): Promise<{ name: string; url: string }[]> => {
        try {
            // Map phase to storage folder names
            const phaseFolders = {
                phase1: 'Send Manuscript',
                phase3: 'Send Forms'
            };

            const path = `${submissionId}/${phaseFolders[phase]}`;
            const { data, error } = await supabase.storage.from("documents").list(path);

            if (error) {
                // If folder doesn't exist, return empty array
                if (error.message.includes('not found')) {
                    return [];
                }
                console.debug("listStoredFilesForPhase error:", error.message);
                return [];
            }

            if (!data || data.length === 0) return [];

            // Map each file to a signed URL
            const signedFiles = await Promise.all(
                data.map(async (f: any) => {
                    const { data: signed, error: signError } = await supabase.storage
                        .from("documents")
                        .createSignedUrl(`${path}/${f.name}`, 60 * 5);

                    if (signError) {
                        console.error("Signed URL error:", signError.message);
                        return null;
                    }

                    return { name: f.name, url: signed.signedUrl };
                })
            );

            return signedFiles.filter((f): f is { name: string; url: string } => f !== null);
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    /* Open document preview */
    const openPreview = async (url: string, filename: string) => {
        setPreviewUrl(url);
        setPreviewTitle(filename);
        setPreviewOpen(true);
    };

    /* Submit review recommendation */
    const submitRecommendation = async () => {
        if (!activeSubmission || (recommendation.recommendation === 'revisions' && !recommendation.comments.trim())) {
            toast.error("Please provide review comments for revisions");
            return;
        }

        const loadingId = toast.loading("Submitting recommendation...");

        try {
            // Determine the next status based on recommendation
            const nextStatus = recommendation.recommendation === 'approve'
                ? "Data Collection"
                : "Revise Proposal";

            // Update proposal status based on recommendation
            const { error: statusError } = await supabase
                .from("proposals")
                .update({
                    status: nextStatus,  // Use dynamic status
                })
                .eq("proposal_id", activeSubmission.proposal_id);

            if (statusError) throw statusError;

            // Add to history
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "review",
                paper_id: activeSubmission.proposal_id,
                comment: recommendation.comments,
                actor: actorId,
                action: `Review - ${recommendation.recommendation.toUpperCase()}`,
                history_date: new Date().toISOString(),
            });

            if (historyError) throw historyError;

            // Update local state
            setSubmissions(prev => prev.filter(s => s.proposal_id !== activeSubmission.proposal_id));

            if (submissions.length > 1) {
                setActiveSubmission(submissions[1]); // Set next submission as active
            } else {
                setActiveSubmission(null);
            }

            toast.success("Recommendation submitted successfully", { id: loadingId });
            setRecommendation({
                recommendation: 'approve',
                comments: ''
            });

        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit recommendation: " + (err.message || err), { id: loadingId });
        }
    };

    /* convenience lookup */
    const getProfileName = (id: string | null) => {
        if (!id) return "Unknown";
        const p = profiles.find((x) => x.id === id);
        return p ? `${p.lname}, ${p.fname}` : "Unknown";
    };

    const getPhaseBadge = (phase: 'phase1' | 'phase3') => {
        const config = {
            phase1: { label: "Phase 1: Manuscript", variant: "default" as const },
            phase3: { label: "Phase 3: Forms", variant: "secondary" as const }
        };

        return config[phase];
    };

    /* ---------- UI ---------- */
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Reviewer Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        {submissions.length}/3 Proposals Assigned
                    </p>
                </div>
            </div>

            {/* submissions table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border min-w-[200px]">Title</TableHead>
                            <TableHead className="border min-w-[120px]">Researcher</TableHead>
                            <TableHead className="border min-w-[100px]">Category</TableHead>
                            <TableHead className="border min-w-[100px]">Date</TableHead>
                            <TableHead className="border w-1 whitespace-nowrap text-center min-w-[100px]">
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
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            Array.from({ length: 3 }).map((_, index) => {
                                const submission = submissions[index];
                                return submission ? (
                                    <TableRow
                                        key={submission.proposal_id}
                                        className={cn(
                                            "cursor-pointer hover:bg-gray-50/50",
                                            activeSubmission?.proposal_id === submission.proposal_id && "bg-primary/5"
                                        )}
                                        onClick={() => setActiveSubmission(submission)}
                                    >
                                        <TableCell className="border">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <span className="font-medium truncate min-w-0">{submission.proposal_title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span>{getProfileName(submission.researcher)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <Badge variant="outline" className="text-xs">
                                                {submission.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="border text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {new Date(submission.date).toLocaleDateString()}
                                            </div>
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
                                                                setActiveSubmission(submission);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            <span className="text-sm">Review</span>
                                                        </RippleButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Review this proposal</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={`empty-${index}`} className="hover:bg-gray-50/50">
                                        <TableCell className="border text-gray-400 italic">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-300" />
                                                <span>Available Slot</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border text-gray-400">—</TableCell>
                                        <TableCell className="border text-gray-400">—</TableCell>
                                        <TableCell className="border text-gray-400">—</TableCell>
                                        <TableCell className="border w-1 whitespace-nowrap text-center">
                                            <Badge variant="outline" className="text-gray-400 border-gray-200">
                                                Empty
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* review panel */}
            <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
                {!activeSubmission ? (
                    <div className="text-center py-8 text-gray-500">
                        No submission selected for review
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold break-words pr-2">{activeSubmission.proposal_title}</h2>
                                <div className="text-sm text-gray-600 mt-1 mb-3">
                                    {getProfileName(activeSubmission.researcher)} • <span className="text-muted-foreground">{activeSubmission.category}</span>
                                </div>
                            </div>

                            <div className="w-full lg:w-64 flex-shrink-0">
                                <div className="flex items-center justify-between lg:block">
                                    <div className="text-xs lg:text-sm text-gray-500 uppercase tracking-wide">Status</div>
                                </div>
                                <div className="mt-1 max-w-full">
                                    <Badge variant="default" className="inline-flex items-center gap-1 max-w-full px-2 py-1 bg-blue-100 text-blue-800">
                                        <Check className="w-3 h-3" />
                                        <span className="truncate">Assigned for Review</span>
                                    </Badge>
                                </div>
                                <div className="text-xs text-gray-400 mt-2">Submitted {new Date(activeSubmission.date).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* description */}
                        <div className="space-y-2 mb-6">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wide">Description</span>
                            </div>
                            <div className="my-2">
                                <Textarea
                                    value={activeSubmission.description || "No description."}
                                    className="w-full max-w-full resize-none bg-transparent overflow-x-hidden whitespace-pre-wrap break-words"
                                    rows={4}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* submitted documents */}
                        <div className="space-y-4 mb-6">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                <FileStack className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wide">Submitted Documents</span>
                            </div>

                            {submissionDocuments.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4">No documents submitted yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {submissionDocuments.map((doc, index) => {
                                        const phaseConfig = getPhaseBadge(doc.phase);
                                        return (
                                            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-medium text-gray-900 break-words truncate">{doc.name}</h3>
                                                            <Badge variant={phaseConfig.variant} className="mt-1 text-xs">
                                                                {phaseConfig.label}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openPreview(doc.url, doc.name)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                        <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                                            <RippleButton variant="outline" size="sm">
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </RippleButton>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* review recommendation */}
                        <div className="space-y-4 border-t pt-6">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wide">Review Recommendation</span>
                            </div>

                            <div className="grid gap-4">
                                {/* Recommendation Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Approve Card */}
                                    <div
                                        className={cn(
                                            "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                                            recommendation.recommendation === 'approve'
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-25"
                                        )}
                                        onClick={() => setRecommendation(prev => ({
                                            ...prev,
                                            recommendation: 'approve',
                                            comments: ''
                                        }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                                recommendation.recommendation === 'approve'
                                                    ? "border-green-500 bg-green-500"
                                                    : "border-gray-300"
                                            )}>
                                                {recommendation.recommendation === 'approve' && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Approve
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Recommend this proposal for approval without changes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revisions Card */}
                                    <div
                                        className={cn(
                                            "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                                            recommendation.recommendation === 'revisions'
                                                ? "border-yellow-500 bg-yellow-50"
                                                : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-25"
                                        )}
                                        onClick={() => setRecommendation(prev => ({
                                            ...prev,
                                            recommendation: 'revisions'
                                        }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                                recommendation.recommendation === 'revisions'
                                                    ? "border-yellow-500 bg-yellow-500"
                                                    : "border-gray-300"
                                            )}>
                                                {recommendation.recommendation === 'revisions' && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                        Revisions Needed
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Request specific revisions before approval.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-2">
                                    <Label>
                                        Review Comments
                                        {recommendation.recommendation === 'revisions' && (
                                            <span className="text-red-500 ml-1">(Required)</span>
                                        )}
                                    </Label>
                                    {recommendation.recommendation === 'revisions' ? (
                                        <Textarea
                                            id="comments"
                                            placeholder="Please provide detailed comments about required revisions..."
                                            value={recommendation.comments}
                                            onChange={(e) => setRecommendation(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={4}
                                            className="resize-none"
                                        />
                                    ) : (
                                        <></>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <RippleButton
                                        onClick={submitRecommendation}
                                        disabled={recommendation.recommendation === 'revisions' && !recommendation.comments.trim()}
                                        className="flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Submit Recommendation
                                    </RippleButton>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Full Screen Document Preview */}
            {previewOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="font-semibold text-lg truncate pr-4">{previewTitle}</div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setPreviewOpen(false);
                                setPreviewUrl(null);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 relative">
                        {previewUrl ? (
                            <iframe
                                src={previewUrl}
                                className="absolute inset-0 w-full h-full border-0"
                                title={previewTitle}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gray-500">Loading preview...</div>
                            </div>
                        )}
                    </div>

                    {/* Footer with Download button */}
                    <div className="flex items-center justify-end p-4 border-t">
                        {previewUrl && (
                            <a href={previewUrl} download target="_blank" rel="noopener noreferrer">
                                <Button>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}