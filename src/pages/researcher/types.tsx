"use client";

import { useState, useEffect, useRef } from "react";
import { FileStack, Plus } from "lucide-react";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Components
import SubmissionsTable from "./components/SubmissionsTable";
import SubmissionDetails from "./components/SubmissionDetails";
import NewProposalDialog from "./components/NewProposalDialog";
import PreviewOverlay from "./components/PreviewOverlay";
import SignatureDialog from "./components/SignatureDialog";
import AnswerOverlay from "./components/AnswerOverlay";
import DeviationUploadDialog from "./components/DeviationUploadDialog";
import StudyReportDialog from "./components/StudyReportDialog";

// Types and config
import { Submission, Profile, DocumentItem, HistoryEntry } from "./types";
import { phases, phaseIcons, getNextStatus, getActionLabel, getPhaseDocuments, getLatestHistory, phaseUploadStatus } from "./config";

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
    const [deviationUploadOpen, setDeviationUploadOpen] = useState(false);
    const [studyReportOpen, setStudyReportOpen] = useState(false);
    const [deviationFiles, setDeviationFiles] = useState<File[]>([]);

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
            const idx = phases.findIndex((p: { statuses: string | any[]; }) => p.statuses.includes(activeSubmission.status));
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
            const incomplete = docs.filter((doc: { required: any; needsSignature: any; needsAnswer: any; name: string | number; }) => {
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
                const missing = incomplete.map((doc: { needsSignature: any; name: string | number; needsAnswer: any; }) => {
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

            const affectedFiles = docs.map((d: { name: any; required: any; }) => ({ name: d.name, required: d.required }));

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
                docs.forEach((d: { name: string | number; }) => delete copy[d.name]);
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

    /* Data Collection phase actions */
    const handleSendStudyReport = async () => {
        try {
            const loadingId = toast.loading("Submitting study report...");

            // Update proposal status
            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Send Study Report" })
                .eq("proposal_id", activeSubmission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            // Record in history
            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "study_report",
                paper_id: activeSubmission!.proposal_id,
                comment: "Study report submitted",
                actor: actorId,
                affected_files: [],
                action: "Submit Study Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            // Refresh data
            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            setSubmissions(refreshed || []);
            const updated = refreshed?.find((p: any) => p.proposal_id === activeSubmission!.proposal_id);
            if (updated) setActiveSubmission(updated as Submission);

            setStudyReportOpen(false);
            toast.success("Study report submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit study report: " + (err.message || err));
        }
    };

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
                    const path = `${activeSubmission!.proposal_id}/deviation_reports/${Date.now()}_${file.name}`;
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
                comment: "Deviation report files uploaded",
                actor: actorId,
                affected_files: uploadedUrls.map(url => ({ name: "Deviation Report", url })),
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

            toast.success("Deviation report submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit deviation report: " + (err.message || err), { id: loadingId });
        }
    };

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

            {/* Submissions Table */}
            <SubmissionsTable
                isLoading={isLoading}
                displayedSubmissions={displayedSubmissions}
                activeSubmission={activeSubmission}
                setActiveSubmission={setActiveSubmission}
                setNewProposalOpen={setNewProposalOpen}
                getActionLabel={getActionLabel}
            />

            {/* Submission Details */}
            <SubmissionDetails
                activeSubmission={activeSubmission}
                profiles={profiles}
                getProfileName={getProfileName}
                latestComment={latestComment}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userId={userId}
                uploadedFiles={uploadedFiles}
                signedDocuments={signedDocuments}
                answeredDocuments={answeredDocuments}
                historyFiles={historyFiles}
                handleFileSelect={handleFileSelect}
                uploadAndAdvancePhase={uploadAndAdvancePhase}
                setDeviationUploadOpen={setDeviationUploadOpen}
                setStudyReportOpen={setStudyReportOpen}
                setSignatureDialogOpen={setSignatureDialogOpen}
                setAnswerDialogOpen={setAnswerDialogOpen}
                setActiveDocument={setActiveDocument}
                openPreview={openPreview}
                listStoredFilesForPhase={listStoredFilesForPhase}
                advanceToNextPhase={advanceToNextPhase}
                phaseHasNoRequiredFiles={(phaseIndex: number, submission: Submission) => {
                    const noFilePhases = [3, 4, 5, 6];
                    if (noFilePhases.includes(phaseIndex)) {
                        const currentPhase = phases[phaseIndex];
                        if (currentPhase?.statuses.includes(submission.status)) {
                            return submission.researcher === userId;
                        }
                    }
                    return false;
                }}
            />

            {/* Dialogs and Overlays */}
            <PreviewOverlay
                previewOpen={previewOpen}
                previewTitle={previewTitle}
                previewUrl={previewUrl}
                setPreviewOpen={setPreviewOpen}
                setPreviewUrl={setPreviewUrl}
            />

            <NewProposalDialog
                newProposalOpen={newProposalOpen}
                setNewProposalOpen={setNewProposalOpen}
                newProposalTitle={newProposalTitle}
                setNewProposalTitle={setNewProposalTitle}
                newProposalDescription={newProposalDescription}
                setNewProposalDescription={setNewProposalDescription}
                handleCreateProposal={handleCreateProposal}
            />

            <SignatureDialog
                signatureDialogOpen={signatureDialogOpen}
                setSignatureDialogOpen={setSignatureDialogOpen}
                activeDocument={activeDocument}
                setSignedDocuments={setSignedDocuments}
            />

            <AnswerOverlay
                answerDialogOpen={answerDialogOpen}
                setAnswerDialogOpen={setAnswerDialogOpen}
                activeDocument={activeDocument}
                activeSubmission={activeSubmission}
                setAnsweredDocuments={setAnsweredDocuments}
            />

            <DeviationUploadDialog
                deviationUploadOpen={deviationUploadOpen}
                setDeviationUploadOpen={setDeviationUploadOpen}
                deviationFiles={deviationFiles}
                setDeviationFiles={setDeviationFiles}
                handleDeviationFileUpload={handleDeviationFileUpload}
            />

            <StudyReportDialog
                studyReportOpen={studyReportOpen}
                setStudyReportOpen={setStudyReportOpen}
                handleSendStudyReport={handleSendStudyReport}
            />
        </div>
    );
}