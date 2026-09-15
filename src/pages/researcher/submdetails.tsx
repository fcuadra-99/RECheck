"use client";

import { FileText, RefreshCcw, Clock, Check, BarChart3, X, Shield, ClipboardList, Rocket, Users, Flag, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FormViewer from "@/components/forms/FormViewer";
import EthicalClearanceForm from "@/components/forms/EthicalClearanceForm";
import DecisionLetterForm from "@/components/forms/DecisionLetterForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/DB";
import { toast } from "sonner";

import PhaseContent from "./pcontent";

interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string | null;
    advisor_id?: string | null;
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

interface SubmissionDetailsProps {
    activeSubmission: Submission | null;
    profiles: Profile[];
    userId: string | null;
    onSubmissionUpdate: (submission: Submission) => void;
}

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

const phaseIcons = [FileText, Shield, ClipboardList, Rocket, Users, Flag, Archive];

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

const getLatestHistoryWithAffectedFiles = async (proposal_id: number): Promise<HistoryEntry | null> => {
    const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("paper_id", proposal_id)
        .not("affected_files", "is", null)
        .order("history_date", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null;
        console.error("Failed to fetch history with affected files:", error);
        return null;
    }

    return data as HistoryEntry;
};

const getActivePhaseIndex = (status: string) => {
    const phaseMap: Record<string, number> = {
        "Send Manuscript": 0, "Check Manuscript": 0, "Resend Manuscript": 0,
        "Risk Assessment": 1,
        "Send Forms": 2, "Forms Check": 2, "Resend Forms": 2,
        "Deploy Queue": 3, "Send Revision": 3, "Check Revision": 3, "Resend Revision": 3,
        "Assign Review": 4, "Proposal Review": 4, "Revise Proposal": 4,
        "Data Collection": 5, "Deviation Check": 5, "Send Deviation Report": 5,
        "Send Study Report": 5, "Revise Documents": 5, "Study Report Check": 5,
        "Send Report": 6, "Archive Files": 6,
    };
    return phaseMap[status] ?? 0;
};

export default function SubmissionDetails({ activeSubmission, profiles, userId, onSubmissionUpdate }: SubmissionDetailsProps) {
    const [historyFiles, setHistoryFiles] = useState<DocumentItem[] | null>(null);
    const [latestComment, setLatestComment] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [_isPhase3Approval, setIsPhase3Approval] = useState<boolean>(false);

    const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});
    const [answeredDocuments, setAnsweredDocuments] = useState<{ [key: string]: boolean }>({});
    const [signedDocuments, setSignedDocuments] = useState<{ [key: string]: boolean }>({});

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>("");
    const [decisionPreviewData, setDecisionPreviewData] = useState<Record<string, any>>({});
    const [ethicalPreviewData, setEthicalPreviewData] = useState<Record<string, any>>({});
    const [ethicalPreviewLoading, setEthicalPreviewLoading] = useState(false);
    const [previewPrintRequested, setPreviewPrintRequested] = useState(false);
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [answerDialogOpen, setAnswerDialogOpen] = useState(false);

    const isCustomDecisionPreview = Boolean(
        previewOpen &&
        previewUrl &&
        (previewUrl.startsWith("json-ethical-clearance:") || previewUrl.startsWith("json-decision-letter:"))
    );

    // Lock body scroll when any full-screen dialog is open
    useEffect(() => {
        const isOpen = previewOpen || answerDialogOpen || signatureDialogOpen;
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [previewOpen, answerDialogOpen, signatureDialogOpen]);

    useEffect(() => {
        if (isCustomDecisionPreview) {
            document.body.classList.add('form-print-active');
        } else {
            document.body.classList.remove('form-print-active');
        }

        return () => {
            document.body.classList.remove('form-print-active');
        };
    }, [isCustomDecisionPreview]);

    useEffect(() => {
        if (!isCustomDecisionPreview || !previewPrintRequested || ethicalPreviewLoading) return;

        const timer = window.setTimeout(() => {
            window.print();
            setPreviewPrintRequested(false);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [isCustomDecisionPreview, previewPrintRequested, ethicalPreviewLoading]);

    useEffect(() => {
        const loadEthicalJsonPreview = async () => {
            if (!previewOpen || !previewUrl || !previewUrl.startsWith("json-ethical-clearance:")) return;

            const url = previewUrl.replace("json-ethical-clearance:", "");

            try {
                setEthicalPreviewLoading(true);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to load ethical clearance: ${response.status} ${response.statusText}`);
                }

                const text = await response.text();
                const parsed = JSON.parse(text);
                setEthicalPreviewData(parsed && typeof parsed === "object" ? parsed : {});
            } catch (error) {
                console.error("Failed to load ethical clearance preview:", error);
                toast.error("Failed to load ethical clearance preview");
                setEthicalPreviewData({});
            } finally {
                setEthicalPreviewLoading(false);
            }
        };

        loadEthicalJsonPreview();
    }, [previewOpen, previewUrl]);

    useEffect(() => {
        const loadDecisionJsonPreview = async () => {
            if (!previewOpen || !previewUrl || !previewUrl.startsWith("json-decision-letter:")) return;

            const url = previewUrl.replace("json-decision-letter:", "");

            try {
                setEthicalPreviewLoading(true);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to load decision letter: ${response.status} ${response.statusText}`);
                }

                const text = await response.text();
                const parsed = JSON.parse(text);
                setDecisionPreviewData(parsed && typeof parsed === "object" ? parsed : {});
            } catch (error) {
                console.error("Failed to load decision letter preview:", error);
                toast.error("Failed to load decision letter preview");
                setDecisionPreviewData({});
            } finally {
                setEthicalPreviewLoading(false);
            }
        };

        loadDecisionJsonPreview();
    }, [previewOpen, previewUrl]);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);

    useEffect(() => {
        setUploadedFiles({});
        setSignedDocuments({});
        setAnsweredDocuments({});
        setHistoryFiles(null);
        setLatestComment(null);
        setActiveTab(0);
        setIsPhase3Approval(false);

        const prepare = async () => {
            if (!activeSubmission) return;
            const idx = phases.findIndex((p) => p.statuses.includes(activeSubmission.status));
            setActiveTab(idx === -1 ? 0 : idx);

            // Check if this is Phase 3 approval by looking at history
            if (activeSubmission.status === "Pending Advisor Approval") {
                const { data: historyData } = await supabase
                    .from("history")
                    .select("action, comment")
                    .eq("paper_id", activeSubmission.proposal_id)
                    .order("history_date", { ascending: false })
                    .limit(10);

                // Check if there's a previous approval (meaning this is Phase 3)
                const hasInitialApproval = historyData?.some(h => 
                    h.action === "ADVISOR_APPROVED" || 
                    h.comment?.includes("Advisor approved")
                );
                
                setIsPhase3Approval(hasInitialApproval || false);
            }

            if (["Resend Manuscript", "Resend Forms", "Send Revision", "Resend Revision", "Revise Proposal"].includes(activeSubmission.status)) {
                const hist = await getLatestHistoryWithAffectedFiles(activeSubmission.proposal_id)
                    || await getLatestHistory(activeSubmission.proposal_id);

                if (hist) {
                    setLatestComment(hist.comment || null);

                    if (hist.affected_files) {
                        try {
                            const parsed = typeof hist.affected_files === 'string'
                                ? JSON.parse(hist.affected_files)
                                : hist.affected_files;

                            if (Array.isArray(parsed) && parsed.length > 0) {
                                const allRevisionDocs = getPhaseDocuments(activeSubmission);
                                const files = parsed.map((f: any) => {
                                    const fullDoc = allRevisionDocs.find(doc =>
                                        doc.name === f.name ||
                                        doc.name.includes(f.name) ||
                                        f.name.includes(doc.name)
                                    );

                                    if (fullDoc) {
                                        return {
                                            name: f.name,
                                            required: f.required !== undefined ? f.required : true,
                                            templateUrl: fullDoc.templateUrl,
                                            needsSignature: fullDoc.needsSignature || false,
                                            needsAnswer: fullDoc.needsAnswer || false
                                        };
                                    } else {
                                        return {
                                            name: f.name,
                                            required: f.required !== undefined ? f.required : true,
                                            templateUrl: "/templates/unknown.pdf",
                                            needsSignature: false,
                                            needsAnswer: false
                                        };
                                    }
                                }).filter(Boolean);

                                setHistoryFiles(files);

                                if (activeSubmission.status === "Send Revision" && files.length > 0) {
                                    toast.info(`Found ${files.length} file(s) requiring revision: ${files.map(f => f.name).join(", ")}`);
                                }
                            } else {
                                setHistoryFiles([]);
                            }
                        } catch (err) {
                            console.error("Failed to parse affected_files:", err);
                            setHistoryFiles([]);
                        }
                    } else {
                        setHistoryFiles([]);
                    }
                }
            }
        };

        prepare();
    }, [activeSubmission]);

    const getProfileName = (id: string | null) => {
        if (!id) return "Unknown";
        const p = profiles.find((x) => x.id === id);
        return p ? `${p.lname}, ${p.fname}` : "Unknown";
    };

    if (!activeSubmission) {
        return (
            <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="text-center py-8 text-gray-500">No submission selected</div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold break-words pr-2">{activeSubmission.proposal_title}</h2>
                    <div className="text-sm text-gray-600 mt-1 mb-3">
                        {getProfileName(activeSubmission.researcher)} • <span className="text-muted-foreground">{activeSubmission.category}</span>
                        {activeSubmission.review_type && (
                            <> • <span className="text-muted-foreground">{activeSubmission.review_type} Review</span></>
                        )}
                    </div>
                    {activeSubmission.protocol_id && (
                        <div className="mt-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                                {activeSubmission.protocol_id}
                            </Badge>
                        </div>
                    )}
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
                            {/* Add status-specific icons */}
                            {activeSubmission.status.includes("Resend") && <RefreshCcw className="w-3 h-3" />}
                            {activeSubmission.status.includes("Check") && <Clock className="w-3 h-3" />}
                            {activeSubmission.status === "Deploy Queue" && <Check className="w-3 h-3" />}
                            {activeSubmission.status === "Data Collection" && <BarChart3 className="w-3 h-3" />}
                            {activeSubmission.status === "Risk Assessment" && <Shield className="w-3 h-3" />}
                            {activeSubmission.status.includes("Forms") && <ClipboardList className="w-3 h-3" />}
                            {activeSubmission.status.includes("Revision") && <Rocket className="w-3 h-3" />}
                            {activeSubmission.status.includes("Review") && <Users className="w-3 h-3" />}
                            {activeSubmission.status.includes("Deviation") && <Flag className="w-3 h-3" />}
                            {activeSubmission.status.includes("Archive") && <Archive className="w-3 h-3" />}
                            {activeSubmission.status.includes("Send") && !activeSubmission.status.includes("Resend") && <FileText className="w-3 h-3" />}

                            <span className="truncate">{activeSubmission.status}</span>
                        </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Submitted {new Date(activeSubmission.date).toLocaleDateString()}</div>
                </div>
            </div>


            {/* Tabs Section */}
            {activeSubmission.status === "Pending Advisor Approval" ? (
                <div className="mt-6 p-6 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-yellow-900 mb-2">Awaiting Advisor Approval</h3>
                            <p className="text-sm text-yellow-800">
                                Your proposal has been submitted and is currently awaiting approval from your assigned advisor.
                                Once approved, you will be able to upload your manuscript files and proceed with Phase 1.
                            </p>
                            <p className="text-xs text-yellow-700 mt-2">
                                You will receive a notification when your advisor reviews your proposal.
                            </p>
                        </div>
                    </div>
                </div>
            ) : activeSubmission.status === "Pending Forms Approval" ? (
                <div className="mt-6 p-6 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-yellow-900 mb-2">Awaiting Phase 3 Advisor Approval</h3>
                            <p className="text-sm text-yellow-800">
                                Your Phase 3 forms submission has been sent to your advisor for review and approval.
                                Once approved, your submission will proceed to the forms check stage.
                            </p>
                            <p className="text-xs text-yellow-700 mt-2">
                                You will receive a notification when your advisor reviews your forms submission.
                            </p>
                        </div>
                    </div>
                </div>
            ) : activeSubmission.status === "Advisor Rejected" ? (
                <div className="mt-6 p-6 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-900 mb-2">Proposal Rejected by Advisor</h3>
                            <p className="text-sm text-red-800">
                                Your proposal has been rejected by your advisor. Please contact your advisor for feedback
                                and guidance on how to proceed.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
            <Tabs value={`${activeTab}`} onValueChange={(v) => setActiveTab(Number(v))}>
                <TabsList className="flex w-full gap-1 sm:gap-2 py-0.5">
                    {phases.map((phase, idx) => {
                        const activeIdx = getActivePhaseIndex(activeSubmission?.status || "");
                        const isActive = idx === activeIdx;
                        const isComplete = idx < activeIdx;
                        const isPhase7Unlocked = idx === 6 && activeIdx === 5;
                        const isUpcoming = idx > activeIdx && !isPhase7Unlocked;

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
                                {(() => {
                                    const Icon = phaseIcons[idx];
                                    return Icon ? <Icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> : null;
                                })()}
                                <span className="truncate hidden sm:inline">{phase.title}</span>
                                <span className="truncate sm:hidden">Phase {idx + 1}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {phases.map((phase, idx) => (
                    <TabsContent key={phase.title} value={`${idx}`} className="mt-4">
                        <PhaseContent
                            phaseIndex={idx}
                            submission={activeSubmission}
                            userId={userId}
                            historyFiles={historyFiles}
                            latestComment={latestComment}
                            uploadedFiles={uploadedFiles}
                            answeredDocuments={answeredDocuments}
                            signedDocuments={signedDocuments}
                            onUploadedFilesChange={setUploadedFiles}
                            onAnsweredDocumentsChange={setAnsweredDocuments}
                            onSignedDocumentsChange={setSignedDocuments}
                            onSubmissionUpdate={onSubmissionUpdate}
                            onOpenPreview={setPreviewOpen}
                            onSetPreviewUrl={setPreviewUrl}
                            onSetPreviewTitle={setPreviewTitle}
                            onSetSignatureDialogOpen={setSignatureDialogOpen}
                            onSetAnswerDialogOpen={setAnswerDialogOpen}
                            onSetActiveDocument={setActiveDocument}
                            onSetPreviewPrintRequested={setPreviewPrintRequested}
                        />
                    </TabsContent>
                ))}
            </Tabs>
            )}

            {/* Dialogs */}
            {previewOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col form-print-root">
                    <div className="flex items-center justify-between p-4 border-b print:hidden">
                        <div className="font-semibold text-lg">{previewTitle}</div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setPreviewOpen(false);
                                setPreviewUrl(null);
                                setPreviewPrintRequested(false);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 relative print:flex print:items-start print:justify-center print:p-0 form-print-shell">
                        {previewUrl?.startsWith("json-ethical-clearance:") || previewUrl?.startsWith("json-decision-letter:") ? (
                            ethicalPreviewLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-gray-500">Loading preview...</div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 overflow-auto bg-gray-100 p-4 print:static print:inset-auto print:overflow-visible print:bg-white print:p-0">
                                    <div style={{ pointerEvents: "none" }}>
                                        {previewUrl?.startsWith("json-ethical-clearance:") ? (
                                            <EthicalClearanceForm
                                                savedData={ethicalPreviewData}
                                                protocolCode={activeSubmission?.protocol_id}
                                                researcherName={(() => {
                                                    const p = profiles.find((x) => x.id === activeSubmission?.researcher);
                                                    return p ? `${p.fname ?? ""} ${p.lname ?? ""}`.trim() : "";
                                                })()}
                                                proposalTitle={activeSubmission?.proposal_title}
                                                reviewType={activeSubmission?.review_type}
                                                isReadOnly
                                            />
                                        ) : (
                                            <DecisionLetterForm savedData={decisionPreviewData} />
                                        )}
                                    </div>
                                </div>
                            )
                        ) : previewUrl ? (
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

            {answerDialogOpen && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="font-semibold text-lg">Fill Out Form - {activeDocument}</div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAnswerDialogOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        {activeDocument && activeSubmission ? (
                            <FormViewer
                                documentName={activeDocument}
                                proposalId={activeSubmission.proposal_id}
                                protocolCode={activeSubmission.protocol_id}
                                proposalTitle={activeSubmission.proposal_title}
                                reviewType={activeSubmission.review_type}
                                researcherName={(() => {
                                    const p = profiles.find(p => p.id === activeSubmission.researcher);
                                    return p ? `${p.fname ?? ""} ${p.lname ?? ""}`.trim() : "";
                                })()}
                                advisorId={activeSubmission.advisor_id}
                                onDone={() => {
                                    setAnsweredDocuments(prev => ({ ...prev, [activeDocument!]: true }));
                                    setAnswerDialogOpen(false);
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gray-500">No document selected</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper functions needed by both components
const getPhaseDocuments = (submission: Submission): DocumentItem[] => {
    if (submission.status === "Send Revision" || submission.status === "Resend Revision") {
        const manuscriptDocs = [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            // Removed documents from manuscript phase - moved to Forms Check
        ].filter(Boolean) as DocumentItem[];

        const formsDocs = getFormsDocuments(submission);
        return [...manuscriptDocs, ...formsDocs];
    }

    if (["Send Manuscript", "Resend Manuscript"].includes(submission.status)) {
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            // Removed documents from manuscript phase - moved to Forms Check
        ].filter(Boolean) as DocumentItem[];
    }

    if (["Send Forms", "Resend Forms", "Forms Check"].includes(submission.status)) {
        return getFormsDocuments(submission);
    }

    return [];
};

const getFormsDocuments = (submission: Submission): DocumentItem[] => {
    const isExternal = submission.category === "External";
    const isGrad = submission.category === "Graduate";
    const isUndergrad = submission.category === "Undergraduate" || !submission.category || submission.category === "";
    const reviewTypeRaw = (submission.review_type || "").toString();
    const reviewType = reviewTypeRaw.trim().toLowerCase() || "exempt";

    const makeDoc = (name: string): DocumentItem => ({
        name,
        templateUrl: "",
        required: true,
        needsSignature: false,
        needsAnswer: true,
    });

    const uploadableDoc = (name: string): DocumentItem => ({
        name,
        templateUrl: "",
        required: true,
        needsSignature: false,
        needsAnswer: false,
    });

    const paymentReceipt: DocumentItem = {
        name: "Payment Receipt",
        templateUrl: "",
        required: true,
        needsSignature: false,
        needsAnswer: false,
    };

    // Common documents for all categories in Forms Check
    const commonFormsDocs = [
        uploadableDoc("All Grades"),
        uploadableDoc("Updated CV"),
        uploadableDoc("Minutes of Proposal Defense"),
        ...(isGrad ? [uploadableDoc("Defense Receipt")] : []),
        paymentReceipt,
    ];

    if (isExternal) {
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0036_MOA for external.pdf"),
                ...commonFormsDocs,
            ];
        }
        return [
            makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
            makeDoc("REC_FO_0027_EthicsApplicationProcedure.pdf"),
            makeDoc("REC_FO_0028_EthicsStudyProtocolInformationForm.pdf"),
            makeDoc("REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf"),
            makeDoc("REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf"),
            makeDoc("REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf"),
            makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
            makeDoc("REC_FO_0036_MOA for external.pdf"),
            ...commonFormsDocs,
        ];
    }

    if (isGrad) {
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_ENDORSMENT_FORM.pdf"),
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf"),
                ...commonFormsDocs,
            ];
        }
        return [
            makeDoc("REC_ENDORSMENT_FORM.pdf"),
            makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
            makeDoc("REC_FO_0027_EthicsApplicationProcedure.pdf"),
            makeDoc("REC_FO_0028_EthicsStudyProtocolInformationForm.pdf"),
            makeDoc("REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf"),
            makeDoc("REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf"),
            makeDoc("REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf"),
            makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
            makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship.pdf"),
            ...commonFormsDocs,
        ];
    }

    if (isUndergrad || (!isExternal && !isGrad)) {
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship.pdf"),
                ...commonFormsDocs,
            ];
        }
        return [
            makeDoc("REC_FO_0026_EthicsProtocolChecklist.pdf"),
            makeDoc("REC_FO_0027_EthicsApplicationProcedure.pdf"),
            makeDoc("REC_FO_0028_EthicsStudyProtocolInformationForm.pdf"),
            makeDoc("REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf"),
            makeDoc("REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf"),
            makeDoc("REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf"),
            makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
            makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship.pdf"),
            ...commonFormsDocs,
        ];
    }

    return [
        makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
        ...commonFormsDocs,
    ];
};