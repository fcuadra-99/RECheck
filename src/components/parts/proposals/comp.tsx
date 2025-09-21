"use client"

import type { SubmTable } from "@/Data"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/DB"
import { toast } from "sonner"

export default function ProposalsTable() {
  const [data, setData] = useState<SubmTable[]>([])
  const [isLoading, setIsLoading] = useState(true) // <-- track loading
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      getSubm()
    }
  }, [])

  async function getSubm() {
    setIsLoading(true) // <-- start loading
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("updated_on", { ascending: false }); // <-- sort by last updated

      if (data) {
        setData(data as SubmTable[]);
      }
      if (error) toast.error(`${error.message || error}`);
    } catch (err) {
      toast.error(`${err}`);
    } finally {
      setIsLoading(false); // <-- stop loading
    }
  }


  return (
    <div className="container mx-auto py-10 z-50">
      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </div>
  )
}
