import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router"
import { RippleButton } from "../animate-ui/buttons/ripple"
import { Diademo } from "./dialogue"

const handleSubmit = (event: any) => {
    event.preventDefault();
    alert(`yoyoyoyoyoyooyoyoyoy`)
}

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

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
                            <Label htmlFor="fname">First Name</Label>
                            <Input
                                id="fname"
                                type="text"
                                required
                            />
                            <Label htmlFor="lname">Last Name</Label>
                            <Input
                                id="lname"
                                type="text"
                                required
                            />
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                            <Label htmlFor="org">Organization</Label>
                            <Input
                                id="org"
                                type="text"
                                required
                            />
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                            />
                            <Label htmlFor="password">Confirm Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                            />
                        </div>
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link to="/login">
                                <u>Log-In</u>
                            </Link>
                        </div>
                        <RippleButton type="submit" className="w-full bg-muted hover:bg-accent">
                            Sign-Up
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
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos."
                    />
                </div>
            </div>
        </div>
    )
}
