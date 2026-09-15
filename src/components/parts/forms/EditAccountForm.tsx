import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { supabase } from "@/DB"
import { toast } from "sonner"

export interface EditAccountFormProps {
  user: any
  fname: string
  lname: string
  org: string
  role: string
  avatar: string
  setFname: (v: string) => void
  setLname: (v: string) => void
  setOrg: (v: string) => void
  setRole: (v: string) => void
  setAvatar: (v: string) => void
}

/* Edit Account Form (inside modal) */
export default function EditAccountForm({ user, fname, lname, org, avatar, setFname, setLname, setOrg }: any) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { fname, lname, org, avatar }, // 🚨 role excluded (read-only)
    })
    setSaving(false)

    if (error) {
      console.error(error)
      toast.error("Failed to update account.")
    } else {
      toast.success("Account updated successfully!")
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input value={fname} onChange={(e) => setFname(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input value={lname} onChange={(e) => setLname(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={user?.email} disabled />
      </div>
      <div className="space-y-2">
        <Label>Organization</Label>
        <Input value={org} onChange={(e) => setOrg(e.target.value)} />
      </div>
      <RippleButton onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </RippleButton>
    </div>
  )
}
