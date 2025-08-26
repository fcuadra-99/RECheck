import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/DB";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Submission {
    id: string;
    proposal_title: string;
    description?: string;
    status: string; // workflow step
    review_type: "Exempt" | "Full Board" | "Expedited" | null; // assigned by staff later
    date: string;
    researcher: string;
    student_type: "Undergraduate" | "Graduate" | "External";
}

interface Document {
    name: string;
    templateUrl: string;
    required: boolean;
    uploadedFile?: File;
}

const phases = [
    { title: "Phase 1: Manuscript", key: "phase1", description: "Preparation and initial submission of documents to the REC." },
    { title: "Phase 2: Risk Assessment", key: "phase2", description: "REC reviews initial submission and assigns review type." },
    { title: "Phase 3: Final Package", key: "phase3", description: "Researcher submits completed forms and supporting documents." },
    { title: "Phase 4: Deployment Queue", key: "phase4", description: "Waiting period while REC reviews the complete package." },
];

const RSubmissionsPage = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCategory, setNewCategory] = useState<"Undergraduate" | "Graduate" | "External">("Undergraduate");

    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

    useEffect(() => {
        if (!hasFetched.current) {
            setIsLoading(true);
            hasFetched.current = true;
            fetchSubmissions();
        }
    }, []);

    const fetchSubmissions = async () => {
        const loadingToast = toast.loading("Loading submissions...");
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("proposals")
                .select("*")
                .eq("researcher", user?.id)
                .order("date", { ascending: false });

            if (error) throw error;
            if (data) setSubmissions(data as Submission[]);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load submissions");
        } finally {
            toast.dismiss(loadingToast);
            setIsLoading(false);
        }
    };

    const handleCreateProposal = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const newSubmission: Partial<Submission> = {
                proposal_title: newTitle || "Untitled Proposal",
                description: newDescription,
                status: "Send Manuscript",  
                review_type: null,          
                date: new Date().toISOString(),
                researcher: user?.id,
                student_type: newCategory,
            };

            const { data, error } = await supabase
                .from("proposals")
                .insert([newSubmission])
                .select();

            if (error) throw error;
            setSubmissions((prev) => [data[0] as Submission, ...prev]);
            toast.success("Proposal created!");
            setIsDialogOpen(false);
            setNewTitle("");
            setNewDescription("");
            setNewCategory("Undergraduate");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create proposal");
        }
    };

    const getActionLabel = (status: string) => {
        switch (status) {
            case "Send Manuscript":
            case "Send Forms":
                return "Submit";
            case "Resend Manuscript":
            case "Resend Forms":
                return "Resubmit";
            default:
                return "View";
        }
    };

    const calculateProgress = (status: string) => {
        const stageMap: { [key: string]: string } = {
            "Send Manuscript": "Manuscript Check",
            "Manuscript Check": "Manuscript Check",
            "Resend Manuscript": "Manuscript Check",
            "Risk Assessment": "Risk Assessment",
            "Send Forms": "Forms Check",
            "Forms Check": "Forms Check",
            "Resend Forms": "Forms Check",
            "Deploy Queue": "Deploy Queue",
        };

        const normalized = stageMap[status] || status;

        const stages = ["Manuscript Check", "Risk Assessment", "Forms Check", "Deploy Queue"];
        const index = stages.indexOf(normalized);

        // Fraction of workflow completed
        return ((index + 1) / stages.length) * 100;
    };


    const getPhaseDocuments = (submission: Submission) => {
        switch (submission.status) {
            case "Send Manuscript":
            case "Resend Manuscript":
                return [
                    { name: "Revised Manuscript", templateUrl: "/templates/manuscript.docx", required: true },
                    { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.docx", required: true },
                    { name: "Updated CV", templateUrl: "/templates/cv.docx", required: true },
                    { name: "All Grades", templateUrl: "/templates/grades.docx", required: true },
                    submission.student_type === "Graduate" ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.docx", required: true } : null,
                    submission.student_type === "External" ? { name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.docx", required: true } : null,
                ].filter(Boolean) as Document[];

            case "Send Forms":
            case "Resend Forms":
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
                if (submission.student_type === "Graduate") {
                    docs.push({ name: "Ethics Endorsement Form", templateUrl: "/templates/ethics.docx", required: true });
                }
                return docs;
            default:
                return [];
        }
    };

    const getActivePhaseIndex = (status: string) => {
        switch (status) {
            case "Send Manuscript":
            case "Manuscript Check":
            case "Resend Manuscript":
                return 0;
            case "Risk Assessment":
                return 1;
            case "Send Forms":
            case "Forms Check":
            case "Resend Forms":
                return 2;
            case "Deploy Queue":
                return 3;
            default:
                return 0;
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-[30px] font-medium mb-4">My Submissions</h1>

            {/* Timeline / Progress Visualization */}
            {submissions[0] && (
                <div className="mb-8">
                    {phases.map((phase, idx) => {
                        const activeIndex = getActivePhaseIndex(submissions[0].status);
                        const isCompleted = idx < activeIndex;
                        const isActive = idx === activeIndex;

                        return (
                            <div key={phase.key} className="flex items-center mb-2">
                                <div className={`w-6 h-6 rounded-full border-2 ${isCompleted ? "bg-blue-500 border-blue-500" : isActive ? "bg-blue-300 border-blue-500" : "bg-white border-gray-300"} flex items-center justify-center text-white`}>
                                    {idx + 1}
                                </div>
                                <div className="ml-4">
                                    <div className="font-medium">{phase.title}</div>
                                    <div className="text-sm text-gray-500">{phase.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Proposal Button */}
            <div className="flex justify-end mb-6">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> New Proposal
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Proposal</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <Input value={newTitle} placeholder="Title" onChange={e => setNewTitle(e.target.value)} />
                            <Textarea value={newDescription} placeholder="Description" onChange={e => setNewDescription(e.target.value)} />
                            <Select value={newCategory} onValueChange={value => setNewCategory(value as any)}>
                                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                    <SelectItem value="External">External</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleCreateProposal}>Create Proposal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="border"><Skeleton className="h-4 w-[250px]" /></TableCell>
                                    <TableCell className="border"><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell className="border w-[200px]"><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell className="border"><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell className="border"><Skeleton className="h-9 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            submissions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="border">{sub.proposal_title}</TableCell>
                                    <TableCell className={`border ${sub.status.includes("Resend") ? "text-red-500 font-medium" : ""}`}>{sub.status}</TableCell>
                                    <TableCell className="border w-[200px]">
                                        <Progress value={calculateProgress(sub.status)} className={sub.status.includes("Resend") ? "bg-gray-200 [&>div]:bg-red-500" : "bg-gray-200 [&>div]:bg-blue-500"} />
                                    </TableCell>
                                    <TableCell className="border">{new Date(sub.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="border">
                                        <Button variant="outline" className="w-[120px]" onClick={() => setActiveSubmission(sub)}>
                                            {getActionLabel(sub.status)}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Active Submission Dialog */}
            {activeSubmission && (
                <Dialog open={!!activeSubmission} onOpenChange={() => setActiveSubmission(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{activeSubmission.proposal_title}</DialogTitle>
                        </DialogHeader>

                        <div className="mb-4 grid gap-2 text-sm text-gray-700">
                            <div><span className="font-medium">Researcher:</span> {activeSubmission.researcher}</div>
                            <div><span className="font-medium">Review Type:</span> {activeSubmission.review_type || "Not Assigned"}</div>
                            <div><span className="font-medium">Category:</span> {activeSubmission.student_type}</div>
                            {activeSubmission.description && <div><span className="font-medium">Description:</span> {activeSubmission.description}</div>}
                        </div>

                        <div className="my-4">
                            <Progress value={calculateProgress(activeSubmission.status)} className={`bg-gray-200 [&>div]:${activeSubmission.status.includes("Resend") ? "bg-red-500" : "bg-blue-500"}`} />
                        </div>

                        <div className="grid gap-4 py-2">
                            {getPhaseDocuments(activeSubmission).map(doc => (
                                <div key={doc.name} className="flex justify-between items-center border p-2 rounded">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{doc.name}</span>
                                        <span className="text-xs text-gray-500">{doc.required ? "Required" : "Optional"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={doc.templateUrl} download>
                                            <Button variant="outline" size="sm">Download Template</Button>
                                        </a>
                                        <Input type="file" className="w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button onClick={() => toast.success("Submitted!")}>Submit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default RSubmissionsPage;
