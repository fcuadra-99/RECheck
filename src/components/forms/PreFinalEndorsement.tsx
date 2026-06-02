import React, { useState } from 'react';

interface EndorsementProps {
  initialData?: {
    date?: string;
    name?: string;
    affiliation?: string;
    title?: string;
    protocolCode?: string;
    salutation?: string;
    receiptDate?: string;
    chairName?: string;
    chairTitle?: string;
  };
  isReadOnly?: boolean;
}

const PreFinalEndorsement: React.FC<EndorsementProps> = ({ initialData, isReadOnly = false }) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || '',
    name: initialData?.name || '',
    affiliation: initialData?.affiliation || '',
    title: initialData?.title || '',
    protocolCode: initialData?.protocolCode || '',
    salutation: initialData?.salutation || '',
    receiptDate: initialData?.receiptDate || '',
    chairName: initialData?.chairName || 'GIRLIE MAE P. ZABALA, PhD',
    chairTitle: initialData?.chairTitle || 'Chair, UIC-REC'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
                paddingBottom: '200px',
                verticalAlign: 'top'
              }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '30px' }}>
                  ENDORSEMENT FOR PRE-FINAL DEFENSE
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={{...inputStyle, width: '200px'}} 
                    readOnly={isReadOnly}
                  />
                </div>

                <div style={{ marginBottom: '20px', fontWeight: 'bold' }}>
                  <textarea 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'bold', width: '300px'}} 
                    rows={1}
                    readOnly={isReadOnly}
                  />
                  <textarea 
                    name="affiliation"
                    value={formData.affiliation}
                    onChange={handleChange}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'normal', width: '400px', marginTop: '5px'}}
                    rows={2}
                    readOnly={isReadOnly}
                  />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30px', verticalAlign: 'top' }}>Re:</td>
                      <td>
                        <textarea 
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          onInput={handleTextareaInput}
                          style={{...textareaStyle, fontWeight: 'bold', width: '100%'}}
                          rows={1}
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '110px', verticalAlign: 'bottom' }}>Protocol Code:</td>
                      <td style={{ verticalAlign: 'bottom' }}>
                        <input 
                          type="text" 
                          name="protocolCode"
                          value={formData.protocolCode}
                          onChange={handleChange}
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
                        UIC-REC Endorsement for Pre-final Defense
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '40px', verticalAlign: 'bottom' }}>Dear</td>
                      <td style={{ verticalAlign: 'bottom' }}>
                        <input 
                          type="text" 
                          name="salutation"
                          value={formData.salutation}
                          onChange={handleChange}
                          style={{...inputStyle, fontWeight: 'bold', width: '200px'}} 
                          readOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
                  This is to acknowledge receipt of the following supporting documents on{' '}
                  <input 
                    type="text" 
                    name="receiptDate"
                    value={formData.receiptDate}
                    onChange={handleChange}
                    style={{...inputStyle, width: '150px'}} 
                    readOnly={isReadOnly}
                  />.
                </div>

                <ul style={{ listStyleType: 'disc', marginLeft: '30px', marginBottom: '20px' }}>
                  <li><b>Filled out Protocol Final Report Form</b></li>
                  <li><b>Signed ICF</b></li>
                </ul>

                <div style={{ marginBottom: '20px', textAlign: 'justify', lineHeight: '1.8' }}>
                  Upon the verification of the submitted terminal documents, the UIC-REC officially 
                  approves and releases the Endorsement for Pre-final Defense for your study titled:
                  <textarea 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'bold', width: '100%', marginTop: '5px'}}
                    rows={1}
                    readOnly={isReadOnly}
                  />
                </div>

                <div style={{ marginBottom: '40px', textAlign: 'justify', lineHeight: '1.8' }}>
                  The UIC-REC commends your commitment to assure the technical and ethical 
                  merits of your investigation.
                </div>

                <div style={{ marginBottom: '40px' }}>
                  Very truly yours,
                </div>

                <div>
                  <textarea 
                    name="chairName"
                    value={formData.chairName}
                    onChange={handleChange}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, fontWeight: 'bold', width: '300px'}}
                    rows={1}
                    readOnly={isReadOnly}
                  />
                  <textarea 
                    name="chairTitle"
                    value={formData.chairTitle}
                    onChange={handleChange}
                    onInput={handleTextareaInput}
                    style={{...textareaStyle, width: '300px', marginTop: '2px'}}
                    rows={1}
                    readOnly={isReadOnly}
                  />
                </div>
                
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
          backgroundColor: 'white' // Cover up the vertical line if it extends too far
        }}>
          <div style={{ borderTop: `1px solid ${magenta}`, marginTop: '2px', marginBottom: '10px' }}></div>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '75%', fontSize: '7pt', textAlign: 'center', lineHeight: '1.3' }}>
                  <b>CHED Full Autonomous Status • PAASCU Accredited, Institutional Accreditation Status</b><br/>
                  <b>Bureau of Immigration Accredited • Deputized to offer ETEEAP • Science Resource Center, DENR Recognized</b><br/>
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
};

export default PreFinalEndorsement;
