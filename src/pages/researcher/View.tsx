import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function SubmissionView() {
    const location = useLocation();
    const navigate = useNavigate();
    const submission = location.state?.submission;
    const [progress, setProgress] = useState(0);

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
        }
    };

    if (!submission) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{submission.proposal_title}</h1>
            
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Progress</h2>
                <Progress value={progress} className="w-full" />
            </div>

            <div className="space-y-6">
                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Manuscript</h3>
                    <Input 
                        type="file" 
                        onChange={(e) => handleFileUpload(e, 'manuscript')}
                        accept=".pdf,.doc,.docx"
                    />
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Payment Receipt</h3>
                    <Input 
                        type="file" 
                        onChange={(e) => handleFileUpload(e, 'receipt')}
                        accept=".pdf,.jpg,.png"
                    />
                </div>
            </div>
        </div>
    );
}
