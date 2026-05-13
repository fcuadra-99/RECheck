import { useEffect, useState } from "react";
import type { FormProps } from "./FormViewer";
import SignatureCell from "./SignatureCell";
import MemberListInput from "./MemberListInput";

type YesNo = "yes" | "no" | "";
type ReferredTo = "full-board" | "expedited" | "";
type RecommendedAction = "uphold" | "request-info" | "further-action" | "";

export default function EthicsStudyProgressReport({
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
  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? s.protocolCodeValue ?? protocolCode ?? "");
  const [protocolCodeValue, setProtocolCodeValue] = useState<string>(s.protocolCodeValue ?? s.controlNo ?? protocolCode ?? "");
  const [nameResearcher, setNameResearcher] = useState<string>(s.nameResearcher ?? researcherName ?? "");
  const [coResearchers, setCoResearchers] = useState<string[]>(
    s.coResearchers ?? (s.coResearcher ? [s.coResearcher] : [""])
  );
  const [institution, setInstitution] = useState<string>(s.institution ?? "");
  const [studySite, setStudySite] = useState<string>(s.studySite ?? "");
  const [addressInstitution, setAddressInstitution] = useState<string>(s.addressInstitution ?? "");
  const [effectivityEthicalClearance, setEffectivityEthicalClearance] = useState<string>(s.effectivityEthicalClearance ?? "");
  const [contactTel, setContactTel] = useState<string>(s.contactTel ?? "");
  const [contactMobile, setContactMobile] = useState<string>(s.contactMobile ?? "");
  const [contactFax, setContactFax] = useState<string>(s.contactFax ?? "");
  const [contactEmail, setContactEmail] = useState<string>(s.contactEmail ?? "");

  const [startStudy, setStartStudy] = useState<string>(s.startStudy ?? "");
  const [expectedEndStudy, setExpectedEndStudy] = useState<string>(s.expectedEndStudy ?? "");
  const [enrolledParticipants, setEnrolledParticipants] = useState<string>(s.enrolledParticipants ?? "");
  const [requiredParticipants, setRequiredParticipants] = useState<string>(s.requiredParticipants ?? "");
  const [participantsWithdrew, setParticipantsWithdrew] = useState<string>(s.participantsWithdrew ?? "");
  const [deviationsProtocol, setDeviationsProtocol] = useState<string>(s.deviationsProtocol ?? "");
  const [newInformation, setNewInformation] = useState<string>(s.newInformation ?? "");
  const [issuesEncountered, setIssuesEncountered] = useState<string>(s.issuesEncountered ?? "");
  const [accomplishedBy, setAccomplishedBy] = useState<string>(s.accomplishedBy ?? researcherName ?? "");
  const [accomplishedSignature, setAccomplishedSignature] = useState<string>(s.accomplishedSignature ?? "");
  const [accomplishedDate, setAccomplishedDate] = useState<string>(s.accomplishedDate ?? today);

  const [staffControlNo, setStaffControlNo] = useState<string>(
    s.staffControlNo ?? s.controlNo ?? s.protocolCodeValue ?? protocolCode ?? ""
  );
  const [referredTo, setReferredTo] = useState<ReferredTo>(s.referredTo ?? "");
  const [isCompliant, setIsCompliant] = useState<YesNo>(s.isCompliant ?? "");
  const [isRiskMitigated, setIsRiskMitigated] = useState<YesNo>(s.isRiskMitigated ?? "");
  const [isDeviationRisk, setIsDeviationRisk] = useState<YesNo>(s.isDeviationRisk ?? "");
  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction>(s.recommendedAction ?? "");
  const [requestInfoDetails, setRequestInfoDetails] = useState<string>(s.requestInfoDetails ?? "");
  const [furtherActionDetails, setFurtherActionDetails] = useState<string>(s.furtherActionDetails ?? "");

  const [primaryReviewer1Date, setPrimaryReviewer1Date] = useState<string>(s.primaryReviewer1Date ?? "");
  const [primaryReviewer1Signature, setPrimaryReviewer1Signature] = useState<string>(s.primaryReviewer1Signature ?? "");
  const [primaryReviewer1Name, setPrimaryReviewer1Name] = useState<string>(s.primaryReviewer1Name ?? "");

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
    if (!s.protocolCodeValue && s.controlNo) patch.protocolCodeValue = s.controlNo;
    if (!s.protocolCodeValue && s.staffControlNo) patch.protocolCodeValue = s.staffControlNo;
    if (!s.controlNo && s.protocolCodeValue) patch.controlNo = s.protocolCodeValue;
    if (!s.controlNo && s.staffControlNo) patch.controlNo = s.staffControlNo;
    if (!s.protocolCodeValue && protocolCode) patch.protocolCodeValue = protocolCode;
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.staffControlNo && (s.controlNo || s.protocolCodeValue)) {
      patch.staffControlNo = s.controlNo ?? s.protocolCodeValue;
    }
    if (!s.nameResearcher && researcherName) patch.nameResearcher = researcherName;
    if (!s.accomplishedBy && researcherName) patch.accomplishedBy = researcherName;
    if (!s.accomplishedDate) patch.accomplishedDate = today;
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    resizeTextarea(el);
  };

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
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
                      <td style={controlLabelCell}>REC_FO_0019</td>
                    </tr>
                    <tr>
                      <td style={controlInputCell}>
                        Control No.:
                        <input
                          value={controlNo}
                          onChange={(e) => {
                            const value = e.target.value;
                            setControlNo(value);
                            setProtocolCodeValue(value);
                            setStaffControlNo(value);
                            save({ controlNo: value, protocolCodeValue: value, staffControlNo: value });
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

        <div style={formTitle}>Ethics Study Progress Report</div>

        <div style={instructionsText}>
          INSTRUCTIONS TO THE PRINCIPAL INVESTIGATOR: Accomplish a copy of this form and include all information
          required in the space provided. Date and sign this form before submission.
        </div>

        <table style={formTable}>
          <tbody>
            <tr>
              <td colSpan={4} style={sectionHeaderCell}>General Information</td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}>
                <strong>*Title of Study</strong>
                <textarea
                  style={lineTextarea}
                  value={titleOfStudy}
                  onChange={(e) => {
                    setTitleOfStudy(e.target.value);
                    save({ titleOfStudy: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
            </tr>
            <tr>
              <td style={{ ...fieldCell, width: "37%" }}>
                <strong>*Protocol Code</strong>
                <input
                  value={protocolCodeValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProtocolCodeValue(value);
                    setControlNo(value);
                    setStaffControlNo(value);
                    save({ protocolCodeValue: value, controlNo: value, staffControlNo: value });
                  }}
                  style={lineInput}
                />
              </td>
              <td rowSpan={4} style={{ ...labelGrayCell, width: "16%" }}>
                <strong>Contact Information</strong>
              </td>
              <td style={{ ...fieldCell, width: "23%" }}>
                <strong>*Tel No:</strong>
                <input
                  value={contactTel}
                  onChange={(e) => {
                    setContactTel(e.target.value);
                    save({ contactTel: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td style={{ ...fieldCell, width: "24%" }} />
            </tr>
            <tr>
              <td style={fieldCell}>
                <strong>*Name of the Researcher</strong>
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
              <td style={fieldCell}>
                <strong>*Mobile No:</strong>
                <input
                  value={contactMobile}
                  onChange={(e) => {
                    setContactMobile(e.target.value);
                    save({ contactMobile: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td style={fieldCell} />
            </tr>
            <tr>
              <td style={fieldCell}>
                <strong>*Co-researcher (if any)</strong>
                <MemberListInput
                  values={coResearchers}
                  onChange={(values) => {
                    setCoResearchers(values);
                    save({ coResearchers: values, coResearcher: values.filter(Boolean).join(", ") });
                  }}
                  placeholder="Enter co-researcher name"
                />
              </td>
              <td style={fieldCell}>
                <strong>Fax No:</strong>
                <input
                  value={contactFax}
                  onChange={(e) => {
                    setContactFax(e.target.value);
                    save({ contactFax: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td style={fieldCell}>
                <strong>Email:</strong>
                <input
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    save({ contactEmail: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
            </tr>
            <tr>
              <td style={fieldCell}>
                <strong>*Institution</strong>
                <textarea
                  style={lineTextarea}
                  value={institution}
                  onChange={(e) => {
                    setInstitution(e.target.value);
                    save({ institution: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
              <td colSpan={2} style={fieldCell}>
                <strong>*Study Site/s</strong>
                <textarea
                  style={lineTextarea}
                  value={studySite}
                  onChange={(e) => {
                    setStudySite(e.target.value);
                    save({ studySite: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={fieldCell}>
                <strong>*Address of Institution</strong>
                <textarea
                  style={lineTextarea}
                  value={addressInstitution}
                  onChange={(e) => {
                    setAddressInstitution(e.target.value);
                    save({ addressInstitution: e.target.value });
                  }}
                  onInput={autoExpand}
                  rows={1}
                />
              </td>
              <td style={fieldCell} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}>
                <strong>Effectivity Period of Ethical Clearance</strong>
                <input
                  value={effectivityEthicalClearance}
                  onChange={(e) => {
                    setEffectivityEthicalClearance(e.target.value);
                    save({ effectivityEthicalClearance: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={sectionHeaderCell}>Progress Report</td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCellTall}>
                <strong>1. </strong>Start of study
                <input
                  value={startStudy}
                  onChange={(e) => {
                    setStartStudy(e.target.value);
                    save({ startStudy: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td colSpan={2} style={fieldCellTall}>
                <strong>2. </strong>Expected end of study
                <input
                  value={expectedEndStudy}
                  onChange={(e) => {
                    setExpectedEndStudy(e.target.value);
                    save({ expectedEndStudy: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCellTall}>
                <strong>3. </strong>Number of enrolled participants
                <input
                  value={enrolledParticipants}
                  onChange={(e) => {
                    setEnrolledParticipants(e.target.value);
                    save({ enrolledParticipants: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td colSpan={2} style={fieldCellTall}>
                <strong>4. </strong>Number of required participants
                <input
                  value={requiredParticipants}
                  onChange={(e) => {
                    setRequiredParticipants(e.target.value);
                    save({ requiredParticipants: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCellTall}>
                <strong>5. </strong>Number of participants who withdrew
                <input
                  value={participantsWithdrew}
                  onChange={(e) => {
                    setParticipantsWithdrew(e.target.value);
                    save({ participantsWithdrew: e.target.value });
                  }}
                  style={lineInput}
                />
              </td>
              <td colSpan={2} style={fieldCellTall} />
            </tr>
            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>6. </strong>Deviations from the approved protocol
                <textarea
                  style={blockTextarea}
                  value={deviationsProtocol}
                  onChange={(e) => {
                    setDeviationsProtocol(e.target.value);
                    save({ deviationsProtocol: e.target.value });
                  }}
                  onInput={autoExpand}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>7. </strong>New information (literature or in the conduct of the study) that may significantly change the risk-benefit ratio
                <textarea
                  style={blockTextarea}
                  value={newInformation}
                  onChange={(e) => {
                    setNewInformation(e.target.value);
                    save({ newInformation: e.target.value });
                  }}
                  onInput={autoExpand}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>8. </strong>Issues/problems encountered
                <textarea
                  style={blockTextarea}
                  value={issuesEncountered}
                  onChange={(e) => {
                    setIssuesEncountered(e.target.value);
                    save({ issuesEncountered: e.target.value });
                  }}
                  onInput={autoExpand}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={sectionHeaderCell}>Accomplished by:</td>
            </tr>
            <tr>
              <td colSpan={2} style={signatureCell}>
                <input
                  value={accomplishedBy}
                  onChange={(e) => {
                    setAccomplishedBy(e.target.value);
                    save({ accomplishedBy: e.target.value });
                  }}
                  style={signatureLineInput}
                />
                <div style={signaturePadWrap}>
                  <SignatureCell
                    value={accomplishedSignature}
                    onChange={(val) => {
                      setAccomplishedSignature(val);
                      save({ accomplishedSignature: val });
                    }}
                    proposalId={proposalId}
                    formName={formName}
                  />
                </div>
                <div style={signatureCaption}>Name &amp; Signature</div>
              </td>
              <td colSpan={2} style={signatureCell}>
                <input
                  type="date"
                  value={accomplishedDate}
                  onChange={(e) => {
                    setAccomplishedDate(e.target.value);
                    save({ accomplishedDate: e.target.value });
                  }}
                  style={signatureLineInput}
                />
                <div style={signatureCaption}>Date</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerTextCell}>Telephone No. (082) 227-82-86 (loc. 211) • Email Address: rec@uic.edu.ph</td>
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
                      <td style={controlLabelCell}>REC_FO_0019</td>
                    </tr>
                    <tr>
                      <td style={controlInputCell}>
                        Control No.:
                        <input
                          value={staffControlNo}
                          onChange={(e) => {
                            const value = e.target.value;
                            setStaffControlNo(value);
                            setControlNo(value);
                            setProtocolCodeValue(value);
                            save({ staffControlNo: value, controlNo: value, protocolCodeValue: value });
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
              <td colSpan={4} style={staffSectionTitleCell}>-----------------------To be filled by the REC Members-----------------------</td>
            </tr>
            <tr>
              <td colSpan={4} style={fieldCell}>
                <strong>Referred to</strong>
                <table style={inlineChoiceTable}>
                  <tbody>
                    <tr>
                      <td style={choiceLabelCell}>
                        <label>
                          <input
                            type="radio"
                            checked={referredTo === "full-board"}
                            onChange={() => {
                              setReferredTo("full-board");
                              save({ referredTo: "full-board" });
                            }}
                            style={radioStyle}
                          />
                          Full Board Review by REC
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td style={choiceLabelCell}>
                        <label>
                          <input
                            type="radio"
                            checked={referredTo === "expedited"}
                            onChange={() => {
                              setReferredTo("expedited");
                              save({ referredTo: "expedited" });
                            }}
                            style={radioStyle}
                          />
                          Expedited Review at the level of REC Chair
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={fieldCell}>
                Is the conduct of the study in compliance with the approved protocol?
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isCompliant === "yes"}
                    onChange={() => {
                      setIsCompliant("yes");
                      save({ isCompliant: "yes" });
                    }}
                    style={radioStyle}
                  />
                  Yes
                </label>
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isCompliant === "no"}
                    onChange={() => {
                      setIsCompliant("no");
                      save({ isCompliant: "no" });
                    }}
                    style={radioStyle}
                  />
                  No
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}>
                Are the risks/discomfort appropriately mitigated?
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isRiskMitigated === "yes"}
                    onChange={() => {
                      setIsRiskMitigated("yes");
                      save({ isRiskMitigated: "yes" });
                    }}
                    style={radioStyle}
                  />
                  Yes
                </label>
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isRiskMitigated === "no"}
                    onChange={() => {
                      setIsRiskMitigated("no");
                      save({ isRiskMitigated: "no" });
                    }}
                    style={radioStyle}
                  />
                  No
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={fieldCell}>
                Will the deviation pose more risks to the study participants?
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isDeviationRisk === "yes"}
                    onChange={() => {
                      setIsDeviationRisk("yes");
                      save({ isDeviationRisk: "yes" });
                    }}
                    style={radioStyle}
                  />
                  Yes
                </label>
              </td>
              <td style={yesNoCell}>
                <label>
                  <input
                    type="radio"
                    checked={isDeviationRisk === "no"}
                    onChange={() => {
                      setIsDeviationRisk("no");
                      save({ isDeviationRisk: "no" });
                    }}
                    style={radioStyle}
                  />
                  No
                </label>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={fieldCellBig}>
                <strong>Recommended Action:</strong>
                <table style={inlineChoiceTable}>
                  <tbody>
                    <tr>
                      <td style={choiceLabelCell}>
                        <label>
                          <input
                            type="radio"
                            checked={recommendedAction === "uphold"}
                            onChange={() => {
                              setRecommendedAction("uphold");
                              save({ recommendedAction: "uphold" });
                            }}
                            style={radioStyle}
                          />
                          Uphold original approval with no further action
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td style={choiceLabelCell}>
                        <label>
                          <input
                            type="radio"
                            checked={recommendedAction === "request-info"}
                            onChange={() => {
                              setRecommendedAction("request-info");
                              save({ recommendedAction: "request-info" });
                            }}
                            style={radioStyle}
                          />
                          Request information: (indicate information)
                        </label>
                        <textarea
                          style={lineTextarea}
                          value={requestInfoDetails}
                          onChange={(e) => {
                            setRequestInfoDetails(e.target.value);
                            save({ requestInfoDetails: e.target.value });
                          }}
                          onInput={autoExpand}
                          rows={1}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={choiceLabelCell}>
                        <label>
                          <input
                            type="radio"
                            checked={recommendedAction === "further-action"}
                            onChange={() => {
                              setRecommendedAction("further-action");
                              save({ recommendedAction: "further-action" });
                            }}
                            style={radioStyle}
                          />
                          Recommend further action: (indicate action)
                        </label>
                        <textarea
                          style={lineTextarea}
                          value={furtherActionDetails}
                          onChange={(e) => {
                            setFurtherActionDetails(e.target.value);
                            save({ furtherActionDetails: e.target.value });
                          }}
                          onInput={autoExpand}
                          rows={1}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {renderReviewerRow(
              "PRIMARY REVIEWER 1",
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
              "primaryReviewer1Name",
            )}
            {renderReviewerRow(
              "PRIMARY REVIEWER 2",
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
              "primaryReviewer2Name",
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
              "secretariatName",
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
              "recChairName",
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
  nameKey: string,
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

const formTitle: React.CSSProperties = { textAlign: "center", fontSize: "21px", fontWeight: 700, marginBottom: "14px" };

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

const labelGrayCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  verticalAlign: "middle",
  background: "#efefef",
};

const fieldCellTall: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "42px",
};

const fieldCellBig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  minHeight: "60px",
};

const signatureCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px 6px 4px 6px",
  textAlign: "center",
  verticalAlign: "top",
};

const signatureCaption: React.CSSProperties = { fontWeight: 700, marginTop: "4px" };
const signaturePadWrap: React.CSSProperties = { marginTop: "6px", marginBottom: "4px" };

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

const inlineChoiceTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "4px",
};

const choiceLabelCell: React.CSSProperties = { border: "none", padding: "2px 0" };
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
  width: "65%",
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
  minHeight: "26px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  marginTop: "4px",
  background: "transparent",
};

const signatureLineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "2px solid #222",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  textAlign: "center",
  background: "transparent",
};

const footerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "6px",
};

const footerTextCell: React.CSSProperties = { fontSize: "11px", width: "80%" };
const footerPageCell: React.CSSProperties = { fontSize: "11px", width: "20%", textAlign: "right", fontWeight: 700 };
