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

  // Set up real-time subscription for proposals table
  useEffect(() => {
    const channel = supabase
      .channel('proposals-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'proposals'
        },
        (payload) => {
          console.log('Proposals change detected:', payload)
          // Refetch data when any change occurs
          getSubm()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
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
