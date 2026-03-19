import { Eye, EyeClosed, GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate, useSearchParams } from "react-router"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { Dialogue } from "../dialogs/dialogue"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { supabase } from "@/DB"

export interface ResetFormProps extends React.ComponentProps<"div"> {}

export function ResetForm({
    className,
    ...props
}: ResetFormProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(true);
    const [showConfirmPassword, setShowConfirmPassword] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Check if we have a valid reset token from URL
    useEffect(() => {
        const checkResetSession = async () => {
            try {
                // Get the access token from URL if present
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const type = searchParams.get('type');

                // If we have tokens in URL, set the session
                if (accessToken && refreshToken && type === 'recovery') {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        console.error('Session error:', error);
                        toast.error("Invalid or expired reset link. Please request a new password reset.");
                        setCheckingSession(false);
                        return;
                    }

                    if (data.session) {
                        setIsValidSession(true);
                        setCheckingSession(false);
                        return;
                    }
                }

                // Check existing session
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    setIsValidSession(true);
                } else {
                    toast.error("Invalid or expired reset link. Please request a new password reset.");
                }
            } catch (err) {
                console.error('Session check error:', err);
                toast.error("Something went wrong. Please try again.");
            } finally {
                setCheckingSession(false);
            }
        };
        
        checkResetSession();
    }, [navigate, searchParams]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);
        const loading = toast.loading("Updating password...");

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Password updated successfully! You can now log in with your new password.");
            
            // Sign out and redirect to login
            await supabase.auth.signOut();
            navigate("/login");

        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Try again.");
        } finally {
            setIsLoading(false);
            toast.dismiss(loading);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    // Show loading while checking session
    if (checkingSession) {
        return (
            <div className={cn("flex flex-col gap-6 items-center justify-center", className)} {...props}>
                <div className="flex flex-col items-center gap-2">
                    <GalleryVerticalEnd className="size-8 animate-pulse" />
                    <h1 className="text-xl font-bold">Checking reset link...</h1>
                </div>
            </div>
        );
    }

    // Show error if no valid session
    if (!isValidSession) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
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
                    <h1 className="text-xl font-bold">Invalid Reset Link</h1>
                    <p className="text-sm text-gray-600 text-center">
                        This password reset link is invalid or has expired.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <RippleButton 
                        onClick={() => navigate("/login")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Back to Login
                    </RippleButton>
                    <div className="text-center text-sm">
                        Need a new reset link?{" "}
                        <Link to="/login">
                            <u>Request a new one</u>
                        </Link>
                    </div>
                </div>
            </div>
        );
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
                        <h1 className="text-xl font-bold">Reset Your Password</h1>
                        <p className="text-sm text-gray-600 text-center">
                            Enter your new password below
                        </p>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "password" : "text"}
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <RippleButton
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-accent/10"
                                >
                                    {showPassword ? (
                                        <EyeClosed color="#000000" size={18} />
                                    ) : (
                                        <Eye color="#000000" size={18} />
                                    )}
                                </RippleButton>
                            </div>

                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "password" : "text"}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <RippleButton
                                    type="button"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-accent/10"
                                >
                                    {showConfirmPassword ? (
                                        <EyeClosed color="#000000" size={18} />
                                    ) : (
                                        <Eye color="#000000" size={18} />
                                    )}
                                </RippleButton>
                            </div>
                        </div>
                        
                        <RippleButton 
                            type="submit" 
                            className="w-full bg-primary text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Reset Password"}
                        </RippleButton>
                        
                        <div className="text-center text-sm">
                            Remember your password?{" "}
                            <Link to="/login">
                                <u>Back to Log in</u>
                            </Link>
                        </div>
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