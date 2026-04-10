import { useState, useEffect } from "react";
import MemberListInput from "./MemberListInput";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";
import type { FormProps } from "./FormViewer";

const basicRequirements = [
  "Updated Curriculum Vitae (CV) of the Adviser(s) and the Researcher (At least 1 copy)",
  "All grades [certificate of grades - from the registrar] or screenshot of ONLINE Grades",
  "Photocopy of the receipt (1 copy)",
  "Ethics Review Endorsement Form (duly signed)",
];

const fullBoardRequirements = [
  "Revised copy of the manuscript (plain BLACK text)",
  "Minutes of the proposal defense",
  "Routing Form",
  "Ethics Review Checklist (REC_FO_0026)",
  "Application Form [with human] (REC_FO_0027)",
  "Study Protocol Information Form (REC_FO_0028)",
  "Informed Consent Checklist Form (REC_FO_0029)",
  "Informed Consent Form when Questionnaires are used (REC_FO_0030)",
  "Sample Informed Consent (REC_FO_0031)",
  "Sample Assent Form (REC_FO_0034) (for below 18-year-old respondents)",
  "Sample MOA for Authorship (REC_FO_0035) / External (REC_FO_0036)",
];

const checklist = [
  "The study has social value (e.g. scientific value, relevance to national /community needs).",
  "The study has adequate background.",
  "The research questions are supported by review of literature.",
  "The study objectives are Specific, Measurable, Attainable, Realistic, Time-bound.",
  "The population of the participants/respondents are identified and defined (inclusion and exclusion criteria).",
  "The selection of study participants is described (sampling technique).",
  "The sample size is justified.",
  "The plan for data analysis is described.",
  "The research needs to be carried out with human participants/respondents.",
  "The study has a vulnerability issue.",
  "Appropriate mechanisms/interventions are in place to address the vulnerability issue/s.",
  "There are risks/ probable harms to the human participants in the study.",
  "There are measures to mitigate the risks.",
  "The informed consent procedure / form is adequate and culturally appropriate.",
  "The investigator/s are adequately trained and have sufficient experience to undertake the study.",
  "There is a disclosure of conflict of interest.",
  "The research facilities are adequate.",
];

export default function EthicsProtocolChecklist({
  protocolCode, researcherName, advisorName, proposalTitle, proposalId, formName, savedData = {}, onSave, readOnlyAdvisor,
}: FormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const today = new Date().toISOString().split("T")[0];
  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [protocolTitle, setProtocolTitle] = useState<string>(s.protocolTitle ?? proposalTitle ?? "");
  const [principalInvestigator, setPrincipalInvestigator] = useState<string[]>(s.principalInvestigator ?? (researcherName ? [researcherName] : [""]));
  const [protocolSubmissionDate, setProtocolSubmissionDate] = useState<string>(s.protocolSubmissionDate ?? today);
  const [verifiedBy, setVerifiedBy] = useState<string>(s.verifiedBy ?? today);
  const [researchTitle, setResearchTitle] = useState<string>(s.researchTitle ?? proposalTitle ?? "");
  const [facultyResearchers, setFacultyResearchers] = useState<string[]>(s.facultyResearchers ?? [""]);
  const [studentResearchers, setStudentResearchers] = useState<string[]>(s.studentResearchers ?? (researcherName ? [researcherName] : [""]));
  const [sponsor, setSponsor] = useState<string>(s.sponsor ?? "");
  const [dateSubmitted, setDateSubmitted] = useState<string>(s.dateSubmitted ?? today);
  const [dateReceived, setDateReceived] = useState<string>(s.dateReceived ?? today);
  const [submittedMembers, setSubmittedMembers] = useSubmittedByMembers(s.submittedMembers);
  const [endorsedMembers, setEndorsedMembers] = useSubmittedByMembers(s.endorsedMembers ?? (advisorName ? [{ name: advisorName, signature: "" }] : undefined));
  const [dateFiled, setDateFiled] = useState<string>(s.dateFiled ?? today);
  const [answers, setAnswers] = useState<string[]>(s.answers ?? Array(checklist.length).fill(""));

  // Sync answers from savedData (handles async load)
  useEffect(() => {
    if (savedData.answers) setAnswers(savedData.answers);
  }, [savedData]);

  // Sync advisor name once it arrives async (only if not already saved locally)
  useEffect(() => {
    if (advisorName && !s.endorsedMembers) setEndorsedMembers([{ name: advisorName, signature: "" }]);
  }, [advisorName]);

  // Save autofill values on mount if not already persisted
  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.protocolTitle && proposalTitle) patch.protocolTitle = proposalTitle;
    if (!s.researchTitle && proposalTitle) patch.researchTitle = proposalTitle;
    if (!s.principalInvestigator && researcherName) patch.principalInvestigator = [researcherName];
    if (!s.studentResearchers && researcherName) patch.studentResearchers = [researcherName];
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const handleAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
    save({ answers: updated });
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
            <div style={headerUniversityName}>University of the Immaculate Conception</div>
            <div style={headerCommitteeName}>Research Ethics Committee (REC)</div>
            <div style={headerAddress}>Bonifacio Street, Davao City, Philippines</div>
          </div>
        </div>
        <div style={headerCodeBox}>
          <div>REC_FO_0026</div>
          <div>Control No. {controlNo || "_________"}</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center" }}>Ethics Protocol Checklist</h3>
      <h4 style={sectionHeading}>STUDY PROTOCOL INFORMATION</h4>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: "2px solid black" }}>
        <tbody>
          <tr>
            <td style={tdLabel}>Control No. / Protocol Code</td>
            <td colSpan={3} style={tdInput}><input style={inputStyle} value={controlNo} onChange={(e) => { setControlNo(e.target.value); save({ controlNo: e.target.value }); }} /></td>
          </tr>
          <tr>
            <td style={tdLabel}>Study Protocol Title<br /><span style={subText}>(Title of Study)</span></td>
            <td colSpan={3} style={tdInput}><textarea style={textareaStyle} value={protocolTitle} onChange={(e) => { setProtocolTitle(e.target.value); save({ protocolTitle: e.target.value }); }} onInput={autoExpand} /></td>
          </tr>
          <tr>
            <td style={tdLabel}>Principal Investigator<br /><span style={subText}>(Researcher/s)</span></td>
            <td colSpan={3} style={tdInput}><MemberListInput values={principalInvestigator} onChange={(v) => { setPrincipalInvestigator(v); save({ principalInvestigator: v }); }} placeholder="Enter investigator name" /></td>
          </tr>
          <tr>
            <td style={tdLabel}>Study Protocol Submission Date</td>
            <td style={tdInput}><input type="date" style={dateInputStyle} value={protocolSubmissionDate} onChange={(e) => { setProtocolSubmissionDate(e.target.value); save({ protocolSubmissionDate: e.target.value }); }} /></td>
            <td style={tdLabel}>Verified Complete By</td>
            <td style={tdInput}><input type="date" style={inputStyle} value={verifiedBy} onChange={(e) => { setVerifiedBy(e.target.value); save({ verifiedBy: e.target.value }); }} /></td>
          </tr>
        </tbody>
      </table>

      <div style={requirementsBlock}>
        <h4 style={requirementsHeading}>Basic Requirements <em style={emphasisText}>(must submit)</em></h4>
        <ul style={bulletList}>{basicRequirements.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4 style={{ ...requirementsHeading, marginTop: "14px" }}>Full Board/Expedited</h4>
        <ul style={bulletList}>{fullBoardRequirements.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={importantNote}><strong>IMPORTANT:</strong> All fields <u>must be completed.</u></div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <tbody>
            <tr><td style={tdInput}><span style={label}>Research Title:</span><textarea style={textareaStyle} value={researchTitle} onChange={(e) => { setResearchTitle(e.target.value); save({ researchTitle: e.target.value }); }} onInput={autoExpand} /></td></tr>
            <tr><td style={tdInput}><span style={label}>Faculty Researchers:</span><MemberListInput values={facultyResearchers} onChange={(v) => { setFacultyResearchers(v); save({ facultyResearchers: v }); }} placeholder="Enter faculty researcher name" /></td></tr>
            <tr><td style={tdInput}><span style={label}>Student Researchers:</span><MemberListInput values={studentResearchers} onChange={(v) => { setStudentResearchers(v); save({ studentResearchers: v }); }} placeholder="Enter student researcher name" /></td></tr>
            <tr><td style={tdInput}><span style={label}>Name of Sponsor (if applicable):</span><input style={inputStyle} value={sponsor} onChange={(e) => { setSponsor(e.target.value); save({ sponsor: e.target.value }); }} /></td></tr>
            <tr>
              <td style={tdInput}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "none", width: "50%", padding: "0 10px 0 0" }}><span style={label}>Date Submitted:</span><input type="date" style={inputStyle} value={dateSubmitted} onChange={(e) => { setDateSubmitted(e.target.value); save({ dateSubmitted: e.target.value }); }} /></td>
                      <td style={{ border: "none", width: "50%", padding: "0 0 0 10px" }}><span style={label}>Date Received:</span><input style={inputStyle} value={dateReceived} onChange={(e) => { setDateReceived(e.target.value); save({ dateReceived: e.target.value }); }} /></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "18px" }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}></th>
            <th style={th}>YES</th>
            <th style={th}>NO</th>
            <th style={th}>N/A</th>
          </tr>
        </thead>
        <tbody>
          {checklist.map((item, i) => (
            <tr key={i}>
              <td style={td}>{i + 1}</td>
              <td style={{ ...td, textAlign: "left" }}>{item}</td>
              <td style={td}><input type="radio" checked={answers[i] === "yes"} onChange={() => handleAnswer(i, "yes")} /></td>
              <td style={td}><input type="radio" checked={answers[i] === "no"} onChange={() => handleAnswer(i, "no")} /></td>
              <td style={td}><input type="radio" checked={answers[i] === "na"} onChange={() => handleAnswer(i, "na")} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={legendText}><strong>Legend:</strong> <span style={legendComplied}>C</span> - Complied, <span style={legendNotComplied}> NC</span> - Not Complied, <span style={legendNA}> N/A</span> - Not Applicable</p>

      <SubmittedByTable members={submittedMembers} onChange={(v) => { setSubmittedMembers(v); save({ submittedMembers: v }); }} proposalId={proposalId} formName={formName} />

      <SubmittedByTable
        title="Endorsed by / Recommended by (Research Adviser / Mentor):"
        members={endorsedMembers}
        onChange={(v) => { setEndorsedMembers(v); save({ endorsedMembers: v }); }}
        readOnly={readOnlyAdvisor}
        proposalId={proposalId}
        formName={formName}
      />

      <div style={dateFiledSectionWrap}>
        <strong>Date Filed:</strong>
        <input type="date" style={{ ...inputStyle, marginTop: "6px" }} value={dateFiled} onChange={(e) => { setDateFiled(e.target.value); save({ dateFiled: e.target.value }); }} />
      </div>

      <div style={footerWrap}>
        <span style={footerDot}>•</span><span>Telephone No. (082) 227-82-86 (loc. 211)</span>
        <span style={footerDot}>•</span><span>Email Address: rec@uic.edu.ph</span>
      </div>
    </div>
  );
}

const container: React.CSSProperties = { width: "210mm", minHeight: "297mm", padding: "20mm", margin: "0 auto", background: "white", boxSizing: "border-box", fontSize: "12px", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" };
const tdLabel: React.CSSProperties = { border: "1px solid black", padding: "6px", fontWeight: "bold", width: "25%", verticalAlign: "middle", background: "#f5f5f5" };
const tdInput: React.CSSProperties = { border: "1px solid black", padding: "6px", verticalAlign: "middle" };
const td: React.CSSProperties = { border: "1px solid black", padding: "5px", textAlign: "center" };
const th: React.CSSProperties = { border: "1px solid black", padding: "5px", background: "#f0f0f0", textAlign: "center" };
const subText: React.CSSProperties = { fontWeight: "normal", fontSize: "11px" };
const label: React.CSSProperties = { fontWeight: "bold", display: "block", marginBottom: "2px" };
const inputStyle: React.CSSProperties = { border: "none", borderBottom: "1px solid black", width: "100%", outline: "none" };
const textareaStyle: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid black", resize: "none", overflow: "hidden", fontFamily: "inherit" };
const dateInputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" };
const sectionHeading: React.CSSProperties = { margin: "0 0 8px", textAlign: "center", fontSize: "14px", letterSpacing: "0.2px" };
const requirementsBlock: React.CSSProperties = { marginTop: "18px", padding: "10px 12px", border: "1px solid #d9d9d9", background: "#fafafa" };
const requirementsHeading: React.CSSProperties = { margin: "0 0 8px", fontSize: "15px", fontWeight: 700 };
const emphasisText: React.CSSProperties = { fontWeight: 400 };
const bulletList: React.CSSProperties = { margin: "0", paddingLeft: "22px", lineHeight: 1.5 };
const legendText: React.CSSProperties = { marginTop: "6px", fontSize: "11px" };
const legendComplied: React.CSSProperties = { color: "#c50000", fontWeight: 700 };
const legendNotComplied: React.CSSProperties = { color: "#b56a00", fontWeight: 700 };
const legendNA: React.CSSProperties = { fontWeight: 700 };
const importantNote: React.CSSProperties = { marginBottom: "8px", fontSize: "12px" };
const dateFiledSectionWrap: React.CSSProperties = { marginTop: "10px", border: "1px solid black", padding: "8px" };
const headerWrap: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", background: "#f1f1f1", border: "1px solid #d7d7d7", padding: "12px 16px", marginBottom: "14px" };
const headerLeft: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px" };
const logoBadge: React.CSSProperties = { width: "56px", height: "56px", borderRadius: "50%", border: "2px solid #e05b94", color: "#e05b94", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", background: "#fff" };
const headerUniversityName: React.CSSProperties = { fontSize: "14px", fontWeight: 600, lineHeight: 1.25 };
const headerCommitteeName: React.CSSProperties = { fontSize: "14px", fontStyle: "italic", fontWeight: 700, lineHeight: 1.25 };
const headerAddress: React.CSSProperties = { fontSize: "13px", lineHeight: 1.25 };
const headerCodeBox: React.CSSProperties = { border: "1px solid #4d6895", padding: "10px 14px", minWidth: "170px", fontSize: "15px", lineHeight: 1.45, background: "#fff" };
const footerWrap: React.CSSProperties = { marginTop: "16px", background: "#f1f1f1", border: "1px solid #d7d7d7", padding: "9px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" };
const footerDot: React.CSSProperties = { color: "#e05b94", fontSize: "18px", lineHeight: 1 };
