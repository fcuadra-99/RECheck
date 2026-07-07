import { Button } from "@/components/ui/button";
import { supabase } from "@/DB";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type FormEvent, type ForwardedRef } from "react";
import SignatureCell from "./SignatureCell";

type Choice = "" | "no" | "yes";
type TypeChoice = "" | "none" | "yes";
type RecommendationChoice = "" | "exempt" | "clarification" | "expedited" | "full";

type ReviewTypeChoice = "" | "Full Board" | "Expedited" | "Exempt";

interface RiskAssessmentFormProps {
  onSubmit?: (answers: Record<string, string>) => void;
  onReviewTypeChange?: (reviewType: ReviewTypeChoice) => void;
  initialStudyTitle?: string;
  initialResearcherName?: string;
  initialCoResearcher?: string;
  initialTypeOfReview?: string;
}

interface RiskAssessmentFormHandle {
  submit: () => void;
}

const todayValue = new Date().toISOString().split("T")[0];

const RiskAssessmentForm = forwardRef(function RiskAssessmentForm(
  {
    onSubmit,
    onReviewTypeChange,
    initialStudyTitle = "",
    initialResearcherName = "",
    initialCoResearcher = "",
    initialTypeOfReview = "",
  }: RiskAssessmentFormProps,
  ref: ForwardedRef<RiskAssessmentFormHandle>
) {
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const [studyTitle, setStudyTitle] = useState(initialStudyTitle);
  const [typeOfReview, setTypeOfReview] = useState(initialTypeOfReview);
  const [researcherName, setResearcherName] = useState(initialResearcherName);
  const [coResearcher, setCoResearcher] = useState(initialCoResearcher);
  const [exemptReviewer, setExemptReviewer] = useState("");

  const [q1, setQ1] = useState<Choice>("");
  const [q2, setQ2] = useState<Choice>("");
  const [q3, setQ3] = useState<TypeChoice>("");
  const [q4, setQ4] = useState<Choice>("");
  const [q5, setQ5] = useState<Choice>("");
  const [q6, setQ6] = useState<Choice>("");
  const [q7, setQ7] = useState<Choice>("");

  const [recommendation, setRecommendation] = useState<RecommendationChoice>("");
  const [reason, setReason] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerSignature, setReviewerSignature] = useState("");
  const [reviewDate, setReviewDate] = useState(todayValue);

  useEffect(() => {
    setStudyTitle(initialStudyTitle);
    setResearcherName(initialResearcherName);
    setCoResearcher(initialCoResearcher);
    setTypeOfReview(initialTypeOfReview);
  }, [initialStudyTitle, initialResearcherName, initialCoResearcher, initialTypeOfReview]);

  useEffect(() => {
    const loadReviewerName = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("fname,lname")
        .eq("id", userData.user.id)
        .single();

      const fullName = `${profile?.fname ?? ""} ${profile?.lname ?? ""}`.trim();
      if (fullName) {
        setReviewerName(fullName);
      }
      if (!reviewDate) {
        setReviewDate(todayValue);
      }
    };

    loadReviewerName();
  }, []);

  const autoExpand = (event: FormEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const getAutoReviewType = (nextRecommendation: RecommendationChoice) => {
    switch (nextRecommendation) {
      case "exempt":
        return "Exempt";
      case "expedited":
        return "Expedited";
      case "full":
        return "Full Board";
      case "clarification":
      default:
        return "";
    }
  };

  const handleRecommendationChange = (nextRecommendation: RecommendationChoice) => {
    setRecommendation(nextRecommendation);
    setTypeOfReview(getAutoReviewType(nextRecommendation));
    onReviewTypeChange?.(getAutoReviewType(nextRecommendation));
  };

  const handleSubmit = () => {
    const answers: Record<string, string> = {
      studyTitle,
      typeOfReview,
      researcherName,
      coResearcher,
      exemptReviewer,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      q7,
      recommendation,
      reason,
      reviewerName,
      reviewerSignature,
      reviewDate,
    };

    onSubmit?.(answers);
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }), [handleSubmit]);

  const renderYesNoBlock = (
    name: string,
    value: Choice,
    onChange: (nextValue: Choice) => void,
    yesLabel: string,
    noLabel: string,
  ) => (
    <table style={choiceTable}>
      <tbody>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name={name}
              checked={value === "no"}
              onChange={() => onChange("no")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>{noLabel}</td>
        </tr>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name={name}
              checked={value === "yes"}
              onChange={() => onChange("yes")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>{yesLabel}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderTypeBlock = () => (
    <table style={choiceTable}>
      <tbody>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="q3"
              checked={q3 === "none"}
              onChange={() => setQ3("none")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>None, proceed to row #4.</td>
        </tr>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="q3"
              checked={q3 === "yes"}
              onChange={() => setQ3("yes")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>Yes, proceed to row #5.</td>
        </tr>
      </tbody>
    </table>
  );

  const renderRecommendationBlock = () => (
    <table style={choiceTable}>
      <tbody>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="recommendation"
              checked={recommendation === "exempt"}
              onChange={() => handleRecommendationChange("exempt")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>Exempt from Review</td>
        </tr>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="recommendation"
              checked={recommendation === "clarification"}
              onChange={() => handleRecommendationChange("clarification")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>Clarification/Additional materials needed</td>
        </tr>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="recommendation"
              checked={recommendation === "expedited"}
              onChange={() => handleRecommendationChange("expedited")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>For expedited review</td>
        </tr>
        <tr>
          <td style={optionMarkCell}>
            <input
              type="radio"
              name="recommendation"
              checked={recommendation === "full"}
              onChange={() => handleRecommendationChange("full")}
              style={radioStyle}
            />
          </td>
          <td style={optionTextCell}>For full board review</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div style={documentStyle}>
      <section style={{ ...pageStyle, pageBreakAfter: "always" }}>
        <table style={bannerTable}>
          <tbody>
            <tr>
              <td style={bannerLogoCell}>
                <div style={sealOuter}>
                  <div style={sealInner}>UIC</div>
                </div>
              </td>
              <td style={bannerTextCell}>
                <div style={bannerUniversity}>University of the Immaculate Conception</div>
                <div style={bannerCommittee}>Research Ethics Committee</div>
                <div style={bannerAddress}>Bonifacio Street, Davao City, Philippines</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={titleTable}>
          <tbody>
            <tr>
              <td style={titleCell}>REVIEW TYPE DETERMINATION FORM</td>
            </tr>
          </tbody>
        </table>

        <table style={metaTable}>
          <tbody>
            <tr>
              <td style={metaLabelCell}>Study Title:</td>
              <td style={metaFieldCell}>
                <textarea
                  rows={1}
                  value={studyTitle}
                  onChange={(event) => setStudyTitle(event.target.value)}
                  onInput={autoExpand}
                  style={lineTextarea}
                />
              </td>
            </tr>
            <tr>
              <td style={metaLabelCell}>Type of review:</td>
              <td style={metaFieldCell}>
                <input
                  type="text"
                  value={typeOfReview}
                  readOnly
                  style={lineInput}
                  placeholder="Select recommendation"
                />
              </td>
            </tr>
            <tr>
              <td style={metaLabelCell}>Name of the Researcher:</td>
              <td style={metaFieldCell}>
                <input
                  type="text"
                  value={researcherName}
                  readOnly
                  style={lineInput}
                />
              </td>
            </tr>
            <tr>
              <td style={metaLabelCell}>Co-Researcher / Advisor:</td>
              <td style={metaFieldCell}>
                <input
                  type="text"
                  value={coResearcher}
                  readOnly
                  style={lineInput}
                />
              </td>
            </tr>
            <tr>
              <td style={metaLabelCell}>Exempt Reviewer:</td>
              <td style={metaFieldCell}>
                <input
                  type="text"
                  value={exemptReviewer}
                  onChange={(event) => setExemptReviewer(event.target.value)}
                  style={lineInput}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table style={mainTable}>
          <tbody>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>1.</td>
                      <td style={questionCell}>Is the study technically sound?</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                {renderYesNoBlock(
                  "q1",
                  q1,
                  setQ1,
                  "Yes, continue with checklist",
                  "No, clarification/additional materials needed",
                )}
              </td>
            </tr>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>2.</td>
                      <td style={questionCell}>
                        Does the study involve human participants or identifiable human tissue, biological samples, and data?
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                {renderYesNoBlock(
                  "q2",
                  q2,
                  setQ2,
                  "Yes, proceed to row #3.",
                  "No, proceed to row #4.",
                )}
              </td>
            </tr>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>3.</td>
                      <td style={questionCell}>Type of research</td>
                    </tr>
                    <tr>
                      <td style={subNumberCell}>3.1</td>
                      <td style={subQuestionCell}>Institutional Quality Assurance</td>
                    </tr>
                    <tr>
                      <td style={subNumberCell}>3.2</td>
                      <td style={subQuestionCell}>Evaluation of Public Service Program</td>
                    </tr>
                    <tr>
                      <td style={subNumberCell}>3.3</td>
                      <td style={subQuestionCell}>Public Health Surveillance</td>
                    </tr>
                    <tr>
                      <td style={subNumberCell}>3.4</td>
                      <td style={subQuestionCell}>Educational Evaluation Activities</td>
                    </tr>
                    <tr>
                      <td style={subNumberCell}>3.5</td>
                      <td style={subQuestionCell}>Consumer Acceptability Test</td>
                    </tr>
                    <tr>
                      <td style={noteSpacerCell}></td>
                      <td style={noteCell}>
                        <em>
                          *As identified in NEGRIHP (2022) as long as it does not involve more than minimal risks.
                        </em>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>{renderTypeBlock()}</td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 211) • Email Address: rec@uic.edu.ph</td>
              <td style={footerPageCell}>Page 1 of 3</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ ...pageStyle, pageBreakAfter: "always" }}>
        <table style={bannerTable}>
          <tbody>
            <tr>
              <td style={bannerLogoCell}>
                <div style={sealOuter}>
                  <div style={sealInner}>UIC</div>
                </div>
              </td>
              <td style={bannerTextCell}>
                <div style={bannerUniversity}>University of the Immaculate Conception</div>
                <div style={bannerCommittee}>Research Ethics Committee</div>
                <div style={bannerAddress}>Bonifacio Street, Davao City, Philippines</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={mainTableSecondPage}>
          <tbody>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>4.</td>
                      <td style={questionCell}>
                        Does this require an ethics approval or clearance from an appropriate committee other than an EC or IRB that reviews research involving humans (e.g., IACUC for animal studies) (NEGRIHP, 2022)?
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                <table style={choiceTable}>
                  <tbody>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q4"
                          checked={q4 === "no"}
                          onChange={() => setQ4("no")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>No, exempt from review</td>
                    </tr>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q4"
                          checked={q4 === "yes"}
                          onChange={() => setQ4("yes")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>Yes, require approval from the appropriate committee; decision: Clarification/Additional materials needed</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>5.</td>
                      <td style={questionCell}>Does the study involve vulnerable populations as enumerated in the NEGRIHP (2022)?</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                <table style={choiceTable}>
                  <tbody>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q5"
                          checked={q5 === "no"}
                          onChange={() => setQ5("no")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>No, continue with the checklist</td>
                    </tr>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q5"
                          checked={q5 === "yes"}
                          onChange={() => setQ5("yes")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>Yes, recommend for expedited or full board review</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>6.</td>
                      <td style={questionCell}>
                        Does the study involve access to either:
                        <table style={innerBulletTable}>
                          <tbody>
                            <tr>
                              <td style={bulletCell}>*</td>
                              <td style={bulletTextCell}>medical records with data about protected health information?</td>
                            </tr>
                            <tr>
                              <td style={bulletCell}>*</td>
                              <td style={bulletTextCell}>personal data of the participants like grades and other information as stipulated in the Data Privacy Act of 2012 and NEGRIHP (2022).</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                <table style={choiceTable}>
                  <tbody>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q6"
                          checked={q6 === "no"}
                          onChange={() => setQ6("no")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>No, continue with checklist</td>
                    </tr>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q6"
                          checked={q6 === "yes"}
                          onChange={() => setQ6("yes")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>Yes, recommend for expedited or full board review</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={criteriaCell}>
                <table style={leftQuestionTable}>
                  <tbody>
                    <tr>
                      <td style={numberCell}>7.</td>
                      <td style={questionCell}>
                        If the study involves interaction with human participants, evaluate that the consent process contains the following information as mentioned in NEGRIHP (2022):
                        <table style={innerBulletTable}>
                          <tbody>
                            <tr>
                              <td style={letterCell}>a.</td>
                              <td style={bulletTextCell}>Detailed procedures of what the participants will do</td>
                            </tr>
                            <tr>
                              <td style={letterCell}>b.</td>
                              <td style={bulletTextCell}>Participation is voluntary</td>
                            </tr>
                            <tr>
                              <td style={letterCell}>c.</td>
                              <td style={bulletTextCell}>Name and contact information of researcher</td>
                            </tr>
                            <tr>
                              <td style={letterCell}>d.</td>
                              <td style={bulletTextCell}>Clear protection of data privacy and confidentiality</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={replyCell}>
                <table style={choiceTable}>
                  <tbody>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q7"
                          checked={q7 === "no"}
                          onChange={() => setQ7("no")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>No or incomplete consent form, clarification/additional materials needed</td>
                    </tr>
                    <tr>
                      <td style={optionMarkCell}>
                        <input
                          type="radio"
                          name="q7"
                          checked={q7 === "yes"}
                          onChange={() => setQ7("yes")}
                          style={radioStyle}
                        />
                      </td>
                      <td style={optionTextCell}>Yes, continue with checklist</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 211) • Email Address: rec@uic.edu.ph</td>
              <td style={footerPageCell}>Page 2 of 3</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={pageStyle}>
        <table style={bannerTable}>
          <tbody>
            <tr>
              <td style={bannerLogoCell}>
                <div style={sealOuter}>
                  <div style={sealInner}>UIC</div>
                </div>
              </td>
              <td style={bannerTextCell}>
                <div style={bannerUniversity}>University of the Immaculate Conception</div>
                <div style={bannerCommittee}>Research Ethics Committee</div>
                <div style={bannerAddress}>Bonifacio Street, Davao City, Philippines</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={recommendationTable}>
          <tbody>
            <tr>
              <td style={recommendationLabelCell}>Recommendation</td>
              <td style={recommendationOptionsCell}>{renderRecommendationBlock()}</td>
            </tr>
            <tr>
              <td style={reasonBoxCell} colSpan={2}>
                <div style={reasonLabelText}>Reason</div>
                <textarea
                  ref={reasonRef}
                  rows={1}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  onInput={autoExpand}
                  style={reasonTextarea}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table style={signTable}>
          <tbody>
            <tr>
              <td style={signLabelCell}>Name and Signature of the Reviewer:</td>
              <td style={signInputCell}>
                <div style={signatureGroup}>
                  <div style={signaturePadWrap}>
                    <SignatureCell value={reviewerSignature} onChange={setReviewerSignature} />
                  </div>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    style={lineInput}
                    placeholder="Reviewer name"
                  />
                  <div style={lineCaption}>Name and Signature of Reviewer</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style={signLabelCell}>Date:</td>
              <td style={signInputCell}>
                <input
                  type="text"
                  value={reviewDate}
                  onChange={(event) => setReviewDate(event.target.value)}
                  style={lineInput}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={page3Spacer} />

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 211) • Email Address: rec@uic.edu.ph</td>
              <td style={footerPageCell}>Page 3 of 3</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
});

const documentStyle: CSSProperties = {
  width: "210mm",
  background: "#ffffff",
  color: "#000000",
  margin: "0 auto",
  fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
  fontSize: "12px",
};

const pageStyle: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  boxSizing: "border-box",
  background: "#ffffff",
  position: "relative",
};

const bannerTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "11px",
  background: "#f2f2f2",
  border: "1px solid #d6d6d6",
};

const bannerLogoCell: CSSProperties = {
  width: "17%",
  padding: "10px 8px 10px 12px",
  verticalAlign: "middle",
};

const bannerTextCell: CSSProperties = {
  width: "83%",
  padding: "10px 12px 10px 0",
  verticalAlign: "middle",
};

const sealOuter: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  border: "2px solid #d89ab8",
  background: "#ffffff",
  display: "table",
  textAlign: "center",
};

const sealInner: CSSProperties = {
  display: "table-cell",
  verticalAlign: "middle",
  fontSize: "11px",
  fontWeight: 700,
  color: "#d46c9b",
  letterSpacing: "0.5px",
};

const bannerUniversity: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.15,
};

const bannerCommittee: CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  fontStyle: "italic",
  lineHeight: 1.15,
};

const bannerAddress: CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.15,
};

const titleTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "10px",
};

const titleCell: CSSProperties = {
  textAlign: "center",
  fontSize: "17px",
  fontWeight: 700,
  padding: "8px 0 10px",
};

const metaTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "10px",
};

const metaLabelCell: CSSProperties = {
  width: "30%",
  padding: "3px 6px 7px 0",
  verticalAlign: "bottom",
  fontWeight: 700,
};

const metaFieldCell: CSSProperties = {
  width: "70%",
  padding: "0 0 7px 0",
  verticalAlign: "bottom",
};

const lineInput: CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #000000",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.2,
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
  background: "transparent",
};

const lineTextarea: CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid #000000",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.2,
  padding: 0,
  margin: 0,
  resize: "none",
  overflow: "hidden",
  boxSizing: "border-box",
  background: "transparent",
  minHeight: "16px",
};

const mainTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const mainTableSecondPage: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "1px",
};

const criteriaCell: CSSProperties = {
  width: "63%",
  border: "1px solid #000000",
  padding: "0",
  verticalAlign: "top",
};

const replyCell: CSSProperties = {
  width: "37%",
  border: "1px solid #000000",
  padding: "0",
  verticalAlign: "top",
};

const leftQuestionTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const numberCell: CSSProperties = {
  width: "10%",
  padding: "10px 8px 8px 12px",
  verticalAlign: "top",
  fontWeight: 400,
};

const questionCell: CSSProperties = {
  width: "90%",
  padding: "10px 12px 8px 0",
  verticalAlign: "top",
  lineHeight: 1.25,
};

const subNumberCell: CSSProperties = {
  width: "10%",
  padding: "0 8px 4px 12px",
  verticalAlign: "top",
};

const subQuestionCell: CSSProperties = {
  width: "90%",
  padding: "0 12px 4px 0",
  verticalAlign: "top",
  lineHeight: 1.25,
};

const noteSpacerCell: CSSProperties = {
  width: "10%",
  padding: "0 8px 8px 12px",
};

const noteCell: CSSProperties = {
  width: "90%",
  padding: "4px 12px 10px 0",
  verticalAlign: "top",
  lineHeight: 1.2,
  fontSize: "11px",
};

const choiceTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const optionMarkCell: CSSProperties = {
  width: "10%",
  padding: "10px 4px 0 10px",
  verticalAlign: "top",
};

const optionTextCell: CSSProperties = {
  width: "90%",
  padding: "8px 10px 8px 0",
  verticalAlign: "top",
  lineHeight: 1.2,
};

const radioStyle: CSSProperties = {
  margin: 0,
  transform: "translateY(1px)",
};

const innerBulletTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "4px",
};

const bulletCell: CSSProperties = {
  width: "6%",
  padding: "0 4px 3px 12px",
  verticalAlign: "top",
};

const letterCell: CSSProperties = {
  width: "6%",
  padding: "0 4px 3px 12px",
  verticalAlign: "top",
};

const bulletTextCell: CSSProperties = {
  width: "88%",
  padding: "0 12px 3px 0",
  verticalAlign: "top",
  lineHeight: 1.2,
};

const footerTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "10px",
  background: "#f2f2f2",
  border: "1px solid #d6d6d6",
};

const footerTextCell: CSSProperties = {
  width: "85%",
  padding: "9px 12px",
  fontSize: "13px",
  verticalAlign: "middle",
};

const footerPageCell: CSSProperties = {
  width: "15%",
  padding: "9px 12px",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "right",
  verticalAlign: "middle",
};

const recommendationTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const recommendationLabelCell: CSSProperties = {
  width: "52%",
  border: "1px solid #000000",
  padding: "10px 10px 80px 8px",
  fontWeight: 700,
  verticalAlign: "top",
  fontSize: "14px",
};

const recommendationOptionsCell: CSSProperties = {
  width: "48%",
  border: "1px solid #000000",
  padding: "8px 10px 8px 10px",
  verticalAlign: "top",
};

const reasonBoxCell: CSSProperties = {
  width: "100%",
  border: "1px solid #000000",
  borderTop: "none",
  padding: "8px 8px 12px 8px",
  verticalAlign: "top",
};

const reasonLabelText: CSSProperties = {
  fontWeight: 700,
  fontSize: "14px",
  marginBottom: "12px",
};

const reasonTextarea: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.25,
  padding: 0,
  margin: 0,
  minHeight: "16px",
  boxSizing: "border-box",
  background: "transparent",
};

const signTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "16px",
};

const signLabelCell: CSSProperties = {
  width: "34%",
  padding: "4px 6px 8px 0",
  verticalAlign: "bottom",
  fontSize: "13px",
};

const signInputCell: CSSProperties = {
  width: "66%",
  padding: "4px 0 8px 0",
  verticalAlign: "bottom",
};

const signatureGroup: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const signaturePadWrap: CSSProperties = {
  marginTop: "2px",
  marginBottom: "2px",
};

const lineCaption: CSSProperties = {
  fontSize: "11px",
  color: "#444",
  marginTop: "2px",
};

const page3Spacer: CSSProperties = {
  height: "85mm",
};

RiskAssessmentForm.displayName = "RiskAssessmentForm";

export default RiskAssessmentForm;
