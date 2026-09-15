import { useState } from "react"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { toast } from "sonner"
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  RadioField,
  SwitchField,
} from "./FormField"

export interface ModernFormExampleProps {
  onSubmit?: (data: any) => void
}

export function ModernFormExample({ onSubmit }: ModernFormExampleProps) {
  const [formData, setFormData] = useState({
    // Text inputs
    fullName: "",
    email: "",
    password: "",
    phone: "",
    website: "",
    birthdate: "",
    
    // Textarea
    bio: "",
    
    // Select
    country: "",
    role: "",
    
    // Checkboxes
    agreeToTerms: false,
    subscribeNewsletter: false,
    
    // Radio
    gender: "",
    accountType: "",
    
    // Switch
    notifications: false,
    darkMode: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName) newErrors.fullName = "Full name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to terms"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error("Please fix the errors in the form")
      return
    }
    
    setErrors({})
    toast.success("Form submitted successfully!")
    console.log("Form data:", formData)
    onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Modern Form Components</h2>
        <p className="text-sm text-muted-foreground">
          Demonstration of all available form field types
        </p>
      </div>

      {/* Text Inputs Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Text Inputs</h3>
        
        <TextField
          label="Full Name"
          id="fullName"
          value={formData.fullName}
          onChange={(value) => setFormData({ ...formData, fullName: value })}
          placeholder="John Doe"
          required
          error={errors.fullName}
        />

        <TextField
          label="Email"
          id="email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="john@example.com"
          required
          error={errors.email}
        />

        <TextField
          label="Password"
          id="password"
          type="password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="••••••••"
          description="Must be at least 8 characters"
        />

        <TextField
          label="Phone Number"
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          placeholder="+1 (555) 000-0000"
        />

        <TextField
          label="Website"
          id="website"
          type="url"
          value={formData.website}
          onChange={(value) => setFormData({ ...formData, website: value })}
          placeholder="https://example.com"
        />

        <TextField
          label="Birth Date"
          id="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(value) => setFormData({ ...formData, birthdate: value })}
        />
      </div>

      {/* Textarea Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Textarea</h3>
        
        <TextareaField
          label="Bio"
          id="bio"
          value={formData.bio}
          onChange={(value) => setFormData({ ...formData, bio: value })}
          placeholder="Tell us about yourself..."
          rows={4}
          description="Maximum 500 characters"
        />
      </div>

      {/* Select Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Select Dropdowns</h3>
        
        <SelectField
          label="Country"
          id="country"
          value={formData.country}
          onChange={(value) => setFormData({ ...formData, country: value })}
          options={[
            { value: "us", label: "United States" },
            { value: "uk", label: "United Kingdom" },
            { value: "ca", label: "Canada" },
            { value: "au", label: "Australia" },
            { value: "ph", label: "Philippines" },
          ]}
          placeholder="Select your country"
        />

        <SelectField
          label="Role"
          id="role"
          value={formData.role}
          onChange={(value) => setFormData({ ...formData, role: value })}
          options={[
            { value: "researcher", label: "Researcher" },
            { value: "reviewer", label: "Reviewer" },
            { value: "admin", label: "Administrator" },
            { value: "staff", label: "Staff" },
          ]}
          placeholder="Select your role"
          required
        />
      </div>

      {/* Checkbox Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Checkboxes</h3>
        
        <CheckboxField
          label="I agree to the terms and conditions"
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={(checked) => setFormData({ ...formData, agreeToTerms: checked })}
          error={errors.agreeToTerms}
        />

        <CheckboxField
          label="Subscribe to newsletter"
          id="subscribeNewsletter"
          checked={formData.subscribeNewsletter}
          onChange={(checked) => setFormData({ ...formData, subscribeNewsletter: checked })}
          description="Receive updates about new features and announcements"
        />
      </div>

      {/* Radio Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Radio Groups</h3>
        
        <RadioField
          label="Gender"
          id="gender"
          value={formData.gender}
          onChange={(value) => setFormData({ ...formData, gender: value })}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer-not-to-say", label: "Prefer not to say" },
          ]}
        />

        <RadioField
          label="Account Type"
          id="accountType"
          value={formData.accountType}
          onChange={(value) => setFormData({ ...formData, accountType: value })}
          options={[
            { 
              value: "free", 
              label: "Free", 
              description: "Basic features with limited access" 
            },
            { 
              value: "pro", 
              label: "Pro", 
              description: "Advanced features and priority support" 
            },
            { 
              value: "enterprise", 
              label: "Enterprise", 
              description: "Full access with dedicated support" 
            },
          ]}
        />
      </div>

      {/* Switch Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Switches</h3>
        
        <SwitchField
          label="Enable Notifications"
          id="notifications"
          checked={formData.notifications}
          onChange={(checked) => setFormData({ ...formData, notifications: checked })}
          description="Receive push notifications for important updates"
        />

        <SwitchField
          label="Dark Mode"
          id="darkMode"
          checked={formData.darkMode}
          onChange={(checked) => setFormData({ ...formData, darkMode: checked })}
          description="Switch between light and dark theme"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 justify-end pt-4">
        <RippleButton
          type="button"
          onClick={() => {
            setFormData({
              fullName: "",
              email: "",
              password: "",
              phone: "",
              website: "",
              birthdate: "",
              bio: "",
              country: "",
              role: "",
              agreeToTerms: false,
              subscribeNewsletter: false,
              gender: "",
              accountType: "",
              notifications: false,
              darkMode: false,
            })
            setErrors({})
            toast.info("Form reset")
          }}
          className="bg-gray-300 hover:bg-gray-400"
        >
          Reset
        </RippleButton>
        <RippleButton type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Submit Form
        </RippleButton>
      </div>
    </form>
  )
}
