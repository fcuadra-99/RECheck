import { motion } from "framer-motion"
import { Mail, CheckCircle } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function ConfirmEmailPage() {
  const navigate = useNavigate()

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
                <h1 className="text-3xl font-bold text-foreground">Confirm Your Email</h1>
                <p className="text-muted-foreground">
                  We've sent a confirmation link to your email address. Please check your inbox and click the link to verify your account.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">Check your email inbox for the verification link</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">If not found, check your spam or junk folder</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground text-left">Click the link in the email to complete verification</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button className="w-full" size="lg">
                Open Email Client
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </div>

            {/* Support text */}
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? <a href="#" className="text-primary hover:underline">Resend verification link</a>
            </p>
          </div>
        </div>
      </div>

      {/* Right (background) */}
      <div className="bg-muted relative hidden lg:block">
      </div>
    </motion.div>
  )
}
