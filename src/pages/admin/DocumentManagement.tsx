// MultiPDFAnnotator.tsx
import { useEffect, useRef, useState, type JSX } from "react";
import { Rnd } from "react-rnd";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import {
  Trash2,
  FilePlus,
  Menu,
  Eye,
  RefreshCw,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabase } from "@/DB";
import { toast } from "sonner";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

type BoxType = "text" | "image" | "checkbox" | "radio";

interface Box {
  id: number;
  name: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BoxType;
  group?: string; // For radio buttons - only one per group can be selected
}

interface PDFFile {
  id: string;
  name: string;
  url: string;
  arrayBuffer: ArrayBuffer | null;
  boxes: Box[];
  numPages?: number;
}

export default function MultiPDFAnnotator(): JSX.Element {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayScale, setDisplayScale] = useState(1.5);
  const [cssScale, setCssScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pdfSearch, setPdfSearch] = useState("");
  const [mode, setMode] = useState<"annotate" | "fill">("annotate");
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [gridSnap, setGridSnap] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [selectedFieldType, setSelectedFieldType] = useState<BoxType | "">("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const autosaveTimers = useRef<Record<string, number>>({});

  const activePdf = pdfFiles.find((p) => p.id === activePdfId) ?? null;
  
  // Filter PDFs based on search
  const filteredPdfFiles = pdfFiles.filter((p) =>
    p.name.toLowerCase().includes(pdfSearch.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pdf_files")
          .select("id, name, placeholders")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data || !mounted) return;

        const list = await Promise.all(
          data.map(async (row: any) => {
            const filePath = `${row.name}.pdf`;
            const { data: signedData, error: signedError } = await supabase.storage
              .from("documents")
              .createSignedUrl(filePath, 3600);

            if (signedError) {
              console.warn(`Could not create signed URL for ${filePath}:`, signedError.message);
            }

            // Auto-convert boxes based on size when loading
            const boxes = (row.placeholders as Box[]) ?? [];
            let hasChanges = false;
            const convertedBoxes = boxes.map((box) => {
              // Ensure type exists, default to "text" if missing
              const currentType = box.type || "text";
              let newType = currentType;
              
              // If it's a text box and is small (< 30x30), convert to checkbox
              if (currentType === "text" && box.width < 30 && box.height < 30) {
                newType = "checkbox";
                hasChanges = true;
              }
              // If it's a checkbox and is large (>= 30), convert to text
              else if (currentType === "checkbox" && (box.width >= 30 || box.height >= 30)) {
                newType = "text";
                hasChanges = true;
              }
              
              // If type was missing, that's also a change
              if (!box.type) {
                hasChanges = true;
              }
              
              return { ...box, type: newType as BoxType };
            });

            // Save converted types back to database if there were changes
            if (hasChanges) {
              await supabase
                .from("pdf_files")
                .update({ placeholders: convertedBoxes })
                .eq("id", row.id);
            }

            return {
              id: row.id,
              name: row.name,
              url: signedData?.signedUrl ?? "",
              boxes: convertedBoxes,
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

  useEffect(() => {
    if (!activePdf || !pdfCanvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      setPdfLoading(true);
      setLoadingProgress(0);
      
      try {
        const canvas = pdfCanvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setLoadingProgress(10);

        const loadingTask = pdfjsLib.getDocument(activePdf.url);
        
        // Track loading progress
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          const percent = Math.round((progress.loaded / progress.total) * 50) + 10; // 10-60%
          setLoadingProgress(percent);
        };

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setLoadingProgress(70);

        if (!activePdf.numPages || activePdf.numPages !== pdf.numPages) {
          setPdfFiles((prev) =>
            prev.map((p) => (p.id === activePdf.id ? { ...p, numPages: pdf.numPages } : p))
          );
        }

        const pageNumber = Math.max(1, Math.min(currentPage, pdf.numPages));
        const page = await pdf.getPage(pageNumber);
        
        setLoadingProgress(80);
        
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        setDisplayScale(scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        setLoadingProgress(90);
        
        await page.render({ canvas, viewport }).promise;

        setLoadingProgress(100);

        requestAnimationFrame(() => {
          const clientW = canvas.clientWidth || canvas.width;
          const ratio = clientW / canvas.width;
          setCssScale(ratio || 1);
          setPdfLoading(false);
        });
      } catch (err) {
        console.error("PDF render error:", err);
        setPdfLoading(false);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [activePdfId, currentPage, activePdf?.url]);

  const scheduleAutoSave = (pdf: PDFFile, delay = 700) => {
    const id = pdf.id;
    if (!id) return;

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

  // Helper function to snap to grid
  const snapToGrid = (value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const name = file.name.replace(/\.pdf$/i, "");
      const filePath = `${name}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: insertData, error: insertError } = await supabase
        .from("pdf_files")
        .insert({ name, placeholders: [] })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

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
      toast.error("Upload failed: " + (err?.message ?? String(err)));
    }
  };

  const handleFileReplace = async (pdfId: string, pdfName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfLoading(true);
    setLoadingProgress(0);

    try {
      const filePath = `${pdfName}.pdf`;

      setLoadingProgress(20);

      // Upload the new file (overwrite existing)
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setLoadingProgress(50);

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Update the PDF in state with new URL but keep annotations
      const reader = new FileReader();
      reader.onload = async () => {
        setLoadingProgress(70);
        
        const newArrayBuffer = reader.result instanceof ArrayBuffer ? reader.result : null;
        
        setPdfFiles((prev) =>
          prev.map((p) =>
            p.id === pdfId
              ? {
                  ...p,
                  url: urlData.publicUrl + `?t=${Date.now()}`, // Add timestamp to force reload
                  arrayBuffer: newArrayBuffer,
                  numPages: undefined, // Reset to trigger reload
                }
              : p
          )
        );
        
        setLoadingProgress(90);
        
        // Force reload the PDF if it's currently active
        if (activePdfId === pdfId && newArrayBuffer) {
          const pdf = await pdfjsLib.getDocument({ data: newArrayBuffer }).promise;
          const page = await pdf.getPage(1);
          
          const canvas = pdfCanvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          
          setDisplayScale(scale);
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          
          // Update numPages
          setPdfFiles((prev) =>
            prev.map((p) =>
              p.id === pdfId ? { ...p, numPages: pdf.numPages } : p
            )
          );
          
          setCurrentPage(1);
        }
        
        setLoadingProgress(100);
        setPdfLoading(false);
        toast.success("PDF replaced successfully! Annotations preserved.");
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("replace error:", err);
      toast.error("Replace failed: " + (err?.message ?? String(err)));
      setPdfLoading(false);
      setLoadingProgress(0);
    }
  };

  const addBox = (type: BoxType) => {
    if (!activePdf) return;
    const count = activePdf.boxes.filter((b) => b.type === type).length + 1;

    const newBox: Box = {
      id: Date.now(),
      name: `${type === "text" ? "Textbox" : type === "checkbox" ? "Checkbox" : type === "radio" ? "Radio" : "Signature"} ${count}`,
      page: currentPage,
      x: 60,
      y: 60,
      width: type === "checkbox" || type === "radio" ? 40 : 160,
      height: type === "checkbox" || type === "radio" ? 40 : 60,
      type,
      group: type === "radio" ? `Radio ${count}` : undefined, // Use name as default group
    };

    const updated = { ...activePdf, boxes: [...activePdf.boxes, newBox] };
    setPdfFiles((prev) => prev.map((p) => (p.id === activePdf.id ? updated : p)));
    scheduleAutoSave(updated);
  };

  const updateBox = (id: number, data: Partial<Box>) => {
    if (!activePdf) return;
    
    const updated = {
      ...activePdf,
      boxes: activePdf.boxes.map((b) => {
        if (b.id !== id) return b;
        
        const updatedBox = { ...b, ...data };
        
        // Auto-convert between text and checkbox based on size
        // If it's a text box and becomes small (both width and height < 30), convert to checkbox
        if (updatedBox.type === "text" && updatedBox.width < 30 && updatedBox.height < 30) {
          updatedBox.type = "checkbox";
        }
        // If it's a checkbox and becomes large (either width or height >= 30), convert to text
        else if (updatedBox.type === "checkbox" && (updatedBox.width >= 30 || updatedBox.height >= 30)) {
          updatedBox.type = "text";
        }
        
        return updatedBox;
      }),
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

  const deletePdf = async (id: string, name: string) => {
    if (!confirm("Delete this PDF?")) return;
    try {
      const { error } = await supabase.from("pdf_files").delete().eq("id", id);
      if (error) throw error;

      await supabase.storage.from("documents").remove([`${name}.pdf`]);

      setPdfFiles((prev) => prev.filter((p) => p.id !== id));
      if (activePdfId === id) {
        setActivePdfId(null);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("delete error", err);
      toast.error("Delete failed");
    }
  };

  const confirmRenameFile = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const pdf = pdfFiles.find((p) => p.id === id);
    if (!pdf) return;

    const oldFilePath = `${pdf.name}.pdf`;
    const newFilePath = `${trimmed}.pdf`;

    try {
      const res = await fetch(pdf.url);
      if (!res.ok) throw new Error(`Failed to fetch file for rename`);
      const arrayBuffer = await res.arrayBuffer();
      const fileBlob = new Blob([arrayBuffer], { type: "application/pdf" });

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(newFilePath, fileBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: deleteError } = await supabase.storage
        .from("documents")
        .remove([oldFilePath]);

      if (deleteError) console.warn("Failed to delete old file:", deleteError.message);

      const { error: dbError } = await supabase
        .from("pdf_files")
        .update({ name: trimmed })
        .eq("id", id);

      if (dbError) throw dbError;

      setPdfFiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, name: trimmed, url: `${pdf.url.split(pdf.name)[0]}${trimmed}.pdf` }
            : p
        )
      );
    } catch (err) {
      console.error("rename failed", err);
      toast.error("Rename failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEditingId(null);
    }
  };

  const downloadAnnotatedPdf = async () => {
    if (!activePdf) return;

    try {
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
            // Convert from top-left origin (our storage) to bottom-left origin (pdf-lib)
            // Our y is distance from top, pdf-lib y is distance from bottom
            const pdfLibY = height - box.y - box.height;
            
            // In fill mode, use the filled values; in annotate mode, use field names
            let textToWrite = box.name;
            if (mode === "fill") {
              if (box.type === "text") {
                textToWrite = (formValues[box.id] as string) || "";
              } else if (box.type === "checkbox") {
                textToWrite = (formValues[box.name] as string) === box.id.toString() ? "X" : "";
              } else if (box.type === "radio") {
                textToWrite = (formValues[box.name] as string) === box.id.toString() ? "X" : "";
              }
            }
            
            if (textToWrite && box.type === "text") {
              // Calculate appropriate font size based on box height (min 6, max 10)
              const fontSize = Math.max(6, Math.min(10, box.height * 0.6));
              const maxWidth = box.width - 10; // Leave padding
              
              // Split by manual line breaks first
              const paragraphs = textToWrite.split('\n');
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
              const maxLines = Math.max(1, Math.floor((box.height - 10) / lineHeight));
              const linesToDraw = lines.slice(0, maxLines);
              
              linesToDraw.forEach((line, idx) => {
                const yPos = pdfLibY + box.height - 5 - (idx * lineHeight) - fontSize;
                // Only draw if y position is within reasonable bounds
                if (yPos > pdfLibY) {
                  page.drawText(line, {
                    x: box.x + 5,
                    y: yPos,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                  });
                }
              });
            } else if (textToWrite) {
              // For checkboxes and radio buttons, just draw the X
              page.drawText(textToWrite, {
                x: box.x + 5,
                y: pdfLibY + 5,
                size: 10,
                font,
                color: rgb(0, 0, 0),
              });
            }
          });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "fill" 
        ? `${activePdf.name}_filled.pdf` 
        : `${activePdf.name}_annotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("export error", err);
      toast.error(`Failed to create PDF: ${err.message || err}`);
    }
  };

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

  return (
    <div className="flex h-[90vh] bg-gray-50 mt-5">
      {/* Sidebar - Made even narrower */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-48 bg-white shadow-lg border-r border-gray-200 p-2 space-y-2 transform transition-transform duration-300 z-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-primary">PDFs</h2>
          <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden text-gray-600">
            <Menu size={18} />
          </button>
        </div>

        {/* Upload */}
        <label className="flex items-center justify-center gap-2 px-2 py-2 rounded bg-primary text-white hover:bg-primary/90 cursor-pointer text-sm flex-shrink-0">
          <FilePlus size={14} /> Add PDF
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Search Bar */}
        <div className="relative flex-shrink-0">
          <input
            type="text"
            placeholder="Search PDFs..."
            value={pdfSearch}
            onChange={(e) => setPdfSearch(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* File list - Separate scrollable area */}
        <div className="border-t pt-2 flex-shrink-0">
          <div className="space-y-1 max-h-[25vh] overflow-y-auto">
            {loading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-2 border rounded bg-gray-100 flex justify-between">
                    <div className="h-3 w-20 bg-gray-300 rounded"></div>
                    <div className="h-3 w-3 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </>
            ) : filteredPdfFiles.length === 0 ? (
              <div className="text-xs text-gray-400 italic text-center py-4">
                {pdfSearch ? "No PDFs found" : "No PDFs yet"}
              </div>
            ) : (
              filteredPdfFiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActivePdfId(p.id);
                    setCurrentPage(1);
                  }}
                  className={`p-2 rounded border flex items-center gap-2 cursor-pointer ${
                    p.id === activePdfId ? "bg-primary/10 border-primary" : "hover:bg-gray-100"
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
                      className="border rounded px-2 py-1 text-xs w-full"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate text-xs font-medium"
                        onDoubleClick={(ev) => {
                          ev.stopPropagation();
                          setEditingId(p.id);
                          setEditName(p.name);
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {p.boxes?.length ?? 0} placeholders
                      </div>
                    </div>
                  )}
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    title="Replace PDF"
                  >
                    <RefreshCw size={12} />
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileReplace(p.id, p.name, e)}
                    />
                  </label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePdf(p.id, p.name);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* tools for active PDF */}
        {activePdf && (
          <div className="pt-3 border-t space-y-2 flex-shrink-0">
            {/* --- Mode Toggle --- */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded">
              <button
                onClick={() => setMode("annotate")}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  mode === "annotate"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annotate
              </button>
              <button
                onClick={() => setMode("fill")}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  mode === "fill"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Fill Form
              </button>
            </div>

            {/* --- Tools (only show in annotate mode) --- */}
            {mode === "annotate" && (
              <div className="space-y-1.5">
                {/* Grid Snap Controls */}
                <div className="p-2 bg-gray-50 rounded border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Grid Snap</label>
                    <button
                      onClick={() => setGridSnap(!gridSnap)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        gridSnap
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {gridSnap ? "ON" : "OFF"}
                    </button>
                  </div>
                  {gridSnap && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Size:</label>
                      <input
                        type="number"
                        value={gridSize}
                        onChange={(e) => setGridSize(Math.max(1, parseInt(e.target.value) || 10))}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                        min="1"
                        max="50"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  )}
                </div>

                {/* Add Field Dropdown */}
                <div className="space-y-1">
                  <select
                    value={selectedFieldType}
                    onChange={(e) => setSelectedFieldType(e.target.value as BoxType | "")}
                    className="w-full px-2 py-1.5 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Field Type</option>
                    <option value="text">📝 Text Field</option>
                    <option value="checkbox">☑️ Checkbox</option>
                    <option value="radio">🔘 Radio Button</option>
                    <option value="image">✍️ Signature</option>
                  </select>
                  <button
                    onClick={() => {
                      if (selectedFieldType) {
                        addBox(selectedFieldType as BoxType);
                        setSelectedFieldType(""); // Reset selection
                      }
                    }}
                    disabled={!selectedFieldType}
                    className="w-full px-2 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            )}

            {/* Export button - always visible */}
            <button
              onClick={downloadAnnotatedPdf}
              className="flex items-center justify-center gap-2 px-2 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 w-full text-xs"
            >
              <Eye size={12} /> Export
            </button>
          </div>
        )}

        {/* Placeholders - Separate scrollable area */}
        {activePdf && (
          <div className="border-t pt-2 flex-1 min-h-0 flex flex-col">
            <div className="text-[10px] uppercase text-gray-500 mb-1.5 font-semibold flex-shrink-0">
              Page {currentPage} Placeholders
            </div>
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
              {activePdf.boxes.filter((b) => b.page === currentPage).length === 0 && (
                <div className="text-[10px] text-gray-400 italic">No placeholders on this page.</div>
              )}
              {activePdf.boxes
                .filter((b) => b.page === currentPage)
                .map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
                      b.type === "text" ? "border-l-2 border-blue-500" : b.type === "checkbox" ? "border-l-2 border-orange-500" : "border-l-2 border-purple-500"
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
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="border rounded px-1.5 py-0.5 text-[10px] w-full"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex-1 truncate text-[10px] text-gray-700"
                        onDoubleClick={(ev) => {
                          ev.stopPropagation();
                          setEditingId(`${activePdf.id}-${b.id}`);
                          setEditName(b.name);
                        }}
                        title={`${b.name} (double-click to edit)`}
                      >
                        {b.name}
                      </div>
                    )}
                    <button
                      onClick={() => deleteBox(b.id)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                      title="Delete box"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
            </div>
            
            {/* Other pages summary */}
            {activePdf.numPages && activePdf.numPages > 1 && (
              <div className="mt-2 pt-2 border-t flex-shrink-0">
                <div className="text-[10px] uppercase text-gray-500 mb-1 font-semibold">Other Pages</div>
                <div className="space-y-0.5 max-h-[15vh] overflow-y-auto">
                  {Array.from({ length: activePdf.numPages }, (_, i) => i + 1)
                    .filter((pageNum) => pageNum !== currentPage)
                    .map((pageNum) => {
                      const count = activePdf.boxes.filter((b) => b.page === pageNum).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-[10px] text-gray-600 flex justify-between items-center"
                        >
                          <span>Page {pageNum}</span>
                          <span className="text-gray-400">{count} placeholder{count !== 1 ? 's' : ''}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Viewer */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-y-auto z-0">
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
            <div className="h-full flex items-center justify-center text-gray-400 text-lg">
              Drop or upload a PDF
            </div>
          ) : (
            <div className="relative inline-block">
              <canvas 
                ref={pdfCanvasRef} 
                style={{ 
                  display: "block", 
                  maxWidth: "100%",
                  opacity: pdfLoading ? 0.3 : 1,
                  transition: "opacity 0.3s ease"
                }} 
              />

              {/* Loading overlay */}
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Loading PDF... {loadingProgress}%
                    </div>
                  </div>
                </div>
              )}

              {/* render placeholders for current page - only show when not loading */}
              {!pdfLoading && activePdf.boxes
                .filter((b) => b.page === currentPage)
                .map((b) => {
                  const px = {
                    width: b.width * displayScale * cssScale,
                    height: b.height * displayScale * cssScale,
                    x: b.x * displayScale * cssScale,
                    y: b.y * displayScale * cssScale,
                  };

                  const isEditingThisBox = editingId === `canvas-${activePdf.id}-${b.id}`;

                  // Fill mode - render interactive inputs
                  if (mode === "fill") {
                    return (
                      <div
                        key={b.id}
                        style={{
                          position: "absolute",
                          left: px.x,
                          top: px.y,
                          width: px.width,
                          height: px.height,
                        }}
                      >
                        {b.type === "text" ? (
                          <textarea
                            placeholder={b.name}
                            value={(formValues[b.id] as string) || ""}
                            onChange={(e) => setFormValues({ ...formValues, [b.id]: e.target.value })}
                            className="w-full h-full px-2 py-1 text-sm border border-blue-400 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/50 resize-none"
                            style={{ fontSize: `${Math.max(10, px.height * 0.4)}px` }}
                          />
                        ) : b.type === "checkbox" ? (
                          <div className="w-full h-full flex items-center justify-center bg-transparent border border-orange-400 rounded">
                            <input
                              type="checkbox"
                              checked={(formValues[b.name] as string) === b.id.toString()}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // If checking, set this checkbox as the selected one for this name
                                  setFormValues({ ...formValues, [b.name]: b.id.toString() });
                                } else {
                                  // If unchecking, clear the selection for this name
                                  setFormValues({ ...formValues, [b.name]: "" });
                                }
                              }}
                              className="w-4 h-4 cursor-pointer"
                              style={{ 
                                width: `${Math.min(px.width * 0.8, px.height * 0.8)}px`,
                                height: `${Math.min(px.width * 0.8, px.height * 0.8)}px`
                              }}
                            />
                          </div>
                        ) : b.type === "radio" ? (
                          <div className="w-full h-full flex items-center justify-center bg-transparent border border-pink-400 rounded-full">
                            <input
                              type="radio"
                              name={b.name} // Use name as the group
                              checked={(formValues[b.name] as string) === b.id.toString()}
                              onChange={() => setFormValues({ ...formValues, [b.name]: b.id.toString() })}
                              className="w-4 h-4 cursor-pointer"
                              style={{ 
                                width: `${Math.min(px.width * 0.8, px.height * 0.8)}px`,
                                height: `${Math.min(px.width * 0.8, px.height * 0.8)}px`
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-transparent border-2 border-dashed border-purple-400 rounded text-xs text-purple-600">
                            Signature
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Annotate mode - render draggable boxes
                  return (
                    <Rnd
                      key={b.id}
                      bounds="parent"
                      size={{ width: px.width, height: px.height }}
                      position={{ x: px.x, y: px.y }}
                      dragGrid={gridSnap ? [gridSize * displayScale * cssScale, gridSize * displayScale * cssScale] : undefined}
                      resizeGrid={gridSnap ? [gridSize * displayScale * cssScale, gridSize * displayScale * cssScale] : undefined}
                      onDragStop={(_, d) =>
                        updateBox(b.id, {
                          x: snapToGrid(d.x / (displayScale * cssScale)),
                          y: snapToGrid(d.y / (displayScale * cssScale)),
                        })
                      }
                      onResizeStop={(_, __, ref, ___, pos) =>
                        updateBox(b.id, {
                          width: snapToGrid(parseInt(ref.style.width, 10) / (displayScale * cssScale)),
                          height: snapToGrid(parseInt(ref.style.height, 10) / (displayScale * cssScale)),
                          x: snapToGrid(pos.x / (displayScale * cssScale)),
                          y: snapToGrid(pos.y / (displayScale * cssScale)),
                        })
                      }
                      className={`absolute border-2 rounded-md ${
                        b.type === "text"
                          ? "border-blue-500 bg-blue-100/60"
                          : b.type === "checkbox"
                          ? "border-orange-500 bg-orange-100/60"
                          : b.type === "radio"
                          ? "border-pink-500 bg-pink-100/60"
                          : "border-purple-500 bg-purple-100/60"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs px-2 py-1 font-semibold text-gray-700 h-full">
                        {isEditingThisBox ? (
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
                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            className="border rounded px-1 py-0.5 text-xs w-full bg-white"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span 
                            className="truncate flex-1 cursor-text" 
                            title={`${b.name} (double-click to edit)`}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingId(`canvas-${activePdf.id}-${b.id}`);
                              setEditName(b.name);
                            }}
                          >
                            {b.name}
                          </span>
                        )}
                        <button
                          className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBox(b.id);
                          }}
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
