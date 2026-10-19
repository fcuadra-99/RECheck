import { useRef, useState } from "react";

function EthicsMOAFormFullBoard() {
  const witnessOneRef = useRef<HTMLTextAreaElement>(null);
  const witnessTwoRef = useRef<HTMLTextAreaElement>(null);

  const [controlNo, setControlNo] = useState("");
  const [signedDay, setSignedDay] = useState("");
  const [year, setYear] = useState("");
  const [researcher, setResearcher] = useState("");
  const [witnessOne, setWitnessOne] = useState("");
  const [witnessTwo, setWitnessTwo] = useState("");

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const syncWitnessHeights = () => {
    const left = witnessOneRef.current;
    const right = witnessTwoRef.current;

    if (!left || !right) {
      return;
    }

    left.style.height = "auto";
    right.style.height = "auto";

    const height = Math.max(left.scrollHeight, right.scrollHeight);
    left.style.height = `${height}px`;
    right.style.height = `${height}px`;
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

      <table style={signatureTable}>
        <tbody>
          <tr>
            <td style={signatureSingleCell}>
              <textarea
                rows={1}
                style={lineField}
                value={researcher}
                onChange={(e) => setResearcher(e.target.value)}
                onInput={autoExpand}
              />
              <div style={signatureLabel}>Researcher</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={witnessTitle}>Witnesses:</div>
      <table style={witnessTable}>
        <tbody>
          <tr>
            <td style={witnessCell}>
              <textarea
                ref={witnessOneRef}
                rows={1}
                style={lineField}
                value={witnessOne}
                onChange={(e) => setWitnessOne(e.target.value)}
                onInput={syncWitnessHeights}
              />
              <div style={{ ...signatureLabel, fontWeight: 700 }}>
                Dr. Mona L. Laya
              </div>
              <div style={signatureLabel}>
                <strong>Chair, UIC-Research Ethics Committee</strong>
              </div>
            </td>
            <td style={witnessCell}>
              <textarea
                ref={witnessTwoRef}
                rows={1}
                style={lineField}
                value={witnessTwo}
                onChange={(e) => setWitnessTwo(e.target.value)}
                onInput={syncWitnessHeights}
              />
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

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "28px",
};

const signatureSingleCell: React.CSSProperties = {
  width: "45%",
  padding: "0 0 0 0",
  verticalAlign: "top",
};

const witnessTitle: React.CSSProperties = {
  marginTop: "30px",
  marginBottom: "10px",
};

const witnessTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const witnessCell: React.CSSProperties = {
  width: "50%",
  padding: "0 14px 0 0",
  verticalAlign: "top",
};

const signatureLabel: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "12px",
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
