"use client";

import { FileText, Download, Eye, Check, X, User, Calendar, MessageSquare, Send, FileStack, Crown, FileSignature } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { Label } from "recharts";
import PDFFormFiller from "@/components/PDFFormFiller";

/* ----------------- types ----------------- */
interface RevisionRequirement {
    manuscript: boolean;
    ethics_form: boolean;
    data_management_plan: boolean;
    other_documents: boolean;
    other_comments: string;
}

interface ProposalDocument {
    document_id: number;
    proposal_id: number;
    doc_type: string;
    file_path: string;
    uploaded_at: string;
    revision_number: number;
}

interface DocumentSelection {
    [key: number]: boolean; // document_id -> selected
}

interface Submission {
    proposal_id: number;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string;
    status: string;
    date: string;
    assigned_reviewer: string;
}

interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
    role?: string | null;
}

interface DocumentItem {
    name: string;
    url: string;
    phase: 'phase1' | 'phase3';
}

interface ReviewRecommendation {
    recommendation: 'approve' | 'revisions';
    comments: string;
    reviewer_id: string;
    reviewer_name: string;
    submitted_at: string;
    history_id?: number;
}

/* ----------------- component ----------------- */
export default function ReviewerPage() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [proposalDocuments, setProposalDocuments] = useState<ProposalDocument[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<DocumentSelection>({});

    const [revisionRequirements, setRevisionRequirements] = useState<RevisionRequirement>({
        manuscript: false,
        ethics_form: false,
        data_management_plan: false,
        other_documents: false,
        other_comments: ''
    });

    proposalDocuments;
    selectedDocuments;
    revisionRequirements;

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [submissionDocuments, setSubmissionDocuments] = useState<DocumentItem[]>([]);
    const [recommendation, setRecommendation] = useState<ReviewRecommendation>({
        recommendation: 'approve',
        comments: '',
        reviewer_id: '',
        reviewer_name: '',
        submitted_at: ''
    });
    const [existingRecommendations, setExistingRecommendations] = useState<ReviewRecommendation[]>([]);

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");

    // PDF template states
    const [showPDFTemplate, setShowPDFTemplate] = useState(false);
    const [templateType, setTemplateType] = useState<'ethical_clearance' | 'decision_letter' | null>(null);
    const [templateUrl, setTemplateUrl] = useState<string>('');

    // user
    const [userId, setUserId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [isChairperson, setIsChairperson] = useState(false);

    /* Fetch proposal documents from proposal_documents table */
    const fetchProposalDocuments = async (proposalId: number) => {
        try {
            const { data, error } = await supabase
                .from("proposal_documents")
                .select("*")
                .eq("proposal_id", proposalId)
                .order("uploaded_at", { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Failed to fetch proposal documents:", err);
            return [];
        }
    };

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

                // Get user profile to check if chairperson
                const { data: userProfileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, fname, lname, category, role")
                    .eq("id", uid)
                    .single();

                if (profileError) {
                    console.error("Error fetching user profile:", profileError);
                } else if (userProfileData && mounted) {
                    setUserProfile(userProfileData);
                    setIsChairperson(userProfileData.role === 'Chairperson' || userProfileData.role === 'Admin' );
                }

                const { data: proposals, error } = await supabase
                    .from("proposals")
                    .select("*")
                    .eq("status", "Proposal Review")
                    .like("reviewer", `%${uid}%`)
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

    /* When active submission changes, load its documents and recommendations */
    useEffect(() => {
        const loadSubmissionData = async () => {
            if (!activeSubmission) {
                setSubmissionDocuments([]);
                setExistingRecommendations([]);
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

                // Load recommendations from history table - EXCLUDE current user's recommendations
                const { data: recommendations, error } = await supabase
                    .from("history")
                    .select("*")
                    .eq("paper_id", activeSubmission.proposal_id)
                    .eq("history_type", "review_recommendation")
                    .order("history_date", { ascending: false });

                if (error) throw error;

                // Filter out current user's recommendations to get only OTHER reviewers
                const otherReviewersRecommendations = recommendations?.filter(rec => rec.actor !== userId) || [];

                if (otherReviewersRecommendations.length === 0) {
                    setExistingRecommendations([]);
                } else {
                    // Get unique reviewer IDs from OTHER reviewers
                    const reviewerIds = [...new Set(otherReviewersRecommendations.map(rec => rec.actor).filter(Boolean))];

                    // Fetch all reviewer profiles in one query
                    let reviewerProfiles: Profile[] = [];
                    if (reviewerIds.length > 0) {
                        const { data: profilesData, error: profilesError } = await supabase
                            .from("profiles")
                            .select("id, fname, lname")
                            .in("id", reviewerIds);

                        if (!profilesError && profilesData) {
                            reviewerProfiles = profilesData;
                        }
                    }

                    // Transform history data to ReviewRecommendation format with proper names
                    const transformedRecommendations: ReviewRecommendation[] = otherReviewersRecommendations.map(rec => {
                        const reviewerProfile = reviewerProfiles.find(p => p.id === rec.actor);
                        const reviewerName = reviewerProfile
                            ? `${reviewerProfile.fname} ${reviewerProfile.lname}`.trim()
                            : 'Unknown Reviewer';

                        return {
                            recommendation: rec.action?.includes('APPROVE') ? 'approve' : 'revisions',
                            comments: rec.comment || '',
                            reviewer_id: rec.actor || '',
                            reviewer_name: reviewerName,
                            submitted_at: rec.history_date,
                            history_id: rec.history_id
                        };
                    });

                    setExistingRecommendations(transformedRecommendations);
                }

                // Set current user's recommendation separately
                if (userId) {
                    // Check if current user has already submitted a recommendation
                    const { data: userRecommendation, error: userRecError } = await supabase
                        .from("history")
                        .select("*")
                        .eq("paper_id", activeSubmission.proposal_id)
                        .eq("history_type", "review_recommendation")
                        .eq("actor", userId)
                        .order("history_date", { ascending: false })
                        .single();

                    if (userRecError && userRecError.code !== 'PGRST116') {
                        console.error("Error fetching user recommendation:", userRecError);
                    }

                    const currentUserName = userProfile
                        ? `${userProfile.fname} ${userProfile.lname}`.trim()
                        : 'Unknown Reviewer';

                    if (userRecommendation) {
                        setRecommendation({
                            recommendation: userRecommendation.action?.includes('APPROVE') ? 'approve' : 'revisions',
                            comments: userRecommendation.comment || '',
                            reviewer_id: userId,
                            reviewer_name: currentUserName,
                            submitted_at: userRecommendation.history_date
                        });
                    } else {
                        setRecommendation({
                            recommendation: 'approve',
                            comments: '',
                            reviewer_id: userId,
                            reviewer_name: currentUserName,
                            submitted_at: ''
                        });
                    }
                }

            } catch (err) {
                console.error("Failed to load submission data:", err);
                toast.error("Failed to load submission data");
            }

            // Load proposal documents for revision selection
            const documents = await fetchProposalDocuments(activeSubmission.proposal_id);
            setProposalDocuments(documents);

            // Initialize selected documents state
            const initialSelection: DocumentSelection = {};
            documents.forEach(doc => {
                initialSelection[doc.document_id] = false;
            });
            setSelectedDocuments(initialSelection);
        };

        loadSubmissionData();
    }, [activeSubmission, userId, userProfile]);

    /* List stored files for a phase */
    const listStoredFilesForPhase = async (submissionId: number, phase: 'phase1' | 'phase3'): Promise<{ name: string; url: string }[]> => {
        try {
            const phaseFolders = {
                phase1: 'Send Manuscript',
                phase3: 'Send Forms'
            };

            const path = `${submissionId}/${phaseFolders[phase]}`;
            const { data, error } = await supabase.storage.from("documents").list(path);

            if (error) {
                if (error.message.includes('not found')) {
                    return [];
                }
                console.debug("listStoredFilesForPhase error:", error.message);
                return [];
            }

            if (!data || data.length === 0) return [];

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

    /* Reset revision requirements when submission changes */
    useEffect(() => {
        setRevisionRequirements({
            manuscript: false,
            ethics_form: false,
            data_management_plan: false,
            other_documents: false,
            other_comments: ''
        });
    }, [activeSubmission]);

    /* Open document preview */
    const openPreview = async (url: string, filename: string) => {
        setPreviewUrl(url);
        setPreviewTitle(filename);
        setPreviewOpen(true);
    };

    /* Submit review recommendation - WORKING CHAIRPERSON SOLUTION */
    const submitRecommendation = async () => {
        if (!activeSubmission || !userId || (recommendation.recommendation === 'revisions' && !recommendation.comments.trim())) {
            toast.error("Please provide review comments for revisions");
            return;
        }

        const loadingId = toast.loading(isChairperson ? "Submitting final decision..." : "Submitting recommendation...");

        try {
            // Check if user has already submitted a recommendation
            const { data: existingRec } = await supabase
                .from("history")
                .select("history_id")
                .eq("paper_id", activeSubmission.proposal_id)
                .eq("actor", userId)
                .eq("history_type", "review_recommendation")
                .single();

            const actionText = `REVIEW_RECOMMENDATION_${recommendation.recommendation.toUpperCase()}`;
            const historyData = {
                history_type: "review_recommendation",
                paper_id: activeSubmission.proposal_id,
                comment: recommendation.comments,
                actor: userId,
                action: actionText,
                history_date: new Date().toISOString(),
            };

            let error;
            if (existingRec) {
                const { error: updateError } = await supabase
                    .from("history")
                    .update(historyData)
                    .eq("history_id", existingRec.history_id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("history")
                    .insert([historyData]);
                error = insertError;
            }

            if (error) throw error;

            // CHAIRPERSON LOGIC: Move proposal to next state
            if (isChairperson) {
                const nextStatus = recommendation.recommendation === 'approve'
                    ? "Data Collection"
                    : "Revise Proposal";

                // First verify the proposal exists
                const { data: currentProposal, error: fetchError } = await supabase
                    .from("proposals")
                    .select("proposal_id, status")
                    .eq("proposal_id", activeSubmission.proposal_id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching proposal:', fetchError);
                    throw new Error(`Cannot find proposal: ${fetchError.message}`);
                }

                console.log('Current proposal:', currentProposal);

                // Update proposal status with proper error handling
                const { data: updateData, error: statusError } = await supabase
                    .from("proposals")
                    .update({
                        status: nextStatus,
                        updated_on: new Date().toISOString()
                    })
                    .eq("proposal_id", activeSubmission.proposal_id)
                    .select();

                if (statusError) {
                    console.error('Update error:', statusError);
                    throw statusError;
                }

                console.log('Update successful:', updateData);

                // Add chairperson decision to history
                const decisionHistoryData = {
                    history_type: "review_decision",
                    paper_id: activeSubmission.proposal_id,
                    comment: `Chairperson ${recommendation.recommendation === 'approve' ? 'approved' : 'requested revisions for'} proposal: ${recommendation.comments}`,
                    actor: userId,
                    action: `CHAIRPERSON_DECISION_${recommendation.recommendation.toUpperCase()}`,
                    history_date: new Date().toISOString(),
                };

                const { error: decisionError } = await supabase.from("history").insert(decisionHistoryData);
                if (decisionError) throw decisionError;

                // Update local state - remove the processed submission
                setSubmissions(prev => prev.filter(s => s.proposal_id !== activeSubmission.proposal_id));

                if (submissions.length > 1) {
                    setActiveSubmission(submissions[1]);
                } else {
                    setActiveSubmission(null);
                }

                toast.success(
                    `Proposal ${recommendation.recommendation === 'approve' ? 'approved and moved to Data Collection' : 'sent for revisions'}`,
                    { id: loadingId }
                );
            } else {
                // Regular reviewer - just show success message
                toast.success(
                    existingRec ? "Recommendation updated successfully" : "Recommendation submitted successfully",
                    { id: loadingId }
                );
            }

        } catch (err: any) {
            console.error("Failed to submit recommendation:", err);
            toast.error(`Failed to submit recommendation: ${err.message || 'Unknown error'}`, { id: loadingId });
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

    // Check if current user has submitted a recommendation for active submission
    const hasUserSubmittedRecommendation = existingRecommendations.some(rec => rec.reviewer_id === userId);

    /* Open PDF Template Handler */
    const handleOpenPDFTemplate = async (type: 'ethical_clearance' | 'decision_letter') => {
        try {
            const templateFilename = type === 'ethical_clearance' 
                ? 'V2 Ethical Clearance (2).pdf'
                : '-Decision Letter.pdf';
            
            // Get the template URL from public folder
            const templatePath = `/templates/${templateFilename}`;
            
            setTemplateUrl(templatePath);
            setTemplateType(type);
            setShowPDFTemplate(true);
        } catch (error) {
            console.error('Error loading template:', error);
            toast.error('Failed to load template');
        }
    };

    /* Save PDF Template Handler */
    const handleSavePDFTemplate = async (pdfBytes: Uint8Array, _formData: Record<string, any>) => {
        if (!activeSubmission || !userId) return;

        try {
            const loadingId = toast.loading("Saving and sending document...");

            // Generate filename based on template type
            const filename = templateType === 'ethical_clearance'
                ? `Ethical_Clearance_${activeSubmission.proposal_id}_${Date.now()}.pdf`
                : `Decision_Letter_${activeSubmission.proposal_id}_${Date.now()}.pdf`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(`${activeSubmission.proposal_id}/Decisions/${filename}`, pdfBytes, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Add history entry for document sent
            const historyData = {
                history_type: templateType === 'ethical_clearance' ? 'ethical_clearance_sent' : 'decision_letter_sent',
                paper_id: activeSubmission.proposal_id,
                comment: `${templateType === 'ethical_clearance' ? 'Ethical Clearance' : 'Decision Letter'} sent to researcher`,
                actor: userId,
                action: templateType === 'ethical_clearance' ? 'ETHICAL_CLEARANCE_SENT' : 'DECISION_LETTER_SENT',
                history_date: new Date().toISOString(),
            };

            const { error: historyError } = await supabase.from("history").insert(historyData);
            if (historyError) throw historyError;

            // Now process the chairperson decision (approve or request revisions)
            const nextStatus = templateType === 'ethical_clearance'
                ? "Data Collection"
                : "Revise Proposal";

            // Update proposal status
            const { error: statusError } = await supabase
                .from("proposals")
                .update({
                    status: nextStatus,
                    updated_on: new Date().toISOString()
                })
                .eq("proposal_id", activeSubmission.proposal_id);

            if (statusError) throw statusError;

            // Add chairperson decision to history
            const decisionHistoryData = {
                history_type: "review_decision",
                paper_id: activeSubmission.proposal_id,
                comment: `Chairperson ${templateType === 'ethical_clearance' ? 'approved' : 'requested revisions for'} proposal and sent ${templateType === 'ethical_clearance' ? 'Ethical Clearance' : 'Decision Letter'}`,
                actor: userId,
                action: `CHAIRPERSON_DECISION_${templateType === 'ethical_clearance' ? 'APPROVE' : 'REVISIONS'}`,
                history_date: new Date().toISOString(),
            };

            const { error: decisionError } = await supabase.from("history").insert(decisionHistoryData);
            if (decisionError) throw decisionError;

            // Close the PDF template
            setShowPDFTemplate(false);
            setTemplateType(null);
            setTemplateUrl('');

            // Update local state - remove the processed submission
            setSubmissions(prev => prev.filter(s => s.proposal_id !== activeSubmission.proposal_id));

            if (submissions.length > 1) {
                const nextSubmission = submissions.find(s => s.proposal_id !== activeSubmission.proposal_id);
                setActiveSubmission(nextSubmission || null);
            } else {
                setActiveSubmission(null);
            }

            toast.success(
                `${templateType === 'ethical_clearance' ? 'Ethical Clearance sent - Proposal approved and moved to Data Collection' : 'Decision Letter sent - Proposal sent for revisions'}`,
                { id: loadingId }
            );
        } catch (error: any) {
            console.error('Error saving PDF template:', error);
            toast.error(`Failed to save document: ${error.message || 'Unknown error'}`);
        }
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
                        {isChairperson && (
                            <Badge variant="secondary" className="ml-2">
                                <Crown className="w-3 h-3 mr-1" />
                                Chairperson
                            </Badge>
                        )}
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

                        {/* Review Recommendations Summary */}
                        {existingRecommendations.length > 0 && (
                            <div className="space-y-4 mb-6 border-t pt-6">
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wide">Reviewer Recommendations</span>
                                </div>
                                <div className="space-y-3">
                                    {existingRecommendations.map((rec, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium text-sm">{rec.reviewer_name}</div>
                                                <Badge
                                                    variant={rec.recommendation === 'approve' ? 'default' : 'outline'}
                                                    className={cn(
                                                        rec.recommendation === 'approve'
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-50 text-yellow-700 border-yellow-300"
                                                    )}
                                                >
                                                    {rec.recommendation === 'approve' ? 'Approve' : 'Revisions Needed'}
                                                </Badge>
                                            </div>
                                            {rec.comments && (
                                                <p className="text-sm text-gray-600 mt-2">{rec.comments}</p>
                                            )}
                                            <div className="text-xs text-gray-400 mt-2">
                                                {new Date(rec.submitted_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* review recommendation */}
                        <div className="space-y-4 border-t pt-6">
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wide">
                                    {isChairperson ? 'Final Decision' : hasUserSubmittedRecommendation ? 'Your Recommendation' : 'Submit Your Recommendation'}
                                </span>
                                {isChairperson && (
                                    <Badge variant="secondary" className="ml-2">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Chairperson
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-4">
                                {/* Recommendation Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Approve Card */}
                                    <div
                                        className={cn(
                                            "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                                            recommendation.recommendation === 'approve'
                                                ? isChairperson
                                                    ? "border-green-600 bg-green-100"
                                                    : "border-green-500 bg-green-50"
                                                : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-25"
                                        )}
                                        onClick={() => setRecommendation(prev => ({
                                            ...prev,
                                            recommendation: 'approve',
                                            comments: prev.recommendation === 'approve' ? prev.comments : ''
                                        }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                                recommendation.recommendation === 'approve'
                                                    ? isChairperson
                                                        ? "border-green-600 bg-green-600"
                                                        : "border-green-500 bg-green-500"
                                                    : "border-gray-300"
                                            )}>
                                                {recommendation.recommendation === 'approve' && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="default" className={isChairperson ? "bg-green-600 text-white" : "bg-green-100 text-green-800"}>
                                                        <Check className="w-3 h-3 mr-1" />
                                                        {isChairperson ? 'Approve & Move Forward' : 'Approve'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    {isChairperson
                                                        ? 'Approve this proposal and move it to Data Collection phase.'
                                                        : 'Recommend this proposal for approval without changes.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revisions Card */}
                                    <div
                                        className={cn(
                                            "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                                            recommendation.recommendation === 'revisions'
                                                ? isChairperson
                                                    ? "border-yellow-600 bg-yellow-100"
                                                    : "border-yellow-500 bg-yellow-50"
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
                                                    ? isChairperson
                                                        ? "border-yellow-600 bg-yellow-600"
                                                        : "border-yellow-500 bg-yellow-500"
                                                    : "border-gray-300"
                                            )}>
                                                {recommendation.recommendation === 'revisions' && (
                                                    <Check className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={cn(
                                                        "border-yellow-300",
                                                        isChairperson
                                                            ? "bg-yellow-600 text-white border-yellow-600"
                                                            : "bg-yellow-50 text-yellow-700"
                                                    )}>
                                                        {isChairperson ? 'Request Revisions' : 'Revisions Needed'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    {isChairperson
                                                        ? 'Request revisions and send proposal back to researcher.'
                                                        : 'Request specific revisions before approval.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-2">
                                    <Label>
                                        {isChairperson ? 'Decision Comments' : 'Review Comments'}
                                        {recommendation.recommendation === 'revisions' && (
                                            <span className="text-red-500 ml-1">(Required)</span>
                                        )}
                                    </Label>
                                    {recommendation.recommendation === 'revisions' ? (
                                        <Textarea
                                            id="comments"
                                            placeholder={isChairperson
                                                ? "Provide detailed comments about required revisions..."
                                                : "Please provide detailed comments about required revisions..."
                                            }
                                            value={recommendation.comments}
                                            onChange={(e) => setRecommendation(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={4}
                                            className="resize-none"
                                        />
                                    ) : (
                                        <Textarea
                                            id="comments"
                                            placeholder={isChairperson
                                                ? "Optional comments for approval decision..."
                                                : "Optional comments for approval..."
                                            }
                                            value={recommendation.comments}
                                            onChange={(e) => setRecommendation(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={2}
                                            className="resize-none"
                                        />
                                    )}
                                </div>

                                {/* Template Buttons - Only for Chairperson */}
                                {isChairperson && (
                                    <div className="space-y-3 border-t pt-4">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Generate Document for Researcher
                                        </div>
                                        
                                        {recommendation.recommendation === 'approve' ? (
                                            // Show Ethical Clearance button for Approve
                                            <Button
                                                onClick={() => handleOpenPDFTemplate('ethical_clearance')}
                                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                <FileSignature className="w-4 h-4" />
                                                Fill & Send Ethical Clearance Form
                                            </Button>
                                        ) : (
                                            // Show Decision Letter button for Revisions
                                            <Button
                                                onClick={() => handleOpenPDFTemplate('decision_letter')}
                                                className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                                            >
                                                <FileSignature className="w-4 h-4" />
                                                Fill & Send Decision Letter
                                            </Button>
                                        )}
                                        
                                        <p className="text-xs text-gray-500 text-center">
                                            {recommendation.recommendation === 'approve' 
                                                ? 'This will open the Ethical Clearance form for you to fill and send to the researcher'
                                                : 'This will open the Decision Letter template for you to customize and send to the researcher'
                                            }
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    {hasUserSubmittedRecommendation && !isChairperson && (
                                        <div className="text-sm text-green-600">
                                            ✓ You have submitted your recommendation
                                        </div>
                                    )}
                                    {isChairperson && (
                                        <div className="text-sm text-purple-600 flex items-center gap-2">
                                            <Crown className="w-4 h-4" />
                                            Your decision will move the proposal to the next phase
                                        </div>
                                    )}
                                    <div className="flex gap-2 ml-auto">
                                        {hasUserSubmittedRecommendation && !isChairperson && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setRecommendation(prev => ({
                                                        ...prev,
                                                        comments: '',
                                                        recommendation: 'approve'
                                                    }));
                                                }}
                                            >
                                                Edit Recommendation
                                            </Button>
                                        )}
                                        <RippleButton
                                            onClick={submitRecommendation}
                                            disabled={recommendation.recommendation === 'revisions' && !recommendation.comments.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            {isChairperson
                                                ? 'Submit Final Decision'
                                                : hasUserSubmittedRecommendation
                                                    ? 'Update Recommendation'
                                                    : 'Submit Recommendation'
                                            }
                                        </RippleButton>
                                    </div>
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

            {/* PDF Template Modal - Full Screen */}
            {showPDFTemplate && templateUrl && (
                <div className="fixed inset-0 z-50 bg-white">
                    <PDFFormFiller
                        templateUrl={templateUrl}
                        templateName={templateType === 'ethical_clearance' 
                            ? 'Ethical_Clearance' 
                            : 'Decision_Letter'}
                        onSave={handleSavePDFTemplate}
                        onCancel={() => {
                            setShowPDFTemplate(false);
                            setTemplateType(null);
                            setTemplateUrl('');
                        }}
                    />
                </div>
            )}
        </div>
    );
}