import React, { useState } from "react";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";
import type { FormProps } from "./FormViewer";

const EthicsMOAForm: React.FC<FormProps> = ({ protocolCode, researcherName, proposalId, formName, savedData = {}, onSave }) => {
  const now = new Date();
  const day = now.getDate();
  const ordinal = day + (["th","st","nd","rd"][((day%100-20)%10)||((day%100>10&&day%100<14)?0:day%10)] || "th");
  const monthName = now.toLocaleString("default", { month: "long" });
  const autoDay = `${ordinal} day of ${monthName}`;
  const autoYear = String(now.getFullYear()).slice(2);

  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [controlNo, setControlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [date, setDate] = useState<string>(s.date ?? autoDay);
  const [year, setYear] = useState<string>(s.year ?? autoYear);
  const [researchers, setResearchers] = useSubmittedByMembers(s.researchers ?? (researcherName ? [{ name: researcherName, signature: "" }] : undefined));
  const [witnesses, setWitnesses] = useSubmittedByMembers(s.witnesses);

  const container: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm",
    margin: "0 auto",
    background: "white",
    boxSizing: "border-box",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    fontSize: "14px",
    color: "black",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
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

  const td: React.CSSProperties = {
    border: "1px solid transparent", // keep structure without visible grid
    padding: "6px",
    verticalAlign: "top",
  };

  const title: React.CSSProperties = {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "18px",
    paddingBottom: "10px",
  };

  const paragraph: React.CSSProperties = {
    textAlign: "justify",
    lineHeight: "1.6",
  };

  const inputInline: React.CSSProperties = {
    border: "none",
    borderBottom: "1px solid black",
    outline: "none",
    display: "inline-block",
  };

  const inputFull: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid black",
    outline: "none",
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
          <div>REC_FO_0036</div>
          <div>Control No.: {controlNo || "_______"}</div>
        </div>
      </div>

      <table style={table}>
        <tbody>
          <tr>
            <td style={td}>Control No.: </td>
            <td style={td}>
              <input
                style={inputFull}
                value={controlNo}
                onChange={(e) => setControlNo(e.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* TITLE */}
      <table style={table}>
        <tbody>
          <tr>
            <td style={{ ...td, ...title }}>Ethics Memorandum of Agreement</td>
          </tr>
        </tbody>
      </table>

      {/* INTRO */}
      <table style={table}>
        <tbody>
          <tr>
            <td style={{ ...td, ...paragraph }}>
              We, the undersigned, agree to the following stipulations below as
              part of our compliance to the UIC-REC process:
            </td>
          </tr>
        </tbody>
      </table>

      {/* LIST */}
      <table style={table}>
        <tbody>
          <tr>
            <td style={td}>
              1. The researchers to communicate with UIC-REC if there are
              changes in the original protocol approved by UIC-REC.
            </td>
          </tr>
          <tr>
            <td style={td}>
              2. To submit a final report form to UIC-REC once the research
              study is complete.
            </td>
          </tr>
        </tbody>
      </table>

      {/* DATE LINE */}
      <table style={table}>
        <tbody>
          <tr>
            <td style={{ ...td, ...paragraph }}>
              Signed this{" "}
              <input
                style={{ ...inputInline, width: "120px" }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />{" "}
              in the year of our Lord two thousand{" "}
              <input
                style={{ ...inputInline, width: "80px" }}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />{" "}
              in Davao City, Philippines.
            </td>
          </tr>
        </tbody>
      </table>

      {/* RESEARCHER SIGNATURES */}
      <SubmittedByTable members={researchers} onChange={(v) => { setResearchers(v); save({ researchers: v }); }} proposalId={proposalId} formName={formName} />

      {/* WITNESSES */}
      <div style={{ marginTop: "20px", fontWeight: "bold", fontSize: "12px" }}>Witnesses:</div>
      <SubmittedByTable members={witnesses} onChange={(v) => { setWitnesses(v); save({ witnesses: v }); }} title="" proposalId={proposalId} formName={formName} />

      {/* DR. MONA */}
      <div style={{ marginTop: "20px", fontWeight: "bold", fontSize: "12px" }}>Noted by:</div>
      <div style={{ marginTop: "6px", fontSize: "12px" }}>
        <div style={{ fontWeight: 700 }}>Dr. Mona L. Laya</div>
        <div style={{ fontSize: "11px" }}>Chair, UIC-Research Ethics Committee</div>
      </div>
      <div style={footerWrap}>
        <span style={footerDot}>•</span>
        <span>Telephone No. (082) 227-82-86 (loc. 211)</span>
        <span style={footerDot}>•</span>
        <span>Email Address: rec@uic.edu.ph</span>
      </div>
    </div>
  );
};

export default EthicsMOAForm;
