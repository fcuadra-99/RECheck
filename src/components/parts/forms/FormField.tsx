import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export interface BaseFieldProps {
  label?: string
  id?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  description?: string
}

// Text Input Field
export interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "time"
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TextField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  className,
  description,
}: TextFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Textarea Field
export interface TextareaFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function TextareaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows,
  error,
  required,
  disabled,
  className,
  description,
}: TextareaFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Select Field
export interface SelectFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
  disabled,
  className,
  description,
}: SelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Checkbox Field
export interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({
  label,
  id,
  checked,
  onChange,
  error,
  disabled,
  className,
  description,
}: CheckboxFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
        />
        {label && <Label htmlFor={id} className="cursor-pointer">{label}</Label>}
      </div>
      {description && <p className="text-xs text-muted-foreground ml-6">{description}</p>}
      {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
    </div>
  )
}

// Radio Group Field
export interface RadioFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; description?: string }[]
}

export function RadioField({
  label,
  id,
  value,
  onChange,
  options,
  error,
  disabled,
  className,
  description,
}: RadioFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label>
          {label}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
            <Label htmlFor={`${id}-${option.value}`} className="cursor-pointer font-normal">
              {option.label}
              {option.description && (
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Switch Field
export interface SwitchFieldProps extends BaseFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function SwitchField({
  label,
  id,
  checked,
  onChange,
  error,
  disabled,
  className,
  description,
}: SwitchFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          {label && <Label htmlFor={id}>{label}</Label>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
