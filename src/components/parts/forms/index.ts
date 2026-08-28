// Barrel exports for form components
export { LoginForm, type LoginFormProps } from './login-form';
export { SignupForm, type SignupFormProps } from './signu-form';
export { ResetForm as Reset, type ResetFormProps } from './reset';
export { default as Detail, type DetailProps } from './Detail';
export { default as EditAccountForm, type EditAccountFormProps } from './EditAccountForm';
export { default as AvatarUpload, type AvatarUploadProps } from './AvatarUpload';
export { default as ChangePasswordForm, type ChangePasswordFormProps } from './ChangePasswordForm';

// Modern form field components
export { 
  TextField, 
  TextareaField, 
  SelectField, 
  CheckboxField, 
  RadioField, 
  SwitchField,
  type TextFieldProps,
  type TextareaFieldProps,
  type SelectFieldProps,
  type CheckboxFieldProps,
  type RadioFieldProps,
  type SwitchFieldProps,
} from "./FormField";

export { ModernFormExample, type ModernFormExampleProps } from "./ModernFormExample";