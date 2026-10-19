interface MemberListInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    readOnly?: boolean;
}
export default function MemberListInput({ values, onChange, placeholder, style, readOnly }: MemberListInputProps): import("react/jsx-runtime").JSX.Element;
export {};
