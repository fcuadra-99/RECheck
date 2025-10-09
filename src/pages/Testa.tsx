// MultiPDFAnnotator.tsx
import { useEffect, useRef, useState, type JSX } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import {
    Trash2,
    Image as ImageIcon,
    FilePlus,
    Menu,
    Eye,
    Text,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabase } from "@/DB"; // <-- your Supabase client

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

type BoxType = "text" | "image";

interface Box {
    id: number;
    name: string;
    page: number;
    x: number; // stored in PDF coordinates (top-left origin)
    y: number; // stored in PDF coordinates (top-left origin)
    width: number; // stored in PDF units (same coordinate space as page)
    height: number;
    type: BoxType;
}

interface PDFFile {
    id: string;
    name: string; // display name stored in DB
    url: string; // public URL to PDF in storage
    arrayBuffer: ArrayBuffer | null; // optional local copy
    boxes: Box[]; // placeholders (from DB)
    numPages?: number;
}

export default function MultiPDFAnnotator(): JSX.Element {
    // app state
    const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
    const [activePdfId, setActivePdfId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);


    const [displayScale, setDisplayScale] = useState(1.5); // viewport/canvas render scale
    const [cssScale, setCssScale] = useState(1); // CSS downscale factor (client vs intrinsic canvas size)


    // inline rename state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // refs
    const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const autosaveTimers = useRef<Record<string, number>>({}); // per-file autosave timers

    const activePdf = pdfFiles.find((p) => p.id === activePdfId) ?? null;




    // -------------------------
    // Load list of PDFs from DB
    // -------------------------
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // fetch id, name, placeholders
                const { data, error } = await supabase
                    .from("pdf_files")
                    .select("id, name, placeholders")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                if (!data || !mounted) return;

                // map rows to PDFFile objects (get signed URL for each file)
                const list = await Promise.all(
                    data.map(async (row: any) => {
                        const filePath = `${row.name}.pdf`;

                        // create a signed URL valid for 1 hour (3600 seconds)
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from("documents")
                            .createSignedUrl(filePath, 3600);

                        if (signedError) {
                            console.warn(`Could not create signed URL for ${filePath}:`, signedError.message);
                        }

                        return {
                            id: row.id,
                            name: row.name,
                            url: signedData?.signedUrl ?? "",
                            boxes: (row.placeholders as Box[]) ?? [],
                            arrayBuffer: null,
                        } as PDFFile;
                    })
                );

                if (!mounted) return;
                setPdfFiles(list);
            } catch (err) {
                console.error("Failed to load pdf_files:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
            Object.values(autosaveTimers.current).forEach((t) => clearTimeout(t));
        };
    }, []);


    // ----------------------------------------
    // Render active PDF page into canvas
    // ----------------------------------------
    useEffect(() => {
        if (!activePdf || !pdfCanvasRef.current) return;

        let cancelled = false;

        const render = async () => {
            try {
                const canvas = pdfCanvasRef.current!;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const loadingTask = pdfjsLib.getDocument(activePdf.url);
                const pdf = await loadingTask.promise;
                if (cancelled) return;

                if (!activePdf.numPages || activePdf.numPages !== pdf.numPages) {
                    setPdfFiles(prev => prev.map(p => p.id === activePdf.id ? { ...p, numPages: pdf.numPages } : p));
                }

                const pageNumber = Math.max(1, Math.min(currentPage, pdf.numPages));
                const page = await pdf.getPage(pageNumber);

                const scale = 1.5; // your chosen zoom level
                const viewport = page.getViewport({ scale });

                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);

                // ✅ Save scale for overlay alignment
                setDisplayScale(scale);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvas, viewport }).promise;

                // After render/layout, compute CSS scale (handles responsive shrink via max-width)
                requestAnimationFrame(() => {
                    const clientW = canvas.clientWidth || canvas.width;
                    const ratio = clientW / canvas.width;
                    setCssScale(ratio || 1);
                });
            } catch (err) {
                console.error("PDF render error:", err);
            }
        };

        render();

        return () => {
            cancelled = true;
        };
    }, [activePdfId, currentPage, activePdf?.url]);



    // ------------------------------------------------
    // helper: schedule autosave (debounced per file)
    // ------------------------------------------------
    const scheduleAutoSave = (pdf: PDFFile, delay = 700) => {
        const id = pdf.id;
        if (!id) return;
        // clear any existing timer
        const prev = autosaveTimers.current[id];
        if (prev) window.clearTimeout(prev);
        const t = window.setTimeout(async () => {
            try {
                const { error } = await supabase
                    .from("pdf_files")
                    .update({ placeholders: pdf.boxes })
                    .eq("id", id);
                if (error) console.error("autosave error", error);
            } catch (err) {
                console.error("autosave threw", err);
            } finally {
                delete autosaveTimers.current[id];
            }
        }, delay);
        autosaveTimers.current[id] = t;
    };

    // ------------------------------------------------
    // Create DB record + upload file to storage
    // ------------------------------------------------
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;


        try {
            const name = file.name.replace(/\.pdf$/i, "");
            const filePath = `${name}.pdf`;

            // upload to storage (documents bucket)
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // create DB row
            const { data: insertData, error: insertError } = await supabase
                .from("pdf_files")
                .insert({ name, placeholders: [] })
                .select()
                .single();

            if (insertError) throw insertError;

            // get public URL
            const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

            // create local PDFFile object
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    const newPdf: PDFFile = {
                        id: insertData.id,
                        name,
                        url: urlData.publicUrl,
                        arrayBuffer: reader.result,
                        boxes: [],
                        numPages: undefined,
                    };
                    setPdfFiles((prev) => [newPdf, ...prev]);
                    setActivePdfId(newPdf.id);
                    setCurrentPage(1);
                } else {
                    // fallback - still add without arrayBuffer
                    const newPdf: PDFFile = {
                        id: insertData.id,
                        name,
                        url: urlData.publicUrl,
                        arrayBuffer: null,
                        boxes: [],
                        numPages: undefined,
                    };
                    setPdfFiles((prev) => [newPdf, ...prev]);
                    setActivePdfId(newPdf.id);
                    setCurrentPage(1);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err: any) {
            console.error("upload/create error:", err);
            alert("Upload failed: " + (err?.message ?? String(err)));
        } finally {

            // clear file input value if any (not shown here)
        }
    };

    // ------------------------------------------------
    // Add / update / delete box helpers (they schedule autosave)
    // ------------------------------------------------
    const addBox = (type: BoxType) => {
        if (!activePdf) return;
        const count = activePdf.boxes.filter((b) => b.type === type).length + 1;
        // we store coordinates in PDF coordinate system with top-left origin (match our usage)
        const newBox: Box = {
            id: Date.now(),
            name: `${type === "text" ? "Textbox" : "Image"} ${count}`,
            page: currentPage,
            x: 60, // PDF units (approx)
            y: 60,
            width: 160,
            height: 60,
            type,
        };
        const updated = { ...activePdf, boxes: [...activePdf.boxes, newBox] };
        setPdfFiles((prev) => prev.map((p) => (p.id === activePdf.id ? updated : p)));
        scheduleAutoSave(updated);
    };

    const updateBox = (id: number, data: Partial<Box>) => {
        if (!activePdf) return;
        const updated = {
            ...activePdf,
            boxes: activePdf.boxes.map((b) => (b.id === id ? { ...b, ...data } : b)),
        };
        setPdfFiles((prev) => prev.map((p) => (p.id === activePdf.id ? updated : p)));
        scheduleAutoSave(updated);
    };

    const deleteBox = (id: number) => {
        if (!activePdf) return;
        const updated = { ...activePdf, boxes: activePdf.boxes.filter((b) => b.id !== id) };
        setPdfFiles((prev) => prev.map((p) => (p.id === activePdf.id ? updated : p)));
        scheduleAutoSave(updated);
    };

    // ------------------------------------------------
    // Delete PDF (DB row + storage object)
    // ------------------------------------------------
    const deletePdf = async (id: string, name: string) => {
        if (!confirm("Delete this PDF?")) return;
        try {
            const { error } = await supabase.from("pdf_files").delete().eq("id", id);
            if (error) throw error;
            // remove object from storage
            await supabase.storage.from("documents").remove([`${name}.pdf`]);
            setPdfFiles((prev) => prev.filter((p) => p.id !== id));
            if (activePdfId === id) {
                setActivePdfId(null);
                setCurrentPage(1);
            }
        } catch (err) {
            console.error("delete error", err);
            alert("Delete failed");
        }
    };

    // ------------------------------------------------
    // Rename DB filename (display name). This DOES NOT move the storage object.
    // If you want storage rename, we can add a copy+delete flow, but it's optional.
    // ------------------------------------------------
    const confirmRenameFile = async (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        const pdf = pdfFiles.find((p) => p.id === id);
        if (!pdf) return;

        const oldFilePath = `${pdf.name}.pdf`;
        const newFilePath = `${trimmed}.pdf`;

        try {
            // 1. Fetch the old file
            const res = await fetch(pdf.url);
            if (!res.ok) throw new Error(`Failed to fetch file for rename`);
            const arrayBuffer = await res.arrayBuffer();
            const fileBlob = new Blob([arrayBuffer], { type: "application/pdf" });

            // 2. Upload as new file (upsert just in case)
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(newFilePath, fileBlob, { upsert: true });
            if (uploadError) throw uploadError;

            // 3. Delete old file
            const { error: deleteError } = await supabase.storage
                .from("documents")
                .remove([oldFilePath]);
            if (deleteError) console.warn("Failed to delete old file:", deleteError.message);

            // 4. Update DB record
            const { error: dbError } = await supabase
                .from("pdf_files")
                .update({ name: trimmed })
                .eq("id", id);
            if (dbError) throw dbError;

            // 5. Update local state
            setPdfFiles((prev) =>
                prev.map((p) =>
                    p.id === id
                        ? { ...p, name: trimmed, url: `${pdf.url.split(pdf.name)[0]}${trimmed}.pdf` }
                        : p
                )
            );
        } catch (err) {
            console.error("rename failed", err);
            alert("Rename failed: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setEditingId(null);
        }
    };


    // ------------------------------------------------
    // Save annotations into a new PDF (pdf-lib) and download
    // - We assume box coordinates are stored in PDF coordinate space with top-left origin.
    // - pdf-lib uses bottom-left origin; convert accordingly:
    //    pdf-lib-y = pageHeight - (box.y + box.height)
    // ------------------------------------------------
    const downloadAnnotatedPdf = async () => {
        if (!activePdf) return;
        try {
            // fetch original PDF from Supabase
            const res = await fetch(activePdf.url);
            if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
            const arrayBuffer = await res.arrayBuffer();

            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { height } = page.getSize();

                activePdf.boxes
                    .filter((b) => b.page === i + 1)
                    .forEach((box) => {
                        page.drawText(box.name, {
                            x: box.x + 5,
                            y: height - (box.y - box.height) - 40,
                            size: 10,
                            font,
                            color: rgb(0, 0, 0),
                        });
                    });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${activePdf.name}_annotated.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("export error", err);
            alert("Failed to create annotated PDF");
        }
    };


    // -------------------------
    // helpers for rendering Rnd: convert PDF units -> canvas px, and back
    // -------------------------
    // helpers retained for clarity but not used directly after refactor
    // const toPx = (value: number) => Math.round(value * displayScale * cssScale);
    // const fromPx = (value: number) => value / (displayScale * cssScale);

    // Keep cssScale in sync with canvas size changes (responsive)
    useEffect(() => {
        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const ro = new ResizeObserver(() => {
            const clientW = canvas.clientWidth || canvas.width;
            const ratio = clientW / canvas.width;
            setCssScale(ratio || 1);
        });
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [pdfCanvasRef.current]);

    // -------------------------
    // UI
    // -------------------------
    return (
        <div className="flex h-[90vh] bg-gray-50 mt-5">
            {/* Sidebar */}
            <div
                className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 p-4 space-y-4 transform transition-transform duration-300 z-30 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0`}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-primary">PDF Manager</h2>
                    <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden text-gray-600">
                        <Menu size={20} />
                    </button>
                </div>

                {/* Upload */}
                <label className="flex items-center gap-2 px-3 py-2 rounded bg-primary text-white hover:bg-primary/90 cursor-pointer">
                    <FilePlus size={16} /> Add PDF
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                </label>

                {/* File list */}
                <div className="space-y-2 border-t pt-2 overflow-y-auto" style={{ maxHeight: "55vh" }}>
                    {loading ? (
                        <>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse p-2 border rounded bg-gray-100 flex justify-between">
                                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                                </div>
                            ))}
                        </>
                    ) : (
                        pdfFiles.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    setActivePdfId(p.id);
                                    setCurrentPage(1);
                                }}
                                className={`p-2 rounded border flex items-center gap-2 cursor-pointer ${p.id === activePdfId ? "bg-primary/10 border-primary" : "hover:bg-gray-100"
                                    }`}
                            >
                                {editingId === p.id ? (
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => confirmRenameFile(p.id, editName)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                        }}
                                        className="border rounded px-2 py-1 text-sm w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className="truncate text-sm"
                                            onDoubleClick={(ev) => {
                                                ev.stopPropagation();
                                                setEditingId(p.id);
                                                setEditName(p.name);
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                        <div className="text-xs text-gray-400">{"Placeholders: " + (p.boxes?.length ?? 0)}</div>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePdf(p.id, p.name);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* tools for active PDF */}
                {activePdf && (
                    <div className="pt-4 border-t space-y-3">
                        {/* --- Tools --- */}
                        <div className="space-y-2">
                            <button
                                onClick={() => addBox("text")}
                                className="flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full"
                            >
                                <Text size={16} /> Add Text
                            </button>
                            <button
                                onClick={() => addBox("image")}
                                className="flex items-center gap-2 px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 w-full"
                            >
                                <ImageIcon size={16} /> Add Image
                            </button>
                            <button
                                onClick={downloadAnnotatedPdf}
                                className="flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 w-full"
                            >
                                <Eye size={16} /> Export Annotated
                            </button>
                        </div>

                        {/* --- Box list --- */}
                        <div className="mt-4 border-t pt-3 space-y-1 max-h-[30vh] overflow-y-auto">
                            <div className="text-xs uppercase text-gray-500 mb-1">Placeholders</div>

                            {activePdf.boxes.length === 0 && (
                                <div className="text-xs text-gray-400 italic">No placeholders yet.</div>
                            )}

                            {activePdf.boxes.map((b) => (
                                <div
                                    key={b.id}
                                    className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${b.type === "text" ? "border-l-2 border-primary" : "border-l-2 border-purple-500"
                                        }`}
                                >
                                    {editingId === `${activePdf.id}-${b.id}` ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => {
                                                const updated = {
                                                    ...activePdf,
                                                    boxes: activePdf.boxes.map((x) =>
                                                        x.id === b.id ? { ...x, name: editName } : x
                                                    ),
                                                };
                                                setPdfFiles((prev) =>
                                                    prev.map((p) => (p.id === activePdf.id ? updated : p))
                                                );
                                                scheduleAutoSave(updated);
                                                setEditingId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                            }}
                                            className="border rounded px-2 py-1 text-xs w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="flex-1 truncate text-xs text-gray-700"
                                            onDoubleClick={(ev) => {
                                                ev.stopPropagation();
                                                setEditingId(`${activePdf.id}-${b.id}`);
                                                setEditName(b.name);
                                            }}
                                        >
                                            {b.name}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => deleteBox(b.id)}
                                        className="text-red-500 hover:text-red-700 ml-2"
                                        title="Delete box"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Viewer */}
            <div className="flex-1 flex flex-col bg-gray-100 overflow-y-auto z-10">
                {activePdf && activePdf.numPages && (
                    <div className="sticky top-0 z-20 bg-white border-b py-2 flex justify-center items-center gap-4 shadow-sm">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            ← Prev
                        </button>
                        <span className="text-sm font-semibold text-gray-700">
                            Page {currentPage} of {activePdf.numPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(activePdf.numPages ?? 1, p + 1))}
                            disabled={currentPage >= (activePdf.numPages ?? 1)}
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Next →
                        </button>
                    </div>
                )}

                <div className="flex-1 flex justify-center p-4">
                    {!activePdf ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-lg">Drop or upload a PDF</div>
                    ) : (
                        <div className="relative inline-block">
                            <canvas ref={pdfCanvasRef} style={{ display: "block", maxWidth: "100%" }} />

                            {/* render placeholders for current page */}
                            {activePdf.boxes
                                .filter((b) => b.page === currentPage)
                                .map((b) => {
                                    const px = {
                                        width: b.width * displayScale * cssScale,
                                        height: b.height * displayScale * cssScale,
                                        x: b.x * displayScale * cssScale,
                                        y: b.y * displayScale * cssScale,
                                    };
                                    return (
                                        <Rnd
                                            key={b.id}
                                            bounds="parent"
                                            size={{ width: px.width, height: px.height }}
                                            position={{ x: px.x, y: px.y }}
                                            onDragStop={(_, d) =>
                                                updateBox(b.id, {
                                                    x: d.x / (displayScale * cssScale),
                                                    y: d.y / (displayScale * cssScale),
                                                })
                                            }
                                            onResizeStop={(_, __, ref, ___, pos) =>
                                                updateBox(b.id, {
                                                    width: parseInt(ref.style.width, 10) / (displayScale * cssScale),
                                                    height: parseInt(ref.style.height, 10) / (displayScale * cssScale),
                                                    x: pos.x / (displayScale * cssScale),
                                                    y: pos.y / (displayScale * cssScale),
                                                })
                                            }
                                            className={`absolute border-2 rounded-md ${b.type === "text"
                                                ? "border-blue-500 bg-blue-100/60"
                                                : "border-purple-500 bg-purple-100/60"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center text-xs px-2 py-1 font-semibold text-gray-700">
                                                <span className="truncate" title={b.name}>
                                                    {b.name}
                                                </span>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => deleteBox(b.id)}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </Rnd>
                                    );
                                })}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
