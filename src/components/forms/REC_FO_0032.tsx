import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";

function EthicsChecklistForm() {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [investigator, setInvestigator] = useState("");
  const [controlNo, setControlNo] = useState("");
  const [submissionDate, setSubmissionDate] = useState(today);
  const [verifiedBy, setVerifiedBy] = useState(today);
  const [dateFiled, setDateFiled] = useState(today);


  const questions = [
    "The study has social value (e.g. scientific value, relevance to national/community needs).",
    "The study has adequate background.",
    "The research questions are supported by review of literature.",
    "The study objectives are Specific, Measurable, Attainable, Realistic, Time-bound.",
    "The population of the participants/respondents are identified and defined.",
    "The selection of study participants is described.",
    "The sample size is justified.",
    "The plan for data analysis is described.",
    "The research needs to be carried out with human participants/respondents.",
    "The study has a vulnerability issue.",
    "Appropriate mechanisms/interventions are in place.",
    "There are risks/probable harms.",
    "There are measures to mitigate the risks.",
    "The informed consent procedure is adequate.",
    "The investigator/s are adequately trained.",
    "There is a disclosure of conflict of interest.",
    "The research facilities are adequate.",
  ];

  const [answers, setAnswers] = useState<string[]>(Array(17).fill(""));

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
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        margin: "0 auto",
        background: "white",
        boxSizing: "border-box",
        fontSize: "12px",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
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
          <div>REC_FO_0032</div>
          <div>Control No.: {controlNo || "_______"}</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center" }}>Ethics Protocol Checklist</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          border: "2px solid black",
        }}
      >
        <tbody>
          <tr>
            <td style={tdLabel}>Control No. / Protocol Code</td>
            <td colSpan={3} style={tdInput}>
              <input
                style={inputStyle}
                value={controlNo}
                onChange={(e) => setControlNo(e.target.value)}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>
              Study Protocol Title <br />
              <span style={subText}>(Title of Study)</span>
            </td>
            <td colSpan={3} style={tdInput}>
              <textarea
                style={textareaStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>
              Principal Investigator <br />
              <span style={subText}>(Researcher/s)</span>
            </td>
            <td colSpan={3} style={tdInput}>
              <textarea
                style={textareaStyle}
                value={investigator}
                onChange={(e) => setInvestigator(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          {/* 🔥 FIXED DATE ROW */}
          <tr>
            <td style={tdLabel}>Study Protocol Submission Date</td>

            <td style={tdInput}>
              <input type="date" style={dateInputStyle} value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} />
            </td>

            <td style={tdLabel}>Verified Complete By</td>

            <td style={tdInput}>
              <input type="date" style={dateInputStyle} value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={requirementsBlock}>
        <h4 style={requirementsHeading}>
          Basic Requirements <em style={emphasisText}>(must submit)</em>
        </h4>

        <ul style={bulletList}>
          <li>
            Updated Curriculum Vitae (CV) of the Adviser(s) and the Researcher
            (At least 1 copy)
          </li>
          <li>
            All grades [certificate of grades - from the registrar] or
            screenshot of{" "}
            <span style={{ color: "#0a8d2a" }}>ONLINE Grades</span>
          </li>
          <li>Photocopy of the receipt (1 copy)</li>
          <li>Ethics Review Endorsement Form (duly signed)</li>
        </ul>

        <h4 style={{ ...requirementsHeading, marginTop: "14px" }}>EXEMPT</h4>

        <ul style={bulletList}>
          <li>
            Revised copy of the manuscript (plain <strong>BLACK</strong> text)
          </li>
          <li>Minutes of the proposal defense</li>
          <li>Routing Form</li>
          <li>
            Ethics Review Checklist <strong>(REC_FO_0032)</strong>
          </li>
        </ul>

        <ul style={{ ...bulletList, marginTop: "12px" }}>
          <li>
            <span style={{ color: "#d71515" }}>Sample </span>
            Protocol Information Form for Exemption{" "}
            <strong>(REC_FO_0033)</strong>
          </li>
          <li>
            <span style={{ color: "#d71515" }}>Sample </span>
            MOA for Authorship <strong>(REC_FO_0035)</strong>
          </li>
        </ul>
      </div>

      {/* CHECKLIST */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Criteria</th>
            <th style={th}>YES</th>
            <th style={th}>NO</th>
            <th style={th}>N/A</th>
          </tr>
        </thead>

        <tbody>
          {questions.map((q, i) => (
            <tr key={i}>
              <td style={td}>{i + 1}</td>
              <td style={td}>{q}</td>

              <td style={td}>
                <input
                  type="radio"
                  name={`q${i}`}
                  onChange={() => handleAnswer(i, "yes")}
                />
              </td>

              <td style={td}>
                <input
                  type="radio"
                  name={`q${i}`}
                  onChange={() => handleAnswer(i, "no")}
                />
              </td>

              <td style={td}>
                <input
                  type="radio"
                  name={`q${i}`}
                  onChange={() => handleAnswer(i, "na")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={legendText}>
        <strong>Legend:</strong> <span style={legendComplied}>C</span> -
        Complied, <span style={legendNotComplied}>NC</span> - Not Complied,{" "}
        <span style={legendNA}>N/A</span> - Not Applicable
      </p>

      {/* SIGNATURES */}
      <h3>Submitted by:</h3>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <textarea style={textareaStyle} onInput={autoExpand} />
        <textarea style={textareaStyle} onInput={autoExpand} />
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <textarea style={textareaStyle} onInput={autoExpand} />
        <textarea style={textareaStyle} onInput={autoExpand} />
      </div>

      <p>
        <strong>Endorsed by:</strong>
        <input style={inputStyle} />
      </p>

      <p>
        Date Filed:
        <input type="date" style={inputStyle} value={dateFiled} onChange={(e) => setDateFiled(e.target.value)} />
      </p>

      <div style={footerWrap}>
        <span style={footerDot}>•</span>
        <span>Telephone No. (082) 227-82-86 (loc. 211)</span>
        <span style={footerDot}>•</span>
        <span>Email Address: rec@uic.edu.ph</span>
      </div>
    </div>
  );
}

// ✅ FIXED TYPES (this removes your error)
const tdLabel: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: "bold",
  width: "25%",
  verticalAlign: "middle",
  background: "#f5f5f5",
};

const tdInput: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "middle",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "5px",
  textAlign: "center",
};

const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "5px",
  background: "#f0f0f0",
  textAlign: "center",
};

const subText: React.CSSProperties = {
  fontWeight: "normal",
  fontSize: "11px",
};

const inputStyle: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  width: "100%",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
};

const dateInputStyle: React.CSSProperties = {
  width: "100%", // ✅ ensures it stays inside cell
  boxSizing: "border-box",
};

const requirementsBlock: React.CSSProperties = {
  marginTop: "18px",
  padding: "10px 12px",
  border: "1px solid #d9d9d9",
  background: "#fafafa",
};

const requirementsHeading: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "15px",
  fontWeight: 700,
};

const emphasisText: React.CSSProperties = {
  fontWeight: 400,
};

const bulletList: React.CSSProperties = {
  margin: "0",
  paddingLeft: "22px",
  lineHeight: 1.5,
};

const legendText: React.CSSProperties = {
  marginTop: "6px",
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

export default EthicsChecklistForm;
