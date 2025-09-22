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
} from "lucide-react"; // Importing icons

type Status =
  | "Check Manuscript"
  | "Risk Assessment"
  | "Forms Check"
  | "Deploy Queue";

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
    "Deploy Queue": "Check Manuscript",
  };
  return awa[params];
}

function statm(params: Status) {
  const awa = {
    "Check Manuscript": "Resend Manuscript",
    "Risk Assessment": "Check Manuscript",
    "Forms Check": "Resend Forms",
    "Deploy Queue": "Forms Check",
  };
  return awa[params];
}

export const SReview = () => {
  const [manuOpen, setmanuOpen] = React.useState(false);
  const [formOpen, setformOpen] = React.useState(false);
  const navigate = useNavigate();

  const [tog, setTog] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);

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

  React.useEffect(() => {
    if (!title) navigate("/ssubm/sub1");
  }, [navigate, title]);

  // Fetch documents from bucket dynamically
  React.useEffect(() => {
    if (!id) return;

    const fetchDocs = async () => {
      try {
        const manuscriptPhase = "Send Manuscript";
        const formsPhase = "Send Forms";

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
      } catch (err: any) {
        toast.error("Failed to fetch documents: " + err.message);
      }
    };

    fetchDocs();
  }, [id]);

  React.useEffect(() => {
    if (selectedDoc) fetchDoc();
  }, [selectedDoc]);

  async function fetchDoc() {
    if (!selectedDoc) return;

    const phase = status === "Check Manuscript" ? "Send Manuscript" : "Send Forms";
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

  const requirementDocs = status === "Check Manuscript" ? manuscriptDocs : formsDocs;

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
          <div className="flex justify-between items-center py-3">
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
                  Queue proposal for Risk Assessment
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
            disabled={tog === ""}
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