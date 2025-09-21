import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useNavigate } from "react-router"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import type { SubmTable } from "@/Data"
import { data } from "@/Data"
import { handleCheck } from "@/pages/staff/Submissions/Review"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/DB"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

function stat(params: "Resend Manuscript" | "Check Manuscript" | "Risk Assessment" | "Forms Check" | "Deploy Queue") {
  let awa = {
    "Resend Manuscript": "Pending",
    "Check Manuscript": "Pending",
    "Risk Assessment": "Pending",
    "Resend Forms": "Pending",
    "Forms Check": "Pending",
    "Deploy Queue": "Pending",
  }

  if (data.user.role == "Admin Assistant") {
    awa = {
      "Resend Manuscript": "Check",
      "Check Manuscript": "Check",
      "Risk Assessment": "Pending",
      "Resend Forms": "Check",
      "Forms Check": "Check",
      "Deploy Queue": "View",
    }
  }

  if (data.user.role == "Chairperson") {
    awa = {
      "Resend Manuscript": "Assess",
      "Check Manuscript": "Check",
      "Risk Assessment": "Assess",
      "Resend Forms": "Check",
      "Forms Check": "Check",
      "Deploy Queue": "View",
    }
  }

  return awa[params]
}

function formatDate(unformatted: string) {
  const date = new Date(unformatted)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
  return new Intl.DateTimeFormat("en-US", options).format(date)
}

function formatDateTime(unformatted: string) {
  const date = new Date(unformatted)
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }
  return new Intl.DateTimeFormat("en-US", options).format(date)
}


export const columns: ColumnDef<SubmTable>[] = [
  {
    id: "actions",
    header: () => <div className="p-2 w-full text-center">Actions</div>,
    cell: ({ row }) => {
      const navigate = useNavigate()
      return (
        <div className="flex justify-center">
          <RippleButton
            className="h-9 w-17 hover:bg-muted rounded-sm text-xs"
            onClick={() => {
              handleCheck(
                row.getValue("proposal_id"),
                row.getValue("proposal_title"),
                row.getValue('researcher_full_name'),
                row.getValue('researcher_email'),
                formatDate(row.getValue("date")),
                "",
                row.getValue("status"),
                stat(row.getValue("status"))
              )
              navigate("/ssubm/sub1/sreview")
            }}
            disabled={stat(row.getValue("status")) === "Pending"}
          >
            {stat(row.getValue("status"))}
          </RippleButton>
        </div>
      )
    },
    size: 90,
  },
  {
    accessorKey: "proposal_id",
    enableHiding: false,
    size: 100,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "proposal_title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Proposal Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    size: 200,
  },
  {
    accessorKey: "researcher",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Researcher
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const [loading, setLoading] = useState(false)
      const [open, setOpen] = useState(false)
      const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
      const [fname, setFname] = useState<string | null>(null)
      const [lname, setLname] = useState<string | null>(null)
      const [email, setEmail] = useState<string | null>(null)
      const [org, setOrg] = useState<string | null>(null)
      const [category, setCategory] = useState<string | null>(null)

      const researcherId = row.getValue("researcher") as string
      const fullName = row.getValue("researcher_full_name") as string | null

      // Use researcher_full_name for initials
      const initials = fullName
        ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "?"

      // ✅ Only fetch avatar/details when dialog opens
      useEffect(() => {
        if (!open || !researcherId) return

        // ✅ Reset previous state
        setAvatarUrl(null)
        setFname(null)
        setLname(null)
        setEmail(null)
        setOrg(null)
        setCategory(null)
        setLoading(true)

        if (!researcherId) {
          setLoading(false)
          return
        }

        const fetchProfile = async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("fname, lname, email, org, category")
            .eq("id", researcherId)
            .single()

          if (!error && data) {
            setFname(data.fname)
            setLname(data.lname)
            setEmail(data.email)
            setOrg(data.org)
            setCategory(data.category)

            const { data: publicUrlData } = supabase.storage
              .from("profiles")
              .getPublicUrl(`${researcherId}/avatar.png`)

            if (publicUrlData?.publicUrl) {
              setAvatarUrl(publicUrlData.publicUrl)
            }
          }

          setLoading(false)
        }

        fetchProfile()
      }, [open, researcherId])

      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="rounded-full transition-all cursor-pointer hover:ring-2 hover:ring-primary/70"
                  onClick={() => setOpen(true)}
                >
                  {/* ✅ Table shows only initials */}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent className="pointer-events-none ">
                <p>{fullName || "Unknown Researcher"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* ✅ Dialog loads actual avatar */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{fullName || "Unknown Researcher"}</DialogTitle>
                <DialogDescription>Researcher Details</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center mt-4">
                <Avatar className="h-50 w-50 m-5 mb-15 border-10 border-primary">
                  {avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={fullName || "Researcher"}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  )}
                </Avatar>

                <Table className="w-full">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell>{researcherId || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell>
                        {loading ? <Skeleton className="h-4 w-40" /> : (email || "Not provided")}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Organization</strong></TableCell>
                      <TableCell>
                        {loading ? <Skeleton className="h-4 w-40" /> : (org || "Not provided")}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell>
                        {loading ? <Skeleton className="h-4 w-40" /> : (category || "Not provided")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Date Submitted
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-left">{formatDateTime(row.getValue("date"))}</div>
    ),
    size: 200,
  },
  {
    accessorKey: "updated_on",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Last Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-left">{formatDateTime(row.getValue("updated_on"))}</div>
    ),
    size: 200,
  },
  {
    accessorKey: "researcher_full_name",
  },
  {
    accessorKey: "researcher_email",
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {row.getValue("category") || "Not provided"}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "review_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Review Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    size: 200,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="w-full hover:bg-white"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
]
