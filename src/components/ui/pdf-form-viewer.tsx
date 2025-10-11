import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import { Input } from './input';
import { Button } from './button';
import { toast } from 'sonner';
import { supabase } from '@/DB';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

// tweak overlay position if needed
export const PLACEHOLDER_OFFSET = { x: 0, y: 0 };

interface PdfFormViewerProps {
    document: string;
    onAnswersSubmit: (answers: Record<string, string>) => void;
    proposalId: number; // Add this
    status: string; // Add this
}

interface DbPlaceholder {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    type: 'text';
}

interface PdfFileRow {
    id: string;
    name: string;
    placeholders: DbPlaceholder[];
}

export function PdfFormViewer({document, 
    onAnswersSubmit, 
    proposalId, 
    status 
}: PdfFormViewerProps)  {
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

    // 🧠 Load saved answers from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`answers_${document}`);
        if (saved) {
            try {
                setAnswers(JSON.parse(saved));
            } catch {
                console.warn('Failed to parse saved answers');
            }
        }
    }, [document]);

    // 🧩 Load PDF metadata and storage URL
    useEffect(() => {
        let mounted = true;
        const prevOverflow = typeof window !== 'undefined' ? window.document.body.style.overflow : '';
        if (typeof window !== 'undefined') window.document.body.style.overflow = 'hidden';

        const load = async () => {
            if (!document) return;
            const docName = document.replace(/\.pdf$/i, '');
            try {
                const { data: row, error } = await supabase
                    .from('pdf_files')
                    .select('id, name, placeholders')
                    .eq('name', docName)
                    .single();

                if (error) throw error;
                const r = row as PdfFileRow;
                if (!mounted) return;
                setPlaceholders(r.placeholders || []);

                // try expected storage paths
                let signedUrl: string | null = null;
                const tryPaths = [`${r.name}.pdf`, r.name];
                for (const p of tryPaths) {
                    const { data: d, error: e } = await supabase.storage.from('documents').createSignedUrl(p, 300);
                    if (!e && d?.signedUrl) {
                        signedUrl = d.signedUrl;
                        break;
                    }
                }

                if (!signedUrl) throw new Error('PDF not found in storage');
                setPdfUrl(signedUrl);
            } catch (err: any) {
                console.error('Failed to load pdf form:', err);
                toast.error('Failed to load PDF form');
            }
        };

        load();

        return () => {
            mounted = false;
            if (typeof window !== 'undefined') window.document.body.style.overflow = prevOverflow;
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
                const ctx = canvas.getContext('2d');
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
                console.error('Render failed', err);
            }
        };

        renderPage();
        return () => {
            cancelled = true;
        };
    }, [pdfUrl, currentPage, pdfDoc]);

    // 💾 Handle Save & Upload
    const handleSubmit = async () => {
        try {
            // check missing fields
            const missing = placeholders
                .filter(p => p.page === currentPage)
                .filter(p => {
                    const v = answers[String(p.id)];
                    return !v || (typeof v === 'string' && v.trim() === '');
                });
            if (missing.length) {
                const names = missing.map(m => m.name).slice(0, 5).join(', ');
                toast.error(`Please fill all required fields on this page: ${names}`);
                return;
            }

            if (!pdfUrl) {
                toast.error("PDF not loaded yet");
                return;
            }

            // fetch original PDF
            const res = await fetch(pdfUrl);
            const arrayBuffer = await res.arrayBuffer();

            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // draw answers
            placeholders.forEach(ph => {
                const value = answers[String(ph.id)];
                if (!value) return;
                const page = pages[ph.page - 1];
                if (!page) return;

                const { height } = page.getSize();
                const x = ph.x * displayScale;
                const y = height - (ph.y * displayScale + ph.height * displayScale);

                page.drawText(value, {
                    x,
                    y,
                    size: 12,
                    font,
                    color: rgb(0, 0, 0),
                });
            });

            // export filled pdf
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

            const formName = document.replace(/\.pdf$/i, '');
            const storagePath = `${proposalId}/${status}/${formName}.pdf`;

            // upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, blob, {
                    upsert: true,
                    contentType: 'application/pdf',
                });

            if (uploadError) {
                console.error('Upload failed:', uploadError);
                toast.error('Failed to upload filled PDF');
                return;
            }

            localStorage.setItem(`answers_${document}`, JSON.stringify(answers));

            toast.success(`Uploaded to ${storagePath}`);
            onAnswersSubmit(answers);
        } catch (err) {
            console.error('Failed to save PDF:', err);
            toast.error('Something went wrong while saving the PDF');
        }
    };

    // 🧱 Placeholders overlay
    const pagePlaceholders = placeholders.filter(p => p.page === currentPage);

    return (
        <div className="absolute inset-0 flex flex-col h-full">
            {/* header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="font-semibold">{document}</div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                        Prev
                    </Button>
                    <div className="text-sm">Page {currentPage} / {numPages}</div>
                    <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))}>
                        Next
                    </Button>
                </div>
            </div>

            {/* pdf viewer */}
            <div ref={scrollRef} className="flex-1 relative bg-gray-100 p-4 overflow-auto">
                <div ref={contentRef} className="relative mx-auto" style={{ width: 'auto', height: 'auto' }}>
                    <canvas ref={canvasRef} className="block border" />
                    {pagePlaceholders.map(ph => (
                        <div
                            key={ph.id}
                            className="absolute pointer-events-auto"
                            style={{
                                left: (ph.x * displayScale * cssScale + PLACEHOLDER_OFFSET.x) + 'px',
                                top: (ph.y * displayScale * cssScale + PLACEHOLDER_OFFSET.y) + 'px',
                                width: (ph.width * displayScale * cssScale) + 'px',
                                height: (ph.height * displayScale * cssScale) + 'px',
                            }}
                        >
                            <Input
                                value={answers[String(ph.id)] || ''}
                                onChange={e => setAnswers(prev => ({ ...prev, [String(ph.id)]: e.target.value }))}
                                className="w-full h-full bg-white/90"
                                placeholder={ph.name}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* footer */}
            <div className="p-4 bg-white border-t flex items-center justify-end gap-2">
                <Button onClick={handleSubmit}>Save & Upload</Button>
            </div>
        </div>
    );
}
