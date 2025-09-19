import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Button } from '@/components/ui/button';
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from '@/components/animate-ui/headless/dialog';
import { supabase } from "@/DB";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type Status = "Check Manuscript" | "Risk Assessment" | "Forms Check" | "Deploy Queue";

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

const manuscriptDocs = [
  { name: "Revised Manuscript", file: "revised_manuscript.pdf" },
  { name: "Minutes of Proposal Defense", file: "proposal_minutes.pdf" },
  { name: "Updated CV", file: "updated_cv.pdf" },
  { name: "All Grades", file: "all_grades.pdf" },
];

const formsDocs = [
  { name: "Payment Receipt", file: "payment_receipt.pdf" },
  { name: "Other Form 1", file: "form1.pdf" },
  { name: "Other Form 2", file: "form2.pdf" },
];

export const SReview = () => {
  const [manuOpen, setmanuOpen] = React.useState(false);
  const [formOpen, setformOpen] = React.useState(false);
  const navigate = useNavigate();

  const [tog, setTog] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const [id] = React.useState(ide.toString());
  const [title] = React.useState(titlee);
  const [researcher] = React.useState(researchere);
  const [email] = React.useState(emaile);
  const [submDate] = React.useState(submDatee);
  const [status] = React.useState(statuse);
  const [type] = React.useState(typee);

  const [selectedDoc, setSelectedDoc] = React.useState<string>("");
  const [docURL, setDocURL] = React.useState<string>("");

  React.useEffect(() => {
    if (title === "") navigate("/ssubm/sub1");
  }, [navigate, title]);

  React.useEffect(() => {
    if (selectedDoc) fetchDoc();
  }, [selectedDoc]);

  async function fetchDoc() {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(selectedDoc, 60);

      if (error || !data?.signedUrl) {
        toast.error("Failed to load document");
        setDocURL("");
        return;
      }

      setDocURL(data.signedUrl);
    } catch (err) {
      toast.error("Failed to load document");
      setDocURL("");
    }
  }

  async function handleSubmit() {
    const loading = toast.loading("Loading...");

    try {
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
        toast.success(`Risk assessment saved as "${tog}"`);
      } else if (tog === "deny") {
        const { error } = await supabase
          .from("proposals")
          .update({
            status: statm(status),
            // later you can add: revision_message: msg,
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;
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
        toast.success("Phase approved");
      }
    } catch (error: any) {
      toast.error("Submit Error: " + error.message);
    } finally {
      toast.dismiss(loading);
      navigate("/ssubm/sub1");
    }
  }

  return (
    <main className="m-12">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
          <h1 className="text-2xl my-10"><b>Review Documents</b></h1>

          {/* Manuscript */}
          <div className="flex justify-between my-5">
            <p className="font-medium">Manuscript</p>
            <div>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setmanuOpen(true);
                  setSelectedDoc(manuscriptDocs[0].file);
                }}
              >
                View Details
              </Button>

              <Dialog open={manuOpen} onClose={() => setmanuOpen(false)}>
                <DialogBackdrop />
                <DialogPanel className="sm:max-w-[800px] flex gap-4">
                  {/* Left Panel */}
                  <div className="w-1/4 bg-gray-50 p-4 rounded-l-xl flex flex-col gap-3">
                    {manuscriptDocs.map((doc) => (
                      <Button
                        key={doc.file}
                        variant={selectedDoc === doc.file ? "default" : "outline"}
                        onClick={() => setSelectedDoc(doc.file)}
                      >
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                  {/* Right Panel */}
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
            </div>
          </div>

          {/* Forms */}
          <div className="flex justify-between my-5">
            <p className="font-medium">Forms</p>
            <div>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setformOpen(true);
                  setSelectedDoc(formsDocs[0].file);
                }}
              >
                View Details
              </Button>

              <Dialog open={formOpen} onClose={() => setformOpen(false)}>
                <DialogBackdrop />
                <DialogPanel className="sm:max-w-[800px] flex gap-4">
                  {/* Left Panel */}
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
                  {/* Right Panel */}
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
            </div>
          </div>
        </section>

        {/* Status Management */}
        <section hidden={type !== "Check"}>
          <h1 className="text-2xl my-5">
            <b>Status Management</b>
          </h1>
          <span>
            <RadioGroup
              defaultValue="approve"
              value={tog}
              onValueChange={setTog}
            >
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem value="approve" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                <div>
                  <div className="font-medium">Check Manuscript</div>
                  <div className="text-muted-foreground text-xs">
                    Queue proposal for Risk Assessment
                  </div>
                </div>
              </div>

              <div className="bg-card flex px-4 py-5 rounded-xl flex-wrap shadow-sm border-2 space-x-10">
                <RadioGroupItem value="deny" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                <div className="grow">
                  <div className="font-medium">Request Revision</div>
                  <div className="text-muted-foreground text-xs">
                    Request Researcher to revise their manuscript
                  </div>
                </div>

                <Textarea
                  placeholder="Type your message here."
                  className="resize-none mt-4 z-50 wrap-anywhere"
                  value={msg}
                  onChange={(event) => setMsg(event.target.value)}
                  disabled={tog === "approve"}
                />
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
                <RadioGroupItem value="Full Board" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                <div>
                  <div className="font-medium">Full Board Review</div>
                  <div className="text-muted-foreground text-xs">
                    Requires review by the full ethics board.
                  </div>
                </div>
              </div>
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem value="Expedited" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                <div>
                  <div className="font-medium">Expedited Review</div>
                  <div className="text-muted-foreground text-xs">
                    Can be reviewed by a smaller ethics committee.
                  </div>
                </div>
              </div>
              <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                <RadioGroupItem value="Exempt" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
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
