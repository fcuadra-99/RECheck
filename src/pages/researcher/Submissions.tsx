"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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

interface Document {
    name: string;
    templateUrl: string;
    required: boolean;
}

const phases = [
    { title: "Phase 1: Manuscript Submission", statuses: ["Send Manuscript", "Check Manuscript", "Resend Manuscript"] },
    { title: "Phase 2: Risk Assessment", statuses: ["Risk Assessment"] },
    { title: "Phase 3: Forms Submission", statuses: ["Send Forms", "Forms Check", "Resend Forms"] },
    { title: "Phase 4: Deployment Queue", statuses: ["Deploy Queue"] },
];

const calculateProgress = (status: string): number => {
    switch (status) {
        case "Send Manuscript": return 10;
        case "Check Manuscript":
        case "Resend Manuscript": return 25;
        case "Risk Assessment": return 40;
        case "Send Forms": return 55;
        case "Forms Check":
        case "Resend Forms": return 70;
        case "Deploy Queue": return 100;
        default: return 0;
    }
};

const getNextStatus = (status: string): string => {
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

const getActionLabel = (status: string): string => {
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

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

    const [newProposalOpen, setNewProposalOpen] = useState(false);
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [newProposalDescription, setNewProposalDescription] = useState("");
    const [newProposalCategory, setNewProposalCategory] = useState<"Undergraduate" | "Graduate" | "External">("Undergraduate");

    useEffect(() => {
        const fetchSubmissions = async () => {
            const { data, error } = await supabase
                .from("proposals")
                .select("*")
                .order("date", { ascending: false });

            if (error) console.error(error);
            else setSubmissions(data || []);
            setIsLoading(false);
        };
        fetchSubmissions();
    }, []);

    const handleCreateProposal = async () => {
        if (!newProposalTitle.trim()) {
            toast.error("Title is required");
            return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("proposals")
            .insert([
                {
                    proposal_title: newProposalTitle,
                    description: newProposalDescription,
                    category: newProposalCategory,
                    status: "Send Manuscript",
                    date: supabase.rpc('now'),
                    researcher: userData?.user?.id,
                },
            ])
            .select()
            .single();

        if (error) {
            toast.error("Failed to create proposal");
            return;
        }

        setSubmissions([data, ...submissions]);
        toast.success("New proposal created!");
        setNewProposalTitle("");
        setNewProposalDescription("");
        setNewProposalCategory("Undergraduate");
        setNewProposalOpen(false);
    };

    function normalizeStatus(status: string) {
        if (status == "Resend Manuscript") return "Send Manuscript";
        if (status == "Resend Forms") return "Send Forms";
        return status;
    }

    const handleSubmit = async (submission: Submission) => {
        const docs = getPhaseDocuments(submission);
        const {} = await supabase.auth.getUser();

        try {
            if (submission.status === "Resend Manuscript" || submission.status === "Resend Forms") {
                
            }
            toast.loading("Uploading files...", { id: "upload" });

            for (const doc of docs) {
                if (doc.required && uploadedFiles[doc.name]) {
                    const file = uploadedFiles[doc.name]!;
                    const path = `${submission.proposal_id}/${normalizeStatus(submission.status)}/${file.name}`;

                    const { error: storageError } = await supabase.storage
                        .from("documents")
                        .upload(path, file, { upsert: true });
                    if (storageError) throw new Error(`Failed to upload "${doc.name}": ${storageError.message}`);

                    const { error: dbError } = await supabase
                        .from("proposal_documents")
                        .insert({
                            proposal_id: submission.proposal_id,
                            doc_type: doc.name,
                            file_path: path,
                        })
                        .select();

                    if (dbError) throw new Error(`Failed to record "${doc.name}" in database: ${dbError.message}`);
                } else if (doc.required && !uploadedFiles[doc.name]) {
                    throw new Error(`Required file "${doc.name}" has not been uploaded.`);
                }
            }

            const nextStatus = getNextStatus(submission.status);
            const { error: statusError } = await supabase
                .from("proposals")
                .update({
                    status: nextStatus,
                })
                .eq("proposal_id", submission.proposal_id)
                .select();

            if (statusError) throw new Error(`Failed to update submission status: ${statusError.message}`);

            const keysToClear = docs.map(d => d.name);
            setUploadedFiles(prev => {
                const copy = { ...prev };
                keysToClear.forEach(k => delete copy[k]);
                return copy;
            });

            setSubmissions(prev =>
                prev.map(s => s.proposal_id === submission.proposal_id ? { ...s, status: nextStatus } : s)
            );
            toast.success("Phase submitted successfully", { id: "upload" });
            setActiveSubmission(null);

        } catch (err: any) {
            console.error("Submit Phase Error:", err);
            toast.error(`Submission failed: ${err.message}`, { id: "upload" });
        }
    };

    const getActivePhaseIndex = (status: string) => {
        return phases.findIndex(phase => phase.statuses.includes(status));
    };

    const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});

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
                            <TableHead>Progress</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            submissions.map(submission => (
                                <TableRow key={submission.proposal_id}>
                                    <TableCell>{submission.proposal_title}</TableCell>
                                    <TableCell className={submission.status.includes("Resend") ? "text-red-500 font-medium" : ""}>
                                        {submission.status}
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                        <Progress
                                            value={calculateProgress(submission.status)}
                                            className={`bg-gray-200 ${submission.status.includes("Resend") ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <RippleButton
                                            variant="outline"
                                            className="w-[120px] justify-center"
                                            onClick={() => setActiveSubmission(submission)}
                                        >
                                            {getActionLabel(submission.status)}
                                        </RippleButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Active Submission Dialog */}
            <Dialog open={!!activeSubmission} onOpenChange={() => setActiveSubmission(null)}>
                <DialogContent className="w-full sm:max-w-md md:max-w-2xl max-h-[80vh] p-6 flex flex-col">
                    {activeSubmission && (
                        <>
                            {/* Header */}
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>{activeSubmission.proposal_title}</DialogTitle>
                            </DialogHeader>

                            {/* Submission Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4 flex-shrink-0">
                                <p><strong>User:</strong> {activeSubmission.researcher}</p>
                                <p><strong>Category:</strong> {activeSubmission.category}</p>
                                <p><strong>Review Type:</strong> {activeSubmission.review_type || "Not Assigned"}</p>
                                <p><strong>Date:</strong> {new Date(activeSubmission.date).toLocaleDateString()}</p>
                            </div>
                            <div className="mb-4">
                                <p><strong>Description:</strong></p>
                                <p className="text-gray-700">{activeSubmission.description || "No description"}</p>
                            </div>

                            {/* Progress */}
                            <Progress value={calculateProgress(activeSubmission.status)} className="mb-4 flex-shrink-0" />

                            {/* Phases Timeline */}
                            <div className="flex gap-2 mb-4 flex-shrink-0">
                                {phases.map((phase, idx) => {
                                    const activeIdx = getActivePhaseIndex(activeSubmission.status);
                                    return (
                                        <div
                                            key={phase.title}
                                            className={`flex-1 p-2 rounded text-center text-sm ${idx === activeIdx
                                                ? "bg-blue-500 text-white"
                                                : idx < activeIdx
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-200"
                                                }`}
                                        >
                                            {phase.title}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Document list scrollable */}
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                {getPhaseDocuments(activeSubmission).map(doc => (
                                    <div key={doc.name} className="flex justify-between items-center border p-2 rounded">
                                        <div className="w-50 pr-4">
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{doc.required ? "Required" : "Optional"}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="file"
                                                onChange={(e) => {
                                                    setUploadedFiles(prev => ({
                                                        ...prev,
                                                        [doc.name]: e.target.files ? e.target.files[0] : null
                                                    }));
                                                }}
                                            />
                                            <a href={doc.templateUrl} download>
                                                <RippleButton variant="outline" size="sm">Download Template</RippleButton>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Submit Button (Phase 1 & 3 only) */}
                            <div className="flex-shrink-0">
                                {["Send Manuscript", "Resend Manuscript", "Send Forms", "Resend Forms"].includes(activeSubmission.status) && (
                                    <RippleButton
                                        onClick={() => handleSubmit(activeSubmission)}
                                        disabled={
                                            !getPhaseDocuments(activeSubmission).every(
                                                doc => !doc.required || uploadedFiles[doc.name]
                                            )
                                        }
                                    >
                                        Submit Phase
                                    </RippleButton>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>



            {/* New Proposal Dialog */}
            <Dialog open={newProposalOpen} onOpenChange={setNewProposalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Proposal</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1">Title</label>
                            <Input
                                value={newProposalTitle}
                                onChange={(e) => setNewProposalTitle(e.target.value)}
                                placeholder="Enter proposal title"
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Description</label>
                            <Textarea
                                value={newProposalDescription}
                                onChange={(e) => setNewProposalDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Category</label>
                            <Select value={newProposalCategory} onValueChange={(val) => setNewProposalCategory(val as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                    <SelectItem value="External">External</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <RippleButton onClick={handleCreateProposal}>Create</RippleButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
