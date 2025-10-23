import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Dialogue } from "./dialogue"
import { toast } from "sonner"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/DB"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [formData, setFormData] = useState({
        fname: "",
        lname: "",
        email: "",
        org: "",
        password: "",
        rpassword: "",
        avatarExt: "png",
        role: "Researcher",
        category: "",
    })

    useEffect(() => {
        if (formData.email) {
            if (
                formData.email.endsWith("@uic.edu.ph") &&
                formData.org === "University of the Immaculate Conception"
            ) {
                setFormData((prev) => ({
                    ...prev,
                    category: prev.category === "External" ? "" : prev.category,
                }))
            } else {
                setFormData((prev) => ({ ...prev, category: "External" }))
            }
        }
    }, [formData.email, formData.org])

    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()

    const requirements = [
        { test: /.{8,}/, label: "At least 8 characters" },
        { test: /[A-Z]/, label: "One uppercase letter" },
        { test: /[a-z]/, label: "One lowercase letter" },
        { test: /[0-9]/, label: "One number" },
        { test: /[^A-Za-z0-9]/, label: "One special character" },
    ]

    const missingRequirements = useMemo(
        () => requirements.filter((r) => !r.test.test(formData.password)),
        [formData.password]
    )

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (formData.password !== formData.rpassword) {
            toast.error("Passwords do not match.")
            return
        }
        if (missingRequirements.length > 0) {
            toast.error("Password does not meet requirements.")
            return
        }

        const loading = toast.loading("Signing Up...")
        setSaving(true)

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        fname: formData.fname,
                        lname: formData.lname,
                        org: formData.org,
                        role: formData.role,
                    },
                },
            })

            if (error) throw error
            const user = data.user
            if (!user) throw new Error("No user returned from signup")

            const avatarPath = `${user.id}/pfp.png`

            const { error: insertError } = await supabase.from("profiles").insert({
                id: user.id,
                fname: formData.fname,
                lname: formData.lname,
                email: formData.email,
                org: formData.org,
                role: formData.role,
                category: formData.category,
                avatar: avatarPath,
            })

            if (insertError) throw insertError

            toast.success("Signed up successfully!", { id: loading })
            navigate("/sdash")
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Signup failed.", { id: loading })
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        })
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <a
                            href="#"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex size-8 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-6" />
                            </div>
                            <span className="sr-only">Acme Inc.</span>
                        </a>
                        <h1 className="text-xl font-bold">Sign-up to RECheck</h1>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="fname">First Name</Label>
                            <Input
                                id="fname"
                                type="text"
                                value={formData.fname}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="lname">Last Name</Label>
                            <Input
                                id="lname"
                                type="text"
                                value={formData.lname}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="m@example.com"
                                required
                            />
                            <Label htmlFor="org">Organization</Label>
                            <Input
                                id="org"
                                type="text"
                                value={formData.org}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="category" hidden={
                                formData.email === "" ||
                                formData.org === ""}>Category</Label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({ ...formData, category: e.target.value })
                                }
                                required
                                className="border rounded px-2 py-1"
                                hidden={
                                    formData.email === "" ||
                                    formData.org === ""}
                                disabled={
                                    !(
                                        formData.email.endsWith("@uic.edu.ph") &&
                                        formData.org === "University of the Immaculate Conception"
                                    )
                                }
                            >
                                <option value="">Select category</option>
                                {formData.email.endsWith("@uic.edu.ph") &&
                                    formData.org === "University of the Immaculate Conception" ? (
                                    <>
                                        <option value="Undergraduate">Undergraduate</option>
                                        <option value="Graduate">Graduate</option>
                                    </>
                                ) : (
                                    <option value="External">External</option>
                                )}
                            </select>

                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            {formData.password && (
                                <ul className="text-xs list-disc pl-4">
                                    {missingRequirements.length === 0 ? (
                                        <li className="text-green-600">Strong password</li>
                                    ) : (
                                        missingRequirements.map((r, idx) => (
                                            <li key={idx} className="text-red-500">
                                                {r.label}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                            <Label htmlFor="rpassword">Confirm Password</Label>
                            <Input
                                id="rpassword"
                                type="password"
                                value={formData.rpassword}
                                onChange={handleChange}
                                required
                            />
                            {formData.rpassword &&
                                formData.rpassword !== formData.password && (
                                    <p className="text-xs text-red-500">
                                        Passwords do not match.
                                    </p>
                                )}
                        </div>

                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link to="/login">
                                <u>Log-In</u>
                            </Link>
                        </div>

                        <RippleButton
                            type="submit"
                            className="w-full bg-muted hover:bg-accent"
                            disabled={saving}
                        >
                            {saving ? "Signing up..." : "Sign-Up"}
                        </RippleButton>
                    </div>
                </div>
            </form>

            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our
                <div className="flex text-center justify-center">
                    <Dialogue
                        title="Terms of Service"
                        desc="Please read the terms of service carefully"
                        cont="Lorem ipsum..."
                    />
                    <p className="px-1"> and </p>
                    <Dialogue
                        title="Privacy Policy"
                        desc="Please read the privacy policy carefully"
                        cont="Lorem ipsum..."
                    />
                </div>
            </div>
        </div>
    )
}

/* ------------------- Change Password Form ------------------- */
export function ChangePasswordForm({ email }: { email: string }) {
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

        // Re-authenticate
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
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        })
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
                                <li key={idx} className="text-red-500">
                                    {r.label}
                                </li>
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
