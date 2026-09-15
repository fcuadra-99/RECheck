import { useState } from "react";

function RECEndorsementForm() {
  const [controlNo, setControlNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [adviserName, setAdviserName] = useState("");

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
          <div style={headerUniversity}>
            University of the Immaculate Conception
          </div>
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
            <textarea
              rows={1}
              style={controlLine}
              value={controlNo}
              onChange={(e) => setControlNo(e.target.value)}
              onInput={autoExpand}
            />
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
        <div style={{ height: "12px" }} />
      </div>

      <p style={{ ...paragraph, fontWeight: 700 }}>Dear Dr. Laya,</p>
      <p style={{ ...paragraph, fontWeight: 700 }}>
        Praised be Jesus and Mary!
      </p>

      <div style={studentNameAndCaptionWrapper}>
        <div style={studentNameSentence}>
          <span>Endorsing to your good office, Mr./Ms.</span>
          <div style={studentNameFieldGroup}>
            <textarea
              rows={1}
              style={studentNameLine}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onInput={autoExpand}
            />
            <div style={studentNameCaptionWrap}>
              <div style={caption}>(Name of Student)</div>
            </div>
          </div>
          <span>, of</span>
        </div>
      </div>

      <div style={degreeAndCaptionWrapper}>
        <div style={degreeSection}>
          <textarea
            rows={1}
            style={degreeLine}
            value={degreeProgram}
            onChange={(e) => setDegreeProgram(e.target.value)}
            onInput={autoExpand}
          />
          <span style={degreeText}>
            for the ethical consideration concerns.
          </span>
        </div>
        <div style={degreeNameCaptionWrap}>
          <div style={caption}>(Name of Degree/Program)</div>
        </div>
      </div>

      <div style={{ ...signSection, fontWeight: 700 }}>Endorsed by:</div>
      <div style={signLineWrap}>
        <textarea
          rows={1}
          style={signatureLine}
          value={adviserName}
          onChange={(e) => setAdviserName(e.target.value)}
          onInput={autoExpand}
        />
        <div style={caption}>Adviser</div>
      </div>

      <div style={{ ...notedWrap, fontWeight: 700 }}>Noted by:</div>
      <div style={{ ...notedWrap, fontWeight: "normal" }}>
        <div style={notedName}>DR. MARY JANE B. AMOGUIS</div>
        <div>Dean, Graduate School</div>
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
  fontSize: "13px",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
};

const headerWrap: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px 1fr 180px",
  gap: "12px",
  marginBottom: "14px",
  alignItems: "flex-start",
};

const logoSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoPlaceholder: React.CSSProperties = {
  width: "70px",
  height: "70px",
  border: "2px dashed #ccc",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  color: "#666",
  textAlign: "center",
  padding: "4px",
};

const centerSection: React.CSSProperties = {
  textAlign: "center",
  paddingTop: "4px",
};

const rightSection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-end",
};

const formCodeBox: React.CSSProperties = {
  border: "1.5px solid black",
  padding: "6px 8px",
  textAlign: "center",
  fontSize: "11px",
  lineHeight: 1.3,
  minWidth: "160px",
};

const headerUniversity: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "14px",
};

const headerSchool: React.CSSProperties = {
  marginTop: "4px",
  fontWeight: 700,
  fontSize: "12px",
};

const headerEthics: React.CSSProperties = {
  marginTop: "4px",
  fontWeight: 700,
  fontSize: "12px",
};

const controlWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  minWidth: "220px",
};

const controlLine: React.CSSProperties = {
  width: "130px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  lineHeight: 1.2,
  padding: 0,
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "6px 0 14px",
  fontSize: "20px",
  fontWeight: 700,
};

const recipientBlock: React.CSSProperties = {
  lineHeight: 1.5,
  marginBottom: "10px",
};

const recipientName: React.CSSProperties = {
  fontWeight: 700,
};

const paragraph: React.CSSProperties = {
  margin: "8px 0",
  lineHeight: 1.5,
};

const studentNameAndCaptionWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  margin: "8px 0",
};

const studentNameSentence: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
  lineHeight: 1.5,
};

const studentNameFieldGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const studentNameLine: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  lineHeight: 1.2,
  width: "220px",
  padding: 0,
};

const degreeAndCaptionWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "0px",
};

const degreeSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "8px 0",
  lineHeight: 1.5,
};

const degreeLine: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  lineHeight: 1.2,
  width: "360px",
  padding: 0,
};

const degreeText: React.CSSProperties = {
  whiteSpace: "nowrap",
  paddingLeft: "4px",
};

const studentNameCaptionWrap: React.CSSProperties = {
  width: "220px",
  marginBottom: "6px",
  marginTop: "2px",
};

const degreeNameCaptionWrap: React.CSSProperties = {
  width: "360px",
  marginBottom: "6px",
  marginTop: "-2px",
};

const caption: React.CSSProperties = {
  fontSize: "12px",
  textAlign: "center",
};

const signSection: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: "8px",
};

const signLineWrap: React.CSSProperties = {
  width: "250px",
  marginBottom: "22px",
};

const signatureLine: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  lineHeight: 1.2,
  padding: 0,
};

const notedWrap: React.CSSProperties = {
  marginTop: "14px",
  lineHeight: 1.5,
};

const notedName: React.CSSProperties = {
  fontWeight: 700,
};

export default RECEndorsementForm;
