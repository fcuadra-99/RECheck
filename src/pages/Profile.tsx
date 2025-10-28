// app/profile/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Loader2, ImageIcon } from "lucide-react"
import { type Crop } from "react-image-crop"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ImageCropper, getCroppedImg } from "@/components/ui/image-cropper"
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
  DialogDescription,
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

      const { data: avatarData } = supabase.storage
        .from("profiles")
        .getPublicUrl(`${u.id}/avatar.png`);
      setAvatar(avatarData?.publicUrl);

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
    <div className="container mx-auto py-10 space-y-8" id="account">
      <h1 className="text-3xl font-bold">Profile & Settings</h1>
      <div className="grid gap-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatar || "/placeholder.svg"}
                    alt={fullName}
                    className="object-cover w-full h-full"
                  />
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
              <a href="#account" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Account</a>
              <a href="#notifications" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Notifications</a>
              <a href="#security" className="px-3 py-2 text-sm rounded-md hover:bg-muted">Security</a>
            </nav>
          </div>

          <div className="absolute top-0" id="account"></div>

          {/* Content */}
          <div className="space-y-10">

            {/* Account Settings */}
            <section id="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your personal and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h4 className="font-medium text-sm mb-4">Personal Information</h4>
                    <div className="space-y-4 rounded-lg border p-4">
                      <Detail label="First Name" value={fname} />
                      <Detail label="Last Name" value={lname} />
                      <Detail label="Email" value={user?.email} />
                    </div>
                  </div>

                  {/* Organization Info */}
                  <div>
                    <h4 className="font-medium text-sm mb-4">Professional Details</h4>
                    <div className="space-y-4 rounded-lg border p-4">
                      <Detail label="Organization" value={org} />
                      <Detail label="Role" value={role} />
                      <Detail label="Account Type" value={user?.app_metadata?.category || "N/A"} />
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    {/* Edit Account Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <RippleButton variant="default">Edit Profile</RippleButton>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Profile Information</DialogTitle>
                          <DialogDescription>Update your personal and professional details.</DialogDescription>
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
                </CardContent>
              </Card>
            </section>

            {/* Notifications */}
            <section >
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Choose how you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Channel Preferences */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Notification Channels</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                          </div>
                          <Switch
                            checked={user?.user_metadata?.notifications?.email ?? true}
                            onCheckedChange={async (checked: boolean) => {
                              await supabase.auth.updateUser({
                                data: {
                                  notifications: {
                                    ...user?.user_metadata?.notifications,
                                    email: checked,
                                  },
                                },
                              })
                              toast.success("Email notification preference updated")
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get instant updates in browser</p>
                          </div>
                          <Switch
                            checked={user?.user_metadata?.notifications?.push ?? true}
                            onCheckedChange={async (checked: boolean) => {
                              if (checked) {
                                const permission = await Notification.requestPermission()
                                if (permission !== "granted") {
                                  toast.error("Please enable notifications in your browser settings")
                                  return
                                }
                              }
                              await supabase.auth.updateUser({
                                data: {
                                  notifications: {
                                    ...user?.user_metadata?.notifications,
                                    push: checked,
                                  },
                                },
                              })
                              toast.success("Push notification preference updated")
                            }}
                          />
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Test Notification */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Test Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send a test notification to verify settings</p>
                      </div>
                      <RippleButton variant="outline" onClick={handleTestNotification}>
                        Send Test
                      </RippleButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Security */}
            <section id="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and authentication preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Section */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                    </div>
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
                  </div>

                  {/* Login Activity */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Recent Activity</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="p-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-muted-foreground">Last login: {new Date().toLocaleDateString()}</p>
                          </div>
                          <RippleButton variant="destructive" size="sm" className="text-sm"
                            onClick={async () => {
                              await supabase.auth.signOut()
                              window.location.href = "/login"
                            }}
                          >
                            Sign Out
                          </RippleButton>
                        </div>
                      </div>
                    </div>
                  </div>
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })

  // Reset state when dialog closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check type
    if (selectedFile.type !== "image/png") {
      toast.error("Only PNG files are allowed.");
      return;
    }

    // Check size (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setFile(selectedFile)
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)
  }


  const handleUpload = async () => {
    if (!file || !user || !previewUrl) return
    setUploading(true)

    try {
      // Get cropped PNG blob
      const croppedBlob = await getCroppedImg(previewUrl, crop, "image/png")
      if (!croppedBlob) throw new Error("Failed to crop image")

      const filePath = `${user.id}/avatar.png`

      const { error } = await supabase.storage
        .from("profiles")
        .upload(filePath, croppedBlob, { upsert: true })

      if (error) throw error

      // Get public URL
      const { data: avatarData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath)

      if (avatarData?.publicUrl) {
        setAvatar(avatarData.publicUrl)
      }

      toast.success("Avatar updated!")
      window.location.reload()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div
        className={cn(
          "relative min-h-[200px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
          previewUrl ? "border-primary/20 bg-primary/5" : "border-gray-200 hover:border-gray-300"
        )}
        onDragOver={(e) => e.preventDefault()} // allow drop
        onDrop={(e) => {
          e.preventDefault();
          const droppedFile = e.dataTransfer.files[0];
          if (!droppedFile) return;

          // Check type
          if (droppedFile.type !== "image/png") {
            toast.error("Only PNG files are allowed.");
            return;
          }

          // Check size
          if (droppedFile.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
          }

          setFile(droppedFile);
          const objectUrl = URL.createObjectURL(droppedFile);
          setPreviewUrl(objectUrl);
        }}
      >
        {previewUrl ? (
          <div className="w-full h-full p-4">
            <ImageCropper
              imageSrc={previewUrl}
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              aspect={1}
              className="max-w-full mx-auto"
            />
          </div>
        ) : (
          <div className="text-center p-6">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <span className="text-primary font-semibold">Click to upload</span>
                <span className="text-gray-600"> or drag and drop</span>
              </Label>
            </div>
            <p className="text-xs text-gray-500 mt-2">PNG up to 2MB</p>
          </div>
        )}

        <Input
          id="avatar-upload"
          type="file"
          accept="image/png"
          className="sr-only"
          onChange={handleFileSelect}
        />
      </div>


      {/* Actions */}
      <div className="flex justify-end gap-2">
        {previewUrl && (
          <Button
            variant="outline"
            onClick={() => {
              setPreviewUrl(null)
              setFile(null)
            }}
            disabled={uploading}
          >
            Reset
          </Button>
        )}
        <RippleButton
          onClick={handleUpload}
          disabled={!previewUrl || uploading}
          className="min-w-[100px]"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
        </RippleButton>
      </div>
    </div>
  )
}

/* Change Password Form */
function ChangePasswordForm({ email }: { email: string }) {
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
      tip: "Mix uppercase, lowercase, numbers, and symbols. Example: 'P@ssw0rd' is weak, 'Tr4ff!cL1ght$' is better.",
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
