import { useEffect, useState } from "react";
import type { FormProps } from "./FormViewer";
import SignatureCell from "./SignatureCell";
import MemberListInput from "./MemberListInput";

type RecommendedAction = {
  upholdApproval: boolean;
  requestInformation: boolean;
  recommendFurtherAction: boolean;
};

const DEFAULT_CHECKS: RecommendedAction = {
  upholdApproval: false,
  requestInformation: false,
  recommendFurtherAction: false,
};

export default function EthicsContinuingReviewApplicationForm({
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

  const [fields, setFields] = useState<Record<string, string>>(s.fields ?? {});
  const [researcherNames, setResearcherNames] = useState<string[]>(
    s.researcherNames ??
      (fields.nameResearcher
        ? fields.nameResearcher.split(",").map((x: string) => x.trim()).filter(Boolean)
        : researcherName
          ? [researcherName]
          : [""])
  );
  const [checks, setChecks] = useState<RecommendedAction>(s.checks ?? DEFAULT_CHECKS);

  const proposalChoices = proposalOptions ?? [];
  const showProposalSelect = proposalOptions !== undefined;

  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!fields.studyProtocolTitle && proposalTitle) patch.studyProtocolTitle = proposalTitle;
    if (!fields.nameResearcher && researcherName) patch.nameResearcher = researcherName;
    if (!fields.controlNo && fields.staffControlNo) patch.controlNo = fields.staffControlNo;
    if (!fields.staffControlNo && fields.controlNo) patch.staffControlNo = fields.controlNo;
    if (!fields.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!fields.staffControlNo && protocolCode) patch.staffControlNo = protocolCode;
    if (Object.keys(patch).length > 0) {
      const next = { ...fields, ...patch };
      setFields(next);
      save({ fields: next });
    }
  }, []);

  const updateField = (key: string, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ fields: next });
  };

  const updateControlNos = (value: string) => {
    const next = { ...fields, controlNo: value, staffControlNo: value };
    setFields(next);
    save({ fields: next });
  };

  const toggleCheck = (key: keyof RecommendedAction) => {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    save({ checks: next });
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    resizeTextarea(el);
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
    const next = {
      ...fields,
      studyProtocolTitle: selected.title,
      controlNo: code,
      staffControlNo: code,
    };
    setFields(next);
    save({ fields: next });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(resizeTextarea);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div>
      <div style={pageContainer}>
        {renderHeader(fields.controlNo || "", updateControlNos)}

        <div style={titleStyle}>Ethics Continuing Review Application Form</div>

        <div style={instructionsStyle}>
          INSTRUCTIONS TO THE PRINCIPAL INVESTIGATOR: Ethical clearance or approval is typically granted for a period of one year.
          Continuing review is required to be done at least once a year, corresponding the risk assessment of the study protocol.
          For ethical clearance or approval approaching the one-year expiry date and requiring a renewal or extension, it is advisable to
          submit this form 45 days prior to expiry date. Please fill up this form and provide all required information then, date and sign
          this form before submission.
        </div>

        <table style={table}>
          <tbody>
            <tr>
              <td colSpan={4} style={td}><strong>Protocol Code:</strong>
                <input
                  style={lineInput}
                  value={fields.controlNo || ""}
                  onChange={(e) => updateControlNos(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Study Protocol Title:</strong>
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
                    value={fields.studyProtocolTitle || ""}
                    readOnly
                    rows={1}
                  />
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Ethical Clearance Effectivity Period:</strong>
                <input style={lineInput} value={fields.ethicalClearanceEffectivityPeriod || ""} onChange={(e) => updateField("ethicalClearanceEffectivityPeriod", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Name of the Researcher:</strong>
                <MemberListInput
                  values={researcherNames}
                  onChange={(values) => {
                    setResearcherNames(values);
                    const joined = values.filter(Boolean).join(", ");
                    updateField("nameResearcher", joined);
                    save({ researcherNames: values });
                  }}
                  placeholder="Enter researcher name"
                />
              </td>
            </tr>
            <tr>
              <td style={{ ...td, width: "40%" }}><strong>E-mail:</strong>
                <input style={lineInput} value={fields.email || ""} onChange={(e) => updateField("email", e.target.value)} />
              </td>
              <td style={{ ...td, width: "33%" }}><strong>Telephone:</strong>
                <input style={lineInput} value={fields.telephone || ""} onChange={(e) => updateField("telephone", e.target.value)} />
              </td>
              <td style={{ ...td, width: "27%" }}><strong>Mobile:</strong>
                <input style={lineInput} value={fields.mobile || ""} onChange={(e) => updateField("mobile", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Study Site:</strong>
                <textarea style={lineTextarea} value={fields.studySite || ""} onChange={(e) => updateField("studySite", e.target.value)} onInput={autoExpand} rows={1} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Sponsor:</strong>
                <input style={lineInput} value={fields.sponsor || ""} onChange={(e) => updateField("sponsor", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Sponsor Contact Person:</strong>
                <input style={lineInput} value={fields.sponsorContactPerson || ""} onChange={(e) => updateField("sponsorContactPerson", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={td}><strong>E-mail.</strong>
                <input style={lineInput} value={fields.sponsorEmail || ""} onChange={(e) => updateField("sponsorEmail", e.target.value)} />
              </td>
              <td style={td}><strong>Telephone:</strong>
                <input style={lineInput} value={fields.sponsorTelephone || ""} onChange={(e) => updateField("sponsorTelephone", e.target.value)} />
              </td>
              <td style={td}><strong>Mobile:</strong>
                <input style={lineInput} value={fields.sponsorMobile || ""} onChange={(e) => updateField("sponsorMobile", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Application Submission Date:</strong>
                <input style={lineInput} value={fields.applicationSubmissionDate || ""} onChange={(e) => updateField("applicationSubmissionDate", e.target.value)} />
              </td>
            </tr>

            <tr><td colSpan={4} style={td}><strong>1. Start Date:</strong></td></tr>
            <tr><td colSpan={4} style={tdSub}>1.1. Date of research site initiation: <input style={lineInputInline} value={fields.q11 || ""} onChange={(e) => updateField("q11", e.target.value)} /></td></tr>
            <tr><td colSpan={4} style={tdSub}>1.2. Explanation, if not yet initialized as of the date of this application: &lt;reason/s&gt;
              <textarea style={lineTextarea} value={fields.q12 || ""} onChange={(e) => updateField("q12", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>2. Action Requested:</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="actionRequested"
                    style={radioStyle}
                    checked={fields.actionRequested === "renewal-ongoing"}
                    onChange={() => updateField("actionRequested", "renewal-ongoing")}
                  />
                  2.1. Renewal: subject enrollment still ongoing
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="actionRequested"
                    style={radioStyle}
                    checked={fields.actionRequested === "renewal-followup"}
                    onChange={() => updateField("actionRequested", "renewal-followup")}
                  />
                  2.2. Renewal: randomized participants follow-up visits only
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="actionRequested"
                    style={radioStyle}
                    checked={fields.actionRequested === "early-termination"}
                    onChange={() => updateField("actionRequested", "early-termination")}
                  />
                  2.3. Early Termination: study protocol discontinued ahead of study indicated duration
                </label>
              </td>
            </tr>

            <tr><td colSpan={4} style={td}><strong>3. Have there been any amendments since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasAmendments"
                    style={radioStyle}
                    checked={fields.hasAmendments === "no"}
                    onChange={() => updateField("hasAmendments", "no")}
                  />
                  3.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasAmendments"
                  style={radioStyle}
                  checked={fields.hasAmendments === "yes"}
                  onChange={() => updateField("hasAmendments", "yes")}
                />
                3.2. - Yes (Describe briefly and indicate the date/s of Study Protocol Amendment Submission/s):
              </label>
              <textarea style={lineTextarea} value={fields.q32 || ""} onChange={(e) => updateField("q32", e.target.value)} onInput={autoExpand} rows={1} />
              <span style={smallItalic}> Please use additional pages if necessary</span>
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>4. Summary of Study Protocol Participants:</strong></td></tr>
            <tr><td colSpan={4} style={tdSub}>4.1. - No. of study subjects, the Principal Investigator should randomize (ceiling set by PI and Sponsor)
              <input style={lineInput} value={fields.q41 || ""} onChange={(e) => updateField("q41", e.target.value)} />
            </td></tr>
            <tr><td colSpan={4} style={tdSub}>4.2. - Actual No. of Randomized study subjects
              <input style={lineInput} value={fields.q42 || ""} onChange={(e) => updateField("q42", e.target.value)} />
            </td></tr>
            <tr><td colSpan={4} style={tdSub}>4.3. - No. of Randomized study subjects since the last review/approval
              <input style={lineInput} value={fields.q43 || ""} onChange={(e) => updateField("q43", e.target.value)} />
            </td></tr>
            <tr><td colSpan={4} style={tdSub}>4.4. - Total No. of enrolled patients since study initiation
              <input style={lineInput} value={fields.q44 || ""} onChange={(e) => updateField("q44", e.target.value)} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>5. Have there been any changes in the participant population, recruitment, or selection criteria since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasParticipantChanges"
                    style={radioStyle}
                    checked={fields.hasParticipantChanges === "no"}
                    onChange={() => updateField("hasParticipantChanges", "no")}
                  />
                  5.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasParticipantChanges"
                  style={radioStyle}
                  checked={fields.hasParticipantChanges === "yes"}
                  onChange={() => updateField("hasParticipantChanges", "yes")}
                />
                5.2. - Yes (Explain changes and indicate date/s of Study Protocol Amendment Submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q52 || ""} onChange={(e) => updateField("q52", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>6. Have there been any changes in the informed consent process or documentation since the last review/approval?</strong>
              <span style={smallItalic}> Attach the latest version of the participant information sheet and informed consent form/document</span>
            </td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasConsentChanges"
                    style={radioStyle}
                    checked={fields.hasConsentChanges === "no"}
                    onChange={() => updateField("hasConsentChanges", "no")}
                  />
                  6.1. - No
                </label>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}><tbody><tr><td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 111) • Email Address: rec@uic.edu.ph</td><td style={footerPageCell}>Page 1 of 3</td></tr></tbody></table>
      </div>

      <div style={pageContainer}>
        {renderHeader(fields.controlNo || "", updateControlNos)}

        <table style={table}>
          <tbody>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasConsentChanges"
                  style={radioStyle}
                  checked={fields.hasConsentChanges === "yes"}
                  onChange={() => updateField("hasConsentChanges", "yes")}
                />
                6.2. - Yes (Explain changes and indicate date/s of Study Protocol Amendment Submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q62 || ""} onChange={(e) => updateField("q62", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>7. Has any information appeared in the literature or evolved from this or similar research participants that might affect the REC's evaluation of the risk/benefit assessment of human participants involved in this study protocol?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasLiteratureInfo"
                    style={radioStyle}
                    checked={fields.hasLiteratureInfo === "no"}
                    onChange={() => updateField("hasLiteratureInfo", "no")}
                  />
                  7.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasLiteratureInfo"
                  style={radioStyle}
                  checked={fields.hasLiteratureInfo === "yes"}
                  onChange={() => updateField("hasLiteratureInfo", "yes")}
                />
                7.2. - Yes (Describe briefly and provide copy of the literature cited, including the investigator's brochure if applicable)
              </label>
              <textarea style={lineTextarea} value={fields.q72 || ""} onChange={(e) => updateField("q72", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>8. Have any unexpected discomforts, complications, or side effects been noted since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasUnexpectedEffects"
                    style={radioStyle}
                    checked={fields.hasUnexpectedEffects === "no"}
                    onChange={() => updateField("hasUnexpectedEffects", "no")}
                  />
                  8.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasUnexpectedEffects"
                  style={radioStyle}
                  checked={fields.hasUnexpectedEffects === "yes"}
                  onChange={() => updateField("hasUnexpectedEffects", "yes")}
                />
                8.2. - Yes (Summarize and indicate date/s of SUSAR report submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q82 || ""} onChange={(e) => updateField("q82", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>9. Have any participants withdrawn from this study since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasWithdrawnParticipants"
                    style={radioStyle}
                    checked={fields.hasWithdrawnParticipants === "no"}
                    onChange={() => updateField("hasWithdrawnParticipants", "no")}
                  />
                  9.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasWithdrawnParticipants"
                  style={radioStyle}
                  checked={fields.hasWithdrawnParticipants === "yes"}
                  onChange={() => updateField("hasWithdrawnParticipants", "yes")}
                />
                9.2. - Yes (Explain the context surrounding withdrawal and documenting due diligence exerted by the study team in managing these withdrawals)
              </label>
              <textarea style={lineTextarea} value={fields.q92 || ""} onChange={(e) => updateField("q92", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>10. Have there been any new intervention(s) or methods in the conduct of the study that is/are not in the approved protocol?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasNewInterventions"
                    style={radioStyle}
                    checked={fields.hasNewInterventions === "no"}
                    onChange={() => updateField("hasNewInterventions", "no")}
                  />
                  10.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasNewInterventions"
                  style={radioStyle}
                  checked={fields.hasNewInterventions === "yes"}
                  onChange={() => updateField("hasNewInterventions", "yes")}
                />
                10.2. - Yes (Describe use and indicate date/s of Study Protocol Deviation/Non-Compliance/Violation Report Submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q102 || ""} onChange={(e) => updateField("q102", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>11. Have any investigators been added or deleted since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasInvestigatorChanges"
                    style={radioStyle}
                    checked={fields.hasInvestigatorChanges === "no"}
                    onChange={() => updateField("hasInvestigatorChanges", "no")}
                  />
                  11.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasInvestigatorChanges"
                  style={radioStyle}
                  checked={fields.hasInvestigatorChanges === "yes"}
                  onChange={() => updateField("hasInvestigatorChanges", "yes")}
                />
                11.2. - Yes (Enumerate personnel and indicate date/s of Study Protocol Amendment Submission/s. Append CV if not yet submitted to the UIC REC Review Panel)
              </label>
              <textarea style={lineTextarea} value={fields.q112 || ""} onChange={(e) => updateField("q112", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>12. Have any collaborating sites (institutions) been added or deleted since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasSiteChanges"
                    style={radioStyle}
                    checked={fields.hasSiteChanges === "no"}
                    onChange={() => updateField("hasSiteChanges", "no")}
                  />
                  12.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasSiteChanges"
                  style={radioStyle}
                  checked={fields.hasSiteChanges === "yes"}
                  onChange={() => updateField("hasSiteChanges", "yes")}
                />
                12.2. - Yes (Enumerate sites and indicate date/s of Study Protocol Amendment Submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q122 || ""} onChange={(e) => updateField("q122", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>13. Have any investigators developed an equity or consultative relationship with a party related to this study protocol that might be considered a conflict of interest since the last review/approval?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasConflictOfInterest"
                    style={radioStyle}
                    checked={fields.hasConflictOfInterest === "no"}
                    onChange={() => updateField("hasConflictOfInterest", "no")}
                  />
                  13.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasConflictOfInterest"
                  style={radioStyle}
                  checked={fields.hasConflictOfInterest === "yes"}
                  onChange={() => updateField("hasConflictOfInterest", "yes")}
                />
                13.2. - Yes (Append a statement of disclosure)
              </label>
              <textarea style={lineTextarea} value={fields.q132 || ""} onChange={(e) => updateField("q132", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>14. Have there been changes in study personnel since the last review/approval?</strong></td></tr>
            <tr><td colSpan={4} style={tdSub}>14.1. - None</td></tr>
            <tr><td colSpan={4} style={tdSub}>14.2. - Deleted (Enumerate and indicate date/s of Study Protocol Amendment Submission/s)
              <textarea style={lineTextarea} value={fields.q142 || ""} onChange={(e) => updateField("q142", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>
            <tr><td colSpan={4} style={tdSub}>14.3. - Yes (Enumerate and indicate date/s of Study Protocol Amendment Submission/s)
              <textarea style={lineTextarea} value={fields.q143 || ""} onChange={(e) => updateField("q143", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr><td colSpan={4} style={td}><strong>15. Have there been other changes not mentioned above since the last review/approval? Attach protocol synopsis?</strong></td></tr>
            <tr>
              <td colSpan={4} style={tdSub}>
                <label>
                  <input
                    type="radio"
                    name="hasOtherChanges"
                    style={radioStyle}
                    checked={fields.hasOtherChanges === "no"}
                    onChange={() => updateField("hasOtherChanges", "no")}
                  />
                  15.1. - No
                </label>
              </td>
            </tr>
            <tr><td colSpan={4} style={tdSub}>
              <label>
                <input
                  type="radio"
                  name="hasOtherChanges"
                  style={radioStyle}
                  checked={fields.hasOtherChanges === "yes"}
                  onChange={() => updateField("hasOtherChanges", "yes")}
                />
                15.2. - Yes (Describe changes and indicate date/s of Study Protocol Amendment Submission/s)
              </label>
              <textarea style={lineTextarea} value={fields.q152 || ""} onChange={(e) => updateField("q152", e.target.value)} onInput={autoExpand} rows={1} />
            </td></tr>

            <tr>
              <td colSpan={4} style={td}><strong>Signature of Principal Investigator:</strong>
                <div style={signaturePadWrap}>
                  <SignatureCell
                    value={fields.principalSignature || ""}
                    onChange={(val) => updateField("principalSignature", val)}
                    proposalId={proposalId}
                    formName={formName}
                  />
                </div>
              </td>
            </tr>
            <tr><td colSpan={4} style={td}><strong>Date Signed:</strong>
              <input type="date" style={lineInput} value={fields.dateSigned || ""} onChange={(e) => updateField("dateSigned", e.target.value)} />
            </td></tr>
          </tbody>
        </table>

        <table style={footerTable}><tbody><tr><td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 111) • Email Address: rec@uic.edu.ph</td><td style={footerPageCell}>Page 2 of 3</td></tr></tbody></table>
      </div>

      <div style={pageContainer}>
        {renderHeader(fields.staffControlNo || "", updateControlNos)}

        <table style={table}>
          <tbody>
            <tr>
              <td colSpan={4} style={staffTitleCell}>------------------To be filled by the REC Members------------------</td>
            </tr>
            <tr>
              <td colSpan={4} style={td}><strong>Referred to</strong>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={fields.referredTo === "full-board"} onChange={() => updateField("referredTo", "full-board")} /> Full Board Review by REC</label></div>
                <div style={choiceLine}><label><input type="radio" style={radioStyle} checked={fields.referredTo === "expedited"} onChange={() => updateField("referredTo", "expedited")} /> Expedited Review at the level of REC Chair</label></div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={td}><strong>Is the reason for the delay justifiable?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.delayJustifiable === "yes"} onChange={() => updateField("delayJustifiable", "yes")} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.delayJustifiable === "no"} onChange={() => updateField("delayJustifiable", "no")} />No</label></td>
            </tr>
            <tr>
              <td colSpan={2} style={td}><strong>Is the potential contribution and importance of the research diminished because of the delay?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.contributionDiminished === "yes"} onChange={() => updateField("contributionDiminished", "yes")} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.contributionDiminished === "no"} onChange={() => updateField("contributionDiminished", "no")} />No</label></td>
            </tr>
            <tr>
              <td colSpan={2} style={td}><strong>Will the change in the methodology pose more risks to the participants?</strong></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.methodologyRisks === "yes"} onChange={() => updateField("methodologyRisks", "yes")} />Yes</label></td>
              <td style={yesNoCell}><label><input type="radio" style={radioStyle} checked={fields.methodologyRisks === "no"} onChange={() => updateField("methodologyRisks", "no")} />No</label></td>
            </tr>

            <tr>
              <td colSpan={4} style={tdBig}><strong>Recommended Action:</strong>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={checks.upholdApproval} onChange={() => toggleCheck("upholdApproval")} /> Uphold original approval with no further action</label>
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={checks.requestInformation} onChange={() => toggleCheck("requestInformation")} /> Request information: (indicate information)</label>
                <textarea style={lineTextarea} value={fields.recRequestInfo || ""} onChange={(e) => updateField("recRequestInfo", e.target.value)} onInput={autoExpand} rows={1} />
                <label style={checkLine}><input type="checkbox" style={checkStyle} checked={checks.recommendFurtherAction} onChange={() => toggleCheck("recommendFurtherAction")} /> Recommend further action: (indicate action)</label>
                <textarea style={lineTextarea} value={fields.recFurtherAction || ""} onChange={(e) => updateField("recFurtherAction", e.target.value)} onInput={autoExpand} rows={1} />
              </td>
            </tr>

            {renderReviewerRow("PRIMARY REVIEWER", proposalId, formName, fields, updateField, "r1")}
            {renderReviewerRow("PRIMARY REVIEWER", proposalId, formName, fields, updateField, "r2")}
            {renderReviewerRow("REC CHAIR", proposalId, formName, fields, updateField, "chair")}
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
                  <td style={controlLabelCell}>REC_FO_0023</td>
                </tr>
                <tr>
                  <td style={controlInputCell}>Control No.:
                    <input
                      style={lineInputInline}
                      value={controlNo}
                      onChange={(e) => onControlNoChange(e.target.value)}
                    />
                  </td>
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
  fields: Record<string, string>,
  updateField: (key: string, value: string) => void,
  prefix: string
) {
  return (
    <tr>
      <td colSpan={2} style={reviewerLeftCell}>
        <div style={roleLabel}>{title}</div>
        <div>
          Date:
          <input
            value={fields[`${prefix}Date`] || ""}
            onChange={(e) => updateField(`${prefix}Date`, e.target.value)}
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
              value={fields[`${prefix}Signature`] || ""}
              onChange={(val) => updateField(`${prefix}Signature`, val)}
              proposalId={proposalId}
              formName={formName}
            />
          </div>
        </div>
        <div>
          Name
          <input
            value={fields[`${prefix}Name`] || ""}
            onChange={(e) => updateField(`${prefix}Name`, e.target.value)}
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

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 700,
  fontSize: "22px",
  marginBottom: "14px",
};

const instructionsStyle: React.CSSProperties = {
  marginBottom: "12px",
  lineHeight: 1.35,
  fontStyle: "italic",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  verticalAlign: "top",
};

const tdSub: React.CSSProperties = {
  border: "1px solid black",
  padding: "2px 10px",
  verticalAlign: "top",
};

const tdBig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "64px",
};

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
  width: "58%",
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

const smallItalic: React.CSSProperties = {
  fontSize: "11px",
  fontStyle: "italic",
};

const choiceLine: React.CSSProperties = { marginTop: "4px", marginLeft: "8px" };
const checkLine: React.CSSProperties = { display: "block", marginTop: "6px", marginLeft: "6px" };
const checkStyle: React.CSSProperties = { marginRight: "8px" };
const radioStyle: React.CSSProperties = { marginRight: "6px" };

const staffTitleCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  fontWeight: 700,
};

const yesNoCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  verticalAlign: "middle",
};

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
