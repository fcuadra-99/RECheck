import { Eye, EyeClosed, GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Dialogue } from "./dialogue"
import { toast } from "sonner"
import { useState } from "react"
import { supabase } from "@/DB"


export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const loading = toast.loading("Logging In...");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            // ✅ Check if user email is verified
            const isVerified = data.user?.email_confirmed_at;
            if (!isVerified) {
                toast.error("Please check your email to activate your account.");
                // ✅ Sign out immediately if unverified
                await supabase.auth.signOut();
                return;
            }

            const lname = data.user.user_metadata?.lname;
            toast.success(`Welcome back${lname ? `, ${lname}` : ""}!`);
            navigate("/sdash");

        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Try again.");
        } finally {
            toast.dismiss(loading);
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const [showPassword, setShowPassword] = useState(false)

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
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <Label htmlFor="password">Password</Label>

                            <RippleButton
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="fixed mt-[7em] ml-[20em] bg-red-300/0 hover:bg-accent/0"
                            >
                                {showPassword ? (
                                    <EyeClosed color="#000000" />
                                ) : (
                                    <Eye color="#000000" />
                                )}
                            </RippleButton>

                            <Input
                                id="password"
                                type="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link to="/signu">
                                <u>Sign up</u>
                            </Link>
                        </div>
                        <RippleButton type="submit" className="w-full bg-muted hover:bg-accent">
                            Log-In
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
                        cont="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos."
                    />
                    <p className="px-1"> and </p>
                    <Dialogue
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
