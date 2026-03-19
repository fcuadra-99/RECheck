// app/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/DB"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Detail, EditAccountForm, AvatarUpload, ChangePasswordForm } from "@/components/parts/forms"

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
            <section>
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
