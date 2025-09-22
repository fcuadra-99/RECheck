"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { DataTablePagination } from "@/components/parts/pagination"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, LayoutGrid, FileCheck, AlertTriangle, ClipboardCheck, Upload, ListCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    researcher_full_name: false,
    researcher_email: false,
    status: false, // 👈 hide status by default
    review_type: true, // visible by default
  })

  const table = useReactTable({
    data,
    columns: [
      ...columns,
      {
        accessorKey: "researcher_full_name",
        enableHiding: false,
        enableColumnFilter: false,
        header: () => null,
        cell: () => null,
        size: 0,
      },
      {
        accessorKey: "researcher_email",
        enableHiding: false,
        enableColumnFilter: false,
        header: () => null,
        cell: () => null,
        size: 0,
      },
      {
        accessorKey: "status", // 👈 keep status in data, but hidden
        enableHiding: false,
        enableColumnFilter: false,
        header: () => null,
        cell: () => null,
        size: 0,
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const statuses = ["Check Manuscript", "Risk Assessment", "Forms Check", "Deploy Queue"]
  const [activeStatus, setActiveStatus] = React.useState(statuses[0])

  const handleStatusFilter = (status: string) => {
    if (table.getColumn("status")?.getFilterValue() !== status) {
      table.getColumn("status")?.setFilterValue(status)
      setActiveStatus(status)
    }
  }

  // 🔑 hide review_type if activeStatus is "Check Manuscript"
  React.useEffect(() => {
    const reviewTypeCol = table.getColumn("review_type")
    if (!reviewTypeCol) return

    if (activeStatus === "Check Manuscript") {
      reviewTypeCol.toggleVisibility(false)
    } else {
      reviewTypeCol.toggleVisibility(true)
    }
  }, [activeStatus, table])

  React.useEffect(() => {
    handleStatusFilter(statuses[0])
  }, [])

  const skeletonRows = Array.from({ length: 5 })

  return (
    <div className="z-50">
      {/* Search + Column toggle */}
      <div className="flex items-center pb-6">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by proposal title..."
            value={(table.getColumn("proposal_title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("proposal_title")?.setFilterValue(event.target.value)
            }
            className="pl-8 text-sm bg-white/50 focus:bg-white transition-colors"
          />
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-4 text-gray-600 border-gray-200 hover:bg-gray-50">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Columns
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.getCanHide() &&
                  column.id !== "researcher_full_name" &&
                  column.id !== "researcher_email" &&
                  column.id !== "status" && // 👈 exclude from dropdown
                  !(activeStatus === "Check Manuscript" && column.id === "review_type")
              )
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status filter toggle group */}
      <div className="mb-6">
        <ToggleGroup
          variant="outline"
          defaultValue={statuses[0]}
          type="single"
          className="flex items-center justify-between gap-2 overflow-x-auto self-center w-auto bg-white/50 p-1 rounded-lg border"
        >
          {statuses.map((status) => (
            <ToggleGroupItem
              key={status}
              variant={activeStatus === status ? "default" : "outline"}
              value={status}
              onClick={() => handleStatusFilter(status)}
              className={cn(
                "flex items-center justify-center text-sm z-50 overflow-hidden rounded-md border-0 font-medium hover:text-white transition-all",
                "min-h-9 px-2 sm:px-3", // Responsive padding
                activeStatus === status
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title={status} // Show full text on hover
            >
              {/* Icons - always visible */}
              <span className="flex-shrink-0">
                {status === "Check Manuscript" && <FileCheck className="w-4 h-4" />}
                {status === "Risk Assessment" && <AlertTriangle className="w-4 h-4" />}
                {status === "Forms Check" && <ClipboardCheck className="w-4 h-4" />}
                {status === "Deploy Queue" && <Upload className="w-4 h-4" />}
              </span>

              {/* Text - hidden on small screens, visible on medium+ */}
              <span className="hidden sm:block ml-2 max-w-[120px] truncate">
                {status}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white/50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                    className={cn(
                      "h-11 px-4 text-sm select-none bg-gray-50/50  border-2",
                      header.column.getCanSort() && "cursor-pointer hover:bg-gray-50"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <div className="opacity-50 hover:opacity-100">
                          {header.column.getIsSorted() === "asc" && <ChevronUp className="h-4 w-4" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown className="h-4 w-4" />}
                          {!header.column.getIsSorted() && <ChevronsUpDown className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? skeletonRows.map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableCell key={col.id} className="p-4  border-2">
                      <Skeleton className="h-5 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : table.getRowModel().rows.length
                ? table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "transition-colors",
                      row.getIsSelected() && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          minWidth: cell.column.columnDef.size,
                          maxWidth: cell.column.columnDef.size,
                        }}
                        className="px-4 py-3  border-2"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
                : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center  border-2"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ListCheck className="h-8 w-8 mb-2 text-gray-400" />
                        <p>No results found</p>
                        <p className="text-sm text-gray-400">You're all caught up</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="my-5">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
