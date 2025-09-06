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

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return
            }

          
            if (data.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('email', email)
                    .single()

                if (userData?.role) {
                    navigate(`/${userData.role}/dashboard`)
                } else {
                   
                    navigate('/unauthorized')
                }
            }
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
                        <h1 className="text-xl font-bold">Log-in to RECheck</h1>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link to="/signu">
                                <u>Sign up</u>
                            </Link>
                        </div>
                        <RippleButton 
                            type="submit" 
                            className="w-full bg-muted hover:bg-accent"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Log-In"}
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
