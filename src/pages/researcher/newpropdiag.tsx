"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
    role?: string | null;
    email?: string | null;
}

interface NewProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profiles: Profile[];
    userId: string | null;
    onProposalCreated: (proposal: any) => void;
}

export default function NewProposalDialog({ 
    open, 
    onOpenChange, 
    profiles, 
    onProposalCreated 
}: NewProposalDialogProps) {
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>("");
    const [advisors, setAdvisors] = useState<Profile[]>([]);

    // Fetch advisors and admins when dialog opens
    useEffect(() => {
        if (open) {
            fetchAdvisors();
        }
    }, [open]);

    const fetchAdvisors = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, fname, lname, role, email")
                .in("role", ["Advisor", "Admin"])
                .order("lname", { ascending: true });

            if (error) throw error;
            setAdvisors(data || []);
        } catch (err) {
            console.error("Failed to fetch advisors:", err);
            toast.error("Failed to load advisors");
        }
    };

    const handleCreateProposal = async () => {
        if (!newProposalTitle.trim()) return toast.error("Title is required");
        if (!selectedAdvisorId) return toast.error("Please select an advisor");
        
        const loading = toast.loading("Creating proposal...");
        try {
            const { data: userData } = await supabase.auth.getUser();
            const uid = userData?.user?.id;
            if (!uid) throw new Error("Not logged in");
            const userProfile = profiles.find((p) => p.id === uid);
            const category = userProfile?.category || "Undergraduate";

            const { data: proposal, error } = await supabase
                .from("proposals")
                .insert([
                    {
                        proposal_title: newProposalTitle,
                        category,
                        status: "Pending Advisor Approval",
                        researcher: uid,
                        advisor_id: selectedAdvisorId,
                        date: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error || !proposal) throw error;

            onProposalCreated(proposal);
            onOpenChange(false);
            setNewProposalTitle("");
            setSelectedAdvisorId("");
            toast.success("Proposal created and sent to advisor for approval!", { id: loading });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to create proposal: " + (err.message || err), { id: loading });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right col-span-4">
                            Title
                        </Label>
                        <Input
                            id="title"
                            placeholder="Enter proposal title"
                            value={newProposalTitle}
                            onChange={(e) => setNewProposalTitle(e.target.value)}
                            className="col-span-4"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="advisor" className="text-right col-span-4">
                            Select Advisor
                        </Label>
                        <Select value={selectedAdvisorId} onValueChange={setSelectedAdvisorId}>
                            <SelectTrigger className="col-span-4 h-auto min-h-[4rem] py-2">
                                <SelectValue placeholder="Choose an advisor">
                                    {selectedAdvisorId && (() => {
                                        const selectedAdvisor = advisors.find(a => a.id === selectedAdvisorId);
                                        return selectedAdvisor ? (
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-medium text-sm">
                                                    {selectedAdvisor.lname}, {selectedAdvisor.fname} ({selectedAdvisor.role})
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {selectedAdvisor.email}
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {advisors.map((advisor) => (
                                    <SelectItem 
                                        key={advisor.id} 
                                        value={advisor.id}
                                        className="items-start py-3"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-sm leading-tight">
                                                {advisor.lname}, {advisor.fname} ({advisor.role})
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-tight">
                                                {advisor.email}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateProposal}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}