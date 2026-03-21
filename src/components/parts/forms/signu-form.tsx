import { Eye, EyeClosed, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link, useNavigate } from "react-router"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Dialogue } from "../dialogs/dialogue"
import { toast } from "sonner"
import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/DB"

export interface SignupFormProps extends React.ComponentProps<"div"> {}

export function SignupForm({
    className,
    ...props
}: SignupFormProps) {
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

            if (error) {
                // Check for duplicate account error
                if (error.message?.includes("already registered") ||
                    error.message?.includes("already exists") ||
                    error.code === "user_already_exists") {
                    throw new Error("Email is already in use. Please use a different email or try logging in.")
                }
                throw error
            }

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

            if (insertError) {
                // Check for duplicate profile error
                if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
                    throw new Error("Email is already in use. Please use a different email or try logging in.")
                }
                throw insertError
            }

            toast.success("Signed up successfully!", { id: loading })
            navigate("/login")
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

    const [showPassword, setShowPassword] = useState(true)

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
                                placeholder="John"
                                type="text"
                                value={formData.fname}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="lname">Last Name</Label>
                            <Input
                                placeholder="Doe"
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
                                placeholder="School/Org Name"
                                required
                            />
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                                disabled={
                                    !(
                                        formData.email.endsWith("@uic.edu.ph") &&
                                        formData.org === "University of the Immaculate Conception"
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formData.email.endsWith("@uic.edu.ph") &&
                                        formData.org === "University of the Immaculate Conception" ? (
                                        <>
                                            <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                                            <SelectItem value="Graduate">Graduate</SelectItem>
                                        </>
                                    ) : (
                                        <SelectItem value="External">External</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>

                            <>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "password" : "text"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="z-10 bg-background"
                                />
                                <RippleButton
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className={`absolute mt-[28em] ml-[20em] bg-red-300/0 hover:bg-accent/0 z-[11]
                                    `}
                                >
                                    {showPassword ? (
                                        <EyeClosed color="#000000" />
                                    ) : (
                                        <Eye color="#000000" />
                                    )}
                                </RippleButton>
                                {formData.password && missingRequirements.length != 0 && (
                                    <ul className="rounded-b-xl border-2 border-gray shadow-xs z-[8] absolute text-xs list-disc mt-88 pl-8 py-2 w-[26.6em] bg-background">
                                        {missingRequirements.length != 0 && (
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
                                    type={showPassword ? "password" : "text"}
                                    value={formData.rpassword}
                                    onChange={handleChange}
                                    required
                                    className="z-[5] bg-background"
                                />
                                <RippleButton
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className={`absolute mt-[33.3em] ml-[20em] bg-red-300/0 hover:bg-accent/0 z-[11]
                                    `}
                                >
                                    {showPassword ? (
                                        <EyeClosed color="#000000" />
                                    ) : (
                                        <Eye color="#000000" />
                                    )}
                                </RippleButton>
                                {formData.rpassword &&
                                    formData.rpassword != formData.password && (
                                        <p className="rounded-b-xl border-2 border-gray shadow-xs z-[4] absolute text-xs list-disc mt-107 pl-8 py-2 w-[26.6em] bg-background">
                                            Passwords do not match.
                                        </p>
                                    )
                                }
                            </>
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