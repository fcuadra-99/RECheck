import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import { Input } from './input';
import { Button } from './button';
import { toast } from 'sonner';
import { supabase } from '@/DB';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

// exported offset you can tweak to nudge placeholder overlays (pixels)
export const PLACEHOLDER_OFFSET = { x: 0, y: 0 };

interface PdfFormViewerProps {
    document: string;
    onAnswersSubmit: (answers: Record<string, string>) => void;
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

export function PdfFormViewer({ document, onAnswersSubmit }: PdfFormViewerProps) {
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

    // load metadata and pdf URL
    useEffect(() => {
        let mounted = true;
    // prevent background scrolling while mounted
    const prevOverflow = typeof window !== 'undefined' ? window.document.body.style.overflow : '';
    if (typeof window !== 'undefined') window.document.body.style.overflow = 'hidden';
        const load = async () => {
            if (!document) return;
            const docName = document.replace(/\.pdf$/i, '');
            toast.info(`Loading form ${docName}`);
            try {
                const { data: row, error } = await supabase.from('pdf_files').select('id, name, placeholders').eq('name', docName).single();
                if (error) throw error;
                const r = row as PdfFileRow;
                if (!mounted) return;
                setPlaceholders(r.placeholders || []);

                // try expected storage paths like `${name}.pdf`
                let signedUrl: string | null = null;
                try {
                    const { data: d, error: e } = await supabase.storage.from('documents').createSignedUrl(`${r.name}.pdf`, 300);
                    if (!e && d?.signedUrl) signedUrl = d.signedUrl;
                } catch (err) {
                    console.debug('signed url failed', err);
                }

                // fallback: try listing root
                if (!signedUrl) {
                    try {
                        const { data: list } = await supabase.storage.from('documents').list('', { limit: 1000 });
                        const found = list?.find((f: any) => f.name === `${r.name}.pdf` || f.name === r.name);
                        if (found) {
                            const { data: d } = await supabase.storage.from('documents').createSignedUrl(found.name, 300);
                            signedUrl = d?.signedUrl ?? null;
                        }
                    } catch (err) {
                        console.debug('list fallback failed', err);
                    }
                }

                if (!signedUrl) throw new Error('PDF file not found in storage');
                // ensure correct content-type for PDF rendering
                try {
                    const url = new URL(signedUrl);
                    if (!url.searchParams.get('response-content-type')) url.searchParams.append('response-content-type', 'application/pdf');
                    signedUrl = url.toString();
                } catch (e) {
                    // ignore
                }
                setPdfUrl(signedUrl);
            } catch (err: any) {
                console.error('Failed to load pdf form:', err);
                toast.error('Failed to load PDF form: ' + (err?.message ?? String(err)));
            }
        };

        load();
        return () => {
            mounted = false;
            if (typeof window !== 'undefined') window.document.body.style.overflow = prevOverflow;
        };
    }, [document]);

    // scrolling now handled by the internal scroll container (scrollRef)

    // render current page into canvas
    useEffect(() => {
        if (!pdfUrl || !canvasRef.current) return;
        let cancelled = false;

        const renderPage = async () => {
            try {
                // load document if not already loaded
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

                // compute cssScale after layout so overlays align when canvas is scaled responsively
                requestAnimationFrame(() => {
                    // compute how the canvas is being displayed (client size / intrinsic size)
                    const clientW = canvas.clientWidth || canvas.width;
                    const ratio = clientW / canvas.width || 1;
                    setCssScale(ratio);

                    // set explicit CSS size on canvas and content wrapper so overlays align
                    try {
                        canvas.style.width = `${Math.round(canvas.width * ratio)}px`;
                        canvas.style.height = `${Math.round(canvas.height * ratio)}px`;
                        if (contentRef.current) {
                            contentRef.current.style.width = canvas.style.width;
                            contentRef.current.style.height = canvas.style.height;
                        }
                    } catch (e) {
                        /* ignore */
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

    const handleSubmit = async () => {
        // require that placeholders on pages have answers (only text placeholders)
        const missing = placeholders.filter(p => !answers[String(p.id)]);
        if (missing.length) {
            toast.error('Please fill all required fields');
            return;
        }

        // save answers to form_answers (optional) and notify parent
        try {
            // find pdf_files id
            const docName = document.replace(/\.pdf$/i, '');
            const { data: row } = await supabase.from('pdf_files').select('id').eq('name', docName).single();
            const pdfFileId = row?.id ?? null;
            if (pdfFileId) {
                const { error } = await supabase.from('form_answers').insert({ pdf_file_id: pdfFileId, answers, created_at: new Date().toISOString() });
                if (error) throw error;
            }
            onAnswersSubmit(answers);
        } catch (err) {
            console.error('Failed to save answers', err);
            toast.error('Failed to save answers');
        }
    };

    // overlay placeholders for current page
    const pagePlaceholders = placeholders.filter(p => p.page === currentPage);

    return (
        <div className="absolute inset-0 flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="font-semibold">{document}</div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                        Prev
                    </Button>
                    <div className="text-sm">Page {currentPage} / {numPages}</div>
                    <Button variant="outline" onClick={() => setCurrentPage((p) => Math.min(numPages || 1, p + 1))}>
                        Next
                    </Button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 relative bg-gray-100 p-4 overflow-auto">
                <div ref={contentRef} className="relative mx-auto" style={{ width: 'auto', height: 'auto' }}>
                    <canvas ref={canvasRef} className="block border" />

                    {/* placeholders overlay inside the sized content wrapper */}
                    {pagePlaceholders.map((ph) => (
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
                                onChange={(e) => setAnswers((prev) => ({ ...prev, [String(ph.id)]: e.target.value }))}
                                className="w-full h-full bg-white/90"
                                placeholder={ph.name}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-white border-t flex items-center justify-end gap-2">
                <Button onClick={handleSubmit}>Save Answers</Button>
            </div>
        </div>
    );
}