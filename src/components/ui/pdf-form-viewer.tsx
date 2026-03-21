import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { toast } from "sonner";
import { supabase } from "@/DB";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import SignaturePad from "react-signature-canvas";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PLACEHOLDER_OFFSET = { x: 0, y: 0 };

interface PdfFormViewerProps {
    document: string;
    onAnswersSubmit: (answers: Record<string, string>) => void;
    proposalId: number;
    status: string;
}

interface DbPlaceholder {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    type: "text" | "image";
}

interface PdfFileRow {
    id: string;
    name: string;
    placeholders: DbPlaceholder[];
}

const SMALL_FIELD_THRESHOLD = 30;

export function PdfFormViewer({
    document,
    onAnswersSubmit,
    proposalId,
    status,
}: PdfFormViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const [placeholders, setPlaceholders] = useState<DbPlaceholder[]>([]);
    const [pdfDoc, setPdfDoc] = useState<any | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [displayScale, setDisplayScale] = useState<number>(1.5);
    const [cssScale, setCssScale] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitProgress, setSubmitProgress] = useState(0);

    // Signature dialog states
    const [openSig, setOpenSig] = useState(false);
    const [activeSigId, setActiveSigId] = useState<number | null>(null);
    const sigPadRef = useRef<SignaturePad | null>(null);

    // Load saved answers
    useEffect(() => {
        const saved = localStorage.getItem(`answers_${proposalId}_${document}`);
        if (saved) {
            try {
                setAnswers(JSON.parse(saved));
            } catch {
                console.warn("Failed to parse saved answers");
            }
        }
    }, [document, proposalId]);

    // Auto-fill date fields with today's date
    useEffect(() => {
        if (placeholders.length === 0) return;
        
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        setAnswers(prev => {
            const newAnswers = { ...prev };
            let hasChanges = false;
            
            placeholders.forEach(ph => {
                // Check if field name contains "date" (case insensitive) and is not a checkbox
                if (ph.name.toLowerCase().includes('date') && !shouldBeCheckbox(ph) && !prev[String(ph.id)]) {
                    newAnswers[String(ph.id)] = today;
                    hasChanges = true;
                }
            });
            
            return hasChanges ? newAnswers : prev;
        });
    }, [placeholders]);

    // Load PDF metadata + storage URL
    useEffect(() => {
        let mounted = true;
        const prevOverflow =
            typeof window !== "undefined"
                ? window.document.body.style.overflow
                : "";
        if (typeof window !== "undefined")
            window.document.body.style.overflow = "hidden";

        const load = async () => {
            if (!document) return;
            const docName = document.replace(/\.pdf$/i, "");
            try {
                const { data: row, error } = await supabase
                    .from("pdf_files")
                    .select("id, name, placeholders")
                    .eq("name", docName)
                    .single();

                if (error) throw error;
                const r = row as PdfFileRow;
                if (!mounted) return;
                setPlaceholders(r.placeholders || []);

                let signedUrl: string | null = null;
                const tryPaths = [`${r.name}.pdf`, r.name];
                for (const p of tryPaths) {
                    const { data: d, error: e } = await supabase.storage
                        .from("documents")
                        .createSignedUrl(p, 300);
                    if (!e && d?.signedUrl) {
                        signedUrl = d.signedUrl;
                        break;
                    }
                }

                if (!signedUrl) throw new Error("PDF not found in storage");
                setPdfUrl(signedUrl);
                setIsLoading(false);
            } catch (err: any) {
                console.error("Failed to load pdf form:", err);
                toast.error("Failed to load PDF form");
                setIsLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
            if (typeof window !== "undefined")
                window.document.body.style.overflow = prevOverflow;
        };
    }, [document]);

    // Render PDF page
    useEffect(() => {
        if (!pdfUrl || !canvasRef.current) return;
        let cancelled = false;

        const renderPage = async () => {
            try {
                let doc = pdfDoc;
                if (!doc) {
                    const loadingTask = pdfjsLib.getDocument(pdfUrl);
                    doc = await loadingTask.promise;
                    setPdfDoc(doc);
                    setNumPages(doc.numPages || 0);
                }

                if (cancelled) return;

                const pageNum = Math.max(1, Math.min(currentPage, doc.numPages));
                const page = await doc.getPage(pageNum);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                setDisplayScale(scale);

                const canvas = canvasRef.current!;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);

                const renderTask = page.render({ canvasContext: ctx, viewport });
                await renderTask.promise;

                requestAnimationFrame(() => {
                    const clientW = canvas.clientWidth || canvas.width;
                    const ratio = clientW / canvas.width || 1;
                    setCssScale(ratio);

                    canvas.style.width = `${Math.round(canvas.width * ratio)}px`;
                    canvas.style.height = `${Math.round(canvas.height * ratio)}px`;
                    if (contentRef.current) {
                        contentRef.current.style.width = canvas.style.width;
                        contentRef.current.style.height = canvas.style.height;
                    }
                });
            } catch (err) {
                console.error("Render failed", err);
            }
        };

        renderPage();
        return () => {
            cancelled = true;
        };
    }, [pdfUrl, currentPage, pdfDoc]);

    const shouldBeCheckbox = (placeholder: DbPlaceholder): boolean => {
        return placeholder.width < SMALL_FIELD_THRESHOLD && placeholder.height < SMALL_FIELD_THRESHOLD;
    };

    const allFieldsFilled = (): boolean => {
        // Check text fields
        const textFieldsFilled = placeholders.every(placeholder => {
            if (shouldBeCheckbox(placeholder)) {
                return true;
            }
            const value = answers[String(placeholder.id)];
            if (!value || (typeof value === "string" && value.trim() === "")) {
                return false;
            }
            return true;
        });
        
        // Check checkbox groups - at least one checkbox per group must be checked
        const checkboxGroups = new Map<string, DbPlaceholder[]>();
        placeholders.forEach(placeholder => {
            if (shouldBeCheckbox(placeholder)) {
                const groupName = placeholder.name;
                if (!checkboxGroups.has(groupName)) {
                    checkboxGroups.set(groupName, []);
                }
                checkboxGroups.get(groupName)!.push(placeholder);
            }
        });
        
        const checkboxGroupsFilled = Array.from(checkboxGroups.values()).every(group => {
            // At least one checkbox in the group must be checked
            return group.some(checkbox => answers[String(checkbox.id)] === "/");
        });
        
        return textFieldsFilled && checkboxGroupsFilled;
    };

    const getMissingFieldsByPage = (): Record<number, { textFieldGroups: Map<string, number>, checkboxGroupCount: number }> => {
        const missingByPage: Record<number, { textFieldGroups: Map<string, number>, checkboxGroupCount: number }> = {};
        
        // Collect missing text fields and group by name
        placeholders.forEach(placeholder => {
            if (shouldBeCheckbox(placeholder)) {
                return;
            }
            
            const value = answers[String(placeholder.id)];
            if (!value || (typeof value === "string" && value.trim() === "")) {
                if (!missingByPage[placeholder.page]) {
                    missingByPage[placeholder.page] = { textFieldGroups: new Map(), checkboxGroupCount: 0 };
                }
                const currentCount = missingByPage[placeholder.page].textFieldGroups.get(placeholder.name) || 0;
                missingByPage[placeholder.page].textFieldGroups.set(placeholder.name, currentCount + 1);
            }
        });
        
        // Collect unchecked checkbox groups
        const checkboxGroups = new Map<string, DbPlaceholder[]>();
        placeholders.forEach(placeholder => {
            if (shouldBeCheckbox(placeholder)) {
                const groupName = placeholder.name;
                if (!checkboxGroups.has(groupName)) {
                    checkboxGroups.set(groupName, []);
                }
                checkboxGroups.get(groupName)!.push(placeholder);
            }
        });
        
        // Count unchecked groups per page
        checkboxGroups.forEach((group) => {
            const hasChecked = group.some(checkbox => answers[String(checkbox.id)] === "/");
            if (!hasChecked && group.length > 0) {
                const page = group[0].page;
                if (!missingByPage[page]) {
                    missingByPage[page] = { textFieldGroups: new Map(), checkboxGroupCount: 0 };
                }
                missingByPage[page].checkboxGroupCount++;
            }
        });
        
        return missingByPage;
    };

    const handleSubmit = async () => {
        try {
            if (!allFieldsFilled()) {
                toast.error("Please fill all required fields before submitting");
                return;
            }

            if (!pdfUrl) {
                toast.error("PDF not loaded yet");
                return;
            }

            setIsSubmitting(true);
            setSubmitProgress(10);

            const res = await fetch(pdfUrl);
            const arrayBuffer = await res.arrayBuffer();
            setSubmitProgress(30);

            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            setSubmitProgress(50);

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { height } = page.getSize();

                const pageFields = placeholders.filter((ph) => ph.page === i + 1);
                
                for (const ph of pageFields) {
                    // Convert from top-left origin (our storage) to bottom-left origin (pdf-lib)
                    // Our y is distance from top, pdf-lib y is distance from bottom
                    const pdfLibY = height - ph.y - ph.height;
                    
                    const value = answers[String(ph.id)];
                    if (!value) continue;
                    
                    if (ph.type === "text" && !shouldBeCheckbox(ph)) {
                        // Calculate appropriate font size based on box height (min 6, max 10)
                        const fontSize = Math.max(6, Math.min(10, ph.height * 0.6));
                        const maxWidth = ph.width - 10; // Leave padding
                        
                        // Split by manual line breaks first
                        const paragraphs = value.split('\n');
                        const lines: string[] = [];
                        
                        // Process each paragraph for word wrapping
                        paragraphs.forEach(paragraph => {
                            if (!paragraph.trim()) {
                                lines.push(''); // Preserve empty lines
                                return;
                            }
                            
                            const words = paragraph.split(' ');
                            let currentLine = '';
                            
                            words.forEach(word => {
                                const testLine = currentLine ? `${currentLine} ${word}` : word;
                                const textWidth = font.widthOfTextAtSize(testLine, fontSize);
                                
                                if (textWidth <= maxWidth) {
                                    currentLine = testLine;
                                } else {
                                    if (currentLine) lines.push(currentLine);
                                    currentLine = word;
                                }
                            });
                            if (currentLine) lines.push(currentLine);
                        });
                        
                        // Draw each line, starting from top of box
                        const lineHeight = fontSize * 1.2;
                        const maxLines = Math.max(1, Math.floor((ph.height - 10) / lineHeight));
                        const linesToDraw = lines.slice(0, maxLines);
                        
                        linesToDraw.forEach((line, idx) => {
                            const yPos = pdfLibY + ph.height - 5 - (idx * lineHeight) - fontSize;
                            // Only draw if y position is within reasonable bounds
                            if (yPos > pdfLibY) {
                                page.drawText(line, {
                                    x: ph.x + 5,
                                    y: yPos,
                                    size: fontSize,
                                    font,
                                    color: rgb(0, 0, 0),
                                });
                            }
                        });
                    } else if (shouldBeCheckbox(ph) && value === "/") {
                        // For checkboxes, draw X
                        page.drawText("X", {
                            x: ph.x + 5,
                            y: pdfLibY + 5,
                            size: 10,
                            font,
                            color: rgb(0, 0, 0),
                        });
                    } else if (ph.type === "image" && value.startsWith("data:image")) {
                        const imgBytes = await fetch(value).then((r) => r.arrayBuffer());
                        const image = await pdfDoc.embedPng(imgBytes);
                        page.drawImage(image, {
                            x: ph.x + 5,
                            y: pdfLibY,
                            width: ph.width,
                            height: ph.height,
                        });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            setSubmitProgress(70);
            
            const blob = new Blob([new Uint8Array(pdfBytes)], {
                type: "application/pdf",
            });

            const formName = document.replace(/\.pdf$/i, "");
            const transformedStatus = status.replace(/^Resend /, "Send ");
            const storagePath = `${proposalId}/${transformedStatus}/${formName}.pdf`;
            setSubmitProgress(80);

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(storagePath, blob, {
                    upsert: true,
                    contentType: "application/pdf",
                });

            if (uploadError) {
                console.error("Upload failed:", uploadError);
                toast.error("Failed to upload filled PDF");
                setIsSubmitting(false);
                setSubmitProgress(0);
                return;
            }

            setSubmitProgress(100);
            localStorage.setItem(`answers_${proposalId}_${document}`, JSON.stringify(answers));

            toast.success(`Uploaded to ${storagePath}`);
            onAnswersSubmit(answers);
            setIsSubmitting(false);
            setSubmitProgress(0);
        } catch (err) {
            console.error("Failed to save PDF:", err);
            toast.error("Something went wrong while saving the PDF");
            setIsSubmitting(false);
            setSubmitProgress(0);
        }
    };

    const pagePlaceholders = placeholders.filter((p) => p.page === currentPage);
    const missingFieldsByPage = getMissingFieldsByPage();
    const totalMissingFields = Object.values(missingFieldsByPage).reduce(
        (sum, pageData) => sum + pageData.textFieldGroups.size + (pageData.checkboxGroupCount > 0 ? 1 : 0), 
        0
    );

    return (
        <div className="absolute inset-0 flex h-full">
            {/* Validation Sidebar - Always visible when there are missing fields */}
            {totalMissingFields > 0 && (
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                    <div className="p-4 border-b bg-red-50">
                        <h3 className="font-semibold text-red-800">Missing Fields</h3>
                        <p className="text-xs text-red-600 mt-1">
                            {totalMissingFields} field{totalMissingFields !== 1 ? 's' : ''} need{totalMissingFields === 1 ? 's' : ''} to be filled
                        </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {Object.entries(missingFieldsByPage)
                            .sort(([pageA], [pageB]) => Number(pageA) - Number(pageB))
                            .map(([page, pageData]) => {
                                const totalOnPage = pageData.textFieldGroups.size + (pageData.checkboxGroupCount > 0 ? 1 : 0);
                                if (totalOnPage === 0) return null;
                                
                                return (
                                    <div key={page} className="border border-red-200 rounded-lg p-3 bg-red-50/50">
                                        <button
                                            onClick={() => setCurrentPage(Number(page))}
                                            className="font-medium text-sm text-red-800 hover:text-red-900 mb-2 flex items-center gap-2 w-full"
                                        >
                                            <span>Page {page}</span>
                                            <span className="text-xs bg-red-200 px-2 py-0.5 rounded-full">
                                                {totalOnPage}
                                            </span>
                                        </button>
                                        <ul className="space-y-1.5">
                                            {/* Text field groups */}
                                            {Array.from(pageData.textFieldGroups.entries()).map(([fieldName, count]) => (
                                                <li
                                                    key={fieldName}
                                                    className="text-xs text-gray-700 pl-2 border-l-2 border-red-300"
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span>{fieldName}</span>
                                                        {count > 1 && (
                                                            <span className="text-[10px] text-gray-500">({count} fields)</span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                            {/* Checkbox groups summary */}
                                            {pageData.checkboxGroupCount > 0 && (
                                                <li className="text-xs text-gray-700 pl-2 border-l-2 border-orange-400">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-orange-600">☑</span>
                                                        <span>{pageData.checkboxGroupCount} checkbox group{pageData.checkboxGroupCount !== 1 ? 's' : ''} unchecked</span>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-b bg-white gap-2">
                    <div className="font-semibold text-sm sm:text-base truncate w-full sm:w-auto text-center sm:text-left">
                        {document}
                    </div>

                    <div className="flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={16} />
                        </Button>

                        <div className="text-sm min-w-[90px] text-center whitespace-nowrap">
                            Page {currentPage} / {numPages}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
                            onClick={() => setCurrentPage((p) => Math.min(numPages || 1, p + 1))}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!allFieldsFilled() || isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? "Submitting..." : allFieldsFilled() ? "Save & Upload" : `Fill All Fields (${totalMissingFields} missing)`}
                    </Button>
                </div>

                {/* PDF canvas with overlaid inputs */}
                <div ref={scrollRef} className="flex-1 relative bg-gray-100 p-4 overflow-auto">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm z-50">
                            <div className="w-64 space-y-4">
                                <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-500 h-full w-3/4 rounded-full animate-pulse" />
                                </div>
                                <p className="text-center text-gray-600 text-sm">Loading PDF...</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Submission Loading Overlay */}
                    {isSubmitting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50">
                            <div className="w-80 space-y-4 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting Form</h3>
                                    <p className="text-sm text-gray-600 mb-4">Please wait while we process your submission...</p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${submitProgress}%` }}
                                    />
                                </div>
                                <p className="text-center text-xs text-gray-500">{submitProgress}% complete</p>
                            </div>
                        </div>
                    )}
                    <div ref={contentRef} className="relative mx-auto">
                        <canvas ref={canvasRef} className="block border shadow" />

                        {/* Render form fields directly on PDF */}
                        {pagePlaceholders.map((ph) => {
                            const isCheckbox = shouldBeCheckbox(ph);
                            const px = {
                                width: ph.width * displayScale * cssScale,
                                height: ph.height * displayScale * cssScale,
                                x: ph.x * displayScale * cssScale,
                                y: ph.y * displayScale * cssScale,
                            };

                            return (
                                <div
                                    key={ph.id}
                                    style={{
                                        position: "absolute",
                                        left: px.x,
                                        top: px.y,
                                        width: px.width,
                                        height: px.height,
                                    }}
                                >
                                    {ph.type === "text" && !isCheckbox ? (
                                        <Textarea
                                            value={answers[String(ph.id)] || ""}
                                            onChange={(e) =>
                                                setAnswers((prev) => ({
                                                    ...prev,
                                                    [String(ph.id)]: e.target.value,
                                                }))
                                            }
                                            placeholder={ph.name}
                                            readOnly={ph.name.toLowerCase().includes('date')}
                                            className={`w-full h-full p-1 text-sm border-2 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/50 resize-none overflow-hidden ${
                                                ph.name.toLowerCase().includes('date') 
                                                    ? 'border-green-400 cursor-not-allowed' 
                                                    : 'border-blue-400'
                                            }`}
                                            style={{ 
                                                fontSize: `${Math.min(12, Math.max(10, px.height * 0.25))}px`,
                                                lineHeight: '1.2',
                                                minHeight: '100%',
                                                maxHeight: '100%'
                                            }}
                                        />
                                    ) : isCheckbox ? (
                                        <div className="w-full h-full flex items-center justify-center bg-transparent border-2 border-orange-400 rounded">
                                            <Checkbox
                                                checked={answers[String(ph.id)] === "/"}
                                                onCheckedChange={(checked) => {
                                                    // Find all checkboxes with the same name (radio group behavior)
                                                    const sameNameCheckboxes = placeholders.filter(
                                                        p => shouldBeCheckbox(p) && p.name === ph.name
                                                    );
                                                    
                                                    if (sameNameCheckboxes.length > 1) {
                                                        // Radio behavior - only one can be checked at a time
                                                        setAnswers(prev => {
                                                            const newAnswers = { ...prev };
                                                            // Clear all checkboxes with the same name
                                                            sameNameCheckboxes.forEach(p => {
                                                                newAnswers[String(p.id)] = "";
                                                            });
                                                            // Set the clicked one if checking
                                                            if (checked) {
                                                                newAnswers[String(ph.id)] = "/";
                                                            }
                                                            return newAnswers;
                                                        });
                                                    } else {
                                                        // Single checkbox behavior - can toggle on/off
                                                        setAnswers((prev) => ({
                                                            ...prev,
                                                            [String(ph.id)]: checked ? "/" : "",
                                                        }));
                                                    }
                                                }}
                                                className="w-5 h-5"
                                            />
                                        </div>
                                    ) : ph.type === "image" ? (
                                        <div
                                            className={`w-full h-full rounded-md flex items-center justify-center text-xs border-2 cursor-pointer transition ${
                                                answers[String(ph.id)]?.startsWith("data:image")
                                                    ? "bg-transparent border-dashed border-gray-400"
                                                    : "bg-transparent hover:bg-white/50 border-dashed border-purple-400 text-gray-500"
                                            }`}
                                            onClick={() => {
                                                setActiveSigId(ph.id);
                                                setOpenSig(true);
                                            }}
                                        >
                                            {answers[String(ph.id)]?.startsWith("data:image") ? (
                                                <img
                                                    src={answers[String(ph.id)]}
                                                    alt="Signature"
                                                    className="object-contain w-full h-full"
                                                />
                                            ) : (
                                                <span className="italic text-gray-400 select-none">
                                                    Click to sign
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Signature Dialog */}
            <Dialog open={openSig} onOpenChange={setOpenSig}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign here</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-56 border rounded overflow-hidden bg-white">
                        <SignaturePad ref={sigPadRef} canvasProps={{ className: "w-full h-full" }} />
                    </div>
                    <DialogFooter className="flex justify-between mt-2">
                        <Button variant="outline" onClick={() => sigPadRef.current?.clear()}>
                            Clear
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setOpenSig(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!activeSigId) return;
                                    const dataURL = sigPadRef.current?.toDataURL("image/png");
                                    if (dataURL) {
                                        setAnswers((prev) => ({
                                            ...prev,
                                            [String(activeSigId)]: dataURL,
                                        }));
                                    }
                                    setOpenSig(false);
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
