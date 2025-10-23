import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { Input } from "./input";
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

// Increased threshold - typical checkbox size is around 15-20px, so this should catch most checkboxes
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
    const [debugMode, setDebugMode] = useState(false);
    
    console.log(setDebugMode);

    // Signature dialog states
    const [openSig, setOpenSig] = useState(false);
    const [activeSigId, setActiveSigId] = useState<number | null>(null);
    const sigPadRef = useRef<SignaturePad | null>(null);

    // 🧠 Load saved answers
    useEffect(() => {
        const saved = localStorage.getItem(`answers_${document}`);
        if (saved) {
            try {
                setAnswers(JSON.parse(saved));
            } catch {
                console.warn("Failed to parse saved answers");
            }
        }
    }, [document]);

    // 🧩 Load PDF metadata + storage URL
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
            } catch (err: any) {
                console.error("Failed to load pdf form:", err);
                toast.error("Failed to load PDF form");
            }
        };

        load();

        return () => {
            mounted = false;
            if (typeof window !== "undefined")
                window.document.body.style.overflow = prevOverflow;
        };
    }, [document]);

    // 🖼 Render PDF page
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

    // 🔍 Check if a field should be a checkbox based on size
    const shouldBeCheckbox = (placeholder: DbPlaceholder): boolean => {
        return placeholder.width < SMALL_FIELD_THRESHOLD && placeholder.height < SMALL_FIELD_THRESHOLD;
    };

    // 🔍 Get grouped checkboxes (fields with same name)
    const getCheckboxGroups = () => {
        const groups: Record<string, number[]> = {};
        placeholders.forEach(ph => {
            if (shouldBeCheckbox(ph) && ph.type === "text") {
                if (!groups[ph.name]) {
                    groups[ph.name] = [];
                }
                groups[ph.name].push(ph.id);
            }
        });
        return groups;
    };

    // ✅ Check if all fields are filled (ignores checkboxes)
    const allFieldsFilled = (): boolean => {
        return placeholders.every(placeholder => {
            // Skip checkboxes - they're optional
            if (shouldBeCheckbox(placeholder)) {
                return true;
            }
            
            const value = answers[String(placeholder.id)];
            
            if (!value || (typeof value === "string" && value.trim() === "")) {
                return false;
            }
            
            return true;
        });
    };

    // 🎯 Handle checkbox change (radio button behavior for same names)
    const handleCheckboxChange = (placeholderId: number, placeholderName: string) => {
        const checkboxGroups = getCheckboxGroups();
        const groupIds = checkboxGroups[placeholderName] || [];

        setAnswers(prev => {
            const newAnswers = { ...prev };
            
            // If this is part of a group, uncheck all others in the group
            if (groupIds.length > 1) {
                groupIds.forEach(id => {
                    if (id !== placeholderId) {
                        newAnswers[String(id)] = "";
                    }
                });
            }
            
            // Toggle current checkbox
            const currentValue = prev[String(placeholderId)];
            newAnswers[String(placeholderId)] = currentValue === "/" ? "" : "/";
            
            return newAnswers;
        });
    };

    // 💾 Save & Upload
    const handleSubmit = async () => {
        try {
            // Check if all fields are filled (ignores checkboxes)
            if (!allFieldsFilled()) {
                toast.error("Please fill all required fields before submitting");
                return;
            }

            if (!pdfUrl) {
                toast.error("PDF not loaded yet");
                return;
            }

            const res = await fetch(pdfUrl);
            const arrayBuffer = await res.arrayBuffer();

            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            for (const ph of placeholders) {
                const value = answers[String(ph.id)];
                if (!value) continue;
                const page = pages[ph.page - 1];
                if (!page) continue;

                const { height } = page.getSize();
                const x = ph.x + 5;
                const y = height - (ph.y - ph.height) - 40;

                if (ph.type === "text") {
                    // For checkboxes, draw a checkmark
                    if (shouldBeCheckbox(ph) && value === "/") {
                        page.drawText("/", {
                            x: x + ph.width / 2 - 3, // Center the checkmark
                            y: y + ph.height / 2 - 6,
                            size: 12,
                            font,
                            color: rgb(0, 0, 0),
                        });
                    } else {
                        page.drawText(value, {
                            x,
                            y,
                            size: 10,
                            font,
                            color: rgb(0, 0, 0),
                        });
                    }
                } else if (ph.type === "image" && value.startsWith("data:image")) {
                    const imgBytes = await fetch(value).then((r) => r.arrayBuffer());
                    const image = await pdfDoc.embedPng(imgBytes);
                    page.drawImage(image, {
                        x,
                        y,
                        width: ph.width,
                        height: ph.height,
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], {
                type: "application/pdf",
            });

            const formName = document.replace(/\.pdf$/i, "");
            const storagePath = `${proposalId}/${status}/${formName}.pdf`;

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(storagePath, blob, {
                    upsert: true,
                    contentType: "application/pdf",
                });

            if (uploadError) {
                console.error("Upload failed:", uploadError);
                toast.error("Failed to upload filled PDF");
                return;
            }

            localStorage.setItem(`answers_${document}`, JSON.stringify(answers));

            toast.success(`Uploaded to ${storagePath}`);
            onAnswersSubmit(answers);
        } catch (err) {
            console.error("Failed to save PDF:", err);
            toast.error("Something went wrong while saving the PDF");
        }
    };

    const pagePlaceholders = placeholders.filter(
        (p) => p.page === currentPage
    );

    const checkboxGroups = getCheckboxGroups();

    return (
        <div className="absolute inset-0 flex h-full">
            {/* 🧾 Sidebar with text inputs */}
            <div className="w-80 border-r bg-white flex flex-col">
                <div className="p-4 font-semibold border-b">Form Fields</div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {placeholders
                        .filter((p) => p.type === "text" && p.page === currentPage)
                        .map((ph) => {
                            const isCheckbox = shouldBeCheckbox(ph);
                            const isChecked = answers[String(ph.id)] === "/";
                            const hasSameNameGroup = checkboxGroups[ph.name] && checkboxGroups[ph.name].length > 1;

                            return (
                                <div key={ph.id} className="flex flex-col gap-1">
                                    {isCheckbox ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type={hasSameNameGroup ? "radio" : "checkbox"}
                                                id={`field-${ph.id}`}
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(ph.id, ph.name)}
                                                className="w-4 h-4"
                                            />
                                            <label 
                                                htmlFor={`field-${ph.id}`}
                                                className="text-sm font-medium text-gray-700 cursor-pointer"
                                            >
                                                {ph.name}
                                                {hasSameNameGroup && " (Select one)"}
                                            </label>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="text-sm font-medium text-gray-700">
                                                {ph.name}
                                            </label>
                                            <Input
                                                value={answers[String(ph.id)] || ""}
                                                onChange={(e) =>
                                                    setAnswers((prev) => ({
                                                        ...prev,
                                                        [String(ph.id)]: e.target.value,
                                                    }))
                                                }
                                                placeholder={`Enter ${ph.name}`}
                                                className="w-full"
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                </div>
                <div className="p-4 border-t">
                    <Button 
                        onClick={handleSubmit} 
                        className="w-full"
                        disabled={!allFieldsFilled()}
                    >
                        {allFieldsFilled() ? "Save & Upload" : "Fill All Required Fields to Submit"}
                    </Button>
                    {!allFieldsFilled() && (
                        <p className="text-xs text-red-500 mt-2 text-center">
                            Please fill all required form fields before submitting
                        </p>
                    )}
                </div>
            </div>

            {/* 📄 PDF viewer */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-b bg-white gap-2">
                    {/* 🧾 Document title */}
                    <div className="font-semibold text-sm sm:text-base truncate w-full sm:w-auto text-center sm:text-left">
                        {document}
                    </div>

                    {/* 📄 Page navigation controls */}
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
                </div>

                {/* PDF canvas */}
                <div ref={scrollRef} className="flex-1 relative bg-gray-100 p-4 overflow-auto">
                    <div ref={contentRef} className="relative mx-auto">
                        <canvas ref={canvasRef} className="block border shadow" />

                        {/* ✏️ Render text placeholders as live text */}
                        {pagePlaceholders
                            .filter((p) => p.type === "text")
                            .map((ph) => {
                                const isCheckbox = shouldBeCheckbox(ph);
                                const displayValue = isCheckbox 
                                    ? (answers[String(ph.id)] === "/" ? "/" : "")
                                    : answers[String(ph.id)] || "";

                                return (
                                    <div
                                        key={ph.id}
                                        className={`absolute select-none text-[15px] p-[11.5px] font-bold text-gray-900 font-sans ${debugMode ? "border border-blue-400 bg-blue-50/30" : ""
                                            }`}
                                        style={{
                                            left:
                                                ph.x * displayScale * cssScale + PLACEHOLDER_OFFSET.x + "px",
                                            top:
                                                ph.y * displayScale * cssScale + PLACEHOLDER_OFFSET.y + "px",
                                            width: ph.width * displayScale * cssScale + "px",
                                            height: ph.height * displayScale * cssScale + "px",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {displayValue}
                                    </div>
                                );
                            })}

                        {/* ✍️ Signature placeholders */}
                        {pagePlaceholders
                            .filter((p) => p.type === "image")
                            .map((ph) => (
                                <div
                                    key={ph.id}
                                    className="absolute pointer-events-auto"
                                    style={{
                                        left:
                                            ph.x * displayScale * cssScale + PLACEHOLDER_OFFSET.x + "px",
                                        top:
                                            ph.y * displayScale * cssScale + PLACEHOLDER_OFFSET.y + "px",
                                        width: ph.width * displayScale * cssScale + "px",
                                        height: ph.height * displayScale * cssScale + "px",
                                    }}
                                >
                                    <div
                                        className={`w-full h-full rounded-md flex items-center justify-center text-xs border-dashed border-gray-400 cursor-pointer transition ${answers[String(ph.id)]?.startsWith("data:image")
                                            ? "bg-transparent border-dashed border-gray-400"
                                            : "bg-transparent hover:bg-gray-100 border border-dashed border-gray-400 text-gray-500"
                                            } ${debugMode ? "border border-red-400 bg-red-50/30" : ""}`}
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
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* ✍️ Signature Dialog */}
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