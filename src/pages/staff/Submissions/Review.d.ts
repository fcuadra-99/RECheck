type Status = "Check Manuscript" | "Risk Assessment" | "Forms Check" | "Deploy Queue" | "Send Revision" | "Check Revision" | "Resend Revision" | "Assign Review" | "Proposal Review" | "Revise Proposal" | "Data Collection" | "Deviation Check" | "Study Report Check" | "Revise Documents";
export declare function handleCheck(_id: string, _title: string, _researcher: string, _email: string, _submDate: string, _reviewer: string, _status: Status, _type: string): void;
export declare const SReview: () => import("react/jsx-runtime").JSX.Element;
export default SReview;
