import { useState } from "react";
import SubmittedByTable, { useSubmittedByMembers } from "./SubmittedByTable";
import SignatureCell from "./SignatureCell";

function EthicsMOAFormFullBoard() {
  const now = new Date();
  const day = now.getDate();
  const ordinal = day + (["th","st","nd","rd"][((day%100-20)%10)||((day%100>10&&day%100<14)?0:day%10)] || "th");
  const monthName = now.toLocaleString("default", { month: "long" });
  const autoDay = `${ordinal} day of ${monthName}`;
  const autoYear = String(now.getFullYear()).slice(2); // e.g. "25"

  const [controlNo, setControlNo] = useState("");
  const [signedDay, setSignedDay] = useState(autoDay);
  const [year, setYear] = useState(autoYear);
  const [researchers, setResearchers] = useSubmittedByMembers();
  const [witnesses, setWitnesses] = useSubmittedByMembers();
  const [monaSig, setMonaSig] = useState("");

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
              RESEARCH ETHICS COMMITTEE (REC)
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

      <table style={metaTable}>
        <tbody>
          <tr>
            <td style={labelCell}>Control No.:</td>
            <td style={inputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={controlNo}
                onChange={(e) => setControlNo(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={titleStyle}>Ethics Memorandum of Agreement</h3>

      <p style={paragraph}>
        We, the undersigned, agree to the following stipulations below as part
        of our compliance to the UIC-REC process:
      </p>

      <div style={bulletWrap}>
        <div style={bulletLine}>
          1. The researchers to communicate with UIC-REC if there are changes in
          the original protocol approved by UIC-REC.
        </div>
        <div style={bulletLine}>
          2. To submit a final report form to UIC-REC once the research study is
          complete.
        </div>
      </div>

      <p style={paragraph}>
        Signed this{" "}
        <textarea
          rows={1}
          style={{ ...inlineLineField, width: "150px" }}
          value={signedDay}
          onChange={(e) => setSignedDay(e.target.value)}
          onInput={autoExpand}
        />{" "}
        in the year of our Lord two thousand{" "}
        <textarea
          rows={1}
          style={{ ...inlineLineField, width: "90px" }}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          onInput={autoExpand}
        />{" "}
        in Davao City, Philippines.
      </p>

      <SubmittedByTable members={researchers} onChange={setResearchers} />

      <div style={witnessTitle}>Witnesses:</div>
      <SubmittedByTable members={witnesses} onChange={setWitnesses} />

      <div style={{ marginTop: "20px", fontWeight: 700, fontSize: "12px" }}>Noted by:</div>
      <table style={monaTable}>
        <thead>
          <tr>
            <th style={monaThName}>Name</th>
            <th style={monaThSig}>Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={monaTdName}>
              <div style={{ fontWeight: 700 }}>Dr. Mona L. Laya</div>
              <div style={{ fontSize: "11px" }}>Chair, UIC-Research Ethics Committee</div>
            </td>
            <td style={monaTdSig}>
              <SignatureCell value={monaSig} onChange={setMonaSig} />
            </td>
          </tr>
        </tbody>
      </table>

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

const metaTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "8px",
};

const labelCell: React.CSSProperties = {
  width: "20%",
  padding: "2px 8px 2px 0",
  verticalAlign: "bottom",
};

const inputCell: React.CSSProperties = {
  width: "80%",
  padding: "2px 0",
  verticalAlign: "bottom",
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 700,
  fontSize: "18px",
  margin: "8px 0 12px",
};

const paragraph: React.CSSProperties = {
  textAlign: "justify",
  lineHeight: 1.5,
  margin: "0 0 10px",
};

const bulletWrap: React.CSSProperties = {
  marginBottom: "10px",
};

const bulletLine: React.CSSProperties = {
  marginBottom: "6px",
  lineHeight: 1.45,
};

const inlineLineField: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.2,
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  padding: 0,
  verticalAlign: "bottom",
};

const lineField: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.2,
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  boxSizing: "border-box",
  padding: 0,
};

const witnessTitle: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: "6px",
  fontWeight: 700,
  fontSize: "12px",
};

const monaTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "6px",
};

const monaThName: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  background: "#f0f0f0",
  fontWeight: 700,
  fontSize: "12px",
  textAlign: "left",
  width: "45%",
};

const monaThSig: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  background: "#f0f0f0",
  fontWeight: 700,
  fontSize: "12px",
  textAlign: "left",
};

const monaTdName: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  verticalAlign: "middle",
  fontSize: "12px",
};

const monaTdSig: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  verticalAlign: "middle",
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

export default EthicsMOAFormFullBoard;
