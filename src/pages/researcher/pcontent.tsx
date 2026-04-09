"use client";

import { FileText, Download, FileUp, Eye, PenLine, Check, AlertTriangle, BarChart3, CheckCircle, Pen, FileCheck, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Submission {
    proposal_id: number;
    protocol_id?: string | null;
    proposal_title: string;
    description: string;
    category: string;
    review_type: string | null;
    researcher: string | null;
    status: string;
    date: string;
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

interface PhaseContentProps {
    phaseIndex: number;
    submission: Submission;
    userId: string | null;
    historyFiles: DocumentItem[] | null;
    latestComment: string | null;
    uploadedFiles: { [key: string]: File | null };
    answeredDocuments: { [key: string]: boolean };
    signedDocuments: { [key: string]: boolean };
    onUploadedFilesChange: (files: { [key: string]: File | null }) => void;
    onAnsweredDocumentsChange: (docs: { [key: string]: boolean }) => void;
    onSignedDocumentsChange: (docs: { [key: string]: boolean }) => void;
    onSubmissionUpdate: (submission: Submission) => void;
    onOpenPreview: (open: boolean) => void;
    onSetPreviewUrl: (url: string) => void;
    onSetPreviewTitle: (title: string) => void;
    onSetSignatureDialogOpen: (open: boolean) => void;
    onSetAnswerDialogOpen: (open: boolean) => void;
    onSetActiveDocument: (doc: string) => void;
}

export default function PhaseContent({
    phaseIndex,
    submission,
    userId,
    historyFiles,
    latestComment,
    uploadedFiles,
    answeredDocuments,
    signedDocuments,
    onUploadedFilesChange,
    onAnsweredDocumentsChange,
    onSignedDocumentsChange,
    onSubmissionUpdate,
    onOpenPreview,
    onSetPreviewUrl,
    onSetPreviewTitle,
    onSetSignatureDialogOpen,
    onSetAnswerDialogOpen,
    onSetActiveDocument
}: PhaseContentProps) {
    const [isDragOver, setIsDragOver] = useState<string | null>(null);
    const [studyReportUploadOpen, setStudyReportUploadOpen] = useState(false);
    const [studyReportFiles, setStudyReportFiles] = useState<File[]>([]);
    const [deviationType, setDeviationType] = useState<string>("");
    const [deviationFiles, setDeviationFiles] = useState<File[]>([]);
    const [deviationUploadOpen, setDeviationUploadOpen] = useState(false);

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

    onAnsweredDocumentsChange;
    onSignedDocumentsChange;

    const activeIdx = getActivePhaseIndex(submission.status);
    const isPast = activeIdx !== -1 && phaseIndex < activeIdx;
    const isActive = activeIdx !== -1 && phaseIndex === activeIdx;
    const isFuture = activeIdx !== -1 && phaseIndex > activeIdx;

    const handleFileSelect = (docName: string, file: File | null) => {
        onUploadedFilesChange({ ...uploadedFiles, [docName]: file });
    };

    const handleDragOver = (e: React.DragEvent, docName?: string) => {
        e.preventDefault();
        if (docName) {
            setIsDragOver(docName);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(null);
    };

    const handleDrop = (e: React.DragEvent, docName: string, doc: DocumentItem) => {
        e.preventDefault();
        setIsDragOver(null);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (!file) return;

            if (doc.name === "Payment Receipt") {
                const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
                if (!allowedTypes.includes(file.type)) {
                    toast.error("Only PDF, PNG, and JPG files are allowed for Payment Receipt");
                    return;
                }
            } else {
                if (file.type !== "application/pdf") {
                    toast.error("Only PDF files are allowed");
                    return;
                }
            }

            if (file.size > 25 * 1024 * 1024) {
                toast.error("File size must be under 25MB");
                return;
            }

            handleFileSelect(docName, file);
        }
    };

    const getFilesNeedingRevision = (submission: Submission): DocumentItem[] => {
        // For Revise Proposal status, show all documents but don't require them
        if (submission.status === "Revise Proposal") {
            // Return all available documents for this phase but mark them as not required
            const allDocuments = getPhaseDocuments(submission);
            return allDocuments.map(doc => ({
                ...doc,
                required: false // Make all documents optional for Revise Proposal
            }));
        }

        if (submission.status === "Send Revision") {
            if (historyFiles && historyFiles.length > 0) {
                return historyFiles;
            }
            if (historyFiles === null) {
                return [];
            }
            return getPhaseDocuments(submission);
        }

        if (["Resend Manuscript", "Resend Forms"].includes(submission.status)) {
            if (historyFiles && historyFiles.length > 0) {
                return historyFiles;
            }
            return [];
        }

        return getPhaseDocuments(submission);
    };

    const uploadAndAdvancePhase = async (submission: Submission) => {
        const docs = getFilesNeedingRevision(submission);
        const loadingId = toast.loading("Submitting forms...");

        try {
            if (submission.status !== "Revise Proposal") {
                const incomplete = docs.filter(doc => {
                    if (!doc.required) return false;
                    const needsSig = !!doc.needsSignature;
                    const needsAns = !!doc.needsAnswer;

                    if (needsSig && needsAns) return !(signedDocuments[doc.name] && answeredDocuments[doc.name]);
                    if (needsSig) return !signedDocuments[doc.name];
                    if (needsAns) return !answeredDocuments[doc.name];
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
            }

            for (const doc of docs) {
                if (!uploadedFiles[doc.name] && submission.status === "Revise Proposal") {
                    continue;
                }

                const getStorageFilename = (docName: string): string => {
                    if (docName === 'All Grades') return 'All Grades.pdf';
                    const baseName = docName.replace(/\.pdf$/i, '');
                    return `${baseName}.pdf`;
                };

                let filePath: string = "";
                const uploadStatus = phaseUploadStatus(getActivePhaseIndex(submission.status));

                if (uploadedFiles[doc.name]) {
                    try {
                        const file = uploadedFiles[doc.name]!;

                        let aa = uploadStatus?.replace(/^Resend /, "Send ") || "";

                        if (uploadStatus === "Resend Manuscript" || uploadStatus === "Resend Forms") {
                            aa = uploadStatus.replace("Resend ", "Send ");
                        }

                        const storageFilename = getStorageFilename(doc.name);
                        const path = `${submission.proposal_id}/${aa || 'other'}/${storageFilename}`;
                        const renamedFile = new File([file], storageFilename, { type: file.type });

                        const { error: uploadError } = await supabase.storage.from('documents').upload(path, renamedFile, { upsert: true });
                        if (uploadError) throw uploadError;
                        filePath = path;
                    } catch (uploadErr: any) {
                        throw new Error(`Failed to upload file for ${doc.name}: ${uploadErr.message || uploadErr}`);
                    }
                }

                if (["Resend Manuscript", "Resend Forms"].includes(submission.status)) {
                    const { data: existingRecords } = await supabase
                        .from("proposal_documents")
                        .select("*")
                        .eq("proposal_id", submission.proposal_id)
                        .eq("doc_type", doc.name)
                        .order("uploaded_at", { ascending: false })
                        .limit(1);

                    const originalRecord = existingRecords?.[0];
                    //adasd
                    // ✅ Insert or update new record with bumped revision #
                    const newRevision = originalRecord?.revision_number
                        ? originalRecord.revision_number + 1
                        : 1;

                    const updatedRecord = {
                        file_path: filePath,
                        uploaded_at: new Date().toISOString(),
                        revision_number: newRevision,
                    };

                    if (originalRecord) {
                        const { error: updateError } = await supabase
                            .from("proposal_documents")
                            .update(updatedRecord)
                            .eq("document_id", originalRecord.document_id);

                        if (updateError) {
                            throw new Error(updateError.message || "Failed to update document record");
                        }
                    } else {
                        const record: any = {
                            proposal_id: submission.proposal_id,
                            doc_type: doc.name,
                            ...updatedRecord,
                        };

                        const { error: insertError } = await supabase
                            .from("proposal_documents")
                            .insert(record);

                        if (insertError) {
                            throw new Error(insertError.message || "Failed to insert document record");
                        }
                    }
                }
                else {
                    const record: any = {
                        proposal_id: submission.proposal_id,
                        doc_type: doc.name,
                        file_path: filePath || "",
                        uploaded_at: filePath ? new Date().toISOString() : null,
                        revision_number: 1,
                    };

                    const { error: dbError } = await supabase.from('proposal_documents').insert(record);
                    if (dbError) {
                        throw new Error(dbError.message || 'Failed to record document submission');
                    }
                }

            }

            // Update the next status - Revise Proposal goes to Assign Review
            let nextStatus = getNextStatus(submission.status);

            // Override for Revise Proposal to go directly to Assign Review
            if (submission.status === "Revise Proposal") {
                nextStatus = "Assign Review";
            }

            const { error: statusError } = await supabase.from("proposals")
                .update({ status: nextStatus })
                .eq("proposal_id", submission.proposal_id);
            if (statusError) throw new Error(statusError.message);

            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";
            const affectedFiles = docs
                .filter(doc => uploadedFiles[doc.name] || signedDocuments[doc.name] || answeredDocuments[doc.name])
                .map((d) => ({ name: d.name, required: d.required }));

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "submission",
                paper_id: submission.proposal_id,
                comment: submission.status === "Revise Proposal" ? "Proposal revisions submitted" : "Phase submitted",
                actor: actorId,
                affected_files: affectedFiles,
                action: submission.status === "Revise Proposal" ? "Submit Revisions" : "Submit Phase",
                history_date: new Date().toISOString(),
                status: nextStatus,
            });
            if (historyError) throw new Error(historyError.message);

            onUploadedFilesChange(Object.fromEntries(
                Object.entries(uploadedFiles).filter(([key]) => !docs.some(d => d.name === key))
            ));

            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            const updated = refreshed?.find((p: any) => p.proposal_id === submission.proposal_id);
            if (updated) {
                onSubmissionUpdate(updated as Submission);
            }

            toast.success(
                submission.status === "Revise Proposal"
                    ? "Revisions submitted successfully"
                    : "Phase submitted successfully",
                { id: loadingId }
            );
        } catch (err: any) {
            console.error(err);
            toast.error("Submission failed: " + (err.message || err), { id: loadingId });
        }
    };

    const renderPhaseFilesForActive = (submission: Submission) => {
        const docs = getFilesNeedingRevision(submission);
        const isResendStatus = ["Resend Manuscript", "Resend Forms", "Send Revision"].includes(submission.status);

        return (
            <div className="space-y-4">
                {(isResendStatus || submission.status === "Revise Proposal") && docs.length > 0 && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-800">
                                    <div className="font-medium">Revision Required</div>
                                    <div>Please revise the following documents based on reviewer feedback:</div>
                                </div>
                            </div>
                        </div>

                        {/* Show revision comments from history */}
                        <RevisionComments />

                        {/* Show latest comment if available (backward compatibility) */}
                        {latestComment && (
                            <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-4">
                                <div className="font-medium text-amber-900 mb-2">Latest Comment:</div>
                                <div className="text-sm text-amber-800">{latestComment}</div>
                            </div>
                        )}
                    </div>
                )}

                {isResendStatus && docs.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                                <div className="font-medium">No Revision Required</div>
                                <div>All documents are up to date. No files need to be revised at this time.</div>
                            </div>
                        </div>
                    </div>
                )}

                {docs.map((doc) => (
                    <div key={doc.name} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full">
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
                                            {isResendStatus && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Needs Revision
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(["Send Manuscript", "Resend Manuscript", "Send Forms", "Resend Forms", "Send Revision"].includes(submission.status) &&
                                !doc.needsSignature && !doc.needsAnswer) ? (
                                <label
                                    htmlFor={`file-${doc.name}`}
                                    className={cn(
                                        "w-1/2 h-full border-2 border-dashed rounded-lg p-3 transition-colors block cursor-pointer",
                                        uploadedFiles[doc.name]
                                            ? "border-primary bg-primary/5"
                                            : isDragOver === doc.name
                                                ? "border-primary bg-primary/10"
                                                : "border-gray-300 hover:border-gray-400"
                                    )}
                                    onDragOver={(e) => handleDragOver(e, doc.name)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, doc.name, doc)}
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
                                                handleFileSelect(doc.name, file);
                                            }
                                        }}
                                    />
                                    <div className="text-center flex flex-col items-center justify-center h-full">
                                        <FileUp className="h-6 w-6 text-gray-400 mb-1" />
                                        <p className="text-xs text-gray-500 truncate max-w-full">
                                            {uploadedFiles[doc.name]
                                                ? uploadedFiles[doc.name]?.name
                                                : "Click to upload or drag & drop"}
                                        </p>
                                        {doc.name === "Payment Receipt" && (
                                            <p className="text-xs text-gray-400 mt-1">PDF, PNG, or JPG</p>
                                        )}
                                        {isResendStatus && uploadedFiles[doc.name] && (
                                            <p className="text-xs text-amber-600 mt-1">Will replace existing file</p>
                                        )}
                                    </div>
                                </label>
                            ) : (
                                <div className="w-1/2 h-full border-2 rounded-lg p-3 bg-gray-50 cursor-default">
                                    <div className="text-center flex flex-col items-center justify-center h-full">
                                        <Pen className="h-6 w-6 text-gray-400 mb-1" />
                                        <p className="text-xs text-gray-500">Form to be filled out</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {(answeredDocuments[doc.name] ? "✓ " : "• ") + "Answers"}
                                            {" | "}
                                            {(signedDocuments[doc.name] ? "✓ " : "• ") + "Signature"}
                                        </p>
                                        {isResendStatus && (
                                            <p className="text-xs text-amber-600 mt-1">Will update existing submission</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 w-full lg:w-[140px]">
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

                                {doc.needsSignature && (
                                    <Button
                                        variant={signedDocuments[doc.name] ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "w-full",
                                            signedDocuments[doc.name] && "bg-green-500 hover:bg-green-600"
                                        )}
                                        onClick={() => {
                                            onSetActiveDocument(doc.name);
                                            onSetSignatureDialogOpen(true);
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
                                )}

                                {doc.needsAnswer && (
                                    <Button
                                        variant={answeredDocuments[doc.name] ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "w-full",
                                            answeredDocuments[doc.name] && "bg-green-500 hover:bg-green-600"
                                        )}
                                        onClick={() => {
                                            onSetActiveDocument(doc.name);
                                            onSetAnswerDialogOpen(true);
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
                                )}

                                {uploadedFiles[doc.name] && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (uploadedFiles[doc.name]) {
                                                const url = URL.createObjectURL(uploadedFiles[doc.name]!);
                                                onSetPreviewUrl(url);
                                                onSetPreviewTitle(doc.name);
                                                onOpenPreview(true);
                                            }
                                        }}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="pt-4">
                    <RippleButton
                        onClick={() => uploadAndAdvancePhase(submission)}
                        disabled={
                            !docs.every((d) => {
                                if (!d.required) return true;
                                const needsSig = !!d.needsSignature;
                                const needsAns = !!d.needsAnswer;
                                if (needsSig && needsAns) return !!signedDocuments[d.name] && !!answeredDocuments[d.name];
                                if (needsSig) return !!signedDocuments[d.name];
                                if (needsAns) return !!answeredDocuments[d.name];
                                return !!uploadedFiles[d.name];
                            })
                        }
                        hidden={!submission.status.includes("Send") && !submission.status.includes("Resend") && submission.status !== "Revise Proposal"}
                        className="w-full sm:w-auto"
                    >
                        {isResendStatus ? "Submit Revisions" : "Submit Phase"}
                    </RippleButton>
                </div>
            </div>
        );
    };

    const renderDataCollectionActions = () => {
        return (
            <div className="space-y-6">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Collection Phase</h3>
                    <p className="text-gray-600">Choose the appropriate action based on your study progress</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Report Deviation</h4>
                            <p className="text-sm text-gray-600 mb-4 flex-1">
                                Report any unexpected events or changes from the approved study protocol.
                            </p>

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

    const PastPhaseFilesList = ({ phaseIndex }: { phaseIndex: number }) => {
        const [storedFiles, setStoredFiles] = useState<{ name: string; url: string }[] | null>(null);

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

                const validFiles = data.filter((f: any) =>
                    !f.name.startsWith('.') &&
                    !f.name.includes('emptyfolderplaceholder') &&
                    f.name !== '.emptyFolderPlaceholder'
                );

                if (validFiles.length === 0) return [];

                const signedFiles = await Promise.all(
                    validFiles.map(async (f: any) => {
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

                return signedFiles.filter((f): f is { name: string; url: string } => f !== null);
            } catch (err) {
                console.error(err);
                return [];
            }
        };

        const openPreview = async (submissionId: number, phaseIndex: number, filename: string, label?: string) => {
            onSetPreviewTitle(label || filename);
            onOpenPreview(true);
            try {
                const uploadStatus = phaseUploadStatus(phaseIndex);
                if (!uploadStatus) throw new Error("No stored files for this phase.");
                const path = `${submissionId}/${uploadStatus}/${filename}`;
                const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
                if (error) throw error;
                onSetPreviewUrl(data.signedUrl);
            } catch (err: any) {
                console.error(err);
                toast.error("Failed to load preview: " + (err.message || err));
                onSetPreviewUrl("");
            }
        };

        useEffect(() => {
            let mounted = true;
            (async () => {
                if (!submission) return;
                const list = await listStoredFilesForPhase(submission.proposal_id, phaseIndex);
                if (!mounted) return;
                setStoredFiles(list || []);
            })();
            return () => { mounted = false; };
        }, [submission, phaseIndex]);

        if (storedFiles === null) return <div className="py-6"><Skeleton className="h-6 w-full" /></div>;
        if (storedFiles.length === 0) return <div className="text-sm text-gray-500">No files uploaded for this phase.</div>;

        return (
            <div className="space-y-2">
                {storedFiles.map((f) => (
                    <div key={f.name} className="flex items-center justify-between border p-3 rounded gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileCheck className="h-6 w-6 flex-shrink-0" />
                            <div className="font-medium truncate">{f.name}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={() => openPreview(submission!.proposal_id, phaseIndex, f.name, f.name)}>
                                View
                            </Button>
                            <a href={f.url} target="_blank" rel="noopener noreferrer">
                                <RippleButton variant="outline" size="sm">Download</RippleButton>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const [historyComments, setHistoryComments] = useState<{ comment: string; actor: string; history_date: string }[]>([]);
    const fetchHistoryComments = async (proposalId: number) => {
        try {
            const { data, error } = await supabase
                .from("history")
                .select("comment, actor, history_date")
                .eq("paper_id", proposalId)
                .eq("history_type", "review")
                .order("history_date", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Error fetching history comments:", error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error("Failed to fetch history comments:", err);
            return [];
        }
    };

    useEffect(() => {
        const loadHistoryComments = async () => {
            if (submission?.proposal_id) {
                const comments = await fetchHistoryComments(submission.proposal_id);
                setHistoryComments(comments);
            }
        };

        loadHistoryComments();
    }, [submission?.proposal_id]);

    const RevisionComments = () => {
        if (historyComments.length === 0) {
            return null;
        }

        return (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <div className="font-medium">Reviewer Comments</div>
                            <div>Please review the following comments from the chairperson:</div>
                        </div>
                    </div>
                </div>

                {historyComments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-blue-900">
                                Comment from Chairperson
                            </div>
                            <div className="text-xs text-blue-700">
                                {new Date(comment.history_date).toLocaleDateString()} at{' '}
                                {new Date(comment.history_date).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="text-sm text-blue-800 whitespace-pre-wrap">
                            {comment.comment}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const phaseHasNoRequiredFiles = (phaseIndex: number, submission: Submission): boolean => {
        const noFilePhases = [3, 4, 5, 6];
        if (noFilePhases.includes(phaseIndex)) {
            const currentPhase = phases[phaseIndex];
            if (currentPhase?.statuses.includes(submission.status)) {
                // For Revise Proposal, we DO have files to show (even though they're optional)
                if (submission.status === "Revise Proposal") {
                    return false; // Return false to indicate files SHOULD be shown
                }
                return true;
            }
        }
        return false;
    };

    const handleStudyReportUpload = async () => {
        if (studyReportFiles.length === 0) {
            toast.error("Please select at least one file to upload");
            return;
        }

        const loadingId = toast.loading("Uploading study report files...");

        try {
            const uploadedUrls: string[] = [];

            for (const file of studyReportFiles) {
                try {
                    const path = `${submission!.proposal_id}/study_reports/${Date.now()}_${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    const { data: signedUrl } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(path, 60 * 60 * 24 * 365);

                    if (signedUrl) {
                        uploadedUrls.push(signedUrl.signedUrl);
                    }
                } catch (uploadErr: any) {
                    throw new Error(`Failed to upload file ${file.name}: ${uploadErr.message}`);
                }
            }

            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Study Report Check" })
                .eq("proposal_id", submission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";

            const { error: historyError } = await supabase.from("history").insert({
                history_type: "study_report",
                paper_id: submission!.proposal_id,
                comment: "Study report files uploaded",
                actor: actorId,
                affected_files: uploadedUrls.map(url => ({ name: "Study Report", url })),
                action: "Submit Study Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            const updated = refreshed?.find((p: any) => p.proposal_id === submission!.proposal_id);
            if (updated) {
                onSubmissionUpdate(updated as Submission);
            }

            setStudyReportFiles([]);
            setStudyReportUploadOpen(false);

            toast.success("Study report submitted successfully", { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit study report: " + (err.message || err), { id: loadingId });
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

            for (const file of deviationFiles) {
                try {
                    const path = `${submission!.proposal_id}/deviation_reports/${deviationType}/${Date.now()}_${file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('documents')
                        .upload(path, file);

                    if (uploadError) throw uploadError;

                    const { data: signedUrl } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(path, 60 * 60 * 24 * 365);

                    if (signedUrl) {
                        uploadedUrls.push(signedUrl.signedUrl);
                    }
                } catch (uploadErr: any) {
                    throw new Error(`Failed to upload file ${file.name}: ${uploadErr.message}`);
                }
            }

            const { error: statusError } = await supabase
                .from("proposals")
                .update({ status: "Deviation Check" })
                .eq("proposal_id", submission!.proposal_id);

            if (statusError) throw new Error(statusError.message);

            const { data: userData } = await supabase.auth.getUser();
            const actorId = userData?.user?.id || "unknown";


            const { error: historyError } = await supabase.from("history").insert({
                history_type: "deviation_report",
                paper_id: submission!.proposal_id,
                comment: `${deviationType} deviation report submitted`,
                actor: actorId,
                affected_files: uploadedUrls.map(url => ({ name: `${deviationType} Deviation Report`, url })),
                action: "Submit Deviation Report",
                history_date: new Date().toISOString(),
            });

            if (historyError) throw new Error(historyError.message);

            const { data: refreshed } = await supabase.from("proposals").select("*").order("date", { ascending: false });
            const updated = refreshed?.find((p: any) => p.proposal_id === submission!.proposal_id);
            if (updated) {
                onSubmissionUpdate(updated as Submission);
            }

            setDeviationFiles([]);
            setDeviationUploadOpen(false);
            setDeviationType("");

            toast.success(`${deviationType} deviation report submitted successfully`, { id: loadingId });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit deviation report: " + (err.message || err), { id: loadingId });
        }
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteProposal = async () => {
        if (!submission?.proposal_id) return;

        setIsDeleting(true);
        const loadingId = toast.loading("Deleting proposal...");

        try {
            // First, delete all associated files from storage
            const { data: documents } = await supabase
                .from("proposal_documents")
                .select("file_path")
                .eq("proposal_id", submission.proposal_id);

            if (documents && documents.length > 0) {
                const filePaths = documents
                    .filter(doc => doc.file_path)
                    .map(doc => doc.file_path);

                if (filePaths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from("documents")
                        .remove(filePaths);

                    if (storageError) {
                        console.warn("Failed to delete some files:", storageError);
                    }
                }
            }

            // Delete document records
            const { error: docsError } = await supabase
                .from("proposal_documents")
                .delete()
                .eq("proposal_id", submission.proposal_id);

            if (docsError) throw new Error(`Failed to delete document records: ${docsError.message}`);

            // Delete history records
            const { error: historyError } = await supabase
                .from("history")
                .delete()
                .eq("paper_id", submission.proposal_id);

            if (historyError) throw new Error(`Failed to delete history records: ${historyError.message}`);

            // Finally, delete the proposal itself
            const { error: proposalError } = await supabase
                .from("proposals")
                .delete()
                .eq("proposal_id", submission.proposal_id);

            if (proposalError) throw new Error(`Failed to delete proposal: ${proposalError.message}`);

            toast.success("Proposal deleted successfully", { id: loadingId });

            // Redirect to proposals list or refresh the page
            window.location.reload();

        } catch (err: any) {
            console.error("Delete error:", err);
            toast.error("Failed to delete proposal: " + (err.message || err), { id: loadingId });
            setIsDeleting(false);
        }
    };

    // Component to display decision documents from chairperson
    const DecisionDocuments = () => {
        const [decisionDocs, setDecisionDocs] = useState<{ name: string; url: string; type: string }[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchDecisionDocuments = async () => {
                try {
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .list(`${submission.proposal_id}/Decisions`);

                    if (error) {
                        if (!error.message.includes('not found')) {
                            console.error('Error fetching decision documents:', error);
                        }
                        setDecisionDocs([]);
                        setLoading(false);
                        return;
                    }

                    if (!data || data.length === 0) {
                        setDecisionDocs([]);
                        setLoading(false);
                        return;
                    }

                    const docs = await Promise.all(
                        data.map(async (file) => {
                            const { data: signedData, error: signError } = await supabase.storage
                                .from('documents')
                                .createSignedUrl(`${submission.proposal_id}/Decisions/${file.name}`, 60 * 60);

                            if (signError) {
                                console.error('Error creating signed URL:', signError);
                                return null;
                            }

                            const type = file.name.includes('Ethical_Clearance') ? 'ethical_clearance' : 'decision_letter';

                            return {
                                name: file.name,
                                url: signedData.signedUrl,
                                type
                            };
                        })
                    );

                    setDecisionDocs(docs.filter((doc): doc is { name: string; url: string; type: string } => doc !== null));
                    setLoading(false);
                } catch (err) {
                    console.error('Error in fetchDecisionDocuments:', err);
                    setDecisionDocs([]);
                    setLoading(false);
                }
            };

            fetchDecisionDocuments();
        }, [submission.proposal_id]);



        if (loading) return null;
        if (decisionDocs.length === 0) return null;

        return (
            <div className="mb-6 space-y-3">
                {decisionDocs.map((doc, index) => (
                    <div
                        key={index}
                        className={cn(
                            "border rounded-lg p-4 shadow-sm",
                            doc.type === 'ethical_clearance'
                                ? "bg-green-50 border-green-200"
                                : "bg-yellow-50 border-yellow-200"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {doc.type === 'ethical_clearance' ? (
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Pen className="h-5 w-5 text-yellow-600" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {doc.type === 'ethical_clearance'
                                            ? 'Ethical Clearance Received'
                                            : 'Decision Letter Received'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {doc.type === 'ethical_clearance'
                                            ? 'Your proposal has been approved by the chairperson'
                                            : 'Chairperson has requested revisions to your proposal'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onSetPreviewUrl(doc.url);
                                        onSetPreviewTitle(doc.type === 'ethical_clearance' ? 'Ethical Clearance' : 'Decision Letter');
                                        onOpenPreview(true);
                                    }}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                </Button>
                                <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Add dialogs for study report and deviation upload
    return (
        <>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this proposal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>The proposal "{submission.proposal_title}"</li>
                                <li>All uploaded documents and files</li>
                                <li>All history and review records</li>
                            </ul>
                            <p className="mt-3 font-medium text-amber-600">
                                This action is irreversible!
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProposal}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Yes, Delete Proposal"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Show decision documents if available */}
            <DecisionDocuments />

            {isPast && (
                <>
                    <div className="mb-2 text-sm text-gray-600">This phase is completed — view uploaded files below.</div>
                    <PastPhaseFilesList phaseIndex={phaseIndex} />
                </>
            )}

            {isActive && (
                <>
                    {["Check Manuscript", "Forms Check"].includes(submission.status) ? (
                        <PastPhaseFilesList phaseIndex={phaseIndex} />
                    ) : (phaseUploadStatus(phaseIndex) || submission.status === "Revise Proposal") && submission.researcher === userId ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                </div>
                                {/* Delete Button - Only show for the proposal owner */}
                                {submission.researcher === userId && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={isDeleting}
                                        className="flex items-center gap-2 border-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {phaseIndex === 5 && submission.status === "Data Collection" ? (
                                renderDataCollectionActions()
                            ) : (
                                <>
                                    <div
                                        className="mb-2 text-sm text-gray-600"
                                        hidden={!submission.status.includes("Send") && submission.status !== "Revise Proposal"}>
                                        {submission.status === "Revise Proposal"
                                            ? "Review and update documents as needed (all files are optional)"
                                            : "Upload required documents for this phase."}
                                    </div>
                                    {renderPhaseFilesForActive(submission)}
                                </>
                            )}
                        </>
                    ) : phaseHasNoRequiredFiles(phaseIndex, submission) ? (
                        <div className="text-center py-6">
                            <div className="text-sm text-gray-600 mb-4">
                                No files required for this phase.
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">No files required for this phase.</div>
                    )}
                </>
            )}

            {isFuture && <div className="text-gray-500">This phase is not yet available.</div>}

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

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                            <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-3">Drag & drop PDF files here, or click to browse</p>
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files);
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
        </>
    );
}

// Helper functions needed by PhaseContent
const getPhaseDocuments = (submission: Submission): DocumentItem[] => {
    if (submission.status === "Revise Proposal" || submission.status === "Send Revision") {
        const manuscriptDocs = [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: submission.status !== "Revise Proposal", needsSignature: false, needsAnswer: false },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.pdf", required: submission.status !== "Revise Proposal", needsSignature: false, needsAnswer: false },
            { name: "Updated CV", templateUrl: "/templates/cv.pdf", required: submission.status !== "Revise Proposal", needsSignature: false, needsAnswer: false },
            { name: "All Grades", templateUrl: "/templates/grades.pdf", required: submission.status !== "Revise Proposal", needsSignature: false, needsAnswer: false },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: submission.status !== "Revise Proposal", needsSignature: false, needsAnswer: false }
                : null,
        ].filter(Boolean) as DocumentItem[];

        const formsDocs = getFormsDocuments(submission);
        return [...manuscriptDocs, ...formsDocs];
    }

    if (submission.status === "Send Revision") {
        const manuscriptDocs = [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Updated CV", templateUrl: "/templates/cv.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "All Grades", templateUrl: "/templates/grades.pdf", required: true, needsSignature: false, needsAnswer: false },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: true, needsSignature: false, needsAnswer: false }
                : null,
        ].filter(Boolean) as DocumentItem[];

        const formsDocs = getFormsDocuments(submission);
        return [...manuscriptDocs, ...formsDocs];
    }

    if (["Send Manuscript", "Resend Manuscript"].includes(submission.status)) {
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: true, needsSignature: false, needsAnswer: false }
                : null,
        ].filter(Boolean) as DocumentItem[];
    }

    if (["Send Forms", "Resend Forms"].includes(submission.status)) {
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

    const commonFormsDocs: DocumentItem[] = [
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

const phaseUploadStatus = (phaseIndex: number): string | null => {
    if (phaseIndex === 0) return "Send Manuscript";
    if (phaseIndex === 2) return "Send Forms";
    if (phaseIndex === 3) return "Send Revision";
    return null;
};

const getNextStatus = (status: string) => {
    switch (status) {
        case "Send Manuscript": return "Check Manuscript";
        case "Check Manuscript": return "Risk Assessment";
        case "Resend Manuscript": return "Check Manuscript";
        case "Risk Assessment": return "Send Forms";
        case "Send Forms": return "Pending Forms Approval";
        case "Forms Check": return "Deploy Queue";
        case "Resend Forms": return "Pending Forms Approval";
        case "Data Collection": return "Deviation Check";
        case "Send Deviation Report": return "Study Report Check";
        case "Send Study Report": return "Study Report Check";
        case "Send Revision": return "Check Revision";
        default: return status;
    }
};

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