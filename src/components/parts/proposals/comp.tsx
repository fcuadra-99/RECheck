'use-client'

import type { SubmTable } from "@/Data"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useState } from "react"
import React from "react"
import { supabase } from "@/DB"

export default function ProposalsTable() {
    const [data, setData] = useState<SubmTable[]>([])

    React.useEffect(() => {
        getSubm();
    }, [])

    async function getSubm() {
        try {
            const { data, error } = await supabase.from('proposals').select('*')

            if (error) {
                console.log(error);
                return null;
            }

            if (data) { await setData(data as SubmTable[]) }

            
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="container mx-auto py-10 z-50">
            <DataTable columns={columns} data={data} />
        </div>
    )
}