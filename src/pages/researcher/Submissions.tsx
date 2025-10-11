"use client";

import { FileText, Download, FileUp, Eye, PenLine, Clock, Check, RefreshCcw, Shield, ClipboardList, Rocket, FileStack, Pen, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useState, useEffect, useRef } from "react";
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
import { PdfFormViewer } from "@/components/ui/pdf-form-viewer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Plus } from "lucide-react";
import { supabase } from "@/DB";
import { toast } from "sonner";

/* ----------------- types ----------------- */
interface Submission {
    proposal_id: number;
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

interface Placeholder {
    x: number;
    y: number;
    id: number;
    name: string;
    page: number;
    type: 'text';
    width: number;
    height: number;
}

interface PdfFile {
    id: string;
    name: string;
    placeholders: Placeholder[];
    created_at: string;
    updated_at: string;
}

interface DocumentItem {
    name: string;
    templateUrl: string;
    required: boolean;
    needsSignature?: boolean;  // All forms need signatures
    needsAnswer?: boolean;     // All forms need to be filled out
    signStatus?: 'pending' | 'completed';
    answerStatus?: 'pending' | 'completed';
    pdfFileId?: string;  // Reference to the pdf_files table
}

interface DocumentSubmission {
    document_id?: number;
    proposal_id: number;
    doc_type: string;
    file_path: string;
    uploaded_at?: string;
}

interface HistoryEntry {
    history_id: number;
    history_date: string;
    history_type: string | null;
    paper_id: number | null;
    comment: string | null;
    actor: string | null;
    affected_files: { name: string; required: boolean }[] | null;
    action: string | null;
}

/* ----------------- helpers & config ----------------- */

const phases = [
    {
        title: "Phase 1: Manuscript Submission",
        statuses: ["Send Manuscript", "Check Manuscript", "Resend Manuscript"],
    },
    { title: "Phase 2: Risk Assessment", statuses: ["Risk Assessment"] },
    {
        title: "Phase 3: Forms Submission",
        statuses: ["Send Forms", "Forms Check", "Resend Forms"],
    },
    { title: "Phase 4: Deployment Queue", statuses: ["Deploy Queue"] },
];

// icon mapping for phases (1: Manuscript, 2: Risk, 3: Forms, 4: Deploy)
const phaseIcons = [FileText, Shield, ClipboardList, Rocket];

const normalizeStatus = (status: string) => {
    if (status === "Resend Manuscript") return "Send Manuscript";
    if (status === "Resend Forms") return "Send Forms";
    return status;
};

const getNextStatus = (status: string) => {
    switch (status) {
        case "Send Manuscript":
            return "Check Manuscript";
        case "Check Manuscript":
            return "Risk Assessment";
        case "Resend Manuscript":
            return "Check Manuscript";
        case "Risk Assessment":
            return "Send Forms";
        case "Send Forms":
            return "Forms Check";
        case "Forms Check":
            return "Deploy Queue";
        case "Resend Forms":
            return "Forms Check";
        default:
            return status;
    }
};

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
        default:
            return "View";
    }
};

const getPhaseDocuments = (submission: Submission): DocumentItem[] => {
    if (["Send Manuscript", "Resend Manuscript"].includes(submission.status)) {
        // Manuscript phase - all documents are uploadable
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Updated CV", templateUrl: "/templates/cv.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "All Grades", templateUrl: "/templates/grades.pdf", required: true, needsSignature: false, needsAnswer: false },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: true, needsSignature: false, needsAnswer: false }
                : null,
        ].filter(Boolean) as DocumentItem[];
    }

    if (["Send Forms", "Resend Forms"].includes(submission.status)) {
        const isExternal = submission.category === "External";
        const isGrad = submission.category === "Graduate";
        // normalize review type for robust comparisons
        const reviewTypeRaw = (submission.review_type || "").toString();
        const reviewType = reviewTypeRaw.trim().toLowerCase() || "exempt"; // default to exempt when missing

        // Common document properties
        const makeDoc = (name: string): DocumentItem => ({
            name,
            templateUrl: "", // No template URL as these are forms to be filled out directly
            required: true,
            needsSignature: true,
            needsAnswer: true,
        });

        if (isExternal) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0036_MOA for external.pdf"),
                ];
            }

            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0027_Ethics Application Procedure.pdf"),
                makeDoc("REC_FO_0028_Ethics Study Protocol Information Form.pdf"),
                makeDoc("REC_FO_0029_Ethics Informed Consent CHECKLIST.pdf"),
                makeDoc("REC_FO_0030_Ethics Informed Consent Form when Questionnaire are Used.pdf"),
                makeDoc("REC_FO_0031_Ethics Informed Consent Form (ICF)_Sample.pdf"),
                makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
                makeDoc("REC_FO_0036_MOA for external.pdf"),
            ];
        }

        if (isGrad) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_ENDORSMENT_FORM.pdf"),
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf"),
                ];
            }

            // EXPEDITED and FULL BOARD use same documents
            return [
                makeDoc("REC_ENDORSMENT_FORM.pdf"),
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0027_Ethics Application Procedure.pdf"),
                makeDoc("REC_FO_0028_Ethics Study Protocol Information Form.pdf"),
                makeDoc("REC_FO_0029_Ethics Informed Consent CHECKLIST.pdf"),
                makeDoc("REC_FO_0030_Ethics Informed Consent Form when Questionnaire are Used.pdf"),
                makeDoc("REC_FO_0031_Ethics Informed Consent Form (ICF)_Sample.pdf"),
                makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
            ];
        }

        // UNDERGRAD
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
            ];
        }

        // EXPEDITED and FULL BOARD use same documents
        return [
            makeDoc("REC_FO_0026_EthicsProtocolChecklist.pdf"),
            makeDoc("REC_FO_0027_EthicsApplicationProcedure.pdf"),
            makeDoc("REC_FO_0028_EthicsStudyProtocolInformationForm.pdf"),
            makeDoc("REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf"),
            makeDoc("REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf"),
            makeDoc("REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf"),
            makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
            makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
        ];
    }

    return [];
};

const getLatestHistory = async (proposal_id: number): Promise<HistoryEntry | null> => {
    const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("paper_id", proposal_id)
        .order("history_date", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Failed to fetch history:", error);
        return null;
    }
    return data as HistoryEntry;
};

/* helper: map phase index -> upload-status folder name (or null if phase has no uploads) */
const phaseUploadStatus = (phaseIndex: number): string | null => {
    if (phaseIndex === 0) return "Send Manuscript";
    if (phaseIndex === 2) return "Send Forms";
    return null;
};

/* ----------------- component ----------------- */
export default function SubmissionsPage() {
    // data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // selected / ui state
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [historyFiles, setHistoryFiles] = useState<DocumentItem[] | null>(null);
    const [latestComment, setLatestComment] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);

    // user + uploads
    const [userId, setUserId] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});
    const [answeredDocuments, setAnsweredDocuments] = useState<{ [key: string]: boolean }>({});
    const [signedDocuments, setSignedDocuments] = useState<{ [key: string]: boolean }>({});

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);

    // new proposal modal
    const [newProposalOpen, setNewProposalOpen] = useState(false);
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [newProposalDescription, setNewProposalDescription] = useState("");

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

    /* when activeSubmission changes: reset uploads, load history if "Resend" */
    useEffect(() => {
        setUploadedFiles({});
        setSignedDocuments({});
        setAnsweredDocuments({});
        setHistoryFiles(null);
        setLatestComment(null);
        setActiveTab(0);

        const prepare = async () => {
            if (!activeSubmission) return;
            const idx = phases.findIndex((p) => p.statuses.includes(activeSubmission.status));
            setActiveTab(idx === -1 ? 0 : idx);

            if (["Resend Manuscript", "Resend Forms"].includes(activeSubmission.status)) {
                const hist = await getLatestHistory(activeSubmission.proposal_id);
                if (hist?.affected_files) {
                    try {
                        const parsed = typeof hist.affected_files === "string" ? JSON.parse(hist.affected_files) : hist.affected_files;
                        setHistoryFiles(
                            parsed.map((f: any) => ({ name: f.name, required: f.required, templateUrl: "/templates/unknown.pdf" }))
                        );
                        setLatestComment(hist.comment || null);
                    } catch (err) {
                        console.error("Failed to parse affected_files:", err);
                    }
                }
            }
        };

        prepare();
    }, [activeSubmission]);

    /* convenience lookup */
    const getProfileName = (id: string | null) => {
        if (!id) return "Unknown";
        const p = profiles.find((x) => x.id === id);
        return p ? `${p.lname}, ${p.fname}` : "Unknown";
    };

    /* list stored files for a phase (for past-phase viewing) */
    const listStoredFilesForPhase = async (submissionId: number, phaseIndex: number) => {
        const uploadStatus = phaseUploadStatus(phaseIndex);
        if (!uploadStatus) return [] as { name: string; url: string }[];

        try {
            const path = `${submissionId}/${uploadStatus}`;
            const { data, error } = await supabase.storage.from("documents").list(path);

            if (error) {
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

            // Filter out failed ones
            return signedFiles.filter((f): f is { name: string; url: string } => f !== null);
        } catch (err) {
            console.error(err);
            return [];
        }
    };


    /* open preview (signed url + dialog) */
    const openPreview = async (submissionId: number, phaseIndex: number, filename: string, label?: string) => {
        setPreviewUrl(null);
        setPreviewTitle(label || filename);
        setPreviewOpen(true);
        try {
            const uploadStatus = phaseUploadStatus(phaseIndex);
            if (!uploadStatus) throw new Error("No stored files for this phase.");
            const path = `${submissionId}/${uploadStatus}/${filename}`;
            const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
            if (error) throw error;
            setPreviewUrl(data.signedUrl);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load preview: " + (err.message || err));
            setPreviewUrl(null);
        }
    };

    /* create new proposal */
    const handleCreateProposal = async () => {
        if (!newProposalTitle.trim()) return toast.error("Title is required");
        const loading = toast.loading("Creating proposal...");
        try {
            const { data: userData } = await supabase.auth.getUser();
            const uid = userData?.user?.id;
            if (!uid) throw new Error("Not logged in");
            const userProfile = profiles.find((p) => p.id === uid);
            const category = userProfile?.category || "Undergraduate";

            const { data: proposal, error } = await supabase
                .from("proposals")
                .insert([
                    {
                        proposal_title: newProposalTitle,
                        description: newProposalDescription,
                        category,
                        status: "Send Manuscript",
                        researcher: uid,
                        date: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error || !proposal) throw error;

            setSubmissions((prev) => [proposal as Submission, ...prev]);
            setNewProposalOpen(false);
            setNewProposalTitle("");
            setNewProposalDescription("");
            toast.success("Proposal created successfully!", { id: loading });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to create proposal: " + (err.message || err));
        } finally {
            toast.dismiss();
        }
    };

    /* handle local file pick */
    const handleFileSelect = (docName: string, file: File | null) => {
        setUploadedFiles((prev) => ({ ...prev, [docName]: file }));
    };

    /* submit completed forms & advance phase */
    const uploadAndAdvancePhase = async (submission: Submission) => {
        const docs = historyFiles || getPhaseDocuments(submission);
        const loadingId = toast.loading("Submitting forms...");

        try {
            // Verify all required documents for this phase are completed according to their flags
            const incomplete = docs.filter(doc => {
                if (!doc.required) return false;
                const needsSig = !!doc.needsSignature;
                const needsAns = !!doc.needsAnswer;

                // If both signature and answers are required, require both
                if (needsSig && needsAns) return !(signedDocuments[doc.name] && answeredDocuments[doc.name]);
                if (needsSig) return !signedDocuments[doc.name];
                if (needsAns) return !answeredDocuments[doc.name];

                // Default for manuscript-like docs: require uploaded file
                return !uploadedFiles[doc.name];
            });

            if (incomplete.length > 0) {
                const missing = incomplete.map(doc => {
                    const issues: string[] = [];
                    if (doc.needsSignature && !signedDocuments[doc.name]) issues.push("signature");
                    if (doc.needsAnswer && !answeredDocuments[doc.name]) issues.push("answers");
                    if (!doc.needsSignature && !doc.needsAnswer && !uploadedFiles[doc.name]) issues.push("upload");
                    return `${doc.name} (missing ${issues.join(" and ")})`;
                });
                throw new Error(`Please complete all required documents:\n${missing.join("\n")}`);
            }

            // Record form submissions in database and upload any files
            for (const doc of docs) {
                let filePath: string | null = null;

                // If user uploaded a file for this doc, upload it to storage
                const uploadStatus = phaseUploadStatus(getActivePhaseIndex(submission.status));
                if (uploadedFiles[doc.name]) {
                    try {
                        const file = uploadedFiles[doc.name]!;

                        // generate storage filename from document name
                        const slugify = (s: string) => s
                            .toLowerCase()
                            .replace(/\.pdf$/i, '')
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_+|_+$/g, '');

                        const storageFilename = doc.name === 'All Grades' ? 'all_files.pdf' : `${slugify(doc.name)}.pdf`;
                        const path = `${submission.proposal_id}/${uploadStatus || 'other'}/${storageFilename}`;

                        // Create a new File with the storage filename so the uploaded object has the normalized name
                        const renamedFile = new File([file], storageFilename, { type: file.type });

                        // upload (upsert true to replace existing)
                        const { error: uploadError } = await supabase.storage.from('documents').upload(path, renamedFile, { upsert: true });
                        if (uploadError) throw uploadError;

                        filePath = path;
                    } catch (uploadErr: any) {
                        console.error('File upload failed for', doc.name, uploadErr);
                        throw new Error(`Failed to upload file for ${doc.name}: ${uploadErr.message || uploadErr}`);
                    }
                }

                // Insert a record about the document submission. Use only fields we know exist in your schema.
                const record: any = {
                    proposal_id: submission.proposal_id,
                    doc_type: doc.name,
                    file_path: filePath || "",
                    uploaded_at: filePath ? new Date().toISOString() : null,
                };

                const { error: dbError } = await supabase.from('proposal_documents').insert(record);
                if (dbError) {
                    console.error('Failed to insert proposal_documents record for', doc.name, dbError);
                    throw new Error(dbError.message || 'Failed to record document submission');
                }
            }

            // update proposal status
            const nextStatus = getNextStatus(submission.status);
            const { error: statusError } = await supabase.from("proposals").update({ status: nextStatus }).eq("proposal_id", submission.proposal_id);
            if (statusError) throw new Error(statusError.message);

            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const affectedFiles = docs.map((d) => ({ name: d.name, required: d.required }));

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "submission",
                paper_id: submission.proposal_id,
                comment: "Phase submitted",
                actor: actorId,
                affected_files: affectedFiles,
                action: "Submit Phase",
                history_date: new Date().toISOString(),
            });
            if (historyError) throw new Error(historyError.message);

            // clear local files for those docs
            setUploadedFiles((prev) => {
                const copy = { ...prev };
                docs.forEach((d) => delete copy[d.name]);
                return copy;
            });

            // refresh proposals and active submission
            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === submission.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            toast.success("Phase submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Submission failed: " + (err.message || err), { id: loadingId });
        }
    };

    /* fetch PDF file details from database */
    const getPdfFileDetails = async (filename: string): Promise<PdfFile | null> => {
        try {
            const { data, error } = await supabase
                .from('pdf_files')
                .select('*')
                .eq('name', filename)
                .single();

            if (error) {
                console.error('Error fetching PDF file:', error);
                return null;
            }

            return data as PdfFile;
        } catch (err) {
            console.error('Failed to fetch PDF file details:', err);
            return null;
        }
    };

    /* render helpers */
    const renderPhaseFilesForActive = (submission: Submission) => {
        const docs = historyFiles || getPhaseDocuments(submission);
        return (
            <div className="space-y-4">
                {docs.map((doc) => (
                    <div key={doc.name} className="border rounded-lg p-4 bg-white shadow-sm">
                        {/* Horizontal layout: Title | Upload Area | Buttons */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full">
                            {/* Document Info - Left side */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-gray-900 break-words">{doc.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant={doc.required ? "default" : "secondary"} className="text-xs">
                                                {doc.required ? "Required" : "Optional"}
                                            </Badge>
                                            {doc.needsSignature && (
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                    Needs Signature
                                                </Badge>
                                            )}
                                            {doc.needsAnswer && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                    Needs Answer
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upload/Status Area - Middle */}
                            <div className="w-full lg:w-48 flex-shrink-0">
                                <div className="relative">
                                    {/* Show upload area for manuscript phase */}
                                    {["Send Manuscript", "Resend Manuscript"].includes(submission.status) ? (
                                        <>
                                            <div className="mb-2 text-xs text-gray-500">Only upload is required for this phase.</div>
                                            <div
                                                className={cn(
                                                    "relative w-full min-h-[80px] border-2 border-dashed rounded-lg p-3 transition-colors",
                                                    uploadedFiles[doc.name]
                                                        ? "border-primary bg-primary/5"
                                                        : "border-gray-300"
                                                )}
                                            >
                                                <Input
                                                    id={`file-${doc.name}`}
                                                    type="file"
                                                    accept="application/pdf"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer hover:cursor-pointer"
                                                    onChange={(e) => {
                                                        const file = e.target.files ? e.target.files[0] : null;
                                                        if (!file) return;
                                                        if (file.type !== "application/pdf") {
                                                            toast.error("Only PDF files are allowed");
                                                            (e.target as HTMLInputElement).value = "";
                                                            return;
                                                        }
                                                        if (file.size > 25 * 1024 * 1024) {
                                                            toast.error("File size must be under 25MB");
                                                            (e.target as HTMLInputElement).value = "";
                                                            return;
                                                        }
                                                        handleFileSelect(doc.name, file);
                                                    }}
                                                />
                                                <div className="text-center flex flex-col items-center justify-center h-full">
                                                    <FileUp className="h-6 w-6 text-gray-400 mb-1" />
                                                    <p className="text-xs text-gray-500 truncate max-w-full">
                                                        {uploadedFiles[doc.name]
                                                            ? uploadedFiles[doc.name]?.name
                                                            : "Click to upload PDF"}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Show status area for forms phase */
                                        <div className="relative w-full min-h-[80px] border-2 rounded-lg p-3 bg-gray-50">
                                            <div className="text-center flex flex-col items-center justify-center h-full">
                                                <Pen className="h-6 w-6 text-gray-400 mb-1" />
                                                <p className="text-xs text-gray-500">
                                                    Form to be filled out
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {(answeredDocuments[doc.name] ? "✓ " : "• ") + "Answers"}
                                                    {" | "}
                                                    {(signedDocuments[doc.name] ? "✓ " : "• ") + "Signature"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons - Right side */}
                            <div className="flex flex-col gap-2 w-full lg:w-[140px]">
                                {/* Template Download - if available */}
                                {doc.templateUrl && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <a href={doc.templateUrl} download className="block w-full">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Template
                                                    </Button>
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Download Template</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {/* Sign Document Button */}
                                {doc.needsSignature && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant={signedDocuments[doc.name] ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "w-full",
                                                        signedDocuments[doc.name] && "bg-green-500 hover:bg-green-600"
                                                    )}
                                                    onClick={() => {
                                                        setActiveDocument(doc.name);
                                                        setSignatureDialogOpen(true);
                                                    }}
                                                >
                                                    {signedDocuments[doc.name] ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Signed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PenLine className="h-4 w-4 mr-2" />
                                                            Sign
                                                        </>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{signedDocuments[doc.name] ? 'Document Signed' : 'Sign Document'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {/* Answer Questions Button */}
                                {doc.needsAnswer && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant={answeredDocuments[doc.name] ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "w-full",
                                                        answeredDocuments[doc.name] && "bg-green-500 hover:bg-green-600"
                                                    )}
                                                    onClick={() => {
                                                        setActiveDocument(doc.name);
                                                        setAnswerDialogOpen(true);
                                                    }}
                                                >
                                                    {answeredDocuments[doc.name] ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Answered
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Fill Out
                                                        </>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{answeredDocuments[doc.name] ? 'Questions Answered' : 'Answer Questions'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {/* Preview Button - Only show if file is uploaded */}
                                {uploadedFiles[doc.name] && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (uploadedFiles[doc.name]) {
                                                            const url = URL.createObjectURL(uploadedFiles[doc.name]!);
                                                            setPreviewUrl(url);
                                                            setPreviewTitle(doc.name);
                                                            setPreviewOpen(true);
                                                        }
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Preview Document</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="pt-4">
                    <RippleButton
                        onClick={() => uploadAndAdvancePhase(submission)}
                        disabled={!docs.every((d) => {
                            if (!d.required) return true;
                            const needsSig = !!d.needsSignature;
                            const needsAns = !!d.needsAnswer;
                            // If both signature and answers are required, require both
                            if (needsSig && needsAns) return !!signedDocuments[d.name] && !!answeredDocuments[d.name];
                            if (needsSig) return !!signedDocuments[d.name];
                            if (needsAns) return !!answeredDocuments[d.name];
                            // default: require uploaded file
                            return !!uploadedFiles[d.name];
                        })}
                        className="w-full sm:w-auto"
                    >
                        Submit Phase
                    </RippleButton>
                </div>
            </div>
        );
    };

    const handleOpenSubmission = (submission: any) => {
        setActiveSubmission(prev =>
            prev?.proposal_id === submission.proposal_id ? null : submission
        );
    };

    // Show a toast when the active submission changes (skip initial auto-selection)
    const _firstActiveToast = useRef(true);
    useEffect(() => {
        // skip on initial mount/default selection
        if (_firstActiveToast.current) {
            _firstActiveToast.current = false;
            return;
        }

        if (!activeSubmission) return;

        const title = activeSubmission.proposal_title || "(untitled)";
        const review = activeSubmission.review_type || "Unknown";
        toast(`Active proposal: ${title} — Review: ${review}`);
    }, [activeSubmission?.proposal_id]);

    // Helper: map submission status to active phase index
    const getActivePhaseIndex = (status: string) => {
        const phaseMap: Record<string, number> = {
            "Send Manuscript": 0,
            "Check Manuscript": 0,
            "Resend Manuscript": 0,
            "Risk Assessment": 1,
            "Send Forms": 2,
            "Forms Check": 2,
            "Resend Forms": 2,
            "Deploy Queue": 3,
        };
        return phaseMap[status] ?? 0;
    };

    /* Past-phase list component */
    function PastPhaseFilesList({ phaseIndex }: { phaseIndex: number }) {
        const [storedFiles, setStoredFiles] = useState<{ name: string; url: string }[] | null>(null);
        useEffect(() => {
            let mounted = true;
            (async () => {
                if (!activeSubmission) return;
                const list = await listStoredFilesForPhase(activeSubmission.proposal_id, phaseIndex);
                if (!mounted) return;
                setStoredFiles(list || []);
            })();
            return () => {
                mounted = false;
            };
        }, [activeSubmission, phaseIndex]);

        if (!activeSubmission) return null;
        if (storedFiles === null) return <div className="py-6"><Skeleton className="h-6 w-full" /></div>;
        if (storedFiles.length === 0) return <div className="text-sm text-gray-500">No files uploaded for this phase.</div>;

        return (
            <div className="space-y-2">
                {storedFiles.map((f) => (
                    <div key={f.name} className="flex flex-col sm:flex-row sm:items-center justify-between border p-3 rounded gap-2 sm:gap-0">
                        <div className="font-medium truncate">{f.name}</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openPreview(activeSubmission!.proposal_id, phaseIndex, f.name, f.name)}>
                                View
                            </Button>
                            <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <RippleButton variant="outline" size="sm">Download</RippleButton>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

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

            {/* bottom table (up to 3) */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border min-w-[200px]">Title</TableHead>
                            <TableHead className="border min-w-[120px]">Status</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
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
                                        <TableCell className="border">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium truncate">{submission.proposal_title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <Badge
                                                variant={submission.status.includes("Resend") ? "destructive" : "outline"}
                                                className={cn(
                                                    "font-medium",
                                                    submission.status.includes("Check") && "bg-yellow-50 text-yellow-700 border-yellow-300",
                                                    submission.status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300"
                                                )}
                                            >
                                                {submission.status.includes("Resend") && <RefreshCcw className="w-3 h-3 mr-1" />}
                                                {submission.status.includes("Check") && <Clock className="w-3 h-3 mr-1" />}
                                                {submission.status === "Deploy Queue" && <Check className="w-3 h-3 mr-1" />}
                                                <span className="truncate">{submission.status}</span>
                                            </Badge>
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
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-300" />
                                                <span>Available Slot</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border">
                                            <Badge variant="outline" className="text-gray-400 border-gray-200">Not Started</Badge>
                                        </TableCell>
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

            {/* top card */}
            <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
                {!activeSubmission ? (
                    <div className="text-center py-8 text-gray-500">No submission selected</div>
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
                                    <Badge
                                        variant={activeSubmission.status.includes("Resend") ? "destructive" : "outline"}
                                        className={cn(
                                            "inline-flex items-center gap-1 max-w-full px-2 py-1",
                                            activeSubmission.status.includes("Check") && "bg-yellow-50 text-yellow-700 border-yellow-300",
                                            activeSubmission.status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300"
                                        )}
                                    >
                                        {activeSubmission.status.includes("Resend") && <RefreshCcw className="w-3 h-3" />}
                                        {activeSubmission.status.includes("Check") && <Clock className="w-3 h-3" />}
                                        {activeSubmission.status === "Deploy Queue" && <Check className="w-3 h-3" />}
                                        <span className="truncate">{activeSubmission.status}</span>
                                    </Badge>
                                </div>
                                <div className="text-xs text-gray-400 mt-2">Submitted {new Date(activeSubmission.date).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* description placed above phases */}
                        <div className="space-y-2 mb-4">
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

                        {/* tabs */}
                        {latestComment && (
                            <div className="mb-4 p-3 border rounded bg-amber-50 text-amber-800 flex items-start gap-2">
                                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="text-sm min-w-0">
                                    <div className="font-medium">Reviewer comment</div>
                                    <div className="whitespace-pre-wrap break-words">{latestComment}</div>
                                </div>
                            </div>
                        )}

                        <Tabs value={`${activeTab}`} onValueChange={(v) => setActiveTab(Number(v))}>
                            <TabsList className="flex w-full gap-1 sm:gap-2 py-0.5">
                                {phases.map((phase, idx) => {
                                    const activeIdx = getActivePhaseIndex(activeSubmission?.status || "");
                                    const isActive = idx === activeIdx;
                                    const isComplete = idx < activeIdx;
                                    const isUpcoming = idx > activeIdx;

                                    return (
                                        <TabsTrigger
                                            key={phase.title}
                                            value={`${idx}`}
                                            disabled={isUpcoming}
                                            className={`
          flex items-center justify-center gap-2
          flex-1 min-w-0
          px-2 py-1
          whitespace-nowrap text-ellipsis overflow-hidden
          text-xs sm:text-sm
          transition-all duration-200 ease-in-out
          ${isActive ? "" : ""}
          ${isComplete ? "phase-complete" : ""}
          ${isUpcoming ? "phase-upcoming text-white" : "text-gray-800"}
        `}
                                        >
                                            {(() => { const Icon = phaseIcons[idx]; return Icon ? <Icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> : null; })()}
                                            <span className="truncate hidden sm:inline">{phase.title}</span>
                                            <span className="truncate sm:hidden">Phase {idx + 1}</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {phases.map((phase, idx) => {
                                const activeIdx = getActivePhaseIndex(activeSubmission.status);
                                const isPast = activeIdx !== -1 && idx < activeIdx;
                                const isActive = activeIdx !== -1 && idx === activeIdx;
                                const isFuture = activeIdx !== -1 && idx > activeIdx;

                                return (
                                    <TabsContent key={phase.title} value={`${idx}`} className="mt-4">
                                        {isPast && (
                                            <>
                                                <div className="mb-2 text-sm text-gray-600">This phase is completed — view uploaded files below.</div>
                                                <PastPhaseFilesList phaseIndex={idx} />
                                            </>
                                        )}

                                        {isActive && (
                                            <>
                                                {["Check Manuscript", "Forms Check"].includes(activeSubmission.status) ? (
                                                    <PastPhaseFilesList phaseIndex={idx} />
                                                ) : phaseUploadStatus(idx) && activeSubmission.researcher === userId ? (
                                                    <>
                                                        <div className="mb-2 text-sm text-gray-600">Upload required documents for this phase.</div>
                                                        {renderPhaseFilesForActive(activeSubmission)}
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-500">No files required for this phase.</div>
                                                )}
                                            </>
                                        )}

                                        {isFuture && <div className="text-gray-500">This phase is not yet available.</div>}

                                        {/* fallback */}
                                        {!isPast && !isActive && !isFuture && <div className="text-sm text-gray-500">No files for this phase.</div>}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>

                    </>
                )}
            </div>

            {/* Full screen preview overlay */}
            {previewOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="font-semibold text-lg">{previewTitle}</div>
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
                </div>
            )}

            {/* New Proposal Dialog */}
            <Dialog open={newProposalOpen} onOpenChange={setNewProposalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Input
                                id="title"
                                placeholder="Enter proposal title"
                                value={newProposalTitle}
                                onChange={(e) => setNewProposalTitle(e.target.value)}
                                className="col-span-4"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right col-span-4">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Enter proposal description"
                                value={newProposalDescription}
                                onChange={(e) => setNewProposalDescription(e.target.value)}
                                className="col-span-4 resize-none"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewProposalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProposal}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Signature Dialog */}
            <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                <DialogContent className="w-full max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add Signature - {activeDocument}</DialogTitle>
                    </DialogHeader>

                    {/* SIGNATURE MODULE PLACEHOLDER */}
                    <div className="h-[300px] flex items-center justify-center border rounded text-gray-500">
                        Signature module for {activeDocument}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (activeDocument) {
                                setSignedDocuments(prev => ({ ...prev, [activeDocument]: true }));
                                setSignatureDialogOpen(false);
                                toast.success("Signature added successfully");
                            }
                        }}>
                            Save Signature
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Answer Dialog */}
            <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
                <DialogContent className="w-full max-w-7xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Answer Form - {activeDocument}</DialogTitle>
                    </DialogHeader>

                            <div className="flex flex-1 gap-4 min-h-0">
                                {/* PDF Preview */}
                                <div className="flex-1 relative border rounded-lg overflow-hidden bg-gray-50">
                                    <div className="absolute inset-0">
                                        {activeDocument && (
                                            <PdfFormViewer
                                                document={activeDocument}
                                                onAnswersSubmit={(answers: Record<string, string>) => {
                                                    console.log('Form answers:', answers);
                                                    setAnsweredDocuments(prev => ({ ...prev, [activeDocument]: true }));
                                                    setAnswerDialogOpen(false);
                                                    toast.success("Form answers saved successfully");
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            // This will be triggered by the PdfFormViewer component
                        }}>
                            Save Answers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}