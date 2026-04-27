import { useState } from "react";
import SignatureCell from "./SignatureCell";

interface FinalReportFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

interface FinalReportState {
  titleOfStudy: string;
  protocolCode: string;
  controlNo: string;
  effectivityPeriod: string;
  placeOfStudy: string;
  researcherName: string;
  researcherNames: string[];
  telNo: string;
  mobileNo: string;
  faxNo: string;
  email: string;
  adviserName: string;
  institution: string;
  affiliation: string;
  startStudy: string;
  endStudy: string;
  enrolledParticipants: string;
  requiredParticipants: string;
  participantsWithdrawn: string;
  violationsApprovedProtocol: string;
  deviationsApprovedProtocol: string;
  issuesProblemsEncountered: string;
  summaryFindings: string;
  conclusions: string;
  actionsDissemination: string;
  researcherSignature: string;
  researcherSignatureName: string;
  researcherSignatureLine: string;
  formDate: string;
  knowledgeGained: "" | "yes" | "no";
  recommendedActionNote1: string;
  recommendedActionNote2: string;
  recommendedActionNote3: string;
  referredFullBoard: boolean;
  referredExpedited: boolean;
  implementedBasedOnProtocol: "" | "yes" | "no";
  primaryReviewer1Date: string;
  primaryReviewer1SignatureDraw: string;
  primaryReviewer1Signature: string;
  primaryReviewer1Name: string;
  primaryReviewer2Date: string;
  primaryReviewer2SignatureDraw: string;
  primaryReviewer2Signature: string;
  primaryReviewer2Name: string;
  secretariatDate: string;
  secretariatSignatureDraw: string;
  secretariatSignature: string;
  secretariatName: string;
  recChairDate: string;
  recChairSignatureDraw: string;
  recChairSignature: string;
  recChairName: string;
}

const DEFAULT_STATE: FinalReportState = {
  titleOfStudy: "",
  protocolCode: "",
  controlNo: "",
  effectivityPeriod: "",
  placeOfStudy: "",
  researcherName: "",
  researcherNames: [""],
  telNo: "",
  mobileNo: "",
  faxNo: "",
  email: "",
  adviserName: "",
  institution: "",
  affiliation: "",
  startStudy: "",
  endStudy: "",
  enrolledParticipants: "",
  requiredParticipants: "",
  participantsWithdrawn: "",
  violationsApprovedProtocol: "",
  deviationsApprovedProtocol: "",
  issuesProblemsEncountered: "",
  summaryFindings: "",
  conclusions: "",
  actionsDissemination: "",
  researcherSignature: "",
  researcherSignatureName: "",
  researcherSignatureLine: "",
  formDate: "",
  knowledgeGained: "",
  recommendedActionNote1: "Uphold original approval with no further action",
  recommendedActionNote2: "Request information:",
  recommendedActionNote3: "Recommend further action:",
  referredFullBoard: false,
  referredExpedited: false,
  implementedBasedOnProtocol: "",
  primaryReviewer1Date: "",
  primaryReviewer1SignatureDraw: "",
  primaryReviewer1Signature: "",
  primaryReviewer1Name: "",
  primaryReviewer2Date: "",
  primaryReviewer2SignatureDraw: "",
  primaryReviewer2Signature: "",
  primaryReviewer2Name: "",
  secretariatDate: "",
  secretariatSignatureDraw: "",
  secretariatSignature: "",
  secretariatName: "",
  recChairDate: "",
  recChairSignatureDraw: "",
  recChairSignature: "",
  recChairName: "",
};

export default function FinalReportForm({ savedData = {}, onSave }: FinalReportFormProps) {
  const initialResearcherNames =
    Array.isArray(savedData.researcherNames) && savedData.researcherNames.length > 0
      ? (savedData.researcherNames as string[])
      : [savedData.researcherName ?? ""];

  const [form, setForm] = useState<FinalReportState>({
    ...DEFAULT_STATE,
    ...savedData,
    researcherNames: initialResearcherNames,
    researcherName: savedData.researcherName ?? initialResearcherNames[0] ?? "",
  });

  const savePatch = (patch: Partial<FinalReportState>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onSave?.({ ...patch, form: next });
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const updateResearcherName = (index: number, value: string) => {
    const nextResearcherNames = [...form.researcherNames];
    nextResearcherNames[index] = value;
    savePatch({
      researcherNames: nextResearcherNames,
      researcherName: nextResearcherNames[0] ?? "",
    });
  };

  const addResearcherName = () => {
    const nextResearcherNames = [...form.researcherNames, ""];
    savePatch({ researcherNames: nextResearcherNames });
  };

  const removeResearcherName = (index: number) => {
    if (form.researcherNames.length === 1) return;
    const nextResearcherNames = form.researcherNames.filter((_, i) => i !== index);
    savePatch({
      researcherNames: nextResearcherNames,
      researcherName: nextResearcherNames[0] ?? "",
    });
  };

  return (
    <div>
      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={logoCell}>
                <img src="/logoo.png" alt="UIC" style={logoImage} />
              </td>
              <td style={headerInfoCell}>
                <div style={headerUniversity}>University of the Immaculate Conception</div>
                <div style={headerCommittee}>Research Ethics Committee</div>
                <div style={headerAddress}>Bonifacio Street, Davao City, Philippines</div>
              </td>
              <td style={controlBoxCell}>
                <table style={controlTable}>
                  <tbody>
                    <tr>
                      <td style={controlTop}>REC_FO_0025</td>
                    </tr>
                    <tr>
                      <td style={controlBottom}>
                        Control No.: <input style={miniLineInput} value={form.controlNo} onChange={(e) => savePatch({ controlNo: e.target.value })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={titleCell}>FINAL REPORT FORM</td>
            </tr>
          </tbody>
        </table>

        <table style={mainTable}>
          <tbody>
            <tr>
              <td style={labelCell}>Title of Study</td>
              <td colSpan={4} style={valueCell}>
                <textarea
                  rows={1}
                  style={lineTextareaInput}
                  value={form.titleOfStudy}
                  onChange={(e) => savePatch({ titleOfStudy: e.target.value })}
                  onInput={autoExpand}
                />
              </td>
            </tr>
            <tr>
              <td style={labelCell}>Protocol Code</td>
              <td colSpan={4} style={valueCell}><input style={lineInput} value={form.protocolCode} onChange={(e) => savePatch({ protocolCode: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Effectivity Period of Ethical Clearance</td>
              <td style={valueCell}><input style={lineInput} value={form.effectivityPeriod} onChange={(e) => savePatch({ effectivityPeriod: e.target.value })} /></td>
              <td style={labelCell}>Place of Study</td>
              <td colSpan={2} style={valueCell}><input style={lineInput} value={form.placeOfStudy} onChange={(e) => savePatch({ placeOfStudy: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Name of Researcher/s</td>
              <td style={valueCell}>
                <table style={dynamicListTable}>
                  <tbody>
                    {form.researcherNames.map((name, index) => (
                      <tr key={`researcher-${index}`}>
                        <td style={dynamicListInputCell}>
                          <textarea
                            rows={1}
                            style={lineTextareaInput}
                            value={name}
                            onChange={(e) => updateResearcherName(index, e.target.value)}
                            onInput={autoExpand}
                          />
                        </td>
                        <td style={dynamicListActionCell}>
                          <button type="button" style={smallAddButton} onClick={addResearcherName}>+</button>
                          {form.researcherNames.length > 1 && (
                            <button type="button" style={smallRemoveButton} onClick={() => removeResearcherName(index)}>-</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td style={labelCell}>Contact Information</td>
              <td style={subLabelCell}>Tel No:</td>
              <td style={valueCell}><input style={lineInput} value={form.telNo} onChange={(e) => savePatch({ telNo: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Name of Adviser</td>
              <td style={valueCell}><input style={lineInput} value={form.adviserName} onChange={(e) => savePatch({ adviserName: e.target.value })} /></td>
              <td style={labelCell}></td>
              <td style={subLabelCell}>Mobile No:</td>
              <td style={valueCell}><input style={lineInput} value={form.mobileNo} onChange={(e) => savePatch({ mobileNo: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Institution of the Researcher</td>
              <td style={valueCell}>
                <textarea
                  rows={1}
                  style={lineTextareaInput}
                  value={form.institution}
                  onChange={(e) => savePatch({ institution: e.target.value })}
                  onInput={autoExpand}
                />
              </td>
              <td style={labelCell}></td>
              <td style={subLabelCell}>Fax No:</td>
              <td style={valueCell}><input style={lineInput} value={form.faxNo} onChange={(e) => savePatch({ faxNo: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={labelCell}>Affiliation of the Researcher</td>
              <td style={valueCell}>
                <textarea
                  rows={1}
                  style={lineTextareaInput}
                  value={form.affiliation}
                  onChange={(e) => savePatch({ affiliation: e.target.value })}
                  onInput={autoExpand}
                />
              </td>
              <td style={labelCell}></td>
              <td style={subLabelCell}>Email:</td>
              <td style={valueCell}><input style={lineInput} value={form.email} onChange={(e) => savePatch({ email: e.target.value })} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}><strong>1. Start of Study:</strong> <input style={inlineLineInput} value={form.startStudy} onChange={(e) => savePatch({ startStudy: e.target.value })} /></td>
              <td colSpan={3} style={valueCell}><strong>2. End of Study:</strong> <input style={inlineLineInput} value={form.endStudy} onChange={(e) => savePatch({ endStudy: e.target.value })} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}><strong>3. Number of Enrolled Participants:</strong> <input style={inlineLineInput} value={form.enrolledParticipants} onChange={(e) => savePatch({ enrolledParticipants: e.target.value })} /></td>
              <td colSpan={3} style={valueCell}><strong>4. Number of Required Participants:</strong> <input style={inlineLineInput} value={form.requiredParticipants} onChange={(e) => savePatch({ requiredParticipants: e.target.value })} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}><strong>5. Number of participants who withdrew:</strong> <input style={inlineLineInput} value={form.participantsWithdrawn} onChange={(e) => savePatch({ participantsWithdrawn: e.target.value })} /></td>
              <td colSpan={3} style={valueCell}><strong>6. Violations from the Approved Protocol</strong> <input style={inlineLineInput} value={form.violationsApprovedProtocol} onChange={(e) => savePatch({ violationsApprovedProtocol: e.target.value })} /></td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}><strong>7. Deviations from the Approved Protocol:</strong> <input style={inlineLineInput} value={form.deviationsApprovedProtocol} onChange={(e) => savePatch({ deviationsApprovedProtocol: e.target.value })} /></td>
              <td colSpan={3} style={valueCell}><strong>8. issues/Problems Encountered:</strong> <input style={inlineLineInput} value={form.issuesProblemsEncountered} onChange={(e) => savePatch({ issuesProblemsEncountered: e.target.value })} /></td>
            </tr>
            <tr>
              <td colSpan={5} style={bigCell}>
                <strong>9. Summary of Findings:</strong>
                <textarea rows={4} style={bigTextarea} value={form.summaryFindings} onChange={(e) => savePatch({ summaryFindings: e.target.value })} onInput={autoExpand} />
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={bigCell}>
                <strong>10. Conclusions:</strong>
                <textarea rows={3} style={bigTextarea} value={form.conclusions} onChange={(e) => savePatch({ conclusions: e.target.value })} onInput={autoExpand} />
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={bigCell}>
                <strong>11. Actions for Dissemination of Study Results:</strong>
                <textarea rows={3} style={bigTextarea} value={form.actionsDissemination} onChange={(e) => savePatch({ actionsDissemination: e.target.value })} onInput={autoExpand} />
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={valueCell}>
                <strong>Signature of Researcher:</strong>
                <div style={signatureDrawWrap}>
                  <SignatureCell value={form.researcherSignature} onChange={(val) => savePatch({ researcherSignature: val })} />
                </div>
                <input style={lineInput} value={form.researcherSignatureLine} onChange={(e) => savePatch({ researcherSignatureLine: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}><strong>Date:</strong> <input style={inlineLineInput} value={form.formDate} onChange={(e) => savePatch({ formDate: e.target.value })} /></td>
              <td colSpan={3} style={centerHeaderCell}>----------------To be filled by the REC Members----------------</td>
            </tr>
            <tr>
              <td colSpan={5} style={valueCell}><strong>Referred to</strong></td>
            </tr>
            <tr>
              <td colSpan={5} style={valueCell}>
                <label style={checkboxLabel}><input type="checkbox" checked={form.referredFullBoard} onChange={(e) => savePatch({ referredFullBoard: e.target.checked })} /> Full Board Review by REC</label>
                <label style={checkboxLabel}><input type="checkbox" checked={form.referredExpedited} onChange={(e) => savePatch({ referredExpedited: e.target.checked })} /> Expedited Review at the level of REC Chair</label>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={valueCell}>
                <strong>Is the implementation of the study based on the approved protocol?</strong>
                <label style={inlineRadio}><input type="radio" name="implementedBasedOnProtocol" checked={form.implementedBasedOnProtocol === "yes"} onChange={() => savePatch({ implementedBasedOnProtocol: "yes" })} /> Yes</label>
                <label style={inlineRadio}><input type="radio" name="implementedBasedOnProtocol" checked={form.implementedBasedOnProtocol === "no"} onChange={() => savePatch({ implementedBasedOnProtocol: "no" })} /> No</label>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={footerTable}>
          <tbody>
            <tr>
              <td style={footerCell}>Telephone No. (082) 227-28-26 (loc. 211)  •  Email Address: rec@uic.edu.ph</td>
              <td style={footerPageCell}>Page 1 of 2</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={logoCell}><img src="/logoo.png" alt="UIC" style={logoImage} /></td>
              <td style={headerInfoCell}>
                <div style={headerUniversity}>University of the Immaculate Conception</div>
                <div style={headerCommittee}>Research Ethics Committee</div>
                <div style={headerAddress}>Bonifacio Street, Davao City, Philippines</div>
              </td>
              <td style={controlBoxCell}>
                <table style={controlTable}>
                  <tbody>
                    <tr>
                      <td style={controlTop}>REC_FO_0025</td>
                    </tr>
                    <tr>
                      <td style={controlBottom}>Control No.: <input style={miniLineInput} value={form.controlNo} onChange={(e) => savePatch({ controlNo: e.target.value })} /></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={mainTable}>
          <tbody>
            <tr>
              <td colSpan={2} style={valueCell}>
                <strong>Is there knowledge gained from the study?</strong>
                <label style={inlineRadio}><input type="radio" name="knowledgeGained" checked={form.knowledgeGained === "yes"} onChange={() => savePatch({ knowledgeGained: "yes" })} /> Yes</label>
                <label style={inlineRadio}><input type="radio" name="knowledgeGained" checked={form.knowledgeGained === "no"} onChange={() => savePatch({ knowledgeGained: "no" })} /> No</label>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={sectionHeaderCell}>Recommended Action:</td>
            </tr>
            <tr>
              <td colSpan={2} style={valueCell}>
                <div style={bulletLine}>• <textarea rows={1} style={inlineTextarea} value={form.recommendedActionNote1} onChange={(e) => savePatch({ recommendedActionNote1: e.target.value })} onInput={autoExpand} /></div>
                <div style={bulletLine}>• <textarea rows={1} style={inlineTextarea} value={form.recommendedActionNote2} onChange={(e) => savePatch({ recommendedActionNote2: e.target.value })} onInput={autoExpand} /></div>
                <div style={bulletLine}>• <textarea rows={1} style={inlineTextarea} value={form.recommendedActionNote3} onChange={(e) => savePatch({ recommendedActionNote3: e.target.value })} onInput={autoExpand} /></div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={signatureTable}>
          <tbody>
            <tr>
              <td style={sigLabelCell}><strong>PRIMARY REVIEWER 1</strong></td>
              <td style={sigValueCell}>
                Signature
                <div style={signatureDrawWrap}>
                  <SignatureCell value={form.primaryReviewer1SignatureDraw} onChange={(val) => savePatch({ primaryReviewer1SignatureDraw: val })} />
                </div>
                <input style={lineInput} value={form.primaryReviewer1Signature} onChange={(e) => savePatch({ primaryReviewer1Signature: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td style={sigLabelCell}>Date: <input style={inlineLineInput} value={form.primaryReviewer1Date} onChange={(e) => savePatch({ primaryReviewer1Date: e.target.value })} /></td>
              <td style={sigValueCell}>Name <input style={lineInput} value={form.primaryReviewer1Name} onChange={(e) => savePatch({ primaryReviewer1Name: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={sigLabelCell}><strong>PRIMARY REVIEWER 2</strong></td>
              <td style={sigValueCell}>
                Signature
                <div style={signatureDrawWrap}>
                  <SignatureCell value={form.primaryReviewer2SignatureDraw} onChange={(val) => savePatch({ primaryReviewer2SignatureDraw: val })} />
                </div>
                <input style={lineInput} value={form.primaryReviewer2Signature} onChange={(e) => savePatch({ primaryReviewer2Signature: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td style={sigLabelCell}>Date: <input style={inlineLineInput} value={form.primaryReviewer2Date} onChange={(e) => savePatch({ primaryReviewer2Date: e.target.value })} /></td>
              <td style={sigValueCell}>Name <input style={lineInput} value={form.primaryReviewer2Name} onChange={(e) => savePatch({ primaryReviewer2Name: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={sigLabelCell}><strong>SECRETARIAT STAFF</strong></td>
              <td style={sigValueCell}>
                Signature
                <div style={signatureDrawWrap}>
                  <SignatureCell value={form.secretariatSignatureDraw} onChange={(val) => savePatch({ secretariatSignatureDraw: val })} />
                </div>
                <input style={lineInput} value={form.secretariatSignature} onChange={(e) => savePatch({ secretariatSignature: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td style={sigLabelCell}>Date: <input style={inlineLineInput} value={form.secretariatDate} onChange={(e) => savePatch({ secretariatDate: e.target.value })} /></td>
              <td style={sigValueCell}>Name <input style={lineInput} value={form.secretariatName} onChange={(e) => savePatch({ secretariatName: e.target.value })} /></td>
            </tr>
            <tr>
              <td style={sigLabelCell}><strong>REC CHAIR</strong></td>
              <td style={sigValueCell}>
                Signature
                <div style={signatureDrawWrap}>
                  <SignatureCell value={form.recChairSignatureDraw} onChange={(val) => savePatch({ recChairSignatureDraw: val })} />
                </div>
                <input style={lineInput} value={form.recChairSignature} onChange={(e) => savePatch({ recChairSignature: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td style={sigLabelCell}>Date: <input style={inlineLineInput} value={form.recChairDate} onChange={(e) => savePatch({ recChairDate: e.target.value })} /></td>
              <td style={sigValueCell}>Name <input style={lineInput} value={form.recChairName} onChange={(e) => savePatch({ recChairName: e.target.value })} /></td>
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
  background: "white",
  boxSizing: "border-box",
  fontFamily: "Segoe UI, Tahoma, sans-serif",
  fontSize: "12px",
  color: "#000",
};

const headerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "8px",
};

const logoCell: React.CSSProperties = {
  border: "1px solid transparent",
  width: "14%",
  verticalAlign: "top",
  textAlign: "center",
  padding: "2px",
};

const logoImage: React.CSSProperties = {
  width: "55px",
  height: "55px",
  objectFit: "contain",
};

const headerInfoCell: React.CSSProperties = {
  border: "1px solid transparent",
  width: "56%",
  verticalAlign: "top",
  padding: "2px 4px",
};

const headerUniversity: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "16px",
  lineHeight: 1.2,
};

const headerCommittee: React.CSSProperties = {
  fontStyle: "italic",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: 1.2,
};

const headerAddress: React.CSSProperties = {
  fontSize: "13px",
};

const controlBoxCell: React.CSSProperties = {
  border: "1px solid transparent",
  width: "30%",
  verticalAlign: "top",
  padding: "2px",
};

const controlTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const controlTop: React.CSSProperties = {
  border: "1px solid #3b82f6",
  padding: "4px",
  textAlign: "center",
  fontSize: "11px",
};

const controlBottom: React.CSSProperties = {
  border: "1px solid #3b82f6",
  borderTop: "none",
  padding: "4px",
  fontSize: "11px",
};

const miniLineInput: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  width: "60%",
  fontSize: "11px",
  background: "transparent",
};

const titleCell: React.CSSProperties = {
  border: "1px solid transparent",
  textAlign: "center",
  fontWeight: 700,
  fontSize: "22px",
  padding: "8px 0",
};

const mainTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "8px",
};

const labelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  verticalAlign: "middle",
  width: "22%",
};

const subLabelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  verticalAlign: "middle",
  width: "14%",
};

const valueCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const centerHeaderCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  fontWeight: 700,
};

const sectionHeaderCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  background: "#f5f5f5",
};

const bigCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  height: "80px",
  verticalAlign: "top",
};

const lineInput: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  width: "100%",
  fontSize: "12px",
  background: "transparent",
  fontFamily: "inherit",
};

const lineTextareaInput: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  width: "100%",
  fontSize: "12px",
  background: "transparent",
  fontFamily: "inherit",
  resize: "none",
  overflow: "hidden",
  lineHeight: 1.3,
};

const inlineLineInput: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  width: "45%",
  marginLeft: "6px",
  fontSize: "12px",
  background: "transparent",
  fontFamily: "inherit",
};

const bigTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  marginTop: "4px",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.35,
  background: "transparent",
};

const inlineTextarea: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  width: "95%",
  resize: "none",
  overflow: "hidden",
  fontSize: "12px",
  lineHeight: 1.35,
  fontFamily: "inherit",
  background: "transparent",
};

const checkboxLabel: React.CSSProperties = {
  marginRight: "20px",
  display: "inline-block",
};

const inlineRadio: React.CSSProperties = {
  marginLeft: "14px",
  display: "inline-block",
};

const footerTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const footerCell: React.CSSProperties = {
  border: "1px solid transparent",
  padding: "4px",
  fontSize: "11px",
  textAlign: "center",
  width: "80%",
};

const footerPageCell: React.CSSProperties = {
  border: "1px solid transparent",
  padding: "4px",
  fontSize: "11px",
  textAlign: "right",
  width: "20%",
  fontWeight: 700,
};

const bulletLine: React.CSSProperties = {
  marginBottom: "6px",
  whiteSpace: "nowrap",
};

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const sigLabelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "35%",
};

const sigValueCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  width: "65%",
};

const signatureDrawWrap: React.CSSProperties = {
  marginTop: "6px",
  marginBottom: "6px",
  maxWidth: "320px",
};

const dynamicListTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const dynamicListInputCell: React.CSSProperties = {
  border: "none",
  padding: "0 6px 4px 0",
};

const dynamicListActionCell: React.CSSProperties = {
  border: "none",
  width: "72px",
  verticalAlign: "top",
  padding: "0 0 4px 0",
};

const smallAddButton: React.CSSProperties = {
  width: "30px",
  height: "24px",
  border: "1px solid #16a34a",
  borderRadius: "4px",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 700,
  cursor: "pointer",
  marginRight: "6px",
};

const smallRemoveButton: React.CSSProperties = {
  width: "30px",
  height: "24px",
  border: "1px solid #dc2626",
  borderRadius: "4px",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 700,
  cursor: "pointer",
};
