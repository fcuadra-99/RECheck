"use client"

import * as React from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
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
import { DataTablePagination } from "../pagination"
import { ChevronDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState({})

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleStatusFilter = (status: string) => {
    if (table.getColumn("status")?.getFilterValue() === status) {
    } else {
      table.getColumn("status")?.setFilterValue(status);
    }
  };

  React.useEffect(() => { handleStatusFilter(statuses[0]) }, [])

  const statuses = ["Resend Manuscript", "Manuscript Check", "Risk Assessment", "Resend Forms", "Forms Check", "Deploy Queue"]

  return (
    <div className="z-50">
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
            <Button variant="outline" className="ml-auto ">
              Columns
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(
                (column) => column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ToggleGroup variant="outline" defaultValue={statuses[1]} type="single"className="flex items-center justify-between overflow-x-auto self-center w-auto">
        {statuses.map((status) => (
          <ToggleGroupItem
            key={status}
            variant={
              table.getColumn("status")?.getFilterValue() === status
                ? "default"
                : "outline"
            }
            
            value={status}
            onClick={() => handleStatusFilter(status)}
            className="text-xs grow mb-4 z-50 outline round w-full active:bg-sidebar truncate"
          >
            {status}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="rounded-md border">
        <Table className="z-50">
          <TableHeader className="">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}
                      style={{
                        minWidth: header.column.columnDef.size,
                        maxWidth: header.column.columnDef.size,
                      }}
                      className="truncate border-x-1"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="truncate border-x-1"
                      style={{
                        minWidth: cell.column.columnDef.size,
                        maxWidth: cell.column.columnDef.size,
                      }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="my-5">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}