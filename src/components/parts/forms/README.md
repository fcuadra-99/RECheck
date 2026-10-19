# Modern Form Components

This directory contains modernized form components that support all standard HTML5 input types plus advanced UI components like radio groups, checkboxes, selects, switches, and textareas.

## Available Components

### 1. TextField
Text input component supporting various input types.

```tsx
import { TextField } from "@/components/parts/forms"

<TextField
  label="Email"
  id="email"
  type="email"
  value={email}
  onChange={(value) => setEmail(value)}
  placeholder="john@example.com"
  required
  error={errors.email}
  description="We'll never share your email"
/>
```

**Supported types:** text, email, password, number, tel, url, date, time

### 2. TextareaField
Multi-line text input component.

```tsx
import { TextareaField } from "@/components/parts/forms"

<TextareaField
  label="Bio"
  id="bio"
  value={bio}
  onChange={(value) => setBio(value)}
  placeholder="Tell us about yourself..."
  rows={4}
  description="Maximum 500 characters"
/>
```

### 3. SelectField
Dropdown select component with modern styling.

```tsx
import { SelectField } from "@/components/parts/forms"

<SelectField
  label="Country"
  id="country"
  value={country}
  onChange={(value) => setCountry(value)}
  options={[
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "ph", label: "Philippines" },
  ]}
  placeholder="Select your country"
  required
/>
```

### 4. CheckboxField
Single checkbox component.

```tsx
import { CheckboxField } from "@/components/parts/forms"

<CheckboxField
  label="I agree to the terms and conditions"
  id="agreeToTerms"
  checked={agreeToTerms}
  onChange={(checked) => setAgreeToTerms(checked)}
  description="You must agree to continue"
  error={errors.agreeToTerms}
/>
```

### 5. RadioField
Radio button group component.

```tsx
import { RadioField } from "@/components/parts/forms"

<RadioField
  label="Account Type"
  id="accountType"
  value={accountType}
  onChange={(value) => setAccountType(value)}
  options={[
    { 
      value: "free", 
      label: "Free", 
      description: "Basic features" 
    },
    { 
      value: "pro", 
      label: "Pro", 
      description: "Advanced features" 
    },
  ]}
/>
```

### 6. SwitchField
Toggle switch component.

```tsx
import { SwitchField } from "@/components/parts/forms"

<SwitchField
  label="Enable Notifications"
  id="notifications"
  checked={notifications}
  onChange={(checked) => setNotifications(checked)}
  description="Receive push notifications"
/>
```

## Common Props

All form field components support these common props:

- `label?: string` - Field label text
- `id?: string` - HTML id attribute
- `error?: string` - Error message to display
- `required?: boolean` - Mark field as required
- `disabled?: boolean` - Disable the field
- `className?: string` - Additional CSS classes
- `description?: string` - Helper text below the field

## Complete Example

See `ModernFormExample.tsx` for a comprehensive demonstration of all form components.

```tsx
import { ModernFormExample } from "@/components/parts/forms"

function MyPage() {
  return (
    <ModernFormExample 
      onSubmit={(data) => console.log(data)} 
    />
  )
}
```

## Migration Guide

### Old Pattern (Native HTML)
```tsx
<label htmlFor="category">Category</label>
<select
  id="category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="border rounded px-2 py-1"
>
  <option value="">Select category</option>
  <option value="undergraduate">Undergraduate</option>
  <option value="graduate">Graduate</option>
</select>
```

### New Pattern (Modern Component)
```tsx
<SelectField
  label="Category"
  id="category"
  value={category}
  onChange={(value) => setCategory(value)}
  options={[
    { value: "undergraduate", label: "Undergraduate" },
    { value: "graduate", label: "Graduate" },
  ]}
  placeholder="Select category"
/>
```

## Benefits

1. **Consistent Styling** - All components use the same design system
2. **Accessibility** - Built-in ARIA attributes and keyboard navigation
3. **Error Handling** - Standardized error display
4. **Type Safety** - Full TypeScript support
5. **Validation** - Easy integration with validation libraries
6. **Responsive** - Mobile-friendly by default

## Existing Forms Updated

The following forms have been updated to use modern components:

- ✅ `signu-form.tsx` - Now uses SelectField instead of native select
- ✅ `login-form.tsx` - Already using modern Input components
- ✅ `ChangePasswordForm.tsx` - Already using modern Input components
- ✅ `EditAccountForm.tsx` - Already using modern Input components

## Next Steps

To update other forms in your application:

1. Import the appropriate field component
2. Replace native HTML inputs with the modern component
3. Update onChange handlers to use the value directly (not event.target.value)
4. Add error handling and validation as needed
