import React, { useState } from "react";
import SignatureCell from "./SignatureCell";
import type { FormProps } from "./FormViewer";

const ProtocolInformationForm: React.FC<FormProps> = ({ protocolCode, researcherName, proposalTitle, proposalId, formName, advisorMode, readOnlyAdvisor, savedData = {}, onSave }) => {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState<string>(s.title ?? proposalTitle ?? "");
  const [researchers, setResearchers] = useState<string>(s.researchers ?? researcherName ?? "");
  const [controlNo] = useState<string>(s.controlNo ?? protocolCode ?? "");
  const [institution, setInstitution] = useState<string>(s.institution ?? "");
  const [researchConductedBy, setResearchConductedBy] = useState<string>(s.researchConductedBy ?? researcherName ?? "");
  const [signature, setSignature] = useState<string>(s.signature ?? "");
  const [dateSigned, setDateSigned] = useState<string>(s.dateSigned ?? today);
  // ✅ NEW STATES FOR SAMPLE TEXT
  const [purpose, setPurpose] = useState(
    "This study aims to predict the retirement decision among employees in private HEI in Davao City in terms of their socio-economic and demographic profile, psychological and organizational factors including social security benefits. It also aims to develop a model of retirement decision among employees of private HEIs in Davao City.",
  );
  const [isPurposeEdited, setIsPurposeEdited] = useState(false);

  const [benefits, setBenefits] = useState(
    "This study can generate relevant information which can be useful to public and private administrators, human resource managers, and policy-makers. The results, discussions, and findings from this study can spark evidence-based information which can be used by government agencies such as the Department of Labor and Employment (DOLE), Social Security Services (SSS), CHED, and DepEd for policy-debate and initiative for policy proposal in partnership and collaboration with private HEIs.",
  );
  const [isBenefitsEdited, setIsBenefitsEdited] = useState(false);
  const [publicDataStatement, setPublicDataStatement] = useState(
    "We will keep your records for this study confidential as far as permitted by law. Any identifiable information obtained in connection with this study will remain confidential, except if necessary to protect your rights or welfare. This certificate means that the researcher can resist the release of information about your participation to people who are not connected with the study. When the results of the research are published or discussed in conferences, no identifiable information will be used.",
  );
  const [isPublicDataStatementEdited, setIsPublicDataStatementEdited] =
    useState(false);
  const [contactStatement, setContactStatement] = useState(
    "If you have any questions or concerns about the research, please feel free to contact the researcher at the University of the Immaculate Conception, Bonifacio St., Davao City through telephone number 227-8286 local 131 or mobile phone number _________ or through email at ____________________; or if you need to see her adviser, Mr. ____________ he can be located at the Office of the College of Computer Studies (CCS), University of the Immaculate Conception, F. Selga St., Davao City.",
  );
  const [isContactStatementEdited, setIsContactStatementEdited] =
    useState(false);

  const page: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    fontSize: "12px",
    color: "black",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  };

  const td: React.CSSProperties = {
    border: "1px solid black",
    padding: "6px",
    verticalAlign: "top",
  };

  const label: React.CSSProperties = {
    fontWeight: "bold",
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid black",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "12px",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid black",
    outline: "none",
    resize: "none",
    overflow: "hidden",
    fontFamily: "inherit",
    fontSize: "12px",
  };

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = target.scrollHeight + "px";
  };

  const sampleTextStyle: React.CSSProperties = {
    ...textareaStyle,
    color: "red",
    fontStyle: "italic",
    lineHeight: 1.35,
  };

  const sectionHeading: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: "12px",
    marginBottom: "4px",
  };


  const lockedFieldStyle: React.CSSProperties = {
    background: "#f5f5f5",
    color: "#555",
    cursor: "not-allowed",
  };

  return (
    <div>
      {/* PAGE 1 */}
      <div style={page}>
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
            <div>REC_FO_0033</div>
            <div>Control No.: {controlNo || "_______"}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <b>Protocol Information Form for Exemption (PIFE)</b>
        </div>

        <table style={table}>
          <tbody>
            <tr>
              <td style={td}>
                <span style={label}>
                  Protocol Title (indicate the title of the study)
                </span>
                <textarea
                  style={{ ...textareaStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                  value={title}
                  readOnly={advisorMode}
                  onChange={(e) => { if (!advisorMode) { setTitle(e.target.value); save({ title: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <span style={label}>Name of the Researcher(s)</span>
                <textarea
                  style={{ ...textareaStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                  value={researchers}
                  readOnly={advisorMode}
                  onChange={(e) => { if (!advisorMode) { setResearchers(e.target.value); save({ researchers: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <span style={label}>Institution:</span>
                <input
                  style={{ ...inputStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                  value={institution}
                  readOnly={advisorMode}
                  onChange={(e) => { if (!advisorMode) { setInstitution(e.target.value); save({ institution: e.target.value }); } }}
                />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <span style={label}>Control No.:</span>
                <input
                  style={{ ...inputStyle, ...lockedFieldStyle }}
                  value={controlNo}
                  readOnly={true}
                  placeholder="Auto-filled by system"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        <table style={table}>
          <tbody>
            <tr>
              <td style={td}>
                <b>INTRODUCTION</b>
                <br />
                This research study conducted by{" "}
                <span style={{ fontStyle: "italic", color: "#666" }}>
                  {researchConductedBy || "[Researcher Name]"}
                </span>
                , at the University of the Immaculate Conception, does not
                involve human participants nor identifiable human tissue,
                biological samples and data. Thus, he/she is applying for the
                exemption of this protocol from the expedited or full review of
                the UIC-REC, because there is no possibility of harm arising as
                a result of the conduct of the research and/or the information
                being collected is available from the public domain, or are
                secondary data sets that must remain non-identifiable during
                their access, use, and dissemination.
              </td>
            </tr>

            {/* ✅ FIXED PURPOSE */}
            <tr>
              <td style={td}>
                <b>PURPOSE OF THE STUDY</b>
                <br />
                <textarea
                  style={{
                    ...textareaStyle,
                    color: isPurposeEdited ? "black" : "red",
                    ...(advisorMode ? lockedFieldStyle : {}),
                  }}
                  value={purpose}
                  readOnly={advisorMode}
                  onFocus={() => {
                    if (!isPurposeEdited && !advisorMode) {
                      setPurpose("");
                      setIsPurposeEdited(true);
                    }
                  }}
                  onChange={(e) => { if (!advisorMode) { setPurpose(e.target.value); save({ purpose: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>

            {/* ✅ FIXED BENEFITS */}
            <tr>
              <td style={td}>
                <b>POTENTIAL BENEFITS TO PARTICIPANTS AND/OR TO SOCIETY</b>
                <br />
                <textarea
                  style={{
                    ...textareaStyle,
                    color: isBenefitsEdited ? "black" : "red",
                    ...(advisorMode ? lockedFieldStyle : {}),
                  }}
                  value={benefits}
                  readOnly={advisorMode}
                  onFocus={() => {
                    if (!isBenefitsEdited && !advisorMode) {
                      setBenefits("");
                      setIsBenefitsEdited(true);
                    }
                  }}
                  onChange={(e) => { if (!advisorMode) { setBenefits(e.target.value); save({ benefits: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <div style={sectionHeading}>
                  USE OF PUBLICLY AVAILABLE DATA OR SECONDARY DATA
                </div>
                <textarea
                  style={{
                    ...(isPublicDataStatementEdited
                      ? textareaStyle
                      : sampleTextStyle),
                    minHeight: "110px",
                    ...(advisorMode ? lockedFieldStyle : {}),
                  }}
                  value={publicDataStatement}
                  readOnly={advisorMode}
                  onFocus={() => {
                    if (!isPublicDataStatementEdited && !advisorMode) {
                      setPublicDataStatement("");
                      setIsPublicDataStatementEdited(true);
                    }
                  }}
                  onChange={(e) => { if (!advisorMode) { setPublicDataStatement(e.target.value); save({ publicDataStatement: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>
            <tr>
              <td style={td}>
                <div style={sectionHeading}>
                  INVESTIGATOR&apos;S CONTACT INFORMATION
                </div>
                <textarea
                  style={{
                    ...(isContactStatementEdited
                      ? textareaStyle
                      : sampleTextStyle),
                    minHeight: "110px",
                    ...(advisorMode ? lockedFieldStyle : {}),
                  }}
                  value={contactStatement}
                  readOnly={advisorMode}
                  onFocus={() => {
                    if (!isContactStatementEdited && !advisorMode) {
                      setContactStatement("");
                      setIsContactStatementEdited(true);
                    }
                  }}
                  onChange={(e) => { if (!advisorMode) { setContactStatement(e.target.value); save({ contactStatement: e.target.value }); } }}
                  onInput={autoResize}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: "40px" }}>
          <div style={sectionHeading}>Name and Signature of the Investigator/Researcher</div>
          <table style={table}>
            <thead>
              <tr>
                <th style={td}>Name</th>
                <th style={td}>Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>
                  <input
                    style={{ ...inputStyle, ...(advisorMode ? lockedFieldStyle : {}) }}
                    value={researchConductedBy}
                    readOnly={advisorMode}
                    onChange={(e) => { if (!advisorMode) { setResearchConductedBy(e.target.value); save({ researchConductedBy: e.target.value }); } }}
                    placeholder="Researcher Name"
                  />
                </td>
                <td style={td}>
                  <SignatureCell
                    value={signature}
                    onChange={(v) => { setSignature(v); save({ signature: v }); }}
                    readOnly={readOnlyAdvisor}
                    proposalId={proposalId}
                    formName={formName}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div style={sectionHeading}>Date Signed</div>
          <input
            type="date"
            style={{ ...inputStyle, ...(advisorMode ? lockedFieldStyle : {}), width: "200px" }}
            value={dateSigned}
            readOnly={advisorMode}
            onChange={(e) => { if (!advisorMode) { setDateSigned(e.target.value); save({ dateSigned: e.target.value }); } }}
          />
        </div>

        <div style={footerWrap}>
          <span style={footerDot}>•</span>
          <span>Telephone No. (082) 227-82-86 (loc. 211)</span>
          <span style={footerDot}>•</span>
          <span>Email Address: rec@uic.edu.ph</span>
        </div>
      </div>
    </div>
  );
};

export default ProtocolInformationForm;
