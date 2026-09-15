import { motion } from "framer-motion"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="grid min-h-svh lg:grid-cols-2 overflow-hidden"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
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
            {/* Error Code */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-2">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
                <p className="text-muted-foreground text-base">
                  The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-foreground">Here are some helpful links:</p>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>

            {/* Additional Help */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                Still need help? Contact our support team
              </p>
              <a href="mailto:support@uicrec.com" className="text-primary hover:underline text-sm font-medium">
                support@uicrec.com
              </a>
            </div>

            {/* Decorative elements */}
            <div className="pt-4 space-y-2 opacity-60">
              <div className="h-1 w-16 bg-primary/30 rounded-full mx-auto"></div>
              <div className="h-1 w-8 bg-primary/20 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right (background) */}
      <div className="bg-muted relative hidden lg:block">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-96 h-96 border-2 border-border/20 rounded-full"></div>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-64 h-64 border-2 border-border/10 rounded-full"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
