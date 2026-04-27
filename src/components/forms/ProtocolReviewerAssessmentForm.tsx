import { useEffect, useState } from "react";
import SignatureCell from "./SignatureCell";

type Choice = "" | "ua" | "yes" | "no";
type RecommendationChoice = "" | "approved" | "minor" | "major" | "deferred" | "disapproved";

type QuestionKey =
  | "q1ScientificValue"
  | "q2BackgroundAdequate"
  | "q3QuestionsSupported"
  | "q4ObjectivesSmart"
  | "q5DesignAppropriate"
  | "q5aPopulationDefined"
  | "q5bSelectionDescribed"
  | "q5cSampleSizeJustified"
  | "q5dDataAnalysisDescribed"
  | "q6HumanParticipants"
  | "q7VulnerabilityIssue"
  | "q8MechanismsInPlace"
  | "q9RisksProbableHarms"
  | "q10MitigationMeasures"
  | "q11ConsentAdequate"
  | "q12InvestigatorsTrained"
  | "q13ConflictDisclosure"
  | "q14FacilitiesAdequate";

interface ReviewerAssessmentFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

const DEFAULT_CHECKS: Record<QuestionKey, Choice> = {
  q1ScientificValue: "",
  q2BackgroundAdequate: "",
  q3QuestionsSupported: "",
  q4ObjectivesSmart: "",
  q5DesignAppropriate: "",
  q5aPopulationDefined: "",
  q5bSelectionDescribed: "",
  q5cSampleSizeJustified: "",
  q5dDataAnalysisDescribed: "",
  q6HumanParticipants: "",
  q7VulnerabilityIssue: "",
  q8MechanismsInPlace: "",
  q9RisksProbableHarms: "",
  q10MitigationMeasures: "",
  q11ConsentAdequate: "",
  q12InvestigatorsTrained: "",
  q13ConflictDisclosure: "",
  q14FacilitiesAdequate: "",
};

const DEFAULT_COMMENTS: Record<string, string> = {
  comment1: "",
  comment2: "",
  comment3: "",
  comment4: "",
  comment5: "",
  comment6: "",
  comment7: "",
  comment8: "",
  comment9: "",
  comment10: "",
  otherConcerns: "",
};

export default function ProtocolReviewerAssessmentForm({ savedData = {}, onSave }: ReviewerAssessmentFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    titleOfStudy: s.titleOfStudy ?? "",
    protocolCode: s.protocolCode ?? "",
    typeOfReview: s.typeOfReview ?? "",
    researcher: s.researcher ?? "",
    institution: s.institution ?? "",
    reviewer: s.reviewer ?? "",
    dateReceived: s.dateReceived ?? "",
    primaryReviewer: s.primaryReviewer ?? "",
  });

  const [checks, setChecks] = useState<Record<QuestionKey, Choice>>(s.checks ?? DEFAULT_CHECKS);
  const [comments, setComments] = useState<Record<string, string>>(s.comments ?? DEFAULT_COMMENTS);
  const [recommendation, setRecommendation] = useState<RecommendationChoice>(s.recommendation ?? "");
  const [minorReason, setMinorReason] = useState<string>(s.minorReason ?? "");
  const [majorReason, setMajorReason] = useState<string>(s.majorReason ?? "");
  const [deferredReason, setDeferredReason] = useState<string>(s.deferredReason ?? "");
  const [disapprovedReason, setDisapprovedReason] = useState<string>(s.disapprovedReason ?? "");
  const [reviewerSignatureName, setReviewerSignatureName] = useState<string>(s.reviewerSignatureName ?? "");
  const [reviewerSignature, setReviewerSignature] = useState<string>(s.reviewerSignature ?? "");
  const [reviewDate, setReviewDate] = useState<string>(s.reviewDate ?? "");

  useEffect(() => {
    if (!s.checks) save({ checks: DEFAULT_CHECKS });
    if (!s.comments) save({ comments: DEFAULT_COMMENTS });
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

  const setCheck = (key: QuestionKey, value: Choice) => {
    const next = { ...checks, [key]: value };
    setChecks(next);
    save({ checks: next });
  };

  const setComment = (key: string, value: string) => {
    const next = { ...comments, [key]: value };
    setComments(next);
    save({ comments: next, [key]: value });
  };

  const setRecommendationChoice = (value: RecommendationChoice) => {
    const next = recommendation === value ? "" : value;
    setRecommendation(next);
    save({ recommendation: next });
  };

  const renderChoice = (key: QuestionKey, value: Choice) => (
    <label style={choiceLabel}>
      <input
        type="radio"
        name={key}
        checked={checks[key] === value}
        onChange={() => setCheck(key, value)}
        style={radioStyle}
      />
      {value === "ua" ? "Unable to Assess" : value === "yes" ? "Yes" : "No"}
    </label>
  );

  const renderQuestionRow = (number: string, text: string, key: QuestionKey) => (
    <tr>
      <td style={numCell}>{number}</td>
      <td style={criteriaCell}>{text}</td>
      <td style={optionCell}>{renderChoice(key, "ua")}</td>
      <td style={optionCell}>{renderChoice(key, "yes")}</td>
      <td style={optionCell}>{renderChoice(key, "no")}</td>
    </tr>
  );

  const renderCommentRow = (commentKey: string) => (
    <tr>
      <td style={commentLabelCell}>Comment:</td>
      <td colSpan={4} style={commentAreaCell}>
        <textarea
          value={comments[commentKey] ?? ""}
          onChange={(e) => setComment(commentKey, e.target.value)}
          onInput={autoExpand}
          rows={1}
          style={commentTextarea}
        />
      </td>
    </tr>
  );

  return (
    <div>
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
              <td colSpan={2} style={formTitleCell}>PROTOCOL REVIEWER ASSESSMENT FORM</td>
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
              <td style={labelCell}>Date Received</td>
              <td style={inputCell}><input value={fields.dateReceived} onChange={(e) => setField("dateReceived", e.target.value)} style={lineInput} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Primary Reviewer</td>
              <td colSpan={3} style={inputCell}><input value={fields.primaryReviewer} onChange={(e) => setField("primaryReviewer", e.target.value)} style={lineInput} /></td>
            </tr>
          </tbody>
        </table>

        <table style={checklistTable}>
          <tbody>
            <tr>
              <td style={sectionHead} colSpan={5}>Guide questions for reviewing the proposal / protocol</td>
            </tr>
            <tr>
              <td style={headNum}>No.</td>
              <td style={headCriteria}>Criteria</td>
              <td style={headOption}>Unable to Assess</td>
              <td style={headOption}>Yes</td>
              <td style={headOption}>No</td>
            </tr>

            {renderQuestionRow("1", "Does the study have social value?", "q1ScientificValue")}
            {renderCommentRow("comment1")}

            {renderQuestionRow("2", "Is the study background adequate?", "q2BackgroundAdequate")}
            {renderCommentRow("comment2")}

            {renderQuestionRow("3", "Are the research questions supported by literature review?", "q3QuestionsSupported")}
            {renderCommentRow("comment3")}

            {renderQuestionRow("4", "Are the study objectives Specific, Measurable, Attainable, Realistic, Time-bound?", "q4ObjectivesSmart")}
            {renderCommentRow("comment4")}

            {renderQuestionRow("5", "Is the research design appropriate?", "q5DesignAppropriate")}
            {renderQuestionRow("5.1", "Is the population identified and defined?", "q5aPopulationDefined")}
            {renderQuestionRow("5.2", "Is the selection of study participants described?", "q5bSelectionDescribed")}
            {renderQuestionRow("5.3", "Is the sample size justified?", "q5cSampleSizeJustified")}
            {renderQuestionRow("5.4", "Is the plan for data analysis described? Are there dummy tables?", "q5dDataAnalysisDescribed")}
            {renderCommentRow("comment5")}

            {renderQuestionRow("6", "Does the research need to be carried out with human participants?", "q6HumanParticipants")}
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={checklistTable}>
          <tbody>
            {renderCommentRow("comment6")}

            {renderQuestionRow("7", "Does the study have a vulnerability issue?", "q7VulnerabilityIssue")}
            {renderCommentRow("comment7")}

            {renderQuestionRow("8", "Are appropriate mechanisms/interventions in place to address the vulnerability issues?", "q8MechanismsInPlace")}
            {renderCommentRow("comment8")}

            {renderQuestionRow("9", "Are there risks/probable harms to the human participants in the study?", "q9RisksProbableHarms")}
            {renderCommentRow("comment9")}

            {renderQuestionRow("10", "Are there measures to mitigate the risks?", "q10MitigationMeasures")}

            {renderQuestionRow("11", "Is the informed consent procedure/form adequate and culturally appropriate?", "q11ConsentAdequate")}
            {renderCommentRow("comment10")}

            {renderQuestionRow("12", "Is/are the investigator/s adequately trained and do they have sufficient experience to undertake the study?", "q12InvestigatorsTrained")}

            {renderQuestionRow("13", "Is there a disclosure of conflict of interest?", "q13ConflictDisclosure")}

            {renderQuestionRow("14", "Are the research facilities adequate?", "q14FacilitiesAdequate")}

            <tr>
              <td style={commentLabelCell}>Other Concerns:</td>
              <td colSpan={4} style={commentAreaCell}>
                <textarea
                  value={comments.otherConcerns ?? ""}
                  onChange={(e) => setComment("otherConcerns", e.target.value)}
                  onInput={autoExpand}
                  rows={2}
                  style={commentTextarea}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={5} style={finalBlockCell}>
                <div style={recRowTop}>
                  <span style={boldLabel}>Recommendation:</span>
                  <label style={finalChoiceLabel}>
                    <input type="checkbox" style={checkStyle} checked={recommendation === "approved"} onChange={() => setRecommendationChoice("approved")} /> Approved
                  </label>
                  <label style={finalChoiceLabel}>
                    <input type="checkbox" style={checkStyle} checked={recommendation === "minor"} onChange={() => setRecommendationChoice("minor")} /> Minor revision/s required
                  </label>
                </div>

                <textarea
                  value={minorReason}
                  onChange={(e) => {
                    setMinorReason(e.target.value);
                    save({ minorReason: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                  style={finalLineTextarea}
                />
                <textarea
                  value={majorReason}
                  onChange={(e) => {
                    setMajorReason(e.target.value);
                    save({ majorReason: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                  style={finalLineTextarea}
                />

                <div style={recOptionRow}>
                  <label style={finalChoiceLabel}>
                    <input type="checkbox" style={checkStyle} checked={recommendation === "major"} onChange={() => setRecommendationChoice("major")} /> Major revision/s required
                  </label>
                </div>

                <textarea
                  value={deferredReason}
                  onChange={(e) => {
                    setDeferredReason(e.target.value);
                    save({ deferredReason: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                  style={finalLineTextarea}
                />

                <div style={recOptionRow}>
                  <label style={finalChoiceLabel}>
                    <input type="checkbox" style={checkStyle} checked={recommendation === "deferred"} onChange={() => setRecommendationChoice("deferred")} /> Deferred
                  </label>
                  <span style={plainLabel}>Reasons:</span>
                </div>

                <textarea
                  value={disapprovedReason}
                  onChange={(e) => {
                    setDisapprovedReason(e.target.value);
                    save({ disapprovedReason: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                  style={finalLineTextarea}
                />

                <div style={recOptionRow}>
                  <label style={finalChoiceLabel}>
                    <input type="checkbox" style={checkStyle} checked={recommendation === "disapproved"} onChange={() => setRecommendationChoice("disapproved")} /> Disapproved
                  </label>
                  <span style={plainLabel}>Reasons:</span>
                </div>

                <textarea value="" readOnly style={finalLineTextarea} />

                <div style={signatureGroup}>
                  <div style={signaturePadWrap}>
                    <SignatureCell
                      value={reviewerSignature}
                      onChange={(val) => {
                        setReviewerSignature(val);
                        save({ reviewerSignature: val });
                      }}
                    />
                  </div>
                  <input
                    value={reviewerSignatureName}
                    onChange={(e) => {
                      setReviewerSignatureName(e.target.value);
                      save({ reviewerSignatureName: e.target.value });
                    }}
                    style={signatureLineInput}
                  />
                  <div style={lineCaption}>Name and Signature of Reviewer</div>
                </div>

                <div style={signatureGroup}>
                  <input
                    value={reviewDate}
                    onChange={(e) => {
                      setReviewDate(e.target.value);
                      save({ reviewDate: e.target.value });
                    }}
                    style={signatureLineInput}
                  />
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
  width: "17%",
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
  width: "25%",
};

const inputCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  width: "25%",
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

const headNum: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "8%",
  textAlign: "center",
  background: "#efefef",
};

const headCriteria: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "44%",
  background: "#efefef",
};

const headOption: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "16%",
  textAlign: "center",
  background: "#efefef",
};

const numCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  verticalAlign: "top",
};

const criteriaCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  lineHeight: 1.25,
};

const optionCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
  textAlign: "center",
};

const choiceLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const radioStyle: React.CSSProperties = {
  margin: 0,
};

const commentLabelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  verticalAlign: "top",
};

const commentAreaCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
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

const commentTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "20px",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
};

const finalBlockCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "10px 12px",
  verticalAlign: "top",
};

const recRowTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const recOptionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "8px",
};

const boldLabel: React.CSSProperties = {
  fontWeight: 700,
};

const plainLabel: React.CSSProperties = {
  fontWeight: 600,
};

const finalChoiceLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
};

const checkStyle: React.CSSProperties = {
  margin: 0,
};

const finalLineTextarea: React.CSSProperties = {
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

const signatureGroup: React.CSSProperties = {
  marginTop: "14px",
  width: "45%",
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
