import { useState } from "react";
import SignatureCell from "./SignatureCell";

interface EthicalClearanceFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
}

export default function EthicalClearanceForm({ savedData = {}, onSave }: EthicalClearanceFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    date: s.date ?? "",
    nameOfResearcher: s.nameOfResearcher ?? "",
    officeAddress: s.officeAddress ?? "University of the Immaculate Conception\nBonifacio St., Davao City",
    re: s.re ?? "",
    protocolCode: s.protocolCode ?? "",
    subject: s.subject ?? "Ethical Clearance",
    salutationName: s.salutationName ?? "",
    protocolVersion: s.protocolVersion ?? "",
    informedConsentVersion: s.informedConsentVersion ?? "",
    reviewType: s.reviewType ?? "",
    reviewMeetingDate: s.reviewMeetingDate ?? "",
    grantedFrom: s.grantedFrom ?? "",
    grantedTo: s.grantedTo ?? "",
    chairName: s.chairName ?? "Mona A. Lava, PhD",
    chairTitle: s.chairTitle ?? "Chair, UIC-REC",
    dateSigned: s.dateSigned ?? "",
  });

  const [chairSignature, setChairSignature] = useState<string>(s.chairSignature ?? "");

  const setField = (key: string, value: string) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ [key]: value, fields: next });
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div style={pageContainer}>
      <table style={topHeaderTable}>
        <tbody>
          <tr>
            <td style={logoCell}>
              <img src="/logoo.png" alt="UIC" style={logoImage} />
            </td>
            <td style={identityCell}>
              <div style={uniTitle}>University of the Immaculate Conception</div>
              <div style={smallLine}>Bonifacio St., Davao City</div>
              <div style={smallLine}>www.uic.edu.ph</div>
            </td>
          </tr>
          <tr>
            <td style={committeeBandCell} colSpan={2}>
              Research Ethics Committee
            </td>
          </tr>
        </tbody>
      </table>

      <table style={docTitleTable}>
        <tbody>
          <tr>
            <td style={docTitleCell}>ETHICAL CLEARANCE</td>
          </tr>
        </tbody>
      </table>

      <table style={bodyTable}>
        <tbody>
          <tr>
            <td style={bodyCell}>
              <div style={lineWrap}>
                <span style={label}>Date:</span>
                <input style={lineInput} value={fields.date} onChange={(e) => setField("date", e.target.value)} />
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={label}>NAME OF THE RESEARCHER</div>
              <textarea
                rows={2}
                style={lineTextarea}
                value={fields.nameOfResearcher}
                onChange={(e) => setField("nameOfResearcher", e.target.value)}
                onInput={autoExpand}
              />
              <textarea
                rows={2}
                style={{ ...lineTextarea, marginTop: "4px" }}
                value={fields.officeAddress}
                onChange={(e) => setField("officeAddress", e.target.value)}
                onInput={autoExpand}
              />
              <div style={lineWrap}>
                <span style={plainLabel}>Re:</span>
                <input style={lineInput} value={fields.re} onChange={(e) => setField("re", e.target.value)} />
              </div>
              <div style={lineWrap}>
                <span style={plainLabel}>Protocol Code:</span>
                <input style={lineInput} value={fields.protocolCode} onChange={(e) => setField("protocolCode", e.target.value)} />
              </div>
              <div style={lineWrap}>
                <span style={plainLabel}>Subject:</span>
                <input style={lineInput} value={fields.subject} onChange={(e) => setField("subject", e.target.value)} />
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={lineWrap}>
                <span style={plainLabel}>Dear Mr. or Ms.</span>
                <input style={lineInputShort} value={fields.salutationName} onChange={(e) => setField("salutationName", e.target.value)} />
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={paragraph}>
                This is to acknowledge receipt of your protocol version
                <input style={inlineInputSmall} value={fields.protocolVersion} onChange={(e) => setField("protocolVersion", e.target.value)} />
                and informed consent form (ICF) version
                <input style={inlineInputSmall} value={fields.informedConsentVersion} onChange={(e) => setField("informedConsentVersion", e.target.value)} />.
                These new documents have incorporated the recommendations of the UIC-REC, as stipulated in the DECISION LETTER emailed to you,
                to improve the initial protocol and ICF that you submitted earlier for the
                <input style={inlineInputWide} value={fields.reviewType} onChange={(e) => setField("reviewType", e.target.value)} />
                review, which took place on
                <input style={inlineInputSmall} value={fields.reviewMeetingDate} onChange={(e) => setField("reviewMeetingDate", e.target.value)} />.
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={paragraph}>
                Upon further scrutiny of and deliberation on the revised document, the UIC-REC is convinced that your
                research/investigation embodies a process that is responsible and ethically accountable; thus,
                ETHICAL CLEARANCE with a validity period of one year,
                <input style={inlineInputSmall} value={fields.grantedFrom} onChange={(e) => setField("grantedFrom", e.target.value)} />
                to
                <input style={inlineInputSmall} value={fields.grantedTo} onChange={(e) => setField("grantedTo", e.target.value)} />,
                has been granted.
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={paragraph}>
                Please be advised to submit the Final Report Form once you completed the study.
                Likewise, submit a report using the forms should any part of your research methodology and ICF,
                as outlined in your submitted approved documents, change in any way.
              </div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <table style={listTable}>
                <tbody>
                  <tr><td style={listCell}>A.</td><td style={listCell}>Protocol Amendment</td></tr>
                  <tr><td style={listCell}>B.</td><td style={listCell}>Progress Report</td></tr>
                  <tr><td style={listCell}>C.</td><td style={listCell}>Protocol Deviation/Protocol Violation</td></tr>
                  <tr><td style={listCell}>D.</td><td style={listCell}>Negative Event Report</td></tr>
                  <tr><td style={listCell}>E.</td><td style={listCell}>Early Study Termination Report</td></tr>
                  <tr><td style={listCell}>F.</td><td style={listCell}>Application for Renewal of Ethical Clearance two months before expiry</td></tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={paragraph}>The UIC-REC wishes you all the best with this research undertaking.</div>
            </td>
          </tr>

          <tr>
            <td style={bodyCell}>
              <div style={{ ...paragraph, marginTop: "22px" }}>Very truly yours,</div>
              <table style={signatureTable}>
                <tbody>
                  <tr>
                    <td style={signatureCell}>
                      <div style={signaturePadWrap}>
                        <SignatureCell
                          value={chairSignature}
                          onChange={(val) => {
                            setChairSignature(val);
                            save({ chairSignature: val });
                          }}
                        />
                      </div>
                      <input
                        style={signatureLineInput}
                        value={fields.chairName}
                        onChange={(e) => setField("chairName", e.target.value)}
                      />
                      <div style={caption}>Name and Signature</div>
                    </td>
                    <td style={signatureCell}>
                      <input
                        style={signatureLineInput}
                        value={fields.chairTitle}
                        onChange={(e) => setField("chairTitle", e.target.value)}
                      />
                      <div style={caption}>Position</div>
                      <input
                        style={{ ...signatureLineInput, marginTop: "12px" }}
                        value={fields.dateSigned}
                        onChange={(e) => setField("dateSigned", e.target.value)}
                      />
                      <div style={caption}>Date Signed</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={bottomBandTable}>
        <tbody>
          <tr>
            <td style={bottomBandCell}>Bureau of Immigration Accredited - Deputized to offer ETEEAP - Science Resource Center, DENR Recognized</td>
          </tr>
          <tr>
            <td style={bottomBandCell}>PAASCU Accredited, Institutional Accreditation Status, CEAP and ACSCU-AAI affiliations</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const pageContainer: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "20mm",
  margin: "0 auto",
  boxSizing: "border-box",
  background: "white",
  fontFamily: "Segoe UI, Tahoma, sans-serif",
  fontSize: "12px",
  color: "#000",
};

const topHeaderTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "8px",
};

const logoCell: React.CSSProperties = {
  width: "18%",
  border: "1px solid #ff00cc",
  verticalAlign: "top",
  textAlign: "center",
  padding: "4px",
};

const logoImage: React.CSSProperties = {
  width: "66px",
  height: "66px",
  objectFit: "contain",
};

const identityCell: React.CSSProperties = {
  border: "1px solid #ff00cc",
  verticalAlign: "top",
  padding: "6px 8px",
};

const uniTitle: React.CSSProperties = {
  fontSize: "28px",
  color: "#d622b5",
  lineHeight: 1,
  fontWeight: 700,
};

const smallLine: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.3,
  color: "#000",
};

const committeeBandCell: React.CSSProperties = {
  border: "1px solid #ff00cc",
  textAlign: "center",
  color: "#d622b5",
  fontWeight: 600,
  padding: "4px",
};

const docTitleTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginBottom: "10px",
};

const docTitleCell: React.CSSProperties = {
  border: "1px solid black",
  textAlign: "center",
  fontWeight: 700,
  fontSize: "20px",
  padding: "8px",
};

const bodyTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const bodyCell: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  verticalAlign: "top",
};

const label: React.CSSProperties = {
  fontWeight: 700,
  marginRight: "8px",
};

const plainLabel: React.CSSProperties = {
  fontWeight: 600,
  marginRight: "8px",
};

const lineWrap: React.CSSProperties = {
  display: "table",
  width: "100%",
  marginBottom: "4px",
};

const lineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "transparent",
};

const lineInputShort: React.CSSProperties = {
  width: "280px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "transparent",
  marginLeft: "6px",
};

const lineTextarea: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  fontFamily: "inherit",
  lineHeight: 1.35,
  resize: "none",
  overflow: "hidden",
  background: "transparent",
};

const paragraph: React.CSSProperties = {
  textAlign: "justify",
  lineHeight: 1.45,
};

const inlineInputSmall: React.CSSProperties = {
  width: "90px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  margin: "0 5px",
  fontFamily: "inherit",
  background: "transparent",
};

const inlineInputWide: React.CSSProperties = {
  width: "170px",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  margin: "0 5px",
  fontFamily: "inherit",
  background: "transparent",
};

const listTable: React.CSSProperties = {
  width: "85%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  margin: "0 0 0 8px",
};

const listCell: React.CSSProperties = {
  border: "none",
  padding: "2px 4px",
  verticalAlign: "top",
  fontSize: "12px",
};

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "8px",
};

const signatureCell: React.CSSProperties = {
  border: "none",
  width: "50%",
  padding: "4px 8px 0 0",
  verticalAlign: "top",
};

const signaturePadWrap: React.CSSProperties = {
  width: "210px",
  maxWidth: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  padding: "4px",
  background: "#fafafa",
};

const signatureLineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontSize: "12px",
  marginTop: "8px",
  fontFamily: "inherit",
  background: "transparent",
};

const caption: React.CSSProperties = {
  fontSize: "11px",
  marginTop: "2px",
};

const bottomBandTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "18px",
};

const bottomBandCell: React.CSSProperties = {
  border: "1px solid #ff00cc",
  fontSize: "10px",
  padding: "4px 6px",
  textAlign: "center",
};
