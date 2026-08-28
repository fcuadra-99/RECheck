import { useEffect, useState } from "react";
import type { FormProps } from "./FormViewer";
import SignatureCell from "./SignatureCell";

type YesNo = "yes" | "no" | "";
type ReferredTo = "full-board" | "expedited" | "";
type NatureOfReport = "minor" | "major" | "";
type InvestigatorSeverity = "major" | "minor" | "";

type RecommendedAction = {
  upholdApproval: boolean;
  requestInformation: boolean;
  recommendFurtherAction: boolean;
};

export default function EthicsStudyProtocolNonComplianceReport({
  protocolCode,
  researcherName,
  proposalTitle,
  proposalId,
  formName,
  savedData = {},
  onSave,
  proposalOptions,
  selectedProposalId,
  onSelectProposal,
}: FormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const today = new Date().toISOString().split("T")[0];

  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? s.staffControlNo ?? protocolCode ?? "");
  const [studyProtocolTitle, setStudyProtocolTitle] = useState<string>(s.studyProtocolTitle ?? proposalTitle ?? "");
  const [ethicalClearanceEffectivityPeriod, setEthicalClearanceEffectivityPeriod] = useState<string>(
    s.ethicalClearanceEffectivityPeriod ?? ""
  );
  const [nameResearcher, setNameResearcher] = useState<string>(s.nameResearcher ?? researcherName ?? "");
  const [researcherEmail, setResearcherEmail] = useState<string>(s.researcherEmail ?? "");
  const [researcherTelephone, setResearcherTelephone] = useState<string>(s.researcherTelephone ?? "");
  const [researcherMobile, setResearcherMobile] = useState<string>(s.researcherMobile ?? "");
  const [studySite, setStudySite] = useState<string>(s.studySite ?? "");
  const [sponsorEmail, setSponsorEmail] = useState<string>(s.sponsorEmail ?? "");
  const [sponsorTelephone, setSponsorTelephone] = useState<string>(s.sponsorTelephone ?? "");
  const [sponsorMobile, setSponsorMobile] = useState<string>(s.sponsorMobile ?? "");
  const [reportSubmissionDate, setReportSubmissionDate] = useState<string>(s.reportSubmissionDate ?? "");

  const [natureOfReport, setNatureOfReport] = useState<NatureOfReport>(s.natureOfReport ?? "");
  const [descriptionReportedDeviationViolation, setDescriptionReportedDeviationViolation] = useState<string>(
    s.descriptionReportedDeviationViolation ?? ""
  );
  const [descriptionInvestigatorCorrectiveAction, setDescriptionInvestigatorCorrectiveAction] = useState<string>(
    s.descriptionInvestigatorCorrectiveAction ?? ""
  );
  const [investigatorSeverity, setInvestigatorSeverity] = useState<InvestigatorSeverity>(s.investigatorSeverity ?? "");
  const [dateDeviationViolation, setDateDeviationViolation] = useState<string>(s.dateDeviationViolation ?? "");
  const [reportedBy, setReportedBy] = useState<string>(s.reportedBy ?? researcherName ?? "");
  const [dateOfReport, setDateOfReport] = useState<string>(s.dateOfReport ?? today);
  const [principalInvestigatorSignature, setPrincipalInvestigatorSignature] = useState<string>(
    s.principalInvestigatorSignature ?? ""
  );

  const [staffControlNo, setStaffControlNo] = useState<string>(s.staffControlNo ?? s.controlNo ?? protocolCode ?? "");
  const [referredTo, setReferredTo] = useState<ReferredTo>(s.referredTo ?? "");
  const [methodologyMoreRisks, setMethodologyMoreRisks] = useState<YesNo>(s.methodologyMoreRisks ?? "");
  const [correctiveActionAppropriate, setCorrectiveActionAppropriate] = useState<YesNo>(
    s.correctiveActionAppropriate ?? ""
  );

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

  const [secretariatDate, setSecretariatDate] = useState<string>(s.secretariatDate ?? "");
  const [secretariatSignature, setSecretariatSignature] = useState<string>(s.secretariatSignature ?? "");
  const [secretariatName, setSecretariatName] = useState<string>(s.secretariatName ?? "");

  const [recChairDate, setRecChairDate] = useState<string>(s.recChairDate ?? "");
  const [recChairSignature, setRecChairSignature] = useState<string>(s.recChairSignature ?? "");
  const [recChairName, setRecChairName] = useState<string>(s.recChairName ?? "");

  const proposalChoices = proposalOptions ?? [];
  const showProposalSelect = proposalOptions !== undefined;

  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.controlNo && s.staffControlNo) patch.controlNo = s.staffControlNo;
    if (!s.staffControlNo && s.controlNo) patch.staffControlNo = s.controlNo;
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.staffControlNo && protocolCode) patch.staffControlNo = protocolCode;
    if (!s.studyProtocolTitle && proposalTitle) patch.studyProtocolTitle = proposalTitle;
    if (!s.nameResearcher && researcherName) patch.nameResearcher = researcherName;
    if (!s.reportedBy && researcherName) patch.reportedBy = researcherName;
    if (!s.dateOfReport) patch.dateOfReport = today;
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    resizeTextarea(e.currentTarget);
  };

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const applyProposalSelection = (proposalIdValue: number | null) => {
    onSelectProposal?.(proposalIdValue);
    const selected = proposalChoices.find((proposal) => proposal.id === proposalIdValue);
    if (!selected) return;

    const code = selected.protocolCode ?? "";
    setStudyProtocolTitle(selected.title);
    setControlNo(code);
    setStaffControlNo(code);
    save({
      studyProtocolTitle: selected.title,
      controlNo: code,
      staffControlNo: code,
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(resizeTextarea);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleRecommendedAction = (key: keyof RecommendedAction) => {
    const next = { ...recommendedAction, [key]: !recommendedAction[key] };
    setRecommendedAction(next);
    save({ recommendedAction: next });
  };

  return (
    <div>
      <div style={pageContainer}>
        {renderHeader(controlNo, (value) => {
          setControlNo(value);
          setStaffControlNo(value);
          save({ controlNo: value, staffControlNo: value });
        })}

        <div style={formTitle}>Ethics Study Protocol Non-Compliance (Deviation or Violations) Report</div>

        <div style={instructionsText}>
          INSTRUCTIONS TO THE PRINCIPAL INVESTIGATOR: Accomplish a copy of this form and include all information required in
          the space. <strong>Date and sign this form before submission.</strong>
        </div>

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Protocol Code:</strong>
                <input
                  style={lineInput}
                  value={controlNo}
                  onChange={(e) => {
                    const value = e.target.value;
                    setControlNo(value);
                    setStaffControlNo(value);
                    save({ controlNo: value, staffControlNo: value });
                  }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Protocol Title:</strong>
                {showProposalSelect ? (
                  <select
                    style={lineInput}
                    value={selectedProposalId ?? ""}
                    onChange={(e) => {
                      const nextId = e.target.value ? Number(e.target.value) : null;
                      applyProposalSelection(nextId);
                    }}
                    disabled={proposalChoices.length === 0}
                  >
                    <option value="">
                      {proposalChoices.length === 0 ? "No proposals available" : "Choose a proposal..."}
                    </option>
                    {proposalChoices.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    style={lineTextarea}
                    value={studyProtocolTitle}
                    readOnly
                    rows={1}
                  />
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Ethical Clearance Effectivity Period:</strong>
                <input
                  style={lineInput}
                  value={ethicalClearanceEffectivityPeriod}
                  onChange={(e) => {
                    setEthicalClearanceEffectivityPeriod(e.target.value);
                    save({ ethicalClearanceEffectivityPeriod: e.target.value });
                  }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Name of the Researcher:</strong>
                <textarea
                  style={lineTextarea}
                  value={nameResearcher}
                  onChange={(e) => {
                    setNameResearcher(e.target.value);
                    save({ nameResearcher: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
            </tr>
            <tr>
              <td style={{ ...fieldCell, width: "43%" }}><strong>E-mail:</strong>
                <input
                  style={lineInput}
                  value={researcherEmail}
                  onChange={(e) => {
                    setResearcherEmail(e.target.value);
                    save({ researcherEmail: e.target.value });
                  }}
                />
              </td>
              <td style={{ ...fieldCell, width: "28%" }}><strong>Telephone:</strong>
                <input
                  style={lineInput}
                  value={researcherTelephone}
                  onChange={(e) => {
                    setResearcherTelephone(e.target.value);
                    save({ researcherTelephone: e.target.value });
                  }}
                />
              </td>
              <td style={{ ...fieldCell, width: "29%" }}><strong>Mobile:</strong>
                <input
                  style={lineInput}
                  value={researcherMobile}
                  onChange={(e) => {
                    setResearcherMobile(e.target.value);
                    save({ researcherMobile: e.target.value });
                  }}
                />
              </td>
              <td style={hiddenCell} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Study Site:</strong>
                <input
                  style={lineInput}
                  value={studySite}
                  onChange={(e) => {
                    setStudySite(e.target.value);
                    save({ studySite: e.target.value });
                  }}
                />
              </td>
            </tr>
            <tr>
              <td style={fieldCell}><strong>E-mail:</strong>
                <input
                  style={lineInput}
                  value={sponsorEmail}
                  onChange={(e) => {
                    setSponsorEmail(e.target.value);
                    save({ sponsorEmail: e.target.value });
                  }}
                />
              </td>
              <td style={fieldCell}><strong>Telephone:</strong>
                <input
                  style={lineInput}
                  value={sponsorTelephone}
                  onChange={(e) => {
                    setSponsorTelephone(e.target.value);
                    save({ sponsorTelephone: e.target.value });
                  }}
                />
              </td>
              <td style={fieldCell}><strong>Mobile:</strong>
                <input
                  style={lineInput}
                  value={sponsorMobile}
                  onChange={(e) => {
                    setSponsorMobile(e.target.value);
                    save({ sponsorMobile: e.target.value });
                  }}
                />
              </td>
              <td style={hiddenCell} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Report Submission Date:</strong>
                <input
                  style={lineInput}
                  value={reportSubmissionDate}
                  onChange={(e) => {
                    setReportSubmissionDate(e.target.value);
                    save({ reportSubmissionDate: e.target.value });
                  }}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <div style={numberTitle}><strong>1. Nature of Report:</strong></div>
                <div style={subNumberText}>
                  <label>
                    <input
                      type="radio"
                      name="natureOfReport"
                      style={radioStyle}
                      checked={natureOfReport === "minor"}
                      onChange={() => {
                        setNatureOfReport("minor");
                        save({ natureOfReport: "minor" });
                      }}
                    />
                    <span>1.1.</span>
                    <span style={bulletText}>• Minor Protocol Deviation <span style={italicText}>(non-systematic protocol noncompliance with minor consequences, in terms of its effect on participant's/subject's rights, safety or welfare, or the integrity of study data; includes deviations that are administrative in nature)</span></span>
                  </label>
                </div>
                <div style={subNumberText}>
                  <label>
                    <input
                      type="radio"
                      name="natureOfReport"
                      style={radioStyle}
                      checked={natureOfReport === "major"}
                      onChange={() => {
                        setNatureOfReport("major");
                        save({ natureOfReport: "major" });
                      }}
                    />
                    <span>1.2.</span>
                    <span style={bulletText}>• Major protocol deviation or protocol Violation <span style={italicText}>(persistent protocol noncompliance with potentially serious consequences that could critically affect data analysis or put participant's/subject's safety at risk)</span></span>
                  </label>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCellBig}><strong>2. Description of Reported Deviation/Violation:</strong>
                <textarea
                  style={blockTextarea}
                  value={descriptionReportedDeviationViolation}
                  onChange={(e) => {
                    setDescriptionReportedDeviationViolation(e.target.value);
                    save({ descriptionReportedDeviationViolation: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={2}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCellBig}><strong>3. Description of Investigator Corrective Action:</strong>
                <textarea
                  style={blockTextarea}
                  value={descriptionInvestigatorCorrectiveAction}
                  onChange={(e) => {
                    setDescriptionInvestigatorCorrectiveAction(e.target.value);
                    save({ descriptionInvestigatorCorrectiveAction: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={2}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <div style={numberTitle}><strong>4. Investigator Assessment of Severity:</strong></div>
                <div style={choiceLine}>
                  <label>
                    <input
                      type="radio"
                      name="investigatorSeverity"
                      style={radioStyle}
                      checked={investigatorSeverity === "major"}
                      onChange={() => {
                        setInvestigatorSeverity("major");
                        save({ investigatorSeverity: "major" });
                      }}
                    />
                    4.1. • Major
                  </label>
                </div>
                <div style={choiceLine}>
                  <label>
                    <input
                      type="radio"
                      name="investigatorSeverity"
                      style={radioStyle}
                      checked={investigatorSeverity === "minor"}
                      onChange={() => {
                        setInvestigatorSeverity("minor");
                        save({ investigatorSeverity: "minor" });
                      }}
                    />
                    4.2. • Minor
                  </label>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCell}><strong>Date of Deviation/Violation:</strong>
                <input
                  style={lineInput}
                  value={dateDeviationViolation}
                  onChange={(e) => {
                    setDateDeviationViolation(e.target.value);
                    save({ dateDeviationViolation: e.target.value });
                  }}
                  placeholder="dd/mm/yyyy"
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Reported By:</strong>
                <input
                  style={lineInput}
                  value={reportedBy}
                  onChange={(e) => {
                    setReportedBy(e.target.value);
                    save({ reportedBy: e.target.value });
                  }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Date of Report:</strong>
                <input
                  style={lineInput}
                  value={dateOfReport}
                  onChange={(e) => {
                    setDateOfReport(e.target.value);
                    save({ dateOfReport: e.target.value });
                  }}
                  placeholder="dd/mm/yyyy"
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Signature of Principal Investigator:</strong>
                <div style={signaturePadWrap}>
                  <SignatureCell
                    value={principalInvestigatorSignature}
                    onChange={(val) => {
                      setPrincipalInvestigatorSignature(val);
                      save({ principalInvestigatorSignature: val });
                    }}
                    proposalId={proposalId}
                    formName={formName}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={staffDividerTable}>
          <tbody>
            <tr>
              <td style={staffDividerCell}>------------------To be filled by the REC Members------------------</td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-28-26 (loc. 111) • Email Address: rec@uic.edu.ph</td>
              <td style={footerPageCell}>Page 1 of 2</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        {renderHeader(staffControlNo, (value) => {
          setStaffControlNo(value);
          setControlNo(value);
          save({ staffControlNo: value, controlNo: value });
        })}

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={fieldCell}><strong>Referred to</strong>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "full-board"} onChange={() => { setReferredTo("full-board"); save({ referredTo: "full-board" }); }} /> Full Board Review by REC</label></div>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={referredTo === "expedited"} onChange={() => { setReferredTo("expedited"); save({ referredTo: "expedited" }); }} /> Expedited Review at the level of REC Chair</label></div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}><strong>Will the change in the methodology pose more risks to the participants?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={methodologyMoreRisks === "yes"} onChange={() => { setMethodologyMoreRisks("yes"); save({ methodologyMoreRisks: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={methodologyMoreRisks === "no"} onChange={() => { setMethodologyMoreRisks("no"); save({ methodologyMoreRisks: "no" }); }} />No</label></td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}><strong>Is the corrective action appropriate?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={correctiveActionAppropriate === "yes"} onChange={() => { setCorrectiveActionAppropriate("yes"); save({ correctiveActionAppropriate: "yes" }); }} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={correctiveActionAppropriate === "no"} onChange={() => { setCorrectiveActionAppropriate("no"); save({ correctiveActionAppropriate: "no" }); }} />No</label></td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>Recommended Action:</strong>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.upholdApproval} onChange={() => toggleRecommendedAction("upholdApproval")} /> Uphold original approval with no further action</label>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.requestInformation} onChange={() => toggleRecommendedAction("requestInformation")} /> Request information: <span style={italicText}>(indicate information)</span></label>
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
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={recommendedAction.recommendFurtherAction} onChange={() => toggleRecommendedAction("recommendFurtherAction")} /> Recommend further action: <span style={italicText}>(indicate action)</span></label>
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

function renderHeader(controlNo: string, onControlNoChange: (value: string) => void) {
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
                  <td style={controlLabelCell}>REC_FO_0020</td>
                </tr>
                <tr>
                  <td style={controlInputCell}>Control No.: <input style={lineInputInline} value={controlNo} onChange={(e) => onControlNoChange(e.target.value)} /></td>
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

const formTitle: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 700,
  fontSize: "30px",
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

const fieldCellBig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "64px",
};

const hiddenCell: React.CSSProperties = { ...fieldCell, width: "0%", padding: 0, border: "none" };

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
  minHeight: "36px",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  marginTop: "4px",
};

const numberTitle: React.CSSProperties = { marginBottom: "4px" };
const subNumberText: React.CSSProperties = { marginTop: "6px", lineHeight: 1.3 };
const bulletText: React.CSSProperties = { marginLeft: "8px", display: "inline-block", maxWidth: "93%", verticalAlign: "top" };
const italicText: React.CSSProperties = { fontStyle: "italic" };

const choiceLine: React.CSSProperties = { marginTop: "4px", marginLeft: "8px" };
const radioStyle: React.CSSProperties = { marginRight: "6px" };

const checkLine: React.CSSProperties = {
  display: "block",
  marginTop: "6px",
  marginLeft: "6px",
};

const checkStyle: React.CSSProperties = {
  marginRight: "8px",
};

const yesNoCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
  textAlign: "center",
};

const reviewerLeftCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "34%",
  verticalAlign: "top",
};

const reviewerRightCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "66%",
  verticalAlign: "top",
};

const roleLabel: React.CSSProperties = { fontWeight: 700, marginBottom: "6px" };
const signaturePadWrap: React.CSSProperties = { marginTop: "6px", marginBottom: "4px" };

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

const staffDividerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "10px",
};

const staffDividerCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  fontWeight: 700,
};

const footerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "12px",
};

const footerTextCell: React.CSSProperties = { fontSize: "11px", width: "80%", textAlign: "center" };
const footerPageCell: React.CSSProperties = { fontSize: "11px", width: "20%", textAlign: "right", fontWeight: 700 };
