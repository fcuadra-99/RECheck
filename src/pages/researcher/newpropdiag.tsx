"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { useState } from "react";

interface Profile {
    id: string;
    fname: string | null;
    lname: string | null;
    category?: string | null;
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
    userId, 
    onProposalCreated 
}: NewProposalDialogProps) {
    const [newProposalTitle, setNewProposalTitle] = useState("");
    const [newProposalDescription, setNewProposalDescription] = useState("");

    const handleCreateProposal = async () => {
        userId;
        if (!newProposalTitle.trim()) return toast.error("Title is required");
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
                        description: newProposalDescription,
                        category,
                        status: "Send Manuscript",
                        researcher: uid,
                        date: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error || !proposal) throw error;

            onProposalCreated(proposal);
            onOpenChange(false);
            setNewProposalTitle("");
            setNewProposalDescription("");
            toast.success("Proposal created successfully!", { id: loading });
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to create proposal: " + (err.message || err));
        } finally {
            toast.dismiss();
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
                        <Input
                            id="title"
                            placeholder="Enter proposal title"
                            value={newProposalTitle}
                            onChange={(e) => setNewProposalTitle(e.target.value)}
                            className="col-span-4"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right col-span-4">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Enter proposal description"
                            value={newProposalDescription}
                            onChange={(e) => setNewProposalDescription(e.target.value)}
                            className="col-span-4 resize-none"
                            rows={4}
                        />
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