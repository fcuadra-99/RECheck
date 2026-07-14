"use client";

import { FileText, Download, Eye, Check, X, User, Calendar, MessageSquare, Send, FileStack, Crown, FileSignature, ChevronDown, Archive, Columns2 } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { Label } from "recharts";
import PDFFormFiller from "@/components/PDFFormFiller";
import FormViewer, { DOC_COMPONENT_MAP } from "@/components/forms/FormViewer";
import { useTemplateFields } from "@/hooks/useTemplateFields";
import ProtocolReviewerAssessmentForm from "@/components/forms/ProtocolReviewerAssessmentForm";
import InformedConsentAssessmentForm from "@/components/forms/InformedConsentAssessmentForm";
import EthicalClearanceForm from "@/components/forms/EthicalClearanceForm";
import DecisionLetterForm from "@/components/forms/DecisionLetterForm";
import { createRoot } from "react-dom/client";

/* ----------------- types ----------------- */
interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    protocol_code?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string;
    advisor_id?: string | null;
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

interface ChairpersonDocumentItem {
    name: string;
    url: string;
    type: 'ethical_clearance' | 'decision_letter';
    format: 'json' | 'pdf';
}

interface ReviewRecommendation {
    recommendation: 'approve' | 'revisions';
    comments: string;
    reviewer_id: string;
    reviewer_name: string;
    submitted_at: string;
    history_id?: number;
}

type AssignmentMeta = {
    reviewerRoles?: Record<string, string>;
    reviewerDocs?: Record<string, string[]>;
    reviewerSections?: Record<string, string>;
    assignmentDate?: string | null;
};

const waitForRender = async (ms = 180) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};

const waitForAssets = async (container: HTMLElement) => {
    try {
        if ("fonts" in document) {
            await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
        }
    } catch {
        // Ignore font readiness failures and continue rendering.
    }

    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
        images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        })
    );

    await waitForRender(120);
};

const copyDocumentStyles = (targetDoc: Document) => {
    const styleNodes = Array.from(document.querySelectorAll("style, link[rel=\"stylesheet\"]"));
    styleNodes.forEach((node) => {
        targetDoc.head.appendChild(node.cloneNode(true));
    });
};

/* ----------------- component ----------------- */
export default function ReviewerPage() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [submissionDocuments, setSubmissionDocuments] = useState<DocumentItem[]>([]);
    const [chairpersonDocuments, setChairpersonDocuments] = useState<ChairpersonDocumentItem[]>([]);
    const [recommendation, setRecommendation] = useState<ReviewRecommendation>({
        recommendation: 'approve',
        comments: '',
        reviewer_id: '',
        reviewer_name: '',
        submitted_at: ''
    });
    const [existingRecommendations, setExistingRecommendations] = useState<ReviewRecommendation[]>([]);
    const [assignmentMeta, setAssignmentMeta] = useState<AssignmentMeta | null>(null);
    const [assignmentRolesByProposal, setAssignmentRolesByProposal] = useState<Record<number, string>>({});
    const [assignmentSectionsByProposal, setAssignmentSectionsByProposal] = useState<Record<number, string>>({});
    const [assignmentDatesByProposal, setAssignmentDatesByProposal] = useState<Record<number, string>>({});
    const [reviewWindowStartByProposal, setReviewWindowStartByProposal] = useState<Record<number, string>>({});
    const [reviewerRoleKey, setReviewerRoleKey] = useState<'primary' | 'secondary' | 'member' | null>(null);
    const [reviewerRoleLabel, setReviewerRoleLabel] = useState<string | null>(null);
    const [reviewerSectionHint, setReviewerSectionHint] = useState<string | null>(null);
    const [reviewedProposalIds, setReviewedProposalIds] = useState<Set<number>>(new Set());
    const [archivedProposalIds, setArchivedProposalIds] = useState<Set<number>>(new Set());
    const [isEditingRecommendation, setIsEditingRecommendation] = useState(false);

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");
    const [showAssessmentPreview, setShowAssessmentPreview] = useState(false);
    const [assessmentPreviewType, setAssessmentPreviewType] = useState<'reviewer_assessment' | 'informed_consent' | null>(null);
    const [assessmentPreviewData, setAssessmentPreviewData] = useState<Record<string, any>>({});
    const [printAssessmentOnOpen, setPrintAssessmentOnOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);
    const [chairpersonPreviewOpen, setChairpersonPreviewOpen] = useState(false);
    const [chairpersonPreviewType, setChairpersonPreviewType] = useState<'ethical_clearance' | 'decision_letter' | null>(null);
    const [chairpersonPreviewFormat, setChairpersonPreviewFormat] = useState<'json' | 'pdf' | null>(null);
    const [chairpersonPreviewData, setChairpersonPreviewData] = useState<Record<string, any>>({});
    const [chairpersonPreviewTitle, setChairpersonPreviewTitle] = useState<string>('');
    const [chairpersonPreviewUrl, setChairpersonPreviewUrl] = useState<string | null>(null);

    // PDF template states
    const [showPDFTemplate, setShowPDFTemplate] = useState(false);
    const [templateType, setTemplateType] = useState<'ethical_clearance' | 'decision_letter' | 'reviewer_assessment' | 'informed_consent' | null>(null);
    const [templateUrl, setTemplateUrl] = useState<string>('');
    const [ethicalClearanceData, setEthicalClearanceData] = useState<Record<string, any>>({});
    const [decisionLetterData, setDecisionLetterData] = useState<Record<string, any>>({});
    const [reviewerAssessmentData, setReviewerAssessmentData] = useState<Record<string, any>>({});
    const [informedConsentData, setInformedConsentData] = useState<Record<string, any>>({});
    const [revisionTargets, setRevisionTargets] = useState<string[]>([]);
    
    // Preload template fields based on current template type
    const templateId = templateType === 'reviewer_assessment' ? 'protocol-reviewer-assessment'
        : templateType === 'informed_consent' ? 'informed-consent-assessment'
        : null;
    const { fields: predefinedFields, loading: fieldsLoading } = useTemplateFields(templateId);
    
    // Debug logging
    console.log('🔍 Reviewer Submissions - templateType:', templateType, 'templateId:', templateId, 'fields:', predefinedFields?.length, 'loading:', fieldsLoading);

    // Assessment form tracking
    const [hasSubmittedProtocolAssessment, setHasSubmittedProtocolAssessment] = useState(false);
    const [hasSubmittedInformedConsent, setHasSubmittedInformedConsent] = useState(false);
    const [submittedAssessmentForms, setSubmittedAssessmentForms] = useState<DocumentItem[]>([]);
    const [revisionSubmissionsCount, setRevisionSubmissionsCount] = useState(0);
    const [decisionLetterSentCount, setDecisionLetterSentCount] = useState(0);
    const [ethicalClearanceSentCount, setEthicalClearanceSentCount] = useState(0);
    const [hasSubmittedChairpersonRevisionNote, setHasSubmittedChairpersonRevisionNote] = useState(false);

    // Local form completion tracking (before final submission)
    const [hasCompletedProtocolAssessment, setHasCompletedProtocolAssessment] = useState(false);
    const [hasCompletedInformedConsent, setHasCompletedInformedConsent] = useState(false);
    const [hasCompletedEthicalClearance, setHasCompletedEthicalClearance] = useState(false);
    const [hasCompletedDecisionLetter, setHasCompletedDecisionLetter] = useState(false);
    const [isPassingToAdmin, setIsPassingToAdmin] = useState(false);
    const [hasPassedToAdmin, setHasPassedToAdmin] = useState(false);
    const [decisionLetterDraftKey, setDecisionLetterDraftKey] = useState(0);

    useEffect(() => {
        setHasCompletedProtocolAssessment(false);
        setHasCompletedInformedConsent(false);
        setHasCompletedEthicalClearance(false);
        setHasCompletedDecisionLetter(false);
        setHasPassedToAdmin(false);
        setIsEditingRecommendation(false);
    }, [activeSubmission?.proposal_id]);

    const [activeFormName, setActiveFormName] = useState<string | null>(null);

    // Split Screen States
    const [isSplitScreen, setIsSplitScreen] = useState(false);
    const [splitSelectedDoc, setSplitSelectedDoc] = useState<DocumentItem | null>(null);
    const [previewActiveTab, setPreviewActiveTab] = useState<'manuscript' | 'forms'>('manuscript');

    // user
    const [userId, setUserId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [isChairperson, setIsChairperson] = useState(false);

    const parseAssignmentMeta = (raw: any) => {
        if (!raw) return null;
        if (typeof raw === 'object') return raw as { reviewerRoles?: Record<string, string>; reviewerDocs?: Record<string, string[]>; reviewerSections?: Record<string, string> };
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw) as { reviewerRoles?: Record<string, string>; reviewerDocs?: Record<string, string[]>; reviewerSections?: Record<string, string> };
            } catch (error) {
                return null;
            }
        }
        return null;
    };

    const fetchAssignmentMeta = async (proposalId: number) => {
        const { data, error } = await supabase
            .from("history")
            .select("affected_files, history_date")
            .eq("paper_id", proposalId)
            .eq("history_type", "assignment")
            .order("history_date", { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            return null;
        }

        const parsed = parseAssignmentMeta(data[0].affected_files);
        return {
            reviewerRoles: parsed?.reviewerRoles,
            reviewerDocs: parsed?.reviewerDocs,
            reviewerSections: parsed?.reviewerSections,
            assignmentDate: data[0].history_date || null,
        } as AssignmentMeta;
    };

    const fetchLatestSubmissionDate = async (proposalId: number) => {
        const { data, error } = await supabase
            .from("history")
            .select("history_date")
            .eq("paper_id", proposalId)
            .eq("history_type", "submission")
            .order("history_date", { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            return null;
        }

        return data[0].history_date || null;
    };

    const loadRevisionCycleInfo = async (proposalId: number) => {
        const { data, error } = await supabase
            .from("history")
            .select("history_type, action, comment, history_date")
            .eq("paper_id", proposalId)
            .eq("history_type", "submission")
            .order("history_date", { ascending: false });

        if (error || !data) {
            setRevisionSubmissionsCount(0);
            return;
        }

        const revisionSubmissions = data.filter((entry) => {
            if (entry.action === 'Submit Revisions') return true;
            const note = String(entry.comment || '').toLowerCase();
            return note.includes('revision');
        });

        setRevisionSubmissionsCount(revisionSubmissions.length);
    };

    const loadDecisionLetterInfo = async (proposalId: number) => {
        const { data, error } = await supabase
            .from("history")
            .select("history_id")
            .eq("paper_id", proposalId)
            .eq("history_type", "decision_letter_sent");

        if (error || !data) {
            setDecisionLetterSentCount(0);
            return 0;
        }

        setDecisionLetterSentCount(data.length);
        return data.length;
    };

    const loadEthicalClearanceInfo = async (proposalId: number) => {
        const { data, error } = await supabase
            .from("history")
            .select("history_id")
            .eq("paper_id", proposalId)
            .eq("history_type", "ethical_clearance_sent");

        if (error || !data) {
            setEthicalClearanceSentCount(0);
            return;
        }

        setEthicalClearanceSentCount(data.length);
    };

    const loadReviewerArchives = async (uid: string) => {
        const { data, error } = await supabase
            .from("history")
            .select("paper_id")
            .eq("history_type", "reviewer_archive")
            .eq("actor", uid);

        if (error) {
            console.error("Error loading reviewer archives:", error);
            return;
        }

        const nextArchived = new Set<number>(
            (data || [])
                .map((row: { paper_id?: number | null }) => row.paper_id)
                .filter((id: number | null | undefined): id is number => typeof id === "number")
        );
        setArchivedProposalIds(nextArchived);
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

                await loadReviewerArchives(uid);

                // Get user profile to check if chairperson
                let isChair = false;
                const { data: userProfileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, fname, lname, category, role")
                    .eq("id", uid)
                    .single();

                if (profileError) {
                    console.error("Error fetching user profile:", profileError);
                } else if (userProfileData && mounted) {
                    setUserProfile(userProfileData);
                    isChair = userProfileData.role === 'Chairperson' || userProfileData.role === 'Admin';
                    setIsChairperson(isChair);
                }

                const { data: proposals, error } = await supabase
                    .from("proposals")
                    .select("*")
                    .in("status", ["Proposal Review", "Data Collection", "Revise Proposal", "Archive Files"])
                    .like("reviewer", `%${uid}%`)
                    .order("date", { ascending: false });

                if (error) throw error;
                let projs = (proposals || []) as Submission[];

                if (mounted) setSubmissions(projs);

                let reviewWindowSnapshot: Record<number, string> = {};
                if (mounted && uid && projs.length > 0) {
                    const roleEntries = await Promise.all(
                        projs.map(async (proposal) => {
                            const meta = await fetchAssignmentMeta(proposal.proposal_id);
                            const latestSubmissionDate = await fetchLatestSubmissionDate(proposal.proposal_id);
                            const role = meta?.reviewerRoles?.[uid] || null;
                            const section = meta?.reviewerSections?.[uid] || null;
                            const assignmentDate = meta?.assignmentDate || null;
                            const reviewWindowStart = pickLaterDate(assignmentDate, latestSubmissionDate);
                            return [proposal.proposal_id, role, section, assignmentDate, reviewWindowStart] as const;
                        })
                    );

                    const nextRoles: Record<number, string> = {};
                    const nextSections: Record<number, string> = {};
                    const nextDates: Record<number, string> = {};
                    const nextWindows: Record<number, string> = {};
                    roleEntries.forEach(([proposalId, role, section, assignmentDate, reviewWindowStart]) => {
                        if (role) {
                            nextRoles[proposalId] = role;
                        }
                        if (section) {
                            nextSections[proposalId] = section;
                        }
                        if (assignmentDate) {
                            nextDates[proposalId] = assignmentDate;
                        }
                        if (reviewWindowStart) {
                            nextWindows[proposalId] = reviewWindowStart;
                        }
                    });

                    reviewWindowSnapshot = nextWindows;

                    if (mounted) {
                        setAssignmentRolesByProposal(nextRoles);
                        setAssignmentSectionsByProposal(nextSections);
                        setAssignmentDatesByProposal(nextDates);
                        setReviewWindowStartByProposal(nextWindows);
                    }
                }

                if (uid) {
                    const { data: userRecommendations } = await supabase
                        .from("history")
                        .select("paper_id, history_date")
                        .eq("actor", uid)
                        .eq("history_type", "review_recommendation");

                    const proposalIds = projs.map((p) => p.proposal_id).filter((id) => typeof id === 'number');
                    const { data: clearanceHistory } = await supabase
                        .from("history")
                        .select("paper_id")
                        .eq("history_type", "ethical_clearance_sent")
                        .in("paper_id", proposalIds);

                    const clearanceSet = new Set<number>(
                        (clearanceHistory || [])
                            .map((rec: { paper_id?: number | null }) => rec.paper_id)
                            .filter((id: number | null | undefined): id is number => typeof id === 'number')
                    );

                    const reviewedSet = new Set<number>(
                        (userRecommendations || [])
                            .filter((rec: { paper_id?: number | null; history_date?: string | null }) => {
                                if (typeof rec.paper_id !== 'number') return false;
                                if (isChair) {
                                    const windowStart = reviewWindowSnapshot[rec.paper_id] || assignmentDatesByProposal[rec.paper_id];
                                    if (!windowStart) return true;
                                    const recTime = rec.history_date ? new Date(rec.history_date).getTime() : 0;
                                    const windowTime = new Date(windowStart).getTime();
                                    return recTime >= windowTime;
                                }
                                return true;
                            })
                            .map((rec: { paper_id?: number | null }) => rec.paper_id as number)
                    );

                    clearanceSet.forEach((id) => reviewedSet.add(id));

                    if (mounted) setReviewedProposalIds(reviewedSet);
                }

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
        loadSubmissionData();
    }, [activeSubmission, userId, userProfile]);

    /* Load submission documents and recommendations */
    const loadSubmissionData = async () => {
        if (!activeSubmission) {
            setSubmissionDocuments([]);
            setExistingRecommendations([]);
            setRevisionSubmissionsCount(0);
            setDecisionLetterSentCount(0);
            setEthicalClearanceSentCount(0);
            setHasSubmittedChairpersonRevisionNote(false);
            setHasPassedToAdmin(false);
            return;
        }

        try {
            const documents = await buildSubmissionDocuments(activeSubmission.proposal_id);
            const meta = await fetchAssignmentMeta(activeSubmission.proposal_id);
            const reviewerAllowedDocs = userId ? (meta?.reviewerDocs?.[userId] || []) : [];
            const allowedDocSet = new Set(
                reviewerAllowedDocs.map((doc) =>
                    doc.trim().toLowerCase().replace(/\.pdf$/i, '').replace(/^v\d+_/, '')
                )
            );
            const filteredDocuments = allowedDocSet.size > 0
                ? documents.filter((doc) => {
                    const docNameNoExt = doc.name.trim().toLowerCase().replace(/\.pdf$/i, '');
                    const normalizedName = docNameNoExt.replace(/^v\d+_/, '');
                    return allowedDocSet.has(normalizedName);
                })
                : documents;

            setSubmissionDocuments(filteredDocuments);
            setAssignmentMeta(meta);

            const roleValue = userId ? meta?.reviewerRoles?.[userId] : null;
            const normalizedRole = roleValue === 'primary' || roleValue === 'secondary' || roleValue === 'member'
                ? roleValue
                : null;
            setReviewerRoleKey(normalizedRole);
            setReviewerRoleLabel(
                normalizedRole === 'primary'
                    ? 'Primary reviewer'
                    : normalizedRole === 'secondary'
                        ? 'Secondary reviewer'
                        : normalizedRole === 'member'
                            ? 'Member'
                            : null
            );
            setReviewerSectionHint(userId ? meta?.reviewerSections?.[userId] || null : null);
            setRevisionTargets([]);
            setDecisionLetterData({});
            await loadRevisionCycleInfo(activeSubmission.proposal_id);
            const decisionLetterCount = await loadDecisionLetterInfo(activeSubmission.proposal_id);
            await loadEthicalClearanceInfo(activeSubmission.proposal_id);
            setChairpersonDocuments(isChairperson ? await loadChairpersonDecisionDocuments(activeSubmission.proposal_id) : []);

            // Check if decision letter has already been passed to admin for this proposal
            const { data: passedToAdminHistory } = await supabase
                .from("history")
                .select("history_id")
                .eq("paper_id", activeSubmission.proposal_id)
                .eq("history_type", "passed_to_admin")
                .limit(1);
            setHasPassedToAdmin(Boolean(passedToAdminHistory && passedToAdminHistory.length > 0));

            const assignmentDate = meta?.assignmentDate || null;
            const latestSubmissionDate = await fetchLatestSubmissionDate(activeSubmission.proposal_id);
            const reviewWindowStart = pickLaterDate(assignmentDate, latestSubmissionDate);
            if (reviewWindowStart) {
                setReviewWindowStartByProposal((prev) => ({
                    ...prev,
                    [activeSubmission.proposal_id]: reviewWindowStart
                }));
            }

            if (userId) {
                let chairpersonNoteQuery = supabase
                    .from("history")
                    .select("history_id")
                    .eq("paper_id", activeSubmission.proposal_id)
                    .eq("actor", userId)
                    .eq("history_type", "review_decision")
                    .eq("action", "CHAIRPERSON_DECISION_REVISIONS")
                    .order("history_date", { ascending: false })
                    .limit(1);
                if (reviewWindowStart) {
                    chairpersonNoteQuery = chairpersonNoteQuery.gte("history_date", reviewWindowStart);
                }

                const { data: chairpersonNoteData } = await chairpersonNoteQuery;
                setHasSubmittedChairpersonRevisionNote(Boolean(chairpersonNoteData && chairpersonNoteData.length > 0));
            } else {
                setHasSubmittedChairpersonRevisionNote(false);
            }

            const isChair = isChairperson || (userProfile?.role === 'Chairperson' || userProfile?.role === 'Admin');

            // Load recommendations from history table - EXCLUDE current user's recommendations
            let recommendationsQuery = supabase
                .from("history")
                .select("*")
                .eq("paper_id", activeSubmission.proposal_id)
                .eq("history_type", "review_recommendation")
                .order("history_date", { ascending: false });
            if (reviewWindowStart && !isChair) {
                recommendationsQuery = recommendationsQuery.gte("history_date", reviewWindowStart);
            }
            const { data: recommendations, error } = await recommendationsQuery;

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
                let userRecommendationQuery = supabase
                    .from("history")
                    .select("*")
                    .eq("paper_id", activeSubmission.proposal_id)
                    .eq("history_type", "review_recommendation")
                    .eq("actor", userId)
                    .order("history_date", { ascending: false });
                if (reviewWindowStart) {
                    userRecommendationQuery = userRecommendationQuery.gte("history_date", reviewWindowStart);
                }
                const { data: userRecommendation, error: userRecError } = await userRecommendationQuery.single();

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
                    const currentIsChairperson = userProfile ? (userProfile.role === 'Chairperson' || userProfile.role === 'Admin') : false;
                    const shouldDefaultToRevisions = currentIsChairperson && decisionLetterCount === 0;
                    setRecommendation({
                        recommendation: shouldDefaultToRevisions ? 'revisions' : 'approve',
                        comments: '',
                        reviewer_id: userId,
                        reviewer_name: currentUserName,
                        submitted_at: ''
                    });
                }
            }

            // Load submitted assessment forms
            await loadAssessmentForms(reviewWindowStart);
        } catch (err) {
            console.error("Failed to load submission data:", err);
            toast.error("Failed to load submission data");
        }
    };

    /* Load assessment forms for the current user */
    const loadAssessmentForms = async (reviewWindowStart?: string | null) => {
        if (!activeSubmission || !userId) {
            setHasSubmittedProtocolAssessment(false);
            setHasSubmittedInformedConsent(false);
            setSubmittedAssessmentForms([]);
            return;
        }

        const shouldApplyWindow = !(isChairperson || userProfile?.role === 'Chairperson' || userProfile?.role === 'Admin');
        const windowTime = shouldApplyWindow && reviewWindowStart ? new Date(reviewWindowStart).getTime() : null;
        const extractTimestamp = (name: string) => {
            const match = name.match(/_(\d{10,13})(?:\.[a-z0-9]+)?$/i);
            if (!match) return null;
            const parsed = Number(match[1]);
            return Number.isFinite(parsed) ? parsed : null;
        };
        const isWithinWindow = (name: string, createdAt?: string | null) => {
            if (!windowTime) return true;
            const filenameTs = extractTimestamp(name);
            if (filenameTs) return filenameTs >= windowTime;
            if (createdAt) return new Date(createdAt).getTime() >= windowTime;
            return true;
        };

        try {
            const path = `${activeSubmission.proposal_id}/Assessments`;
            const { data, error } = await supabase.storage.from("documents").list(path);

            if (error) {
                if (!error.message.includes('not found')) {
                    console.error("Error loading assessment forms:", error);
                }
                setHasSubmittedProtocolAssessment(false);
                setHasSubmittedInformedConsent(false);
                setSubmittedAssessmentForms([]);
                return;
            }

            if (!data || data.length === 0) {
                console.log("No assessment forms found in storage");
                setHasSubmittedProtocolAssessment(false);
                setHasSubmittedInformedConsent(false);
                setSubmittedAssessmentForms([]);
                return;
            }

            console.log("Found assessment forms:", data);

            // Check for current user's assessment forms (for reviewers)
            const userProtocolAssessment = data.find(f =>
                f.name.includes(`Reviewer_Assessment_${activeSubmission.proposal_id}_${userId}`) &&
                isWithinWindow(f.name, (f as any).created_at)
            );
            const userInformedConsent = data.find(f =>
                f.name.includes(`Informed_Consent_Assessment_${activeSubmission.proposal_id}_${userId}`) &&
                isWithinWindow(f.name, (f as any).created_at)
            );

            setHasSubmittedProtocolAssessment(!!userProtocolAssessment);
            setHasSubmittedInformedConsent(!!userInformedConsent);

            // Load all assessment forms with signed URLs (for chairperson and reviewer view)
            const assessmentForms = await Promise.all(
                data.filter((f: any) => isWithinWindow(f.name, f.created_at)).map(async (f: any) => {
                    const { data: signed, error: signError } = await supabase.storage
                        .from("documents")
                        .createSignedUrl(`${path}/${f.name}`, 60 * 60); // 1 hour expiry

                    if (signError) {
                        console.error("Error signing URL:", signError);
                        return null;
                    }

                    return { 
                        name: f.name, 
                        url: signed.signedUrl, 
                        phase: 'phase1' as 'phase1' | 'phase3'
                    };
                })
            );

            const filteredForms = assessmentForms.filter((f): f is { name: string; url: string; phase: 'phase1' | 'phase3' } => f !== null);
            console.log("Loaded assessment forms for display:", filteredForms.length);
            setSubmittedAssessmentForms(filteredForms);
        } catch (err) {
            console.error("Error loading assessment forms:", err);
            setHasSubmittedProtocolAssessment(false);
            setHasSubmittedInformedConsent(false);
            setSubmittedAssessmentForms([]);
        }
    };

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

    const loadChairpersonDecisionDocuments = async (proposalId: number): Promise<ChairpersonDocumentItem[]> => {
        try {
            const path = `${proposalId}/Decisions`;
            const { data, error } = await supabase.storage.from('documents').list(path);

            if (error) {
                if (!error.message.includes('not found')) {
                    console.error('Error loading chairperson decision documents:', error);
                }
                return [];
            }

            const filteredData = data.filter(file => !file.name.toLowerCase().includes('draft'));
            if (filteredData.length === 0) return [];

            const signedFiles = await Promise.all(
                filteredData.map(async (file: any) => {
                    const { data: signed, error: signError } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(`${path}/${file.name}`, 60 * 60);

                    if (signError || !signed?.signedUrl) {
                        console.error('Signed URL error for chairperson document:', signError?.message || 'unknown error');
                        return null;
                    }

                    const lowerName = String(file.name || '').toLowerCase();
                    return {
                        name: file.name,
                        url: signed.signedUrl,
                        type: lowerName.includes('ethical_clearance') ? 'ethical_clearance' : 'decision_letter',
                        format: lowerName.endsWith('.json') ? 'json' : 'pdf',
                    } as ChairpersonDocumentItem;
                })
            );

            return signedFiles.filter((file): file is ChairpersonDocumentItem => file !== null);
        } catch (error) {
            console.error('Failed to load chairperson decision documents:', error);
            return [];
        }
    };

    const extractFileName = (filePath: string) => {
        const raw = filePath.split('/').pop() || filePath;
        return raw.trim();
    };

    const buildFormDataVirtualPath = (proposalId: number, formName: string) =>
        `form-data://${proposalId}/${encodeURIComponent(formName)}`;

    const isFormDataUrl = (url: string) => url.startsWith('form-data://');

    const getPhaseFromDocType = (docType: string, filePath?: string): 'phase1' | 'phase3' => {
        const docLower = (docType || '').toLowerCase();
        if (docLower.includes('manuscript')) return 'phase1';

        const pathLower = (filePath || '').toLowerCase();
        if (pathLower.includes('/send manuscript/')) return 'phase1';
        if (pathLower.includes('/send forms/')) return 'phase3';

        return 'phase3';
    };

    const buildSubmissionDocuments = async (proposalId: number): Promise<DocumentItem[]> => {
        const documents: DocumentItem[] = [];
        const seen = new Set<string>();

        const [{ data: proposalDocs }, { data: formDataRows }, phase1Files, phase3Files] = await Promise.all([
            supabase
                .from("proposal_documents")
                .select("*")
                .eq("proposal_id", proposalId)
                .order("uploaded_at", { ascending: false }),
            supabase
                .from("form_data")
                .select("form_name, revision_number")
                .eq("proposal_id", proposalId),
            listStoredFilesForPhase(proposalId, 'phase1'),
            listStoredFilesForPhase(proposalId, 'phase3')
        ]);

        const formDataNameMap = new Map<string, string>();
        for (const row of formDataRows || []) {
            const raw = (row.form_name || '').trim();
            if (!raw) continue;
            const rev = row.revision_number || 1;
            const displayName = `v${rev}_${raw}`;
            formDataNameMap.set(displayName.toLowerCase(), displayName);
        }

        for (const doc of proposalDocs || []) {
            const docNameBase = (doc.doc_type || doc.file_name || extractFileName(doc.file_path || ''))?.trim();
            if (!docNameBase) continue;

            let docName = docNameBase;
            if (doc.revision_number && doc.revision_number > 1) {
                const cleanBase = docNameBase.replace(/\.pdf$/i, '');
                docName = `v${doc.revision_number}_${cleanBase}`;
                if (docNameBase.toLowerCase().endsWith('.pdf')) {
                    docName += '.pdf';
                }
            }

            const key = docName.toLowerCase();
            const baseKey = docNameBase.toLowerCase();
            const baseKeyNoExt = docNameBase.replace(/\.pdf$/i, '').toLowerCase();

            if (seen.has(key) || seen.has(baseKey) || seen.has(baseKeyNoExt)) continue;

            let url = '';
            if (doc.file_path) {
                const { data: signed, error } = await supabase.storage
                    .from("documents")
                    .createSignedUrl(doc.file_path, 60 * 5);
                if (!error && signed?.signedUrl) {
                    url = signed.signedUrl;
                }
            }

            const docKey = docName.toLowerCase();
            if (!url && formDataNameMap.has(docKey)) {
                url = buildFormDataVirtualPath(proposalId, formDataNameMap.get(docKey) || docName);
            }

            if (!url) continue;

            documents.push({
                name: docName,
                url,
                phase: getPhaseFromDocType(doc.doc_type || docName, doc.file_path)
            });
            seen.add(key);
            seen.add(baseKey);
            seen.add(baseKeyNoExt);
        }

        for (const [key, formName] of formDataNameMap.entries()) {
            const baseKeyNoExt = key.replace(/\.pdf$/i, '');
            if (seen.has(key) || seen.has(baseKeyNoExt)) continue;
            documents.push({
                name: formName,
                url: buildFormDataVirtualPath(proposalId, formName),
                phase: 'phase3'
            });
            seen.add(key);
            seen.add(baseKeyNoExt);
        }

        for (const file of [...phase1Files, ...phase3Files]) {
            const key = file.name.toLowerCase();
            const baseKeyNoExt = file.name.replace(/\.pdf$/i, '').toLowerCase();
            if (seen.has(key) || seen.has(baseKeyNoExt)) continue;
            documents.push({
                name: file.name,
                url: file.url,
                phase: phase1Files.includes(file) ? 'phase1' : 'phase3'
            });
            seen.add(key);
            seen.add(baseKeyNoExt);
        }

        return documents;
    };

    /* Open document preview */
    const openPreview = async (url: string, filename: string) => {
        setPreviewUrl(url);
        setPreviewTitle(filename);
        setPreviewOpen(true);
        setIsSplitScreen(false);
        setSplitSelectedDoc(null);
    };

    const openDocument = async (doc: DocumentItem) => {
        setPreviewUrl(doc.url);
        setPreviewTitle(doc.name);
        setActiveFormName(isFormDataUrl(doc.url) ? doc.name : null);
        setPreviewActiveTab(doc.phase === 'phase1' ? 'manuscript' : 'forms');
        setIsSplitScreen(false);
        setSplitSelectedDoc(null);
        setPreviewOpen(true);
    };

    const renderSplitScreenDocumentViewer = () => {
        const manuscriptDocs = submissionDocuments.filter(doc => doc.phase === 'phase1');
        const formsDocs = submissionDocuments.filter(doc => doc.phase === 'phase3');

         return (
            <div 
                className="w-1/2 flex border-l bg-white min-h-0 h-full overflow-hidden flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar - File List */}
                <div className="w-64 bg-gray-50 border-r flex flex-col flex-shrink-0 min-h-0 h-full overflow-hidden">
                    <div className="p-4 border-b bg-white">
                        <h2 className="text-sm font-semibold">Documents</h2>
                        <p className="text-xs text-gray-500 mt-1">Select to view</p>
                    </div>

                    {/* Document Type Tabs */}
                    <div className="p-2 border-b bg-white">
                        <div className="flex gap-1">
                            <Button
                                variant={previewActiveTab === "manuscript" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setPreviewActiveTab("manuscript");
                                    setSplitSelectedDoc(null);
                                }}
                                className="flex-1 text-xs"
                            >
                                Manuscript
                            </Button>
                            <Button
                                variant={previewActiveTab === "forms" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setPreviewActiveTab("forms");
                                    setSplitSelectedDoc(null);
                                }}
                                className="flex-1 text-xs"
                            >
                                Forms
                            </Button>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                        {previewActiveTab === "manuscript" && manuscriptDocs.map((doc) => (
                            <Button
                                key={doc.name}
                                variant={splitSelectedDoc?.name === doc.name ? "default" : "outline"}
                                onClick={() => {
                                    setSplitSelectedDoc(doc);
                                }}
                                className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal break-words"
                            >
                                <div className="flex items-start gap-2">
                                    <FileText className="h-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs truncate flex-1">{doc.name}</span>
                                </div>
                            </Button>
                        ))}
                        {previewActiveTab === "forms" && formsDocs.map((doc) => (
                            <Button
                                key={doc.name}
                                variant={splitSelectedDoc?.name === doc.name ? "default" : "outline"}
                                onClick={() => {
                                    setSplitSelectedDoc(doc);
                                }}
                                className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal break-words"
                            >
                                <div className="flex items-start gap-2">
                                    <FileText className="h-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs truncate flex-1">{doc.name}</span>
                                </div>
                            </Button>
                        ))}
                        {((previewActiveTab === "manuscript" && manuscriptDocs.length === 0) ||
                            (previewActiveTab === "forms" && formsDocs.length === 0)) && (
                            <div className="text-center text-gray-500 py-8">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-xs">No documents</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Document Preview */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-100 min-h-0 h-full overflow-hidden">
                    <div className="p-2 border-b bg-white">
                        <h3 className="text-xs font-semibold truncate">
                            {splitSelectedDoc ? splitSelectedDoc.name.replace('.pdf', '') : 'Select a document'}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-white min-h-0 relative">
                        {splitSelectedDoc ? (
                            isFormDataUrl(splitSelectedDoc.url) ? (
                                <div className="h-full">
                                    <FormViewer
                                        key={`split-${activeSubmission?.proposal_id}-${splitSelectedDoc.name}`}
                                        documentName={splitSelectedDoc.name}
                                        proposalId={activeSubmission!.proposal_id}
                                        protocolCode={activeSubmission?.protocol_id}
                                        proposalTitle={activeSubmission?.proposal_title}
                                        reviewType={activeSubmission?.review_type}
                                        researcherName={(() => {
                                            const p = profiles.find((x) => x.id === activeSubmission?.researcher);
                                            return p ? `${p.fname ?? ""} ${p.lname ?? ""}`.trim() : "";
                                        })()}
                                        advisorId={activeSubmission?.advisor_id}
                                        readOnly={true}
                                        onDone={() => setSplitSelectedDoc(null)}
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={splitSelectedDoc.url}
                                    className="w-full h-full border-0 absolute inset-0"
                                    title={splitSelectedDoc.name.replace('.pdf', '') || "Document Viewer"}
                                />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-xs">Select a document</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleFormDataDownload = async (proposalId: number, formName: string) => {
        try {
            let actualFormName = formName;
            let explicitRevision = 1;
            const match = formName.match(/^v(\d+)_(.+)$/);
            if (match) {
                explicitRevision = parseInt(match[1], 10);
                actualFormName = match[2];
            }

            const { data, error } = await supabase
                .from("form_data")
                .select("data")
                .eq("proposal_id", proposalId)
                .eq("form_name", actualFormName)
                .eq("revision_number", explicitRevision)
                .single();

            if (error || !data) {
                toast.error(`Could not fetch saved data for ${formName}.`);
                return;
            }

            const FormComponent = DOC_COMPONENT_MAP[actualFormName];
            if (!FormComponent) {
                toast.error(`No form renderer found for ${actualFormName}.`);
                return;
            }

            const { data: proposalData } = await supabase
                .from("proposals")
                .select("protocol_id, proposal_title, review_type, researcher, advisor")
                .eq("proposal_id", proposalId)
                .single();

            let researcherName = "";
            if (proposalData?.researcher) {
                const { data: researcherProfile } = await supabase
                    .from("profiles")
                    .select("fname, lname")
                    .eq("id", proposalData.researcher)
                    .single();

                researcherName = researcherProfile
                    ? `${researcherProfile.fname || ""} ${researcherProfile.lname || ""}`.trim()
                    : "";
            }

            let advisorName = "";
            if (proposalData?.advisor) {
                const { data: advisorProfile } = await supabase
                    .from("profiles")
                    .select("fname, lname")
                    .eq("id", proposalData.advisor)
                    .single();

                advisorName = advisorProfile
                    ? `${advisorProfile.fname || ""} ${advisorProfile.lname || ""}`.trim()
                    : "";
            }

            const printWindow = window.open("", "_blank", "width=1200,height=900");
            if (!printWindow) {
                toast.error("Popup was blocked. Please allow popups and try again.");
                return;
            }

            printWindow.document.open();
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>${formName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
                        <style>
                            html, body {
                                margin: 0;
                                padding: 0;
                                background: white;
                            }
                            @page {
                                size: A4;
                                margin: 10mm;
                            }
                            @media print {
                                html, body {
                                    background: white;
                                }
                            }
                            #print-root {
                                width: 100%;
                                display: block;
                                box-sizing: border-box;
                            }
                        </style>
                    </head>
                    <body>
                        <div id="print-root"></div>
                    </body>
                </html>
            `);
            printWindow.document.close();

            copyDocumentStyles(printWindow.document);

            const printRootEl = printWindow.document.getElementById("print-root");
            if (!printRootEl) {
                toast.error("Failed to prepare print view.");
                return;
            }

            const root = createRoot(printRootEl);
            root.render(
                <FormComponent
                    proposalId={proposalId}
                    protocolCode={proposalData?.protocol_id || ""}
                    proposalTitle={proposalData?.proposal_title || ""}
                    reviewType={proposalData?.review_type || ""}
                    researcherName={researcherName}
                    advisorName={advisorName}
                    formName={actualFormName}
                    savedData={data.data || {}}
                    readOnlyAdvisor
                />
            );

            await waitForRender(260);
            await waitForAssets(printRootEl);

            printWindow.focus();
            printWindow.print();

            setTimeout(() => {
                root.unmount();
                printWindow.close();
            }, 800);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to download form.");
        }
    };

    const openAssessmentPreview = async (url: string, filename: string) => {
        const lowerName = filename.toLowerCase();
        const isReviewerAssessment = lowerName.includes('reviewer_assessment');
        const isInformedConsent = lowerName.includes('informed_consent_assessment');

        if (!isReviewerAssessment && !isInformedConsent) {
            openPreview(url, filename);
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);

            const text = await response.text();
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid assessment JSON');

            setAssessmentPreviewData(parsed);
            setAssessmentPreviewType(isReviewerAssessment ? 'reviewer_assessment' : 'informed_consent');
            setShowAssessmentPreview(true);
        } catch {
            // Legacy submissions are PDFs; keep existing preview behavior.
            openPreview(url, filename);
        }
    };

    const handleDownloadAssessmentForm = async (url: string, filename: string) => {
        const lowerName = filename.toLowerCase();
        const isReviewerAssessment = lowerName.includes('reviewer_assessment');
        const isInformedConsent = lowerName.includes('informed_consent_assessment');
        const isAssessmentJson = lowerName.endsWith('.json') && (isReviewerAssessment || isInformedConsent);

        if (!isAssessmentJson) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename || 'download';
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(link.href);
            } catch (error) {
                console.error('Error downloading assessment form:', error);
                toast.error('Failed to download assessment form');
            }
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);

            const text = await response.text();
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object') throw new Error('Invalid assessment JSON');

            setAssessmentPreviewData(parsed);
            setAssessmentPreviewType(isReviewerAssessment ? 'reviewer_assessment' : 'informed_consent');
            setPrintAssessmentOnOpen(true);
            setShowAssessmentPreview(true);
        } catch (error) {
            console.error('Error preparing assessment download:', error);
            toast.error('Failed to download assessment form');
        }
    };

    const getChairpersonDocumentLabel = (type: 'ethical_clearance' | 'decision_letter') => {
        return type === 'ethical_clearance' ? 'Ethical Clearance' : 'Decision Letter';
    };

    const openChairpersonDocument = async (doc: ChairpersonDocumentItem) => {
        setChairpersonPreviewTitle(getChairpersonDocumentLabel(doc.type));
        setChairpersonPreviewType(doc.type);
        setChairpersonPreviewFormat(doc.format);
        setChairpersonPreviewUrl(doc.url);

        if (doc.format === 'json') {
            try {
                const response = await fetch(doc.url);
                if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);

                const text = await response.text();
                const parsed = JSON.parse(text);
                if (!parsed || typeof parsed !== 'object') throw new Error('Invalid chairperson document JSON');

                setChairpersonPreviewData(parsed);
                setChairpersonPreviewOpen(true);
                return;
            } catch (error) {
                console.error('Error loading chairperson document preview:', error);
                toast.error('Failed to load document preview');
                return;
            }
        }

        setChairpersonPreviewData({});
        setChairpersonPreviewOpen(true);
    };

    useEffect(() => {
        if (!showAssessmentPreview || !printAssessmentOnOpen) return;

        const timer = window.setTimeout(() => {
            window.print();
            setPrintAssessmentOnOpen(false);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [showAssessmentPreview, printAssessmentOnOpen]);

    useEffect(() => {
        if (showAssessmentPreview) {
            document.body.classList.add('form-print-active');
        } else {
            document.body.classList.remove('form-print-active');
        }

        return () => {
            document.body.classList.remove('form-print-active');
        };
    }, [showAssessmentPreview]);

    useEffect(() => {
        if (chairpersonPreviewOpen) {
            document.body.classList.add('form-print-active');
        } else {
            document.body.classList.remove('form-print-active');
        }

        return () => {
            document.body.classList.remove('form-print-active');
        };
    }, [chairpersonPreviewOpen]);

    /* Submit review recommendation - WORKING CHAIRPERSON SOLUTION */
    const submitRecommendation = async () => {
        if (!activeSubmission || !userId || (recommendation.recommendation === 'revisions' && !recommendation.comments.trim())) {
            toast.error("Please provide review comments for revisions");
            return;
        }

        if (isEthicalClearanceLocked) {
            toast.info("This proposal already has an Ethical Clearance. Updates are locked.");
            return;
        }

        if (isChairperson && recommendation.recommendation === 'revisions' && isDecisionLetterLocked && hasSubmittedChairpersonRevisionNote) {
            toast.info("You have already submitted revision notes for this cycle.");
            return;
        }

        if (!isChairperson && !reviewerRoleKey) {
            toast.error("Your reviewer role is not set. Please contact the chairperson.");
            return;
        }

        // Check if assessment forms are completed
        if (!hasCompletedRequiredReviewerForms) {
            if (isPrimaryReviewer && !hasSubmittedProtocolAssessment && !hasCompletedProtocolAssessment) {
                toast.error("Please fill and complete the Protocol Assessment before submitting");
                return;
            }

            if (isSecondaryReviewer && !hasSubmittedInformedConsent && !hasCompletedInformedConsent) {
                toast.error("Please fill and complete the Informed Consent Assessment before submitting");
                return;
            }
        }

        // Check if decision documents are completed (for chairperson)
        if (isChairperson) {
            if (recommendation.recommendation === 'approve' && !isEthicalClearanceLocked && !hasCompletedEthicalClearance) {
                toast.error("Please fill and complete the Ethical Clearance Form before submitting your final decision");
                return;
            }
            if (recommendation.recommendation === 'revisions' && !isDecisionLetterLocked && !hasCompletedDecisionLetter && !hasSubmittedChairpersonRevisionNote) {
                toast.error("Please fill and complete the Decision Letter before submitting your final decision");
                return;
            }
        }

        const loadingId = toast.loading(isChairperson ? "Submitting final decision..." : "Submitting recommendation...");

        try {
            const reviewWindowStart = getActiveReviewWindowStart();

            // 1. Upload Protocol Reviewer Assessment if completed locally
            if (hasCompletedProtocolAssessment) {
                const filename = `Reviewer_Assessment_${activeSubmission.proposal_id}_${userId}_${Date.now()}.json`;
                const uploadPath = `${activeSubmission.proposal_id}/Assessments/${filename}`;
                const json = JSON.stringify(reviewerAssessmentData, null, 2);

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                        contentType: 'application/json',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const paHistoryData = {
                    history_type: 'reviewer_assessment_submitted',
                    paper_id: activeSubmission.proposal_id,
                    comment: 'Reviewer assessment form submitted',
                    actor: userId,
                    action: 'REVIEWER_ASSESSMENT_SUBMITTED',
                    history_date: new Date().toISOString(),
                };

                const { error: paHistoryError } = await supabase.from("history").insert(paHistoryData);
                if (paHistoryError) throw paHistoryError;

                setHasCompletedProtocolAssessment(false);
                setHasSubmittedProtocolAssessment(true);
            }

            // 2. Upload Informed Consent Assessment if completed locally
            if (hasCompletedInformedConsent) {
                const filename = `Informed_Consent_Assessment_${activeSubmission.proposal_id}_${userId}_${Date.now()}.json`;
                const uploadPath = `${activeSubmission.proposal_id}/Assessments/${filename}`;
                const json = JSON.stringify(informedConsentData, null, 2);

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                        contentType: 'application/json',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const icHistoryData = {
                    history_type: 'informed_consent_assessment_submitted',
                    paper_id: activeSubmission.proposal_id,
                    comment: 'Informed consent assessment form submitted',
                    actor: userId,
                    action: 'INFORMED_CONSENT_ASSESSMENT_SUBMITTED',
                    history_date: new Date().toISOString(),
                };

                const { error: icHistoryError } = await supabase.from("history").insert(icHistoryData);
                if (icHistoryError) throw icHistoryError;

                setHasCompletedInformedConsent(false);
                setHasSubmittedInformedConsent(true);
            }

            // 3. Upload Ethical Clearance if completed locally by Chairperson
            if (isChairperson && recommendation.recommendation === 'approve' && hasCompletedEthicalClearance) {
                const filename = `Ethical_Clearance_${activeSubmission.proposal_id}_${Date.now()}.json`;
                const uploadPath = `${activeSubmission.proposal_id}/Decisions/${filename}`;
                const json = JSON.stringify(ethicalClearanceData, null, 2);

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                        contentType: 'application/json',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const ecHistoryData = {
                    history_type: 'ethical_clearance_sent',
                    paper_id: activeSubmission.proposal_id,
                    comment: 'Ethical Clearance sent to researcher',
                    actor: userId,
                    action: 'ETHICAL_CLEARANCE_SENT',
                    history_date: new Date().toISOString(),
                };

                const { error: ecHistoryError } = await supabase.from("history").insert(ecHistoryData);
                if (ecHistoryError) throw ecHistoryError;

                setHasCompletedEthicalClearance(false);
                await loadEthicalClearanceInfo(activeSubmission.proposal_id);
            }

            // 4. Upload Decision Letter if completed locally by Chairperson
            if (isChairperson && recommendation.recommendation === 'revisions' && hasCompletedDecisionLetter) {
                const revisionTargetsArray = Array.isArray(decisionLetterData.revisionTargets)
                    ? decisionLetterData.revisionTargets.filter(Boolean)
                    : [];
                const affectedFiles = revisionTargetsArray.map((name: string) => ({
                    name,
                    required: true,
                }));

                const filename = `Decision_Letter_${activeSubmission.proposal_id}_${Date.now()}.json`;
                const uploadPath = `${activeSubmission.proposal_id}/Decisions/${filename}`;
                const json = JSON.stringify(decisionLetterData, null, 2);

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                        contentType: 'application/json',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                const dlHistoryData = {
                    history_type: 'decision_letter_sent',
                    paper_id: activeSubmission.proposal_id,
                    comment: 'Decision Letter sent to researcher',
                    actor: userId,
                    action: 'DECISION_LETTER_SENT',
                    history_date: new Date().toISOString(),
                    affected_files: affectedFiles.length > 0 ? affectedFiles : null,
                };

                const { error: dlHistoryError } = await supabase.from("history").insert(dlHistoryData);
                if (dlHistoryError) throw dlHistoryError;

                setHasCompletedDecisionLetter(false);
                await loadDecisionLetterInfo(activeSubmission.proposal_id);
            }

            // Check if user has already submitted a recommendation
            let existingRecQuery = supabase
                .from("history")
                .select("history_id")
                .eq("paper_id", activeSubmission.proposal_id)
                .eq("actor", userId)
                .eq("history_type", "review_recommendation")
                .order("history_date", { ascending: false });
            if (reviewWindowStart) {
                existingRecQuery = existingRecQuery.gte("history_date", reviewWindowStart);
            }
            const { data: existingRec } = await existingRecQuery.single();

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

                setReviewedProposalIds((prev) => {
                    const next = new Set(prev);
                    next.add(activeSubmission.proposal_id);
                    return next;
                });

                // Update local states immediately so that UI reacts in real-time
                setActiveSubmission((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: nextStatus,
                        updated_on: new Date().toISOString()
                    };
                });

                setSubmissions((prev) =>
                    prev.map((sub) =>
                        sub.proposal_id === activeSubmission.proposal_id
                            ? { ...sub, status: nextStatus, updated_on: new Date().toISOString() }
                            : sub
                    )
                );

                toast.success(
                    `Proposal ${recommendation.recommendation === 'approve' ? 'approved and moved to Data Collection' : 'sent for revisions'}`,
                    { id: loadingId }
                );
            } else {
                setReviewedProposalIds((prev) => {
                    const next = new Set(prev);
                    next.add(activeSubmission.proposal_id);
                    return next;
                });

                setIsEditingRecommendation(false);

                toast.success(
                    existingRec ? "Recommendation updated successfully" : "Recommendation submitted successfully",
                    { id: loadingId }
                );
            }

            // Reload data and assessment forms for the current proposal
            await loadSubmissionData();
            await loadAssessmentForms(getActiveReviewWindowStart());

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

    const getSubmissionProtocolCode = (submission: Submission | null) => {
        if (!submission) return "-";
        return submission.protocol_id || submission.protocol_code || "-";
    };

    const getReviewerRoleLabel = (role?: string | null) => {
        if (role === 'primary') return 'Primary reviewer';
        if (role === 'secondary') return 'Secondary reviewer';
        if (role === 'member') return 'Member';
        return null;
    };

    const pickLaterDate = (first?: string | null, second?: string | null) => {
        if (!first && !second) return null;
        if (!first) return second || null;
        if (!second) return first;
        return new Date(first).getTime() >= new Date(second).getTime() ? first : second;
    };

    const getActiveReviewWindowStart = () => {
        if (!activeSubmission) return null;
        return reviewWindowStartByProposal[activeSubmission.proposal_id]
            || assignmentDatesByProposal[activeSubmission.proposal_id]
            || null;
    };

    // Check if current user has submitted a recommendation for active submission
    const hasUserSubmittedRecommendation = Boolean(
        activeSubmission && reviewedProposalIds.has(activeSubmission.proposal_id)
    );
    const isActiveSubmissionArchived = Boolean(
        activeSubmission && archivedProposalIds.has(activeSubmission.proposal_id)
    );
    const hasRevisionResubmission = revisionSubmissionsCount > 0;
    const hasDecisionLetterSent = decisionLetterSentCount > 0;
    const isDecisionLetterLocked = hasDecisionLetterSent || hasRevisionResubmission;
    const isEthicalClearanceLocked = ethicalClearanceSentCount > 0;
    const isPrimaryReviewer = reviewerRoleKey === 'primary';
    const isSecondaryReviewer = reviewerRoleKey === 'secondary';
    const needsProtocolAssessment = !isChairperson && isPrimaryReviewer;
    const needsInformedConsent = !isChairperson && isSecondaryReviewer;
    const needsAnyAssessment = needsProtocolAssessment || needsInformedConsent;
    const isRoleAssigned = isChairperson || reviewerRoleKey !== null;

    const hasCompletedRequiredReviewerForms = hasRevisionResubmission
        ? true
        : (isPrimaryReviewer ? (hasSubmittedProtocolAssessment || hasCompletedProtocolAssessment) : true) &&
          (isSecondaryReviewer ? (hasSubmittedInformedConsent || hasCompletedInformedConsent) : true);

    const canSubmitRecommendation = isRoleAssigned && (
        isChairperson
            ? (recommendation.recommendation === 'approve'
                ? (isEthicalClearanceLocked || hasCompletedEthicalClearance) && hasCompletedRequiredReviewerForms
                : (isDecisionLetterLocked || hasCompletedDecisionLetter || hasSubmittedChairpersonRevisionNote) && hasCompletedRequiredReviewerForms)
            : hasCompletedRequiredReviewerForms
    );

    const isDecisionLocked =
        (!isChairperson && (hasUserSubmittedRecommendation || hasRevisionResubmission)) ||
        activeSubmission?.status === 'Reviewed' ||
        activeSubmission?.status === 'Revise Proposal' ||
        activeSubmission?.status === 'Approved' ||
        activeSubmission?.status === 'Data Collection' ||
        isEthicalClearanceLocked ||
        isActiveSubmissionArchived;

    const isFormDisabled =
        isDecisionLocked &&
        !(isEditingRecommendation && !isChairperson && activeSubmission?.status === 'Proposal Review' && !isEthicalClearanceLocked && !isActiveSubmissionArchived);

    const activeSubmissions = submissions
        .filter((submission) => !archivedProposalIds.has(submission.proposal_id))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const archivedSubmissions = submissions
        .filter((submission) => archivedProposalIds.has(submission.proposal_id))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const displayedSubmissions = activeSubmissions.slice(0, 3);

    /* Done Handlers for PDF/Custom Forms */
    const handleDoneProtocolAssessment = () => {
        setHasCompletedProtocolAssessment(true);
        setShowPDFTemplate(false);
        setTemplateType(null);
        setTemplateUrl('');
        toast.success("Protocol assessment marked as done. Remember to submit your recommendation.");
    };

    const handleDoneInformedConsent = () => {
        setHasCompletedInformedConsent(true);
        setShowPDFTemplate(false);
        setTemplateType(null);
        setTemplateUrl('');
        toast.success("Informed consent assessment marked as done. Remember to submit your recommendation.");
    };

    const handleDoneEthicalClearance = () => {
        setHasCompletedEthicalClearance(true);
        setShowPDFTemplate(false);
        setTemplateType(null);
        setTemplateUrl('');
        toast.success("Ethical clearance marked as done. Remember to submit your final decision.");
    };

    const saveDecisionLetterDraft = async (dataToSave: Record<string, any>) => {
        if (!activeSubmission) return;
        try {
            const json = JSON.stringify(dataToSave, null, 2);
            const uploadPath = `${activeSubmission.proposal_id}/Decisions/Decision_Letter_Draft.json`;
            await supabase.storage
                .from('documents')
                .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                    contentType: 'application/json',
                    upsert: true
                });
        } catch (err) {
            console.error("Failed to auto-save decision letter draft:", err);
        }
    };

    const handleDoneDecisionLetter = async () => {
        await saveDecisionLetterDraft(decisionLetterData);
        setHasCompletedDecisionLetter(true);
        setShowPDFTemplate(false);
        setTemplateType(null);
        setTemplateUrl('');
        toast.success("Decision letter marked as done. Remember to submit your final decision.");
    };

    const handlePassToAdminAssistant = async () => {
        if (!activeSubmission || !userId || isPassingToAdmin || hasPassedToAdmin) return;
        setIsPassingToAdmin(true);
        const loadingId = toast.loading("Passing to Admin Assistant...");
        try {
            const json = JSON.stringify(decisionLetterData, null, 2);
            const uploadPath = `${activeSubmission.proposal_id}/Decisions/Decision_Letter_Draft.json`;
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(uploadPath, new Blob([json], { type: 'application/json' }), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const historyData = {
                history_type: "passed_to_admin",
                paper_id: activeSubmission.proposal_id,
                comment: "Chairperson passed Decision Letter draft to Admin Assistant for dates check",
                actor: userId,
                action: "PASSED_TO_ADMIN",
                history_date: new Date().toISOString(),
            };

            const { error: historyError } = await supabase.from("history").insert(historyData);
            if (historyError) throw historyError;

            toast.success("Decision Letter draft passed to Admin Assistant", { id: loadingId });
            setHasPassedToAdmin(true);
            setShowPDFTemplate(false);
            setTemplateType(null);
            setTemplateUrl('');
            
            await loadSubmissionData();
        } catch (err: any) {
            console.error("Error passing to Admin Assistant:", err);
            toast.error(`Error: ${err.message || 'Unknown error'}`, { id: loadingId });
        } finally {
            setIsPassingToAdmin(false);
        }
    };

    /* Open PDF Template Handler */
    const handleOpenPDFTemplate = async (type: 'ethical_clearance' | 'decision_letter' | 'reviewer_assessment' | 'informed_consent') => {
        if (!activeSubmission) return;
        try {
            if (type === 'ethical_clearance' && isEthicalClearanceLocked) {
                toast.info('Ethical Clearance has already been sent for this proposal.');
                return;
            }
            if (type === 'decision_letter' && isDecisionLetterLocked) {
                toast.info('Decision Letters are only allowed on the first revision request. Use comments for additional revisions.');
                return;
            }

            if ((type === 'reviewer_assessment' || type === 'informed_consent') && hasRevisionResubmission) {
                toast.info('Assessment forms are only submitted on the first review cycle. Use follow-up notes for revisions.');
                return;
            }

            if (!isChairperson) {
                if (type === 'reviewer_assessment' && reviewerRoleKey !== 'primary') {
                    toast.error('Only primary reviewers can fill the Protocol Assessment form.');
                    return;
                }

                if (type === 'informed_consent' && reviewerRoleKey !== 'secondary') {
                    toast.error('Only secondary reviewers can fill the Informed Consent Assessment form.');
                    return;
                }
            }

            if (type === 'reviewer_assessment' && hasSubmittedProtocolAssessment) {
                toast.info('Protocol Reviewer Assessment already submitted. Editing is locked.');
                return;
            }

            if (type === 'informed_consent' && hasSubmittedInformedConsent) {
                toast.info('Informed Consent Assessment already submitted. Editing is locked.');
                return;
            }

            let templateFilename = '';
            
            if (type === 'ethical_clearance') {
                templateFilename = 'V2 Ethical Clearance (2).pdf';
            } else if (type === 'decision_letter') {
                templateFilename = '-Decision Letter.pdf';
            } else if (type === 'reviewer_assessment') {
                templateFilename = 'V2_Protocol-Reviewer-Assessment-Form-1-4.pdf';
            } else if (type === 'informed_consent') {
                templateFilename = 'V2_INFORMED-CONSENT-ASSESSMENT-FORM-3.pdf';
            }
            
            // Get the template URL from public folder
            const templatePath = `/templates/${templateFilename}`;

            if (type === 'decision_letter') {
                const loadingToastId = toast.loading("Loading Decision Letter draft...");
                try {
                    const { data: fileBlob, error: downloadError } = await supabase.storage
                        .from('documents')
                        .download(`${activeSubmission.proposal_id}/Decisions/Decision_Letter_Draft.json`);

                    if (!downloadError && fileBlob) {
                        const text = await fileBlob.text();
                        const parsed = JSON.parse(text);
                        setDecisionLetterData(parsed || {});
                        
                        const savedTargets = Array.isArray(parsed?.revisionTargets)
                            ? parsed.revisionTargets
                            : [];
                        setRevisionTargets(savedTargets);
                    } else {
                        const researcherProfile = profiles.find((x) => x.id === activeSubmission.researcher);
                        const researcherName = researcherProfile 
                            ? `${researcherProfile.fname ?? ""} ${researcherProfile.lname ?? ""}`.trim()
                            : "";
                        
                        const defaultData = {
                            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            researcherName: researcherName,
                            dearName: researcherName,
                            protocolCode: activeSubmission.protocol_id || "",
                            reviewType: activeSubmission.review_type || "",
                            subject: "Research Ethics Review",
                            institutionLine1: "University of the Immaculate Conception",
                            institutionLine2: "Bonifacio St., Davao City",
                            proposalSummary: "Overall, the study has evidence of scientific soundness, with the researcher having satisfactorily written all/or majority of following parts of the paper:",
                            informedConsentSummary: "Generally, the ICF is adequately written. However, there are some additions in the sections to address other dimensions of ethics review.",
                            chairName: "GIRLIE MAE P. ZABALA, PhD",
                            chairTitle: "Chair, UIC-REC",
                            revisionTargets: [],
                            fields: {
                                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                                researcherName: researcherName,
                                dearName: researcherName,
                                protocolCode: activeSubmission.protocol_id || "",
                                reviewType: activeSubmission.review_type || "",
                                subject: "Research Ethics Review",
                                institutionLine1: "University of the Immaculate Conception",
                                institutionLine2: "Bonifacio St., Davao City",
                                proposalSummary: "Overall, the study has evidence of scientific soundness, with the researcher having satisfactorily written all/or majority of following parts of the paper:",
                                informedConsentSummary: "Generally, the ICF is adequately written. However, there are some additions in the sections to address other dimensions of ethics review.",
                                chairName: "GIRLIE MAE P. ZABALA, PhD",
                                chairTitle: "Chair, UIC-REC",
                            }
                        };
                        setDecisionLetterData(defaultData);
                        setRevisionTargets([]);
                    }
                } catch (err) {
                    console.error("Error downloading draft decision letter:", err);
                    setDecisionLetterData({});
                    setRevisionTargets([]);
                } finally {
                    toast.dismiss(loadingToastId);
                }
            }

            setTemplateUrl(templatePath);
            setTemplateType(type);
            if (type === 'decision_letter') {
                setDecisionLetterDraftKey(prev => prev + 1);
            }
            setShowPDFTemplate(true);
        } catch (error) {
            console.error('Error loading template:', error);
            toast.error('Failed to load template');
        }
    };

    const toggleRevisionTarget = (docName: string) => {
        setRevisionTargets((prev) => {
            const next = prev.includes(docName)
                ? prev.filter((item) => item !== docName)
                : [...prev, docName];
            setDecisionLetterData((current) => ({ ...current, revisionTargets: next }));
            return next;
        });
    };

    const archiveSubmission = async () => {
        if (!activeSubmission || !userId) return;

        if (archivedProposalIds.has(activeSubmission.proposal_id)) {
            toast.info("This proposal is already archived.");
            return;
        }

        try {
            const historyData = {
                history_type: "reviewer_archive",
                paper_id: activeSubmission.proposal_id,
                comment: "Reviewer archived proposal",
                actor: userId,
                action: "REVIEWER_ARCHIVE",
                history_date: new Date().toISOString(),
            };

            const { error } = await supabase.from("history").insert([historyData]);
            if (error) throw error;

            setArchivedProposalIds((prev) => {
                const next = new Set(prev);
                next.add(activeSubmission.proposal_id);
                return next;
            });

            toast.success("Proposal archived.");
        } catch (error: any) {
            console.error("Failed to archive proposal:", error);
            toast.error(`Failed to archive proposal: ${error.message || "Unknown error"}`);
        }
    };

    /* Save PDF Template Handler */
    const handleSavePDFTemplate = async (pdfBytes: Uint8Array, _formData: Record<string, any>) => {
        if (!activeSubmission || !userId) return;

        if ((templateType === 'ethical_clearance' && isEthicalClearanceLocked) || (templateType === 'decision_letter' && isDecisionLetterLocked) || (hasRevisionResubmission && (templateType === 'reviewer_assessment' || templateType === 'informed_consent'))) {
            toast.info('This template is locked for revision cycles. Use follow-up comments instead.');
            return;
        }

        try {
            const loadingId = toast.loading("Saving and sending document...");

            // Generate filename based on template type
            let filename = '';
            let historyType = '';
            let historyComment = '';
            let historyAction = '';
            
            if (templateType === 'ethical_clearance') {
                filename = `Ethical_Clearance_${activeSubmission.proposal_id}_${Date.now()}.pdf`;
                historyType = 'ethical_clearance_sent';
                historyComment = 'Ethical Clearance sent to researcher';
                historyAction = 'ETHICAL_CLEARANCE_SENT';
            } else if (templateType === 'decision_letter') {
                filename = `Decision_Letter_${activeSubmission.proposal_id}_${Date.now()}.pdf`;
                historyType = 'decision_letter_sent';
                historyComment = 'Decision Letter sent to researcher';
                historyAction = 'DECISION_LETTER_SENT';
            } else if (templateType === 'reviewer_assessment') {
                filename = `Reviewer_Assessment_${activeSubmission.proposal_id}_${userId}_${Date.now()}.pdf`;
                historyType = 'reviewer_assessment_submitted';
                historyComment = 'Reviewer assessment form submitted';
                historyAction = 'REVIEWER_ASSESSMENT_SUBMITTED';
            } else if (templateType === 'informed_consent') {
                filename = `Informed_Consent_Assessment_${activeSubmission.proposal_id}_${userId}_${Date.now()}.pdf`;
                historyType = 'informed_consent_assessment_submitted';
                historyComment = 'Informed consent assessment form submitted';
                historyAction = 'INFORMED_CONSENT_ASSESSMENT_SUBMITTED';
            }

            // Upload to Supabase Storage
            const uploadPath = (templateType === 'reviewer_assessment' || templateType === 'informed_consent')
                ? `${activeSubmission.proposal_id}/Assessments/${filename}`
                : `${activeSubmission.proposal_id}/Decisions/${filename}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(uploadPath, pdfBytes, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Add history entry for document sent
            const revisionTargets = Array.isArray(decisionLetterData.revisionTargets)
                ? decisionLetterData.revisionTargets.filter(Boolean)
                : [];
            const affectedFiles = revisionTargets.map((name: string) => ({
                name,
                required: true,
            }));

            const historyData = {
                history_type: historyType,
                paper_id: activeSubmission.proposal_id,
                comment: historyComment,
                actor: userId,
                action: historyAction,
                history_date: new Date().toISOString(),
                affected_files: templateType === 'decision_letter' && affectedFiles.length > 0 ? affectedFiles : null,
            };

            const { error: historyError } = await supabase.from("history").insert(historyData);
            if (historyError) throw historyError;

            // Only process chairperson decision if this is a chairperson template
            if (templateType === 'ethical_clearance' || templateType === 'decision_letter') {
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

                setReviewedProposalIds((prev) => {
                    const next = new Set(prev);
                    next.add(activeSubmission.proposal_id);
                    return next;
                });

                // Update local states immediately
                setActiveSubmission((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: nextStatus,
                        updated_on: new Date().toISOString()
                    };
                });

                setSubmissions((prev) =>
                    prev.map((sub) =>
                        sub.proposal_id === activeSubmission.proposal_id
                            ? { ...sub, status: nextStatus, updated_on: new Date().toISOString() }
                            : sub
                    )
                );

                toast.success(
                    `${templateType === 'ethical_clearance' ? 'Ethical Clearance sent - Proposal approved and moved to Data Collection' : 'Decision Letter sent - Proposal sent for revisions'}`,
                    { id: loadingId }
                );
            } else {
                // For reviewer assessment, update the tracking state
                if (templateType === 'reviewer_assessment') {
                    setHasSubmittedProtocolAssessment(true);
                } else if (templateType === 'informed_consent') {
                    setHasSubmittedInformedConsent(true);
                }
                
                // Reload assessment forms to update the list
                await loadAssessmentForms(getActiveReviewWindowStart());
                
                toast.success('Assessment form submitted successfully', { id: loadingId });
            }

            // Close the PDF template
            setShowPDFTemplate(false);
            setTemplateType(null);
            setTemplateUrl('');

        } catch (error: any) {
            console.error('Error saving PDF template:', error);
            toast.error(`Failed to save document: ${error.message || 'Unknown error'}`);
        }
    };

    /* ---------- UI ---------- */
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 print:hidden">
            {/* header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Reviewer Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        {activeSubmissions.length}/3 Proposals Assigned
                        {isChairperson && (
                            <Badge variant="secondary" className="ml-2">
                                <Crown className="w-3 h-3 mr-1" />
                                Chairperson
                            </Badge>
                        )}
                    </p>
                </div>
                {archivedSubmissions.length > 0 && (
                    <RippleButton
                        variant="outline"
                        onClick={() => setArchivedOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        Archived Proposals ({archivedSubmissions.length})
                    </RippleButton>
                )}
            </div>

            {/* submissions table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border min-w-[200px]">Title</TableHead>
                            <TableHead className="border min-w-[120px]">Protocol Code</TableHead>
                            <TableHead className="border min-w-[120px]">Researcher</TableHead>
                            <TableHead className="border min-w-[100px]">Category</TableHead>
                            <TableHead className="border min-w-[100px]">Date</TableHead>
                            <TableHead className="border min-w-[110px] text-center">Status</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            Array.from({ length: 3 }).map((_, index) => {
                                const submission = displayedSubmissions[index];
                                const isReviewed = submission ? reviewedProposalIds.has(submission.proposal_id) : false;
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
                                                {assignmentRolesByProposal[submission.proposal_id] && (
                                                    <div className="flex flex-col">
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            {assignmentRolesByProposal[submission.proposal_id] === 'primary'
                                                                ? 'Primary reviewer'
                                                                : assignmentRolesByProposal[submission.proposal_id] === 'secondary'
                                                                    ? 'Secondary reviewer'
                                                                    : 'Member'}
                                                        </Badge>
                                                        {assignmentSectionsByProposal[submission.proposal_id] && (
                                                            <span className="mt-0.5 text-[10px] text-gray-500">
                                                                Focus: {assignmentSectionsByProposal[submission.proposal_id]}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <span className="font-mono text-xs text-gray-700">
                                                {getSubmissionProtocolCode(submission)}
                                            </span>
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
                                        <TableCell className="border text-center">
                                            {isReviewed ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    Reviewed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-600 border-gray-300">
                                                    Pending
                                                </Badge>
                                            )}
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
            <div className={cn("bg-white border rounded-lg p-4 sm:p-6 shadow-sm", isSplitScreen && "min-w-0 h-[80vh] overflow-hidden")}>
                {!activeSubmission ? (
                    <div className="text-center py-8 text-gray-500">
                        No submission selected for review
                    </div>
                ) : (
                    <div className="flex flex-row flex-1 min-w-0 h-full overflow-hidden w-full">
                        <div className={cn(isSplitScreen ? "w-1/2 pr-6 border-r overflow-y-auto h-full" : "w-full")}>
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold break-words pr-2">{activeSubmission.proposal_title}</h2>
                                <div className="text-sm text-gray-600 mt-1 mb-3">
                                    {getProfileName(activeSubmission.researcher)} • <span className="text-muted-foreground">{activeSubmission.category}</span>
                                </div>
                                <div className="text-sm text-gray-700 mb-2">
                                    <span className="font-semibold">Protocol Code:</span>{" "}
                                    <span className="font-mono">{getSubmissionProtocolCode(activeSubmission)}</span>
                                </div>
                            </div>

                            <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                                <div className="flex items-center justify-between lg:block">
                                    <div className="text-xs lg:text-sm text-gray-500 uppercase tracking-wide">Status</div>
                                </div>
                                <div className="mt-1 max-w-full">
                                    <Badge variant="default" className="inline-flex items-center gap-1 max-w-full px-2 py-1 bg-blue-100 text-blue-800">
                                        <Check className="w-3 h-3" />
                                        <span className="truncate">Assigned for Review</span>
                                    </Badge>
                                </div>
                                <div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={archiveSubmission}
                                        disabled={isActiveSubmissionArchived}
                                        className="w-full justify-center"
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        {isActiveSubmissionArchived ? "Archived" : "Archive"}
                                    </Button>
                                </div>
                                {reviewerRoleLabel && (
                                    <div className="mt-2">
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {reviewerRoleLabel}
                                        </Badge>
                                        {reviewerSectionHint && (
                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Focus: {reviewerSectionHint}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                            {assignmentMeta?.reviewerDocs?.[userId || ''] && assignmentMeta.reviewerDocs[userId || ''].length > 0 && (
                                <div className="text-xs text-gray-500">
                                    Documents shared by chairperson: {assignmentMeta.reviewerDocs[userId || ''].length}
                                </div>
                            )}

                            {submissionDocuments.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4">No documents submitted yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {submissionDocuments.map((doc, index) => {
                                        const phaseConfig = getPhaseBadge(doc.phase);
                                        const isFormData = isFormDataUrl(doc.url);
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
                                                            onClick={() => openDocument(doc)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                        {isFormData ? (
                                                            <RippleButton
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleFormDataDownload(activeSubmission.proposal_id, doc.name)}
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </RippleButton>
                                                        ) : (
                                                            <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                                                <RippleButton variant="outline" size="sm">
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Download
                                                                </RippleButton>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {isChairperson && chairpersonDocuments.length > 0 && (
                            <div className="space-y-4 mb-6 border-t pt-6">
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium">
                                    <FileSignature className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wide">Chairperson Sent Documents</span>
                                </div>
                                <div className="space-y-3">
                                    {chairpersonDocuments.map((doc, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <FileSignature className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-medium text-gray-900 break-words">
                                                            {getChairpersonDocumentLabel(doc.type)}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1 break-all">{doc.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openChairpersonDocument(doc)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submitted Assessment Forms - For Chairperson */}
                        {isChairperson && (
                            <div className="space-y-4 mb-6 border-t pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                                        <FileSignature className="w-3.5 h-3.5" />
                                        <span className="uppercase tracking-wide">Reviewer Assessment Forms ({submittedAssessmentForms.length})</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadAssessmentForms(getActiveReviewWindowStart())}
                                        className="text-xs"
                                    >
                                        
                                       
                                    </Button>
                                </div>
                                {submittedAssessmentForms.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-4 text-center border rounded-lg bg-gray-50">
                                        No assessment forms submitted yet by reviewers.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {submittedAssessmentForms.map((form, index) => {
                                            // Extract reviewer info from filename
                                            // Format: Reviewer_Assessment_{proposal_id}_{user_id}_{timestamp}.pdf
                                            let reviewerInfo = '';
                                            
                                            // Try to extract user ID from filename
                                            if (form.name.includes('Reviewer_Assessment')) {
                                                const parts = form.name.match(/Reviewer_Assessment_\d+_([a-f0-9-]+)_/);
                                                if (parts && parts[1]) {
                                                    reviewerInfo = `Reviewer ID: ${parts[1].substring(0, 8)}...`;
                                                }
                                            } else if (form.name.includes('Informed_Consent_Assessment')) {
                                                const parts = form.name.match(/Informed_Consent_Assessment_\d+_([a-f0-9-]+)_/);
                                                if (parts && parts[1]) {
                                                    reviewerInfo = `Reviewer ID: ${parts[1].substring(0, 8)}...`;
                                                }
                                            }
                                            
                                            return (
                                                <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <FileSignature className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-medium text-gray-900 break-words">
                                                                    {form.name.includes('Reviewer_Assessment') 
                                                                        ? 'Protocol Reviewer Assessment' 
                                                                        : 'Informed Consent Assessment'}
                                                                </h3>
                                                                {reviewerInfo && (
                                                                    <p className="text-xs text-purple-600 mt-1">{reviewerInfo}</p>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1 break-all">{form.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openAssessmentPreview(form.url, form.name)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </Button>
                                                            <RippleButton
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDownloadAssessmentForm(form.url, form.name)}
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </RippleButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

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
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-sm">{rec.reviewer_name}</div>
                                                    {getReviewerRoleLabel(assignmentMeta?.reviewerRoles?.[rec.reviewer_id]) && (
                                                        <span className="text-xs text-gray-500">
                                                            {getReviewerRoleLabel(assignmentMeta?.reviewerRoles?.[rec.reviewer_id])}
                                                        </span>
                                                    )}
                                                </div>
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
                            <div className="flex items-center justify-between w-full">
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
                                <Button
                                    variant={isSplitScreen ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setIsSplitScreen(!isSplitScreen);
                                        if (!isSplitScreen) {
                                            setSplitSelectedDoc(null);
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Columns2 className="h-4 w-4" />
                                    {isSplitScreen ? "Hide Documents" : "View Documents Side-by-Side"}
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {/* Recommendation Cards */}
                                <div className={cn(
                                    "grid grid-cols-1 gap-4",
                                    (!isChairperson || hasDecisionLetterSent) ? "md:grid-cols-2" : "md:grid-cols-1"
                                )}>
                                    {/* Approve Card */}
                                    {(!isChairperson || hasDecisionLetterSent) && (
                                        <div
                                            className={cn(
                                                "border-2 rounded-lg p-4 transition-all duration-200",
                                                isFormDisabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:border-green-300 hover:bg-green-50",
                                                recommendation.recommendation === 'approve'
                                                    ? isChairperson
                                                        ? "border-green-600 bg-green-50"
                                                        : "border-green-500 bg-green-50"
                                                    : "border-gray-200 bg-white"
                                            )}
                                            onClick={() => {
                                                if (isFormDisabled) return;
                                                setRecommendation(prev => ({
                                                    ...prev,
                                                    recommendation: 'approve',
                                                    comments: prev.recommendation === 'approve' ? prev.comments : ''
                                                }));
                                            }}
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
                                    )}

                                    {/* Revisions Card */}
                                    <div
                                        className={cn(
                                            "border-2 rounded-lg p-4 transition-all duration-200",
                                            isFormDisabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:border-yellow-300 hover:bg-yellow-50",
                                            recommendation.recommendation === 'revisions'
                                                ? isChairperson
                                                    ? "border-yellow-600 bg-yellow-100"
                                                    : "border-yellow-500 bg-yellow-50"
                                                : "border-gray-200 bg-white"
                                        )}
                                        onClick={() => {
                                            if (isFormDisabled) return;
                                            setRecommendation(prev => ({
                                                ...prev,
                                                recommendation: 'revisions'
                                            }));
                                        }}
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
                                            disabled={isFormDisabled}
                                        />
                                    ) : (
                                        <Textarea
                                            id="comments"
                                            placeholder={isChairperson
                                                ? ""
                                                : ""
                                            }
                                            value={recommendation.comments}
                                            onChange={(e) => setRecommendation(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={2}
                                            className="resize-none"
                                            disabled={isFormDisabled}
                                        />
                                    )}
                                </div>

                                {/* Reviewer Assessment Form Button - For reviewers (and chairperson when assigned) */}
                                {(!isChairperson || reviewerRoleKey === 'primary' || reviewerRoleKey === 'secondary') && (
                                    <div className="space-y-3 border-t pt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-medium text-gray-700">
                                                Assessment Forms
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {needsAnyAssessment ? (
                                                    <span className={canSubmitRecommendation ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                                                        {canSubmitRecommendation ? '✓ Form submitted' : 'Required'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">Comments only</span>
                                                )}
                                            </div>
                                        </div>

                                        {reviewerRoleKey === 'primary' && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {hasRevisionResubmission ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-gray-500 text-center">
                                                            Additional revision cycle detected. Use the comments box below for follow-up notes.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Button
                                                            onClick={() => handleOpenPDFTemplate('reviewer_assessment')}
                                                            disabled={hasSubmittedProtocolAssessment}
                                                            className={cn(
                                                                "w-full flex items-center justify-center gap-2",
                                                                (hasSubmittedProtocolAssessment || hasCompletedProtocolAssessment)
                                                                    ? "bg-green-600 hover:bg-green-700"
                                                                    : "bg-blue-600 hover:bg-blue-700"
                                                            )}
                                                        >
                                                            {(hasSubmittedProtocolAssessment || hasCompletedProtocolAssessment) && <Check className="w-4 h-4" />}
                                                            <FileSignature className="w-4 h-4" />
                                                            Protocol Assessment
                                                        </Button>
                                                        {(hasSubmittedProtocolAssessment || hasCompletedProtocolAssessment) && (
                                                            <div className="text-xs text-center text-green-600 mt-1">
                                                                {hasSubmittedProtocolAssessment ? 'Submitted ✓' : 'Done (Pending submit) ✓'}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-500 text-center mt-2">
                                                            Primary reviewers must complete the Protocol Assessment.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {reviewerRoleKey === 'secondary' && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {hasRevisionResubmission ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-gray-500 text-center">
                                                            Additional revision cycle detected. Use the comments box below for follow-up notes.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="relative">
                                                            <Button
                                                                onClick={() => handleOpenPDFTemplate('informed_consent')}
                                                                disabled={hasSubmittedInformedConsent}
                                                                className={cn(
                                                                    "w-full flex items-center justify-center gap-2",
                                                                    (hasSubmittedInformedConsent || hasCompletedInformedConsent)
                                                                        ? "bg-green-600 hover:bg-green-700"
                                                                        : "bg-indigo-600 hover:bg-indigo-700"
                                                                )}
                                                            >
                                                                {(hasSubmittedInformedConsent || hasCompletedInformedConsent) && <Check className="w-4 h-4" />}
                                                                <FileSignature className="w-4 h-4" />
                                                                Informed Consent
                                                            </Button>
                                                            {(hasSubmittedInformedConsent || hasCompletedInformedConsent) && (
                                                                <div className="text-xs text-center text-green-600 mt-1">
                                                                    {hasSubmittedInformedConsent ? 'Submitted ✓' : 'Done (Pending submit) ✓'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 text-center">
                                                            Secondary reviewers must complete the Informed Consent Assessment.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {reviewerRoleKey === 'member' && (
                                            <p className="text-xs text-gray-500 text-center">
                                                Members submit comments only. No assessment forms required.
                                            </p>
                                        )}

                                        {!reviewerRoleKey && (
                                            <p className="text-xs text-gray-500 text-center">
                                                Reviewer role not set. Please contact the chairperson.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Template Buttons - Only for Chairperson */}
                                {isChairperson && (
                                    <div className="space-y-3 border-t pt-4">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Generate Document for Researcher
                                        </div>
                                        
                                        {recommendation.recommendation === 'approve' ? (
                                            // Show Ethical Clearance button for Approve
                                            <div className="relative w-full">
                                                <Button
                                                    onClick={() => handleOpenPDFTemplate('ethical_clearance')}
                                                    disabled={isEthicalClearanceLocked}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2",
                                                        (isEthicalClearanceLocked || hasCompletedEthicalClearance)
                                                            ? "bg-green-600 hover:bg-green-700"
                                                            : "bg-green-600 hover:bg-green-700"
                                                    )}
                                                >
                                                    {(isEthicalClearanceLocked || hasCompletedEthicalClearance) && <Check className="w-4 h-4" />}
                                                    <FileSignature className="w-4 h-4" />
                                                    {isEthicalClearanceLocked 
                                                        ? 'Ethical Clearance Sent ✓' 
                                                        : hasCompletedEthicalClearance 
                                                            ? 'Ethical Clearance Done ✓' 
                                                            : 'Fill Ethical Clearance Form'}
                                                </Button>
                                                {hasCompletedEthicalClearance && !isEthicalClearanceLocked && (
                                                    <div className="text-xs text-center text-green-600 mt-1">Done (Pending submit) ✓</div>
                                                )}
                                            </div>
                                        ) : (
                                            // Show Decision Letter button for Revisions
                                            <div className="relative w-full">
                                                <Button
                                                    onClick={() => handleOpenPDFTemplate('decision_letter')}
                                                    disabled={isDecisionLetterLocked}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2",
                                                        (isDecisionLetterLocked || hasCompletedDecisionLetter)
                                                            ? "bg-yellow-600 hover:bg-yellow-700"
                                                            : "bg-yellow-600 hover:bg-yellow-700"
                                                    )}
                                                >
                                                    {(isDecisionLetterLocked || hasCompletedDecisionLetter) && <Check className="w-4 h-4" />}
                                                    <FileSignature className="w-4 h-4" />
                                                    {isDecisionLetterLocked 
                                                        ? 'Decision Letter Locked' 
                                                        : hasCompletedDecisionLetter 
                                                            ? 'Decision Letter Done ✓' 
                                                            : 'Fill Decision Letter'}
                                                </Button>
                                                {hasCompletedDecisionLetter && !isDecisionLetterLocked && (
                                                    <div className="text-xs text-center text-green-600 mt-1">Done (Pending submit) ✓</div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-500 text-center">
                                            {recommendation.recommendation === 'approve'
                                                ? isEthicalClearanceLocked
                                                    ? 'Ethical Clearance has already been sent for this proposal.'
                                                    : 'This will open the Ethical Clearance form for you to fill'
                                                : isDecisionLetterLocked
                                                    ? 'Decision Letters are only allowed for the first revision cycle. Use comments below for further revision requests.'
                                                    : 'This will open the Decision Letter template for you to customize'
                                            }
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    {hasUserSubmittedRecommendation && !isChairperson && (
                                        <div className="text-sm text-green-600 flex items-center gap-2">
                                            <span>✓ You have submitted your recommendation</span>
                                            {activeSubmission?.status === 'Proposal Review' && !isEthicalClearanceLocked && !isActiveSubmissionArchived && !isEditingRecommendation && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsEditingRecommendation(true)}
                                                    className="ml-2"
                                                >
                                                    Edit Recommendation
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    {isChairperson && (
                                        <div className="text-sm text-purple-600 flex items-center gap-2">
                                            <Crown className="w-4 h-4" />
                                            {isDecisionLocked 
                                                ? 'Final decision has been submitted for this cycle' 
                                                : 'Your decision will move the proposal to the next phase'}
                                        </div>
                                    )}
                                    <div className="flex gap-2 ml-auto">
                                        {(!isDecisionLocked || (isEditingRecommendation && !isChairperson)) && (
                                            <>
                                                {isEditingRecommendation && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            setIsEditingRecommendation(false);
                                                            await loadSubmissionData();
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                <RippleButton
                                                    onClick={submitRecommendation}
                                                    disabled={
                                                        (recommendation.recommendation === 'revisions' && !recommendation.comments.trim()) ||
                                                        !canSubmitRecommendation ||
                                                        (isChairperson && isDecisionLocked) ||
                                                        (isChairperson && recommendation.recommendation === 'revisions' && isDecisionLetterLocked && hasSubmittedChairpersonRevisionNote)
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {isChairperson
                                                        ? 'Submit Final Decision'
                                                        : isEditingRecommendation
                                                            ? 'Update Recommendation'
                                                            : 'Submit Recommendation'
                                                    }
                                                </RippleButton>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Warning message for incomplete forms */}
                                {!isChairperson && !hasRevisionResubmission && needsAnyAssessment && !canSubmitRecommendation && (
                                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                        <p className="text-sm text-orange-800">
                                            {needsProtocolAssessment
                                                ? '⚠️ Please fill and complete the Protocol Assessment before submitting your recommendation.'
                                                : '⚠️ Please fill and complete the Informed Consent Assessment before submitting your recommendation.'}
                                        </p>
                                    </div>
                                )}

                                {/* Warning message for incomplete chairperson forms */}
                                {isChairperson && !isDecisionLocked && !canSubmitRecommendation && (
                                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                        <p className="text-sm text-orange-800">
                                            {recommendation.recommendation === 'approve'
                                                ? '⚠️ Please fill and complete the Ethical Clearance Form before submitting your final decision.'
                                                : '⚠️ Please fill and complete the Decision Letter before submitting your final decision.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                        {isSplitScreen && renderSplitScreenDocumentViewer()}
                    </div>
                )}
            </div>

            {/* Full Screen Document Preview */}
            {previewOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-white">
                        <div className="font-semibold text-lg truncate pr-4">{previewTitle || 'Document Preview'}</div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isSplitScreen ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setIsSplitScreen(!isSplitScreen);
                                    if (!isSplitScreen) {
                                        setSplitSelectedDoc(null);
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <Columns2 className="h-4 w-4" />
                                {isSplitScreen ? "Hide Split Screen" : "Split Screen"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setPreviewOpen(false);
                                    setPreviewUrl(null);
                                    setActiveFormName(null);
                                    setIsSplitScreen(false);
                                    setSplitSelectedDoc(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Main content - Flex Row */}
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Sidebar - File List */}
                        <div className="w-72 bg-gray-50 border-r flex flex-col flex-shrink-0 min-h-0 h-full overflow-hidden">
                            <div className="p-4 border-b bg-white">
                                <h2 className="text-sm font-semibold">Documents</h2>
                                <p className="text-xs text-gray-500 mt-1">Select to view</p>
                            </div>

                            {/* Document Type Tabs */}
                            <div className="p-2 border-b bg-white">
                                <div className="flex gap-1">
                                    <Button
                                        variant={previewActiveTab === "manuscript" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setPreviewActiveTab("manuscript");
                                        }}
                                        className="flex-1 text-xs"
                                    >
                                        Manuscript
                                    </Button>
                                    <Button
                                        variant={previewActiveTab === "forms" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setPreviewActiveTab("forms");
                                        }}
                                        className="flex-1 text-xs"
                                    >
                                        Forms
                                    </Button>
                                </div>
                            </div>

                            {/* File List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                                {previewActiveTab === "manuscript" &&
                                    submissionDocuments
                                        .filter((doc) => doc.phase === "phase1")
                                        .map((doc) => (
                                            <div key={doc.name} className="group relative rounded-lg border transition-all flex items-center bg-white pr-8">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setPreviewUrl(doc.url);
                                                        setPreviewTitle(doc.name);
                                                        setActiveFormName(isFormDataUrl(doc.url) ? doc.name : null);
                                                    }}
                                                    className={cn(
                                                        "w-full justify-start text-left h-auto py-2 px-3 hover:bg-transparent text-xs truncate",
                                                        previewTitle === doc.name && "font-semibold text-primary"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileText className="h-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate">{doc.name}</span>
                                                    </div>
                                                </Button>
                                                {isSplitScreen && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (splitSelectedDoc?.name === doc.name) {
                                                                setSplitSelectedDoc(null);
                                                            } else {
                                                                setSplitSelectedDoc(doc);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6",
                                                            splitSelectedDoc?.name === doc.name
                                                                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                                                : "hover:bg-gray-100"
                                                        )}
                                                    >
                                                        {splitSelectedDoc?.name === doc.name ? (
                                                            <X className="h-3 w-3" />
                                                        ) : (
                                                            <Columns2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                {previewActiveTab === "forms" &&
                                    submissionDocuments
                                        .filter((doc) => doc.phase === "phase3")
                                        .map((doc) => (
                                            <div key={doc.name} className="group relative rounded-lg border transition-all flex items-center bg-white pr-8">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setPreviewUrl(doc.url);
                                                        setPreviewTitle(doc.name);
                                                        setActiveFormName(isFormDataUrl(doc.url) ? doc.name : null);
                                                    }}
                                                    className={cn(
                                                        "w-full justify-start text-left h-auto py-2 px-3 hover:bg-transparent text-xs truncate",
                                                        previewTitle === doc.name && "font-semibold text-primary"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileText className="h-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate">{doc.name}</span>
                                                    </div>
                                                </Button>
                                                {isSplitScreen && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (splitSelectedDoc?.name === doc.name) {
                                                                setSplitSelectedDoc(null);
                                                            } else {
                                                                setSplitSelectedDoc(doc);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6",
                                                            splitSelectedDoc?.name === doc.name
                                                                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                                                : "hover:bg-gray-100"
                                                        )}
                                                    >
                                                        {splitSelectedDoc?.name === doc.name ? (
                                                            <X className="h-3 w-3" />
                                                        ) : (
                                                            <Columns2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                {((previewActiveTab === "manuscript" && submissionDocuments.filter((doc) => doc.phase === "phase1").length === 0) ||
                                    (previewActiveTab === "forms" && submissionDocuments.filter((doc) => doc.phase === "phase3").length === 0)) && (
                                    <div className="text-center text-gray-500 py-8">
                                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-xs">No documents</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Document Preview Area */}
                        <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-100">
                            {/* Left Panel */}
                            <div className={cn("flex flex-col h-full min-h-0 overflow-hidden bg-white", isSplitScreen ? "w-1/2 border-r" : "w-full")}>
                                <div className="p-2 border-b bg-white flex items-center justify-between">
                                    <span className="text-xs font-semibold truncate">{previewTitle?.replace('.pdf', '') || 'Selected Document'}</span>
                                </div>
                                <div className="flex-1 overflow-auto bg-gray-100 relative min-h-0">
                                    {activeFormName ? (
                                        <div className="h-full bg-white p-4">
                                            <FormViewer
                                                key={`main-${activeSubmission?.proposal_id}-${activeFormName}`}
                                                documentName={activeFormName}
                                                proposalId={activeSubmission!.proposal_id}
                                                protocolCode={activeSubmission?.protocol_id}
                                                proposalTitle={activeSubmission?.proposal_title}
                                                reviewType={activeSubmission?.review_type}
                                                researcherName={(() => {
                                                    const p = profiles.find((x) => x.id === activeSubmission?.researcher);
                                                    return p ? `${p.fname ?? ""} ${p.lname ?? ""}`.trim() : "";
                                                })()}
                                                advisorId={activeSubmission?.advisor_id}
                                                readOnly={true}
                                                onDone={() => {
                                                    setPreviewOpen(false);
                                                    setPreviewUrl(null);
                                                    setActiveFormName(null);
                                                }}
                                            />
                                        </div>
                                    ) : previewUrl ? (
                                        <iframe
                                            src={previewUrl}
                                            className="w-full h-full border-0 absolute inset-0 bg-white"
                                            title={previewTitle || "Main Document Preview"}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-gray-500 text-sm">Select a document to preview</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel - Split View */}
                            {isSplitScreen && (
                                <div className="w-1/2 flex flex-col h-full min-h-0 overflow-hidden bg-white">
                                    <div className="p-2 border-b bg-white flex items-center justify-between">
                                        <span className="text-xs font-semibold truncate">
                                            {splitSelectedDoc ? splitSelectedDoc.name.replace('.pdf', '') : 'Select split view document'}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-auto bg-gray-50 relative min-h-0">
                                        {splitSelectedDoc ? (
                                            isFormDataUrl(splitSelectedDoc.url) ? (
                                                <div className="h-full bg-white p-4">
                                                    <FormViewer
                                                        key={`split-preview-${activeSubmission?.proposal_id}-${splitSelectedDoc.name}`}
                                                        documentName={splitSelectedDoc.name}
                                                        proposalId={activeSubmission!.proposal_id}
                                                        protocolCode={activeSubmission?.protocol_id}
                                                        proposalTitle={activeSubmission?.proposal_title}
                                                        reviewType={activeSubmission?.review_type}
                                                        researcherName={(() => {
                                                            const p = profiles.find((x) => x.id === activeSubmission?.researcher);
                                                            return p ? `${p.fname ?? ""} ${p.lname ?? ""}`.trim() : "";
                                                        })()}
                                                        advisorId={activeSubmission?.advisor_id}
                                                        readOnly={true}
                                                        onDone={() => setSplitSelectedDoc(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <iframe
                                                    src={splitSelectedDoc.url}
                                                    className="w-full h-full border-0 absolute inset-0 bg-white"
                                                    title={splitSelectedDoc.name || "Split Document Preview"}
                                                />
                                            )
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                <div className="text-center p-4">
                                                    <Columns2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                    <p className="text-xs">Click the split screen icon next to any document in the sidebar to display it here</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-4 border-t bg-white">
                        {previewUrl && !activeFormName && (
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
                <div className="fixed inset-0 z-50 bg-white flex flex-row min-w-0 min-h-0 overflow-hidden">
                    <div className={cn("h-full overflow-y-auto bg-gray-100 p-4 min-w-0 flex-1", isSplitScreen ? "w-1/2 border-r" : "w-full")}>
                        {templateType === 'ethical_clearance' ? (
                            <div className="max-w-[1000px] mx-auto">
                                <div className="sticky top-0 z-30 bg-white border border-gray-200 rounded-md px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
                                    <div className="text-sm font-medium text-gray-700">Ethical Clearance</div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={isSplitScreen ? "default" : "outline"}
                                            onClick={() => {
                                                setIsSplitScreen(!isSplitScreen);
                                                if (!isSplitScreen) {
                                                    setSplitSelectedDoc(null);
                                                }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {isSplitScreen ? "Hide Documents" : "View Documents"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPDFTemplate(false);
                                                setTemplateType(null);
                                                setTemplateUrl('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleDoneEthicalClearance}>
                                            Done
                                        </Button>
                                    </div>
                                </div>

                                <EthicalClearanceForm
                                    savedData={ethicalClearanceData}
                                    onSave={(patch) => setEthicalClearanceData((prev) => ({ ...prev, ...patch }))}
                                />
                            </div>
                        ) : templateType === 'decision_letter' ? (
                            <div className="max-w-[1000px] mx-auto">
                                <div className="sticky top-0 z-30 bg-white border border-gray-200 rounded-md px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
                                    <div className="text-sm font-medium text-gray-700">Decision Letter</div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={isSplitScreen ? "default" : "outline"}
                                            onClick={() => {
                                                setIsSplitScreen(!isSplitScreen);
                                                if (!isSplitScreen) {
                                                    setSplitSelectedDoc(null);
                                                }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {isSplitScreen ? "Hide Documents" : "View Documents"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPDFTemplate(false);
                                                setTemplateType(null);
                                                setTemplateUrl('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleDoneDecisionLetter}>
                                            Done
                                        </Button>
                                        {isChairperson && (
                                            <Button
                                                variant="secondary"
                                                onClick={handlePassToAdminAssistant}
                                                disabled={isPassingToAdmin || hasPassedToAdmin}
                                                className={cn(
                                                    "border",
                                                    hasPassedToAdmin
                                                        ? "bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                                                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                                                )}
                                            >
                                                {hasPassedToAdmin 
                                                    ? "Already Passed ✓" 
                                                    : isPassingToAdmin 
                                                        ? "Passing..." 
                                                        : "Pass to Admin Assistant"}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">Documents for Revision</div>
                                            <div className="text-xs text-gray-500">Select which submitted documents need changes.</div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="gap-2">
                                                    {revisionTargets.length > 0
                                                        ? `${revisionTargets.length} selected`
                                                        : "Select documents"}
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="max-h-64 w-72 overflow-auto">
                                                {submissionDocuments.length === 0 ? (
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">No documents available.</div>
                                                ) : (
                                                    submissionDocuments.map((doc) => (
                                                        <DropdownMenuCheckboxItem
                                                            key={doc.name}
                                                            checked={revisionTargets.includes(doc.name)}
                                                            onCheckedChange={() => toggleRevisionTarget(doc.name)}
                                                        >
                                                            <div className="flex w-full items-center justify-between gap-2">
                                                                 <span className="truncate">{doc.name}</span>
                                                                 <Badge variant={getPhaseBadge(doc.phase).variant}>{getPhaseBadge(doc.phase).label}</Badge>
                                                            </div>
                                                        </DropdownMenuCheckboxItem>
                                                    ))
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {revisionTargets.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {revisionTargets.map((name) => (
                                                <Badge key={name} variant="secondary" className="gap-1">
                                                    {name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRevisionTarget(name)}
                                                        className="ml-1 text-xs text-gray-500 hover:text-gray-900"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <DecisionLetterForm
                                    key={decisionLetterDraftKey}
                                    savedData={decisionLetterData}
                                    onSave={(patch) => setDecisionLetterData((prev) => ({ ...prev, ...patch }))}
                                />
                            </div>
                        ) : templateType === 'reviewer_assessment' ? (
                            <div className="max-w-[1000px] mx-auto">
                                <div className="sticky top-0 z-30 bg-white border border-gray-200 rounded-md px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
                                    <div className="text-sm font-medium text-gray-700">Protocol Reviewer Assessment Form</div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={isSplitScreen ? "default" : "outline"}
                                            onClick={() => {
                                                setIsSplitScreen(!isSplitScreen);
                                                if (!isSplitScreen) {
                                                    setSplitSelectedDoc(null);
                                                }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {isSplitScreen ? "Hide Documents" : "View Documents"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPDFTemplate(false);
                                                setTemplateType(null);
                                                setTemplateUrl('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleDoneProtocolAssessment}
                                            disabled={hasSubmittedProtocolAssessment}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>

                                <ProtocolReviewerAssessmentForm
                                    savedData={reviewerAssessmentData}
                                    onSave={(patch) => setReviewerAssessmentData((prev) => ({ ...prev, ...patch }))}
                                />
                            </div>
                        ) : templateType === 'informed_consent' ? (
                            <div className="max-w-[1000px] mx-auto">
                                <div className="sticky top-0 z-30 bg-white border border-gray-200 rounded-md px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
                                    <div className="text-sm font-medium text-gray-700">Informed Consent Assessment Form</div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={isSplitScreen ? "default" : "outline"}
                                            onClick={() => {
                                                setIsSplitScreen(!isSplitScreen);
                                                if (!isSplitScreen) {
                                                    setSplitSelectedDoc(null);
                                                }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {isSplitScreen ? "Hide Documents" : "View Documents"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPDFTemplate(false);
                                                setTemplateType(null);
                                                setTemplateUrl('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleDoneInformedConsent}
                                            disabled={hasSubmittedInformedConsent}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>

                                <InformedConsentAssessmentForm
                                    savedData={informedConsentData}
                                    onSave={(patch) => setInformedConsentData((prev) => ({ ...prev, ...patch }))}
                                />
                            </div>
                        ) : (
                            <PDFFormFiller
                                templateUrl={templateUrl}
                                templateName={
                                    templateType === 'decision_letter'
                                            ? 'Decision_Letter'
                                            : 'Informed Consent Assessment'
                                }
                                onSave={handleSavePDFTemplate}
                                onCancel={() => {
                                    setShowPDFTemplate(false);
                                    setTemplateType(null);
                                    setTemplateUrl('');
                                }}
                                predefinedFields={predefinedFields}
                            />
                        )}
                    </div>
                    {isSplitScreen && renderSplitScreenDocumentViewer()}
                </div>
            )}

            <Dialog open={archivedOpen} onOpenChange={setArchivedOpen}>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Archive className="w-5 h-5" />
                            Archived Proposals
                        </DialogTitle>
                    </DialogHeader>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="border">Protocol ID</TableHead>
                                    <TableHead className="border">Title</TableHead>
                                    <TableHead className="border">Category</TableHead>
                                    <TableHead className="border">Review Type</TableHead>
                                    <TableHead className="border">Date</TableHead>
                                    <TableHead className="border text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {archivedSubmissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-400 italic py-8">
                                            No archived proposals
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    archivedSubmissions.map((submission) => (
                                        <TableRow key={submission.proposal_id} className="hover:bg-gray-50/50">
                                            <TableCell className="border">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {getSubmissionProtocolCode(submission)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="border">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                    <span className="font-medium">{submission.proposal_title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border">
                                                <Badge variant="outline" className="text-xs">
                                                    {submission.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="border">
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
                                            <TableCell className="border text-center">
                                                <RippleButton
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-gray-600 hover:text-primary"
                                                    onClick={() => {
                                                        setActiveSubmission(submission);
                                                        setArchivedOpen(false);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </RippleButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
            </div>
            {/* Assessment React Preview (Chairperson) */}
            {showAssessmentPreview && assessmentPreviewType && (
                <div
                    className="fixed inset-0 z-50 bg-gray-100 overflow-auto p-4 form-print-root"
                    onClick={() => {
                        setShowAssessmentPreview(false);
                        setAssessmentPreviewType(null);
                        setAssessmentPreviewData({});
                        setPrintAssessmentOnOpen(false);
                    }}
                >
                    <div className="max-w-[1000px] mx-auto form-print-shell" onClick={(event) => event.stopPropagation()}>
                        <div style={{ pointerEvents: 'none' }}>
                            {assessmentPreviewType === 'reviewer_assessment' ? (
                                <ProtocolReviewerAssessmentForm savedData={assessmentPreviewData} />
                            ) : (
                                <InformedConsentAssessmentForm savedData={assessmentPreviewData} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {chairpersonPreviewOpen && chairpersonPreviewType && (
                <div
                    className={cn(
                        isSplitScreen 
                            ? "fixed inset-0 z-50 bg-white flex flex-row min-w-0 min-h-0 overflow-hidden"
                            : "fixed inset-0 z-50 bg-gray-100 overflow-auto p-4 form-print-root"
                    )}
                    onClick={() => {
                        setChairpersonPreviewOpen(false);
                        setChairpersonPreviewType(null);
                        setChairpersonPreviewFormat(null);
                        setChairpersonPreviewData({});
                        setChairpersonPreviewUrl(null);
                        setChairpersonPreviewTitle('');
                        setIsSplitScreen(false);
                        setSplitSelectedDoc(null);
                    }}
                >
                    <div 
                        className={cn(
                            isSplitScreen 
                                ? "w-1/2 h-full overflow-y-auto bg-gray-100 p-4 border-r flex flex-col min-w-0" 
                                : "max-w-[1000px] mx-auto form-print-shell"
                        )} 
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-md print:hidden">
                            <div className="font-semibold text-lg truncate pr-4">{chairpersonPreviewTitle}</div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={isSplitScreen ? "default" : "outline"}
                                    onClick={() => {
                                        setIsSplitScreen(!isSplitScreen);
                                        if (!isSplitScreen) {
                                            setSplitSelectedDoc(null);
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {isSplitScreen ? "Hide Documents" : "View Documents"}
                                </Button>
                                {chairpersonPreviewFormat === 'json' && (
                                    <Button variant="outline" onClick={() => window.print()}>
                                        Print
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setChairpersonPreviewOpen(false);
                                        setChairpersonPreviewType(null);
                                        setChairpersonPreviewFormat(null);
                                        setChairpersonPreviewData({});
                                        setChairpersonPreviewUrl(null);
                                        setChairpersonPreviewTitle('');
                                        setIsSplitScreen(false);
                                        setSplitSelectedDoc(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="bg-white">
                            {chairpersonPreviewFormat === 'json' ? (
                                <div className="pointer-events-none select-none">
                                    {chairpersonPreviewType === 'ethical_clearance' ? (
                                        <EthicalClearanceForm savedData={chairpersonPreviewData} />
                                    ) : (
                                        <DecisionLetterForm savedData={chairpersonPreviewData} />
                                    )}
                                </div>
                            ) : chairpersonPreviewUrl ? (
                                <iframe
                                    src={chairpersonPreviewUrl}
                                    className="h-[calc(100vh-7rem)] w-full border-0"
                                    title={chairpersonPreviewTitle}
                                />
                            ) : (
                                <div className="p-6 text-center text-gray-500">Loading preview...</div>
                            )}
                        </div>
                    </div>
                    {isSplitScreen && renderSplitScreenDocumentViewer()}
                </div>
            )}
        </>
    );
}