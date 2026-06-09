import React, { useState } from "react";
import SignatureCell from "./SignatureCell";

interface EthicalClearanceFormProps {
  savedData?: Record<string, any>;
  onSave?: (patch: Record<string, any>) => void;
  isReadOnly?: boolean;
}

export default function EthicalClearanceForm({ savedData = {}, onSave, isReadOnly = false }: EthicalClearanceFormProps) {
  const s = savedData;
  const save = (patch: Record<string, any>) => onSave?.(patch);

  const [fields, setFields] = useState<Record<string, string>>({
    date: s.fields?.date ?? s.date ?? "",
    nameOfResearcher: s.fields?.nameOfResearcher ?? s.nameOfResearcher ?? "",
    officeAddress: s.fields?.officeAddress ?? s.officeAddress ?? "University of the Immaculate Conception\nBonifacio St., Davao City",
    re: s.fields?.re ?? s.re ?? "",
    protocolCode: s.fields?.protocolCode ?? s.protocolCode ?? "",
    subject: s.fields?.subject ?? s.subject ?? "Ethical Clearance",
    salutationName: s.fields?.salutationName ?? s.salutationName ?? "",
    protocolVersion: s.fields?.protocolVersion ?? s.protocolVersion ?? "",
    informedConsentVersion: s.fields?.informedConsentVersion ?? s.informedConsentVersion ?? "",
    reviewType: s.fields?.reviewType ?? s.reviewType ?? "",
    reviewMeetingDate: s.fields?.reviewMeetingDate ?? s.reviewMeetingDate ?? "",
    receiptDate: s.fields?.receiptDate ?? s.receiptDate ?? "",
    grantedFrom: s.fields?.grantedFrom ?? s.grantedFrom ?? "",
    grantedTo: s.fields?.grantedTo ?? s.grantedTo ?? "",
    chairName: s.fields?.chairName ?? s.chairName ?? "GIRLIE MAE P. ZABALA, PhD",
    chairTitle: s.fields?.chairTitle ?? s.chairTitle ?? "Chair, UIC-REC",
    dateSigned: s.fields?.dateSigned ?? s.dateSigned ?? "",
  });

  const [chairSignature, setChairSignature] = useState<string>(s.fields?.chairSignature ?? s.chairSignature ?? "");

  const setField = (key: string, value: string) => {
    if (isReadOnly) return;
    const next = { ...fields, [key]: value };
    setFields(next);
    save({ [key]: value, fields: next });
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
  };

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    padding: '20mm',
    margin: '0 auto',
    backgroundColor: 'white',
    fontFamily: '"Segoe UI", Arial, sans-serif',
    boxSizing: 'border-box',
    color: 'black',
    fontSize: '12pt',
    lineHeight: '1.5',
    position: 'relative',
  };

  const tableLayout: React.CSSProperties = {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
  };

  const magenta = '#ff00ff';

  const inputStyle: React.CSSProperties = {
    border: 'none',
    borderBottom: isReadOnly ? 'none' : '1px solid black',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    backgroundColor: 'transparent',
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    border: 'none',
    borderBottom: isReadOnly ? 'none' : '1px solid black',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    backgroundColor: 'transparent',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    verticalAlign: 'bottom',
    display: 'block',
  };

  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div style={pageStyle}>
        <table style={tableLayout}>
          <tbody>
            <tr>
              <td style={{ 
                width: '15%', 
                borderRight: `2px solid ${magenta}`, 
                borderBottom: `2px solid ${magenta}`,
                verticalAlign: 'top',
                paddingRight: '10px',
                paddingBottom: '10px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: `1px solid ${magenta}`,
                  display: 'table',
                  margin: '0 auto',
                  color: magenta,
                  textAlign: 'center',
                  fontSize: '8px'
                }}>
                  <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>UIC LOGO</div>
                </div>
              </td>
              <td style={{ 
                width: '85%', 
                borderBottom: `2px solid ${magenta}`,
                paddingLeft: '15px',
                paddingBottom: '10px',
                verticalAlign: 'top'
              }}>
                <div style={{ color: magenta, fontSize: '20pt', margin: '0 0 5px 0', fontWeight: 'bold' }}>
                  University of the Immaculate Conception
                </div>
                <div style={{ color: magenta, fontSize: '9pt', lineHeight: '1.2' }}>
                  Rm 10, 3F, St. Joseph Bldg., Bonifacio Street, Davao City 8000, Philippines<br/>
                  📞 227-8286 local 211<br/>
                  (63-082) 227-37-94<br/>
                  www.uic.edu.ph<br/>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: magenta, fontSize: '9pt', verticalAlign: 'bottom' }}>rec@uic.edu.ph</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11pt', color: magenta, verticalAlign: 'bottom' }}>
                          Research Ethics Committee
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ 
                borderRight: `2px solid ${magenta}`, 
                verticalAlign: 'top',
                paddingTop: '20px'
              }}>
              </td>
              <td style={{ 
                paddingLeft: '15px',
                paddingTop: '30px',
                paddingBottom: '280px',
                verticalAlign: 'top'
              }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '30px', fontSize: '14pt' }}>
                  ETHICAL CLEARANCE
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '45px', fontWeight: 'bold', verticalAlign: 'bottom' }}>Date:</td>
                      <td style={{ verticalAlign: 'bottom' }}>
                        <input 
                          type="text" 
                          name="date"
                          value={fields.date}
                          onChange={(e) => setField("date", e.target.value)}
                          style={{...inputStyle, width: '200px'}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                  <div style={{ marginBottom: '5px' }}>NAME OF THE RESEARCHER</div>
                  <textarea 
                    name="nameOfResearcher"
                    value={fields.nameOfResearcher}
                    onChange={(e) => setField("nameOfResearcher", e.target.value)}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'bold', width: '300px'}} 
                    rows={1}
                    readOnly={isReadOnly}
                  />
                  <textarea 
                    name="officeAddress"
                    value={fields.officeAddress}
                    onChange={(e) => setField("officeAddress", e.target.value)}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'normal', width: '400px', marginTop: '5px'}}
                    rows={2}
                    readOnly={isReadOnly}
                  />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30px', verticalAlign: 'top' }}>Re:</td>
                      <td>
                        <textarea 
                          name="re"
                          value={fields.re}
                          onChange={(e) => setField("re", e.target.value)}
                          onInput={handleTextareaInput}
                          style={{...textareaStyle, fontWeight: 'bold', width: '100%'}}
                          rows={1}
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '110px', verticalAlign: 'bottom' }}>Protocol Code:</td>
                      <td style={{ verticalAlign: 'bottom' }}>
                        <input 
                          type="text" 
                          name="protocolCode"
                          value={fields.protocolCode}
                          onChange={(e) => setField("protocolCode", e.target.value)}
                          style={{...inputStyle, fontWeight: 'bold', width: '200px'}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '60px', verticalAlign: 'top' }}>Subject:</td>
                      <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                        <input 
                          type="text" 
                          name="subject"
                          value={fields.subject}
                          onChange={(e) => setField("subject", e.target.value)}
                          style={{...inputStyle, fontWeight: 'bold', width: '300px'}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '110px', verticalAlign: 'bottom' }}>Dear Mr. or Ms</td>
                      <td style={{ verticalAlign: 'bottom' }}>
                        <input 
                          type="text" 
                          name="salutationName"
                          value={fields.salutationName}
                          onChange={(e) => setField("salutationName", e.target.value)}
                          style={{...inputStyle, fontWeight: 'bold', width: '200px'}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '20px', textAlign: 'justify', lineHeight: '1.6' }}>
                  UIC-REC acknowledges the receipt of your <b>Manuscript Version</b>{' '}
                  <input 
                    type="text" 
                    name="protocolVersion"
                    value={fields.protocolVersion}
                    onChange={(e) => setField("protocolVersion", e.target.value)}
                    style={{...inputStyle, width: '50px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />{' '}
                  <b>and informed consent form (ICF) version</b>{' '}
                  <input 
                    type="text" 
                    name="informedConsentVersion"
                    value={fields.informedConsentVersion}
                    onChange={(e) => setField("informedConsentVersion", e.target.value)}
                    style={{...inputStyle, width: '50px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />{' '}
                  On{' '}
                  <input 
                    type="text" 
                    name="receiptDate"
                    value={fields.receiptDate}
                    onChange={(e) => setField("receiptDate", e.target.value)}
                    style={{...inputStyle, width: '150px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />. These new documents have incorporated the recommendations of the UIC -REC, as stipulated in the DECISION LETTER emailed to you, to improve the initial protocol and ICF that you submitted earlier for the{' '}
                  <input 
                    type="text" 
                    name="reviewType"
                    value={fields.reviewType}
                    onChange={(e) => setField("reviewType", e.target.value)}
                    style={{...inputStyle, width: '120px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />{' '}
                  review, which took place on{' '}
                  <input 
                    type="text" 
                    name="reviewMeetingDate"
                    value={fields.reviewMeetingDate}
                    onChange={(e) => setField("reviewMeetingDate", e.target.value)}
                    style={{...inputStyle, width: '150px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />.
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'justify', lineHeight: '1.6' }}>
                  Upon further scrutiny of and deliberation on the revised document, the UIC-REC is convinced that your research/investigation embodies a process that is responsible and ethically accountable; thus, ETHICAL CLEARANCE with a validity period of <b>one year</b>,{' '}
                  <input 
                    type="text" 
                    name="grantedFrom"
                    value={fields.grantedFrom}
                    onChange={(e) => setField("grantedFrom", e.target.value)}
                    style={{...inputStyle, width: '120px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />{' '}
                  To{' '}
                  <input 
                    type="text" 
                    name="grantedTo"
                    value={fields.grantedTo}
                    onChange={(e) => setField("grantedTo", e.target.value)}
                    style={{...inputStyle, width: '120px', display: 'inline-block', textAlign: 'center'}} 
                    readOnly={isReadOnly}
                  />{' '}
                  has been granted.
                </div>

                <div style={{ marginBottom: '15px', textAlign: 'justify', lineHeight: '1.6' }}>
                  Please be advised to submit the Final Report Form once you completed the study. Likewise, submit a report using the forms should any part of your research methodology and ICF, as outlined in your submitted approved documents, change in any way.
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', marginLeft: '10px' }}>
                  <tbody>
                    <tr><td style={{ width: '25px', verticalAlign: 'top' }}>A.</td><td>Protocol Amendment</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>B.</td><td>Progress Report</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>C.</td><td>Protocol Deviation/Protocol Violation</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>D.</td><td>Negative Event Report</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>E.</td><td>Early Study Termination Report</td></tr>
                    <tr><td style={{ verticalAlign: 'top' }}>F.</td><td>Application for Renewal of Ethical Clearance two months before expiry</td></tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '40px', textAlign: 'justify', lineHeight: '1.6' }}>
                  The UIC-REC wishes you all the best with this research undertaking.
                </div>

                <div style={{ marginBottom: '30px' }}>
                  Very truly yours,
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '300px', verticalAlign: 'top' }}>
                        <div style={{ minHeight: '80px', height: 'auto', display: 'block', marginBottom: '10px' }}>
                          <SignatureCell
                            value={chairSignature}
                            onChange={(val) => {
                              setChairSignature(val);
                              save({ chairSignature: val, fields: { ...fields, chairSignature: val } });
                            }}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <input 
                          type="text" 
                          name="chairName"
                          value={fields.chairName}
                          onChange={(e) => setField("chairName", e.target.value)}
                          style={{...inputStyle, fontWeight: 'bold', width: '250px'}} 
                          readOnly={isReadOnly}
                        />
                        <div style={{ marginTop: '2px', fontSize: '10pt' }}>
                          <input 
                            type="text" 
                            name="chairTitle"
                            value={fields.chairTitle}
                            onChange={(e) => setField("chairTitle", e.target.value)}
                            style={{...inputStyle, width: '250px'}} 
                            readOnly={isReadOnly}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20mm', 
          left: '20mm', 
          right: '20mm',
          borderTop: `2px solid ${magenta}`,
          paddingTop: '5px',
          backgroundColor: 'white'
        }}>
          <div style={{ borderTop: `1px solid ${magenta}`, marginTop: '2px', marginBottom: '10px' }}></div>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '75%', fontSize: '7pt', textAlign: 'center', lineHeight: '1.3' }}>
                  <b>Bureau of Immigration Accredited • Deputized to offer ETEEAP • Science Resource Center, DENR Recognized &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CHED Full Autonomous Status •</b><br/>
                  <b>PAASCU Accredited, Institutional Accreditation Status</b><br/>
                  <br/>
                  <b>MEMBER: Catholic Educational Association of the Philippines (CEAP) • Association of Catholic Universities of the</b><br/>
                  <b>Philippines (ACUP) • ASEAN University Network (AUN-QA, Associate Member) • University Mobility in Asia and the</b><br/>
                  <b>Pacific (UMAP) • Association of Southeast and East Asian Catholic Colleges and Universities (ASEACCU)</b><br/>
                  <b>Southeast Asian Ministers of Education Organization (SEAMEO) Schools' Network</b>
                </td>
                <td style={{ width: '25%', verticalAlign: 'top' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'right', paddingRight: '5px', verticalAlign: 'top' }}>
                          <div style={{ border: '1px solid #000', padding: '4px', fontSize: '6pt', textAlign: 'left', display: 'inline-block', lineHeight: '1.2' }}>
                            Management<br/>System<br/>ISO 9001:2015
                          </div>
                        </td>
                        <td style={{ width: '40px', verticalAlign: 'top' }}>
                          <div style={{ width: '40px', height: '40px', border: '1px solid #000', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt' }}>
                            QR
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', fontSize: '8pt', paddingTop: '15px' }}>
                          Page 1 of 1
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
