import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@/components/animate-ui/headless/dialog";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  User,
  Mail,
  Calendar,
  CheckCircle,
  Pencil,
  Shield,
  Zap,
  Ban,
  Check,
  X,
  Badge,
} from "lucide-react";

type Status =
  | "Check Manuscript"
  | "Risk Assessment"
  | "Forms Check"
  | "Deploy Queue"
  | "Send Revision"
  | "Check Revision"
  | "Resend Revision"
  | "Assign Review"
  | "Proposal Review"
  | "Revise Proposal"
  | "Data Collection";

let ide = "";
let titlee = "";
let researchere = "";
let emaile = "";
let statuse: Status;
let submDatee = "";
let typee = "";

export function handleCheck(
  _id: string,
  _title: string,
  _researcher: string,
  _email: string,
  _submDate: string,
  _reviewer: string,
  _status: Status,
  _type: string
) {
  ide = _id;
  titlee = _title;
  researchere = _researcher;
  emaile = _email;
  statuse = _status;
  submDatee = _submDate;
  typee = _type;
}

function stat(params: Status) {
  const awa = {
    "Check Manuscript": "Risk Assessment",
    "Risk Assessment": "Send Forms",
    "Forms Check": "Deploy Queue",
    "Deploy Queue": "Assign Review",
    "Send Revision": "Check Revision", 
    "Check Revision": "Assign Review",
    "Resend Revision": "Check Revision",
    "Assign Review": "Proposal Review",
    "Proposal Review": "Data Collection",
    "Revise Proposal": "Proposal Review",
    "Data Collection": "Data Collection",
  };
  return awa[params];
}

function statm(params: Status) {
  const awa = {
    "Check Manuscript": "Resend Manuscript",
    "Risk Assessment": "Check Manuscript",
    "Forms Check": "Resend Forms",
    "Deploy Queue": "Forms Check",
    "Send Revision": "Deploy Queue",
    "Check Revision": "Resend Revision",
    "Resend Revision": "Check Revision",
    "Assign Review": "Proposal Review",
    "Proposal Review": "Revise Proposal",
    "Revise Proposal": "Proposal Review",
    "Data Collection": "Data Collection",
  };
  return awa[params];
}

export const SReview = () => {
  const [manuOpen, setmanuOpen] = React.useState(false);
  const [formOpen, setformOpen] = React.useState(false);
  const [revisionOpen, setRevisionOpen] = React.useState(false);
  const navigate = useNavigate();

  const [tog, setTog] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = React.useState<string>("");
  const [reviewers, setReviewers] = React.useState<any[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = React.useState(false);

  const [id] = React.useState(ide.toString());
  const [title] = React.useState(titlee || "Unknown");
  const [researcher] = React.useState(researchere || "Unknown");
  const [email] = React.useState(emaile || "Unknown");
  const [submDate] = React.useState(submDatee || "Unknown");
  const [status] = React.useState(statuse || "Unknown");
  const [type] = React.useState(typee || "Unknown");

  const [selectedDoc, setSelectedDoc] = React.useState<string>("");
  const [docURL, setDocURL] = React.useState<string>("");
  const [manuscriptDocs, setManuscriptDocs] = React.useState<{ name: string; file: string }[]>([]);
  const [formsDocs, setFormsDocs] = React.useState<{ name: string; file: string }[]>([]);
  const [revisionDocs, setRevisionDocs] = React.useState<{ name: string; file: string }[]>([]);

  React.useEffect(() => {
    if (!title) navigate("/ssubm/sub1");
  }, [navigate, title]);

  // Fetch reviewers for Assign status
  React.useEffect(() => {
    if (type === "Assign") {
      fetchReviewers();
    }
  }, [type]);

  const fetchReviewers = async () => {
    setIsLoadingReviewers(true);
    try {
      const { data: reviewersData, error } = await supabase
        .from('profiles')
        .select('id, fname, lname, email')
        .in('role', ['Reviewer', 'Admin'])

      if (error) throw error;

      // Get assignment counts for each reviewer
      const reviewersWithCounts = await Promise.all(
        (reviewersData || []).map(async (reviewer) => {
          const { count } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true })
            .eq('reviewer', reviewer.id)
            .eq('status', 'Assigned');

          return {
            ...reviewer,
            assignedCount: count || 0
          };
        })
      );

      setReviewers(reviewersWithCounts);
    } catch (error: any) {
      toast.error("Failed to fetch reviewers: " + error.message);
    } finally {
      setIsLoadingReviewers(false);
    }
  };

  // Fetch documents from bucket dynamically
  React.useEffect(() => {
    if (!id) return;

    const fetchDocs = async () => {
      try {
        const manuscriptPhase = "Send Manuscript";
        const formsPhase = "Send Forms";
        const revisionPhase = "Send Revision";

        // List files for manuscript
        const { data: manuList, error: manuErr } = await supabase.storage
          .from("documents")
          .list(`${id}/${manuscriptPhase}`);

        if (manuErr) throw manuErr;

        setManuscriptDocs(
          manuList?.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name })) || []
        );

        // List files for forms
        const { data: formsList, error: formsErr } = await supabase.storage
          .from("documents")
          .list(`${id}/${formsPhase}`);

        if (formsErr) throw formsErr;

        setFormsDocs(
          formsList?.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name })) || []
        );

        // List files for revision (if in revision phase)
        if (status === "Check Revision") {
          const { data: revisionList, error: revisionErr } = await supabase.storage
            .from("documents")
            .list(`${id}/${revisionPhase}`);

          if (revisionErr) throw revisionErr;

          setRevisionDocs(
            revisionList?.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name })) || []
          );
        }
      } catch (err: any) {
        toast.error("Failed to fetch documents: " + err.message);
      }
    };

    fetchDocs();
  }, [id, status]);

  React.useEffect(() => {
    if (selectedDoc) fetchDoc();
  }, [selectedDoc]);

  async function fetchDoc() {
    if (!selectedDoc) return;

    let phase = "";
    if (status === "Check Manuscript") {
      phase = "Send Manuscript";
    } else if (status === "Forms Check" || status === "Deploy Queue") {
      phase = "Send Forms";
    } else if (status === "Check Revision") {
      phase = "Send Revision";
    }

    const path = `${id}/${phase}/${selectedDoc}`;

    setDocURL(""); // Show skeleton while loading
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 60);

      if (error || !data?.signedUrl) {
        toast.error("Failed to load document");
        setDocURL(""); // Document does not exist
        return;
      }

      setDocURL(data.signedUrl);
    } catch (err) {
      toast.error("Failed to load document");
      setDocURL("");
    }
  }

  React.useEffect(() => {
    if (!id) {
      navigate("/ssubm/sub1");
    }
  }, [id, navigate]);

  async function handleSubmit() {
    const loading = toast.loading("Loading...");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const actorId = userData?.user?.id;
      if (!actorId) throw new Error("No logged-in user found.");

      const affectedFiles =
        tog === "deny"
          ? requirementDocs.map((doc) => ({ name: doc.name, required: true }))
          : [];

      if (type === "Assess") {
        if (!tog) {
          toast.error("Please select a review type before submitting.");
          return;
        }

        const { error } = await supabase
          .from("proposals")
          .update({
            status: stat(status),
            review_type: tog,
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;

        await supabase.from("history").insert({
          history_type: "assess",
          paper_id: id,
          comment: `Risk assessment set as "${tog}"`,
          affected_files: JSON.stringify([]),
          actor: actorId,
        });

        toast.success(`Risk assessment saved as "${tog}"`);
      } else if (type === "Assign") {
        if (!selectedReviewer) {
          toast.error("Please select a reviewer before submitting.");
          return;
        }

        const { error } = await supabase
          .from("proposals")
          .update({
            reviewer: selectedReviewer,
            status: "Assigned",
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;

        const reviewer = reviewers.find(r => r.id === selectedReviewer);
        const reviewerName = reviewer ? `${reviewer.fname} ${reviewer.lname}` : 'Unknown Reviewer';

        await supabase.from("history").insert({
          history_type: "assignment",
          paper_id: id,
          comment: `Assigned to reviewer: ${reviewerName}`,
          actor: actorId,
          action: "Assign Reviewer",
          history_date: new Date().toISOString(),
        });

        toast.success(`Assigned to ${reviewerName}`);
      } else if (tog === "deny") {
        const { error } = await supabase
          .from("proposals")
          .update({
            status: statm(status),
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;

        await supabase.from("history").insert({
          history_type: "deny",
          paper_id: id,
          comment: msg || "Revision requested",
          affected_files: JSON.stringify(affectedFiles),
          actor: actorId,
        });

        toast.success("Revision requested");
      } else {
        const { error } = await supabase
          .from("proposals")
          .update({
            status: stat(status),
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;

        await supabase.from("history").insert({
          history_type: "approve",
          paper_id: id,
          comment: "Phase approved",
          affected_files: JSON.stringify([]),
          actor: actorId,
        });

        toast.success("Phase approved");
      }
    } catch (error: any) {
      toast.error("Submit Error: " + error.message);
    } finally {
      toast.dismiss(loading);
      navigate("/ssubm/sub1");
    }
  }

  // Determine which documents to show based on current status
  const requirementDocs = 
    status === "Check Manuscript" ? manuscriptDocs :
    status === "Forms Check" || status === "Deploy Queue" ? formsDocs :
    status === "Check Revision" ? revisionDocs : [];

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Proposal Info */}
        <section className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText className="text-primary w-5 h-5" /> Proposal Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Proposal ID</div>
                <div className="text-sm font-medium">{id}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Proposal Title</div>
                <div className="text-sm font-medium">{title}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Researcher Name</div>
                <div className="text-sm font-medium">{researcher}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Researcher Email</div>
                <div className="text-sm font-medium">{email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Proposal Status</div>
                <div className="text-sm font-medium">{status}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Submission Date</div>
                <div className="text-sm font-medium">{submDate}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Review Documents */}
        <section className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText className="text-primary w-5 h-5" /> Review Documents
          </h2>

          {/* Manuscript */}
          <div className="flex justify-between items-center py-3 border-b">
            <p className="font-medium flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> Manuscript
            </p>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setmanuOpen(true);
                if (manuscriptDocs[0]) setSelectedDoc(manuscriptDocs[0].file);
              }}
            >
              View Details
            </Button>

            <Dialog open={manuOpen} onClose={() => setmanuOpen(false)}>
              <DialogBackdrop />
              <DialogPanel className="sm:max-w-4xl flex gap-4">
                <div className="w-1/3 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3 overflow-y-auto">
                  {manuscriptDocs.map((doc) => (
                    <Button
                      key={doc.file}
                      variant={selectedDoc === doc.file ? "default" : "outline"}
                      onClick={() => setSelectedDoc(doc.file)}
                      className="w-full text-left text-sm"
                    >
                      {doc.name}
                    </Button>
                  ))}
                </div>
                <div className="w-2/3 p-2">
                  {docURL === null ? (
                    <div className="text-center text-gray-500 mt-20">
                      Document does not exist.
                    </div>
                  ) : !docURL ? (
                    <div className="mt-20">
                      <Skeleton className="w-full h-[600px]" />
                    </div>
                  ) : (
                    <iframe
                      src={docURL}
                      className="w-full h-[600px] border rounded-lg"
                      title="Document Viewer"
                    />
                  )}
                </div>
              </DialogPanel>
            </Dialog>
          </div>

          {/* Forms */}
          <div className="flex justify-between items-center py-3 border-b">
            <p className="font-medium flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> Forms
            </p>
            <Button
              variant="outline"
              type="button"
              disabled={!(status === "Forms Check" || status === "Deploy Queue")}
              onClick={() => {
                setformOpen(true);
                if (formsDocs[0]) setSelectedDoc(formsDocs[0].file);
              }}
            >
              View Details
            </Button>
            {/* Forms Dialog Panel */}
            {(status === "Forms Check" || status === "Deploy Queue") && (
              <Dialog open={formOpen} onClose={() => setformOpen(false)}>
                <DialogBackdrop />
                <DialogPanel className="sm:max-w-4xl flex gap-4">
                  <div className="w-1/3 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3 overflow-y-auto">
                    {formsDocs.map((doc) => (
                      <Button
                        key={doc.file}
                        variant={selectedDoc === doc.file ? "default" : "outline"}
                        onClick={() => setSelectedDoc(doc.file)}
                        className="w-full text-left text-sm"
                      >
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                  <div className="w-2/3 p-2">
                    {docURL ? (
                      <iframe
                        src={docURL}
                        className="w-full h-[600px] border rounded-lg"
                        title="Document Viewer"
                      />
                    ) : (
                      <div className="text-center text-gray-500 mt-20">
                        Loading document...
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </Dialog>
            )}
          </div>

          {/* Revision Documents */}
          {status === "Check Revision" && (
            <div className="flex justify-between items-center py-3">
              <p className="font-medium flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Revision Documents
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setRevisionOpen(true);
                  if (revisionDocs[0]) setSelectedDoc(revisionDocs[0].file);
                }}
              >
                View Details
              </Button>

              <Dialog open={revisionOpen} onClose={() => setRevisionOpen(false)}>
                <DialogBackdrop />
                <DialogPanel className="sm:max-w-4xl flex gap-4">
                  <div className="w-1/3 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3 overflow-y-auto">
                    {revisionDocs.map((doc) => (
                      <Button
                        key={doc.file}
                        variant={selectedDoc === doc.file ? "default" : "outline"}
                        onClick={() => setSelectedDoc(doc.file)}
                        className="w-full text-left text-sm"
                      >
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                  <div className="w-2/3 p-2">
                    {docURL ? (
                      <iframe
                        src={docURL}
                        className="w-full h-[600px] border rounded-lg"
                        title="Document Viewer"
                      />
                    ) : (
                      <div className="text-center text-gray-500 mt-20">
                        Loading document...
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </Dialog>
            </div>
          )}
        </section>

        {/* Reviewer Assignment */}
        <section hidden={type !== "Assign"} className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <User className="text-primary w-5 h-5" /> Assign Reviewer
          </h2>
          
          {isLoadingReviewers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {reviewers.map((reviewer) => (
                <div
                  key={reviewer.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedReviewer === reviewer.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-gray-300 hover:bg-gray-50"
                  } ${
                    reviewer.assignedCount >= 3 ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  onClick={() => {
                    if (reviewer.assignedCount < 3) {
                      setSelectedReviewer(reviewer.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded-full">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">
                        {reviewer.fname} {reviewer.lname}
                      </h3>
                      <p className="text-xs text-gray-500">{reviewer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        reviewer.assignedCount >= 3
                          ? "bg-red-50 text-red-700 border-red-300"
                          : reviewer.assignedCount >= 2
                          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                          : "bg-green-50 text-green-700 border-green-300"
                      }
                    >
                      {reviewer.assignedCount}/3 assigned
                    </Badge>
                    
                    {selectedReviewer === reviewer.id ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : reviewer.assignedCount >= 3 ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
              ))}
              
              {reviewers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No reviewers available</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Status Management */}
        <section hidden={type !== "Check"} className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Pencil className="text-primary w-5 h-5" /> Status Management
          </h2>
          <RadioGroup defaultValue="approve" value={tog} onValueChange={setTog} className="space-y-4">
            {/* Approve */}
            <div className="bg-card flex items-start p-4 rounded-xl shadow-sm border-2">
              <RadioGroupItem
                value="approve"
                className="my-auto mr-4 w-4 h-4 z-50"
              />
              <div>
                <div className="text-sm font-medium flex items-center gap-2">Approve <CheckCircle className="w-3 h-3 text-green-500" /></div>
                <div className="text-muted-foreground text-xs">
                  {status === "Deploy Queue" ? "Queue proposal for Send Revision" :
                   status === "Check Revision" ? "Queue proposal for Assign Review" :
                   `Queue proposal for ${stat(status)}`}
                </div>
              </div>
            </div>

            {/* Deny */}
            <div className="bg-card flex flex-col p-4 rounded-xl shadow-sm border-2 space-y-3">
              <div className="flex items-center">
                <RadioGroupItem
                  value="deny"
                  className="my-auto mr-4 w-4 h-4 z-50"
                />
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">Request Revision <Pencil className="w-3 h-3 text-orange-500" /></div>
                  <div className="text-muted-foreground text-xs">
                    Select which files to revise and leave a comment
                  </div>
                </div>
              </div>

              {tog === "deny" && (
                <div className="ml-8 space-y-2">
                  {requirementDocs.map((doc) => (
                    <label key={doc.file} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(doc.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles((prev) => [...prev, doc.name]);
                          } else {
                            setSelectedFiles((prev) =>
                              prev.filter((f) => f !== doc.name)
                            );
                          }
                        }}
                      />
                      <span>{doc.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {tog === "deny" && (
                <Textarea
                  placeholder="Type your message here."
                  className="resize-none mt-2 z-50 text-sm"
                  value={msg}
                  onChange={(event) => setMsg(event.target.value)}
                />
              )}
            </div>
          </RadioGroup>
        </section>

        {/* Risk Assessment */}
        <section hidden={type !== "Assess"} className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="text-primary w-5 h-5" /> Risk Assessment
          </h2>
          <RadioGroup
            defaultValue="Full Board"
            value={tog}
            onValueChange={setTog}
            required
            className="space-y-4"
          >
            <div className="bg-card flex items-start p-4 rounded-xl shadow-sm border-2">
              <RadioGroupItem
                value="Full Board"
                className="my-auto mr-4 w-4 h-4 z-50"
              />
              <div>
                <div className="text-base font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-red-500 mr-2" />Full Board Review</div>
                <div className="text-sm text-muted-foreground">
                  Requires review by the full ethics board.
                </div>
              </div>
            </div>
            <div className="bg-card flex items-start p-4 rounded-xl shadow-sm border-2">
              <RadioGroupItem
                value="Expedited"
                className="my-auto mr-4 w-4 h-4 z-50"
              />
              <div>
                <div className="text-base font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500 mr-2" />Expedited Review</div>
                <div className="text-sm text-muted-foreground">
                  Can be reviewed by a smaller ethics committee.
                </div>
              </div>
            </div>
            <div className="bg-card flex items-start p-4 rounded-xl shadow-sm border-2">
              <RadioGroupItem
                value="Exempt"
                className="my-auto mr-4 w-4 h-4 z-50"
              />
              <div>
                <div className="text-base font-medium flex items-center gap-2"><Ban className="w-4 h-4 text-green-500 mr-2" />Exempt Review</div>
                <div className="text-sm text-muted-foreground">
                  Does not require board-level review.
                </div>
              </div>
            </div>
          </RadioGroup>
        </section>

        {/* Buttons */}
        <section className="my-8 flex gap-4">
          <RippleButton
            type="submit"
            className="w-24 z-50"
            hidden={type === "Pending" || type === "View"}
            disabled={
              (type === "Check" || type === "Assess") ? tog === "" :
              (type === "Assign") ? !selectedReviewer : false
            }
          >
            Submit
          </RippleButton>
          <RippleButton
            type="button"
            variant="outline"
            className="w-24 z-50"
            onClick={() => navigate("/ssubm/sub1")}
          >
            Back
          </RippleButton>
        </section>
      </form>
    </main>
  );
};

export default SReview;