import { useState } from "react";

function EthicsInformedConsentFormSample() {
  const [formFor, setFormFor] = useState("");
  const [researcherNames, setResearcherNames] = useState("");
  const [introResearcher, setIntroResearcher] = useState("");
  const [questionnaireReturnTo, setQuestionnaireReturnTo] = useState("");

  const [purposeText, setPurposeText] = useState(
    "This study aims to determine the relationship between supply chain agility and competitive advantage, moderated by information and communication technology capabilities, and the underlying implications of competitive advantage in drugstores in Region XI.",
  );
  const [purposeEdited, setPurposeEdited] = useState(false);

  const [proceduresText, setProceduresText] = useState(
    "- You are requested to sign this ICF to signify your voluntary participation.\n- You will answer the questionnaire for 30 minutes.\n- You can bring home the survey questionnaire to read thoroughly and carefully and answer completely.\n- You will return the survey questionnaire to the designated person/office.",
  );
  const [proceduresEdited, setProceduresEdited] = useState(false);

  const [risksText, setRisksText] = useState(
    "- The topic is not sensitive. However, if you are uncomfortable answering the survey questionnaire items, you may opt not to answer questions that make you feel any psychological or emotional distress.\n- You may withdraw as a participant from the study at any time.\n- Your welfare will be prioritized during the study.",
  );
  const [risksEdited, setRisksEdited] = useState(false);

  const [benefitsText, setBenefitsText] = useState(
    "This study can generate relevant information that can be useful to pharmacists, managers, pharmacy owners, researchers, and other entrepreneurs in Region XI. Findings may contribute to improving healthcare services, patient outcomes, and evidence-based interventions.",
  );
  const [benefitsEdited, setBenefitsEdited] = useState(false);

  const [privacyText, setPrivacyText] = useState(
    "The study will ensure the privacy and confidentiality of your information in accordance with the Data Privacy Act of 2012 (RA 10173). Your responses will be handled with strict confidentiality, and no personally identifiable information will be disclosed in publications or presentations.",
  );
  const [privacyEdited, setPrivacyEdited] = useState(false);

  const [voluntarinessText, setVoluntarinessText] = useState(
    "Your participation is voluntary. Refusal to participate will involve no penalty or loss of benefits to which you are otherwise entitled. You may withdraw your consent at any time without penalty.",
  );
  const [voluntarinessEdited, setVoluntarinessEdited] = useState(false);

  const [reimbursementText, setReimbursementText] = useState(
    "You may be given a reasonable incentive as a sign of gratitude for helping accomplish the study.",
  );
  const [reimbursementEdited, setReimbursementEdited] = useState(false);

  const [investigators, setInvestigators] = useState([{ name: "", phone: "", email: "", address: "" }]);
  const [advisers, setAdvisers] = useState([{ name: "", phone: "", email: "", address: "" }]);
  const [participantRights, setParticipantRights] = useState(
    "If you have questions, concerns, or complaints about your rights as a research participant, please contact the University of the Immaculate Conception Research Ethics Committee at (082) 227-4860 local 211.",
  );
  const [participantRightsEdited, setParticipantRightsEdited] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [participantName, setParticipantName] = useState("");
  const [participantDateSigned, setParticipantDateSigned] = useState(today);
  const [consentObtainerName, setConsentObtainerName] = useState("");
  const [consentObtainerDateSigned, setConsentObtainerDateSigned] = useState(today);

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
          <div>REC_FO_0031</div>
          <div>Control No.: _________</div>
        </div>
      </div>

      <h3 style={titleStyle}>Ethics Informed Consent Form (ICF)</h3>

      <div style={lineFieldWrap}>
        <span>Informed Consent Form for </span>
        <textarea
          rows={1}
          style={lineTextarea}
          value={formFor}
          onChange={(e) => setFormFor(e.target.value)}
          onInput={autoExpand}
        />
      </div>

      <div style={lineFieldWrap}>
        <span>Name of the Researcher(s): </span>
        <textarea
          rows={1}
          style={lineTextarea}
          value={researcherNames}
          onChange={(e) => setResearcherNames(e.target.value)}
          onInput={autoExpand}
        />
      </div>

      <div style={lineFieldWrap}>
        <span>Institution: </span>
        <strong>UNIVERSITY OF THE IMMACULATE CONCEPTION</strong>
      </div>

      <SectionTitle text="INTRODUCTION" />
      <p style={paragraph}>
        You are invited to participate in a research study conducted by
        <textarea
          rows={1}
          style={{ ...lineTextarea, margin: "0 6px", width: "180px" }}
          value={introResearcher}
          onChange={(e) => setIntroResearcher(e.target.value)}
          onInput={autoExpand}
        />
        at the University of the Immaculate Conception, because you fit the
        inclusion criteria for informants of our study.
      </p>
      <p style={paragraph}>
        Your participation is completely voluntary. Please read the information
        below, and ask questions about anything you do not understand, before
        deciding whether to participate. Please take as much time as you need to
        read the consent form. You may also decide to discuss participation with
        your family or friends.
      </p>
      <p style={paragraph}>
        If you decide to participate, you will be asked to sign this form. You
        will be given a copy of this form.
      </p>

      <SectionTitle text="PURPOSE OF THE STUDY" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: purposeEdited ? "normal" : "italic",
        }}
        value={purposeText}
        onChange={(e) => {
          setPurposeText(e.target.value);
          setPurposeEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="STUDY PROCEDURES" />
      <p style={paragraph}>If you volunteer to participate in this study:</p>
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: proceduresEdited ? "normal" : "italic",
        }}
        value={proceduresText}
        onChange={(e) => {
          setProceduresText(e.target.value);
          setProceduresEdited(true);
        }}
        onInput={autoExpand}
      />
      <div style={lineFieldWrap}>
        <span>You will return the survey questionnaire to </span>
        <textarea
          rows={1}
          style={{ ...lineTextarea, width: "220px" }}
          value={questionnaireReturnTo}
          onChange={(e) => setQuestionnaireReturnTo(e.target.value)}
          onInput={autoExpand}
        />
        <span>.</span>
      </div>

      <SectionTitle text="POTENTIAL RISKS AND DISCOMFORTS" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: risksEdited ? "normal" : "italic",
        }}
        value={risksText}
        onChange={(e) => {
          setRisksText(e.target.value);
          setRisksEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="POTENTIAL BENEFITS TO PARTICIPANTS AND/OR TO SOCIETY" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: benefitsEdited ? "normal" : "italic",
        }}
        value={benefitsText}
        onChange={(e) => {
          setBenefitsText(e.target.value);
          setBenefitsEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="DATA PRIVACY AND CONFIDENTIALITY" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: privacyEdited ? "normal" : "italic",
        }}
        value={privacyText}
        onChange={(e) => {
          setPrivacyText(e.target.value);
          setPrivacyEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="VOLUNTARINESS OF PARTICIPATION AND RIGHTS TO WITHDRAW FROM THE RESEARCH" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: voluntarinessEdited ? "normal" : "italic",
        }}
        value={voluntarinessText}
        onChange={(e) => {
          setVoluntarinessText(e.target.value);
          setVoluntarinessEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="REIMBURSEMENT AND COMPENSATION" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: reimbursementEdited ? "normal" : "italic",
        }}
        value={reimbursementText}
        onChange={(e) => {
          setReimbursementText(e.target.value);
          setReimbursementEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="INVESTIGATOR'S and ADVISER'S CONTACT INFORMATION" />
      <ContactTable label="Investigator(s)" entries={investigators} onChange={setInvestigators} />
      <ContactTable label="Adviser(s)" entries={advisers} onChange={setAdvisers} />

      <SectionTitle text="RIGHTS OF RESEARCH PARTICIPANT" />
      <textarea
        style={{
          ...sectionTextarea,
          fontStyle: participantRightsEdited ? "normal" : "italic",
        }}
        value={participantRights}
        onChange={(e) => {
          setParticipantRights(e.target.value);
          setParticipantRightsEdited(true);
        }}
        onInput={autoExpand}
      />

      <SectionTitle text="RESEARCH PARTICIPANT'S CONSENT" />
      <p style={paragraph}>
        I have read the information provided above. I have been given a chance
        to ask questions. My questions have been answered to my satisfaction,
        and I agree to participate in this study. I have been given a copy of
        this form. I can withdraw my consent at any time and discontinue
        participation without penalty.
      </p>

      <table style={signatureTable}>
        <tbody>
          <tr>
            <td style={signatureCellWide}>
              <textarea
                rows={1}
                style={lineTextarea}
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onInput={autoExpand}
              />
              <div style={signatureLabel}>
                Signature above Printed Name of Participant
              </div>
            </td>
            <td style={signatureCellDate}>
              <input
                type="date"
                style={dateInputStyle}
                value={participantDateSigned}
                onChange={(e) => setParticipantDateSigned(e.target.value)}
              />
              <div style={signatureLabel}>Date Signed</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={subSectionLabel}>
        To be accomplished by the Researcher Obtaining Consent:
      </div>
      <p style={paragraph}>
        I have explained the research to the participant and answered all of
        his/her questions. I believe that he/she understands the information
        described in this document and freely consents to participate.
      </p>

      <table style={signatureTable}>
        <tbody>
          <tr>
            <td style={signatureCellWide}>
              <textarea
                rows={1}
                style={lineTextarea}
                value={consentObtainerName}
                onChange={(e) => setConsentObtainerName(e.target.value)}
                onInput={autoExpand}
              />
              <div style={signatureLabel}>Name of Person Obtaining Consent</div>
            </td>
            <td style={signatureCellDate}>
              <input
                type="date"
                style={dateInputStyle}
                value={consentObtainerDateSigned}
                onChange={(e) => setConsentObtainerDateSigned(e.target.value)}
              />
              <div style={signatureLabel}>Date Signed</div>
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

interface ContactEntry {
  name: string;
  phone: string;
  email: string;
  address: string;
}

function ContactTable({ label, entries, onChange }: { label: string; entries: ContactEntry[]; onChange: (e: ContactEntry[]) => void }) {
  const update = (i: number, field: keyof ContactEntry, val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const add = () => onChange([...entries, { name: "", phone: "", email: "", address: "" }]);
  const remove = (i: number) => {
    if (entries.length === 1) { onChange([{ name: "", phone: "", email: "", address: "" }]); return; }
    onChange(entries.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}>{label}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            {["Name", "Contact No.", "Email", "Address", ""].map((h, i) => (
              <th key={i} style={{ border: "1px solid black", padding: "4px 6px", background: "#f0f0f0", fontSize: "11px", fontWeight: 700, textAlign: "left", width: i === 4 ? "24px" : undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              {(["name", "phone", "email", "address"] as (keyof ContactEntry)[]).map((field) => (
                <td key={field} style={{ border: "1px solid black", padding: "4px 6px" }}>
                  <input
                    style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: "11px", background: "transparent" }}
                    value={e[field]}
                    onChange={(ev) => update(i, field, ev.target.value)}
                  />
                </td>
              ))}
              <td style={{ border: "1px solid black", padding: "2px", textAlign: "center", width: "24px" }}>
                <button type="button" onClick={() => remove(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#999", fontSize: "12px", lineHeight: 1 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={add} style={{ display: "inline-flex", alignItems: "center", gap: "3px", border: "none", background: "transparent", cursor: "pointer", color: "#666", fontSize: "11px", padding: "3px 0", fontFamily: "inherit" }}>
        + Add {label.replace("(s)", "")}
      </button>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <div style={sectionTitle}>{text}</div>;
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

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "12px",
};

const lineFieldWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  marginBottom: "8px",
};

const lineTextarea: React.CSSProperties = {
  border: "none",
  borderBottom: "1px solid black",
  padding: 0,
  margin: 0,
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.2,
  verticalAlign: "bottom",
  minWidth: "220px",
  flex: 1,
  resize: "none",
  overflow: "hidden",
  minHeight: "16px",
  boxSizing: "border-box",
};

const sectionTitle: React.CSSProperties = {
  marginTop: "12px",
  marginBottom: "6px",
  fontWeight: 700,
  fontSize: "12px",
};

const paragraph: React.CSSProperties = {
  margin: "0 0 8px",
  lineHeight: 1.45,
  textAlign: "justify",
};

const sectionTextarea: React.CSSProperties = {
  width: "100%",
  border: "1px solid #999",
  borderRadius: "2px",
  padding: "8px",
  resize: "none",
  overflow: "hidden",
  fontFamily: "inherit",
  fontSize: "12px",
  lineHeight: 1.45,
  boxSizing: "border-box",
  minHeight: "72px",
  marginBottom: "8px",
};

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "8px",
};

const signatureCellWide: React.CSSProperties = {
  width: "70%",
  padding: "8px 10px 6px 0",
  verticalAlign: "top",
};

const signatureCellDate: React.CSSProperties = {
  width: "30%",
  padding: "8px 0 6px 10px",
  verticalAlign: "top",
};

const signatureLabel: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
};

const subSectionLabel: React.CSSProperties = {
  marginTop: "10px",
  fontWeight: 700,
};

const dateInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderBottom: "1px solid black",
  fontFamily: "inherit",
  outline: "none",
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

export default EthicsInformedConsentFormSample;
