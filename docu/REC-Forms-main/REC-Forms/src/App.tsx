import EthicsChecklistForm from "./assets/components/forms/externalExempt/REC_FO_0032_EthicsProtocolChecklist";
import ProtocolInformationForm from "./assets/components/forms/externalExempt/REC_FO_0033_PIFE";
import EthicsMOAForm from "./assets/components/forms/externalExempt/REC_FO_0036";
import EthicsProtocolChecklist from "./assets/components/forms/fullBoard/REC_FO_0026";
import EthicsApplicationProcedure from "./assets/components/forms/fullBoard/REC_FO_0027";
import EthicsStudyProtocolInformationForm from "./assets/components/forms/fullBoard/REC_FO_0028";
import EthicsInformedConsentChecklist from "./assets/components/forms/fullBoard/REC_FO_0029";
import EthicsInformedConsentAssessmentForm from "./assets/components/forms/fullBoard/REC_FO_0030";
import EthicsInformedConsentFormSample from "./assets/components/forms/fullBoard/REC_FO_0031";
import EthicsAssentFormSample from "./assets/components/forms/fullBoard/REC_FO_0034";
import EthicsMOAFormFullBoard from "./assets/components/forms/fullBoard/REC_FO_0036";
import RECEndorsementForm from "./assets/components/forms/fullBoard/REC_EndorsementForm";

function App() {
  return (
    <div className="App">
      <div>
        <EthicsChecklistForm /> {/* External Exempt */}
      </div>

      <div>
        <ProtocolInformationForm /> {/* External Exempt */}
      </div>

      <div>
        <EthicsMOAForm /> {/* External Exempt */}
      </div>

      <div>
        <EthicsProtocolChecklist /> {/* Full Board */}
      </div>

      <div>
        <EthicsApplicationProcedure /> {/* Full Board */}
      </div>

      <div>
        <EthicsStudyProtocolInformationForm /> {/* Full Board */}
      </div>

      <div>
        <EthicsInformedConsentChecklist /> {/* Full Board */}
      </div>

      <div>
        <EthicsInformedConsentAssessmentForm /> {/* Full Board */}
      </div>

      <div>
        <EthicsInformedConsentFormSample /> {/* Full Board */}
      </div>

      <div>
        <EthicsAssentFormSample /> {/* Full Board */}
      </div>

      <div>
        <EthicsMOAFormFullBoard /> {/* Full Board */}
      </div>

      <div>
        <RECEndorsementForm /> {/* Full Board */}
      </div>
    </div>
  );
}

export default App;
