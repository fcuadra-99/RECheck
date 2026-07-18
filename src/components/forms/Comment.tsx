import { useEffect, useRef, useState } from "react";

interface CommentProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

const SECTIONS = [
  { key: "introduction",               label: "INTRODUCTION" },
  { key: "purposeOfStudy",             label: "PURPOSE OF THE STUDY" },
  { key: "studyProcedures",            label: "STUDY PROCEDURES" },
  { key: "potentialRisks",             label: "POTENTIAL RISKS AND DISCOMFORTS" },
  { key: "reimbursement",              label: "REIMBURSEMENT AND COMPENSATION" },
  { key: "potentialBenefits",          label: "POTENTIAL BENEFITS To respondents/AND TO SOCIETY" },
  { key: "dataPrivacy",                label: "DATA PRIVACY AND CONFIDENTIALITY" },
  { key: "voluntariness",              label: "VOLUNTARINESS OF PARTICIPATION AND RIGHTS TO WITHDRAW FROM THE RESEARCH" },
  { key: "investigatorContact",        label: "INVESTIGATOR'S and ADVISER'S CONTACT INFORMATION" },
  { key: "rightsOfParticipant",        label: "RIGHTS OF RESEARCH PARTICIPANT" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];
type Fields = Record<SectionKey, string>;

const defaultFields = (): Fields =>
  Object.fromEntries(SECTIONS.map((s) => [s.key, ""])) as Fields;

export default function Comment({ savedData = {}, onSave }: CommentProps) {
  const [fields, setFields] = useState<Fields>(() => {
    const defaults = defaultFields();
    for (const s of SECTIONS) {
      if (savedData[s.key] !== undefined) defaults[s.key] = savedData[s.key];
    }
    return defaults;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-expand all textareas on mount and whenever fields/savedData change
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll("textarea").forEach((el) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [fields, savedData]);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const setField = (key: SectionKey, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    onSave?.({ [key]: value, fields: next });
  };

  return (
    <div ref={containerRef}>
      <div style={pageContainer}>
        <table style={mainTable}>
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "62%" }} />
          </colgroup>
          <tbody>
            {/* Header row */}
            <tr>
              <th style={headerCell}>Sections/Subsection</th>
              <th style={headerCell}>Recommendations</th>
            </tr>

            {/* Section rows */}
            {SECTIONS.map((section) => (
              <tr key={section.key}>
                <td style={labelTd}>
                  <strong>{section.label}</strong>
                </td>
                <td style={recommendationTd}>
                  {/* Three underline input lines per row matching the PDF */}
                  <textarea
                    value={fields[section.key]}
                    onChange={(e) => setField(section.key, e.target.value)}
                    onInput={autoExpand}
                    rows={3}
                    placeholder=""
                    style={recommendationTextarea}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const pageContainer: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  margin: "0 auto",
  boxSizing: "border-box",
  background: "white",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  fontSize: "12px",
  color: "#000",
};

const mainTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const headerCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px 10px",
  fontWeight: 700,
  background: "#f0f0f0",
  textAlign: "center",
  verticalAlign: "middle",
};

const labelTd: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px 10px",
  verticalAlign: "top",
  lineHeight: 1.4,
  fontWeight: 700,
};

const recommendationTd: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px 10px",
  verticalAlign: "top",
};

const recommendationTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
  lineHeight: 2.2,        // mimics the ruled-line look from the PDF
  display: "block",
};
