import { GalleryVerticalEnd } from "lucide-react"
import { motion } from "framer-motion"

import { LoginForm } from "@/components/parts/login-form"

export default function LoginPage() {
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
              <GalleryVerticalEnd className="size-4" />
            </div>
            UIC RECheck
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right (background image) */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </motion.div>
  )
}


