import { DataTablePagination } from "../pagination"
import { columns, type Payment } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "Pending Result",
      email: "m@example.com",
    },
    {
      id: "as",
      amount: 100,
      status: "Pending Result",
      email: "a@example.com",
    },
    {
      id: "adssa",
      amount: 100,
      status: "Pending Result",
      email: "q@example.com",
    },
    {
      id: "asdasdasd",
      amount: 100,
      status: "Pending Result",
      email: "x@example.com",
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "Pending Result",
      email: "m@example.com",
    },
    {
      id: "as",
      amount: 100,
      status: "Pending Result",
      email: "a@example.com",
    },
    {
      id: "adssa",
      amount: 100,
      status: "Pending Result",
      email: "q@example.com",
    },
    {
      id: "asdasdasd",
      amount: 100,
      status: "Pending Result",
      email: "x@example.com",
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "Pending Result",
      email: "m@example.com",
    },
    {
      id: "as",
      amount: 100,
      status: "Pending Result",
      email: "a@example.com",
    },
    {
      id: "adssa",
      amount: 100,
      status: "Pending Result",
      email: "q@example.com",
    },
  ]
}

export default async function ProposalsTable() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}