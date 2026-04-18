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

export default function EthicsEarlyStudyTerminationApplicationForm({
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

  const [controlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [studyProtocolTitle, setStudyProtocolTitle] = useState<string>(s.studyProtocolTitle ?? proposalTitle ?? "");
  const [approvalDate, setApprovalDate] = useState<string>(s.approvalDate ?? "");
  const [principalInvestigator, setPrincipalInvestigator] = useState<string>(s.principalInvestigator ?? researcherName ?? "");
  const [email, setEmail] = useState<string>(s.email ?? "");
  const [mobile, setMobile] = useState<string>(s.mobile ?? "");
  const [studySite, setStudySite] = useState<string>(s.studySite ?? "");
  const [studySiteAddress, setStudySiteAddress] = useState<string>(s.studySiteAddress ?? "");
  const [sponsor, setSponsor] = useState<string>(s.sponsor ?? "");
  const [sponsorContactPerson, setSponsorContactPerson] = useState<string>(s.sponsorContactPerson ?? "");
  const [sponsorEmail, setSponsorEmail] = useState<string>(s.sponsorEmail ?? "");
  const [sponsorTelephone, setSponsorTelephone] = useState<string>(s.sponsorTelephone ?? "");
  const [sponsorMobile, setSponsorMobile] = useState<string>(s.sponsorMobile ?? "");
  const [applicationSubmissionDate, setApplicationSubmissionDate] = useState<string>(s.applicationSubmissionDate ?? "");

  const [startDate, setStartDate] = useState<string>(s.startDate ?? "");
  const [proposedTerminationDate, setProposedTerminationDate] = useState<string>(s.proposedTerminationDate ?? "");
  const [participantsEnrolledToDate, setParticipantsEnrolledToDate] = useState<string>(s.participantsEnrolledToDate ?? "");
  const [summaryResultsToDate, setSummaryResultsToDate] = useState<string>(s.summaryResultsToDate ?? "");
  const [reasonForTermination, setReasonForTermination] = useState<string>(s.reasonForTermination ?? "");
  const [planDisposalCollectedData, setPlanDisposalCollectedData] = useState<string>(s.planDisposalCollectedData ?? "");

  const [researcherSignature, setResearcherSignature] = useState<string>(s.researcherSignature ?? "");
  const [dateOfApplication, setDateOfApplication] = useState<string>(s.dateOfApplication ?? today);

  const [staffControlNo] = useState<string>(s.staffControlNo ?? "");
  const [referredTo, setReferredTo] = useState<ReferredTo>(s.referredTo ?? "");
  const [terminationJustifiable, setTerminationJustifiable] = useState<YesNo>(s.terminationJustifiable ?? "");
  const [studyAffectParticipants, setStudyAffectParticipants] = useState<YesNo>(s.studyAffectParticipants ?? "");

  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction>(
    s.recommendedAction ?? {
      upholdApproval: false,
      requestInformation: false,
      recommendFurtherAction: false,
    }
  );
  const [requestInformationText, setRequestInformationText] = useState<string>(s.requestInformationText ?? "");
  const [recommendFurtherActionText, setRecommendFurtherActionText] = useState<string>(s.recommendFurtherActionText ?? "");

  const [primaryReviewer1Date, setPrimaryReviewer1Date] = useState<string>(s.primaryReviewer1Date ?? "");
  const [primaryReviewer1Signature, setPrimaryReviewer1Signature] = useState<string>(s.primaryReviewer1Signature ?? "");
  const [primaryReviewer1Name, setPrimaryReviewer1Name] = useState<string>(s.primaryReviewer1Name ?? "");

  const [primaryReviewer2Date, setPrimaryReviewer2Date] = useState<string>(s.primaryReviewer2Date ?? "");
  const [primaryReviewer2Signature, setPrimaryReviewer2Signature] = useState<string>(s.primaryReviewer2Signature ?? "");
  const [primaryReviewer2Name, setPrimaryReviewer2Name] = useState<string>(s.primaryReviewer2Name ?? "");

  const [recChairDate, setRecChairDate] = useState<string>(s.recChairDate ?? "");
  const [recChairSignature, setRecChairSignature] = useState<string>(s.recChairSignature ?? "");
  const [recChairName, setRecChairName] = useState<string>(s.recChairName ?? "");

  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.studyProtocolTitle && proposalTitle) patch.studyProtocolTitle = proposalTitle;
    if (!s.principalInvestigator && researcherName) patch.principalInvestigator = researcherName;
    if (!s.dateOfApplication) patch.dateOfApplication = today;
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
        {renderHeader(controlNo)}

        <div style={pinkRule} />
        <div style={formTitle}>Ethics Early Study Termination Application Form</div>

        <div style={instructionsText}>
          INSTRUCTIONS TO THE PRINCIPAL INVESTIGATOR: This form is required to apply for premature termination or suspension of a study and
          refers to ICH-GCP Sections 4.12: Premature Termination or Suspension of a Study.
        </div>

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Protocol Code:</strong></td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Protocol Title:</strong>
                <textarea style={lineTextarea} value={studyProtocolTitle} onChange={(e) => { setStudyProtocolTitle(e.target.value); save({ studyProtocolTitle: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Approval Date:</strong>
                <input style={lineInput} value={approvalDate} onChange={(e) => { setApprovalDate(e.target.value); save({ approvalDate: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Principal Investigator/Researcher:</strong>
                <textarea style={lineTextarea} value={principalInvestigator} onChange={(e) => { setPrincipalInvestigator(e.target.value); save({ principalInvestigator: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td style={{ ...fieldCell, width: "43%" }}><strong>E-mail:</strong>
                <input style={lineInput} value={email} onChange={(e) => { setEmail(e.target.value); save({ email: e.target.value }); }} />
              </td>
              <td style={{ ...fieldCell, width: "27%" }}><strong>Mobile:</strong>
                <input style={lineInput} value={mobile} onChange={(e) => { setMobile(e.target.value); save({ mobile: e.target.value }); }} />
              </td>
              <td style={{ ...fieldCell, width: "30%" }} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Site:</strong>
                <input style={lineInput} value={studySite} onChange={(e) => { setStudySite(e.target.value); save({ studySite: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Site Address:</strong>
                <input style={lineInput} value={studySiteAddress} onChange={(e) => { setStudySiteAddress(e.target.value); save({ studySiteAddress: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Sponsor:</strong>
                <input style={lineInput} value={sponsor} onChange={(e) => { setSponsor(e.target.value); save({ sponsor: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Sponsor Contact Person:</strong>
                <input style={lineInput} value={sponsorContactPerson} onChange={(e) => { setSponsorContactPerson(e.target.value); save({ sponsorContactPerson: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td style={fieldCell}><strong>E-mail:</strong>
                <input style={lineInput} value={sponsorEmail} onChange={(e) => { setSponsorEmail(e.target.value); save({ sponsorEmail: e.target.value }); }} />
              </td>
              <td style={fieldCell}><strong>Telephone:</strong>
                <input style={lineInput} value={sponsorTelephone} onChange={(e) => { setSponsorTelephone(e.target.value); save({ sponsorTelephone: e.target.value }); }} />
              </td>
              <td style={fieldCell}><strong>Mobile:</strong>
                <input style={lineInput} value={sponsorMobile} onChange={(e) => { setSponsorMobile(e.target.value); save({ sponsorMobile: e.target.value }); }} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Application Submission Date:</strong>
                <input style={lineInput} value={applicationSubmissionDate} onChange={(e) => { setApplicationSubmissionDate(e.target.value); save({ applicationSubmissionDate: e.target.value }); }} />
              </td>
            </tr>

            <tr><td colSpan={4} style={fieldCell}><strong>1. Start Date:</strong><input style={lineInput} value={startDate} onChange={(e) => { setStartDate(e.target.value); save({ startDate: e.target.value }); }} /></td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>2. Proposed Termination Date:</strong><input style={lineInput} value={proposedTerminationDate} onChange={(e) => { setProposedTerminationDate(e.target.value); save({ proposedTerminationDate: e.target.value }); }} /></td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>3. Participants Enrolled to Date:</strong><input style={lineInput} value={participantsEnrolledToDate} onChange={(e) => { setParticipantsEnrolledToDate(e.target.value); save({ participantsEnrolledToDate: e.target.value }); }} /></td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>4. Summary of Results to Date:</strong><textarea style={blockTextarea} value={summaryResultsToDate} onChange={(e) => { setSummaryResultsToDate(e.target.value); save({ summaryResultsToDate: e.target.value }); }} onInput={autoExpand} /></td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>5. Reason for Termination:</strong><textarea style={blockTextarea} value={reasonForTermination} onChange={(e) => { setReasonForTermination(e.target.value); save({ reasonForTermination: e.target.value }); }} onInput={autoExpand} /></td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>6. Plan for disposal of the collected data:</strong><textarea style={blockTextarea} value={planDisposalCollectedData} onChange={(e) => { setPlanDisposalCollectedData(e.target.value); save({ planDisposalCollectedData: e.target.value }); }} onInput={autoExpand} /></td></tr>

            <tr><td colSpan={4} style={fieldCell}><strong>Signature of the Researcher:</strong>
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
            </td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>Date of Application:</strong><input type="date" style={lineInput} value={dateOfApplication} onChange={(e) => { setDateOfApplication(e.target.value); save({ dateOfApplication: e.target.value }); }} /></td></tr>

            <tr><td colSpan={4} style={staffTitleCell}>------------------To be filled by the REC Members------------------</td></tr>
            <tr><td colSpan={4} style={fieldCell}><strong>Referred to</strong>
              <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "full-board"} onChange={() => { setReferredTo("full-board"); save({ referredTo: "full-board" }); }} /> Full Board Review by REC</label></div>
              <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "expedited"} onChange={() => { setReferredTo("expedited"); save({ referredTo: "expedited" }); }} /> Expedited Review at the level of REC Chair</label></div>
            </td></tr>
            <tr>
              <td colSpan={2} style={fieldCell}><strong>Is the reason for the termination of the study justifiable?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={terminationJustifiable === "yes"} onChange={() => { setTerminationJustifiable("yes"); save({ terminationJustifiable: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={terminationJustifiable === "no"} onChange={() => { setTerminationJustifiable("no"); save({ terminationJustifiable: "no" }); }} />No</label></td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}><strong>Will the termination of the study affect the involved participants?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={studyAffectParticipants === "yes"} onChange={() => { setStudyAffectParticipants("yes"); save({ studyAffectParticipants: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={studyAffectParticipants === "no"} onChange={() => { setStudyAffectParticipants("no"); save({ studyAffectParticipants: "no" }); }} />No</label></td>
            </tr>
            <tr><td colSpan={4} style={fieldCell}><strong>Recommended Action:</strong></td></tr>
          </tbody>
        </table>

        <table style={footerTable}><tbody><tr><td style={footerTextCell}>Telephone No. (082) 227-28-26 (loc. 111) • Email Address: rpic@uic.edu.ph</td><td style={footerPageCell}>Page 1 of 2</td></tr></tbody></table>
      </div>

      <div style={pageContainer}>
        {renderHeader(staffControlNo)}

        <div style={pinkRule} />

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={tdBig}>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.upholdApproval} onChange={() => toggleRecommendedAction("upholdApproval")} /> Uphold original approval with no further action</label>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.requestInformation} onChange={() => toggleRecommendedAction("requestInformation")} /> Request information: <span style={smallItalic}>(indicate information)</span></label>
                <textarea style={lineTextarea} value={requestInformationText} onChange={(e) => { setRequestInformationText(e.target.value); save({ requestInformationText: e.target.value }); }} onInput={autoExpand} rows={1} />
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.recommendFurtherAction} onChange={() => toggleRecommendedAction("recommendFurtherAction")} /> Recommend further action: <span style={smallItalic}>(indicate action)</span></label>
                <textarea style={lineTextarea} value={recommendFurtherActionText} onChange={(e) => { setRecommendFurtherActionText(e.target.value); save({ recommendFurtherActionText: e.target.value }); }} onInput={autoExpand} rows={1} />
              </td>
            </tr>

            {renderReviewerRow(
              "PRIMARY REVIEWER",
              proposalId,
              formName,
              primaryReviewer1Date,
              setPrimaryReviewer1Date,
              primaryReviewer1Signature,
              setPrimaryReviewer1Signature,
              primaryReviewer1Name,
              setPrimaryReviewer1Name,
              save,
              "primaryReviewer1Date",
              "primaryReviewer1Signature",
              "primaryReviewer1Name"
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

function renderHeader(controlNo: string) {
  return (
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
                    <div style={committeeName}>Research, Publication, and Innovation Center</div>
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
                  <td style={controlLabelCell}>RPIC_FO_0022</td>
                </tr>
                <tr>
                  <td style={controlInputCell}>Control No.: <input style={lineInputInline} value={controlNo} readOnly /></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
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

const pinkRule: React.CSSProperties = {
  borderTop: "3px solid #ff2d95",
  marginBottom: "10px",
};

const formTitle: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 700,
  fontSize: "22px",
  marginBottom: "14px",
};

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

const fieldCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  verticalAlign: "top",
};

const tdBig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "60px",
};

const staffTitleCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  fontWeight: 700,
};

const yesNoCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
  textAlign: "center",
};

const checkLine: React.CSSProperties = {
  display: "block",
  marginTop: "6px",
  marginLeft: "6px",
};

const checkStyle: React.CSSProperties = {
  marginRight: "8px",
};

const choiceLine: React.CSSProperties = { marginTop: "4px", marginLeft: "8px" };
const radioStyle: React.CSSProperties = { marginRight: "6px" };

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
const signaturePadWrap: React.CSSProperties = { marginTop: "6px", marginBottom: "4px" };

const lineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
};

const lineInputInline: React.CSSProperties = {
  width: "56%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "12px",
  marginLeft: "6px",
};

const lineTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
};

const blockTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "30px",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  marginTop: "4px",
};

const smallItalic: React.CSSProperties = { fontStyle: "italic", fontSize: "11px" };

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

const footerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "6px",
};

const footerTextCell: React.CSSProperties = { fontSize: "11px", width: "80%" };
const footerPageCell: React.CSSProperties = { fontSize: "11px", width: "20%", textAlign: "right", fontWeight: 700 };
