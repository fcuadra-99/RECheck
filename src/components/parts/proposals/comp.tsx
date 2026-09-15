"use client"

import type { SubmTable } from "@/Data"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/DB"
import { toast } from "sonner"

export default function ProposalsTable() {
  const [data, setData] = useState<SubmTable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      getSubm()
    }
  }, [])

  useEffect(() => {
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void getSubm()
    }

    window.addEventListener("focus", refreshWhenActive)
    document.addEventListener("visibilitychange", refreshWhenActive)
    const intervalId = window.setInterval(refreshWhenActive, 30000)

    return () => {
      window.removeEventListener("focus", refreshWhenActive)
      document.removeEventListener("visibilitychange", refreshWhenActive)
      window.clearInterval(intervalId)
    }
  }, [])

  async function getSubm() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("updated_on", { ascending: false })

      if (data) {
        setData(data as SubmTable[])
      }
      if (error) toast.error(`${error.message || error}`)
    } catch (err) {
      toast.error(`${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-4 z-50">
      <DataTable columns={columns} data={data} isLoading={isLoading} onRefresh={getSubm} />
    </div>
  )
}
