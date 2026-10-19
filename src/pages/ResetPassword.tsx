import { motion } from "framer-motion"
import { Eye, EyeClosed, Lock } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { toast } from "sonner"
import { useState, useMemo } from "react"
import { supabase } from "@/DB"

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    })

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        // Validation
        if (!formData.password) {
            toast.error('Please enter a password')
            return
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }

        if (missingRequirements.length > 0) {
            toast.error('Password does not meet requirements.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        const toastId = toast.loading('Updating your password...')

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Password updated successfully!')
            setFormData({
                password: '',
                confirmPassword: '',
            })

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/sdash')
            }, 2000)
        } catch (err) {
            console.error(err)
            toast.error('Something went wrong. Try again.')
        } finally {
            setLoading(false)
            toast.dismiss(toastId)
        }
    }

    return (
        <motion.div
            className="grid min-h-svh lg:grid-cols-2 overflow-hidden"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Left (form side) */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <Avatar>
                                <AvatarImage src={"logoo.png"} className="w-auto h-auto contain-content " />
                            </Avatar>
                        </div>
                        UIC RECheck
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-md">
                                        <Lock className="size-6" />
                                    </div>
                                    <h1 className="text-xl font-bold">Reset Your Password</h1>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Enter a new password to secure your account
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                        <RippleButton
                                            type="button"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            className="absolute mt-[1.7em] ml-[20em] bg-red-300/0 hover:bg-accent/0"
                                        >
                                            {showPassword ? (
                                                <EyeClosed color="#000000" />
                                            ) : (
                                                <Eye color="#000000" />
                                            )}
                                        </RippleButton>
                                        {formData.password && missingRequirements.length != 0 && (
                                            <ul className="rounded-b-xl border-2 border-gray shadow-xs z-[8] absolute text-xs list-disc mt-28 pl-8 py-2 w-[20.6em] bg-background">
                                                {missingRequirements.length != 0 && (
                                                    missingRequirements.map((r, idx) => (
                                                        <li key={idx} className="text-red-500">
                                                            {r.label}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                        <RippleButton
                                            type="button"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            className="absolute mt-[1.7em] ml-[20em] bg-red-300/0 hover:bg-accent/0"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeClosed color="#000000" />
                                            ) : (
                                                <Eye color="#000000" />
                                            )}
                                        </RippleButton>
                                        {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                                            <p className="rounded-b-xl border-2 border-gray shadow-xs z-[4] absolute text-xs list-disc mt-28 pl-8 py-2 w-[20.6em] bg-background">
                                                Passwords do not match.
                                            </p>
                                        )}
                                    </div>

                                    <RippleButton
                                        type="submit"
                                        className="w-full bg-muted hover:bg-accent"
                                        disabled={loading}
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </RippleButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right (background image) */}
            <div className="bg-muted relative hidden lg:block">
            </div>
        </motion.div>
    )
}
