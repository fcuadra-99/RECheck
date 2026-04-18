import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { updateProtocolCode } from "@/utils/protocolCode";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  X as CloseIcon,
  Crown,
  FileCheck,
} from "lucide-react";
import { PdfFormViewer } from "@/components/ui/pdf-form-viewer";
import FormViewer from "@/components/forms/FormViewer";

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
  | "Data Collection"
  | "Deviation Check"
  | "Study Report Check"
  | "Revise Documents";

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
    "Deviation Check": "Data Collection",
    "Study Report Check": " Send Final Report",
    "Revise Documents": "Deviation Check",
  };
  return awa[params];
}

function statm(params: Status) {
  const awa = {
    "Check Manuscript": "Resend Manuscript",
    "Risk Assessment": "Check Manuscript",
    "Forms Check": "Resend Forms",
    "Deploy Queue": "Send Revision",
    "Send Revision": "Deploy Queue",
    "Check Revision": "Resend Revision",
    "Resend Revision": "Check Revision",
    "Assign Review": "Proposal Review",
    "Proposal Review": "Revise Proposal",
    "Revise Proposal": "Proposal Review",
    "Data Collection": "Data Collection",
    "Deviation Check": "Revise Documents",
    "Study Report Check": "Revise Documents",
    "Revise Documents": "Deviation Check",
  };
  return awa[params];
}

export const SReview = () => {
  const [activePreview, setActivePreview] = React.useState<"manuscript" | "forms" | "revision" | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const navigate = useNavigate();

  isFullscreen

  const [tog, setTog] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [reviewers, setReviewers] = React.useState<any[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = React.useState(false);
  const [currentUserRole, setCurrentUserRole] = React.useState<string>("");

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
  const [reviewComments, setReviewComments] = React.useState<any[]>([]);
  const [interactiveForms, setInteractiveForms] = React.useState<string[]>([]);
  const [activeInteractiveForm, setActiveInteractiveForm] = React.useState<string | null>(null);

  const [selectedReviewers, setSelectedReviewers] = React.useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string>("");
  const [reviewType, setReviewType] = React.useState<"Full Board" | "Expedited" | "Exempt" | null>(null);
  const [requiredReviewerCount, setRequiredReviewerCount] = React.useState<number>(0);

  // New states for risk assessment form
  const [showRiskAssessmentForm, setShowRiskAssessmentForm] = React.useState(false);
  const [riskAssessmentCompleted, setRiskAssessmentCompleted] = React.useState(false);
  const [riskAssessmentAnswers, setRiskAssessmentAnswers] = React.useState<Record<string, string>>({});

  riskAssessmentAnswers;

  React.useEffect(() => {
    if (!title) navigate("/ssubm/sub1");
  }, [navigate, title]);

  // Fetch current user role
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Fetch user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUserRole(profile.role);
        }
      }
    };
    getCurrentUser();
  }, []);

  // Check if risk assessment form is already completed
  React.useEffect(() => {
    if (type === "Assess") {
      checkRiskAssessmentCompletion();
    }
  }, [type, id]);

  const checkRiskAssessmentCompletion = async () => {
    try {
      // Check if risk assessment form exists in storage
      const { data } = await supabase.storage
        .from("documents")
        .list(`${id}/Risk Assessment`);

      const hasRiskAssessment = data?.some(file =>
        file.name.toLowerCase().includes('risk') ||
        file.name.toLowerCase().includes('assessment')
      );

      if (hasRiskAssessment) {
        setRiskAssessmentCompleted(true);
      }
    } catch (error) {
      console.error("Error checking risk assessment completion:", error);
    }
  };

  // Fetch proposal data to get review type
  React.useEffect(() => {
    if (type === "Assign") {
      fetchProposalData();
      fetchReviewers();
    }
  }, [type, id]);

  // Auto-select yourself when review type is Exempt
  React.useEffect(() => {
    if (reviewType === "Exempt" && currentUserId) {
      // Check if current user is a reviewer and available
      const currentUserReviewer = reviewers.find(r => r.id === currentUserId);
      if (currentUserReviewer && currentUserReviewer.assignedCount < 3) {
        setSelectedReviewers([currentUserId]);
      }
    }
  }, [reviewType, currentUserId, reviewers]);

  // Fetch review comments
  React.useEffect(() => {
    if (currentUserRole === "Reviewer" && id) {
      fetchReviewComments();
    }
  }, [currentUserRole, id]);

  const fetchReviewComments = async () => {
    try {
      const { data: comments, error } = await supabase
        .from('history')
        .select(`
          *,
          profiles:fname,
          profiles:lname
        `)
        .eq('paper_id', id)
        .eq('history_type', 'deny')
        .order('history_date', { ascending: false });

      if (error) throw error;
      setReviewComments(comments || []);
    } catch (error: any) {
      console.error("Failed to fetch review comments:", error.message);
    }
  };

  const fetchProposalData = async () => {
    try {
      const { data: proposalData, error } = await supabase
        .from('proposals')
        .select('review_type')
        .eq('proposal_id', id)
        .single();

      if (error) throw error;

      if (proposalData?.review_type) {
        const reviewType = proposalData.review_type as "Full Board" | "Expedited" | "Exempt";
        setReviewType(reviewType);

        // Set required reviewer count based on review type
        if (reviewType === "Full Board") {
          setRequiredReviewerCount(6);
        } else if (reviewType === "Expedited") {
          setRequiredReviewerCount(4);
        } else if (reviewType === "Exempt") {
          setRequiredReviewerCount(1);
        }
      }
    } catch (error: any) {
      toast.error("Failed to fetch proposal data: " + error.message);
    }
  };

  const fetchReviewers = async () => {
    setIsLoadingReviewers(true);
    try {
      const { data: reviewersData, error } = await supabase
        .from('profiles')
        .select('id, fname, lname, email')
        .in('role', ['Reviewer', 'Admin', 'Chairperson']);

      if (error) throw error;

      // Get assignment counts for each reviewer from both old and new systems
      const reviewersWithCounts = await Promise.all(
        (reviewersData || []).map(async (reviewer) => {
          // Count from old reviewer column
          const { count: oldCount } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true })
            .eq('reviewer', reviewer.id)
            .eq('status', 'Proposal Review');

          // Count from new reviewers array (check if reviewer is in any reviewers array)
          const { count: newCount } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true })
            .contains('reviewer', [reviewer.id])
            .eq('status', 'Proposal Review');

          const totalAssignments = (oldCount || 0) + (newCount || 0);

          return {
            ...reviewer,
            assignedCount: totalAssignments
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

        // Filter out system files
        const validManuFiles = manuList?.filter(f =>
          !f.name.startsWith('.') &&
          !f.name.includes('emptyfolderplaceholder')
        ) || [];

        setManuscriptDocs(
          validManuFiles.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name }))
        );

        // Repeat the same filtering for forms and revision lists...
        const { data: formsList, error: formsErr } = await supabase.storage
          .from("documents")
          .list(`${id}/${formsPhase}`);

        if (formsErr) throw formsErr;

        const validFormsFiles = formsList?.filter(f =>
          !f.name.startsWith('.') &&
          !f.name.includes('emptyfolderplaceholder')
        ) || [];

        setFormsDocs(
          validFormsFiles.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name }))
        );

        // Fetch interactive form_data records
        const { data: formDataRows } = await supabase
          .from("form_data")
          .select("form_name")
          .eq("proposal_id", parseInt(id));
        setInteractiveForms((formDataRows || []).map((r: any) => r.form_name));

        // For revision phase
        if (status === "Check Revision") {
          const { data: revisionList, error: revisionErr } = await supabase.storage
            .from("documents")
            .list(`${id}/${revisionPhase}`);

          if (revisionErr) throw revisionErr;

          const validRevisionFiles = revisionList?.filter(f =>
            !f.name.startsWith('.') &&
            !f.name.includes('emptyfolderplaceholder')
          ) || [];

          setRevisionDocs(
            validRevisionFiles.map((f) => ({ name: f.name.replace(".pdf", ""), file: f.name }))
          );
        }
      } catch (err: any) {
        toast.error("Failed to fetch documents: " + err.message);
      }
    };

    fetchDocs();
  }, [id, status]);

  React.useEffect(() => {
    if (selectedDoc && activePreview) {
      fetchDoc();
    }
  }, [selectedDoc, activePreview]);

  async function fetchDoc() {
    if (!selectedDoc || !activePreview) return;

    let phase = "";
    if (activePreview === "manuscript") {
      phase = "Send Manuscript";
    } else if (activePreview === "forms") {
      phase = "Send Forms";
    } else if (activePreview === "revision") {
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

  // Lock body scroll when document is open fullscreen
  React.useEffect(() => {
    document.body.style.overflow = activePreview ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activePreview]);

  // Auto-set to deny for reviewers
  React.useEffect(() => {
    if (currentUserRole === "Reviewer" && type === "Check") {
      setTog("deny");
    }
  }, [currentUserRole, type]);

  // Handle risk assessment form completion
  const handleRiskAssessmentComplete = (answers: Record<string, string>) => {
    setRiskAssessmentAnswers(answers);
    setRiskAssessmentCompleted(true);
    setShowRiskAssessmentForm(false);
    toast.success("Risk assessment form completed successfully");
  };

  // Start risk assessment process
  const handleStartRiskAssessment = () => {
    setShowRiskAssessmentForm(true);
  };

  async function handleSubmit() {
    const loading = toast.loading("Loading...");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const actorId = userData?.user?.id;
      if (!actorId) throw new Error("No logged-in user found.");

      const affectedFiles =
        tog === "deny"
          ? selectedFiles.map((fileName) => ({ name: fileName, required: true }))
          : [];

      if (type === "Assess") {
        if (!tog) {
          toast.error("Please select a review type before submitting.");
          return;
        }

        if (!riskAssessmentCompleted) {
          toast.error("Please complete the risk assessment form before selecting review type.");
          return;
        }

        // Generate protocol code when review type is assigned
        let protocolCode = "";
        try {
          protocolCode = await updateProtocolCode(id, type, tog);
        } catch (error: any) {
          console.error("Failed to generate protocol code:", error);
          // Don't fail the entire operation if protocol code generation fails
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
          comment: `Risk assessment set as "${tog}"${protocolCode ? `. Protocol Code: ${protocolCode}` : ''}`,
          affected_files: JSON.stringify([]),
          actor: actorId,
        });

        toast.success(`Risk assessment saved as "${tog}"${protocolCode ? `. Protocol Code: ${protocolCode}` : ''}`);
      } else if (type === "Assign") {
        if (!reviewType) {
          toast.error("Review type not found. Please complete risk assessment first.");
          return;
        }

        if (selectedReviewers.length !== requiredReviewerCount) {
          toast.error(`Please select exactly ${requiredReviewerCount} reviewer(s) for ${reviewType} review`);
          return;
        }

        // Generate protocol code
        let protocolCode = "";
        try {
          protocolCode = await updateProtocolCode(id, type, reviewType);
        } catch (error: any) {
          toast.error("Failed to generate protocol code: " + error.message);
          return;
        }

        const { error } = await supabase
          .from("proposals")
          .update({
            review_type: reviewType,
            reviewer: selectedReviewers,
            status: "Proposal Review",
            updated_on: new Date().toISOString(),
          })
          .eq("proposal_id", id);

        if (error) throw error;

        // Create history entry
        const reviewerNames = selectedReviewers.map(reviewerId => {
          const reviewer = reviewers.find(r => r.id === reviewerId);
          return reviewer ? `${reviewer.fname} ${reviewer.lname}` : 'Unknown';
        }).join(', ');

        await supabase.from("proposals").update(
          {
            reviewer: selectedReviewers,
          }).eq("proposal_id", id)
          ;

        await supabase.from("history").insert({
          history_type: "assignment",
          paper_id: id,
          comment: `Assigned to ${selectedReviewers.length} reviewer(s) for ${reviewType} review: ${reviewerNames}. Protocol Code: ${protocolCode}`,
          actor: actorId,
          action: "Assign Reviewers",
          history_date: new Date().toISOString(),
        });

        toast.success(`Assigned ${selectedReviewers.length} reviewer(s) for ${reviewType} review. Protocol Code: ${protocolCode}`);
      } else if (tog === "deny") {
        // For reviewers, don't update the status, just add a comment
        if (currentUserRole === "Reviewer") {
          await supabase.from("history").insert({
            history_type: "deny",
            paper_id: id,
            comment: msg || "Reviewer comments",
            affected_files: JSON.stringify(affectedFiles),
            actor: actorId,
            action: "Reviewer Feedback",
            history_date: new Date().toISOString(),
          });

          toast.success("Review comments submitted");
        } else {
          // For non-reviewers, update status as before
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
        }
      } else {
        // Only allow approval for non-reviewers
        if (currentUserRole !== "Reviewer") {
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
      }
    } catch (error: any) {
      toast.error("Submit Error: " + error.message);
    } finally {
      toast.dismiss(loading);
      navigate("/ssubm/sub1");
    }
  }

  // Update the useEffect that handles reviewer selection
  React.useEffect(() => {
    if (currentUserId && type === "Assign") {
      // Always add current user as assigner
      setSelectedReviewers(prev => {
        if (!prev.includes(currentUserId)) {
          return [...prev, currentUserId];
        }
        return prev;
      });
    }
  }, [currentUserId, type]);

  // Determine which documents to show based on current status
  const requirementDocs =
    status === "Check Manuscript" ? manuscriptDocs :
      status === "Forms Check" ? formsDocs :
        status === "Deploy Queue" ? [...manuscriptDocs, ...formsDocs] : // Show both manuscript and forms for Deploy Queue
          status === "Check Revision" ? revisionDocs : [];

  // Get current documents based on active preview
  const getCurrentDocs = () => {
    switch (activePreview) {
      case "manuscript":
        return manuscriptDocs;
      case "forms":
        return formsDocs;
      case "revision":
        return revisionDocs;
      default:
        return [];
    }
  };

  const getPreviewTitle = () => {
    switch (activePreview) {
      case "manuscript":
        return "Manuscript Documents";
      case "forms":
        return "Forms Documents";
      case "revision":
        return "Revision Documents";
      default:
        return "Document Preview";
    }
  };

  const handleOpenPreview = (type: "manuscript" | "forms" | "revision") => {
    setActivePreview(type);
    setSelectedDoc("");
    setDocURL("");
    setActiveInteractiveForm(null);
    setIsFullscreen(false);
  };

  const handleClosePreview = () => {
    setActivePreview(null);
    setSelectedDoc("");
    setDocURL("");
    setIsFullscreen(false);
  };

  const renderFullscreenPreview = () => {
    const currentDocs = getCurrentDocs();

    return (
      <div className="fixed inset-0 z-50 flex bg-white">
        {/* Sidebar - File List */}
        <div className="w-72 bg-gray-50 border-r flex flex-col flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b bg-white">
            <h2 className="text-base font-semibold">{getPreviewTitle()}</h2>
            <p className="text-xs text-gray-500 mt-1">Select a document to view</p>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {currentDocs.map((doc) => (
              <Button
                key={doc.file}
                variant={selectedDoc === doc.file ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDoc(doc.file);
                  setActiveInteractiveForm(null);
                }}
                className="w-full justify-start text-left h-auto py-3 px-4 overflow-hidden text-ellipsis"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate text-ellipsis">{doc.name}</span>
                </div>
              </Button>
            ))}
            {activePreview === "forms" && interactiveForms.map((formName) => (
              <Button
                key={formName}
                variant={activeInteractiveForm === formName ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInteractiveForm(formName);
                  setSelectedDoc("");
                  setDocURL("");
                }}
                className="w-full justify-start text-left h-auto py-3 px-4 overflow-hidden text-ellipsis"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="h-4 w-4 flex-shrink-0 text-blue-500" />
                  <span className="text-sm truncate text-ellipsis">{formName.replace(".pdf", "")}</span>
                </div>
              </Button>
            ))}
            {currentDocs.length === 0 && interactiveForms.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No documents available</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Document Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-white flex-shrink-0">
            <h3 className="text-sm font-semibold truncate">
              {activeInteractiveForm ? activeInteractiveForm.replace('.pdf', '') : selectedDoc ? selectedDoc.replace('.pdf', '') : 'Select a document'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClosePreview}
              className="flex items-center gap-2 flex-shrink-0 ml-2"
            >
              <CloseIcon className="h-4 w-4" />
              Close
            </Button>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-auto bg-gray-100 relative">
            {activeInteractiveForm ? (
              <div className="min-h-full flex flex-col">
                <FormViewer
                  key={`${id}-${activeInteractiveForm}`}
                  documentName={activeInteractiveForm}
                  proposalId={parseInt(id)}
                  readOnly={true}
                  onDone={() => setActiveInteractiveForm(null)}
                />
              </div>
            ) : !selectedDoc ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Select a document from the sidebar</p>
                </div>
              </div>
            ) : docURL === null ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Document does not exist.</p>
                  <p className="text-sm text-gray-400 mt-2">The requested document could not be found.</p>
                </div>
              </div>
            ) : !docURL ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center w-full px-8">
                  <Skeleton className="w-64 h-8 mx-auto mb-4" />
                  <Skeleton className="w-full h-96 max-w-2xl mx-auto" />
                </div>
              </div>
            ) : (
              <iframe
                src={docURL}
                className="w-full h-full border-0"
                title={selectedDoc?.replace('.pdf', '') || "Document Viewer"}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case "Full Board":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "Expedited":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "Exempt":
        return <Ban className="w-4 h-4 text-green-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  // Render risk assessment form viewer
  // Render risk assessment form viewer
  if (showRiskAssessmentForm) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-lg">Risk Assessment Form</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowRiskAssessmentForm(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 relative">
          <PdfFormViewer
            document="risk_assessment_form.pdf" // Replace with your actual risk assessment form name
            onAnswersSubmit={handleRiskAssessmentComplete}
            proposalId={parseInt(id)}
            status="Risk Assessment"
          />
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

      {/* Review Comments Section - Only show for reviewers */}
      {currentUserRole === "Reviewer" && reviewComments.length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <User className="text-primary w-5 h-5" /> Review Comments
          </h2>
          <div className="space-y-4">
            {reviewComments.map((comment, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm">
                    {comment.profiles?.fname && comment.profiles?.lname
                      ? `${comment.profiles.fname} ${comment.profiles.lname}`
                      : 'Reviewer'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(comment.history_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {comment.comment || "No specific comments provided"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
            onClick={() => handleOpenPreview("manuscript")}
          >
            View Details
          </Button>
        </div>

        {/* Forms */}
        <div className="flex justify-between items-center py-3 border-b">
          <p className="font-medium flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" /> Forms
          </p>
          <Button
            variant="outline"
            type="button"
            disabled={(status === "Check Manuscript" || status === "Risk Assessment")}
            onClick={() => handleOpenPreview("forms")}
          >
            View Details
          </Button>
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
              onClick={() => handleOpenPreview("revision")}
            >
              View Details
            </Button>
          </div>
        )}
      </section>

      {/* Fullscreen Document Preview */}
      {activePreview && renderFullscreenPreview()}

      {/* Form Section - Only wrap the actual form controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Risk Assessment Form Section */}
        {type === "Assess" && (
          <section className="bg-white p-6 rounded-lg shadow-md border mb-6">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <FileCheck className="text-primary w-5 h-5" /> Risk Assessment Form
            </h2>

            {!riskAssessmentCompleted ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Complete Risk Assessment Form
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Please complete the risk assessment form before selecting the review type.
                  This form will help determine the appropriate level of review required.
                </p>
                <Button
                  onClick={handleStartRiskAssessment}
                  className="flex items-center gap-2 mx-auto"
                >
                  <FileCheck className="h-4 w-4" />
                  Start Risk Assessment Form
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">Risk Assessment Completed</h4>
                    <p className="text-sm text-green-600">
                      The risk assessment form has been successfully completed. You may now select the review type.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartRiskAssessment}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Form
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reviewer Assignment */}
        <section hidden={type !== "Assign"} className="bg-white p-6 rounded-lg shadow-md border mb-6">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <User className="text-primary w-5 h-5" /> Assign Reviewers
          </h2>

          {/* Review Type Display */}
          {reviewType && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Review Type</h3>
              <div className="flex items-center gap-3 p-3 bg-white rounded-md border">
                {getReviewTypeIcon(reviewType)}
                <div>
                  <div className="font-medium text-sm">{reviewType} Review</div>
                  <div className="text-xs text-gray-500">
                    {reviewType === "Full Board" ? "5 reviewers required" :
                      reviewType === "Expedited" ? "3 reviewers required" :
                        "1 reviewer required (auto-assigned to you)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selection Counter */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Selected: {selectedReviewers.length} / {requiredReviewerCount} reviewers
              </span>
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Crown className="h-3 w-3" /> You are automatically assigned as chairperson
              </span>
            </div>
          </div>

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
              {reviewers.map((reviewer) => {
                const isSelected = selectedReviewers.includes(reviewer.id);
                const canSelect = reviewer.assignedCount < 3 &&
                  (reviewType === "Exempt" ? reviewer.id === currentUserId : selectedReviewers.length < requiredReviewerCount);

                return (
                  <div
                    key={reviewer.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : canSelect
                        ? "hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                      } ${reviewer.id === currentUserId ? "border-l-4 border-l-blue-500" : ""}`}
                    // In the reviewer click handler, prevent removal of assigner
                    onClick={() => {
                      // Prevent removing the assigner (current user)
                      if (reviewer.id === currentUserId) return;

                      if (!canSelect && !isSelected) return;

                      if (isSelected) {
                        setSelectedReviewers(prev => prev.filter(id => id !== reviewer.id));
                      } else {
                        setSelectedReviewers(prev => [...prev, reviewer.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded-full">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          {reviewer.fname} {reviewer.lname}
                          {reviewer.id === currentUserId && (
                            <Crown className="h-3 w-3 mr-1" />
                          )}
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

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : reviewer.assignedCount >= 3 ? (
                          <X className="h-5 w-5 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}

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
          <RadioGroup
            value={tog}
            onValueChange={currentUserRole === "Reviewer" ? undefined : setTog}
            className="space-y-4"
          >
            {/* Approve - Hidden for reviewers */}
            {currentUserRole !== "Reviewer" && (
              <div className="bg-card flex items-start p-4 rounded-xl shadow-sm border-2">
                <RadioGroupItem
                  value="approve"
                  className="my-auto mr-4 w-4 h-4 z-0"
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
            )}

            {/* Deny - Auto-selected and required for reviewers */}
            <div className="bg-card flex flex-col p-4 rounded-xl shadow-sm border-2 space-y-3">
              <div className="flex items-center">
                <RadioGroupItem
                  value="deny"
                  className="my-auto mr-4 w-4 h-4 z-0"
                  checked={tog === "deny"}
                  disabled={currentUserRole === "Reviewer"}
                />
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {currentUserRole === "Reviewer" ? "Reviewer Comments" : "Request Revision"}
                    <Pencil className="w-3 h-3 text-orange-500" />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {currentUserRole === "Reviewer"
                      ? "Provide your review comments and feedback"
                      : "Select which files to revise and leave a comment"}
                  </div>
                </div>
              </div>

              {tog === "deny" && (
                <div className="ml-8 space-y-3">
                  {currentUserRole !== "Reviewer" && requirementDocs.map((doc) => (
                    <div key={doc.file} className="flex items-center space-x-2">
                      <Checkbox
                        id={`doc-${doc.file}`}
                        checked={selectedFiles.includes(doc.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFiles((prev) => [...prev, doc.name]);
                          } else {
                            setSelectedFiles((prev) =>
                              prev.filter((f) => f !== doc.name)
                            );
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`doc-${doc.file}`} 
                        className="cursor-pointer font-normal text-sm"
                      >
                        {doc.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {tog === "deny" && (
                <Textarea
                  placeholder={
                    currentUserRole === "Reviewer"
                      ? "Type your review comments here..."
                      : "Type your message here."
                  }
                  className="resize-none mt-2 z-50 text-sm"
                  value={msg}
                  onChange={(event) => setMsg(event.target.value)}
                  required={currentUserRole === "Reviewer"}
                />
              )}
            </div>
          </RadioGroup>
        </section>

        {/* Risk Assessment - Only show if form is completed */}
        <section hidden={type !== "Assess" || !riskAssessmentCompleted} className="bg-white p-6 rounded-lg shadow-md border mb-6">
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
                className="my-auto mr-4 w-4 h-4 z-0"
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
                className="my-auto mr-4 w-4 h-4 z-0"
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
                className="my-auto mr-4 w-4 h-4 z-0"
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
            className="w-24 z-0"
            hidden={type === "Pending" || type === "View"}
            disabled={
              (type === "Check" || type === "Assess") ? tog === "" :
                (type === "Assign") ? selectedReviewers.length !== requiredReviewerCount : false
            }
          >
            {currentUserRole === "Reviewer" && type === "Check" ? "Submit Comments" : "Submit"}
          </RippleButton>
          <RippleButton
            type="button"
            variant="outline"
            className="w-24 z-0"
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