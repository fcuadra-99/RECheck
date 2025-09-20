"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";

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

interface Document {
    name: string;
    templateUrl: string;
    required: boolean;
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

const phases = [
    { title: "Phase 1: Manuscript Submission", statuses: ["Send Manuscript", "Check Manuscript", "Resend Manuscript"] },
    { title: "Phase 2: Risk Assessment", statuses: ["Risk Assessment"] },
    { title: "Phase 3: Forms Submission", statuses: ["Send Forms", "Forms Check", "Resend Forms"] },
    { title: "Phase 4: Deployment Queue", statuses: ["Deploy Queue"] },
];

const getNextStatus = (status: string) => {
    switch (status) {
        case "Send Manuscript": return "Check Manuscript";
        case "Check Manuscript": return "Risk Assessment";
        case "Resend Manuscript": return "Check Manuscript";
        case "Risk Assessment": return "Send Forms";
        case "Send Forms": return "Forms Check";
        case "Forms Check": return "Deploy Queue";
        case "Resend Forms": return "Forms Check";
        default: return status;
    }
};

const getActionLabel = (status: string) => {
    switch (status) {
        case "Send Manuscript": return "Submit";
        case "Check Manuscript": return "View";
        case "Resend Manuscript": return "Resubmit";
        case "Risk Assessment": return "View";
        case "Send Forms": return "Submit";
        case "Forms Check": return "View";
        case "Resend Forms": return "Resubmit";
        case "Deploy Queue": return "View";
        default: return "View";
    }
};

const getPhaseDocuments = (submission: Submission): Document[] => {
    if (["Send Manuscript", "Resend Manuscript"].includes(submission.status)) {
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.docx", required: true },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.docx", required: true },
            { name: "Updated CV", templateUrl: "/templates/cv.docx", required: true },
            { name: "All Grades", templateUrl: "/templates/grades.docx", required: true },
            submission.category === "Graduate" ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.docx", required: true } : null,
            submission.category === "External" ? { name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.docx", required: true } : null,
        ].filter(Boolean) as Document[];
    }

    if (["Send Forms", "Resend Forms"].includes(submission.status)) {
        const docs: Document[] = [
            { name: "Routing Form", templateUrl: "/templates/routing.docx", required: true },
            { name: "Ethics Checklist", templateUrl: "/templates/checklist.docx", required: true },
            { name: "Application Form", templateUrl: "/templates/application.docx", required: true },
            { name: "Study Protocol Info", templateUrl: "/templates/protocol.docx", required: true },
            { name: "Informed Consent Checklist", templateUrl: "/templates/consent_checklist.docx", required: true },
            { name: "Informed Consent Form", templateUrl: "/templates/consent_form.docx", required: true },
            { name: "Sample Informed Consent", templateUrl: "/templates/sample_consent.docx", required: false },
            { name: "Sample Assent Form", templateUrl: "/templates/sample_assent.docx", required: false },
            { name: "Sample MOA", templateUrl: "/templates/moa.docx", required: false },
            { name: "Payment Receipt", templateUrl: "/templates/payment.docx", required: true },
        ];
        if (submission.category === "Graduate") {
            docs.push({ name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.docx", required: true });
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

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});
    const [newProposalOpen, setNewProposalOpen] = useState(false);
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [newProposalDescription, setNewProposalDescription] = useState("");
    const [historyFiles, setHistoryFiles] = useState<Document[] | null>(null);
    const [latestComment, setLatestComment] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const { data: proposals, error } = await supabase.from("proposals").select("*").order("date", { ascending: false });
                if (error) throw error;
                setSubmissions(proposals || []);

                const profileIds = proposals?.map(p => p.researcher).filter(Boolean);
                if (!profileIds?.length) return setIsLoading(false);

                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, fname, lname, category")
                    .in("id", profileIds);
                if (profilesError) throw profilesError;
                setProfiles(profilesData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    const normalizeStatus = (status: string) => {
        if (status === "Resend Manuscript") return "Send Manuscript";
        if (status === "Resend Forms") return "Send Forms";
        return status;
    };

    const handleCreateProposal = async () => {
        if (!newProposalTitle.trim()) return toast.error("Title is required");

        const loading = toast.loading("Creating proposal...");
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userProfile = profiles.find(p => p.id === userData?.user?.id);
            const category = userProfile?.category || "Undergraduate";

            const { data: proposal, error } = await supabase
                .from("proposals")
                .insert([{
                    proposal_title: newProposalTitle,
                    description: newProposalDescription,
                    category,
                    status: "Send Manuscript",
                    researcher: userData?.user?.id,
                    date: new Date().toISOString(),
                }])
                .select()
                .single();

            if (error || !proposal) throw error;

            setSubmissions(prev => [proposal, ...prev]);
            setNewProposalOpen(false);
            setNewProposalTitle("");
            setNewProposalDescription("");
            toast.success("Proposal created successfully!", { id: loading });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to create proposal: " + err.message, { id: loading });
        } finally {
            toast.dismiss(loading);
        }
    };

    const handleSubmitPhase = async (submission: Submission) => {
        const docs = historyFiles || getPhaseDocuments(submission);

        const loadingToastId = toast.loading("Uploading files...");

        try {
            for (const doc of docs) {
                if (doc.required && uploadedFiles[doc.name]) {
                    const file = uploadedFiles[doc.name]!;
                    const ext = file.name.split(".").pop();
                    const safeDocName = doc.name.replace(/\s+/g, "_");
                    const path = `${submission.proposal_id}/${normalizeStatus(submission.status)}/${safeDocName}.${ext}`;

                    const { error: storageError } = await supabase.storage
                        .from("documents")
                        .upload(path, file, { upsert: true });
                    if (storageError) throw new Error(storageError.message);

                    const { error: dbError } = await supabase.from("proposal_documents").insert({
                        proposal_id: submission.proposal_id,
                        doc_type: doc.name,
                        file_path: path,
                    });
                    if (dbError) throw new Error(dbError.message);
                } else if (doc.required && !uploadedFiles[doc.name]) {
                    throw new Error(`Required file "${doc.name}" missing`);
                }
            }

            const nextStatus = getNextStatus(submission.status);
            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: nextStatus })
                .eq("proposal_id", submission.proposal_id);
            if (statusError) throw new Error(statusError.message);

            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const affectedFiles = docs.map(d => ({ name: d.name, required: d.required }));

            const { error: historyError } = await supabase
                .from("history")
                .insert({
                    history_type: "submission",
                    paper_id: submission.proposal_id,
                    comment: "Phase submitted",
                    actor: actorId,
                    affected_files: affectedFiles,
                    action: "Submit Phase",
                    history_date: new Date().toISOString(),
                });
            if (historyError) throw new Error(historyError.message);

            setUploadedFiles(prev => {
                const copy = { ...prev };
                docs.forEach(d => delete copy[d.name]);
                return copy;
            });

            setSubmissions(prev => prev.map(s => s.proposal_id === submission.proposal_id ? { ...s, status: nextStatus } : s));
            setActiveSubmission(null);
            setHistoryFiles(null);
            setLatestComment(null);
            toast.success("Phase submitted successfully", { id: loadingToastId });
        } catch (err: any) {
            console.error(err);
            toast.error(`Submission failed: ${err.message}`, { id: loadingToastId });
        }
    };


    const getActivePhaseIndex = (status: string) => phases.findIndex(p => p.statuses.includes(status));

    const handleOpenSubmission = async (submission: Submission) => {
        setActiveSubmission(submission);
        setLatestComment(null);

        if (["Resend Manuscript", "Resend Forms"].includes(submission.status)) {
            const history = await getLatestHistory(submission.proposal_id);

            let files: { name: string; required: boolean }[] = [];
            try {
                files = history?.affected_files
                    ? typeof history.affected_files === "string"
                        ? JSON.parse(history.affected_files)
                        : history.affected_files
                    : [];
            } catch (err) {
                console.error("Failed to parse affected_files:", err);
            }

            setHistoryFiles(
                files.map(f => ({
                    name: f.name,
                    required: f.required,
                    templateUrl: "/templates/unknown.docx",
                }))
            );

            console.log("Affected files for this submission:", files);

            setLatestComment(history?.comment || null);
        } else {
            setHistoryFiles(null);
            setLatestComment(null);
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[30px] font-medium">My Submissions</h1>
                <RippleButton onClick={() => setNewProposalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Proposal
                </RippleButton>
            </div>

            {/* Submissions Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Researcher</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                            : submissions.map(submission => (
                                <TableRow key={submission.proposal_id}>
                                    <TableCell>{submission.proposal_title}</TableCell>
                                    <TableCell className={submission.status.includes("Resend") ? "text-red-500 font-medium" : ""}>
                                        {submission.status}
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                        {(() => {
                                            const profile = profiles.find(pr => pr.id === submission.researcher);
                                            return profile ? `${profile.lname}, ${profile.fname}` : "Unknown";
                                        })()}
                                    </TableCell>
                                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <RippleButton
                                            variant="outline"
                                            className="w-[120px] justify-center"
                                            onClick={() => handleOpenSubmission(submission)}
                                        >
                                            {getActionLabel(submission.status)}
                                        </RippleButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            {/* Active Submission Dialog */}
            <Dialog open={!!activeSubmission} onOpenChange={() => setActiveSubmission(null)}>
                <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] p-6 flex flex-col overflow-y-auto">
                    {activeSubmission && (
                        <>
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>{activeSubmission.proposal_title}</DialogTitle>
                            </DialogHeader>

                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4 flex-shrink-0">
                                <p><strong>User:</strong> {(() => {
                                    const profile = profiles.find(pr => pr.id === activeSubmission.researcher);
                                    return profile ? `${profile.lname}, ${profile.fname}` : "Unknown";
                                })()}</p>
                                <p><strong>Category:</strong> {activeSubmission.category}</p>
                                <p><strong>Review Type:</strong> {activeSubmission.review_type || "Not Assigned"}</p>
                                <p><strong>Date:</strong> {new Date(activeSubmission.date).toLocaleDateString()}</p>
                            </div>

                            <div className="mb-4">
                                <p><strong>Description:</strong></p>
                                <p className="text-gray-700">{activeSubmission.description || "No description"}</p>
                            </div>

                            {/* Comment Section */}
                            {latestComment && (
                                <div className="mb-4 p-2 border rounded bg-gray-50">
                                    <p className="font-medium mb-1">Comment:</p>
                                    <p className="text-gray-700">{latestComment}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="flex gap-2 mb-4 flex-shrink-0">
                                {phases.map((phase, idx) => {
                                    const activeIdx = getActivePhaseIndex(activeSubmission.status);
                                    return (
                                        <div key={phase.title} className={`flex-1 p-2 rounded text-center text-sm ${idx === activeIdx ? "bg-blue-500 text-white" : idx < activeIdx ? "bg-green-500 text-white" : "bg-gray-200"
                                            }`}>{phase.title}</div>
                                    );
                                })}
                            </div>

                            {/* Document List */}
                            {["Send Manuscript", "Resend Manuscript", "Send Forms", "Resend Forms"].includes(activeSubmission.status) && (
                                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                    {(historyFiles || getPhaseDocuments(activeSubmission)).map(doc => (
                                        <div key={doc.name} className="flex justify-between items-center border p-2 rounded">
                                            <div className="w-50 pr-4">
                                                <p className="font-medium">{doc.name}</p>
                                                <p className="text-xs text-gray-500">{doc.required ? "Required" : "Optional"}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="file"
                                                    accept="application/pdf" 
                                                    onChange={(e) => {
                                                        const file = e.target.files ? e.target.files[0] : null;
                                                        if (!file) return;

                                                        if (file.type !== "application/pdf") {
                                                            toast.error("Only PDF files are allowed");
                                                            e.target.value = "";
                                                            return;
                                                        }

                                                        if (file.size > 25 * 1024 * 1024) {
                                                            toast.error("File size must be under 25MB");
                                                            e.target.value = "";
                                                            return;
                                                        }

                                                        setUploadedFiles(prev => ({ ...prev, [doc.name]: file }));
                                                    }}
                                                />
                                                <a href={doc.templateUrl} download>
                                                    <RippleButton variant="outline" size="sm">Download Template</RippleButton>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Submit Phase */}
                            {["Send Manuscript", "Resend Manuscript", "Send Forms", "Resend Forms"].includes(activeSubmission.status) && (
                                <div className="flex-shrink-0">
                                    <RippleButton
                                        onClick={() => handleSubmitPhase(activeSubmission)}
                                        disabled={!(historyFiles || getPhaseDocuments(activeSubmission)).every(doc => !doc.required || uploadedFiles[doc.name])}
                                    >
                                        Submit Phase
                                    </RippleButton>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Proposal Dialog */}
            <Dialog open={newProposalOpen} onOpenChange={setNewProposalOpen}>
                <DialogContent className="w-full sm:max-w-md md:max-w-2xl max-h-[80vh] p-6 flex flex-col">
                    <DialogHeader className="flex-shrink-0"><DialogTitle>New Proposal</DialogTitle></DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        <div>
                            <label className="block mb-1">Title</label>
                            <Input value={newProposalTitle} onChange={(e) => setNewProposalTitle(e.target.value)} placeholder="Enter proposal title" />
                        </div>
                        <div>
                            <label className="block mb-1">Description</label>
                            <Textarea value={newProposalDescription} onChange={(e) => setNewProposalDescription(e.target.value)} placeholder="Enter description" />
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0">
                        <RippleButton onClick={handleCreateProposal}>Create Proposal</RippleButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
