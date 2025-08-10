import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SubmTable } from "@/Data"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { data } from "@/Data"
import { handleCheck } from "@/pages/staff/Submissions/Review"

function stat(params: "Resend Manuscript" | "Manuscript Check" | "Risk Assessment" | "Resend Manuscript" | "Forms Check" | "Deploy Queue") {
  let awa = {
    "Resend Manuscript": "Pending",
    "Manuscript Check": "Pending",
    "Risk Assessment": "Pending",
    "Resend Forms": "Pending",
    "Forms Check": "Pending",
    "Deploy Queue": "Pending",
  }

  if (data.user.role == "Admin Assistant") {
    awa = {
    "Resend Manuscript": "Check",
    "Manuscript Check": "Check",
    "Risk Assessment": "Pending",
    "Resend Forms": "Check",
    "Forms Check": "Check",
    "Deploy Queue": "View",
    }
  }

  if (data.user.role == "Chairperson") {
    awa = {
    "Resend Manuscript": "Check",
    "Manuscript Check": "Check",
    "Risk Assessment": "Check",
    "Resend Forms": "Check",
    "Forms Check": "Check",
    "Deploy Queue": "Check",
    }
  }

  return awa[params]
}

function formatDate(unformatted: string) {
  const dateString = unformatted
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);
  return formattedDate
}

export const columns: ColumnDef<SubmTable>[] = [
  {
    id: "actions",
    header: () => {
      return (
        <div className="p-2 w-[100%] text-center">
          Actions
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          <RippleButton
            className="h-9 w-17 hover:bg-muted rounded-sm text-xs"
            onClick={() => {
              handleCheck(
                row.getValue("proposal_id"),
                row.getValue("proposal_title"),
                row.getValue("researcher"),
                row.getValue("email"),
                formatDate(row.getValue("date")),
                "",
                row.getValue("status"),
                stat(row.getValue("status"))
              )
              window.location.href = "/ssubm/sub1/sreview"
            }}
            disabled={stat(row.getValue("status")) === "Pending"}
          >
            {stat(row.getValue("status"))}
          </RippleButton>
        </div>
      )
    },
    size: 90
  },

  {
    accessorKey: "proposal_id",
    enableHiding: false,
    size: 100,
    header: () => {
      return (
        <div className="text-center">
          ID
        </div>
      )
    },
  },
  {
    accessorKey: "proposal_title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Proposal Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 200
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Date Submitted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      return <div className="text-left">{formatDate(row.getValue("date"))}</div>
    },
    size: 200
  },
  {
    accessorKey: "researcher",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Researcher
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Review Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    size: 200
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-[100%] hover:bg-white"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  // {
  //   accessorKey: "amount",
  //   header: ({column}) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Amount
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button >
  //     )
  //   },
  //   cell: ({ row }) => {
  //     const amount = parseFloat(row.getValue("amount"))
  //     const formatted = new Intl.NumberFormat("en-US", {
  //       style: "currency",
  //       currency: "USD",
  //     }).format(amount)

  //     return <div className="text-right font-medium">{formatted}</div>
  //   },
  // },

]