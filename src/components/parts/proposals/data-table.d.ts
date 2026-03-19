import { type ColumnDef } from "@tanstack/react-table";
export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
}
export declare function DataTable<TData, TValue>({ columns, data, isLoading, }: DataTableProps<TData, TValue>): import("react/jsx-runtime").JSX.Element;
