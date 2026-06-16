"use client";

import { FileText, Download, Eye, User, Calendar, FileStack, PenLine, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { DOC_COMPONENT_MAP } from "@/components/forms/FormViewer";
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
import FormViewer from "@/components/forms/FormViewer";

/* ----------------- types ----------------- */
interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string;
    status: string;
    date: string;
    advisor_id?: string | null;
    advisor_signature?: string | null;
    advisor_signature_date?: string | null;
    advisor_comments?: string | null;
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

/* ----------------- component ----------------- */
export default function AdvisorSubmissions() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [submissionDocuments, setSubmissionDocuments] = useState<DocumentItem[]>([]);
    const [formDataDocs, setFormDataDocs] = useState<string[]>([]);
    const [formsLoading, setFormsLoading] = useState(false);
    const [signedForms, setSignedForms] = useState<{ [key: string]: boolean }>({});
    const [formViewerReadOnly, setFormViewerReadOnly] = useState(false);

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");
    const [formViewerOpen, setFormViewerOpen] = useState(false);
    const [activeFormDoc, setActiveFormDoc] = useState<string | null>(null);

    // user
    const [userId, setUserId] = useState<string | null>(null);

    /* fetch initial data - only proposals assigned to current advisor */
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

                // Get user profile to check role
                const { data: userProfileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, fname, lname, category, role")
                    .eq("id", uid)
                    .single();

                if (profileError) {
                    console.error("Error fetching user profile:", profileError);
                } else if (userProfileData && mounted) {
                    setProfiles([userProfileData]);
                }

                // Fetch proposals where current user is the advisor
                const { data: proposals, error } = await supabase
                    .from("proposals")
                    .select("*")
                    .eq("advisor_id", uid)
                    .order("date", { ascending: false });

                if (error) throw error;
                const projs = (proposals || []) as Submission[];

                // If no proposals found, set empty array
                if (!projs || projs.length === 0) {
                    if (mounted) {
                        setSubmissions([]);
                        setProfiles([]);
                        setActiveSubmission(null);
                    }
                    return;
                }

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
        loadSubmissionData();
    }, [activeSubmission]);

    /* Load submission documents */
    const loadSubmissionData = async () => {
        if (!activeSubmission) {
            setSubmissionDocuments([]);
            setFormDataDocs([]);
            setFormsLoading(false);
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

            // Load interactive form_data records
            setFormsLoading(true);
            const { data: formRows } = await supabase
                .from("form_data")
                .select("form_name, data, revision_number")
                .eq("proposal_id", activeSubmission.proposal_id);

            const ADVISOR_SIGN_EXCLUDED = ["0034", "0035", "0028", "0031"];
            const docs = (formRows || [])
                .map((r: any) => {
                    const name = r.form_name || "";
                    const rev = r.revision_number || 1;
                    return rev > 1 ? `v${rev}_${name}` : name;
                })
                .filter((name: string) => !ADVISOR_SIGN_EXCLUDED.some(code => name.includes(code)));
            setFormDataDocs(docs);

            const formFiles = (formRows || []).map((r: any) => {
                const name = r.form_name || "";
                const rev = r.revision_number || 1;
                const displayName = rev > 1 ? `v${rev}_${name}` : name;
                return {
                    name: displayName,
                    url: `form-data://${activeSubmission.proposal_id}/${encodeURIComponent(displayName)}`,
                    phase: 'phase3' as const
                };
            });
            documents.push(...formFiles);

            setSubmissionDocuments(documents);

            // Check which forms already have an advisor signature
            const signed: { [key: string]: boolean } = {};
            for (const row of (formRows || [])) {
                // Endorsement form uses adviserSig (string), others use endorsedMembers (array)
                const adviserSig = row.data?.adviserSig;
                const endorsed = row.data?.endorsedMembers;
                if (adviserSig && typeof adviserSig === "string" && adviserSig.trim() !== "") {
                    signed[row.form_name] = true;
                } else if (Array.isArray(endorsed)) {
                    signed[row.form_name] = endorsed.some((m: any) => m.signature && m.signature.trim() !== "");
                }
            }
            setSignedForms(signed);
            setFormsLoading(false);
        } catch (err) {
            console.error("Failed to load submission data:", err);
            toast.error("Failed to load submission data");
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
                        .createSignedUrl(`${path}/${f.name}`, 60 * 60); // 1 hour expiry

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

    const waitForRender = async (ms = 180) => {
        await new Promise(resolve => setTimeout(resolve, ms));
    };

    const waitForAssets = async (container: HTMLElement) => {
        try {
            if ('fonts' in document) {
                await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
            }
        } catch {
            // Ignore font readiness failures and continue rendering.
        }

        const images = Array.from(container.querySelectorAll('img'));
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
        const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        styleNodes.forEach((node) => {
            targetDoc.head.appendChild(node.cloneNode(true));
        });
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

    /* Open document preview */
    const openPreview = async (url: string, filename: string) => {
        setPreviewUrl(url);
        setPreviewTitle(filename);
        setPreviewOpen(true);
    };

    /* Handle advisor approval */
    const handleApproveProposal = async () => {
        if (!activeSubmission || !userId) return;

        const loadingId = toast.loading("Approving proposal...");
        try {
            let nextStatus = "Send Manuscript";
            let approvalMessage = "Advisor approved the proposal";

            // If the proposal is in Pending Forms Approval, this is Phase 3
            if (activeSubmission.status === "Pending Forms Approval") {
                nextStatus = "Forms Check";
                approvalMessage = "Advisor approved Phase 3 forms submission";
            }

            const { error } = await supabase
                .from("proposals")
                .update({
                    status: nextStatus,
                    advisor_signature_date: new Date().toISOString(),
                    updated_on: new Date().toISOString()
                })
                .eq("proposal_id", activeSubmission.proposal_id);

            if (error) throw error;

            // Add history entry
            const historyDataEntry = {
                history_type: "advisor_approval",
                paper_id: activeSubmission.proposal_id,
                comment: approvalMessage,
                actor: userId,
                action: "ADVISOR_APPROVED",
                history_date: new Date().toISOString(),
                status: nextStatus,
            };

            const { error: historyError } = await supabase.from("history").insert(historyDataEntry);
            if (historyError) console.error("History error:", historyError);

            // Update local state
            setSubmissions(prev => prev.map(s => 
                s.proposal_id === activeSubmission.proposal_id 
                    ? { ...s, status: nextStatus }
                    : s
            ));
            setActiveSubmission(prev => prev ? { ...prev, status: nextStatus } : null);

            toast.success("Proposal approved successfully!", { id: loadingId });
        } catch (err: any) {
            console.error("Failed to approve proposal:", err);
            toast.error(`Failed to approve: ${err.message || 'Unknown error'}`, { id: loadingId });
        }
    };

    /* Handle advisor rejection */
    const handleRejectProposal = async () => {
        if (!activeSubmission || !userId) return;

        const loadingId = toast.loading("Rejecting proposal...");
        try {
            const isFormsRejection = activeSubmission.status === "Pending Forms Approval";
            const rejectedStatus = isFormsRejection ? "Resend Forms" : "Advisor Rejected";

            const { error } = await supabase
                .from("proposals")
                .update({
                    status: rejectedStatus,
                    updated_on: new Date().toISOString()
                })
                .eq("proposal_id", activeSubmission.proposal_id);

            if (error) throw error;

            // Add history entry
            const historyData = {
                history_type: "advisor_rejection",
                paper_id: activeSubmission.proposal_id,
                comment: isFormsRejection ? "Advisor rejected Phase 3 forms submission" : "Advisor rejected the proposal",
                actor: userId,
                action: "ADVISOR_REJECTED",
                history_date: new Date().toISOString(),
                status: rejectedStatus,
            };

            const { error: historyError } = await supabase.from("history").insert(historyData);
            if (historyError) console.error("History error:", historyError);

            // Update local state
            setSubmissions(prev => prev.map(s => 
                s.proposal_id === activeSubmission.proposal_id 
                    ? { ...s, status: rejectedStatus }
                    : s
            ));
            setActiveSubmission(prev => prev ? { ...prev, status: rejectedStatus } : null);

            toast.success("Proposal rejected", { id: loadingId });
        } catch (err: any) {
            console.error("Failed to reject proposal:", err);
            toast.error(`Failed to reject: ${err.message || 'Unknown error'}`, { id: loadingId });
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
                    <h1 className="text-xl sm:text-2xl font-semibold">Advisor Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        {submissions.length} Proposals Assigned
                    </p>
                </div>
            </div>

            {/* submissions table - no limit */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border min-w-[200px]">Title</TableHead>
                            <TableHead className="border min-w-[120px]">Researcher</TableHead>
                            <TableHead className="border min-w-[100px]">Category</TableHead>
                            <TableHead className="border min-w-[100px]">Status</TableHead>
                            <TableHead className="border min-w-[100px]">Date</TableHead>
                            <TableHead className="border w-1 whitespace-nowrap text-center min-w-[100px]">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : submissions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No proposals assigned to you yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            submissions.map((submission) => (
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
                                    <TableCell className="border">
                                        <Badge variant="secondary" className="text-xs">
                                            {submission.status}
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
                                                        <span className="text-sm">View</span>
                                                    </RippleButton>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View this proposal</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))
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
                                    <Badge variant="default" className="inline-flex items-center gap-1 max-w-full px-2 py-1">
                                        <span className="truncate">{activeSubmission.status}</span>
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
                                                            onClick={() => {
                                                                if (doc.url.startsWith("form-data://")) {
                                                                    setFormViewerReadOnly(true);
                                                                    setActiveFormDoc(doc.name);
                                                                    setFormViewerOpen(true);
                                                                } else {
                                                                    openPreview(doc.url, doc.name);
                                                                }
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                        {doc.url.startsWith("form-data://") ? (
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

                        {/* interactive forms for signing */}
                        {(formsLoading || formDataDocs.length > 0) && (
                            <div className="space-y-4 mb-6">
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-medium">
                                    <PenLine className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wide">Forms to Sign</span>
                                </div>
                                <div className="space-y-3">
                                    {formsLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Skeleton className="h-5 w-5 rounded" />
                                                        <Skeleton className="h-4 w-48" />
                                                    </div>
                                                    <Skeleton className="h-8 w-16 rounded" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        formDataDocs.map((formName, index) => (
                                            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <FileText className={cn("h-5 w-5 mt-0.5 flex-shrink-0", signedForms[formName] ? "text-green-500" : "text-blue-400")} />
                                                        <span className="font-medium text-gray-900 truncate">{formName}</span>
                                                        {signedForms[formName] && (
                                                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs flex-shrink-0">
                                                                <Check className="w-3 h-3 mr-1" /> Signed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant={signedForms[formName] ? "ghost" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setFormViewerReadOnly(!!signedForms[formName]);
                                                            setActiveFormDoc(formName);
                                                            setFormViewerOpen(true);
                                                        }}
                                                    >
                                                        <PenLine className="h-4 w-4 mr-2" />
                                                        {signedForms[formName] ? "View" : "Sign"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                </div>
                            </div>
                        )}

                        {/* Approval Actions - Only show for pending proposals */}
                        {(activeSubmission.status === "Pending Advisor Approval" || activeSubmission.status === "Pending Forms Approval") && (
                            <div className="border-t pt-6">
                                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={handleRejectProposal}
                                        className="sm:w-auto w-full"
                                    >
                                        Reject {submissionDocuments.length > 0 ? "Forms Submission" : "Proposal"}
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleApproveProposal}
                                        className="sm:w-auto w-full"
                                    >
                                        Approve {submissionDocuments.length > 0 ? "Forms Submission" : "Proposal"}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 text-right">
                                    {submissionDocuments.length > 0 
                                        ? "Approving will move the submission to forms check and then deployment queue"
                                        : "Approving will allow the researcher to submit manuscript files"
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Preview Dialog */}
            {previewOpen && previewUrl && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold truncate">{previewTitle}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                                Close
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full"
                                title={previewTitle}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Form Viewer Dialog for advisor signing */}
            {formViewerOpen && activeFormDoc && activeSubmission && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold truncate">{activeFormDoc}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setFormViewerOpen(false)}>
                                Close
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <FormViewer
                                key={`${activeSubmission.proposal_id}-${activeFormDoc}`}
                                documentName={activeFormDoc}
                                proposalId={activeSubmission.proposal_id}
                                protocolCode={activeSubmission.protocol_id}
                                proposalTitle={activeSubmission.proposal_title}
                                reviewType={activeSubmission.review_type}
                                advisorId={userId}
                                readOnly={formViewerReadOnly}
                                readOnlyAdvisor={formViewerReadOnly}
                                onDone={async () => {
                                    setFormViewerOpen(false);
                                    // Re-check signature status for this form
                                    let actualFormName = activeFormDoc;
                                    let explicitRevision = 1;
                                    const match = activeFormDoc.match(/^v(\d+)_(.+)$/);
                                    if (match) {
                                        explicitRevision = parseInt(match[1], 10);
                                        actualFormName = match[2];
                                    }

                                    const { data } = await supabase
                                        .from("form_data")
                                        .select("data")
                                        .eq("proposal_id", activeSubmission.proposal_id)
                                        .eq("form_name", actualFormName)
                                        .eq("revision_number", explicitRevision)
                                        .single();
                                    if (data?.data) {
                                        const adviserSig = data.data.adviserSig;
                                        const endorsed = data.data.endorsedMembers;
                                        let isSigned = false;
                                        if (adviserSig && typeof adviserSig === "string" && adviserSig.trim() !== "") {
                                            isSigned = true;
                                        } else if (Array.isArray(endorsed)) {
                                            isSigned = endorsed.some((m: any) => m.signature && m.signature.trim() !== "");
                                        }
                                        setSignedForms(prev => ({ ...prev, [activeFormDoc]: isSigned }));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
