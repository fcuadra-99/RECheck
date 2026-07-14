import { useState, useEffect } from "react";
import SignatureCell from "./SignatureCell";
import type { FormProps } from "./FormViewer";

export default function RECEndorsementForm({
  protocolCode, researcherName, advisorName, proposalTitle, savedData = {}, onSave, readOnlyAdvisor, advisorMode,
}: FormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [studentName, setStudentName] = useState<string>(s.studentName ?? researcherName ?? "");
  const [degreeProgram, setDegreeProgram] = useState<string>(s.degreeProgram ?? proposalTitle ?? "");
  const [adviserName, setAdviserName] = useState<string>(s.adviserName ?? advisorName ?? "");
  const [adviserSig, setAdviserSig] = useState<string>(s.adviserSig ?? "");

  // Sync advisor name once it arrives async (only if not already saved locally)
  useEffect(() => {
    if (advisorName && !s.adviserName) {
      setAdviserName(advisorName);
      save({ adviserName: advisorName });
    }
  }, [advisorName]);

  // Save autofill values on mount if not already persisted
  useEffect(() => {
    const patch: Record<string, any> = {};
    if (!s.controlNo && protocolCode) patch.controlNo = protocolCode;
    if (!s.studentName && researcherName) patch.studentName = researcherName;
    if (Object.keys(patch).length > 0) save(patch);
  }, []);

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div style={container}>
      <div style={headerWrap}>
        <div style={logoSection}>
          <div style={logoPlaceholder}>UIC Logo</div>
        </div>
        <div style={centerSection}>
          <div style={headerUniversity}>University of the Immaculate Conception</div>
          <div style={headerSchool}>GRADUATE SCHOOL</div>
          <div style={headerEthics}>ETHICS REVIEW</div>
        </div>
        <div style={rightSection}>
          <div style={formCodeBox}>
            <div>DGS – FO – 017</div>
            <div>Rev. 01 / 10/01/2016</div>
            <div>Approved by: IQAC</div>
          </div>
          <div style={controlWrap}>
            <span>Control No.:</span>
            <textarea rows={1}
            style={{ ...controlLine, ...(advisorMode ? lockedFieldStyle : {}) }}
            value={controlNo}
            readOnly={advisorMode}
            onChange={(e) => { if (!advisorMode) { setControlNo(e.target.value); save({ controlNo: e.target.value }); } }}
            onInput={autoExpand} />
          </div>
        </div>
      </div>

      <h3 style={titleStyle}>ENDORSEMENT FORM</h3>

      <div style={recipientBlock}>
        <div style={recipientName}>DR. MONA L. LAYA</div>
        <div>Chair - Research Ethics Committee (REC)</div>
        <div>University of the Immaculate Conception</div>
        <div>Bonifacio Street, Davao City</div>
        <div style={{ height: "12px" }} />
      </div>

      <p style={{ ...paragraph, fontWeight: 700 }}>Dear Dr. Laya,</p>
      <p style={{ ...paragraph, fontWeight: 700 }}>Praised be Jesus and Mary!</p>

      <div style={studentNameAndCaptionWrapper}>
        <div style={studentNameSentence}>
          <span>Endorsing to your good office, Mr./Ms.</span>
          <div style={studentNameFieldGroup}>
            <textarea rows={1}
              style={{ ...studentNameLine, ...(advisorMode ? lockedFieldStyle : {}) }}
              value={studentName}
              readOnly={advisorMode}
              onChange={(e) => { if (!advisorMode) { setStudentName(e.target.value); save({ studentName: e.target.value }); } }}
              onInput={autoExpand} />
            <div style={studentNameCaptionWrap}><div style={caption}>(Name of Student)</div></div>
          </div>
          <span>, of</span>
        </div>
      </div>

      <div style={degreeAndCaptionWrapper}>
        <div style={degreeSection}>
          <textarea rows={1}
            style={{ ...degreeLine, ...(advisorMode ? lockedFieldStyle : {}) }}
            value={degreeProgram}
            readOnly={advisorMode}
            onChange={(e) => { if (!advisorMode) { setDegreeProgram(e.target.value); save({ degreeProgram: e.target.value }); } }}
            onInput={autoExpand} />
          <span style={degreeText}>for the ethical consideration concerns.</span>
        </div>
        <div style={degreeNameCaptionWrap}><div style={caption}>(Name of Degree/Program)</div></div>
      </div>

      <div style={{ ...signSection, fontWeight: 700 }}>Endorsed by:</div>
      <table style={endorsedTable}>
        <thead>
          <tr>
            <th style={endorsedTh}>Name</th>
            <th style={endorsedTh}>Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={endorsedTd}>
              {readOnlyAdvisor ? (
                <div style={endorsedNameDisplay}>
                  {advisorName || "To be signed by adviser"}
                </div>
              ) : (
                <input style={endorsedNameInput} value={adviserName} placeholder="Enter name" onChange={(e) => { setAdviserName(e.target.value); save({ adviserName: e.target.value }); }} />
              )}
            </td>
            <td style={endorsedTd}>
              <SignatureCell value={adviserSig} onChange={(v) => { setAdviserSig(v); save({ adviserSig: v }); }} readOnly={readOnlyAdvisor} />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ ...notedWrap, fontWeight: 700 }}>Noted by:</div>
      <div style={{ ...notedWrap, fontWeight: "normal" }}>
        <div style={notedName}>DR. MARY JANE B. AMOGUIS</div>
        <div>Dean, Graduate School</div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = { width: "210mm", minHeight: "297mm", padding: "20mm", margin: "0 auto", background: "white", boxSizing: "border-box", fontSize: "13px", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" };
const headerWrap: React.CSSProperties = { display: "grid", gridTemplateColumns: "80px 1fr 180px", gap: "12px", marginBottom: "14px", alignItems: "flex-start" };
const logoSection: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center" };
const logoPlaceholder: React.CSSProperties = { width: "70px", height: "70px", border: "2px dashed #ccc", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#666", textAlign: "center", padding: "4px" };
const centerSection: React.CSSProperties = { textAlign: "center", paddingTop: "4px" };
const rightSection: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" };
const formCodeBox: React.CSSProperties = { border: "1.5px solid black", padding: "6px 8px", textAlign: "center", fontSize: "11px", lineHeight: 1.3, minWidth: "160px" };
const headerUniversity: React.CSSProperties = { fontWeight: 700, fontSize: "14px" };
const headerSchool: React.CSSProperties = { marginTop: "4px", fontWeight: 700, fontSize: "12px" };
const headerEthics: React.CSSProperties = { marginTop: "4px", fontWeight: 700, fontSize: "12px" };
const controlWrap: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: "8px", minWidth: "220px" };
const controlLine: React.CSSProperties = { width: "130px", border: "none", borderBottom: "1px solid black", outline: "none", resize: "none", overflow: "hidden", minHeight: "16px", lineHeight: 1.2, padding: 0 };
const titleStyle: React.CSSProperties = { textAlign: "center", margin: "6px 0 14px", fontSize: "20px", fontWeight: 700 };
const recipientBlock: React.CSSProperties = { lineHeight: 1.5, marginBottom: "10px" };
const recipientName: React.CSSProperties = { fontWeight: 700 };
const paragraph: React.CSSProperties = { margin: "8px 0", lineHeight: 1.5 };
const studentNameAndCaptionWrapper: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", margin: "8px 0" };
const studentNameSentence: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.5 };
const studentNameFieldGroup: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center" };
const studentNameLine: React.CSSProperties = { border: "none", borderBottom: "1px solid black", outline: "none", resize: "none", overflow: "hidden", minHeight: "16px", lineHeight: 1.2, width: "220px", padding: 0 };
const degreeAndCaptionWrapper: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0px" };
const degreeSection: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", lineHeight: 1.5 };
const degreeLine: React.CSSProperties = { border: "none", borderBottom: "1px solid black", outline: "none", resize: "none", overflow: "hidden", minHeight: "16px", lineHeight: 1.2, width: "360px", padding: 0 };
const degreeText: React.CSSProperties = { whiteSpace: "nowrap", paddingLeft: "4px" };
const studentNameCaptionWrap: React.CSSProperties = { width: "220px", marginBottom: "6px", marginTop: "2px" };
const degreeNameCaptionWrap: React.CSSProperties = { width: "360px", marginBottom: "6px", marginTop: "-2px" };
const caption: React.CSSProperties = { fontSize: "12px", textAlign: "center" };
const signSection: React.CSSProperties = { marginTop: "20px", marginBottom: "8px" };
const signLineWrap: React.CSSProperties = { width: "250px", marginBottom: "22px" };
const signatureLine: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid black", outline: "none", resize: "none", overflow: "hidden", minHeight: "16px", lineHeight: 1.2, padding: 0 };
const notedWrap: React.CSSProperties = { marginTop: "14px", lineHeight: 1.5 };
const notedName: React.CSSProperties = { fontWeight: 700 };
const lockedFieldStyle: React.CSSProperties = { background: "#f5f5f5", color: "#555", cursor: "not-allowed" };
const endorsedTable: React.CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "6px" };
const endorsedTh: React.CSSProperties = { border: "1px solid black", padding: "6px", background: "#f0f0f0", fontWeight: 700, fontSize: "12px", textAlign: "left" };
const endorsedTd: React.CSSProperties = { border: "1px solid black", padding: "6px", verticalAlign: "middle" };
const endorsedNameInput: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid black", outline: "none", fontFamily: "inherit", fontSize: "12px", background: "transparent" };
const endorsedNameDisplay: React.CSSProperties = { fontSize: "12px", minHeight: "16px", display: "flex", alignItems: "center", color: "#555" };
