import { useState } from "react";
import MemberListInput from "./MemberListInput";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";

function EthicsInformedConsentChecklist() {
  const [controlNo, setControlNo] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [facultyResearchers, setFacultyResearchers] = useState([""]);
  const [studentResearchers, setStudentResearchers] = useState([""]);
  const [sponsor, setSponsor] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dateSubmitted, setDateSubmitted] = useState(today);
  const [dateReceived, setDateReceived] = useState(today);

  const [submittedMembers, setSubmittedMembers] = useSubmittedByMembers();
  const [endorsedMembers, setEndorsedMembers] = useSubmittedByMembers();
  const [dateFiled, setDateFiled] = useState(today);

  const checklistItems = [
    "Informed consent form is attached.",
    "The ICF is addressed to the participants/respondents of the study.",
    "The informed consent is written or presented in simple language that participants can understand.",
    "The protocol includes an adequate process for ensuring that consent is voluntary.",
    "Purpose of the study",
    "Expected duration of participation",
    "Procedures to be carried out",
    "Discomforts and inconveniences",
    "Risks (including possible discrimination)",
    "Random assignment to the trial treatments",
    "Benefits to the participants",
    "Alternative treatments/ procedures",
    "Compensation and/or medical treatments in case of injury",
    "Who to contact for pertinent questions and / or for assistance in a research-related injury.",
    "Refusal to participate or discontinuance at any time without penalty or loss of benefits to the participants/respondents.",
    "Extent of confidentiality",
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
          <div>REC_FO_0029</div>
          <div>Control No.: {controlNo || "_________"}</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
        Ethics Informed Consent Checklist
      </h3>

      <div style={importantNote}>
        <strong>IMPORTANT:</strong> All fields <u>must be completed.</u>
      </div>

      <table style={metaTable}>
        <tbody>
          <tr>
            <td style={labelCell}>Control No.</td>
            <td style={inputCell}>
              <input
                style={inputStyle}
                value={controlNo}
                onChange={(e) => setControlNo(e.target.value)}
              />
            </td>
          </tr>
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
              <MemberListInput values={facultyResearchers} onChange={setFacultyResearchers} placeholder="Enter faculty researcher name" />
            </td>
          </tr>
          <tr>
            <td style={labelCell}>Student Researchers</td>
            <td style={inputCell}>
              <MemberListInput values={studentResearchers} onChange={setStudentResearchers} placeholder="Enter student researcher name" />
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
            <th style={{ ...tableHeadCell, width: "6%" }}></th>
            <th style={{ ...tableHeadCell, width: "74%" }}></th>
            <th style={{ ...tableHeadCell, width: "6%" }}>YES</th>
            <th style={{ ...tableHeadCell, width: "6%" }}>NO</th>
            <th style={{ ...tableHeadCell, width: "8%" }}>N/A</th>
          </tr>
        </thead>
        <tbody>
          {checklistItems.slice(0, 4).map((item, idx) => (
            <tr key={`intro-${idx}`}>
              <td style={numberCell}>{idx + 1}</td>
              <td style={itemCell}>{item}</td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="yes"
                  checked={answers[idx] === "yes"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="no"
                  checked={answers[idx] === "no"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
              <td style={answerCell}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value="na"
                  checked={answers[idx] === "na"}
                  onChange={(e) => handleAnswer(idx, e.target.value)}
                />
              </td>
            </tr>
          ))}

          <tr>
            <td colSpan={5} style={sectionCell}>
              The ICF provided the participants with sufficient information on:
            </td>
          </tr>

          {checklistItems.slice(4).map((item, idx) => {
            const actualIndex = idx + 4;
            return (
              <tr key={`detail-${actualIndex}`}>
                <td style={numberCell}>{actualIndex + 1}</td>
                <td style={itemCell}>{item}</td>
                <td style={answerCell}>
                  <input
                    type="radio"
                    name={`q-${actualIndex}`}
                    value="yes"
                    checked={answers[actualIndex] === "yes"}
                    onChange={(e) => handleAnswer(actualIndex, e.target.value)}
                  />
                </td>
                <td style={answerCell}>
                  <input
                    type="radio"
                    name={`q-${actualIndex}`}
                    value="no"
                    checked={answers[actualIndex] === "no"}
                    onChange={(e) => handleAnswer(actualIndex, e.target.value)}
                  />
                </td>
                <td style={answerCell}>
                  <input
                    type="radio"
                    name={`q-${actualIndex}`}
                    value="na"
                    checked={answers[actualIndex] === "na"}
                    onChange={(e) => handleAnswer(actualIndex, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={legendText}>
        <strong>Legend:</strong>{" "}
        <span style={legendComplied}>C - Complied</span>{" "}
        <span style={legendNotComplied}>NC - Not Complied</span>{" "}
        <span style={legendNA}>N/A - Not Applicable</span>
      </div>

      <SubmittedByTable members={submittedMembers} onChange={setSubmittedMembers} />

      <SubmittedByTable
        title="Endorsed by / Recommended by (Research Adviser / Mentor):"
        members={endorsedMembers}
        onChange={setEndorsedMembers}
      />

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

const inputStyle: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
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

const numberCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  textAlign: "center",
  verticalAlign: "top",
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

export default EthicsInformedConsentChecklist;
