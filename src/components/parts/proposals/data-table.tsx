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
import { Pagination } from "@/components/parts/table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, LayoutGrid, ListCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { supabase } from "@/DB"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
}

interface Phase {
  id: string;
  title: string;
  description?: string | null;
  statuses: { name: string; sort_order: number; actor: string }[];
  required_files: { file_id: string; required: boolean; user_upload?: boolean }[];
  created_at: string;
  updated_at?: string;
}

// Helper functions for localStorage
const getStoredActiveStatus = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("dataTable-activeStatus");
  }
  return null;
};

const setStoredActiveStatus = (status: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("dataTable-activeStatus", status);
  }
};

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    protocol_id: true,
    researcher_full_name: false,
    researcher_email: false,
    status: false,
    review_type: true,
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
        accessorKey: "status",
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

  const [phases, setPhases] = React.useState<Phase[]>([]);
  const [loadingPhases, setLoadingPhases] = React.useState(true);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  loadingPhases;

  useEffect(() => {
    const fetchPhases = async () => {
      setLoadingPhases(true);
      try {
        const { data } = await supabase.from("phases").select("*");
        setPhases(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPhases(false);
      }
    };
    fetchPhases();
  }, []);

  const statuses: string[] = React.useMemo(() => phases
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .flatMap(p =>
      (p.statuses || [])
        .filter(s => ["Admin Assistant", "Chairperson"].includes(s.actor))
        .sort((a, b) => a.sort_order - b.sort_order)
    )
    .map(s => s.name)
    .filter(status => status !== "Deviation Check" && status !== "Study Report Check"), [phases]);

  const uniqueStatuses = [...new Set(statuses)];
  
  // Initialize activeStatus from localStorage or use the first available status
  const [activeStatus, setActiveStatus] = React.useState<string>("");

  // Initialize active status once when phases are loaded
  useEffect(() => {
    if (uniqueStatuses.length > 0 && !hasInitialized) {
      const storedStatus = getStoredActiveStatus();
      const initialStatus = storedStatus && uniqueStatuses.includes(storedStatus) 
        ? storedStatus 
        : uniqueStatuses[0];
      
      setActiveStatus(initialStatus);
      table.getColumn("status")?.setFilterValue(initialStatus);
      setStoredActiveStatus(initialStatus);
      setHasInitialized(true);
    }
  }, [uniqueStatuses, hasInitialized, table]);

  // Status filter handler
  const handleStatusFilter = (status: string) => {
    setActiveStatus(status);
    table.getColumn("status")?.setFilterValue(status);
    setStoredActiveStatus(status);
  };

  // Hide review_type if activeStatus is "Check Manuscript"
  React.useEffect(() => {
    const reviewTypeCol = table.getColumn("review_type")
    if (!reviewTypeCol) return

    if (activeStatus === "Check Manuscript") {
      reviewTypeCol.toggleVisibility(false)
    } else {
      reviewTypeCol.toggleVisibility(true)
    }
  }, [activeStatus, table])

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
                  column.id !== "status" &&
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
      {statuses.length > 0 && (
        <div className="mb-6">
          <ToggleGroup
            variant="outline"
            value={activeStatus}
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
                  "min-h-9 px-2 sm:px-3",
                  activeStatus === status
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                )}
                title={status}
              >
                {status}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

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
                        className="px-4 py-3  border-2 truncate"
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
        <Pagination table={table} />
      </div>
    </div>
  )
}