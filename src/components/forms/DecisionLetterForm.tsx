import React, { useState } from "react";

interface DecisionLetterFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
  isReadOnly?: boolean;
}

export default function DecisionLetterForm({ savedData = {}, onSave, isReadOnly = false }: DecisionLetterFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    date: s.fields?.date ?? s.date ?? "",
    researcherName: s.fields?.researcherName ?? s.researcherName ?? "",
    institutionLine1: s.fields?.institutionLine1 ?? s.institutionLine1 ?? "University of the Immaculate Conception",
    institutionLine2: s.fields?.institutionLine2 ?? s.institutionLine2 ?? "Bonifacio St., Davao City",
    re: s.fields?.re ?? s.re ?? "",
    protocolCode: s.fields?.protocolCode ?? s.protocolCode ?? "",
    subject: s.fields?.subject ?? s.subject ?? "Research Ethics Review",
    dearName: s.fields?.dearName ?? s.dearName ?? "",
    requestDate: s.fields?.requestDate ?? s.requestDate ?? "",
    reviewType: s.fields?.reviewType ?? s.reviewType ?? "",
    reviewDate: s.fields?.reviewDate ?? s.reviewDate ?? "",
    proposalSummary: s.fields?.proposalSummary ?? s.proposalSummary ?? "Overall, the study has evidence of scientific soundness, with the researcher having satisfactorily written all/or majority of following parts of the paper:",
    informedConsentSummary: s.fields?.informedConsentSummary ?? s.informedConsentSummary ?? "Generally, the ICF is adequately written. However, there are some additions in the sections to address other dimensions of ethics review.",
    finalAdviceLine: s.fields?.finalAdviceLine ?? s.finalAdviceLine ?? "",
    noteDeadlineDate: s.fields?.noteDeadlineDate ?? s.noteDeadlineDate ?? "",
    noteTurnaroundDays: s.fields?.noteTurnaroundDays ?? s.noteTurnaroundDays ?? "",
    noteCaseDate: s.fields?.noteCaseDate ?? s.noteCaseDate ?? "",
    chairName: s.fields?.chairName ?? s.chairName ?? "GIRLIE MAE P. ZABALA, PhD",
    chairTitle: s.fields?.chairTitle ?? s.chairTitle ?? "Chair, UIC-REC",
    signedDate: s.fields?.signedDate ?? s.signedDate ?? "",
  });

  const [proposalRows, setProposalRows] = useState<Array<{ section: string; satisfactory: boolean; notSatisfactory: boolean }>>(
    Array.isArray(s.fields?.proposalRows) && s.fields.proposalRows.length > 0
      ? s.fields.proposalRows
      : Array.isArray(s.proposalRows) && s.proposalRows.length > 0
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
    Array.isArray(s.fields?.icfRows) && s.fields.icfRows.length > 0
      ? s.fields.icfRows
      : Array.isArray(s.icfRows) && s.icfRows.length > 0
      ? s.icfRows
      : [
          { section: "INTRODUCTION", recommendation: "" },
          { section: "PURPOSE OF THE STUDY", recommendation: "" },
          { section: "STUDY PROCEDURES", recommendation: "" },
          { section: "POTENTIAL RISKS AND DISCOMFORTS", recommendation: "" },
          { section: "REIMBURSEMENT AND COMPENSATION", recommendation: "" },
          { section: "POTENTIAL BENEFITS To respondents/AND TO SOCIETY", recommendation: "" },
          { section: "DATA PRIVACY AND CONFIDENTIALITY", recommendation: "" },
          { section: "VOLUNTARINESS OF PARTICIPATION AND RIGHTS TO WITHDRAW FROM THE RESEARCH", recommendation: "" },
          { section: "INVESTIGATOR'S and ADVISER'S CONTACT INFORMATION", recommendation: "" },
          { section: "RIGHTS OF RESEARCH PARTICIPANT", recommendation: "" },
        ]
  );

  // Retrieve comments list or fall back dynamically to previous keys to avoid data loss
  const [comments, setComments] = useState<string[]>(
    Array.isArray(s.fields?.comments) && s.fields.comments.length > 0
      ? s.fields.comments
      : Array.isArray(s.comments) && s.comments.length > 0
      ? s.comments
      : Array.isArray(s.fields?.respondentBullets) && s.fields.respondentBullets.length > 0
      ? s.fields.respondentBullets
      : [""]
  );

  // Dynamic supporting documents state
  const [supportingDocs, setSupportingDocs] = useState<string[]>(
    Array.isArray(s.fields?.supportingDocs) && s.fields.supportingDocs.length > 0
      ? s.fields.supportingDocs
      : Array.isArray(s.supportingDocs) && s.supportingDocs.length > 0
      ? s.supportingDocs
      : [
          "Letter of endorsement for ethics review",
          "Minutes from the technical panel for the proposal defense",
          "Protocol/thesis proposal approved by the technical panel",
          "Informed consent form (ICF)",
          "Filled out application forms for UIC-REC full board review",
        ]
  );

  const setField = (key: string, value: string) => {
    if (isReadOnly) return;
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ [key]: value, fields: next });
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "auto";
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
  };

  const updateProposalRow = (index: number, patch: Partial<{ section: string; satisfactory: boolean; notSatisfactory: boolean }>) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    const next = icfRows.map((row, i) => (i === index ? { ...row, recommendation: value } : row));
    setIcfRows(next);
    save({ icfRows: next });
  };

  // Dynamic comments bullet helpers
  const updateComment = (index: number, value: string) => {
    if (isReadOnly) return;
    const next = [...comments];
    next[index] = value;
    setComments(next);
    save({ comments: next, fields: { ...fields, comments: next } });
  };

  const addComment = () => {
    if (isReadOnly) return;
    const next = [...comments, ""];
    setComments(next);
    save({ comments: next, fields: { ...fields, comments: next } });
  };

  const removeComment = (index: number) => {
    if (isReadOnly) return;
    if (comments.length === 1) return;
    const next = comments.filter((_, i) => i !== index);
    setComments(next);
    save({ comments: next, fields: { ...fields, comments: next } });
  };

  // Dynamic supporting documents helpers
  const updateSupportingDoc = (index: number, value: string) => {
    if (isReadOnly) return;
    const next = [...supportingDocs];
    next[index] = value;
    setSupportingDocs(next);
    save({ supportingDocs: next, fields: { ...fields, supportingDocs: next } });
  };

  const addSupportingDoc = () => {
    if (isReadOnly) return;
    const next = [...supportingDocs, ""];
    setSupportingDocs(next);
    save({ supportingDocs: next, fields: { ...fields, supportingDocs: next } });
  };

  const removeSupportingDoc = (index: number) => {
    if (isReadOnly) return;
    if (supportingDocs.length === 1) return;
    const next = supportingDocs.filter((_, i) => i !== index);
    setSupportingDocs(next);
    save({ supportingDocs: next, fields: { ...fields, supportingDocs: next } });
  };

  React.useEffect(() => {
    const resizeAll = () => {
      document.querySelectorAll("textarea").forEach((ta) => {
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
      });
    };
    const frame = window.requestAnimationFrame(resizeAll);
    return () => window.cancelAnimationFrame(frame);
  }, [fields, comments, supportingDocs, icfRows, savedData]);

  const pageContainer: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm",
    margin: "0 auto 8mm auto",
    boxSizing: "border-box",
    background: "white",
    fontFamily: '"Segoe UI", Arial, sans-serif',
    fontSize: "12px",
    color: "#000",
    position: "relative",
  };

  const tableLayout: React.CSSProperties = {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
  };

  const magenta = "#ff00ff";

  const inputStyle: React.CSSProperties = {
    border: "none",
    borderBottom: isReadOnly ? "none" : "1px solid black",
    width: "100%",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    backgroundColor: "transparent",
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    border: "none",
    borderBottom: isReadOnly ? "none" : "1px solid black",
    width: "100%",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    backgroundColor: "transparent",
    outline: "none",
    resize: "none",
    overflow: "hidden",
    verticalAlign: "bottom",
    display: "block",
  };

  const cellBordered: React.CSSProperties = {
    border: "1px solid black",
    padding: "6px",
    verticalAlign: "top",
  };

  const cellLabel: React.CSSProperties = {
    border: "1px solid black",
    padding: "6px",
    fontWeight: "bold",
    background: "#f5f5f5",
    verticalAlign: "middle",
  };

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* PAGE 1 */}
      <div style={pageContainer}>
        <table style={tableLayout}>
          <tbody>
            <tr>
              <td style={{ 
                width: "15%", 
                borderRight: `2px solid ${magenta}`, 
                borderBottom: `2px solid ${magenta}`,
                verticalAlign: "top",
                paddingRight: "10px",
                paddingBottom: "10px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: `1px solid ${magenta}`,
                  display: "table",
                  margin: "0 auto",
                  color: magenta,
                  textAlign: "center",
                  fontSize: "8px"
                }}>
                  <div style={{ display: "table-cell", verticalAlign: "middle" }}>UIC LOGO</div>
                </div>
              </td>
              <td style={{ 
                width: "85%", 
                borderBottom: `2px solid ${magenta}`,
                paddingLeft: "15px",
                paddingBottom: "10px",
                verticalAlign: "top"
              }}>
                <div style={{ color: magenta, fontSize: "20pt", margin: "0 0 5px 0", fontWeight: "bold" }}>
                  University of the Immaculate Conception
                </div>
                <div style={{ color: magenta, fontSize: "9pt", lineHeight: "1.2" }}>
                  Rm 10, 3F, St. Joseph Bldg., Bonifacio Street, Davao City 8000, Philippines<br/>
                  📞 227-8286 local 211<br/>
                  (63-082) 227-37-94<br/>
                  www.uic.edu.ph<br/>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5px" }}>
                    <tbody>
                      <tr>
                        <td style={{ color: magenta, fontSize: "9pt", verticalAlign: "bottom" }}>rec@uic.edu.ph</td>
                        <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "11pt", color: magenta, verticalAlign: "bottom" }}>
                          Research Ethics Committee
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ 
                borderRight: `2px solid ${magenta}`, 
                verticalAlign: "top",
                paddingTop: "20px"
              }}>
              </td>
              <td style={{ 
                paddingLeft: "15px",
                paddingTop: "30px",
                verticalAlign: "top"
              }}>
                <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "30px", fontSize: "14pt" }}>
                  DECISION LETTER
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "45px", fontWeight: "bold", verticalAlign: "bottom" }}>Date:</td>
                      <td style={{ verticalAlign: "bottom" }}>
                        <input 
                          type="text" 
                          value={fields.date}
                          onChange={(e) => setField("date", e.target.value)}
                          style={{...inputStyle, width: "200px"}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: "20px", fontWeight: "bold" }}>
                  <div style={{ marginBottom: "5px" }}>Researchers Name:</div>
                  <textarea 
                    value={fields.researcherName}
                    onChange={(e) => setField("researcherName", e.target.value)}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: "bold", width: "300px"}} 
                    rows={1}
                    readOnly={isReadOnly}
                  />
                  <textarea 
                    value={fields.institutionLine1}
                    onChange={(e) => setField("institutionLine1", e.target.value)}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: "normal", width: "400px", marginTop: "5px"}}
                    rows={1}
                    readOnly={isReadOnly}
                  />
                  <textarea 
                    value={fields.institutionLine2}
                    onChange={(e) => setField("institutionLine2", e.target.value)}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: "normal", width: "400px", marginTop: "5px"}}
                    rows={1}
                    readOnly={isReadOnly}
                  />
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "30px", verticalAlign: "top", fontWeight: "bold" }}>Re:</td>
                      <td>
                        <textarea 
                          value={fields.re}
                          onChange={(e) => setField("re", e.target.value)}
                          onInput={handleTextareaInput}
                          style={{...textareaStyle, fontWeight: "bold", width: "100%"}}
                          rows={1}
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "110px", verticalAlign: "bottom", fontWeight: "bold" }}>Protocol Code:</td>
                      <td style={{ verticalAlign: "bottom" }}>
                        <input 
                          type="text" 
                          value={fields.protocolCode}
                          onChange={(e) => setField("protocolCode", e.target.value)}
                          style={{...inputStyle, fontWeight: "bold", width: "250px"}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "65px", verticalAlign: "top", fontWeight: "bold" }}>Subject:</td>
                      <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                        <input 
                          type="text" 
                          value={fields.subject}
                          onChange={(e) => setField("subject", e.target.value)}
                          style={{...inputStyle, fontWeight: "bold", width: "350px"}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "40px", verticalAlign: "bottom" }}>Dear</td>
                      <td style={{ verticalAlign: "bottom" }}>
                        <input 
                          type="text" 
                          value={fields.dearName}
                          onChange={(e) => setField("dearName", e.target.value)}
                          style={{...inputStyle, fontWeight: "bold", width: "200px"}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td style={{ verticalAlign: "bottom", paddingLeft: "5px" }}>:</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: "20px", textAlign: "justify", lineHeight: "1.6" }}>
                  This is to acknowledge receipt of your request and the following supporting documents on{" "}
                  <input 
                    type="text" 
                    value={fields.requestDate}
                    onChange={(e) => setField("requestDate", e.target.value)}
                    style={{...inputStyle, width: "150px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />:
                </div>

                {/* Dynamic supporting documents list */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginLeft: "10px", marginBottom: "20px" }}>
                  <tbody>
                    {supportingDocs.map((doc, idx) => (
                      <tr key={`supporting-doc-${idx}`}>
                        <td style={{ width: "20px", verticalAlign: "top", padding: "4px 0", fontWeight: "bold" }}>•</td>
                        <td style={{ verticalAlign: "top", padding: "2px 0" }}>
                          <textarea
                            rows={1}
                            style={{ ...textareaStyle, fontWeight: "bold" }}
                            value={doc}
                            onChange={(e) => updateSupportingDoc(idx, e.target.value)}
                            onInput={handleTextareaInput}
                            placeholder="Add supporting document..."
                            readOnly={isReadOnly}
                          />
                        </td>
                        {!isReadOnly && (
                          <td style={{ width: "70px", verticalAlign: "top", textAlign: "right", padding: "2px 0" }}>
                            <button
                              type="button"
                              onClick={addSupportingDoc}
                              style={{ border: "1px solid #16a34a", padding: "1px 5px", borderRadius: "3px", background: "#dcfce7", color: "#166534", marginRight: "4px", fontSize: "9px", cursor: "pointer" }}
                            >
                              +
                            </button>
                            {supportingDocs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSupportingDoc(idx)}
                                style={{ border: "1px solid #dc2626", padding: "1px 5px", borderRadius: "3px", background: "#fee2e2", color: "#991b1b", fontSize: "9px", cursor: "pointer" }}
                              >
                                -
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginBottom: "20px", textAlign: "justify", lineHeight: "1.6" }}>
                  The above documents underwent{" "}
                  <input 
                    type="text" 
                    value={fields.reviewType}
                    onChange={(e) => setField("reviewType", e.target.value)}
                    style={{...inputStyle, width: "100px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />{" "}
                  review on{" "}
                  <input 
                    type="text" 
                    value={fields.reviewDate}
                    onChange={(e) => setField("reviewDate", e.target.value)}
                    style={{...inputStyle, width: "150px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />, which generated the following:
                </div>

                <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "15px" }}>
                  RECOMMENDATIONS
                </div>

                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  On the Proposal
                </div>

                <div style={{ marginBottom: "15px", textAlign: "justify", lineHeight: "1.6" }}>
                  <textarea
                    rows={2}
                    style={{...textareaStyle, borderBottom: isReadOnly ? "none" : "1px solid #eee"}}
                    value={fields.proposalSummary}
                    onChange={(e) => setField("proposalSummary", e.target.value)}
                    onInput={handleTextareaInput}
                    readOnly={isReadOnly}
                  />
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid black", marginTop: "10px" }}>
                  <thead>
                    <tr>
                      <th style={cellLabel}>Parts</th>
                      <th style={{...cellLabel, width: "20%", textAlign: "center"}}>Satisfactorily</th>
                      <th style={{...cellLabel, width: "25%", textAlign: "center"}}>Not Satisfactorily</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposalRows.map((row, idx) => (
                      <tr key={row.section + idx}>
                        <td style={cellBordered}>{row.section}</td>
                        <td style={{...cellBordered, textAlign: "center", verticalAlign: "middle"}}>
                          <input 
                            type="checkbox" 
                            checked={row.satisfactory} 
                            onChange={(e) => updateProposalRow(idx, { satisfactory: e.target.checked })} 
                            disabled={isReadOnly}
                          />
                        </td>
                        <td style={{...cellBordered, textAlign: "center", verticalAlign: "middle"}}>
                          <input 
                            type="checkbox" 
                            checked={row.notSatisfactory} 
                            onChange={(e) => updateProposalRow(idx, { notSatisfactory: e.target.checked })} 
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 2 */}
      <div style={pageContainer}>
        <table style={tableLayout}>
          <tbody>
            <tr>
              <td style={{ 
                width: "15%", 
                borderRight: `2px solid ${magenta}`, 
                verticalAlign: "top",
                height: "100%"
              }}>
              </td>
              <td style={{ 
                paddingLeft: "15px",
                paddingTop: "20px",
                verticalAlign: "top"
              }}>
                <div style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "20px" }}>
                  Comments:
                </div>

                {/* Dynamic Comments List with single plus button */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginLeft: "10px" }}>
                  <tbody>
                    {comments.map((bullet, idx) => (
                      <tr key={`comment-${idx}`}>
                        <td style={{ width: "20px", verticalAlign: "top", padding: "4px 0" }}>•</td>
                        <td style={{ verticalAlign: "top", padding: "2px 0" }}>
                          <textarea
                            rows={1}
                            style={textareaStyle}
                            value={bullet}
                            onChange={(e) => updateComment(idx, e.target.value)}
                            onInput={handleTextareaInput}
                            placeholder="Add comment..."
                            readOnly={isReadOnly}
                          />
                        </td>
                        {!isReadOnly && (
                          <td style={{ width: "70px", verticalAlign: "top", textAlign: "right", padding: "2px 0" }}>
                            <button
                              type="button"
                              onClick={addComment}
                              style={{ border: "1px solid #16a34a", padding: "1px 5px", borderRadius: "3px", background: "#dcfce7", color: "#166534", marginRight: "4px", fontSize: "9px", cursor: "pointer" }}
                            >
                              +
                            </button>
                            {comments.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeComment(idx)}
                                style={{ border: "1px solid #dc2626", padding: "1px 5px", borderRadius: "3px", background: "#fee2e2", color: "#991b1b", fontSize: "9px", cursor: "pointer" }}
                              >
                                -
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ fontWeight: "bold", marginBottom: "10px", marginTop: "35px" }}>
                  On the Informed Consent Form
                </div>

                <div style={{ marginBottom: "20px", textAlign: "justify", lineHeight: "1.6" }}>
                  <textarea
                    rows={2}
                    style={{ ...textareaStyle, borderBottom: isReadOnly ? "none" : "1px solid #eee" }}
                    value={fields.informedConsentSummary}
                    onChange={(e) => setField("informedConsentSummary", e.target.value)}
                    onInput={handleTextareaInput}
                    readOnly={isReadOnly}
                  />
                </div>

          

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid black" }}>
                  <thead>
                    <tr>
                      <th style={{...cellLabel, width: "35%"}}>Sections/Subsection</th>
                      <th style={cellLabel}>Recommendations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {icfRows.map((row, idx) => (
                      <tr key={row.section + idx}>
                        <td style={{...cellBordered, fontWeight: "bold"}}>{row.section}</td>
                        <td style={cellBordered}>
                          <textarea
                            rows={1}
                            style={textareaStyle}
                            value={row.recommendation}
                            onChange={(e) => updateIcfRow(idx, e.target.value)}
                            onInput={handleTextareaInput}
                            readOnly={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 3 */}
      <div style={pageContainer}>
        <table style={tableLayout}>
          <tbody>
            <tr>
              <td style={{ 
                width: "15%", 
                borderRight: `2px solid ${magenta}`, 
                verticalAlign: "top",
                height: "100%"
              }}>
              </td>
              <td style={{ 
                paddingLeft: "15px",
                paddingTop: "20px",
                verticalAlign: "top"
              }}>
                <div style={{ marginBottom: "20px", textAlign: "justify", lineHeight: "1.6", marginTop: "10px" }}>
                  Based on the listed recommendations emanating from the specific findings by the UIC-REC for both the proposal and ICF,
                  you are hereby advised to comply with the{" "}
                  <input 
                    type="text" 
                    value={fields.finalAdviceLine}
                    onChange={(e) => setField("finalAdviceLine", e.target.value)}
                    style={{...inputStyle, width: "150px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />{" "}
                  as determined.
                </div>

                <div style={{ marginBottom: "25px", textAlign: "justify", lineHeight: "1.6" }}>
                  <b>NOTE:</b> UIC-REC requires the researcher to provide an ICF written in the dialect or in Filipino in case there are respondents who cannot understand the English version of the ICF.
                </div>

                <div style={{ marginBottom: "40px", textAlign: "justify", lineHeight: "1.6" }}>
                  Considering the target turnaround time of the UIC-REC for this study, which is{" "}
                  <input 
                    type="text" 
                    value={fields.noteTurnaroundDays}
                    onChange={(e) => setField("noteTurnaroundDays", e.target.value)}
                    style={{...inputStyle, width: "40px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />{" "}
                  working days upon the deployment of your documents to the review committee,
                  which in your case was{" "}
                  <input 
                    type="text" 
                    value={fields.noteCaseDate}
                    onChange={(e) => setField("noteCaseDate", e.target.value)}
                    style={{...inputStyle, width: "150px", display: "inline-block", textAlign: "center"}} 
                    readOnly={isReadOnly}
                  />,{" "}
                  you are to revise both the proposal manuscript and the ICF immediately.
                  Email the revised documents at <b>recboxav2@uic.edu.ph</b> the soonest time possible to give the committee adequate time for final deliberation.
                </div>

                <div style={{ marginBottom: "40px" }}>
                  Very truly yours,
                </div>

                {/* Chairperson Name & Title without drawing signature box */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "300px", verticalAlign: "top" }}>
                        <input 
                          type="text" 
                          value={fields.chairName}
                          onChange={(e) => setField("chairName", e.target.value)}
                          style={{...inputStyle, fontWeight: "bold", width: "250px", borderBottom: isReadOnly ? "none" : "1px solid black"}} 
                          readOnly={isReadOnly}
                        />
                        <div style={{ marginTop: "2px", fontSize: "10pt" }}>
                          <input 
                            type="text" 
                            value={fields.chairTitle}
                            onChange={(e) => setField("chairTitle", e.target.value)}
                            style={{...inputStyle, width: "250px", borderBottom: isReadOnly ? "none" : "1px solid black"}} 
                            readOnly={isReadOnly}
                          />
                        </div>
                        {fields.signedDate && (
                          <div style={{ marginTop: "5px", fontSize: "9pt", color: "#666" }}>
                            Date Signed: {fields.signedDate}
                          </div>
                        )}
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
