import { type ColumnDef } from "@tanstack/react-table"
import { FileText, Hash, Eye, Clock, Scale, ClipboardCheck, Workflow, Calendar, Tags, ListFilter, Activity, UserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import type { SubmTable } from "@/Data"
import { handleCheck } from "@/pages/staff/Submissions/Review"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/DB"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type StatusParam =
  | "Resend Manuscript"
  | "Check Manuscript"
  | "Risk Assessment"
  | "Resend Forms"
  | "Forms Check"
  | "Deploy Queue"
  | "Send Revision"
  | "Check Revision"
  | "Resend Revision"
  | "Assign Review"
  | "Proposal Review"
  | "Revise Proposal"
  | "Data Collection"
  | "Deviation Check"
  | "Study Report Check";

type StatusValue = "Pending" | "Check" | "Assess" | "View" | "Assign";

// FIXED: Get current user role from database
async function getCurrentUserRole(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Unknown";

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return profile?.role || "Unknown";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "Unknown";
  }
}

// Cache for user role to avoid repeated database calls
let cachedUserRole: string | null = null;
let rolePromise: Promise<string> | null = null;

async function getCurrentUserRoleCached(): Promise<string> {
  if (cachedUserRole !== null) {
    return cachedUserRole;
  }
  
  if (rolePromise !== null) {
    return rolePromise;
  }
  
  rolePromise = getCurrentUserRole().then(role => {
    cachedUserRole = role;
    rolePromise = null;
    return role;
  });
  
  return rolePromise;
}

async function stat(params: StatusParam | null | undefined): Promise<StatusValue> {
  if (!params) return "Pending"; // default for empty status

  const userRole = await getCurrentUserRoleCached();
  console.log("Current user role:", userRole);
  console.log("Current status:", params);

  let awa: Record<StatusParam, StatusValue> = {
    "Resend Manuscript": "Pending",
    "Check Manuscript": "Pending",
    "Risk Assessment": "Pending",
    "Resend Forms": "Pending",
    "Forms Check": "Pending",
    "Deploy Queue": "Pending",
    "Send Revision": "Pending",
    "Check Revision": "Pending",
    "Resend Revision": "Pending",
    "Assign Review": "Assign",
    "Proposal Review": "Pending",
    "Revise Proposal": "Pending",
    "Data Collection": "Pending",
    "Deviation Check": "Pending",
    "Study Report Check": "Pending",
  }

  if (userRole === "Admin Assistant") {
    awa = {
      "Resend Manuscript": "Check",
      "Check Manuscript": "Check",
      "Risk Assessment": "Pending",
      "Resend Forms": "Check",
      "Forms Check": "Check",
      "Deploy Queue": "View",
      "Send Revision": "Pending",
      "Check Revision": "Pending",
      "Resend Revision": "Pending",
      "Assign Review": "Assign",
      "Proposal Review": "Pending",
      "Revise Proposal": "Pending",
      "Data Collection": "View",
      "Deviation Check": "View",
      "Study Report Check": "View",
    }
  }

  if (userRole === "Chairperson") {
    awa = {
      "Resend Manuscript": "Assess",
      "Check Manuscript": "Pending",
      "Risk Assessment": "Assess",
      "Resend Forms": "Check",
      "Forms Check": "Pending",
      "Deploy Queue": "Check",
      "Send Revision": "Pending",
      "Check Revision": "Check",
      "Resend Revision": "Pending",
      "Assign Review": "Assign",
      "Proposal Review": "View",
      "Revise Proposal": "Pending",
      "Data Collection": "View",
      "Deviation Check": "Check",
      "Study Report Check": "Check",
    }
  }

  if (userRole === "Admin") {
    awa = {
      "Resend Manuscript": "Check",
      "Check Manuscript": "Check",
      "Risk Assessment": "Assess",
      "Resend Forms": "Check",
      "Forms Check": "Check",
      "Deploy Queue": "Check",
      "Send Revision": "Check",
      "Check Revision": "Check",
      "Resend Revision": "Check",
      "Assign Review": "Assign",
      "Proposal Review": "Check",
      "Revise Proposal": "Check",
      "Data Collection": "View",
      "Deviation Check": "Check",
      "Study Report Check": "Check",
    }
  }

  return awa[params] ?? "Pending";
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
    header: () => (
      <div className="flex items-center justify-center gap-2">
        <Workflow className="h-4 w-4 text-gray-500" />
        <span>Actions</span>
      </div>
    ),
    cell: ({ row }) => {
      const navigate = useNavigate()
      const [actionStatus, setActionStatus] = useState<StatusValue>("Pending");

      // FIXED: Fetch status asynchronously
      useEffect(() => {
        const fetchStatus = async () => {
          try {
            const status = await stat(row.getValue("status"));
            setActionStatus(status);
          } catch (error) {
            console.error("Error fetching action status:", error);
            setActionStatus("Pending");
          }
        };

        fetchStatus();
      }, [row]);

      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <RippleButton
                  className={cn(
                    "h-8 px-3 rounded-md text-sm font-medium",
                    actionStatus === "Pending" ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10",
                    actionStatus === "Check" && "",
                    actionStatus === "Assess" && "",
                    actionStatus === "View" && "bg-gray-500 text-white hover:bg-gray-600",
                    actionStatus === "Assign" && ""
                  )}
                  onClick={() => {
                    handleCheck(
                      row.getValue("proposal_id"),
                      row.getValue("proposal_title"),
                      row.getValue('researcher_full_name'),
                      row.getValue('researcher_email'),
                      formatDate(row.getValue("date")),
                      "",
                      row.getValue("status"),
                      actionStatus
                    )
                    navigate("/ssubm/sub1/sreview")
                  }}
                  disabled={actionStatus === "Pending"}
                >
                  {actionStatus === "Check" && <ClipboardCheck className="h-4 w-4 mr-2" />}
                  {actionStatus === "Assess" && <Scale className="h-4 w-4 mr-2" />}
                  {actionStatus === "View" && <Eye className="h-4 w-4 mr-2" />}
                  {actionStatus === "Pending" && <Clock className="h-4 w-4 mr-2" />}
                  {actionStatus === "Assign" && <UserRound className="h-4 w-4 mr-2" />}
                  {actionStatus}
                </RippleButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {actionStatus === "Pending" ? "Awaiting previous steps" : `Click to ${actionStatus}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    size: 120,
  },
  // ... rest of your column definitions remain the same
  {
    accessorKey: "proposal_id",
    enableHiding: false,
    size: 100,
    header: () => (
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-gray-500" />
        <span>ID</span>
      </div>
    ),
  },
  {
    accessorKey: "protocol_id",
    header: () => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span>Protocol Code</span>
      </div>
    ),
    cell: ({ row }) => {
      const protocolId = row.getValue("protocol_id") as string | null;
      return (
        <div className="flex items-center gap-2">
          {protocolId ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {protocolId}
            </Badge>
          ) : (
            <span className="text-gray-400 text-xs">Not assigned</span>
          )}
        </div>
      );
    },
    size: 250,
  },
  {
    accessorKey: "proposal_title",
    header: () => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span>Proposal Title</span>
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "researcher",
    header: ({ }) => (
      <>
        <UserRound className="h-4 w-4 text-gray-500" />
        Researcher
      </>

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

      fname;
      lname;

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
    size: 160,
  },
  {
    accessorKey: "date",
    header: () => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>Date Submitted</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <time dateTime={row.getValue("date")} className="text-gray-600">
          {formatDateTime(row.getValue("date"))}
        </time>
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "updated_on",
    header: () => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span>Last Updated</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <time dateTime={row.getValue("updated_on")} className="text-gray-600">
          {formatDateTime(row.getValue("updated_on"))}
        </time>
      </div>
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
    header: () => (
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4 text-gray-500" />
        <span>Category</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-gray-600 bg-gray-50/50">
          {row.getValue("category") || "Not provided"}
        </Badge>
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "review_type",
    header: () => (
      <div className="flex items-center gap-2">
        <ListFilter className="h-4 w-4 text-gray-500" />
        <span>Review Type</span>
      </div>
    ),
    cell: ({ row }) => {
      const reviewType = row.getValue("review_type") as string
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              reviewType === "Expedited" && "bg-green-50 text-green-700 border-green-300",
              reviewType === "Full Board" && "bg-amber-50 text-amber-700 border-amber-300",
              reviewType === "Exempt" && "bg-blue-50 text-blue-700 border-blue-300"
            )}
          >
            {reviewType || "Pending"}
          </Badge>
        </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-gray-500" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              status.includes("Check") && "bg-blue-50 text-blue-700 border-blue-300",
              status.includes("Resend") && "bg-red-50 text-red-700 border-red-300",
              status === "Risk Assessment" && "bg-amber-50 text-amber-700 border-amber-300",
              status === "Deploy Queue" && "bg-green-50 text-green-700 border-green-300",
              status === "Send Revision" && "bg-purple-50 text-purple-700 border-purple-300",
              status === "Check Revision" && "bg-indigo-50 text-indigo-700 border-indigo-300",
              status === "Assign Review" && "bg-pink-50 text-pink-700 border-pink-300",
              status === "Proposal Review" && "bg-teal-50 text-teal-700 border-teal-300",
              status === "Revise Proposal" && "bg-orange-50 text-orange-700 border-orange-300"
            )}
          >
            {status}
          </Badge>
        </div>
      )
    },
  },
]