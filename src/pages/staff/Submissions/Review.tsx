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
  const [tog] = React.useState("");
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

  //edit this plz
  async function fetchDoc() {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl("1.pdf", 60);

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
      <form onSubmit={handleSubmit}>
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
                      <div className="text-center text-gray-500 mt-20">Loading document...</div>
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
                      <div className="text-center text-gray-500 mt-20">Loading document...</div>
                    )}
                  </div>
                </DialogPanel>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Status Management / Risk Assessment sections remain unchanged */}

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
