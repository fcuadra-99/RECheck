// app/profile/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/DB"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Mail, MapPin, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Profile data
  const [fname, setFname] = useState("")
  const [lname, setLname] = useState("")
  const [org, setOrg] = useState("")
  const [role, setRole] = useState("")
  const [avatar, setAvatar] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const u = data.user
      setUser(u)

      const meta = u.user_metadata || {}
      setFname(meta.fname || "")
      setLname(meta.lname || "")
      setOrg(meta.org || "")
      setRole(meta.role || "")
      setAvatar(meta.avatar || "")

      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleTestNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notifications are blocked.");
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "TEST_NOTIFICATION",
      });
      toast.success("Notification request sent to service worker!");
    } else {
      toast.error("No active service worker found.");
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  const fullName = `${fname} ${lname}`.trim() || "Unnamed User"

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>
      <div className="grid gap-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar || "/placeholder.svg"} alt={fullName} />
                  <AvatarFallback>{fname ? fname[0] : "U"}</AvatarFallback>
                </Avatar>
                {/* Avatar Upload Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <RippleButton size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full">
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Change avatar</span>
                    </RippleButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload New Avatar</DialogTitle>
                    </DialogHeader>
                    <AvatarUpload user={user} setAvatar={setAvatar} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                {org && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{org}</span>
                  </div>
                )}
                {role && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm px-2 py-1 rounded bg-muted">{role}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar + Settings */}
        <div className="grid gap-8 md:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <div className="hidden md:block space-y-2">
            <div className="font-medium text-lg">Settings</div>
            <nav className="grid gap-1">
              <a href="#account" className="px-3 py-2 text-sm rounded-md bg-muted">Account</a>
              <a href="#notifications" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Notifications</a>
              <a href="#security" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Security</a>
              <a href="#appearance" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Appearance</a>
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-10">
            
            {/* Account Settings (read-only) */}
            <section id="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Your account information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Detail label="First Name" value={fname} />
                  <Detail label="Last Name" value={lname} />
                  <Detail label="Email" value={user?.email} />
                  <Detail label="Organization" value={org} />
                  <Detail label="Role" value={role} />
                </CardContent>
                <div className="p-4">

                  {/* Edit Account Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <RippleButton>Edit Account</RippleButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Account Information</DialogTitle>
                      </DialogHeader>
                      <EditAccountForm
                        user={user}
                        fname={fname}
                        lname={lname}
                        org={org}
                        role={role}
                        avatar={avatar}
                        setFname={setFname}
                        setLname={setLname}
                        setOrg={setOrg}
                        setRole={setRole}
                        setAvatar={setAvatar}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </section>

            {/* Notifications */}
            <section id="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Choose how you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">[Your notification settings form here]</p>

                  {/* Test Notification Button */}
                  <RippleButton onClick={handleTestNotification}>
                    Send Test Notification
                  </RippleButton>
                </CardContent>
              </Card>
            </section>

            {/* Security */}
            <section id="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your security preferences and change your password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <RippleButton variant="outline" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Change Password
                      </RippleButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <ChangePasswordForm email={user?.email} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Helper for read-only details */
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value || "-"}</span>
    </div>
  )
}

/* Edit Account Form (inside modal) */
function EditAccountForm({ user, fname, lname, org, avatar, setFname, setLname, setOrg }: any) {
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

/* Avatar Upload Form */
function AvatarUpload({ user, setAvatar }: { user: any; setAvatar: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const filePath = `avatars/${user.id}.${fileExt}`

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })
    if (error) {
      console.error(error)
      toast.error("Failed to upload avatar.")
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    if (data?.publicUrl) {
      setAvatar(data.publicUrl)
      await supabase.auth.updateUser({ data: { avatar: data.publicUrl } })
    }

    toast.success("Avatar updated!")
    setUploading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <RippleButton onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </RippleButton>
    </div>
  )
}

/* Change Password Form */
function ChangePasswordForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const requirements = [
    { test: /.{8,}/, label: "At least 8 characters" },
    { test: /[A-Z]/, label: "One uppercase letter" },
    { test: /[a-z]/, label: "One lowercase letter" },
    { test: /[0-9]/, label: "One number" },
    { test: /[^A-Za-z0-9]/, label: "One special character" },
  ]

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
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Current Password</Label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <hr className="my-10" />

      <div className="space-y-2">
        <Label>New Password</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {newPassword && (
          <ul className="text-xs list-disc pl-4">
            {missingRequirements.length === 0 ? (
              <li className="text-green-600">Strong password</li>
            ) : (
              missingRequirements.map((r, idx) => (
                <li key={idx} className="text-red-500">{r.label}</li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      <div className="flex justify-end">
        <RippleButton onClick={handleChangePassword} disabled={saving}>
          {saving ? "Updating..." : "Update Password"}
        </RippleButton>
      </div>
    </div>
  )
}
