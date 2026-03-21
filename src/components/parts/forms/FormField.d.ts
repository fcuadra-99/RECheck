export interface BaseFieldProps {
    label?: string;
    id?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    description?: string;
}
export interface TextFieldProps extends BaseFieldProps {
    type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "time";
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}
export declare function TextField({ label, id, type, value, onChange, placeholder, error, required, disabled, className, description, }: TextFieldProps): import("react/jsx-runtime").JSX.Element;
export interface TextareaFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}
export declare function TextareaField({ label, id, value, onChange, placeholder, rows, error, required, disabled, className, description, }: TextareaFieldProps): import("react/jsx-runtime").JSX.Element;
export interface SelectFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: {
        value: string;
        label: string;
    }[];
    placeholder?: string;
}
export declare function SelectField({ label, id, value, onChange, options, placeholder, error, required, disabled, className, description, }: SelectFieldProps): import("react/jsx-runtime").JSX.Element;
export interface CheckboxFieldProps extends BaseFieldProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}
export declare function CheckboxField({ label, id, checked, onChange, error, disabled, className, description, }: CheckboxFieldProps): import("react/jsx-runtime").JSX.Element;
export interface RadioFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: {
        value: string;
        label: string;
        description?: string;
    }[];
}
export declare function RadioField({ label, id, value, onChange, options, error, disabled, className, description, }: RadioFieldProps): import("react/jsx-runtime").JSX.Element;
export interface SwitchFieldProps extends BaseFieldProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}
export declare function SwitchField({ label, id, checked, onChange, error, disabled, className, description, }: SwitchFieldProps): import("react/jsx-runtime").JSX.Element;
