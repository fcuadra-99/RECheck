import { motion } from "framer-motion"
import { Mail, CheckCircle } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/DB"

export default function ConfirmEmailPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      const hash = window.location.hash || ""
      const search = window.location.search || ""
      
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : "")
      const searchParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : "")
      
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token")
      const type = hashParams.get("type") || searchParams.get("type")

      if (type === "recovery" && accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            throw error
          }

          if (data.session) {
            toast.success("Reset link validated. Redirecting to password reset.")
            navigate("/reset")
            return
          }

          throw new Error("Unable to restore session from reset link.")
        } catch (err: any) {
          const message = err?.message ?? "Invalid or expired reset link."
          setErrorMessage(message)
          toast.error(message)
          setStatus("invalid")
          return
        }
      }

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            throw error
          }

          if (data.session) {
            toast.success("Email confirmed. You can now access your account.")
            setStatus("valid")
            return
          }

          throw new Error("Session could not be established.")
        } catch (err: any) {
          const message = err?.message ?? "Invalid or expired confirmation link."
          setErrorMessage(message)
          toast.error(message)
          setStatus("invalid")
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (data.session) {
        toast.success("Email confirmed. You can now access your account.")
        setStatus("valid")
        return
      }

      setErrorMessage("This page can only be reached from a valid email link.")
      setStatus("invalid")
    }

    processCallback()
  }, [navigate])

  if (status === "checking") {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 p-6">
            <Mail className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Processing link...</h1>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we validate your email confirmation link.
          </p>
        </div>
      </div>
    )
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-screen p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-destructive/10 p-6">
            <Mail className="size-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage ?? "This page can only be reached by following the email confirmation link."}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button className="w-full" onClick={() => navigate("/login")}>Go to Login</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="grid min-h-svh lg:grid-cols-2 overflow-hidden"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Left (content side) */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Avatar>
                <AvatarImage src={"logoo.png"} className="w-auto h-auto contain-content " />
              </Avatar>
            </div>
            UIC RECheck
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md text-center space-y-8">
            {/* Email Icon */}
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Email Verified!</h1>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now access your account.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">Email address confirmed</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">Account is now active</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">You can now log in to your account</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </div>

            {/* Support text */}
            <p className="text-xs text-muted-foreground">
              Need help? <a href="#" className="text-primary hover:underline">Contact support</a>
            </p>
            {errorMessage && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right (background) */}
      <div className="bg-muted relative hidden lg:block">
      </div>
    </motion.div>
  )
}
