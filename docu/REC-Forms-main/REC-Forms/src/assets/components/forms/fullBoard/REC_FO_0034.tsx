import { useState } from "react";

function EthicsAssentFormSample() {
  const [letterHtml, setLetterHtml] = useState(`
    <p><span style="color:#b10000;font-style:italic;">Kami, _________________________________________ ay mga mananaliksik at mga empleyado ng ating institusyon ay kasalukuyang gumagawa ng isang pag-aaral na may pamagat na "________________________________________________".</span></p>
    <p><span style="color:#b10000;font-style:italic;">Humihingi kami sa inyo ng pahintulot na kayo ay maging bahagi ng aming pag-aaral sa pamamagitan ng pagsagot ng dalawampung (20) multiple choice na mga katanungan na may kinalaman sa kasalukuyang sitwasyon niyo bilang isang anak ng OFW. Ang inyong tapat na pagsagot ay malaki ang maitutulong sa inyo at sa ating institusyon upang makagawa ang ating institusyon ng nararapat na mga aktibidad para sa mga anak ng OFW.</span></p>
    <p><span style="color:#b10000;font-style:italic;">Kung sumasang-ayon ka na maging bahagi ng aming pag-aaral, kasama ang ilan pang anak ng OFW ng ating institusyon, kayo ay titipunin sa isang silid aralan upang sagutin ang questionnaire na aming inihanda para sa inyo. Ito ay magtatagal lamang ng 30-45 na minuto. Huwag kang mag-alala dahil kayo ay gagabayan ng mga mananaliksik at walang magiging tama at maling sagot dahil ito ay hindi isang pagsusulit. Karagdagan dito, ikaw ay maaaring magtanong tungkol sa pag-aaral sa anumang oras at kung magpasya ka na hindi tapusin o hindi sagutin ang ilang bahagi ng mga katanungan, ito ay maaari mong hilingin sa amin na walang anumang kaakabay na kaparusahan.</span></p>
    <p><span style="color:#b10000;font-style:italic;">Kung ikaw ay pipirma sa papel na ito, nangangahulugan na nabasa at naintindihan mo ang mga hinahangad ng mga mananaliksik samaktuwid nais mong maging bahagi sa pag-aaral, ngunit kung hindi mo nais maging parte nito huwag pipirma sa papel na ito. Ang pagiging bahagi sa pag-aaral ay nasa sa iyo, at walang sinuman ang maaring pumilit sa iyo.</span></p>
    <p><span style="color:#b10000;font-style:italic;">Maraming Salamat.</span></p>
  `);

  const [participantSignature, setParticipantSignature] = useState("");
  const [participantDate, setParticipantDate] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantNameDate, setParticipantNameDate] = useState("");

  const [consentRequesterSignature, setConsentRequesterSignature] =
    useState("");
  const [consentRequesterDate, setConsentRequesterDate] = useState("");
  const [consentRequesterName, setConsentRequesterName] = useState("");
  const [consentRequesterNameDate, setConsentRequesterNameDate] = useState("");

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
            <div style={headerCommitteeName}>REVIEW ETHICS COMMITTEE (REC)</div>
            <div style={headerAddress}>
              Bonifacio Street, Davao City, Philippines
            </div>
          </div>
        </div>

        <div style={headerCodeBox}>
          <div>REC_FO_0034</div>
          <div>Control No.: _________</div>
        </div>
      </div>

      <h3 style={titleStyle}>Assent Form</h3>

      <div
        contentEditable
        dir="ltr"
        suppressContentEditableWarning
        style={editableLetterBox}
        dangerouslySetInnerHTML={{ __html: letterHtml }}
        onBlur={(e) =>
          setLetterHtml((e.currentTarget as HTMLDivElement).innerHTML)
        }
      />

      <table style={signatureTable}>
        <tbody>
          <tr>
            <td style={signatureLabelCell}>Ang iyong pirma:</td>
            <td style={signatureInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={participantSignature}
                onChange={(e) => setParticipantSignature(e.target.value)}
                onInput={autoExpand}
              />
            </td>
            <td style={dateLabelCell}>Petsa:</td>
            <td style={dateInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={participantDate}
                onChange={(e) => setParticipantDate(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={signatureLabelCell}>Pangalan ng Pumirma:</td>
            <td style={signatureInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onInput={autoExpand}
              />
            </td>
            <td style={dateLabelCell}>Petsa:</td>
            <td style={dateInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={participantNameDate}
                onChange={(e) => setParticipantNameDate(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={signatureLabelCell}>
              Pirma ng humihingi ng pahintulot:
            </td>
            <td style={signatureInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={consentRequesterSignature}
                onChange={(e) => setConsentRequesterSignature(e.target.value)}
                onInput={autoExpand}
              />
            </td>
            <td style={dateLabelCell}>Petsa:</td>
            <td style={dateInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={consentRequesterDate}
                onChange={(e) => setConsentRequesterDate(e.target.value)}
                onInput={autoExpand}
              />
            </td>
          </tr>

          <tr>
            <td style={signatureLabelCell}>
              Pangalan ng humihingi ng pahintulot:
            </td>
            <td style={signatureInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={consentRequesterName}
                onChange={(e) => setConsentRequesterName(e.target.value)}
                onInput={autoExpand}
              />
            </td>
            <td style={dateLabelCell}>Petsa:</td>
            <td style={dateInputCell}>
              <textarea
                rows={1}
                style={lineField}
                value={consentRequesterNameDate}
                onChange={(e) => setConsentRequesterNameDate(e.target.value)}
                onInput={autoExpand}
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

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "12px",
};

const editableLetterBox: React.CSSProperties = {
  border: "none",
  borderRadius: 0,
  padding: "8px",
  minHeight: "260px",
  marginBottom: "12px",
  direction: "ltr",
  unicodeBidi: "plaintext",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
  textAlign: "justify",
  color: "#000",
  fontStyle: "normal",
};

const signatureTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  marginTop: "8px",
};

const signatureLabelCell: React.CSSProperties = {
  width: "34%",
  padding: "6px 8px 6px 0",
  verticalAlign: "bottom",
};

const signatureInputCell: React.CSSProperties = {
  width: "36%",
  padding: "6px 12px 6px 0",
  verticalAlign: "bottom",
};

const dateLabelCell: React.CSSProperties = {
  width: "10%",
  padding: "6px 6px 6px 0",
  verticalAlign: "bottom",
};

const dateInputCell: React.CSSProperties = {
  width: "20%",
  padding: "6px 0",
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

export default EthicsAssentFormSample;
