import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { useState } from "react";
import { Download } from "lucide-react";

export default function NewProposal() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const manuscriptFile = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement).files?.[0];

        if (!manuscriptFile) {
            toast.error("Please upload a manuscript");
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // First create the proposal
            const { data, error } = await supabase
                .from('proposals')
                .insert([
                    {
                        proposal_title: title,
                        description: description,
                        researcher: user?.id,
                        status: "Manuscript Check",
                        date: new Date().toISOString(),
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Then upload the manuscript
            const fileExt = manuscriptFile.name.split('.').pop();
            const fileName = `manuscript_${data.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('proposals')
                .upload(fileName, manuscriptFile);

            if (uploadError) throw uploadError;

            if (error) throw error;

            toast.success("Proposal created successfully");
            navigate("/ssubm/sub2/view", { state: { submission: data } });
        } catch (error) {
            console.error('Error:', error);
            toast.error("Failed to create proposal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/ssubm/sub2")}
                    className="flex items-center gap-2"
                >
                    ← Back
                </Button>
                <h1 className="text-2xl font-bold">New Proposal</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Proposal Details</CardTitle>
                    <CardDescription>
                        Enter the details of your new research proposal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Proposal Title
                            </label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Enter the title of your proposal"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Briefly describe your research proposal"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="manuscript" className="text-sm font-medium">
                                    Manuscript
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex gap-2"
                                    onClick={() => {/* Add template download handler */}}
                                >
                                    <Download className="h-4 w-4" /> Template
                                </Button>
                            </div>
                            <Input
                                id="manuscript"
                                name="manuscript"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                required
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
                                        toast.error("File size should be less than 10MB");
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <p className="text-sm text-muted-foreground">
                                Upload your manuscript (PDF, DOC, DOCX - Max 10MB)
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/ssubm/sub2")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Proposal"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
