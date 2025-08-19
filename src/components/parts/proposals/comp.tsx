'use-client'

import type { SubmTable } from "@/Data"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useState } from "react"
import * as React from "react"
import { supabase } from "@/DB"
import { toast } from "sonner"

export default function ProposalsTable() {
    const [data, setData] = useState<SubmTable[]>([])
    const hasFetched = React.useRef(false);

    React.useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            getSubm();
        }
    }, [])

    async function getSubm() {
        const loading = toast.loading("Loading Table...")

        try {
            const { data, error } = await supabase.from('proposals').select('*')
            if (data) {
                setData(data as SubmTable[])
                toast.success("Table Loaded")
            }
            if (error)
                toast.error(`${error}`)

            toast.dismiss(loading)
        } catch (err) {
            toast.error(`${err}`)
        }
    }

    return (
        <div className="container mx-auto py-10 z-50">
            <DataTable columns={columns} data={data} />
        </div>
    )
}