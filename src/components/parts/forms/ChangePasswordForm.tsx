import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { supabase } from "@/DB"
import { toast } from "sonner"

export interface ChangePasswordFormProps {
  email: string
}

/* Change Password Form */
export default function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  const requirements = [
    { test: /.{8,}/, label: "At least 8 characters" },
    { test: /[A-Z]/, label: "One uppercase letter" },
    { test: /[a-z]/, label: "One lowercase letter" },
    { test: /[0-9]/, label: "One number" },
    { test: /[^A-Za-z0-9]/, label: "One special character" },
  ]

  const securityTips = [
    {
      title: "Use a Strong Password",
      tip: "Mix uppercase, lowercase, numbers, and symbols. Example: 'P@ssw0rd' is weak, 'Tr4ff!cL1ght' is better.",
      icon: "🔐"
    },
    {
      title: "Avoid Personal Information",
      tip: "Don't use birthdays, names, or other easily guessable information in your password.",
      icon: "🚫"
    },
    {
      title: "Use Unique Passwords",
      tip: "Never reuse passwords across different accounts to prevent multiple accounts being compromised.",
      icon: "🔄"
    },
    {
      title: "Length Matters",
      tip: "Longer passwords are harder to crack. Consider using a passphrase like 'The-Sun-Is-Bright-Today!'",
      icon: "📏"
    },
    {
      title: "Password Manager",
      tip: "Consider using a password manager to securely store and generate strong passwords.",
      icon: "🗝️"
    },
    {
      title: "Regular Updates",
      tip: "Change your password periodically, especially if you suspect it might have been compromised.",
      icon: "🔄"
    }
  ]

  // Auto-rotate tips every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % securityTips.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const missingRequirements = useMemo(
    () => requirements.filter((r) => !r.test.test(newPassword)),
    [newPassword]
  )

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill out all fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    if (missingRequirements.length > 0) {
      toast.error("Password does not meet requirements.")
      return
    }

    setSaving(true)

    // Re-authenticate with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      setSaving(false)
      toast.error("Current password is incorrect.")
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (updateError) {
      console.error(updateError)
      toast.error("Failed to update password.")
    } else {
      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      window.location.reload()
    }
  }

  return (
    <div className="relative space-y-6 py-4">
      {/* Animated Security Tip */}
      <div className="rounded-lg border bg-muted/5 overflow-hidden relative h-[120px]">
        <div
          className="absolute w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentTipIndex * 100}%)` }}
        >
          <div className="flex">
            {securityTips.map((tip, idx) => (
              <div key={idx} className="w-full flex-shrink-0 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tip.icon}</span>
                  <h4 className="font-medium">{tip.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tip.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Tip Progress Indicator */}
        <div className="absolute bottom-3 left-4 right-4 flex gap-1 mt-100">
          {securityTips.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                idx === currentTipIndex
                  ? "bg-primary flex-1"
                  : "bg-muted flex-1"
              )}
            />
          ))}
        </div>
      </div>

      {/* Current Password */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <div className="relative">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-20"
              placeholder="Enter current password"
            />
          </div>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label>New Password</Label>
          <div className="relative">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-20"
              placeholder="Create new password"
            />
          </div>
        </div>

        {/* Password Requirements */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Requirements</Label>
          <div className="grid grid-cols-2 gap-2">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-xs px-2 py-1 rounded-md flex items-center gap-1.5",
                  req.test.test(newPassword)
                    ? "bg-green-500/10 text-green-600"
                    : "bg-muted/10 text-foreground"
                )}
              >
                {req.test.test(newPassword) ? "✓" : "·"} {req.label}
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-20"
              placeholder="Confirm new password"
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <RippleButton variant="outline" onClick={() => {
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
        }}>
          Reset
        </RippleButton>
        <RippleButton onClick={handleChangePassword} disabled={saving}>
          {saving ? "Updating..." : "Update Password"}
        </RippleButton>
      </div>
    </div>
  )
}
