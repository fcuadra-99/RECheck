import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@radix-ui/react-label"
import { Input } from "@/components/ui/input"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface RadixSidebarDemoProps {
  fname: string,
  lname: string,
  email: string,
  org: string,
  avatar: string,
  role: string,
}

const Profile = ({
  fname,
  lname,
  email,
  org,
  avatar,
  role,
}: RadixSidebarDemoProps) => {
  return (
    <form action="">
      <div>
        <div className="px-4 space-y-6 sm:px-6 mt-5">
          <header className="space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-17 w-17 rounded-b-full mr-5">
                <AvatarImage
                  src={avatar}
                />
                <AvatarFallback className="rounded-lg">{lname[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{`${lname}, ${fname}`}</h1>
                <Button size="sm">Change photo</Button>
              </div>
            </div>
          </header>
          <div className="space-y-8">
            <Card>
              <CardHeader className="font-semibold text-xl h-5">Details:</CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" defaultValue={`${fname}`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" defaultValue={`${lname}`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={email} />
                </div>
              </CardContent>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Organization</Label>
                  <Input id="email" defaultValue={org} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={role} disabled={true} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="font-semibold text-xl h-5">Change Password</CardHeader>
              <CardHeader>

                <div>For your security, please do not share your password with others.</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input type="password" id="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input type="password" id="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input type="password" id="confirm-password" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="pt-6">
            <Button>Save</Button>
          </div>
        </div>
      </div>
    </form>

  )
}

export default Profile;