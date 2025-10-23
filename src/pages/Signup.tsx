import { motion } from "framer-motion"

import { SignupForm } from "@/components/parts/signu-form"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

export default function SignUpPage() {
  return (
    <motion.div
      className="grid min-h-svh lg:grid-cols-2 overflow-clip"
      initial={{ x: -300, opacity: 0 }}  
      animate={{ x: 0, opacity: 1 }}      
      exit={{ x: 300, opacity: 0 }}     
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Left background image */}
      <div className="bg-muted relative hidden lg:block">
      </div>

      {/* Right side (form) */}
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
            <SignupForm />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
