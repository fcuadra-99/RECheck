import { useEffect, useState } from "react";
import type { FormProps } from "./FormViewer";
import SignatureCell from "./SignatureCell";

type YesNo = "yes" | "no" | "";
type ReferredTo = "full-board" | "expedited" | "";

type RecommendedAction = {
  upholdApproval: boolean;
  requestInformation: boolean;
  recommendFurtherAction: boolean;
};

export default function EthicsStudyProtocolAmendmentForm({
  protocolCode,
  researcherName,
  proposalTitle,
  proposalId,
  formName,
  savedData = {},
  onSave,
}: FormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const today = new Date().toISOString().split("T")[0];

  const [titleOfStudy, setTitleOfStudy] = useState<string>(s.titleOfStudy ?? proposalTitle ?? "");
  const [approvalDate, setApprovalDate] = useState<string>(s.approvalDate ?? "");
  const [researcherNameValue, setResearcherNameValue] = useState<string>(s.researcherNameValue ?? researcherName ?? "");
  const [institutionSchool, setInstitutionSchool] = useState<string>(s.institutionSchool ?? "");
  const [email, setEmail] = useState<string>(s.email ?? "");
  const [telephone, setTelephone] = useState<string>(s.telephone ?? "");
  const [mobile, setMobile] = useState<string>(s.mobile ?? "");
  const [versionDate, setVersionDate] = useState<string>(s.versionDate ?? "");
  const [clearanceApprovedProtocol, setClearanceApprovedProtocol] = useState<string>(s.clearanceApprovedProtocol ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(s.effectiveFrom ?? "");
  const [effectiveTo, setEffectiveTo] = useState<string>(s.effectiveTo ?? "");
  const [uicRecProtocolCode, setUicRecProtocolCode] = useState<string>(s.uicRecProtocolCode ?? protocolCode ?? "");
  const [typeOfReview, setTypeOfReview] = useState<string>(s.typeOfReview ?? "");
  const [amendmentSubmissionDate, setAmendmentSubmissionDate] = useState<string>(s.amendmentSubmissionDate ?? "");
  const [amendmentNumber, setAmendmentNumber] = useState<string>(s.amendmentNumber ?? "");
  const [natureOfAmendment, setNatureOfAmendment] = useState<string>(s.natureOfAmendment ?? "");

  const [sectionPageNo1, setSectionPageNo1] = useState<string>(s.sectionPageNo1 ?? "");
  const [originalVersion1, setOriginalVersion1] = useState<string>(s.originalVersion1 ?? "");
  const [proposedAmendment1, setProposedAmendment1] = useState<string>(s.proposedAmendment1 ?? "");
  const [justification1, setJustification1] = useState<string>(s.justification1 ?? "");

  const [sectionPageNo2, setSectionPageNo2] = useState<string>(s.sectionPageNo2 ?? "");
  const [originalVersion2, setOriginalVersion2] = useState<string>(s.originalVersion2 ?? "");
  const [proposedAmendment2, setProposedAmendment2] = useState<string>(s.proposedAmendment2 ?? "");
  const [justification2, setJustification2] = useState<string>(s.justification2 ?? "");

  const [reportedBy, setReportedBy] = useState<string>(s.reportedBy ?? researcherName ?? "");
  const [dateSubmitted, setDateSubmitted] = useState<string>(s.dateSubmitted ?? today);
  const [researcherSignature, setResearcherSignature] = useState<string>(s.researcherSignature ?? "");

  const [staffControlNo, setStaffControlNo] = useState<string>(s.staffControlNo ?? "");
  const [referredTo, setReferredTo] = useState<ReferredTo>(s.referredTo ?? "");
  const [postsMoreRisks, setPostsMoreRisks] = useState<YesNo>(s.postsMoreRisks ?? "");
  const [amendmentJustifiable, setAmendmentJustifiable] = useState<YesNo>(s.amendmentJustifiable ?? "");

  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction>(
    s.recommendedAction ?? {
      upholdApproval: false,
      requestInformation: false,
      recommendFurtherAction: false,
    }
  );
  const [requestInformationText, setRequestInformationText] = useState<string>(s.requestInformationText ?? "");
  const [recommendFurtherActionText, setRecommendFurtherActionText] = useState<string>(s.recommendFurtherActionText ?? "");

  const [primaryReviewerDate, setPrimaryReviewerDate] = useState<string>(s.primaryReviewerDate ?? "");
  const [primaryReviewerSignature, setPrimaryReviewerSignature] = useState<string>(s.primaryReviewerSignature ?? "");
  const [primaryReviewerName, setPrimaryReviewerName] = useState<string>(s.primaryReviewerName ?? "");

  const [primaryReviewer2Date, setPrimaryReviewer2Date] = useState<string>(s.primaryReviewer2Date ?? "");
  const [primaryReviewer2Signature, setPrimaryReviewer2Signature] = useState<string>(s.primaryReviewer2Signature ?? "");
  const [primaryReviewer2Name, setPrimaryReviewer2Name] = useState<string>(s.primaryReviewer2Name ?? "");

  const [secretariatDate, setSecretariatDate] = useState<string>(s.secretariatDate ?? "");
  const [secretariatSignature, setSecretariatSignature] = useState<string>(s.secretariatSignature ?? "");
  const [secretariatName, setSecretariatName] = useState<string>(s.secretariatName ?? "");

  const [recChairDate, setRecChairDate] = useState<string>(s.recChairDate ?? "");
  const [recChairSignature, setRecChairSignature] = useState<string>(s.recChairSignature ?? "");
  const [recChairName, setRecChairName] = useState<string>(s.recChairName ?? "");

  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.titleOfStudy && proposalTitle) patch.titleOfStudy = proposalTitle;
    if (!s.researcherNameValue && researcherName) patch.researcherNameValue = researcherName;
    if (!s.uicRecProtocolCode && protocolCode) patch.uicRecProtocolCode = protocolCode;
    if (!s.reportedBy && researcherName) patch.reportedBy = researcherName;
    if (!s.dateSubmitted) patch.dateSubmitted = today;
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const toggleRecommendedAction = (key: keyof RecommendedAction) => {
    const next = { ...recommendedAction, [key]: !recommendedAction[key] };
    setRecommendedAction(next);
    save({ recommendedAction: next });
  };

  return (
    <div>
      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={headerLeftCell}>
                <table style={innerHeaderTable}>
                  <tbody>
                    <tr>
                      <td style={logoCell}>
                        <img src="/logoo.png" alt="UIC Logo" style={logoImage} />
                      </td>
                      <td style={schoolCell}>
                        <div style={schoolName}>University of the Immaculate Conception</div>
                        <div style={committeeName}>Research Ethics Committee</div>
                        <div>Bonifacio Street, Davao City, Philippines</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={headerRightCell}>
                <table style={controlBoxTable}>
                  <tbody>
                    <tr>
                      <td style={controlLabelCell}>REC_FO_0018</td>
                    </tr>
                    <tr>
                      <td style={controlInputCell}>Control No. : <input style={lineInputInline} /></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={formTitle}>Protocol Amendment Form</div>

        <div style={instructionsText}>
          INSTRUCTIONS TO THE PRINCIPAL INVESTIGATOR: A study protocol amendment is a written description of change(s)
          to a formal clarification of a protocol and/or informed consent documents. Favorable opinion or approval should be
          obtained from the UIC REC that issued the ethical clearance or approval prior to the implementation of an amendment.
          Please fill up this form and encode all information required in the space provided. Multiple amendments classified
          under ONE type of review (expedited or full review) can be submitted in one form. Please date and sign this form before submission.
        </div>

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Protocol Title:</strong>
                <textarea style={lineTextarea} value={titleOfStudy} onChange={(e) => { setTitleOfStudy(e.target.value); save({ titleOfStudy: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Approval Date:</strong>
                <input style={lineInput} value={approvalDate} onChange={(e) => { setApprovalDate(e.target.value); save({ approvalDate: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Name of the Researcher:</strong>
                <textarea style={lineTextarea} value={researcherNameValue} onChange={(e) => { setResearcherNameValue(e.target.value); save({ researcherNameValue: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Institution/School of the Researcher:</strong>
                <textarea style={lineTextarea} value={institutionSchool} onChange={(e) => { setInstitutionSchool(e.target.value); save({ institutionSchool: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td style={{ ...fieldCell, width: "46%" }}><strong>E-mail:</strong>
                <input style={lineInput} value={email} onChange={(e) => { setEmail(e.target.value); save({ email: e.target.value }); }} />
              </td>
              <td style={{ ...fieldCell, width: "26%" }}><strong>Telephone:</strong>
                <input style={lineInput} value={telephone} onChange={(e) => { setTelephone(e.target.value); save({ telephone: e.target.value }); }} />
              </td>
              <td style={{ ...fieldCell, width: "28%" }}><strong>Mobile:</strong>
                <input style={lineInput} value={mobile} onChange={(e) => { setMobile(e.target.value); save({ mobile: e.target.value }); }} />
              </td>
              <td style={{ ...fieldCell, width: "0%", padding: 0, border: "none" }} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Version number/date of Ethical Clearance approved protocol:</strong>
                <input style={lineInput} value={versionDate} onChange={(e) => { setVersionDate(e.target.value); save({ versionDate: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td style={fieldCell}><strong>Effective period of ethical clearance:</strong></td>
              <td style={fieldCell}><strong>From:</strong><input style={lineInput} value={effectiveFrom} onChange={(e) => { setEffectiveFrom(e.target.value); save({ effectiveFrom: e.target.value }); }} /></td>
              <td style={fieldCell}><strong>To:</strong><input style={lineInput} value={effectiveTo} onChange={(e) => { setEffectiveTo(e.target.value); save({ effectiveTo: e.target.value }); }} /></td>
              <td style={fieldCell} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>UIC-REC Protocol Code:</strong>
                <input style={lineInput} value={uicRecProtocolCode} onChange={(e) => { setUicRecProtocolCode(e.target.value); save({ uicRecProtocolCode: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Type of Review:</strong>
                <input style={lineInput} value={typeOfReview} onChange={(e) => { setTypeOfReview(e.target.value); save({ typeOfReview: e.target.value }); }} />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={sectionHeaderCell}>Amendment Submission Date</td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>1. No. of Amendment/s:</strong>
                <input style={lineInput} value={amendmentNumber} onChange={(e) => { setAmendmentNumber(e.target.value); save({ amendmentNumber: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>2. State Nature of Study Protocol Amendment</strong> <span style={smallItalic}>(cite study protocol section and page where amendment is found)</span>
                <textarea style={lineTextarea} value={natureOfAmendment} onChange={(e) => { setNatureOfAmendment(e.target.value); save({ natureOfAmendment: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>

            <tr>
              <td style={{ ...headerGrayCell, width: "40%" }}><strong>Original Version</strong></td>
              <td style={{ ...headerGrayCell, width: "35%" }}><strong>Proposed Amendment</strong></td>
              <td style={{ ...headerGrayCell, width: "25%" }}><strong>Justification</strong></td>
              <td style={{ ...fieldCell, width: "0%", padding: 0, border: "none" }} />
            </tr>
            <tr>
              <td style={amendCell}>
                <strong>Section and Page no.</strong>
                <textarea style={blockTextarea} value={sectionPageNo1} onChange={(e) => { setSectionPageNo1(e.target.value); save({ sectionPageNo1: e.target.value }); }} onInput={autoExpand} />
                <textarea style={blockTextarea} value={originalVersion1} onChange={(e) => { setOriginalVersion1(e.target.value); save({ originalVersion1: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={amendCell}>
                <textarea style={largeTextarea} value={proposedAmendment1} onChange={(e) => { setProposedAmendment1(e.target.value); save({ proposedAmendment1: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={amendCell}>
                <textarea style={largeTextarea} value={justification1} onChange={(e) => { setJustification1(e.target.value); save({ justification1: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={{ ...fieldCell, width: "0%", padding: 0, border: "none" }} />
            </tr>
            <tr>
              <td style={amendCell}>
                <strong>Section and Page no.</strong>
                <textarea style={blockTextarea} value={sectionPageNo2} onChange={(e) => { setSectionPageNo2(e.target.value); save({ sectionPageNo2: e.target.value }); }} onInput={autoExpand} />
                <textarea style={blockTextarea} value={originalVersion2} onChange={(e) => { setOriginalVersion2(e.target.value); save({ originalVersion2: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={amendCell}>
                <textarea style={largeTextarea} value={proposedAmendment2} onChange={(e) => { setProposedAmendment2(e.target.value); save({ proposedAmendment2: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={amendCell}>
                <textarea style={largeTextarea} value={justification2} onChange={(e) => { setJustification2(e.target.value); save({ justification2: e.target.value }); }} onInput={autoExpand} />
              </td>
              <td style={{ ...fieldCell, width: "0%", padding: 0, border: "none" }} />
            </tr>

            <tr>
              <td colSpan={4} style={fieldCell}><strong>ADD A ROW IF NECESSARY</strong></td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Reported by:</strong>
                <input style={lineInput} value={reportedBy} onChange={(e) => { setReportedBy(e.target.value); save({ reportedBy: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Date Submitted:</strong>
                <input type="date" style={lineInput} value={dateSubmitted} onChange={(e) => { setDateSubmitted(e.target.value); save({ dateSubmitted: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Signature of the Researcher:</strong>
                <div style={signaturePadWrap}>
                  <SignatureCell
                    value={researcherSignature}
                    onChange={(val) => {
                      setResearcherSignature(val);
                      save({ researcherSignature: val });
                    }}
                    proposalId={proposalId}
                    formName={formName}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={staffSectionTitleCell}>-----------------------To be filled by the REC Members-----------------------</td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Referred to</strong>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "full-board"} onChange={() => { setReferredTo("full-board"); save({ referredTo: "full-board" }); }} /> Full Board Review by REC</label></div>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "expedited"} onChange={() => { setReferredTo("expedited"); save({ referredTo: "expedited" }); }} /> Expedited Review at the level of REC Chair</label></div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}>Will the amendment/s posts more risks to the participants?</td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={postsMoreRisks === "yes"} onChange={() => { setPostsMoreRisks("yes"); save({ postsMoreRisks: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={postsMoreRisks === "no"} onChange={() => { setPostsMoreRisks("no"); save({ postsMoreRisks: "no" }); }} />No</label></td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 111) • Email Address: ricc@uic.edu.ph</td>
              <td style={footerPageCell}>Page 1 of 2</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={headerLeftCell}>
                <table style={innerHeaderTable}>
                  <tbody>
                    <tr>
                      <td style={logoCell}>
                        <img src="/logoo.png" alt="UIC Logo" style={logoImage} />
                      </td>
                      <td style={schoolCell}>
                        <div style={schoolName}>University of the Immaculate Conception</div>
                        <div style={committeeName}>Research Ethics Committee</div>
                        <div>Bonifacio Street, Davao City, Philippines</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={headerRightCell}>
                <table style={controlBoxTable}>
                  <tbody>
                    <tr>
                      <td style={controlLabelCell}>REC_FO_0018</td>
                    </tr>
                    <tr>
                      <td style={controlInputCell}>Control No. :
                        <input
                          value={staffControlNo}
                          onChange={(e) => {
                            setStaffControlNo(e.target.value);
                            save({ staffControlNo: e.target.value });
                          }}
                          style={lineInputInline}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={2} style={fieldCell}>Is/Are the proposed amendment/s justifiable?</td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={amendmentJustifiable === "yes"} onChange={() => { setAmendmentJustifiable("yes"); save({ amendmentJustifiable: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={amendmentJustifiable === "no"} onChange={() => { setAmendmentJustifiable("no"); save({ amendmentJustifiable: "no" }); }} />No</label></td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>Recommended Action:</strong>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.upholdApproval} onChange={() => toggleRecommendedAction("upholdApproval")} /> Uphold original approval with no further action</label>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.requestInformation} onChange={() => toggleRecommendedAction("requestInformation")} /> Request information: <span style={smallItalic}>(indicate information)</span></label>
                <textarea
                  style={lineTextarea}
                  value={requestInformationText}
                  onChange={(e) => {
                    setRequestInformationText(e.target.value);
                    save({ requestInformationText: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.recommendFurtherAction} onChange={() => toggleRecommendedAction("recommendFurtherAction")} /> Recommend further action: <span style={smallItalic}>(indicate action)</span></label>
                <textarea
                  style={lineTextarea}
                  value={recommendFurtherActionText}
                  onChange={(e) => {
                    setRecommendFurtherActionText(e.target.value);
                    save({ recommendFurtherActionText: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
            </tr>

            {renderReviewerRow(
              "PRIMARY REVIEWER",
              proposalId,
              formName,
              primaryReviewerDate,
              setPrimaryReviewerDate,
              primaryReviewerSignature,
              setPrimaryReviewerSignature,
              primaryReviewerName,
              setPrimaryReviewerName,
              save,
              "primaryReviewerDate",
              "primaryReviewerSignature",
              "primaryReviewerName"
            )}
            {renderReviewerRow(
              "PRIMARY REVIEWER",
              proposalId,
              formName,
              primaryReviewer2Date,
              setPrimaryReviewer2Date,
              primaryReviewer2Signature,
              setPrimaryReviewer2Signature,
              primaryReviewer2Name,
              setPrimaryReviewer2Name,
              save,
              "primaryReviewer2Date",
              "primaryReviewer2Signature",
              "primaryReviewer2Name"
            )}
            {renderReviewerRow(
              "SECRETARIAT STAFF",
              proposalId,
              formName,
              secretariatDate,
              setSecretariatDate,
              secretariatSignature,
              setSecretariatSignature,
              secretariatName,
              setSecretariatName,
              save,
              "secretariatDate",
              "secretariatSignature",
              "secretariatName"
            )}
            {renderReviewerRow(
              "REC CHAIR",
              proposalId,
              formName,
              recChairDate,
              setRecChairDate,
              recChairSignature,
              setRecChairSignature,
              recChairName,
              setRecChairName,
              save,
              "recChairDate",
              "recChairSignature",
              "recChairName"
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderReviewerRow(
  title: string,
  proposalId: number | undefined,
  formName: string | undefined,
  dateValue: string,
  setDate: (value: string) => void,
  signatureValue: string,
  setSignature: (value: string) => void,
  nameValue: string,
  setName: (value: string) => void,
  save: (patch: Record<string, any>) => void,
  dateKey: string,
  signatureKey: string,
  nameKey: string
) {
  return (
    <tr>
      <td colSpan={2} style={reviewerLeftCell}>
        <div style={roleLabel}>{title}</div>
        <div>
          Date:
          <input
            value={dateValue}
            onChange={(e) => {
              setDate(e.target.value);
              save({ [dateKey]: e.target.value });
            }}
            placeholder="dd/mm/yyyy"
            style={lineInputInline}
          />
        </div>
      </td>
      <td colSpan={2} style={reviewerRightCell}>
        <div>
          Signature
          <div style={signaturePadWrap}>
            <SignatureCell
              value={signatureValue}
              onChange={(val) => {
                setSignature(val);
                save({ [signatureKey]: val });
              }}
              proposalId={proposalId}
              formName={formName}
            />
          </div>
        </div>
        <div>
          Name
          <input
            value={nameValue}
            onChange={(e) => {
              setName(e.target.value);
              save({ [nameKey]: e.target.value });
            }}
            placeholder="title, name, surname"
            style={lineInput}
          />
        </div>
      </td>
    </tr>
  );
}

const pageContainer: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  margin: "0 auto 10mm auto",
  background: "white",
  boxSizing: "border-box",
  fontSize: "12px",
  color: "#000",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
};

const headerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "16px",
};

const headerLeftCell: React.CSSProperties = { verticalAlign: "top", width: "72%" };
const headerRightCell: React.CSSProperties = { verticalAlign: "top", width: "28%", textAlign: "right" };

const innerHeaderTable: React.CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };
const logoCell: React.CSSProperties = { width: "62px", verticalAlign: "top" };
const schoolCell: React.CSSProperties = { verticalAlign: "top", lineHeight: 1.3 };
const logoImage: React.CSSProperties = { width: "56px", height: "56px", objectFit: "contain" };
const schoolName: React.CSSProperties = { fontWeight: 500 };
const committeeName: React.CSSProperties = { fontWeight: 700, fontStyle: "italic" };

const controlBoxTable: React.CSSProperties = {
  width: "145px",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid #1f4e79",
  marginLeft: "auto",
};

const controlLabelCell: React.CSSProperties = {
  border: "1px solid #1f4e79",
  textAlign: "center",
  fontSize: "11px",
  padding: "4px",
  fontWeight: 700,
};

const controlInputCell: React.CSSProperties = {
  border: "1px solid #1f4e79",
  fontSize: "11px",
  padding: "4px 6px",
};

const formTitle: React.CSSProperties = { textAlign: "center", fontSize: "20px", fontWeight: 700, marginBottom: "14px" };

const instructionsText: React.CSSProperties = {
  marginBottom: "12px",
  lineHeight: 1.35,
  fontStyle: "italic",
};

const formTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
};

const sectionHeaderCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  fontWeight: 700,
  background: "#efefef",
};

const staffSectionTitleCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  fontWeight: 700,
};

const fieldCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  verticalAlign: "top",
};

const headerGrayCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "4px 6px",
  verticalAlign: "top",
  background: "#efefef",
  textAlign: "center",
};

const amendCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "98px",
};

const fieldCellBig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "60px",
};

const smallItalic: React.CSSProperties = { fontStyle: "italic", fontSize: "11px" };

const choiceLine: React.CSSProperties = { marginTop: "4px", marginLeft: "8px" };

const checkLine: React.CSSProperties = {
  display: "block",
  marginTop: "6px",
  marginLeft: "6px",
};

const checkStyle: React.CSSProperties = { marginRight: "8px" };

const reviewerLeftCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "40%",
  verticalAlign: "top",
};

const reviewerRightCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "60%",
  verticalAlign: "top",
};

const roleLabel: React.CSSProperties = { fontWeight: 700, marginBottom: "6px" };

const yesNoCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
  textAlign: "center",
};

const radioStyle: React.CSSProperties = { marginRight: "6px" };

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

const lineInputInline: React.CSSProperties = {
  width: "58%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  marginLeft: "6px",
  background: "transparent",
};

const lineTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  background: "transparent",
};

const blockTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  minHeight: "24px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  marginTop: "4px",
  background: "transparent",
};

const largeTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  minHeight: "70px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  marginTop: "4px",
  background: "transparent",
};

const signaturePadWrap: React.CSSProperties = { marginTop: "6px", marginBottom: "4px" };

const footerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "6px",
};

const footerTextCell: React.CSSProperties = { fontSize: "11px", width: "80%" };
const footerPageCell: React.CSSProperties = { fontSize: "11px", width: "20%", textAlign: "right", fontWeight: 700 };
