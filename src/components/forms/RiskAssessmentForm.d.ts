type ReviewTypeChoice = "" | "Full Board" | "Expedited" | "Exempt";
interface RiskAssessmentFormProps {
    onSubmit?: (answers: Record<string, string>) => void;
    onReviewTypeChange?: (reviewType: ReviewTypeChoice) => void;
    initialStudyTitle?: string;
    initialResearcherName?: string;
    initialCoResearcher?: string;
    initialTypeOfReview?: string;
}
interface RiskAssessmentFormHandle {
    submit: () => void;
}
declare const RiskAssessmentForm: import("react").ForwardRefExoticComponent<RiskAssessmentFormProps & import("react").RefAttributes<RiskAssessmentFormHandle>>;
export default RiskAssessmentForm;
