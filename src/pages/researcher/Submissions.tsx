import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { useState } from "react";
import { toast } from "sonner";
import React from "react";

interface Submission {
    id: string;
    proposal_title: string;
    status: string;
    date: string;
    researcher: string;
}

const RSubmissions = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = React.useRef(false);

    React.useEffect(() => {
        if (!hasFetched.current) {
            setIsLoading(false);
            hasFetched.current = true;
            fetchSubmissions();
        }
    }, [])

    const fetchSubmissions = async () => {
        const loadingToast = toast.loading("Loading Table...");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('proposals')
                .select('*')
                .eq('researcher', user?.id)
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) {
                setSubmissions(data as Submission[]);
                toast.success("Table Loaded");
            }
        } catch (error) {
            toast.error("Failed to load table");
        } finally {
            toast.dismiss(loadingToast);
        }
    };


    const calculateProgress = (status: string) => {
        const stages = ["Manuscript Check", "Risk Assessment", "Forms Check", "Deploy Queue"];
        const currentIndex = stages.indexOf(status);
        return ((currentIndex + 1) / stages.length) * 100;
    };

    return <>
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[30px] font-medium">My Submissions</h1>
                <Button
                    onClick={() => navigate("/ssubm/sub2/prop")}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> New Proposal
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Submission Date</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell className="w-[200px]">
                                        <Skeleton className="h-4 w-full" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-[120px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            submissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell>{submission.proposal_title}</TableCell>
                                    <TableCell>{submission.status}</TableCell>
                                    <TableCell className="w-[200px]">
                                        <Progress value={calculateProgress(submission.status)} className="w-full" />
                                    </TableCell>
                                    <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/ssubm/sub2/view", {
                                                state: { submission }
                                            })}
                                        >
                                            View Progress
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    </>;
};

export default RSubmissions;