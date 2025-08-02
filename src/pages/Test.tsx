import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Test() {
    async function getData() {
        const { data, error } = await supabase
            .from('documents')
            .select()
        return data
    }

    console.log(getData())
}