import { GalleryVerticalEnd } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { supabase } from "@/lib/supabase"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router"
import { RippleButton } from "../animate-ui/buttons/ripple"
import { Diademo } from "./dialogue"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError(null)

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        try {
            // Sign up with Supabase - role will be handled by trigger
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        // role intentionally omitted — will be assigned manually in Supabase
                    }
                }
            })

            if (error) {
                setError(error.message)
                return
            }

            // Redirect to login after successful signup
            navigate('/login')
        } catch (error) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
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
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            


                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link to="/login">
                                <u>Log-In</u>
                            </Link>
                        </div>
                        <RippleButton 
                            type="submit" 
                            className="w-full bg-muted hover:bg-accent"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Sign-Up"}
                        </RippleButton>
                    </div>
                </div>
            </form>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our
                <div className="flex text-center justify-center">
                    <Diademo
                        title="Terms of Service"
                        desc="Please read the terms of service carefully"
                        cont="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos."
                    />
                    <p className="px-1"> and </p>
                    <Diademo
                        title="Privacy Policy"
                        desc="Please read the privacy policy carefully"
                        cont="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos."
                    />
                </div>
            </div>
        </div>
    )
}
