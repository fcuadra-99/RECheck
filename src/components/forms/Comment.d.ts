interface CommentProps {
    savedData?: Record<string, any>;
    onSave?: (patch: Record<string, any>) => void;
}
export default function Comment({ savedData, onSave }: CommentProps): import("react/jsx-runtime").JSX.Element;
export {};
