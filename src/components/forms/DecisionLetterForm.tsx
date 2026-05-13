import { useState } from "react";
import SignatureCell from "./SignatureCell";

interface DecisionLetterFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

export default function DecisionLetterForm({ savedData = {}, onSave }: DecisionLetterFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    date: s.date ?? "",
    researcherName: s.researcherName ?? "",
    institutionLine1: s.institutionLine1 ?? "University of the Immaculate Conception",
    institutionLine2: s.institutionLine2 ?? "Bonifacio St., Davao City",
    re: s.re ?? "",
    protocolCode: s.protocolCode ?? "",
    subject: s.subject ?? "Research Ethics Review",
    dearName: s.dearName ?? "",
    requestDate: s.requestDate ?? "",
    reviewType: s.reviewType ?? "",
    reviewDate: s.reviewDate ?? "",
    proposalSummary: s.proposalSummary ?? "Overall, the study has evidence of scientific soundness...",
    informedConsentSummary: s.informedConsentSummary ?? "Generally, the ICF is adequately written.",
    finalAdviceLine: s.finalAdviceLine ?? "",
    noteDeadlineDate: s.noteDeadlineDate ?? "",
    noteTurnaroundDays: s.noteTurnaroundDays ?? "25",
    noteCaseDate: s.noteCaseDate ?? "",
    chairName: s.chairName ?? "Mona L. Laya, PhD",
    chairTitle: s.chairTitle ?? "Chair, UIC-REC",
    signedDate: s.signedDate ?? "",
  });

  const [chairSignature, setChairSignature] = useState<string>(s.chairSignature ?? "");

  const [supportingDocs, setSupportingDocs] = useState<string[]>(
    Array.isArray(s.supportingDocs) && s.supportingDocs.length > 0
      ? s.supportingDocs
      : ["Letter of endorsement for ethics review"]
  );

  const [respondentFindings, setRespondentFindings] = useState<string[]>(
    Array.isArray(s.respondentFindings) && s.respondentFindings.length > 0 ? s.respondentFindings : [""]
  );

  const [dataCollectionFindings, setDataCollectionFindings] = useState<string[]>(
    Array.isArray(s.dataCollectionFindings) && s.dataCollectionFindings.length > 0 ? s.dataCollectionFindings : [""]
  );

  const revisionTargets = Array.isArray(s.revisionTargets)
    ? s.revisionTargets.filter(Boolean)
    : [];

  const [proposalRows, setProposalRows] = useState<Array<{ section: string; satisfactory: boolean; notSatisfactory: boolean }>>(
    Array.isArray(s.proposalRows) && s.proposalRows.length > 0
      ? s.proposalRows
      : [
          { section: "Design", satisfactory: false, notSatisfactory: false },
          { section: "Locale/respondents/respondents/Sampling Technique", satisfactory: false, notSatisfactory: false },
          { section: "Research Instruments/Validity", satisfactory: false, notSatisfactory: false },
          { section: "Data Collection", satisfactory: false, notSatisfactory: false },
          { section: "Data Analysis", satisfactory: false, notSatisfactory: false },
          { section: "Ethical Considerations", satisfactory: false, notSatisfactory: false },
          { section: "References", satisfactory: false, notSatisfactory: false },
        ]
  );

  const [icfRows, setIcfRows] = useState<Array<{ section: string; recommendation: string }>>(
    Array.isArray(s.icfRows) && s.icfRows.length > 0
      ? s.icfRows
      : [
          { section: "INTRODUCTION", recommendation: "" },
          { section: "PURPOSE OF THE STUDY", recommendation: "" },
          { section: "STUDY PROCEDURES", recommendation: "" },
          { section: "POTENTIAL RISKS AND DISCOMFORTS", recommendation: "" },
          { section: "REIMBURSEMENT AND COMPENSATION", recommendation: "" },
          { section: "POTENTIAL BENEFITS To respondents and TO SOCIETY", recommendation: "" },
          { section: "DATA PRIVACY AND CONFIDENTIALITY", recommendation: "" },
          { section: "VOLUNTARINESS OF PARTICIPATION AND RIGHTS TO WITHDRAW FROM THE RESEARCH", recommendation: "" },
          { section: "INVESTIGATOR'S and ADVISER'S CONTACT INFORMATION", recommendation: "" },
          { section: "RIGHTS OF RESEARCH PARTICIPANT", recommendation: "" },
        ]
  );

  const setField = (key: string, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ [key]: value, fields: next });
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const updateDynamicList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    key: "supportingDocs" | "respondentFindings" | "dataCollectionFindings",
    index: number,
    value: string
  ) => {
    const next = [...list];
    next[index] = value;
    setList(next);
    save({ [key]: next });
  };

  const addDynamicListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    key: "supportingDocs" | "respondentFindings" | "dataCollectionFindings"
  ) => {
    const next = [...list, ""];
    setList(next);
    save({ [key]: next });
  };

  const removeDynamicListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    key: "supportingDocs" | "respondentFindings" | "dataCollectionFindings",
    index: number
  ) => {
    if (list.length === 1) return;
    const next = list.filter((_, i) => i !== index);
    setList(next);
    save({ [key]: next });
  };

  const updateProposalRow = (index: number, patch: Partial<{ section: string; satisfactory: boolean; notSatisfactory: boolean }>) => {
    const next = proposalRows.map((row, i) => {
      if (i !== index) return row;
      const merged = { ...row, ...patch };
      if (patch.satisfactory) merged.notSatisfactory = false;
      if (patch.notSatisfactory) merged.satisfactory = false;
      return merged;
    });
    setProposalRows(next);
    save({ proposalRows: next });
  };

  const updateIcfRow = (index: number, value: string) => {
    const next = icfRows.map((row, i) => (i === index ? { ...row, recommendation: value } : row));
    setIcfRows(next);
    save({ icfRows: next });
  };

  return (
    <div>
      <div style={pageContainer}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={logoCell}><img src="/logoo.png" alt="UIC" style={logoImage} /></td>
              <td style={headerTitleCell}>University of the Immaculate Conception-Research Ethics Committee</td>
            </tr>
            <tr>
              <td colSpan={2} style={formTitleCell}>DECISION LETTER</td>
            </tr>
          </tbody>
        </table>

        <table style={formTable}>
          <tbody>
            <tr>
              <td style={td}>
                <strong>Date:</strong>
                <input style={lineInput} value={fields.date} onChange={(e) => setField("date", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <strong>Researchers Name:</strong>
                <textarea style={lineTextarea} rows={1} value={fields.researcherName} onChange={(e) => setField("researcherName", e.target.value)} onInput={autoExpand} />
                <textarea style={lineTextarea} rows={1} value={fields.institutionLine1} onChange={(e) => setField("institutionLine1", e.target.value)} onInput={autoExpand} />
                <textarea style={lineTextarea} rows={1} value={fields.institutionLine2} onChange={(e) => setField("institutionLine2", e.target.value)} onInput={autoExpand} />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <strong>Re:</strong>
                <input style={lineInput} value={fields.re} onChange={(e) => setField("re", e.target.value)} />
              </td>
            </tr>
            <tr>
              <td style={td}><strong>Protocol Code:</strong><input style={lineInput} value={fields.protocolCode} onChange={(e) => setField("protocolCode", e.target.value)} /></td>
            </tr>
            <tr>
              <td style={td}><strong>Subject:</strong><input style={lineInput} value={fields.subject} onChange={(e) => setField("subject", e.target.value)} /></td>
            </tr>
            <tr>
              <td style={td}><strong>Dear</strong><input style={lineInputShort} value={fields.dearName} onChange={(e) => setField("dearName", e.target.value)} />:</td>
            </tr>
            <tr>
              <td style={td}>
                <div style={paragraph}>
                  This is to acknowledge receipt of your request and the following supporting documents on
                  <input style={inlineInput} value={fields.requestDate} onChange={(e) => setField("requestDate", e.target.value)} />
                </div>
              </td>
            </tr>
            <tr>
              <td style={td}>
                <table style={bulletTable}>
                  <tbody>
                    {supportingDocs.map((item, idx) => (
                      <tr key={`support-${idx}`}>
                        <td style={bulletSymbolCell}>•</td>
                        <td style={bulletInputCell}>
                          <textarea
                            rows={1}
                            style={lineTextarea}
                            value={item}
                            onChange={(e) => updateDynamicList(supportingDocs, setSupportingDocs, "supportingDocs", idx, e.target.value)}
                            onInput={autoExpand}
                          />
                        </td>
                        <td style={bulletActionCell}>
                          <button type="button" style={smallAddButton} onClick={() => addDynamicListItem(supportingDocs, setSupportingDocs, "supportingDocs")}>+</button>
                          {supportingDocs.length > 1 && (
                            <button type="button" style={smallRemoveButton} onClick={() => removeDynamicListItem(supportingDocs, setSupportingDocs, "supportingDocs", idx)}>-</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            {revisionTargets.length > 0 && (
              <tr>
                <td style={td}>
                  <strong>Documents requested for revision:</strong>
                  <table style={bulletTable}>
                    <tbody>
                      {revisionTargets.map((item, idx) => (
                        <tr key={`revision-${idx}`}>
                          <td style={bulletSymbolCell}>•</td>
                          <td style={bulletInputCell}>
                            <div>{item}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
            <tr>
              <td style={td}>
                <div style={paragraph}>
                  The above documents underwent
                  <input style={inlineInput} value={fields.reviewType} onChange={(e) => setField("reviewType", e.target.value)} />
                  review on
                  <input style={inlineInput} value={fields.reviewDate} onChange={(e) => setField("reviewDate", e.target.value)} />,
                  which generated the following:
                </div>
              </td>
            </tr>
            <tr><td style={sectionHeaderCell}>RECOMMENDATIONS</td></tr>
            <tr><td style={td}><strong>On the Proposal</strong></td></tr>
            <tr>
              <td style={td}>
                <textarea
                  rows={2}
                  style={lineTextarea}
                  value={fields.proposalSummary}
                  onChange={(e) => setField("proposalSummary", e.target.value)}
                  onInput={autoExpand}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table style={checkTable}>
          <tbody>
            <tr>
              <td style={checkHeaderLeft}>Parts</td>
              <td style={checkHeader}>Satisfactorily</td>
              <td style={checkHeader}>Not Satisfactorily</td>
            </tr>
            {proposalRows.map((row, idx) => (
              <tr key={row.section + idx}>
                <td style={checkPartCell}>{row.section}</td>
                <td style={checkMarkCell}>
                  <input type="checkbox" checked={row.satisfactory} onChange={(e) => updateProposalRow(idx, { satisfactory: e.target.checked })} />
                </td>
                <td style={checkMarkCell}>
                  <input type="checkbox" checked={row.notSatisfactory} onChange={(e) => updateProposalRow(idx, { notSatisfactory: e.target.checked })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={formTable}>
          <tbody>
            <tr>
              <td style={td}><strong>Comments:</strong></td>
            </tr>
            <tr>
              <td style={td}>
                <strong>In the Research respondents,</strong>
                <table style={bulletTable}>
                  <tbody>
                    {respondentFindings.map((item, idx) => (
                      <tr key={`respondent-${idx}`}>
                        <td style={bulletSymbolCell}>•</td>
                        <td style={bulletInputCell}>
                          <textarea
                            rows={1}
                            style={lineTextarea}
                            value={item}
                            onChange={(e) => updateDynamicList(respondentFindings, setRespondentFindings, "respondentFindings", idx, e.target.value)}
                            onInput={autoExpand}
                          />
                        </td>
                        <td style={bulletActionCell}>
                          <button type="button" style={smallAddButton} onClick={() => addDynamicListItem(respondentFindings, setRespondentFindings, "respondentFindings")}>+</button>
                          {respondentFindings.length > 1 && (
                            <button type="button" style={smallRemoveButton} onClick={() => removeDynamicListItem(respondentFindings, setRespondentFindings, "respondentFindings", idx)}>-</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={td}>
                <strong>In the Data Collection,</strong>
                <table style={bulletTable}>
                  <tbody>
                    {dataCollectionFindings.map((item, idx) => (
                      <tr key={`data-${idx}`}>
                        <td style={bulletSymbolCell}>•</td>
                        <td style={bulletInputCell}>
                          <textarea
                            rows={1}
                            style={lineTextarea}
                            value={item}
                            onChange={(e) => updateDynamicList(dataCollectionFindings, setDataCollectionFindings, "dataCollectionFindings", idx, e.target.value)}
                            onInput={autoExpand}
                          />
                        </td>
                        <td style={bulletActionCell}>
                          <button type="button" style={smallAddButton} onClick={() => addDynamicListItem(dataCollectionFindings, setDataCollectionFindings, "dataCollectionFindings")}>+</button>
                          {dataCollectionFindings.length > 1 && (
                            <button type="button" style={smallRemoveButton} onClick={() => removeDynamicListItem(dataCollectionFindings, setDataCollectionFindings, "dataCollectionFindings", idx)}>-</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={td}>
                <strong>On the Informed Consent Form</strong>
                <textarea
                  rows={2}
                  style={lineTextarea}
                  value={fields.informedConsentSummary}
                  onChange={(e) => setField("informedConsentSummary", e.target.value)}
                  onInput={autoExpand}
                />
              </td>
            </tr>
            <tr>
              <td style={sectionHeaderCell}>REFLECT THE TITLE OF THE RESEARCH IN THE ICF</td>
            </tr>
          </tbody>
        </table>

        <table style={icfTable}>
          <tbody>
            <tr>
              <td style={icfHeaderLeft}>Sections/Subsection</td>
              <td style={icfHeader}>Recommendations</td>
            </tr>
            {icfRows.map((row, idx) => (
              <tr key={row.section + idx}>
                <td style={icfSectionCell}>{row.section}</td>
                <td style={icfRecoCell}>
                  <textarea
                    rows={1}
                    style={lineTextarea}
                    value={row.recommendation}
                    onChange={(e) => updateIcfRow(idx, e.target.value)}
                    onInput={autoExpand}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={pageContainer}>
        <table style={formTable}>
          <tbody>
            <tr>
              <td style={td}>
                <div style={paragraphCenter}>
                  Based on the listed recommendations emanating from the specific findings by the UIC-REC for both the proposal and ICF,
                  you are hereby advised to comply with the
                  <input style={inlineInput} value={fields.finalAdviceLine} onChange={(e) => setField("finalAdviceLine", e.target.value)} />
                  as determined.
                </div>
              </td>
            </tr>
            <tr>
              <td style={td}>
                <strong>NOTE:</strong> UIC-REC requires the researcher to provide an ICF written in the dialect or in Filipino in case there are respondents who cannot understand the English version of the ICF.
              </td>
            </tr>
            <tr>
              <td style={td}>
                <div style={paragraph}>
                  Considering the target turnaround time of the UIC-REC for this study, which is
                  <input style={inlineInputSmall} value={fields.noteTurnaroundDays} onChange={(e) => setField("noteTurnaroundDays", e.target.value)} />
                  working days upon the deployment of your documents to the review committee,
                  which in your case was
                  <input style={inlineInputSmall} value={fields.noteCaseDate} onChange={(e) => setField("noteCaseDate", e.target.value)} />
                  you are to revise both the proposal manuscript and the ICF immediately.
                  Email the revised documents at recboxav2@uic.edu.ph the soonest time possible to give the committee adequate time for final deliberation.
                </div>
              </td>
            </tr>
            <tr>
              <td style={td}>
                <div style={{ marginTop: "16px" }}>Very truly yours,</div>
                <table style={signatureTable}>
                  <tbody>
                    <tr>
                      <td style={signatureCell}>
                        <div style={signaturePadWrap}>
                          <SignatureCell
                            value={chairSignature}
                            onChange={(val) => {
                              setChairSignature(val);
                              save({ chairSignature: val });
                            }}
                          />
                        </div>
                        <input style={signatureLineInput} value={fields.chairName} onChange={(e) => setField("chairName", e.target.value)} />
                        <div style={caption}>Name and Signature</div>
                      </td>
                      <td style={signatureCell}>
                        <input style={signatureLineInput} value={fields.chairTitle} onChange={(e) => setField("chairTitle", e.target.value)} />
                        <div style={caption}>Position</div>
                        <input style={{ ...signatureLineInput, marginTop: "12px" }} value={fields.signedDate} onChange={(e) => setField("signedDate", e.target.value)} />
                        <div style={caption}>Date Signed</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
  margin: "0 auto 8mm auto",
  boxSizing: "border-box",
  background: "white",
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
  width: "14%",
  border: "1px solid #ff00cc",
  textAlign: "center",
  padding: "6px",
};

const logoImage: React.CSSProperties = {
  width: "70px",
  height: "70px",
  objectFit: "contain",
};

const headerTitleCell: React.CSSProperties = {
  border: "1px solid #ff00cc",
  textAlign: "center",
  fontSize: "19px",
  fontWeight: 500,
  padding: "6px",
};

const formTitleCell: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "center",
  fontWeight: 700,
  fontSize: "22px",
  padding: "8px",
};

const formTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const sectionHeaderCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  background: "#f5f5f5",
};

const lineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "transparent",
};

const lineInputShort: React.CSSProperties = {
  width: "230px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  marginLeft: "6px",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "transparent",
};

const lineTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  fontSize: "12px",
  lineHeight: 1.35,
  background: "transparent",
  fontFamily: "inherit",
};

const paragraph: React.CSSProperties = {
  lineHeight: 1.45,
  textAlign: "justify",
};

const paragraphCenter: React.CSSProperties = {
  lineHeight: 1.45,
  textAlign: "center",
};

const inlineInput: React.CSSProperties = {
  width: "140px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  margin: "0 4px",
  background: "transparent",
  fontFamily: "inherit",
};

const inlineInputSmall: React.CSSProperties = {
  width: "70px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  margin: "0 4px",
  background: "transparent",
  fontFamily: "inherit",
};

const bulletTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "4px",
};

const bulletSymbolCell: React.CSSProperties = {
  width: "20px",
  border: "none",
  verticalAlign: "top",
  padding: "4px 2px",
  fontSize: "18px",
  lineHeight: 1,
};

const bulletInputCell: React.CSSProperties = {
  border: "none",
  padding: "2px 0",
};

const bulletActionCell: React.CSSProperties = {
  width: "72px",
  border: "none",
  padding: "2px 0 2px 6px",
  verticalAlign: "top",
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

const checkTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "6px",
};

const checkHeaderLeft: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "64%",
};

const checkHeader: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "18%",
  textAlign: "center",
};

const checkPartCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
};

const checkMarkCell: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "center",
  verticalAlign: "middle",
};

const icfTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const icfHeaderLeft: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "25%",
};

const icfHeader: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "75%",
};

const icfSectionCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 600,
  verticalAlign: "top",
};

const icfRecoCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
};

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "8px",
};

const signatureCell: React.CSSProperties = {
  border: "none",
  padding: "4px 8px 4px 0",
  width: "50%",
  verticalAlign: "top",
};

const signaturePadWrap: React.CSSProperties = {
  width: "210px",
  maxWidth: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  padding: "4px",
  background: "#fafafa",
};

const signatureLineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  marginTop: "8px",
  fontFamily: "inherit",
  background: "transparent",
};

const caption: React.CSSProperties = {
  fontSize: "11px",
  marginTop: "2px",
};
