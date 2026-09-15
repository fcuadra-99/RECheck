import { useState, useEffect } from "react";
import MemberListInput from "./MemberListInput";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";
import type { FormProps } from "./FormViewer";

function EthicsApplicationProcedure({ protocolCode, researcherName, advisorName, proposalTitle, proposalId, formName, savedData = {}, onSave, readOnlyAdvisor, advisorMode }: FormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const today = new Date().toISOString().split("T")[0];
  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [researchTitle, setResearchTitle] = useState<string>(s.researchTitle ?? proposalTitle ?? "");
  const [facultyResearchers, setFacultyResearchers] = useState<string[]>(s.facultyResearchers ?? (advisorName ? [advisorName] : [""]));
  const [studentResearchers, setStudentResearchers] = useState<string[]>(s.studentResearchers ?? (researcherName ? [researcherName] : [""]));
  const [sponsor, setSponsor] = useState<string>(s.sponsor ?? "");
  const [dateSubmitted, setDateSubmitted] = useState<string>(s.dateSubmitted ?? today);
  const [dateReceived, setDateReceived] = useState<string>(s.dateReceived ?? today);
  const [vulnerablePopulation, setVulnerablePopulation] = useState<string>(s.vulnerablePopulation ?? "");
  const [otherVulnerable, setOtherVulnerable] = useState<string>(s.otherVulnerable ?? "");
  const [submittedMembers, setSubmittedMembers] = useSubmittedByMembers(s.submittedMembers ?? (researcherName ? [{ name: researcherName, signature: "" }] : undefined));
  const [endorsedMembers, setEndorsedMembers] = useSubmittedByMembers(s.endorsedMembers ?? (advisorName ? [{ name: advisorName, signature: "" }] : undefined));
  const [dateFiled, setDateFiled] = useState<string>(s.dateFiled ?? today);

  // Sync advisor name once it arrives async (only if not already saved locally)
  useEffect(() => {
    if (advisorName && !s.endorsedMembers) setEndorsedMembers([{ name: advisorName, signature: "" }]);
    if (advisorName && !s.facultyResearchers) setFacultyResearchers([advisorName]);
    if (advisorName) save({ ...(s.endorsedMembers ? {} : { endorsedMembers: [{ name: advisorName, signature: "" }] }), ...(s.facultyResearchers ? {} : { facultyResearchers: [advisorName] }) });
  }, [advisorName]);

  const vulnerableOptions = [
    "Pregnant Women",
    "Elderly",
    "Adolescents",
    "Children",
    "Refugees",
    "Prisoners",
    "Those who cannot give consent (unconscious)",
    "Persons with mental or behavioral disorders",
    "Persons with disability",
  ];

  const checklist = [
    "The risks and the benefits for the research participants are discussed in the protocol",
    "The protocol describes how the communities from which the participants are to be drawn likely to benefit from the research",
    "The protocol describes whether the research outcome/s is/are likely to benefit communities beyond the research population",
    "The design is free of undue inducements to participate in the research",
    "The recruitment procedure includes adequate protection for the privacy and psychosocial needs of the individuals",
    "The protocol has adequate provisions to ensure the confidentiality of participants' data",
    "The protocol provides that the participants are free not to participate for whatever reasons or leave the research at any time without penalty",
    "The protocol, when needed, ensures the availability of a counselor or a psychologist or a spiritual adviser to provide appropriate intervention to research participants during and after the research",
    "The protocol includes the provision in handling possible adverse reactions associated with the research (medical, physical)",
    "Provisions are present in the proposal for recruiting participants incapable of reading and signing to the written consent form (e.g. illiterate patients). (Please explain by using extra sheet/s of paper)",
    "Provisions are present in the proposal for recruiting participants incapable of giving personal consent (e.g. because of cultural factors, children or adolescents less than 18 years old, participants with mental illness, etc.) and to express their decision. (Please explain by using extra sheet/s of paper)",
  ];

  const questionnaireSubItems = [
    "English and in the local language",
    "Written in lay language, and easily understood",
    "relevant to answer the research questions",
    "worded sensitively",
  ];

  const [answers, setAnswers] = useState<string[]>(
    s.answers ?? Array(checklist.length + 4).fill(""),
  );

  useEffect(() => { if (savedData.answers) setAnswers(savedData.answers); }, [savedData]);

  // Save autofill values on mount if not already persisted
  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.researchTitle && proposalTitle) patch.researchTitle = proposalTitle;
    if (!s.studentResearchers && researcherName) patch.studentResearchers = [researcherName];
    if (!s.submittedMembers && researcherName) patch.submittedMembers = [{ name: researcherName, signature: "" }];
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const handleAnswer = (index: number, value: string) => {
    if (advisorMode) return;
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
          <div>REC_FO_0027</div>
          <div>Control No. {controlNo || "_________"}</div>
        </div>
      </div>

      <h3 style={{ textAlign: "center", marginTop: "12px" }}>
        Ethics Application Procedure
      </h3>
      <p style={{ textAlign: "center", fontSize: "11px", fontStyle: "italic" }}>
        (Studies involving human populations)
      </p>
      <p style={{ textAlign: "center", fontSize: "11px" }}>
        * (Studies involving animals and microorganisms are not required to
        accomplish this form)
      </p>

      <div style={importantNote}>
        <strong>IMPORTANT:</strong> All fields <u>must be completed.</u>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={labelCell}>Control No.:</td>
            <td style={inputCell}>
              <input
                style={{ ...inputStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                value={controlNo}
                readOnly={advisorMode}
                onChange={(e) => { if (!advisorMode) { setControlNo(e.target.value); save({ controlNo: e.target.value }); } }}
              />
            </td>
          </tr>

          <tr>
            <td style={labelCell}>Research Title:</td>
            <td style={inputCell}>
              <textarea
                style={{ ...textareaStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                value={researchTitle}
                readOnly={advisorMode}
                onChange={(e) => { if (!advisorMode) { setResearchTitle(e.target.value); save({ researchTitle: e.target.value }); } }}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={labelCell}>Faculty Researchers:</td>
            <td style={inputCell}>
              <MemberListInput values={facultyResearchers} onChange={(v) => { if (!advisorMode) { setFacultyResearchers(v); save({ facultyResearchers: v }); } }} placeholder="Enter faculty researcher name" readOnly={advisorMode} />
            </td>
          </tr>

          <tr>
            <td style={labelCell}>Student Researchers:</td>
            <td style={inputCell}>
              <MemberListInput values={studentResearchers} onChange={(v) => { if (!advisorMode) { setStudentResearchers(v); save({ studentResearchers: v }); } }} placeholder="Enter student researcher name" readOnly={advisorMode} />
            </td>
          </tr>

          <tr>
            <td style={labelCell}>Name of Sponsor (if applicable):</td>
            <td style={inputCell}>
              <textarea
                style={{ ...textareaStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                value={sponsor}
                readOnly={advisorMode}
                onChange={(e) => { if (!advisorMode) { setSponsor(e.target.value); save({ sponsor: e.target.value }); } }}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={inputCell}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "none", width: "50%", padding: "0 10px 0 0" }}>
                      <span style={label}>Date Submitted:</span>
                      <input
                        type="date"
                        style={{ ...dateInputStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                        value={dateSubmitted}
                        readOnly={advisorMode}
                        onChange={(e) => { if (!advisorMode) { setDateSubmitted(e.target.value); save({ dateSubmitted: e.target.value }); } }}
                      />
                    </td>
                    <td style={{ border: "none", width: "50%", padding: "0 0 0 10px" }}>
                      <span style={label}>Date Received:</span>
                      <input
                        type="date"
                        style={{ ...dateInputStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                        value={dateReceived}
                        readOnly={advisorMode}
                        onChange={(e) => { if (!advisorMode) { setDateReceived(e.target.value); save({ dateReceived: e.target.value }); } }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: "16px" }}>
        <strong>Item 1:</strong> UNDERLINE the vulnerable population being studied:
        <div style={{ marginTop: "6px", marginLeft: "16px" }}>
          <div style={{ marginBottom: "6px" }}>
            {vulnerableOptions.map((option) => (
              <label key={option} style={{ display: "block", marginBottom: "4px", cursor: advisorMode ? "not-allowed" : "pointer" }}>
                <input
                  type="checkbox"
                  disabled={advisorMode}
                  checked={vulnerablePopulation.includes(option)}
                  onChange={(e) => {
                    if (advisorMode) return;
                    let updated: string;
                    if (e.target.checked) {
                      updated = vulnerablePopulation ? vulnerablePopulation + ", " + option : option;
                    } else {
                      updated = vulnerablePopulation.split(", ").filter((p) => p !== option).join(", ");
                    }
                    setVulnerablePopulation(updated);
                    save({ vulnerablePopulation: updated });
                  }}
                />{" "}
                {option}
              </label>
            ))}
            <label style={{ display: "block", marginTop: "6px", cursor: advisorMode ? "not-allowed" : "pointer" }}>
              <strong>Other; Please specify:</strong>
              <input
                type="text"
                style={{ ...inputStyle, marginLeft: "8px", minWidth: "200px", ...(advisorMode ? lockedFieldStyle : {}) }}
                value={otherVulnerable}
                readOnly={advisorMode}
                onChange={(e) => { if (!advisorMode) { setOtherVulnerable(e.target.value); save({ otherVulnerable: e.target.value }); } }}
              />
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <table style={checklistTable}>
          <thead>
            <tr>
              <th style={{ ...checklistHeadCell, width: "5%" }}></th>
              <th style={{ ...checklistHeadCell, width: "75%" }}></th>
              <th style={{ ...checklistHeadCell, width: "6%" }}>C</th>
              <th style={{ ...checklistHeadCell, width: "6%" }}>NC</th>
              <th style={{ ...checklistHeadCell, width: "8%" }}>N/A</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item, index) => (
              <tr key={index}>
                <td style={{ ...checklistItemCell, width: "5%" }}>
                  <strong>{index + 2}</strong>
                </td>
                <td style={{ ...checklistItemCell, width: "75%" }}>{item}</td>
                <td style={responseCell}>
                  <input type="radio" value="C" disabled={advisorMode} checked={answers[index] === "C"} onChange={(e) => handleAnswer(index, e.target.value)} />
                </td>
                <td style={responseCell}>
                  <input type="radio" value="NC" disabled={advisorMode} checked={answers[index] === "NC"} onChange={(e) => handleAnswer(index, e.target.value)} />
                </td>
                <td style={responseCell}>
                  <input type="radio" value="N/A" disabled={advisorMode} checked={answers[index] === "N/A"} onChange={(e) => handleAnswer(index, e.target.value)} />
                </td>
              </tr>
            ))}

            <tr>
              <td style={{ ...checklistItemCell, width: "5%" }}><strong>13</strong></td>
              <td colSpan={4} style={{ ...checklistItemCell, width: "95%" }}>
                <strong>Questionnaires, diary cards, etc. are being used in the research</strong>
              </td>
            </tr>

            {questionnaireSubItems.map((subItem, subIndex) => (
              <tr key={`sub-${subIndex}`}>
                <td style={{ ...checklistItemCell, width: "5%" }}>
                  <strong>a.{String.fromCharCode(97 + subIndex)}</strong>
                </td>
                <td style={{ ...checklistItemCell, width: "75%" }}>{subItem}</td>
                <td style={responseCell}>
                  <input type="radio" value="C" disabled={advisorMode} checked={answers[checklist.length + subIndex] === "C"} onChange={(e) => handleAnswer(checklist.length + subIndex, e.target.value)} />
                </td>
                <td style={responseCell}>
                  <input type="radio" value="NC" disabled={advisorMode} checked={answers[checklist.length + subIndex] === "NC"} onChange={(e) => handleAnswer(checklist.length + subIndex, e.target.value)} />
                </td>
                <td style={responseCell}>
                  <input type="radio" value="N/A" disabled={advisorMode} checked={answers[checklist.length + subIndex] === "N/A"} onChange={(e) => handleAnswer(checklist.length + subIndex, e.target.value)} />
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
      </div>

      <SubmittedByTable members={submittedMembers} onChange={(v) => { setSubmittedMembers(v); save({ submittedMembers: v }); }} proposalId={proposalId} formName={formName} readOnly={advisorMode} />

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
        <input
          type="date"
          style={{ ...inputStyle, marginTop: "6px", ...(advisorMode ? lockedFieldStyle : {}) }}
          value={dateFiled}
          readOnly={advisorMode}
          onChange={(e) => { if (!advisorMode) { setDateFiled(e.target.value); save({ dateFiled: e.target.value }); } }}
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

const container: React.CSSProperties = { width: "210mm", minHeight: "297mm", padding: "20mm", margin: "0 auto", background: "white", boxSizing: "border-box", fontSize: "12px", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" };
const labelCell: React.CSSProperties = { padding: "8px", fontWeight: "bold", width: "25%", verticalAlign: "top", background: "#f5f5f5" };
const inputCell: React.CSSProperties = { padding: "8px", verticalAlign: "top" };
const label: React.CSSProperties = { fontWeight: "bold", display: "block", marginBottom: "4px", fontSize: "12px" };
const inputStyle: React.CSSProperties = { border: "none", borderBottom: "1px solid black", width: "100%", outline: "none", fontFamily: "inherit" };
const textareaStyle: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid black", resize: "none", overflow: "hidden", fontFamily: "inherit", minHeight: "40px" };
const dateInputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "none", borderBottom: "1px solid black", fontFamily: "inherit" };
const importantNote: React.CSSProperties = { marginBottom: "12px", fontSize: "12px", padding: "8px", background: "#fff3cd", border: "1px solid #ffc107" };
const checklistTable: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid black", marginTop: "8px" };
const checklistItemCell: React.CSSProperties = { border: "1px solid black", padding: "6px", verticalAlign: "top", fontSize: "12px", lineHeight: 1.4 };
const checklistHeadCell: React.CSSProperties = { border: "1px solid black", padding: "6px", textAlign: "center", background: "#f0f0f0", fontWeight: 700 };
const responseCell: React.CSSProperties = { border: "1px solid black", padding: "6px", textAlign: "center", width: "6%" };
const legendText: React.CSSProperties = { marginTop: "8px", fontSize: "11px" };
const legendComplied: React.CSSProperties = { color: "#c50000", fontWeight: 700 };
const legendNotComplied: React.CSSProperties = { color: "#b56a00", fontWeight: 700 };
const legendNA: React.CSSProperties = { fontWeight: 700 };
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
const lockedFieldStyle: React.CSSProperties = { background: "#f5f5f5", color: "#555", cursor: "not-allowed" };

export default EthicsApplicationProcedure;
