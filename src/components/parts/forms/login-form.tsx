import { Eye, EyeClosed, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Dialogue } from "../dialogs/dialogue"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { supabase } from "@/DB"

export interface LoginFormProps extends React.ComponentProps<"div"> {}

export function LoginForm({
    className,
    ...props
}: LoginFormProps) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [isSending, setIsSending] = useState(false);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

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

    const handleForgotPassword = async () => {
        if (!forgotPasswordEmail) {
            toast.error("Please enter your email address");
            return;
        }

        if (cooldown > 0) {
            toast.error(`Please wait ${cooldown} seconds before sending another request`);
            return;
        }

        setIsSending(true);
        const loading = toast.loading("Sending reset password email...");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
                redirectTo: `${window.location.origin}/reset`,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Password reset email sent! Check your inbox.");
            setShowForgotPassword(false);
            setForgotPasswordEmail('');
            // Set cooldown to 60 seconds (1 minute)
            setCooldown(60);
            
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Try again.");
        } finally {
            setIsSending(false);
            toast.dismiss(loading);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

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

                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "password" : "text"}
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <RippleButton
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute mt-[7em] ml-[20em] bg-red-300/0 hover:bg-accent/0"
                            >
                                {showPassword ? (
                                    <EyeClosed color="#000000" />
                                ) : (
                                    <Eye color="#000000" />
                                )}
                            </RippleButton>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline ml-50 p-0"
                            >
                                Forgot password?
                            </button>
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

            {/* Forgot Password Dialog */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Reset Password</h2>
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordEmail('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>

                            <p className="text-sm text-gray-600">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <div className="grid gap-3">
                                <Label htmlFor="forgot-email">Email</Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={forgotPasswordEmail}
                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                    required
                                    disabled={cooldown > 0}
                                />
                                {cooldown > 0 && (
                                    <p className="text-sm text-orange-600">
                                        Please wait {cooldown} seconds before requesting another reset link.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                <RippleButton
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordEmail('');
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400"
                                    disabled={isSending}
                                >
                                    Cancel
                                </RippleButton>
                                <RippleButton
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isSending || cooldown > 0}
                                >
                                    {isSending ? "Sending..." : cooldown > 0 ? `Wait ${cooldown}s` : "Send Reset Link"}
                                </RippleButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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