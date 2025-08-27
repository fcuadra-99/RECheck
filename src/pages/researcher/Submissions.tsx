"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

// Submission type matching proposals table
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

// Document type for each phase
interface Document {
    name: string;
    templateUrl: string;
    required: boolean;
}

// Define phases and their possible statuses
const phases = [
    { title: "Phase 1: Manuscript Submission", statuses: ["Send Manuscript", "Check Manuscript", "Resend Manuscript"] },
    { title: "Phase 2: Risk Assessment", statuses: ["Risk Assessment"] },
    { title: "Phase 3: Forms Submission", statuses: ["Send Forms", "Forms Check", "Resend Forms"] },
    { title: "Phase 4: Deployment Queue", statuses: ["Deploy Queue"] },
];

// Map status to progress percentage
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

// Determine next status on submission
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

// Label for action buttons
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

// Documents required for each phase
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

    // New proposal dialog state
    const [newProposalOpen, setNewProposalOpen] = useState(false);
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [newProposalDescription, setNewProposalDescription] = useState("");
    const [newProposalCategory, setNewProposalCategory] = useState<"Undergraduate" | "Graduate" | "External">("Undergraduate");

    useEffect(() => {
        const fetchSubmissions = async () => {
            const { data, error } = await supabase
                .from("proposals")
                .select("*")
                .order("date", { ascending: false }); // newest first

            if (error) console.error(error);
            else setSubmissions(data || []);
            setIsLoading(false);
        };
        fetchSubmissions();
    }, []);

    // Create new proposal
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
                    date: new Date().toISOString(),
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

    // Update status to next phase
    const handleSubmitPhase = async (submission: Submission) => {
        try {
            const nextStatus = getNextStatus(submission.status);
            const { data, error } = await supabase
                .from("proposals")
                .update({ status: nextStatus })
                .eq("proposal_id", submission.proposal_id)
                .select();

            if (error) throw error;

            setSubmissions(prev =>
                prev.map(s => s.proposal_id === submission.proposal_id ? { ...s, status: nextStatus } : s)
            );

            toast.success(`Status updated to "${nextStatus}"`);
            setActiveSubmission(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const getActivePhaseIndex = (status: string) => {
        return phases.findIndex(phase => phase.statuses.includes(status));
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[30px] font-medium">My Submissions</h1>
                <Button onClick={() => setNewProposalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Proposal
                </Button>
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
                                        <Button
                                            variant="outline"
                                            className="w-[120px] justify-center"
                                            onClick={() => setActiveSubmission(submission)}
                                        >
                                            {getActionLabel(submission.status)}
                                        </Button>
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
                            <div className="space-y-2 mb-4 flex-shrink-0">
                                <p><strong>User:</strong> {activeSubmission.researcher}</p>
                                <p><strong>Category:</strong> {activeSubmission.category}</p>
                                <p><strong>Review Type:</strong> {activeSubmission.review_type || "Not Assigned"}</p>
                                <p><strong>Description:</strong> {activeSubmission.description || "No description"}</p>
                            </div>

                            {/* Progress */}
                            <Progress value={calculateProgress(activeSubmission.status)} className="mb-4 flex-shrink-0" />

                            {/* Phases */}
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
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{doc.required ? "Required" : "Optional"}</p>
                                        </div>
                                        <a href={doc.templateUrl} download>
                                            <Button variant="outline" size="sm">Download Template</Button>
                                        </a>
                                    </div>
                                ))}
                            </div>

                            {/* Submit Button */}
                            <div className="flex-shrink-0">
                                <Button onClick={() => handleSubmitPhase(activeSubmission)}>Submit Phase</Button>
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
                        <Button onClick={handleCreateProposal}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
