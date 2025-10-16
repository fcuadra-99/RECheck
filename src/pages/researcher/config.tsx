import { FileText, Shield, ClipboardList, Rocket, Users, Flag, Archive } from "lucide-react";
import { supabase } from "@/DB";
import { DocumentItem, Submission, HistoryEntry } from "./types";

export const phases = [
    {
        title: "Phase 1: Manuscript Submission",
        statuses: ["Send Manuscript", "Check Manuscript", "Resend Manuscript"],
    },
    {
        title: "Phase 2: Risk Assessment",
        statuses: ["Risk Assessment"]
    },
    {
        title: "Phase 3: Forms Submission",
        statuses: ["Send Forms", "Forms Check", "Resend Forms"],
    },
    {
        title: "Phase 4: Deployment Queue",
        statuses: ["Deploy Queue", "Send Revision", "Check Revision", "Resend Revision"]
    },
    {
        title: "Phase 5: Documents Review",
        statuses: ["Assign Review", "Proposal Review", "Revise Proposal"],
    },
    {
        title: "Phase 6: Data Collection & Reporting",
        statuses: ["Data Collection", "Deviation Check", "Send Deviation Report", "Send Study Report", "Revise Documents", "Study Report Check"],
    },
    {
        title: "Phase 7: Final Report & Archival",
        statuses: ["Send Report", "Archive Files"],
    },
];

// icon mapping for phases
export const phaseIcons = [FileText, Shield, ClipboardList, Rocket, Users, Flag, Archive];

export const getNextStatus = (status: string) => {
    switch (status) {
        case "Send Manuscript":
            return "Check Manuscript";
        case "Check Manuscript":
            return "Risk Assessment";
        case "Resend Manuscript":
            return "Check Manuscript";
        case "Risk Assessment":
            return "Send Forms";
        case "Send Forms":
            return "Forms Check";
        case "Forms Check":
            return "Deploy Queue";
        case "Resend Forms":
            return "Forms Check";
        case "Data Collection":
            return "Deviation Check";
        case "Send Deviation Report":
            return "Study Report Check";
        case "Send Study Report":
            return "Study Report Check";
        default:
            return status;
    }
};

export const getActionLabel = (status: string) => {
    switch (status) {
        case "Send Manuscript":
            return "Submit";
        case "Check Manuscript":
            return "View";
        case "Resend Manuscript":
            return "Resubmit";
        case "Risk Assessment":
            return "View";
        case "Send Forms":
            return "Submit";
        case "Forms Check":
            return "View";
        case "Resend Forms":
            return "Resubmit";
        case "Deploy Queue":
            return "View";
        case "Data Collection":
            return "View";
        default:
            return "View";
    }
};

export const getPhaseDocuments = (submission: Submission): DocumentItem[] => {
    if (["Send Manuscript", "Resend Manuscript"].includes(submission.status)) {
        // Manuscript phase - all documents are uploadable
        return [
            { name: "Revised Manuscript", templateUrl: "/templates/manuscript.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Minutes of Proposal Defense", templateUrl: "/templates/minutes.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "Updated CV", templateUrl: "/templates/cv.pdf", required: true, needsSignature: false, needsAnswer: false },
            { name: "All Grades", templateUrl: "/templates/grades.pdf", required: true, needsSignature: false, needsAnswer: false },
            submission.category === "Graduate"
                ? { name: "Receipt for Defense Proposal", templateUrl: "/templates/receipt.pdf", required: true, needsSignature: false, needsAnswer: false }
                : null,
        ].filter(Boolean) as DocumentItem[];
    }

    if (["Send Forms", "Resend Forms"].includes(submission.status)) {
        const isExternal = submission.category === "External";
        const isGrad = submission.category === "Graduate";
        // normalize review type for robust comparisons
        const reviewTypeRaw = (submission.review_type || "").toString();
        const reviewType = reviewTypeRaw.trim().toLowerCase() || "exempt"; // default to exempt when missing

        // Common document properties
        const makeDoc = (name: string): DocumentItem => ({
            name,
            templateUrl: "", // No template URL as these are forms to be filled out directly
            required: true,
            needsSignature: true,
            needsAnswer: true,
        });

        if (isExternal) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0036_MOA for external.pdf"),
                ];
            }

            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0027_Ethics Application Procedure.pdf"),
                makeDoc("REC_FO_0028_Ethics Study Protocol Information Form.pdf"),
                makeDoc("REC_FO_0029_Ethics Informed Consent CHECKLIST.pdf"),
                makeDoc("REC_FO_0030_Ethics Informed Consent Form when Questionnaire are Used.pdf"),
                makeDoc("REC_FO_0031_Ethics Informed Consent Form (ICF)_Sample.pdf"),
                makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
                makeDoc("REC_FO_0036_MOA for external.pdf"),
            ];
        }

        if (isGrad) {
            if (reviewType === "exempt") {
                return [
                    makeDoc("REC_ENDORSMENT_FORM.pdf"),
                    makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                    makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                    makeDoc("REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf"),
                ];
            }

            // EXPEDITED and FULL BOARD use same documents
            return [
                makeDoc("REC_ENDORSMENT_FORM.pdf"),
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0027_Ethics Application Procedure.pdf"),
                makeDoc("REC_FO_0028_Ethics Study Protocol Information Form.pdf"),
                makeDoc("REC_FO_0029_Ethics Informed Consent CHECKLIST.pdf"),
                makeDoc("REC_FO_0030_Ethics Informed Consent Form when Questionnaire are Used.pdf"),
                makeDoc("REC_FO_0031_Ethics Informed Consent Form (ICF)_Sample.pdf"),
                makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
            ];
        }

        // UNDERGRAD
        if (reviewType === "exempt") {
            return [
                makeDoc("REC_FO_0032_EthicsProtocolChecklist.pdf"),
                makeDoc("REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf"),
                makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
            ];
        }

        // EXPEDITED and FULL BOARD use same documents
        return [
            makeDoc("REC_FO_0026_EthicsProtocolChecklist.pdf"),
            makeDoc("REC_FO_0027_EthicsApplicationProcedure.pdf"),
            makeDoc("REC_FO_0028_EthicsStudyProtocolInformationForm.pdf"),
            makeDoc("REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf"),
            makeDoc("REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf"),
            makeDoc("REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf"),
            makeDoc("REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf"),
            makeDoc("REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship(2).pdf"),
        ];
    }

    return [];
};

export const getLatestHistory = async (proposal_id: number): Promise<HistoryEntry | null> => {
    const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("paper_id", proposal_id)
        .order("history_date", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Failed to fetch history:", error);
        return null;
    }
    return data as HistoryEntry;
};

/* helper: map phase index -> upload-status folder name (or null if phase has no uploads) */
export const phaseUploadStatus = (phaseIndex: number): string | null => {
    if (phaseIndex === 0) return "Send Manuscript";
    if (phaseIndex === 2) return "Send Forms";
    if (phaseIndex === 5) return "Data Collection"; // For Phase 6: Data Collection & Reporting
    return null;
};