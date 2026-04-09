import { useState } from "react";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";
import MemberListInput from "./MemberListInput";

function EthicsStudyProtocolInformationForm() {
  const [controlNo] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [protocolSubmissionDate, setProtocolSubmissionDate] = useState(today);
  const [studyProtocolTitle, setStudyProtocolTitle] = useState("");
  const [principalInvestigator, setPrincipalInvestigator] = useState([""]);
  const [typeOfReview, setTypeOfReview] = useState("");
  const [sponsor, setSponsor] = useState("");

  const [protocolTitle, setProtocolTitle] = useState("");
  const [tablePrincipalInvestigator, setTablePrincipalInvestigator] =
    useState([""]);
  const [objectivesGeneral, setObjectivesGeneral] = useState("");
  const [objectivesSpecific, setObjectivesSpecific] = useState("");
  const [researchDesign, setResearchDesign] = useState("");
  const [setting, setSetting] = useState("");
  const [subjectInclusion, setSubjectInclusion] = useState("");
  const [subjectExclusion, setSubjectExclusion] = useState("");
  const [samplingProcedures, setSamplingProcedures] = useState("");
  const [interventionsAndComparisons, setInterventionsAndComparisons] =
    useState("");
  const [dataGathering, setDataGathering] = useState("");
  const [variables, setVariables] = useState("");
  const [sampleSizeComputation, setSampleSizeComputation] = useState("");
  const [dataHandlingAnalysis, setDataHandlingAnalysis] = useState("");
  const [ethicalConsiderations, setEthicalConsiderations] = useState("");

  const [preparedMembers, setPreparedMembers] = useSubmittedByMembers();

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
          <div>REC_FO_0028</div>
          <div>Control No. {controlNo || "_________"}</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", marginBottom: "14px" }}>
        Ethics Study Protocol Information Form
      </h3>

      <div style={topFieldsWrap}>
        <div style={fieldRow}>
          <label style={fieldLabel}>Protocol Submission Date</label>
          <input
            type="date"
            style={dateInputStyle}
            value={protocolSubmissionDate}
            onChange={(e) => setProtocolSubmissionDate(e.target.value)}
          />
        </div>

        <div style={fieldRow}>
          <label style={fieldLabel}>Study Protocol Title</label>
          <textarea
            style={textareaStyle}
            value={studyProtocolTitle}
            onChange={(e) => setStudyProtocolTitle(e.target.value)}
            onInput={autoExpand}
          />
        </div>

        <div style={fieldRow}>
          <div style={fixedLineWrap}>
            UIC-REC Reference Number: <strong>Protocol Code (UIC-REC)</strong>
          </div>
        </div>

        <div style={fieldRow}>
          <label style={fieldLabel}>Principal Investigator</label>
          <MemberListInput values={principalInvestigator} onChange={setPrincipalInvestigator} placeholder="Enter investigator name" />
        </div>

        <div style={fieldRow}>
          <label style={fieldLabel}>Type of Review</label>
          <input
            style={inputStyle}
            value={typeOfReview}
            onChange={(e) => setTypeOfReview(e.target.value)}
          />
          <div style={hintText}>(full board or expedited)</div>
        </div>

        <div style={fieldRow}>
          <div style={fixedLineWrap}>
            Primary Reviewers <strong>UIC-REC</strong>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fixedLineWrap}>
            Secondary Reviewers (Members) <strong>UIC-REC</strong>
          </div>
        </div>

        <div style={fieldRow}>
          <label style={fieldLabel}>Sponsor</label>
          <textarea
            style={textareaStyle}
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            onInput={autoExpand}
          />
        </div>

        <div style={fieldRow}>
          <div style={fixedLineWrap}>
            Quorum Status <strong>UIC-REC</strong>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fixedLineWrap}>
            Conflict of Interest <strong>UIC-REC</strong>
          </div>
        </div>
      </div>

      <table style={infoTable}>
        <tbody>
          <tr>
            <td style={tdLabel}>Protocol Title</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={protocolTitle}
                onChange={(e) => setProtocolTitle(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Principal Investigator</td>
            <td style={tdInput}>
              <MemberListInput values={tablePrincipalInvestigator} onChange={setTablePrincipalInvestigator} placeholder="Enter investigator name" />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Objectives</td>
            <td style={tdInput}>
              <div style={nestedFieldWrap}>
                <span style={nestedFieldLabel}>General:</span>
                <textarea
                  style={tableTextareaStyle}
                  value={objectivesGeneral}
                  onChange={(e) => setObjectivesGeneral(e.target.value)}
                  onInput={autoExpand}
                />
              </div>
              <div style={{ ...nestedFieldWrap, marginTop: "8px" }}>
                <span style={nestedFieldLabel}>Specific:</span>
                <textarea
                  style={tableTextareaStyle}
                  value={objectivesSpecific}
                  onChange={(e) => setObjectivesSpecific(e.target.value)}
                  onInput={autoExpand}
                />
              </div>
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Research Design</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={researchDesign}
                onChange={(e) => setResearchDesign(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Setting</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Subject Inclusion</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={subjectInclusion}
                onChange={(e) => setSubjectInclusion(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Subject Exclusion</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={subjectExclusion}
                onChange={(e) => setSubjectExclusion(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Sampling Procedures</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={samplingProcedures}
                onChange={(e) => setSamplingProcedures(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Interventions and Comparisons</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={interventionsAndComparisons}
                onChange={(e) => setInterventionsAndComparisons(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Data Gathering</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={dataGathering}
                onChange={(e) => setDataGathering(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Variables</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Sample Size Computation</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={sampleSizeComputation}
                onChange={(e) => setSampleSizeComputation(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Data Handling and Analysis</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={dataHandlingAnalysis}
                onChange={(e) => setDataHandlingAnalysis(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={tdLabel}>Ethical Considerations</td>
            <td style={tdInput}>
              <textarea
                style={tableTextareaStyle}
                value={ethicalConsiderations}
                onChange={(e) => setEthicalConsiderations(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p style={groupNote}>
        *If GROUP, be sure all members affix their names and signature, too.
      </p>

      <SubmittedByTable
        title="Prepared by (Signature over Printed Name):"
        members={preparedMembers}
        onChange={setPreparedMembers}
      />

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

const topFieldsWrap: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  marginBottom: "14px",
};

const fieldRow: React.CSSProperties = {
  marginBottom: "8px",
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  marginBottom: "2px",
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
  minHeight: "24px",
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

const hintText: React.CSSProperties = {
  fontSize: "11px",
  marginTop: "2px",
};

const fixedLineWrap: React.CSSProperties = {
  borderBottom: "1px solid black",
  paddingBottom: "2px",
  fontWeight: 600,
};

const infoTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  border: "1px solid black",
};

const tdLabel: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontWeight: "bold",
  width: "28%",
  verticalAlign: "top",
  background: "#f5f5f5",
};

const tdInput: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  verticalAlign: "top",
};

const tableTextareaStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  minHeight: "22px",
  outline: "none",
  padding: 0,
};

const nestedFieldWrap: React.CSSProperties = {
  display: "block",
};

const nestedFieldLabel: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: "2px",
};

const groupNote: React.CSSProperties = {
  marginTop: "10px",
  fontSize: "11px",
  fontStyle: "italic",
  fontWeight: 700,
  color: "#c50000",
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

export default EthicsStudyProtocolInformationForm;
