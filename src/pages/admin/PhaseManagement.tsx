"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/DB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Edit, Trash2, Search, Workflow, Book, CheckSquare, Upload } from "lucide-react";
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
import { FileText, BadgeCheck } from "lucide-react";

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
  required_files: { file_id: string; required: boolean; user_upload?: boolean }[];
}

/* System-defined phases matching actual workflow and templates */
const SYSTEM_PHASES = [
  {
    title: "Phase 1: Manuscript Submission",
    description: "Initial manuscript submission",
    statuses: [
      { name: "Send Manuscript", sort_order: 0, actor: "Researcher" },
      { name: "Check Manuscript", sort_order: 1, actor: "Admin Assistant" },
      { name: "Resend Manuscript", sort_order: 2, actor: "Researcher" },
    ],
    requiredTemplates: [
      "Revised Manuscript",
      "All Grades",
      "Minutes of Proposal Defense",
      "Updated CV",
      "Payment Receipt",
      "",
      "=== GRADUATE ONLY ===",
      "Receipt for Defense Proposal"
    ],
  },
  {
    title: "Phase 2: Risk Assessment",
    description: "Risk assessment of the proposal",
    statuses: [
      { name: "Risk Assessment", sort_order: 0, actor: "Admin Assistant" },
    ],
    requiredTemplates: [],
  },
  {
    title: "Phase 3: Forms Submission",
    description: "Ethics forms and supporting documents submission",
    statuses: [
      { name: "Send Forms", sort_order: 0, actor: "Researcher" },
      { name: "Forms Check", sort_order: 1, actor: "Admin Assistant" },
      { name: "Resend Forms", sort_order: 2, actor: "Researcher" },
    ],
    requiredTemplates: [
      "=== EXTERNAL - EXEMPT REVIEW ===",
      "REC_FO_0032_EthicsProtocolChecklist",
      "REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample",
      "REC_FO_0036_MOA for external",
      "",
      "=== EXTERNAL - FULL REVIEW ===",
      "REC_FO_0032_EthicsProtocolChecklist",
      "REC_FO_0027_EthicsApplicationProcedure",
      "REC_FO_0028_EthicsStudyProtocolInformationForm",
      "REC_FO_0029_EthicsInformedConsentCHECKLIST",
      "REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed",
      "REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample",
      "REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample",
      "REC_FO_0036_MOA for external",
      "",
      "=== GRADUATE - EXEMPT REVIEW ===",
      "REC_ENDORSMENT_FORM",
      "REC_FO_0032_EthicsProtocolChecklist",
      "REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample",
      "REC_FO_0035_Ethics Memorandum of Agreement for Authorship",
      "",
      "=== GRADUATE - FULL REVIEW ===",
      "REC_ENDORSMENT_FORM",
      "REC_FO_0032_EthicsProtocolChecklist",
      "REC_FO_0027_EthicsApplicationProcedure",
      "REC_FO_0028_EthicsStudyProtocolInformationForm",
      "REC_FO_0029_EthicsInformedConsentCHECKLIST",
      "REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed",
      "REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample",
      "REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample",
      "REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship",
      "",
      "=== UNDERGRADUATE - EXEMPT REVIEW ===",
      "REC_FO_0032_EthicsProtocolChecklist",
      "REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample",
      "REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship",
      "",
      "=== UNDERGRADUATE - FULL REVIEW ===",
      "REC_FO_0026_EthicsProtocolChecklist",
      "REC_FO_0027_EthicsApplicationProcedure",
      "REC_FO_0028_EthicsStudyProtocolInformationForm",
      "REC_FO_0029_EthicsInformedConsentCHECKLIST",
      "REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed",
      "REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample",
      "REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample",
      "REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship"
    ],
  },
  {
    title: "Phase 4: Deployment Queue",
    description: "Queue for review assignment and revisions",
    statuses: [
      { name: "Deploy Queue", sort_order: 0, actor: "Admin Assistant" },
      { name: "Send Revision", sort_order: 1, actor: "Researcher" },
      { name: "Check Revision", sort_order: 2, actor: "Admin Assistant" },
      { name: "Resend Revision", sort_order: 3, actor: "Researcher" },
    ],
    requiredTemplates: [],
  },
  {
    title: "Phase 5: Documents Review",
    description: "Reviewer assignment and proposal evaluation",
    statuses: [
      { name: "Assign Review", sort_order: 0, actor: "Chairperson" },
      { name: "Proposal Review", sort_order: 1, actor: "Reviewer" },
      { name: "Revise Proposal", sort_order: 2, actor: "Researcher" },
    ],
    requiredTemplates: [],
  },
  {
    title: "Phase 6: Data Collection & Reporting",
    description: "Data collection, deviation reports, and study reports",
    statuses: [
      { name: "Data Collection", sort_order: 0, actor: "Researcher" },
      { name: "Deviation Check", sort_order: 1, actor: "Chairperson" },
      { name: "Send Deviation Report", sort_order: 2, actor: "Researcher" },
      { name: "Send Study Report", sort_order: 3, actor: "Researcher" },
      { name: "Revise Documents", sort_order: 4, actor: "Researcher" },
      { name: "Study Report Check", sort_order: 5, actor: "Chairperson" },
    ],
    requiredTemplates: [],
  },
  {
    title: "Phase 7: Final Report & Archival",
    description: "Final report submission and archival",
    statuses: [
      { name: "Send Report", sort_order: 0, actor: "Researcher" },
      { name: "Archive Files", sort_order: 1, actor: "Admin Assistant" },
    ],
    requiredTemplates: ["Protocol_Final_Report_Template"],
  },
];

export default function AdminPhases() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);

  const actorOptions = ["Researcher", "Admin Assistant", "Chairperson", "Reviewer"];

  const filteredFiles = pdfFiles.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const addStatus = () => {
    if (!editingPhase) return;
    setEditingPhase({
      ...editingPhase,
      statuses: [
        ...editingPhase.statuses,
        { name: "", sort_order: editingPhase.statuses.length, actor: "Researcher" },
      ],
    });
  };

  const removeStatus = (index: number) => {
    if (!editingPhase) return;
    setEditingPhase({
      ...editingPhase,
      statuses: editingPhase.statuses.filter((_, i) => i !== index),
    });
  };

  const savePhase = async () => {
    if (!editingPhase) return;
    try {
      if (editingPhase.id) {
        // Update existing phase
        await supabase.from("phases").update(editingPhase).eq("id", editingPhase.id);
        setPhases(phases.map((p) => (p.id === editingPhase.id ? editingPhase : p)));
        toast.success("Phase updated successfully");
      } else {
        // Create new phase
        const { data, error } = await supabase.from("phases").insert([editingPhase]).select();
        if (error) throw error;
        if (data) {
          setPhases([...phases, data[0]]);
          toast.success("Phase created successfully");
        }
      }
      setDialogOpen(false);
      setEditingPhase(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save phase: " + (err.message || err));
    }
  };

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

  const syncSystemPhases = async () => {
    setSyncing(true);
    try {
      for (const systemPhase of SYSTEM_PHASES) {
        // Store template names as a simple reference list (not linked to actual files)
        const required_files = systemPhase.requiredTemplates.map((templateName) => ({
          file_id: templateName, // Use template name as ID for reference
          required: true,
          user_upload: false,
        }));

        const payload = {
          title: systemPhase.title,
          description: systemPhase.description,
          statuses: systemPhase.statuses,
          required_files,
          updated_at: new Date().toISOString(),
        };

        // Check if phase exists
        const { data: existingPhase } = await supabase
          .from("phases")
          .select("id")
          .eq("title", systemPhase.title)
          .single();

        if (existingPhase) {
          // Update existing phase
          const { error } = await supabase
            .from("phases")
            .update(payload)
            .eq("id", existingPhase.id);
          if (error) throw error;
        } else {
          // Insert new phase
          const { error } = await supabase.from("phases").insert([payload]);
          if (error) throw error;
        }
      }

      // Reload phases
      const { data: updatedPhases } = await supabase.from("phases").select("*").order("title");
      setPhases(updatedPhases || []);
      
      toast.success("System phases synchronized successfully");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to sync phases: " + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

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
            <p className="text-sm text-gray-500">System-defined workflow phases (read-only)</p>
          </div>
        </div>
        <RippleButton 
          onClick={syncSystemPhases} 
          disabled={syncing}
          className="flex items-center gap-1"
        >
          <Workflow className="h-4 w-4" /> {syncing ? "Syncing..." : "Sync System Phases"}
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
              <TableHead className="border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Required Files</span>
                </div>
              </TableHead>
              <TableHead className="border border-border">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phases.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="border border-border">{p.title}</TableCell>
                <TableCell className="border border-border">
                  <div className="inline-flex flex-wrap gap-1">
                    {p.statuses.map((s, idx) => {
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
                <TableCell className="border border-border p-0">
                  <div className="divide-y divide-border">
                    {p.required_files && p.required_files.length > 0 ? (
                      (() => {
                        const sections: { header: string; files: string[] }[] = [];
                        let currentSection: { header: string; files: string[] } | null = { header: "", files: [] };

                        p.required_files.forEach((rf) => {
                          const fileName = rf.file_id;
                          if (fileName.startsWith("===")) {
                            if (currentSection && currentSection.files.length > 0) sections.push(currentSection);
                            currentSection = { header: fileName.replace(/===/g, "").trim(), files: [] };
                          } else if (fileName !== "") {
                            if (currentSection) {
                              currentSection.files.push(fileName);
                            }
                          }
                        });
                        if (currentSection && currentSection.files.length > 0) sections.push(currentSection);

                        return sections.map((section, idx) => (
                          <div key={idx} className="p-3">
                            {section.header && (
                              <div className="font-semibold text-xs text-primary mb-2 uppercase tracking-wide">
                                {section.header}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {section.files.map((file, fileIdx) => (
                                <Badge
                                  key={fileIdx}
                                  variant="outline"
                                  className="px-2 py-1 text-xs"
                                >
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ));
                      })()
                    ) : (
                      <div className="p-3">
                        <span className="text-sm text-foreground/50 italic">No files</span>
                      </div>
                    )}
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
                onChange={(e: any) =>
                  editingPhase && setEditingPhase({ ...editingPhase, title: e.target.value })
                }
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
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-sm text-foreground/50 italic border border-border"
                        >
                          Loading files...
                        </TableCell>
                      </TableRow>
                    ) : pdfFiles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-sm text-foreground/50 italic border border-border"
                        >
                          No files in database. Please add files in Document Management first.
                        </TableCell>
                      </TableRow>
                    ) : filteredFiles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-sm text-foreground/50 italic border border-border"
                        >
                          No files match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFiles.map((f) => {
                        const fileEntry = editingPhase?.required_files.find(
                          (rf) => rf.file_id === f.id
                        );
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
                                      required_files: editingPhase.required_files.filter(
                                        (rf) => rf.file_id !== f.id
                                      ),
                                    });
                                  } else {
                                    setEditingPhase({
                                      ...editingPhase,
                                      required_files: [
                                        ...editingPhase.required_files,
                                        { file_id: f.id, required: true, user_upload: false },
                                      ],
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
                                      required_files: editingPhase.required_files.map((rf) =>
                                        rf.file_id === f.id
                                          ? { ...rf, user_upload: !rf.user_upload }
                                          : rf
                                      ),
                                    });
                                  }}
                                />
                              )}
                            </TableCell>
                            {/* File Name */}
                            <TableCell className="border border-border max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {f.name}
                            </TableCell>
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
