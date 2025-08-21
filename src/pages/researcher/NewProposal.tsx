import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { useState } from "react";

export default function NewProposal() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
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
        <div className="p-8">
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
