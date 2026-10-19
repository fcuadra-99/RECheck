import { useState } from "react";

function EthicsInformedConsentAssessmentForm() {
  const [researchTitle, setResearchTitle] = useState("");
  const [facultyResearchers, setFacultyResearchers] = useState("");
  const [studentResearchers, setStudentResearchers] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [dateSubmitted, setDateSubmitted] = useState("");
  const [dateReceived, setDateReceived] = useState("");

  const [submittedNames, setSubmittedNames] = useState("");
  const [endorsedBy, setEndorsedBy] = useState("");
  const [dateFiled, setDateFiled] = useState("");

  const checklistItems = [
    "Describe the nature and purpose of the questions to be asked",
    "State that the participants is free to not answer any question",
    "Clearly states, where applicable, that some of the questions may prove embarrassing for the participant",
    "Clearly states, where applicable, that the interviews (in-depth or focus group discussions) are likely to be audio or video taped.",
    "Clearly mention, where applicable, how and for how long the tapes/ files are going to be stored",
  ];

  const [answers, setAnswers] = useState<string[]>(
    Array(checklistItems.length).fill(""),
  );

  const handleAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div style={container}>
      <div style={headerWrap}>
        <div style={headerLeft}>
          <div style={logoBadge}>UIC</div>
          <div>
            <div style={headerUniversityName}>
              University of the Immaculate Conception
            </div>
            <div style={headerCommitteeName}>
              Research Ethics Committee (REC)
            </div>
            <div style={headerAddress}>
              Bonifacio Street, Davao City, Philippines
            </div>
          </div>
        </div>

        <div style={headerCodeBox}>
          <div>REC_FO_0030</div>
          <div>Control No.: _________</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
        Ethics Informed Consent Assessment Form
      </h3>

      <div style={importantNote}>
        <strong>IMPORTANT:</strong> All fields <u>must be completed.</u>
      </div>

      <table style={metaTable}>
        <tbody>
          <tr>
            <td style={labelCell}>Research Title</td>
            <td style={inputCell}>
              <textarea
                style={textareaStyle}
                value={researchTitle}
                onChange={(e) => setResearchTitle(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Faculty Researchers</td>
            <td style={inputCell}>
              <textarea
                style={textareaStyle}
                value={facultyResearchers}
                onChange={(e) => setFacultyResearchers(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Student Researchers</td>
            <td style={inputCell}>
              <textarea
                style={textareaStyle}
                value={studentResearchers}
                onChange={(e) => setStudentResearchers(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Name of Sponsor (if applicable)</td>
            <td style={inputCell}>
              <textarea
                style={textareaStyle}
                value={sponsor}
                onChange={(e) => setSponsor(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Date Submitted</td>
            <td style={inputCell}>
              <input
                type="date"
                style={dateInputStyle}
                value={dateSubmitted}
                onChange={(e) => setDateSubmitted(e.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Date Received</td>
            <td style={inputCell}>
              <input
                type="date"
                style={dateInputStyle}
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <table style={checklistTable}>
        <thead>
          <tr>
            <th style={{ ...tableHeadCell, width: "4%" }}></th>
            <th style={{ ...tableHeadCell, width: "74%" }}></th>
            <th style={{ ...tableHeadCell, width: "7%" }}>C</th>
            <th style={{ ...tableHeadCell, width: "7%" }}>NC</th>
            <th style={{ ...tableHeadCell, width: "8%" }}>N/A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} style={sectionCell}>
              The information sheet and consent form
            </td>
          </tr>
          {checklistItems.map((item, idx) => (
            <tr key={idx}>
              <td style={letterCell}>{String.fromCharCode(97 + idx)}</td>
              <td style={itemCell}>{item}</td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="C"
                  checked={answers[idx] === "C"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="NC"
                  checked={answers[idx] === "NC"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="N/A"
                  checked={answers[idx] === "N/A"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={legendText}>
        <strong>Legend:</strong>{" "}
        <span style={legendComplied}>C – Complied</span>{" "}
        <span style={legendNotComplied}>NC – Not Complied</span>{" "}
        <span style={legendNA}>N/A – Not Applicable</span>
      </div>

      <div style={submittedByWrap}>
        <div style={submittedByTitleWrap}>
          <strong>Submitted by:</strong>
        </div>
        <table style={submittedByTable}>
          <thead>
            <tr>
              <th style={submittedByHead}>Name</th>
              <th style={submittedByHead}>Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={submittedByNameCell}>
                <textarea
                  style={submittedByNamesInput}
                  value={submittedNames}
                  onChange={(e) => setSubmittedNames(e.target.value)}
                  onInput={autoExpand}
                  placeholder="Add researcher names here"
                />
              </td>
              <td style={submittedBySignatureCell}>
                <div style={submittedBySignatureSpace}></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={endorsedWrap}>
        <strong>Endorsed by/ Recommended by</strong>
        <textarea
          style={endorsedInput}
          value={endorsedBy}
          onChange={(e) => setEndorsedBy(e.target.value)}
          onInput={autoExpand}
        />
        <div style={subText}>Research Adviser/ Mentor</div>
      </div>

      <div style={dateFiledWrap}>
        <strong>Date Filed:</strong>
        <input
          type="date"
          style={{ ...dateInputStyle, marginTop: "6px" }}
          value={dateFiled}
          onChange={(e) => setDateFiled(e.target.value)}
        />
      </div>

      <div style={footerWrap}>
        <span style={footerDot}>•</span>
        <span>Telephone No. (082) 227-82-86 (loc. 211)</span>
        <span style={footerDot}>•</span>
        <span>Email Address: rec@uic.edu.ph</span>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  margin: "0 auto",
  background: "white",
  boxSizing: "border-box",
  fontSize: "12px",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
};

const importantNote: React.CSSProperties = {
  marginBottom: "10px",
  fontSize: "12px",
};

const metaTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
  marginBottom: "12px",
};

const labelCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  width: "28%",
  verticalAlign: "top",
  background: "#f5f5f5",
};

const inputCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  minHeight: "28px",
  outline: "none",
};

const dateInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderBottom: "1px solid black",
  fontFamily: "inherit",
  outline: "none",
};

const checklistTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
};

const tableHeadCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  background: "#f0f0f0",
  fontWeight: 700,
};

const letterCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  verticalAlign: "top",
  fontWeight: 700,
};

const itemCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
  lineHeight: 1.35,
};

const answerCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  verticalAlign: "middle",
};

const sectionCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: 700,
  background: "#fafafa",
};

const legendText: React.CSSProperties = {
  marginTop: "8px",
  fontSize: "11px",
};

const legendComplied: React.CSSProperties = {
  color: "#c50000",
  fontWeight: 700,
};

const legendNotComplied: React.CSSProperties = {
  color: "#b56a00",
  fontWeight: 700,
};

const legendNA: React.CSSProperties = {
  fontWeight: 700,
};

const submittedByWrap: React.CSSProperties = {
  marginTop: "18px",
};

const submittedByTitleWrap: React.CSSProperties = {
  border: "none",
  padding: "0 0 8px",
};

const submittedByTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
};

const submittedByHead: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "left",
  padding: "6px",
  background: "#f0f0f0",
  fontWeight: 700,
};

const submittedByNameCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const submittedBySignatureCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const submittedByNamesInput: React.CSSProperties = {
  width: "100%",
  minHeight: "120px",
  border: "none",
  padding: "0",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  fontSize: "12px",
  boxSizing: "border-box",
  outline: "none",
};

const submittedBySignatureSpace: React.CSSProperties = {
  minHeight: "120px",
  width: "100%",
};

const endorsedWrap: React.CSSProperties = {
  marginTop: "12px",
  border: "1px solid black",
  padding: "8px",
};

const endorsedInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  minHeight: "22px",
  outline: "none",
  marginTop: "6px",
};

const subText: React.CSSProperties = {
  fontSize: "11px",
  marginTop: "4px",
};

const dateFiledWrap: React.CSSProperties = {
  marginTop: "10px",
  border: "1px solid black",
  padding: "8px",
};

const headerWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  background: "#f1f1f1",
  border: "1px solid #d7d7d7",
  padding: "12px 16px",
  marginBottom: "14px",
};

const headerLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const logoBadge: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  border: "2px solid #e05b94",
  color: "#e05b94",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "14px",
  background: "#fff",
};

const headerUniversityName: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.25,
};

const headerCommitteeName: React.CSSProperties = {
  fontSize: "14px",
  fontStyle: "italic",
  fontWeight: 700,
  lineHeight: 1.25,
};

const headerAddress: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.25,
};

const headerCodeBox: React.CSSProperties = {
  border: "1px solid #4d6895",
  padding: "10px 14px",
  minWidth: "170px",
  fontSize: "15px",
  lineHeight: 1.45,
  background: "#fff",
};

const footerWrap: React.CSSProperties = {
  marginTop: "16px",
  background: "#f1f1f1",
  border: "1px solid #d7d7d7",
  padding: "9px 14px",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const footerDot: React.CSSProperties = {
  color: "#e05b94",
  fontSize: "18px",
  lineHeight: 1,
};

export default EthicsInformedConsentAssessmentForm;
