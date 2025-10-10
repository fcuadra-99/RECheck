"use client";

import { FileText, Download, FileUp, Eye, PenLine, Clock, Check, RefreshCcw, Shield, ClipboardList, Rocket, FileStack, Pen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
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

interface DocumentItem {
    name: string;
    templateUrl: string;
    required: boolean;
    needsSignature?: boolean;  // Can need both signature and answers
    needsAnswer?: boolean;
    signStatus?: 'pending' | 'completed';
    answerStatus?: 'pending' | 'completed';
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
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.pdf", required: true, needsSignature: true },
            { name: "Updated CV", templateUrl: "/templates/cv.pdf", required: true },
            { name: "All Grades", templateUrl: "/templates/grades.pdf", required: true, needsAnswer: true },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: true }
                : null,
            submission.category === "External"
                ? { name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.pdf", required: true, needsSignature: true }
                : null,
        ].filter(Boolean) as DocumentItem[];
    }

    if (["Send Forms", "Resend Forms"].includes(submission.status)) {
        const docs: DocumentItem[] = [
            { name: "REC_FO_0032_EthicsProtocolChecklist", templateUrl: "/REC_FO_0032_EthicsProtocolChecklist.pdf", required: true, needsSignature: true, needsAnswer: true },
            { name: "Ethics Checklist", templateUrl: "/templates/checklist.pdf", required: true, needsAnswer: true },
            { name: "Application Form", templateUrl: "/templates/application.pdf", required: true },
            { name: "Study Protocol Info", templateUrl: "/templates/protocol.pdf", required: true },
            { name: "Informed Consent Checklist", templateUrl: "/templates/consent_checklist.pdf", required: true, needsAnswer: true },
            { name: "Informed Consent Form", templateUrl: "/templates/consent_form.pdf", required: true },
            { name: "Sample Informed Consent", templateUrl: "/templates/sample_consent.pdf", required: false },
            { name: "Sample Assent Form", templateUrl: "/templates/sample_assent.pdf", required: false },
            { name: "Sample MOA", templateUrl: "/templates/moa.pdf", required: false },
            { name: "Payment Receipt", templateUrl: "/templates/payment.pdf", required: true },
        ];
        if (submission.category === "Graduate") {
            docs.push({ name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.pdf", required: true, needsSignature: true });
        }
        return docs;
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

    /* upload & advance phase (full implementation) */
    const uploadAndAdvancePhase = async (submission: Submission) => {
        const docs = historyFiles || getPhaseDocuments(submission);
        const loadingId = toast.loading("Uploading files...");

        try {
            for (const doc of docs) {
                if (doc.required && uploadedFiles[doc.name]) {
                    const file = uploadedFiles[doc.name]!;
                    const ext = (file.name.split(".").pop() || "pdf").replace(/[^a-z0-9]/gi, "");
                    const safeDocName = doc.name.replace(/\s+/g, "_");
                    const path = `${submission.proposal_id}/${normalizeStatus(submission.status)}/${safeDocName}.${ext}`;

                    const { error: storageError } = await supabase.storage.from("documents").upload(path, file as unknown as Blob, { upsert: true });
                    if (storageError) throw new Error(storageError.message);

                    const { error: dbError } = await supabase.from("proposal_documents").insert({
                        proposal_id: submission.proposal_id,
                        doc_type: doc.name,
                        file_path: path,
                    });
                    if (dbError) throw new Error(dbError.message);
                } else if (doc.required && !uploadedFiles[doc.name] && !doc.needsSignature && !doc.needsAnswer) {
                    throw new Error(`Required file "${doc.name}" missing`);
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

                            {/* Upload Area - Middle */}
                            <div className="w-full lg:w-48 flex-shrink-0">
                                <div className="relative">
                                    <div
                                        className={cn(
                                            "relative w-full min-h-[80px] border-2 border-dashed rounded-lg p-3 transition-colors cursor-pointer",
                                            uploadedFiles[doc.name]
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-300 hover:border-gray-400"
                                        )}
                                        onClick={() => document.getElementById(`file-${doc.name}`)?.click()}
                                    >
                                        <Input
                                            id={`file-${doc.name}`}
                                            type="file"
                                            accept="application/pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                            if (d.needsSignature) return signedDocuments[d.name];
                            if (d.needsAnswer) return answeredDocuments[d.name];
                            return uploadedFiles[d.name];
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

            {/* Preview dialog (iframe) */}
            <Dialog open={previewOpen} onOpenChange={(open) => {
                if (!open) setPreviewUrl(null);
                setPreviewOpen(open);
            }}>
                <DialogContent className="w-full max-w-5xl h-[80vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{previewTitle}</DialogTitle>
                    </DialogHeader>

                    {/* Main iframe container */}
                    <div className="flex-1 overflow-hidden mt-2">
                        {previewUrl ? (
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border rounded"
                                title={previewTitle}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-gray-500">Loading preview...</div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-shrink-0 mt-2">
                        <Button
                            onClick={() => { setPreviewOpen(false); setPreviewUrl(null); }}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                <DialogContent className="w-full max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Answer Questions - {activeDocument}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                            Please review and answer the questions for {activeDocument}.
                        </div>
                        <div className="h-[200px] flex items-center justify-center border rounded text-gray-500">
                            Question form for {activeDocument}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (activeDocument) {
                                setAnsweredDocuments(prev => ({ ...prev, [activeDocument]: true }));
                                setAnswerDialogOpen(false);
                                toast.success("Questions answered successfully");
                            }
                        }}>
                            Submit Answers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}