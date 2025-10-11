import { useEffect, useState } from 'react';
import { Card } from './card';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { toast } from 'sonner';
import { supabase } from '@/DB';

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

interface PdfFile {
    id: string;
    name: string;
    placeholders: DbPlaceholder[];
    created_at: string;
    updated_at: string;
}

interface Placeholder {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page?: number;
    type?: string;
}

export function PdfFormViewer({ document, onAnswersSubmit }: PdfFormViewerProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string>();
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const fetchPdfDetails = async () => {
            const documentName = document.replace('.pdf', '');
            toast.info(`Fetching template: ${documentName}`);
            try {
                const { data: pdfFile, error } = await supabase
                    .from('pdf_files')
                    .select('*')
                    .eq('name', documentName)
                    .single();

                if (error) throw error;

                if (pdfFile) {
                    const pdf = pdfFile as PdfFile;

                    // Get signed URL for the PDF file from private documents bucket
                    // Make sure we use the .pdf extension for storage
                    const storagePath = `${pdf.name}.pdf`;

                    toast.info(`Fetching PDF from storage: ${storagePath}`);

                    const { data: signedData, error: signedError } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(`${storagePath}`, 60, {
                            download: false
                        });

                    if (signedError) throw signedError;
                    
                    // Add content-type header through URL parameters
                    const url = new URL(signedData.signedUrl);
                    url.searchParams.append('response-content-type', 'application/pdf');
                    setPdfUrl(url.toString());

                    // Parse and format placeholders
                    const formattedPlaceholders: Placeholder[] = Array.isArray(pdf.placeholders) 
                        ? pdf.placeholders.map((p: DbPlaceholder) => ({
                            id: `${p.id}`,
                            label: p.name,
                            x: p.x,
                            y: p.y,
                            width: p.width,
                            height: p.height,
                            page: p.page,
                            type: p.type
                        })) 
                        : [];
                    
                    setPlaceholders(formattedPlaceholders);
                }
            } catch (err) {
                console.error('Failed to fetch PDF details:', err);
                toast.error('Failed to load PDF form');
            }
        };

        if (document) {
            fetchPdfDetails();
        }
    }, [document]);

    const handleSubmit = async () => {
        // Validate all placeholders have answers
        const hasAllAnswers = placeholders.every(p => answers[p.id]);
        if (!hasAllAnswers) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        try {
            // First, get the PDF file ID
            const { data: pdfFile, error: pdfError } = await supabase
                .from('pdf_files')
                .select('id')
                .eq('name', document)
                .single();

            if (pdfError) throw pdfError;

            // Save the answers
            // const { error: saveError } = await supabase.from('form_answers').insert({
            //     pdf_file_id: pdfFile.id,
            //     answers: answers,
            //     created_at: new Date().toISOString()
            // });

            // if (saveError) throw saveError;

            // Call the onSubmit handler
            onAnswersSubmit(answers);
        } catch (err) {
            console.error('Failed to save form answers:', err);
            toast.error('Failed to save your answers');
        }
    };

    if (!pdfUrl) return <div>Loading...</div>;

    return (
        <div className="relative w-full h-full bg-white">
            {/* PDF Viewer */}
            <div className="absolute inset-0">
                <object 
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full"
                >
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                            Unable to display PDF. Please{" "}
                            <a 
                                href={pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                click here
                            </a>
                            {" "}to download the file.
                        </p>
                    </div>
                </object>
            </div>

            {/* Form Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {placeholders.map(placeholder => (
                    <div
                        key={placeholder.id}
                        className="absolute pointer-events-auto"
                        style={{
                            left: placeholder.x * scale,
                            top: placeholder.y * scale,
                            width: placeholder.width * scale,
                            height: placeholder.height * scale,
                        }}
                    >
                        <Input
                            type="text"
                            value={answers[placeholder.id] || ''}
                            onChange={(e) => {
                                setAnswers(prev => ({
                                    ...prev,
                                    [placeholder.id]: e.target.value
                                }));
                            }}
                            className="w-full h-full bg-white/80 hover:bg-white focus:bg-white"
                            placeholder={placeholder.label}
                        />
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <Card className="absolute top-4 right-4 p-4 space-y-4">
                <div className="space-y-2">
                    <Label>Zoom</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        >
                            -
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScale(1)}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScale(s => Math.min(2, s + 0.1))}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <Button className="w-full" onClick={handleSubmit}>
                    Save Answers
                </Button>
            </Card>
        </div>
    );
}