import { useEffect, useState, useRef } from "react";
import SignatureCell from "./SignatureCell";

type YesNo = "" | "yes" | "no";
type YesNoNa = "" | "yes" | "no" | "na";
type RecommendationChoice = "" | "approved" | "minor" | "major" | "deferred" | "disapproved";

interface InformedConsentAssessmentFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

const DEFAULT_CHECKS: Record<string, YesNo | YesNoNa> = {
  q1NecessarySeekConsent: "",
  q2PurposeOfStudy: "",
  q3ExpectedDuration: "",
  q4Procedures: "",
  q5Discomforts: "",
  q6RisksDiscrimination: "",
  q7RandomAssignment: "",
  q8Benefits: "",
  q9AlternativeTreatments: "",
  q10CompensationInjury: "",
  q11ContactAssistance: "",
  q12RefusalPenalty: "",
  q13ExtentConfidentiality: "",
  q14SimpleLanguage: "",
  q15VoluntaryConsentProcess: "",
};

export default function InformedConsentAssessmentForm({ savedData = {}, onSave }: InformedConsentAssessmentFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    titleOfStudy: s.titleOfStudy ?? "",
    protocolCode: s.protocolCode ?? "",
    typeOfReview: s.typeOfReview ?? "",
    researcher: s.researcher ?? "",
    institution: s.institution ?? "",
    reviewer: s.reviewer ?? "",
    primaryReviewer: s.primaryReviewer ?? "",
    noExplain: s.noExplain ?? "",
    otherConcerns: s.otherConcerns ?? "",
    recommendationMinorReason1: s.recommendationMinorReason1 ?? "",
    recommendationMinorReason2: s.recommendationMinorReason2 ?? "",
    recommendationMajorReason1: s.recommendationMajorReason1 ?? "",
    recommendationMajorReason2: s.recommendationMajorReason2 ?? "",
    recommendationDeferredReason1: s.recommendationDeferredReason1 ?? "",
    recommendationDeferredReason2: s.recommendationDeferredReason2 ?? "",
    recommendationDeferredReason3: s.recommendationDeferredReason3 ?? "",
    recommendationDisapprovedReason1: s.recommendationDisapprovedReason1 ?? "",
    recommendationDisapprovedReason2: s.recommendationDisapprovedReason2 ?? "",
    recommendationDisapprovedReason3: s.recommendationDisapprovedReason3 ?? "",
    recommendationDisapprovedReason4: s.recommendationDisapprovedReason4 ?? "",
    reviewerSignatureName: s.reviewerSignatureName ?? "",
    reviewDate: s.reviewDate ?? "",
  });

  const [checks, setChecks] = useState<Record<string, YesNo | YesNoNa>>(s.checks ?? DEFAULT_CHECKS);
  const [recommendation, setRecommendation] = useState<RecommendationChoice>(s.recommendation ?? "");
  const [reviewerSignature, setReviewerSignature] = useState<string>(s.reviewerSignature ?? "");

  useEffect(() => {
    if (!s.checks) save({ checks: DEFAULT_CHECKS });
  }, []);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const setField = (key: string, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ [key]: value, fields: next });
  };

  const setCheck = (key: string, value: YesNo | YesNoNa) => {
    const next = { ...checks, [key]: value };
    setChecks(next);
    save({ checks: next });
  };

  const setRecommendationChoice = (value: RecommendationChoice) => {
    const next = recommendation === value ? "" : value;
    setRecommendation(next);
    save({ recommendation: next });
  };

  const renderYesNo = (key: string, withNa?: boolean) => (
    <>
      {withNa && (
        <label style={choiceLabel}>
          <input type="radio" name={key} checked={checks[key] === "na"} onChange={() => setCheck(key, "na")} style={radioStyle} /> Not applicable
        </label>
      )}
      <label style={choiceLabel}>
        <input type="radio" name={key} checked={checks[key] === "yes"} onChange={() => setCheck(key, "yes")} style={radioStyle} /> Yes
      </label>
      <label style={choiceLabel}>
        <input type="radio" name={key} checked={checks[key] === "no"} onChange={() => setCheck(key, "no")} style={radioStyle} /> No
      </label>
    </>
  );

  const renderCheckRow = (text: string, key: string, withNa?: boolean, bullet?: boolean) => (
    <tr>
      <td style={criteriaCell}>{bullet ? `• ${text}` : text}</td>
      <td style={optionWideCell}>{renderYesNo(key, withNa)}</td>
    </tr>
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const textareas = containerRef.current.querySelectorAll("textarea");
    textareas.forEach((el) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [fields, savedData]);

  return (
    <div ref={containerRef}>
      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={logoCell}>
                <img src="/logoo.png" alt="UIC" style={logoImage} />
              </td>
              <td style={titleCell}>
                <div style={headerTitle}>UNIVERSITY OF THE IMMACULATE CONCEPTION -</div>
                <div style={headerTitle}>RESEARCH ETHICS COMMITTEE</div>
                <div style={headerTitle}>(UIC-REC)</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={formTitleCell}>INFORMED CONSENT ASSESSMENT FORM</td>
            </tr>
          </tbody>
        </table>

        <table style={infoTable}>
          <tbody>
            <tr>
              <td style={labelCell}>Title of Study</td>
              <td colSpan={3} style={inputCell}>
                <textarea value={fields.titleOfStudy} onChange={(e) => setField("titleOfStudy", e.target.value)} onInput={autoExpand} rows={1} style={lineTextarea} />
              </td>
            </tr>
            <tr>
              <td style={labelCell}>Protocol Code</td>
              <td style={inputCell}><input value={fields.protocolCode} onChange={(e) => setField("protocolCode", e.target.value)} style={lineInput} /></td>
              <td style={labelCell}>Type of Review</td>
              <td style={inputCell}><input value={fields.typeOfReview} onChange={(e) => setField("typeOfReview", e.target.value)} style={lineInput} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Researcher</td>
              <td style={inputCell}><input value={fields.researcher} onChange={(e) => setField("researcher", e.target.value)} style={lineInput} /></td>
              <td style={labelCell}>Institution</td>
              <td style={inputCell}><input value={fields.institution} onChange={(e) => setField("institution", e.target.value)} style={lineInput} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Reviewer</td>
              <td style={inputCell}><input value={fields.reviewer} onChange={(e) => setField("reviewer", e.target.value)} style={lineInput} /></td>
              <td style={labelCell}>Primary reviewer</td>
              <td style={inputCell}><input value={fields.primaryReviewer} onChange={(e) => setField("primaryReviewer", e.target.value)} style={lineInput} /></td>
            </tr>
          </tbody>
        </table>

        <table style={checklistTable}>
          <tbody>
            <tr>
              <td style={sectionHead} colSpan={2}>Guide questions for reviewing the informed consent process and form</td>
            </tr>
            {renderCheckRow("Is it necessary to seek the informed consent of the participants?", "q1NecessarySeekConsent")}
            <tr>
              <td style={subLabelCell}>If NO, please explain.</td>
              <td style={commentCell}>
                <textarea value={fields.noExplain} onChange={(e) => setField("noExplain", e.target.value)} onInput={autoExpand} rows={1} style={lineTextarea} />
              </td>
            </tr>
            <tr>
              <td style={subLabelCell} colSpan={2}><strong>If YES,</strong> are the participants provided with sufficient information regarding</td>
            </tr>

            {renderCheckRow("Purpose of the study?", "q2PurposeOfStudy", false, true)}
            {renderCheckRow("Expected duration of participation?", "q3ExpectedDuration", false, true)}
            {renderCheckRow("Procedures to be carried out?", "q4Procedures", false, true)}
            {renderCheckRow("Discomforts and inconveniences?", "q5Discomforts", false, true)}
            {renderCheckRow("Risks (including possible discrimination)?", "q6RisksDiscrimination", false, true)}
            {renderCheckRow("Random assignment to the trial treatments?", "q7RandomAssignment", true, true)}
            {renderCheckRow("Benefits to the participants?", "q8Benefits", false, true)}
            {renderCheckRow("Alternative treatments/procedures?", "q9AlternativeTreatments", true, true)}
            {renderCheckRow("Compensation and/or medical treatments in case of injury?", "q10CompensationInjury", false, true)}
            {renderCheckRow("Who to contact for pertinent questions and/or for assistance in a research-related injury?", "q11ContactAssistance", false, true)}
            {renderCheckRow("Refusal to participate or discontinuance at any time will involve penalty or loss of benefits to which the subject is entitled?", "q12RefusalPenalty", false, true)}
            {renderCheckRow("Extent of confidentiality?", "q13ExtentConfidentiality", false, true)}

            <tr>
              <td style={criteriaCell}>Is the informed consent written or presented in simple language that participants can understand?</td>
              <td style={optionWideCell}>{renderYesNo("q14SimpleLanguage")}</td>
            </tr>
            <tr>
              <td style={criteriaCell}>Does the protocol include an adequate process for ensuring that consent is voluntary?</td>
              <td style={optionWideCell}>{renderYesNo("q15VoluntaryConsentProcess")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={checklistTable}>
          <tbody>
            <tr>
              <td style={otherConcernCell}>
                <div>Do you have any other concerns?</div>
                <textarea value={fields.otherConcerns} onChange={(e) => setField("otherConcerns", e.target.value)} onInput={autoExpand} rows={4} style={otherConcernTextarea} />
              </td>
            </tr>
            <tr>
              <td style={recommendationCell}>
                <div style={recTopLine}>
                  <span style={boldLabel}>Recommendation:</span>
                  <label style={choiceLabel}><input type="checkbox" style={checkStyle} checked={recommendation === "approved"} onChange={() => setRecommendationChoice("approved")} /> Approved</label>
                  <label style={choiceLabel}><input type="checkbox" style={checkStyle} checked={recommendation === "minor"} onChange={() => setRecommendationChoice("minor")} /> Minor revisions required</label>
                </div>

                <textarea value={fields.recommendationMinorReason1} onChange={(e) => setField("recommendationMinorReason1", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationMinorReason2} onChange={(e) => setField("recommendationMinorReason2", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />

                <div style={recOptionRow}>
                  <label style={choiceLabel}><input type="checkbox" style={checkStyle} checked={recommendation === "major"} onChange={() => setRecommendationChoice("major")} /> Major revisions required</label>
                </div>

                <textarea value={fields.recommendationMajorReason1} onChange={(e) => setField("recommendationMajorReason1", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationMajorReason2} onChange={(e) => setField("recommendationMajorReason2", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />

                <div style={recOptionRow}>
                  <label style={choiceLabel}><input type="checkbox" style={checkStyle} checked={recommendation === "deferred"} onChange={() => setRecommendationChoice("deferred")} /> Deferred</label>
                  <span style={plainLabel}>Reasons:</span>
                </div>

                <textarea value={fields.recommendationDeferredReason1} onChange={(e) => setField("recommendationDeferredReason1", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationDeferredReason2} onChange={(e) => setField("recommendationDeferredReason2", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationDeferredReason3} onChange={(e) => setField("recommendationDeferredReason3", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={checklistTable}>
          <tbody>
            <tr>
              <td style={recommendationCell}>
                <div style={recOptionRow}>
                  <label style={choiceLabel}><input type="checkbox" style={checkStyle} checked={recommendation === "disapproved"} onChange={() => setRecommendationChoice("disapproved")} /> Disapproved</label>
                  <span style={plainLabel}>Reasons:</span>
                </div>

                <textarea value={fields.recommendationDisapprovedReason1} onChange={(e) => setField("recommendationDisapprovedReason1", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationDisapprovedReason2} onChange={(e) => setField("recommendationDisapprovedReason2", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationDisapprovedReason3} onChange={(e) => setField("recommendationDisapprovedReason3", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />
                <textarea value={fields.recommendationDisapprovedReason4} onChange={(e) => setField("recommendationDisapprovedReason4", e.target.value)} onInput={autoExpand} rows={1} style={recLine} />

                <div style={signatureBlock}>
                  <div style={signaturePadWrap}>
                    <SignatureCell
                      value={reviewerSignature}
                      onChange={(val) => {
                        setReviewerSignature(val);
                        save({ reviewerSignature: val });
                      }}
                    />
                  </div>
                  <input value={fields.reviewerSignatureName} onChange={(e) => setField("reviewerSignatureName", e.target.value)} style={signatureLineInput} />
                  <div style={lineCaption}>Name and Signature of Reviewer</div>

                  <input value={fields.reviewDate} onChange={(e) => setField("reviewDate", e.target.value)} style={{ ...signatureLineInput, marginTop: "12px", width: "40%" }} />
                  <div style={lineCaption}>Review Date</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const pageContainer: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  margin: "0 auto 10mm auto",
  boxSizing: "border-box",
  background: "white",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  fontSize: "12px",
  color: "#000",
};

const headerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "14px",
};

const logoCell: React.CSSProperties = {
  border: "1px solid black",
  width: "15%",
  textAlign: "center",
  verticalAlign: "middle",
  padding: "6px",
};

const logoImage: React.CSSProperties = {
  width: "55px",
  height: "55px",
  objectFit: "contain",
};

const titleCell: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "center",
  verticalAlign: "middle",
  padding: "6px",
  fontWeight: 700,
};

const headerTitle: React.CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.25,
};

const formTitleCell: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "center",
  padding: "8px",
  fontWeight: 700,
  fontSize: "18px",
};

const infoTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "10px",
};

const labelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  background: "#f3f3f3",
  width: "20%",
};

const inputCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  width: "30%",
};

const checklistTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const sectionHead: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  textDecoration: "underline",
};

const criteriaCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  width: "68%",
  lineHeight: 1.25,
};

const optionWideCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
  width: "32%",
};

const subLabelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 600,
};

const commentCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
};

const lineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
};

const lineTextarea: React.CSSProperties = {
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
};

const choiceLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  marginRight: "14px",
  whiteSpace: "nowrap",
};

const radioStyle: React.CSSProperties = {
  margin: 0,
};

const otherConcernCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const otherConcernTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "120px",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
  marginTop: "4px",
};

const recommendationCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "10px 12px",
  verticalAlign: "top",
};

const recTopLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const recOptionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "10px",
};

const recLine: React.CSSProperties = {
  width: "72%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "24px",
  marginTop: "10px",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
  display: "block",
};

const boldLabel: React.CSSProperties = { fontWeight: 700 };
const plainLabel: React.CSSProperties = { fontWeight: 600 };
const checkStyle: React.CSSProperties = { margin: 0 };

const signatureBlock: React.CSSProperties = {
  marginTop: "24px",
  width: "62%",
};

const signaturePadWrap: React.CSSProperties = {
  marginBottom: "8px",
};

const signatureLineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
};

const lineCaption: React.CSSProperties = {
  marginTop: "4px",
  fontWeight: 700,
};
