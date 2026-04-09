/**
 * FormViewer — maps a document name to its React form component.
 * Handles local save/load per proposal+document, autofill, and read-only advisor fields.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/DB";
import RECEndorsementForm from "./REC_EndorsementForm";
import EthicsProtocolChecklist from "./REC_FO_0026";
import EthicsApplicationProcedure from "./REC_FO_0027";
import EthicsStudyProtocolInformationForm from "./REC_FO_0028";
import EthicsInformedConsentChecklist from "./REC_FO_0029";
import EthicsInformedConsentAssessmentForm from "./REC_FO_0030";
import EthicsInformedConsentFormSample from "./REC_FO_0031";
import EthicsChecklistForm from "./REC_FO_0032";
import ProtocolInformationForm from "./REC_FO_0033";
import EthicsAssentFormSample from "./REC_FO_0034";
import EthicsMOAFormFullBoard from "./REC_FO_0036_FullBoard";
import EthicsMOAForm from "./REC_FO_0036_Exempt";

export interface FormProps {
  /** Proposal ID — used as localStorage key namespace */
  proposalId: number;
  /** Protocol code / control number to autofill */
  protocolCode?: string | null;
  /** Researcher's full name */
  researcherName?: string;
  /** Advisor's full name (read-only in form) */
  advisorName?: string;
  /** Proposal title */
  proposalTitle?: string;
  /** Type of review (e.g. "Full Board", "Expedited", "Exempt") */
  reviewType?: string | null;
  /** The document filename — used for storage path */
  formName?: string;
  /** Persisted form data loaded from localStorage */
  savedData?: Record<string, any>;
  /** Called whenever a field changes so we can persist */
  onSave?: (data: Record<string, any>) => void;
  /** Whether advisor-only fields should be locked */
  readOnlyAdvisor?: boolean;
}

type FormComponent = React.ComponentType<FormProps>;

const DOC_COMPONENT_MAP: Record<string, FormComponent> = {
  "REC_ENDORSMENT_FORM.pdf": RECEndorsementForm as FormComponent,
  "REC_FO_0026_EthicsProtocolChecklist.pdf": EthicsProtocolChecklist as FormComponent,
  "REC_FO_0027_EthicsApplicationProcedure.pdf": EthicsApplicationProcedure as FormComponent,
  "REC_FO_0028_EthicsStudyProtocolInformationForm.pdf": EthicsStudyProtocolInformationForm as FormComponent,
  "REC_FO_0028_EthicsStudy ProtocolInformation Form.pdf": EthicsStudyProtocolInformationForm as FormComponent,
  "REC_FO_0029_EthicsInformedConsentCHECKLIST.pdf": EthicsInformedConsentChecklist as FormComponent,
  "REC_FO_0029_EthicsInformedConsent CHECKLIST.pdf": EthicsInformedConsentChecklist as FormComponent,
  "REC_FO_0030_EthicsInformedConsentFormwhenQuestionnaireareUsed.pdf": EthicsInformedConsentAssessmentForm as FormComponent,
  "REC_FO_0031_EthicsInformedConsentForm(ICF)_Sample.pdf": EthicsInformedConsentFormSample as FormComponent,
  "REC_FO_0031_Ethics Informed Consent Form (ICF)_Sample.pdf": EthicsInformedConsentFormSample as FormComponent,
  "REC_FO_0032_EthicsProtocolChecklist.pdf": EthicsChecklistForm as FormComponent,
  "REC_FO_0033_ProtocolInformationFormforExemption(PIFE)_Sample.pdf": ProtocolInformationForm as FormComponent,
  "REC_FO_0034_Ethics-Assent-Form-18-below-respondents_Sample.pdf": EthicsAssentFormSample as FormComponent,
  "REC_FO_0035_Ethics Memorandum of Agreement for Authorship.pdf": EthicsMOAForm as FormComponent,
  "REC_FO_0035_Ethics_MemorandumofAgreementforAuthorship.pdf": EthicsMOAForm as FormComponent,
  "REC_FO_0036_MOA for external.pdf": EthicsMOAFormFullBoard as FormComponent,
};

function storageKey(proposalId: number, documentName: string) {
  return `form_${proposalId}_${documentName}`;
}

interface FormViewerProps {
  documentName: string;
  proposalId: number;
  protocolCode?: string | null;
  researcherName?: string;
  advisorId?: string | null;
  proposalTitle?: string;
  reviewType?: string | null;
  readOnlyAdvisor?: boolean;
  /** Fully read-only mode — no editing, no Done button */
  readOnly?: boolean;
  onDone: () => void;
}

export default function FormViewer({
  documentName,
  proposalId,
  protocolCode,
  researcherName,
  advisorId,
  proposalTitle,
  reviewType,
  readOnlyAdvisor = true,
  readOnly = false,
  onDone,
}: FormViewerProps) {
  const FormComponent = DOC_COMPONENT_MAP[documentName];
  const key = storageKey(proposalId, documentName);

  const [advisorName, setAdvisorName] = useState<string>("");
  const [savedData, setSavedData] = useState<Record<string, any>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load saved data: prefer DB, fall back to localStorage
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("form_data")
        .select("data")
        .eq("proposal_id", proposalId)
        .eq("form_name", documentName)
        .single();

      if (data?.data) {
        console.log(`[FormViewer] Loaded from DB for "${documentName}":`, JSON.stringify(data.data, null, 2));
        setSavedData(data.data);
      } else {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            setSavedData(parsed);
          }
        } catch { /* ignore */ }
      }
      setDataLoaded(true);
    };
    load();
  }, [proposalId, documentName]);

  useEffect(() => {
    if (!advisorId) { return; }
    supabase
      .from("profiles")
      .select("fname, lname")
      .eq("id", advisorId)
      .single()
      .then(({ data }) => {
        if (data) setAdvisorName(`${data.fname ?? ""} ${data.lname ?? ""}`.trim());
      });
  }, [advisorId]);

  // Seed localStorage with autofill prop values so handleDone captures them
  useEffect(() => {
    if (!dataLoaded) return;
    const autofills: Record<string, any> = {};
    if (protocolCode) autofills.controlNo = protocolCode;
    if (proposalTitle) { autofills.protocolTitle = proposalTitle; autofills.researchTitle = proposalTitle; autofills.studyProtocolTitle = proposalTitle; }
    if (researcherName) {
      autofills.principalInvestigator = [researcherName];
      autofills.studentResearchers = [researcherName];
      autofills.tablePrincipalInvestigator = [researcherName];
      autofills.submittedMembers = [{ name: researcherName, signature: "" }];
      autofills.preparedMembers = [{ name: researcherName, signature: "" }];
    }
    if (reviewType) autofills.typeOfReview = reviewType;

    const fromStorage = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(autofills)) {
      if (savedData[k] === undefined && fromStorage[k] === undefined) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      localStorage.setItem(key, JSON.stringify({ ...savedData, ...fromStorage, ...patch }));
    }
  }, [dataLoaded]);

  // Seed advisor-based autofills once advisorName resolves
  useEffect(() => {
    if (!dataLoaded || !advisorName) return;
    const fromStorage = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    const patch: Record<string, any> = {};
    if (!savedData.endorsedMembers && !fromStorage.endorsedMembers)
      patch.endorsedMembers = [{ name: advisorName, signature: "" }];
    if (!savedData.facultyResearchers && !fromStorage.facultyResearchers)
      patch.facultyResearchers = [advisorName];
    if (Object.keys(patch).length > 0) {
      localStorage.setItem(key, JSON.stringify({ ...savedData, ...fromStorage, ...patch }));
    }
  }, [dataLoaded, advisorName]);

  const handleSave = (data: Record<string, any>) => {
    try {
      const fromStorage = (() => {
        try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
      })();
      // Merge: DB-loaded savedData as base, then localStorage overrides, then new patch on top
      const merged = { ...savedData, ...fromStorage, ...data };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {
    }
  };

  const handleDone = async () => {
    // Merge: DB-loaded savedData as base, then localStorage overrides
    let fromStorage: Record<string, any> = {};
    try {
      const raw = localStorage.getItem(key);
      fromStorage = raw ? JSON.parse(raw) : {};
    } catch { /* ignore */ }

    const data = { ...savedData, ...fromStorage };

    console.log(`[FormViewer] Saving form_data for "${documentName}":`, JSON.stringify(data, null, 2));

    // Upsert to form_data table
    await supabase.from("form_data").upsert(
      { proposal_id: proposalId, form_name: documentName, data, updated_at: new Date().toISOString() },
      { onConflict: "proposal_id,form_name" }
    );

    onDone();
  };

  if (!FormComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
        <p className="text-sm">No form component found for:</p>
        <p className="text-xs font-mono bg-gray-100 px-3 py-1 rounded">{documentName}</p>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading form...
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-auto bg-gray-100 p-6 ${readOnly ? "pointer-events-none select-none" : ""}`}>
        <div className="shadow-lg rounded-sm">
          <FormComponent
            key={`${proposalId}-${documentName}`}
            proposalId={proposalId}
            protocolCode={protocolCode}
            researcherName={researcherName}
            advisorName={advisorName}
            proposalTitle={proposalTitle}
            formName={documentName}
            savedData={savedData}
            onSave={readOnly ? undefined : handleSave}
            reviewType={reviewType}
            readOnlyAdvisor={readOnlyAdvisor}
          />
        </div>
      </div>
      {!readOnly && (
        <div className="flex items-center justify-between gap-2 p-4 border-t bg-white">
          <span className="text-xs text-gray-400">Progress is saved automatically.</span>
          <button
            onClick={handleDone}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
