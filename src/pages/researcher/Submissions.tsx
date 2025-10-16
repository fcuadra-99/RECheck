"use client";

import { FileText, Download, FileUp, Eye, PenLine, Clock, Check, RefreshCcw, Shield, ClipboardList, Rocket, FileStack, Pen, X, Users, Flag, Archive, AlertTriangle, BarChart3 } from "lucide-react";
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

interface DocumentItem {
    name: string;
    templateUrl: string;
    required: boolean;
    needsSignature?: boolean;
    needsAnswer?: boolean;
    signStatus?: 'pending' | 'completed';
    answerStatus?: 'pending' | 'completed';
    pdfFileId?: string;
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
    {
        title: "Phase 2: Risk Assessment",
        statuses: ["Risk Assessment"]
    },
    {
        title: "Phase 3: Forms Submission",
        statuses: ["Send Forms", "Forms Check", "Resend Forms"],
    },
    {
        title: "Phase 4: Deployment Queue",
        statuses: ["Deploy Queue", "Send Revision", "Check Revision", "Resend Revision"]
    },
    {
        title: "Phase 5: Documents Review",
        statuses: ["Assign Review", "Proposal Review", "Revise Proposal"],
    },
    {
        title: "Phase 6: Data Collection & Reporting",
        statuses: ["Data Collection", "Deviation Check", "Send Deviation Report", "Send Study Report", "Revise Documents", "Study Report Check"],
    },
    {
        title: "Phase 7: Final Report & Archival",
        statuses: ["Send Report", "Archive Files"],
    },
];

// icon mapping for phases
const phaseIcons = [FileText, Shield, ClipboardList, Rocket, Users, Flag, Archive];

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
        case "Data Collection":
            return "Deviation Check";
        case "Send Deviation Report":
            return "Study Report Check";
        case "Send Study Report":
            return "Study Report Check";
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
        case "Data Collection":
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

        // Payment receipt for all categories (uploadable, no signature/answers needed)
        const paymentReceipt: DocumentItem = {
            name: "Payment Receipt",
            templateUrl: "",
            required: true,
            needsSignature: false,
            needsAnswer: false,
        };

        if (isExternal) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0036_MOA for external.pdf"),
                    paymentReceipt,
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
                paymentReceipt,
            ];
        }

        if (isGrad) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_ENDORSMENT_FORM.pdf"),
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf"),
                    paymentReceipt,
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
                paymentReceipt,
            ];
        }

        // UNDERGRAD
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
                paymentReceipt,
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
            paymentReceipt,
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
    if (phaseIndex === 5) return "Data Collection"; // For Phase 6: Data Collection & Reporting
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

    // Data Collection phase dialogs
    const [deviationReportOpen, setDeviationReportOpen] = useState(false);
    const [studyReportOpen, setStudyReportOpen] = useState(false);

    const [studyReportUploadOpen, setStudyReportUploadOpen] = useState(false);
    const [studyReportFiles, setStudyReportFiles] = useState<File[]>([]);

    const [deviationType, setDeviationType] = useState<string>("");
    const [deviationFormData, setDeviationFormData] = useState<any>(null);

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

    const handleStudyReportUpload = async () => {
        if (studyReportFiles.length === 0) {
            toast.error("Please select at least one file to upload");
            return;
        }

        const loadingId = toast.loading("Uploading study report files...");

        try {
            const uploadedUrls: string[] = [];

            // Upload each file
            for (const file of studyReportFiles) {
                try {
                    const path = `${activeSubmission!.proposal_id}/study_reports/${Date.now()}_${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    // Get signed URL for the uploaded file
                    const { data: signedUrl } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry

                    if (signedUrl) {
                        uploadedUrls.push(signedUrl.signedUrl);
                    }
                } catch (uploadErr: any) {
                    console.error('File upload failed:', uploadErr);
                    throw new Error(`Failed to upload file ${file.name}: ${uploadErr.message}`);
                }
            }

            // Update proposal status to "Send Study Report" (not "Study Report Check")
            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Study Report Check" })
                .eq("proposal_id", activeSubmission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            // Record in history
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "study_report",
                paper_id: activeSubmission!.proposal_id,
                comment: "Study report files uploaded",
                actor: actorId,
                affected_files: uploadedUrls.map(url => ({ name: "Study Report", url })),
                action: "Submit Study Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            // Refresh data
            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            // Reset and close
            setStudyReportFiles([]);
            setStudyReportUploadOpen(false);

            toast.success("Study report submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit study report: " + (err.message || err), { id: loadingId });
        }
    };

    /* Data Collection phase actions */
    // const handleSendDeviationReport = async () => {
    //     try {
    //         const loadingId = toast.loading("Submitting deviation report...");

    //         // Update proposal status
    //         const { error: statusError } = await supabase
    //             .from("proposals")
    //             .update({ status: "Send Deviation Report" })
    //             .eq("proposal_id", activeSubmission!.proposal_id);

    //         if (statusError) throw new Error(statusError.message);

    //         // Record in history
    //         const { data: userData } = await supabase.auth.getUser();
    //         const actorId = userData?.user?.id || "unknown";

    //         const { error: historyError } = await supabase.from("history").insert({
    //             history_type: "deviation_report",
    //             paper_id: activeSubmission!.proposal_id,
    //             comment: "Deviation report submitted",
    //             actor: actorId,
    //             affected_files: [],
    //             action: "Submit Deviation Report",
    //             history_date: new Date().toISOString(),
    //         });

    //         if (historyError) throw new Error(historyError.message);

    //         // Refresh data
    //         const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
    //         setSubmissions(refreshed || []);
    //         const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
    //         if (updated) setActiveSubmission(updated as Submission);

    //         setDeviationReportOpen(false);
    //         toast.success("Deviation report submitted successfully", { id: loadingId });
    //     } catch (err: any) {
    //         console.error(err);
    //         toast.error("Failed to submit deviation report: " + (err.message || err));
    //     }
    // };

    // const handleSendStudyReport = async () => {
    //     try {
    //         const loadingId = toast.loading("Submitting study report...");

    //         // Update proposal status
    //         const { error: statusError } = await supabase
    //             .from("proposals")
    //             .update({ status: "Send Study Report" })
    //             .eq("proposal_id", activeSubmission!.proposal_id);

    //         if (statusError) throw new Error(statusError.message);

    //         // Record in history
    //         const { data: userData } = await supabase.auth.getUser();
    //         const actorId = userData?.user?.id || "unknown";

    //         const { error: historyError } = await supabase.from("history").insert({
    //             history_type: "study_report",
    //             paper_id: activeSubmission!.proposal_id,
    //             comment: "Study report submitted",
    //             actor: actorId,
    //             affected_files: [],
    //             action: "Submit Study Report",
    //             history_date: new Date().toISOString(),
    //         });

    //         if (historyError) throw new Error(historyError.message);

    //         // Refresh data
    //         const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
    //         setSubmissions(refreshed || []);
    //         const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
    //         if (updated) setActiveSubmission(updated as Submission);

    //         setStudyReportOpen(false);
    //         toast.success("Study report submitted successfully", { id: loadingId });
    //     } catch (err: any) {
    //         console.error(err);
    //         toast.error("Failed to submit study report: " + (err.message || err));
    //     }
    // };

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
                            <div className="w-1/3 min-h-[80px] mx-10">
                                {["Send Forms", "Resend Forms"].includes(submission.status) && !doc.needsSignature && !doc.needsAnswer ? (
                                    /* Upload area for uploadable documents (like Payment Receipt) */
                                    <label
                                        htmlFor={`file-${doc.name}`}
                                        className={cn(
                                            "w-full h-full border-2 border-dashed rounded-lg p-3 transition-colors block cursor-pointer",
                                            uploadedFiles[doc.name]
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-300 hover:border-gray-400"
                                        )}
                                    >
                                        <Input
                                            id={`file-${doc.name}`}
                                            type="file"
                                            accept={doc.name === "Payment Receipt" ? ".pdf,.png,.jpg,.jpeg" : ".pdf"}
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    // Special handling for Payment Receipt (accepts images)
                                                    if (doc.name === "Payment Receipt") {
                                                        const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
                                                        if (!allowedTypes.includes(file.type)) {
                                                            toast.error("Only PDF, PNG, and JPG files are allowed for Payment Receipt");
                                                            (e.target as HTMLInputElement).value = "";
                                                            return;
                                                        }
                                                    } else {
                                                        if (file.type !== "application/pdf") {
                                                            toast.error("Only PDF files are allowed");
                                                            (e.target as HTMLInputElement).value = "";
                                                            return;
                                                        }
                                                    }

                                                    if (file.size > 25 * 1024 * 1024) {
                                                        toast.error("File size must be under 25MB");
                                                        (e.target as HTMLInputElement).value = "";
                                                        return;
                                                    }

                                                    handleFileSelect(doc.name, file);
                                                }
                                            }}
                                        />
                                        <div className="text-center flex flex-col items-center justify-center h-full">
                                            <FileUp className="h-6 w-6 text-gray-400 mb-1" />
                                            <p className="text-xs text-gray-500 truncate max-w-full">
                                                {uploadedFiles[doc.name]
                                                    ? uploadedFiles[doc.name]?.name
                                                    : "Click to upload"}
                                            </p>
                                            {doc.name === "Payment Receipt" && (
                                                <p className="text-xs text-gray-400 mt-1">PDF, PNG, or JPG</p>
                                            )}
                                        </div>
                                    </label>
                                ) : (
                                    /* Status area for forms that need signature/answers - NO file input */
                                    <div className="w-full h-full border-2 rounded-lg p-3 bg-gray-50 cursor-default">
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

    // Add this function to handle phase advancement
    const advanceToNextPhase = async (submission: Submission) => {
        const loadingId = toast.loading("Moving to next phase...");

        try {
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id;
            if (!actorId) throw new Error("Not logged in");

            // Determine next status based on current status
            const getNextStatus = (currentStatus: string): string => {
                const statusFlow: Record<string, string> = {
                    // Phase 1
                    "Send Manuscript": "Check Manuscript",
                    "Check Manuscript": "Risk Assessment",
                    "Resend Manuscript": "Check Manuscript",

                    // Phase 2
                    "Risk Assessment": "Send Forms",

                    // Phase 3
                    "Send Forms": "Forms Check",
                    "Forms Check": "Deploy Queue",
                    "Resend Forms": "Forms Check",

                    // Phase 4
                    "Deploy Queue": "Assign Review",
                    "Send Revision": "Check Revision",
                    "Check Revision": "Assign Review",
                    "Resend Revision": "Check Revision",

                    // Phase 5
                    "Assign Review": "Proposal Review",
                    "Proposal Review": "Revise Proposal",
                    "Revise Proposal": "Assign Review",

                    // Phase 6
                    "Data Collection": "Deviation Check",
                    "Deviation Check": "Data Collection",
                    "Send Deviation Report": "Study Report Check",
                    "Send Study Report": "Study Report Check",
                    "Revise Documents": "Study Report Check",
                    "Study Report Check": "Send Report",

                    // Phase 7
                    "Send Report": "Archive Files",
                    "Archive Files": "Archive Files",
                };
                return statusFlow[currentStatus] || currentStatus;
            };

            const nextStatus = getNextStatus(submission.status);

            // Update proposal status
            const { error: statusError } = await supabase
                .from("proposals")
                .update({
                    status: nextStatus,
                    updated_on: new Date().toISOString()
                })
                .eq("proposal_id", submission.proposal_id);

            if (statusError) throw new Error(statusError.message);

            // Record in history
            const { error: historyError } = await supabase.from("history").insert({
                history_type: "phase_advance",
                paper_id: submission.proposal_id,
                comment: `Advanced from ${submission.status} to ${nextStatus}`,
                actor: actorId,
                affected_files: JSON.stringify([]),
                action: "Advance Phase",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            // Refresh data
            const { data: refreshed } = await supabase
                .from("proposals")
                .select("*")
                .order("date", { ascending: false });

            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === submission.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            toast.success(`Moved to ${nextStatus}`, { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to advance phase: " + (err.message || err), { id: loadingId });
        }
    };

    // Add this helper to check if phase has no required files
    const phaseHasNoRequiredFiles = (phaseIndex: number, submission: Submission): boolean => {
        // Phases 4, 5, 6, 7 have no required files based on your JSON
        const noFilePhases = [3, 4, 5, 6]; // Index 3 = Phase 4, etc.

        // Also check if current status in these phases and user is the actor
        if (noFilePhases.includes(phaseIndex)) {
            const currentPhase = phases[phaseIndex];
            if (currentPhase?.statuses.includes(submission.status)) {
                // Check if current user is the actor for this status
                const statusConfig = currentPhase.statuses.find(s => s === submission.status);
                // You would need to get actor from your phase configuration
                // For now, assuming researcher can advance their own phases
                return submission.researcher === userId;
            }
        }
        return false;
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

    }, [activeSubmission?.proposal_id]);

    // Helper: map submission status to active phase index
    const getActivePhaseIndex = (status: string) => {
        const phaseMap: Record<string, number> = {
            // Phase 1
            "Send Manuscript": 0,
            "Check Manuscript": 0,
            "Resend Manuscript": 0,

            // Phase 2
            "Risk Assessment": 1,

            // Phase 3
            "Send Forms": 2,
            "Forms Check": 2,
            "Resend Forms": 2,

            // Phase 4
            "Deploy Queue": 3,
            "Send Revision": 3,
            "Check Revision": 3,
            "Resend Revision": 3,

            // Phase 5
            "Assign Review": 4,
            "Proposal Review": 4,
            "Revise Proposal": 4,

            // Phase 6
            "Data Collection": 5,
            "Deviation Check": 5,
            "Send Deviation Report": 5,
            "Send Study Report": 5,
            "Revise Documents": 5,
            "Study Report Check": 5,

            // Phase 7
            "Send Report": 6,
            "Archive Files": 6,
        };
        return phaseMap[status] ?? 0;
    };

    const [deviationFiles, setDeviationFiles] = useState<File[]>([]);
    const [deviationUploadOpen, setDeviationUploadOpen] = useState(false);

    const handleDeviationFileUpload = async () => {
        if (deviationFiles.length === 0) {
            toast.error("Please select at least one file to upload");
            return;
        }

        const loadingId = toast.loading("Uploading deviation report files...");

        try {
            const uploadedUrls: string[] = [];

            // Upload each file
            for (const file of deviationFiles) {
                try {
                    const path = `${activeSubmission!.proposal_id}/deviation_reports/${deviationType}/${Date.now()}_${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    // Get signed URL for the uploaded file
                    const { data: signedUrl } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry

                    if (signedUrl) {
                        uploadedUrls.push(signedUrl.signedUrl);
                    }
                } catch (uploadErr: any) {
                    console.error('File upload failed:', uploadErr);
                    throw new Error(`Failed to upload file ${file.name}: ${uploadErr.message}`);
                }
            }

            // Update proposal status to "Deviation Check"
            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Deviation Check" })
                .eq("proposal_id", activeSubmission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            // Record in history
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "deviation_report",
                paper_id: activeSubmission!.proposal_id,
                comment: `${deviationType} deviation report submitted`,
                actor: actorId,
                affected_files: uploadedUrls.map(url => ({ name: `${deviationType} Deviation Report`, url })),
                action: "Submit Deviation Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            // Refresh data
            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            // Reset and close
            setDeviationFiles([]);
            setDeviationUploadOpen(false);
            setDeviationType("");

            toast.success(`${deviationType} deviation report submitted successfully`, { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit deviation report: " + (err.message || err), { id: loadingId });
        }
    };

    /* Data Collection Phase Action Buttons */
    // Update the Data Collection phase actions in your main component
    /* Data Collection Phase Action Buttons */
    const renderDataCollectionActions = () => {
        return (
            <div className="space-y-6">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Collection Phase</h3>
                    <p className="text-gray-600">Choose the appropriate action based on your study progress</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deviation Report Button */}
                    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Report Deviation</h4>
                            <p className="text-sm text-gray-600 mb-4 flex-1">
                                Report any unexpected events or changes from the approved study protocol.
                            </p>

                            {/* Deviation Type Selection */}
                            <div className="w-full mb-4">
                                <Label htmlFor="deviation-type" className="text-sm font-medium text-gray-700 mb-2 block">
                                    Select Deviation Type
                                </Label>
                                <select
                                    id="deviation-type"
                                    value={deviationType}
                                    onChange={(e) => setDeviationType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="">Choose deviation type</option>
                                    <option value="Informed Consent">Informed Consent</option>
                                    <option value="Adverse Events">Adverse Events</option>
                                    <option value="Sample Collection">Sample Collection</option>
                                    <option value="Confidentiality Breach">Confidentiality Breach</option>
                                    <option value="Regulatory Compliance">Regulatory Compliance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 w-full mt-auto">
                                <RippleButton
                                    onClick={() => {
                                        if (!deviationType) {
                                            toast.error("Please select a deviation type");
                                            return;
                                        }
                                        // ALL deviation types now use file upload
                                        setDeviationUploadOpen(true);
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    disabled={!deviationType}
                                >
                                    Upload Deviation Report
                                </RippleButton>

                                {deviationType && (
                                    <p className="text-xs text-gray-500">
                                        Upload files for {deviationType} deviation
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Study Report Button */}
                    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <BarChart3 className="h-6 w-6 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Submit Study Report</h4>
                            <p className="text-sm text-gray-600 mb-4 flex-1">
                                Submit your completed study report with findings, analysis, and conclusions.
                            </p>

                            <div className="flex flex-col gap-2 w-full mt-auto">
                                <RippleButton
                                    onClick={() => setStudyReportUploadOpen(true)}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    Upload Study Report
                                </RippleButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Add a function to handle deviation form completion
    const handleDeviationFormComplete = async (deviationData: any) => {
        try {
            const loadingId = toast.loading("Submitting deviation report...");

            // Update proposal status to "Deviation Check"
            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Deviation Check" })
                .eq("proposal_id", activeSubmission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            // Record in history
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "deviation_report",
                paper_id: activeSubmission!.proposal_id,
                comment: `Deviation report submitted: ${deviationData.type}`,
                actor: actorId,
                affected_files: deviationData.supportingDocuments || [],
                action: "Submit Deviation Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            // Refresh data
            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            toast.success("Deviation report submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit deviation report: " + (err.message || err));
        }
    };

    // If you want to integrate the form directly, you can add a state for it:
    const [showDeviationForm, setShowDeviationForm] = useState(false);

    // And then conditionally render the form:
    {
        showDeviationForm && (
            <div className="fixed inset-0 bg-background z-50 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="font-semibold text-lg">Deviation Report Form</div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeviationForm(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 relative overflow-auto">
                    {/* You would integrate the DeviationReportForm component here */}
                    {/* <DeviationReportForm 
                onComplete={handleDeviationFormComplete}
                onCancel={() => setShowDeviationForm(false)}
            /> */}
                    <div className="p-4">
                        <p>Deviation form would be integrated here with all the fields from the provided code.</p>
                        {/* Integration points for the form fields identified above */}
                    </div>
                </div>
            </div>
        )
    }

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
                            <TableHead className="border min-w-[100px]">Review Type</TableHead>
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
                                                    submission.status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300",
                                                    submission.status === "Data Collection" && "bg-blue-50 text-blue-700 border-blue-300"
                                                )}
                                            >
                                                {submission.status.includes("Resend") && <RefreshCcw className="w-3 h-3 mr-1" />}
                                                {submission.status.includes("Check") && <Clock className="w-3 h-3 mr-1" />}
                                                {submission.status === "Deploy Queue" && <Check className="w-3 h-3 mr-1" />}
                                                {submission.status === "Data Collection" && <BarChart3 className="w-3 h-3 mr-1" />}
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
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-300" />
                                                <span>Available Slot</span>
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
                                    {activeSubmission.review_type && (
                                        <> • <span className="text-muted-foreground">{activeSubmission.review_type} Review</span></>
                                    )}
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
                                            activeSubmission.status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300",
                                            activeSubmission.status === "Data Collection" && "bg-blue-50 text-blue-700 border-blue-300"
                                        )}
                                    >
                                        {activeSubmission.status.includes("Resend") && <RefreshCcw className="w-3 h-3" />}
                                        {activeSubmission.status.includes("Check") && <Clock className="w-3 h-3" />}
                                        {activeSubmission.status === "Deploy Queue" && <Check className="w-3 h-3" />}
                                        {activeSubmission.status === "Data Collection" && <BarChart3 className="w-3 h-3" />}
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
                                                        {/* Data Collection Phase - Show Action Buttons */}
                                                        {idx === 5 && activeSubmission.status === "Data Collection" ? (
                                                            renderDataCollectionActions()
                                                        ) : (
                                                            <>
                                                                <div className="mb-2 text-sm text-gray-600">Upload required documents for this phase.</div>
                                                                {renderPhaseFilesForActive(activeSubmission)}
                                                            </>
                                                        )}
                                                    </>
                                                ) : phaseHasNoRequiredFiles(idx, activeSubmission) ? (
                                                    // Show "Move to Next Phase" button for phases with no required files
                                                    <div className="text-center py-6">
                                                        <div className="text-sm text-gray-600 mb-4">
                                                            No files required for this phase. Ready to proceed?
                                                        </div>
                                                        <RippleButton
                                                            onClick={() => advanceToNextPhase(activeSubmission)}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            Move to Next Phase
                                                        </RippleButton>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">No files required for this phase.</div>
                                                )}
                                            </>
                                        )}

                                        {isFuture && <div className="text-gray-500">This phase is not yet available.</div>}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>

                    </>
                )}
            </div>

            {/* Rest of the component remains the same (preview, dialogs, etc.) */}
            {/* Full screen preview overlay */}
            {previewOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
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

            {/* Answer overlay (full screen) */}
            {answerDialogOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="font-semibold text-lg">Answer Form - {activeDocument}</div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setAnswerDialogOpen(false);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 relative">
                        {activeDocument && activeSubmission ? (
                            <PdfFormViewer
                                document={activeDocument}
                                onAnswersSubmit={(answers: Record<string, string>) => {
                                    console.log('Form answers:', answers);
                                    setAnsweredDocuments(prev => ({ ...prev, [activeDocument]: true }));
                                    setAnswerDialogOpen(false);
                                }}
                                proposalId={activeSubmission.proposal_id}
                                status={activeSubmission.status}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gray-500">No document selected</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Study Report Upload Dialog */}
            <Dialog open={studyReportUploadOpen} onOpenChange={setStudyReportUploadOpen}>
                <DialogContent className="w-full max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            Upload Study Report
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                            <p>Please upload your completed study report and all supporting documents.</p>
                            <p className="mt-2 text-amber-600">
                                <strong>Note:</strong> This will advance your proposal to the "Study Report Check" phase for review.
                            </p>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                            <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-3">Drag & drop PDF files here, or click to browse</p>
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files);

                                        // Validate files
                                        const validFiles = newFiles.filter(file => {
                                            if (file.type !== "application/pdf") {
                                                toast.error(`Only PDF files are allowed. ${file.name} is not a PDF.`);
                                                return false;
                                            }
                                            if (file.size > 25 * 1024 * 1024) {
                                                toast.error(`File size must be under 25MB. ${file.name} is too large.`);
                                                return false;
                                            }
                                            return true;
                                        });

                                        setStudyReportFiles(prev => [...prev, ...validFiles]);
                                    }
                                }}
                                className="max-w-xs mx-auto overflow-clip"
                                accept=".pdf"
                            />
                        </div>

                        {/* File Requirements */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <h4 className="font-medium text-green-800">File Requirements</h4>
                                    <ul className="text-green-700 mt-1 list-disc list-inside space-y-1">
                                        <li>Only PDF files are accepted</li>
                                        <li>Maximum file size: 25MB per file</li>
                                        <li>Include main study report and all appendices</li>
                                        <li>Ensure all files are properly labeled</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setStudyReportFiles([]);
                            setStudyReportUploadOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStudyReportUpload}
                            disabled={studyReportFiles.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Submit Study Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deviationUploadOpen} onOpenChange={setDeviationUploadOpen}>
                <DialogContent className="w-full max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Upload Deviation Report
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                            <p>Please upload all relevant files for your protocol deviation report.</p>
                            <p className="mt-2 text-amber-600">
                                <strong>Note:</strong> This will advance your proposal to the "Deviation Check" phase for review.
                            </p>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-3">Drag & drop files here, or click to browse</p>
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files);
                                        setDeviationFiles(prev => [...prev, ...newFiles]);
                                    }
                                }}
                                className="max-w-xs mx-auto"
                                accept=".pdf"
                            />
                        </div>

                        {/* File Requirements */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <h4 className="font-medium text-blue-800">File Requirements</h4>
                                    <ul className="text-blue-700 mt-1 list-disc list-inside space-y-1">
                                        <li>Accepted formats: PDF, Word, Excel, Images</li>
                                        <li>Maximum file size: 25MB per file</li>
                                        <li>Include all relevant supporting documents</li>
                                        <li>Ensure files are properly labeled and organized</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setDeviationFiles([]);
                            setDeviationUploadOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeviationFileUpload}
                            disabled={deviationFiles.length === 0}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Submit Deviation Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}