import { useRef, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Badge } from "@/components/ui/badge";

import RECEndorsementForm from "@/components/forms/REC_EndorsementForm";
import EthicsProtocolChecklist from "@/components/forms/REC_FO_0026";
import EthicsApplicationProcedure from "@/components/forms/REC_FO_0027";
import EthicsStudyProtocolInformationForm from "@/components/forms/REC_FO_0028";
import EthicsInformedConsentChecklist from "@/components/forms/REC_FO_0029";
import EthicsInformedConsentAssessmentForm from "@/components/forms/REC_FO_0030";
import EthicsInformedConsentFormSample from "@/components/forms/REC_FO_0031";
import EthicsAssentFormSample from "@/components/forms/REC_FO_0034";
import EthicsMOAFormFullBoard from "@/components/forms/REC_FO_0036_FullBoard";
import EthicsChecklistForm from "@/components/forms/REC_FO_0032";
import ProtocolInformationForm from "@/components/forms/REC_FO_0033";
import EthicsMOAForm from "@/components/forms/REC_FO_0036_Exempt";

type Category = "expedited" | "exempt" | "fullboard";

interface FormEntry {
  id: string;
  label: string;
  code: string;
  component: React.ComponentType;
  tag?: string;
}

const categoryMeta: Record<Category, { label: string; color: string; description: string }> = {
  expedited: {
    label: "Expedited Review",
    color: "border-blue-500 text-blue-700 bg-blue-50",
    description: "Forms for studies with minimal risk requiring expedited review",
  },
  exempt: {
    label: "Exempt Review",
    color: "border-green-500 text-green-700 bg-green-50",
    description: "Forms for studies exempt from full board review",
  },
  fullboard: {
    label: "Full Board Review",
    color: "border-purple-500 text-purple-700 bg-purple-50",
    description: "Forms for studies requiring full board ethics review",
  },
};

const formsByCategory: Record<Category, FormEntry[]> = {
  expedited: [
    { id: "endorsement", code: "Endorsement", label: "Endorsement Form", tag: "Graduate only", component: RECEndorsementForm },
    { id: "fo0026", code: "REC_FO_0026", label: "Ethics Protocol Checklist", component: EthicsProtocolChecklist },
    { id: "fo0027", code: "REC_FO_0027", label: "Ethics Application Procedure", component: EthicsApplicationProcedure },
    { id: "fo0028", code: "REC_FO_0028", label: "Study Protocol Information Form", component: EthicsStudyProtocolInformationForm },
    { id: "fo0029", code: "REC_FO_0029", label: "Informed Consent Checklist", component: EthicsInformedConsentChecklist },
    { id: "fo0030", code: "REC_FO_0030", label: "Informed Consent Assessment Form", component: EthicsInformedConsentAssessmentForm },
    { id: "fo0031", code: "REC_FO_0031", label: "Sample Informed Consent Form (ICF)", component: EthicsInformedConsentFormSample },
    { id: "fo0034", code: "REC_FO_0034", label: "Sample Assent Form", component: EthicsAssentFormSample },
    { id: "fo0036fb", code: "REC_FO_0036", label: "Memorandum of Agreement", component: EthicsMOAFormFullBoard },
  ],
  exempt: [
    { id: "endorsement3", code: "Endorsement", label: "Endorsement Form", tag: "Graduate only", component: RECEndorsementForm },
    { id: "fo0032", code: "REC_FO_0032", label: "Ethics Protocol Checklist", component: EthicsChecklistForm },
    { id: "fo0033", code: "REC_FO_0033", label: "Protocol Information Form for Exemption (PIFE)", component: ProtocolInformationForm },
    { id: "fo0036ex", code: "REC_FO_0036", label: "Memorandum of Agreement", component: EthicsMOAForm },
  ],
  fullboard: [
    { id: "endorsement2", code: "Endorsement", label: "Endorsement Form", tag: "Graduate only", component: RECEndorsementForm },
    { id: "fo0026b", code: "REC_FO_0026", label: "Ethics Protocol Checklist", component: EthicsProtocolChecklist },
    { id: "fo0027b", code: "REC_FO_0027", label: "Ethics Application Procedure", component: EthicsApplicationProcedure },
    { id: "fo0028b", code: "REC_FO_0028", label: "Study Protocol Information Form", component: EthicsStudyProtocolInformationForm },
    { id: "fo0029b", code: "REC_FO_0029", label: "Informed Consent Checklist", component: EthicsInformedConsentChecklist },
    { id: "fo0030b", code: "REC_FO_0030", label: "Informed Consent Assessment Form", component: EthicsInformedConsentAssessmentForm },
    { id: "fo0031b", code: "REC_FO_0031", label: "Sample Informed Consent Form (ICF)", component: EthicsInformedConsentFormSample },
    { id: "fo0034b", code: "REC_FO_0034", label: "Sample Assent Form", component: EthicsAssentFormSample },
    { id: "fo0036fb2", code: "REC_FO_0036", label: "Memorandum of Agreement", component: EthicsMOAFormFullBoard },
  ],
};

const categories: Category[] = ["expedited", "exempt", "fullboard"];

export default function DocumentPrototype() {
  const [activeCategory, setActiveCategory] = useState<Category>("expedited");
  const [activeFormId, setActiveFormId] = useState<string>("endorsement");
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const forms = formsByCategory[activeCategory];
  const activeForm = forms.find((f) => f.id === activeFormId) ?? forms[0];
  const FormComponent = activeForm.component;

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setActiveFormId(formsByCategory[cat][0].id);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${activeForm.code} – ${activeForm.label}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        * { box-shadow: none !important; }
      }
    `,
    onBeforePrint: () => { setExporting(true); return Promise.resolve(); },
    onAfterPrint: () => setExporting(false),
  });

  const meta = categoryMeta[activeCategory];

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            REC Forms
          </h2>
        </div>

        {/* Category tabs */}
        <div className="flex flex-col border-b border-gray-200">
          {categories.map((cat) => {
            const m = categoryMeta[cat];
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`text-left px-4 py-3 text-xs font-medium border-l-2 transition-colors ${
                  activeCategory === cat
                    ? "border-l-primary bg-primary/5 text-primary"
                    : "border-l-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <div className="font-semibold">{m.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-normal">{formsByCategory[cat].length} forms</div>
              </button>
            );
          })}
        </div>

        {/* Form list */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {forms.map((form) => (
            <button
              key={form.id}
              onClick={() => setActiveFormId(form.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeFormId === form.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="text-[10px] text-gray-400 font-mono">{form.code}</div>
              <div className="text-xs mt-0.5 flex items-center gap-1.5">
                {form.label}
                {form.tag && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                    {form.tag}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Form viewer */}
      <main className="flex-1 overflow-auto bg-gray-100 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${meta.color}`}>
              {activeForm.code}
            </Badge>
            <span className="text-sm text-gray-700 font-medium truncate">{activeForm.label}</span>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.color}`}>
              {meta.label}
            </Badge>
          </div>
          <button
            onClick={() => handlePrint()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors ml-4 shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing..." : "Export PDF"}
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={printRef} className="shadow-lg rounded-sm">
            <FormComponent />
          </div>
        </div>
      </main>
    </div>
  );
}
