import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, Eye, Upload, Download } from "lucide-react";
import { toast } from "sonner";

type Stage = "Manuscript Check" | "Risk Assessment" | "Forms Check" | "Deploy Queue";

interface Submission {
    id: string;
    proposal_title: string;
    status: Stage;
    date: string;
    researcher: string;
}

export default function SubmissionView() {
    const location = useLocation();
    const navigate = useNavigate();
    const submission = location.state?.submission as Submission;
    const [progress, setProgress] = useState(0);
    const [isFormsDialogOpen, setIsFormsDialogOpen] = useState(false);
    const [selectedFormFiles, setSelectedFormFiles] = useState<FileList | null>(null);
    const [completedFiles, setCompletedFiles] = useState({
        manuscript: false,
        receipt: false,
        forms: false
    });

    // Check for existing files when component mounts
    useEffect(() => {
        const checkExistingFiles = async () => {
            try {
                const { data: manuscriptData } = await supabase.storage
                    .from('proposals')
                    .list(`manuscript_${submission.id}`);
                const { data: receiptData } = await supabase.storage
                    .from('proposals')
                    .list(`receipt_${submission.id}`);
                const { data: formsData } = await supabase.storage
                    .from('proposals')
                    .list(`form_${submission.id}`);

                setCompletedFiles({
                    manuscript: !!(manuscriptData && manuscriptData.length > 0),
                    receipt: !!(receiptData && receiptData.length > 0),
                    forms: !!(formsData && formsData.length > 0)
                });
            } catch (error) {
                console.error('Error checking files:', error);
            }
        };

        if (submission) {
            checkExistingFiles();
        }
    }, [submission]);
    
    const stages: Record<Stage, {
        manuscriptUpload: boolean;
        receiptUpload: boolean;
        formsUpload: boolean;
        canViewManuscript: boolean;
    }> = {
        "Manuscript Check": {
            manuscriptUpload: true,
            receiptUpload: false,
            formsUpload: false,
            canViewManuscript: true
        },
        "Risk Assessment": {
            manuscriptUpload: false,
            receiptUpload: false,
            formsUpload: false,
            canViewManuscript: true
        },
        "Forms Check": {
            manuscriptUpload: false,
            receiptUpload: true,
            formsUpload: true,
            canViewManuscript: true
        },
        "Deploy Queue": {
            manuscriptUpload: false,
            receiptUpload: false,
            formsUpload: false,
            canViewManuscript: true
        }
    };

    useEffect(() => {
        if (!submission) {
            navigate("/ssubm/sub1");
            return;
        }

        const stages = ["Manuscript Check", "Risk Assessment", "Forms Check", "Deploy Queue"];
        const currentIndex = stages.indexOf(submission.status);
        setProgress(((currentIndex + 1) / stages.length) * 100);
    }, [submission, navigate]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'manuscript' | 'receipt') => {
        if (!event.target.files?.[0]) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${submission.id}.${fileExt}`;

        const { error } = await supabase.storage
            .from('proposals')
            .upload(fileName, file);

        if (error) {
            console.error(error);
            toast.error("Failed to upload file");
        } else {
            toast.success("File uploaded successfully");
        }
    };

    const handleFormFilesUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `form_${submission.id}_${file.name}`;

        const { error } = await supabase.storage
            .from('proposals')
            .upload(fileName, file);

        if (error) {
            console.error(error);
            throw error;
        }
    };

    if (!submission) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/ssubm/sub2")}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{submission.proposal_title}</h1>
            </div>
            
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Progress</h2>
                <Progress value={progress} className="w-full" />
            </div>

            <div className="mb-8 space-y-4">
                <h2 className="text-lg font-semibold">Proposal Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div>
                            <div className="text-sm text-muted-foreground">Submission Date</div>
                            <div className="font-medium">{new Date(submission.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Current Stage</div>
                            <div className="font-medium">{submission.status}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <div className="text-sm text-muted-foreground">ID</div>
                            <div className="font-medium">{submission.id}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Researcher ID</div>
                            <div className="font-medium">{submission.researcher}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Manuscript</h3>
                        {stages[submission.status]?.manuscriptUpload && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex gap-2"
                                onClick={() => {/* Add download handler */}}
                            >
                                <Download className="h-4 w-4" /> Template
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {stages[submission.status]?.manuscriptUpload ? (
                            <Input 
                                type="file" 
                                onChange={(e) => handleFileUpload(e, 'manuscript')}
                                accept=".pdf,.doc,.docx"
                            />
                        ) : (
                            <Button
                                variant="secondary"
                                className="flex gap-2"
                                disabled={!stages[submission.status]?.canViewManuscript}
                            >
                                <Eye className="h-4 w-4" /> View
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Payment Receipt</h3>
                    <div className="flex gap-2">
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="secondary"
                                className="flex gap-2"
                            >
                                <Eye className="h-4 w-4" /> View
                            </Button>
                            <Input 
                                type="file" 
                                onChange={(e) => handleFileUpload(e, 'receipt')}
                                accept=".pdf,.jpg,.png"
                                disabled={!stages[submission.status]?.receiptUpload}
                                className={!stages[submission.status]?.receiptUpload ? "text-muted-foreground" : ""}
                            />
                        </div>
                    </div>
                </div>

                {stages[submission.status]?.formsUpload && (
                    <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Forms</h3>
                        <Dialog open={isFormsDialogOpen} onOpenChange={setIsFormsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="flex gap-2">
                                    <Upload className="h-4 w-4" /> Upload Forms
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader>
                                    <DialogTitle>Upload Forms</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <h4 className="text-sm font-medium mb-2">Upload Files</h4>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="file" 
                                            multiple
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setSelectedFormFiles(e.target.files)}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex gap-1 shrink-0"
                                            onClick={() => {/* Add download handler */}}
                                        >
                                            <Download className="h-3.5 w-3.5" /> Template
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsFormsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={async () => {
                                            if (selectedFormFiles) {
                                                try {
                                                    for (const file of Array.from(selectedFormFiles)) {
                                                        await handleFormFilesUpload(file);
                                                    }
                                                    toast.success("Forms uploaded successfully");
                                                } catch (error) {
                                                    toast.error("Failed to upload forms");
                                                }
                                            }
                                            setIsFormsDialogOpen(false);
                                            setSelectedFormFiles(null);
                                        }}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
}
