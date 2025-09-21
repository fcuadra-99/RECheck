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
    <main className="m-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Proposal Info */}
        <section>
          <div className="flex gap-2 my-3">
            <span className="flex-1">
              <div className="text-muted-foreground">Proposal ID</div>
              <div>{id}</div>
            </span>
            <span className="flex-1">
              <div className="text-muted-foreground">Proposal Title</div>
              <div>{title}</div>
            </span>
          </div>
          <hr />
          <div className="flex gap-2 my-3">
            <span className="flex-1">
              <div className="text-muted-foreground">Researcher Name</div>
              <div>{researcher}</div>
            </span>
            <span className="flex-1">
              <div className="text-muted-foreground">Researcher Email</div>
              <div>{email}</div>
            </span>
          </div>
          <hr />
          <div className="flex gap-2 my-3">
            <span className="flex-1">
              <div className="text-muted-foreground">Proposal Status</div>
              <div>{status}</div>
            </span>
            <span className="flex-1">
              <div className="text-muted-foreground">Submission Date</div>
              <div>{submDate}</div>
            </span>
          </div>
        </section>

        {/* Review Documents */}
        <section className="my-15 mb-10">
          <h1 className="text-2xl my-10">
            <b>Review Documents</b>
          </h1>

          {/* Manuscript */}
          <div className="flex justify-between my-5">
            <p className="font-medium">Manuscript</p>
            <div>
              <Button
                variant="outline"
                type="button"
                disabled={false} // Always clickable
                onClick={() => {
                  setmanuOpen(true);
                  if (manuscriptDocs[0]) setSelectedDoc(manuscriptDocs[0].file);
                }}
              >
                View Details
              </Button>

              <Dialog open={manuOpen} onClose={() => setmanuOpen(false)}>
                <DialogBackdrop />
                <DialogPanel className="sm:max-w-[800px] flex gap-4">
                  <div className="w-1/4 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3 overflow-y-auto">
                    {manuscriptDocs.map((doc) => (
                      <Button
                        key={doc.file}
                        variant={selectedDoc === doc.file ? "default" : "outline"}
                        onClick={() => setSelectedDoc(doc.file)}
                        className="wrap-anywhere overflow-hidden text-ellipsis text-left text-xs"
                      >
                        {doc.name}
                      </Button>
                    ))}
                  </div>

                  <div className="w-3/4 p-2">
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
          </div>

          {/* Forms */}
          <div className="flex justify-between my-5">
            <p className="font-medium">Forms</p>
            <div>
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

              {(status === "Forms Check" || status === "Deploy Queue") && (
                <Dialog open={formOpen} onClose={() => setformOpen(false)}>
                  <DialogBackdrop />
                  <DialogPanel className="sm:max-w-[800px] flex gap-4">
                    <div className="w-1/4 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3">
                      {formsDocs.map((doc) => (
                        <Button
                          key={doc.file}
                          variant={selectedDoc === doc.file ? "default" : "outline"}
                          onClick={() => setSelectedDoc(doc.file)}
                        >
                          {doc.name}
                        </Button>
                      ))}
                    </div>
                    <div className="w-3/4 p-2">
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
          </div>
        </section>

        {/* Status Management */}
        <section hidden={type !== "Check"}>
          <h1 className="text-2xl my-5">
            <b>Status Management</b>
          </h1>
          <span>
            <RadioGroup defaultValue="approve" value={tog} onValueChange={setTog}>
              {/* Approve */}
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem
                  value="approve"
                  className="my-auto mr-5 ml-1 w-5 h-5 z-50"
                />
                <div>
                  <div className="font-medium">Approve</div>
                  <div className="text-muted-foreground text-xs">
                    Queue proposal for Risk Assessment
                  </div>
                </div>
              </div>

              {/* Deny */}
              <div className="bg-card flex flex-col px-4 py-5 rounded-xl shadow-sm border-2 space-y-3">
                <div className="flex items-center">
                  <RadioGroupItem
                    value="deny"
                    className="my-auto mr-5 ml-1 w-5 h-5 z-50"
                  />
                  <div>
                    <div className="font-medium">Request Revision</div>
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
                    className="resize-none mt-2 z-50"
                    value={msg}
                    onChange={(event) => setMsg(event.target.value)}
                  />
                )}
              </div>
            </RadioGroup>
          </span>
        </section>

        {/* Risk Assessment */}
        <section hidden={type !== "Assess"}>
          <h1 className="text-2xl my-5">
            <b>Risk Assessment</b>
          </h1>
          <span>
            <RadioGroup
              defaultValue="Full Board"
              value={tog}
              onValueChange={setTog}
              required
            >
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem
                  value="Full Board"
                  className="my-auto mr-5 ml-1 w-5 h-5 z-50"
                />
                <div>
                  <div className="font-medium">Full Board Review</div>
                  <div className="text-muted-foreground text-xs">
                    Requires review by the full ethics board.
                  </div>
                </div>
              </div>
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem
                  value="Expedited"
                  className="my-auto mr-5 ml-1 w-5 h-5 z-50"
                />
                <div>
                  <div className="font-medium">Expedited Review</div>
                  <div className="text-muted-foreground text-xs">
                    Can be reviewed by a smaller ethics committee.
                  </div>
                </div>
              </div>
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem
                  value="Exempt"
                  className="my-auto mr-5 ml-1 w-5 h-5 z-50"
                />
                <div>
                  <div className="font-medium">Exempt Review</div>
                  <div className="text-muted-foreground text-xs">
                    Does not require board-level review.
                  </div>
                </div>
              </div>
            </RadioGroup>
          </span>
        </section>

        {/* Buttons */}
        <section className="absolute my-10 h-20 flex gap-5">
          <RippleButton
            type="button"
            className="w-20 z-50"
            hidden={type === "Pending" || type === "View"}
            disabled={tog === ""}
            onClick={handleSubmit}
          >
            Submit
          </RippleButton>
          <RippleButton
            type="button"
            variant="outline"
            className="w-20 z-50"
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
