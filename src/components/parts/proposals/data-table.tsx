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
import { ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div className="flex items-center pb-4">
        <Input
          placeholder="Search by proposal title"
          value={(table.getColumn("proposal_title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("proposal_title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm mr-5 text-sm z-50"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
              <ChevronDown />
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
      <ToggleGroup
        variant="outline"
        defaultValue={statuses[0]}
        type="single"
        className="flex items-center justify-between overflow-x-auto self-center w-auto"
      >
        {statuses.map((status) => (
          <ToggleGroupItem
            key={status}
            variant={activeStatus === status ? "default" : "outline"}
            value={status}
            onClick={() => handleStatusFilter(status)}
            className="text-xs grow mb-4 z-50 outline round w-full active:bg-sidebar truncate"
          >
            {status}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Table */}
      <div className="rounded-md border">
        <Table className="z-50">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                    className="truncate border-x-1"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? skeletonRows.map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="truncate border-x-1"
                        style={{
                          minWidth: cell.column.columnDef.size,
                          maxWidth: cell.column.columnDef.size,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="px-4">
                    No results.
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
