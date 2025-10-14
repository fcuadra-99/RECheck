"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/DB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Edit, Trash2, Search, Workflow, Book, CheckSquare, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { FileText, BadgeCheck, Settings } from "lucide-react";

/* Types */
interface PdfFile {
    id: string;
    name: string;
    placeholders: any[];
}

interface Phase {
    id: string;
    title: string;
    description?: string | null;
    statuses: { name: string; sort_order: number; actor: string }[];
    required_files: { file_id: string; required: boolean; user_upload?: boolean }[]
}

export default function AdminPhases() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const [fileSearch, setFileSearch] = useState("");

    const actorOptions = ["Researcher", "Admin Assistant", "Chairperson", "Reviewer"];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: phasesData } = await supabase.from("phases").select("*").order("title");
                const { data: filesData } = await supabase.from("pdf_files").select("*");
                setPhases(phasesData || []);
                setPdfFiles(filesData || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const openNewPhaseDialog = () => {
        setEditingPhase({ id: "", title: "", statuses: [], required_files: [] });
        setDialogOpen(true);
    };

    const savePhase = async () => {
        if (!editingPhase?.title) return toast.error("Title is required");
        if (!editingPhase.statuses.length) return toast.error("At least one status is required");

        const payload = {
            title: editingPhase.title,
            description: editingPhase.description,
            statuses: editingPhase.statuses,
            required_files: editingPhase.required_files,
            updated_at: new Date().toISOString(),
        };

        try {
            if (editingPhase.id) {
                const { error } = await supabase.from("phases").update(payload).eq("id", editingPhase.id);
                if (error) throw error;
                setPhases((prev) => prev.map((p) => (p.id === editingPhase.id ? { ...p, ...payload } : p)));
            } else {
                const { data, error } = await supabase.from("phases").insert([payload]).select().single();
                if (error) throw error;
                setPhases((prev) => [...prev, data]);
            }
            toast.success("Phase saved successfully");
            setDialogOpen(false);
            setEditingPhase(null);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to save phase: " + (err.message || err));
        }
    };

    const addStatus = () => {
        if (!editingPhase) return;
        setEditingPhase({
            ...editingPhase,
            statuses: [
                ...editingPhase.statuses,
                { name: "", sort_order: editingPhase.statuses.length, actor: actorOptions[0] },
            ],
        });
    };

    const removeStatus = (index: number) => {
        if (!editingPhase) return;
        const updated = [...editingPhase.statuses];
        updated.splice(index, 1);
        setEditingPhase({ ...editingPhase, statuses: updated });
    };

    // const toggleFile = (fileId: string) => {
    //     if (!editingPhase) return;
    //     const exists = editingPhase.required_files.find((f) => f.file_id === fileId);
    //     const updatedFiles = exists
    //         ? editingPhase.required_files.filter((f) => f.file_id !== fileId)
    //         : [...editingPhase.required_files, { file_id: fileId, required: true }];
    //     setEditingPhase({ ...editingPhase, required_files: updatedFiles });
    // };

    const filteredFiles = pdfFiles.filter((f) => f.name.toLowerCase().includes(fileSearch.toLowerCase()));

    return (
        <div className="p-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                        <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Phases Management</h1>
                        <p className="text-sm text-gray-500">Organize and control proposal workflow phases</p>
                    </div>
                </div>

                <RippleButton onClick={openNewPhaseDialog} className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> New Phase
                </RippleButton>
            </div>

            {/* Phase Table */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-background/50 animate-pulse rounded"></div>
                    ))}
                </div>
            ) : phases.length === 0 ? (
                <div className="text-foreground/50 italic">No phases yet.</div>
            ) : (
                <Table className="border border-border">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border border-border">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span>Title</span>
                                </div>
                            </TableHead>
                            <TableHead className="border border-border">
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4 text-primary" />
                                    <span>Statuses</span>
                                </div>
                            </TableHead>
                            <TableHead className="border border-border w-24">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary" />
                                    <span>Actions</span>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {phases.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="border border-border">{p.title}</TableCell>
                                <TableCell className="border border-border">
                                    <div className="inline-flex flex-wrap gap-1">
                                        {p.statuses.map((s, idx) => {
                                            // Actor → border color mapping
                                            const actorColors: Record<string, string> = {
                                                Researcher: "border-blue-500",
                                                "Admin Assistant": "border-green-500",
                                                Chairperson: "border-yellow-500",
                                                Reviewer: "border-purple-500",
                                            };

                                            const borderColor = actorColors[s.actor] || "border-gray-300";

                                            return (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className={`px-2 py-1 text-xs border ${borderColor} rounded-full`}
                                                >
                                                    {s.name} ({s.actor})
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell className="border border-border space-x-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingPhase(p);
                                            setDialogOpen(true);
                                        }}
                                        title="Edit Phase"
                                    >
                                        <Edit className="h-4 w-4 text-primary" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this phase?")) return;
                                            try {
                                                const { error } = await supabase.from("phases").delete().eq("id", p.id);
                                                if (error) throw error;
                                                setPhases((prev) => prev.filter((ph) => ph.id !== p.id));
                                                toast.success("Phase deleted");
                                            } catch (err: any) {
                                                console.error(err);
                                                toast.error("Failed to delete phase: " + (err.message || err));
                                            }
                                        }}
                                        title="Delete Phase"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl w-full">
                    <DialogHeader>
                        <DialogTitle>{editingPhase?.id ? "Edit Phase" : "New Phase"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <Label>Title</Label>
                            <Input
                                className="mt-1"
                                value={editingPhase?.title || ""}
                                onChange={(e: any) => editingPhase && setEditingPhase({ ...editingPhase, title: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                className="mt-1"
                                value={editingPhase?.description || ""}
                                onChange={(e: any) =>
                                    editingPhase && setEditingPhase({ ...editingPhase, description: e.target.value })
                                }
                            />
                        </div>

                        {/* Statuses */}
                        <div>
                            <Label>Statuses</Label>
                            <div className="space-y-2 mt-1">
                                {editingPhase?.statuses.map((s, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <Input
                                            value={s.name}
                                            placeholder={`Status ${i + 1}`}
                                            className="flex-1"
                                            onChange={(e: any) => {
                                                if (!editingPhase) return;
                                                const updated = [...editingPhase.statuses];
                                                updated[i].name = e.target.value;
                                                setEditingPhase({ ...editingPhase, statuses: updated });
                                            }}
                                        />

                                        <Select
                                            value={s.actor}
                                            onValueChange={(value) => {
                                                if (!editingPhase) return;
                                                const updated = [...editingPhase.statuses];
                                                updated[i].actor = value;
                                                setEditingPhase({ ...editingPhase, statuses: updated });
                                            }}
                                        >
                                            <SelectTrigger className="w-48 border border-border">
                                                <SelectValue placeholder="Select actor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {actorOptions.map((actor) => (
                                                    <SelectItem key={actor} value={actor}>
                                                        {actor}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button size="icon" variant="destructive" onClick={() => removeStatus(i)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button size="sm" onClick={addStatus}>
                                    Add Status
                                </Button>
                            </div>
                        </div>

                        {/* Required Files */}
                        {/* Required Files */}
                        <div>
                            <Label>Required Files</Label>
                            <div className="mt-2">
                                <div className="flex mb-5 gap-2">
                                    <Input
                                        placeholder="Search files..."
                                        value={fileSearch}
                                        onChange={(e) => setFileSearch(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Search className="h-5 w-5 text-foreground/50 mt-2" />
                                </div>

                                <Table className="border border-border overflow-y-auto max-h-64">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="border border-border w-1/12">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4 text-primary" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="border border-border w-1/12 self-center">
                                                <div className="flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-primary" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="border border-border">
                                                <div className="flex items-center gap-2">
                                                    <Book className="w-4 h-4 text-primary" />
                                                    <span>File Name</span>
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredFiles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-sm text-foreground/50 italic border border-border">
                                                    No files available.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredFiles.map((f) => {
                                                const fileEntry = editingPhase?.required_files.find(rf => rf.file_id === f.id);

                                                return (
                                                    <TableRow key={f.id}>
                                                        {/* Required */}
                                                        <TableCell className="border border-border ">
                                                            <Checkbox
                                                                checked={!!fileEntry}
                                                                onCheckedChange={() => {
                                                                    if (!editingPhase) return;
                                                                    if (fileEntry) {
                                                                        setEditingPhase({
                                                                            ...editingPhase,
                                                                            required_files: editingPhase.required_files.filter(rf => rf.file_id !== f.id),
                                                                        });
                                                                    } else {
                                                                        setEditingPhase({
                                                                            ...editingPhase,
                                                                            required_files: [...editingPhase.required_files, { file_id: f.id, required: true, user_upload: false }],
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>

                                                        {/* User Upload */}
                                                        <TableCell className="border border-border">
                                                            {fileEntry && (
                                                                <Checkbox
                                                                    checked={!!fileEntry.user_upload}
                                                                    onCheckedChange={() => {
                                                                        if (!editingPhase) return;
                                                                        setEditingPhase({
                                                                            ...editingPhase,
                                                                            required_files: editingPhase.required_files.map(rf =>
                                                                                rf.file_id === f.id ? { ...rf, user_upload: !rf.user_upload } : rf
                                                                            ),
                                                                        });
                                                                    }}
                                                                />
                                                            )}
                                                        </TableCell>

                                                        {/* File Name */}
                                                        <TableCell className="border border-border max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={savePhase}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
