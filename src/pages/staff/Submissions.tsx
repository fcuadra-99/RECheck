import { ProposalsComp } from "@/components/parts/proposals";
import {FileStack} from "lucide-react";

const SSubmissions = () => {
    return <div className="p-5">
        
        <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-3 text-primary shadow-sm">
                <FileStack className="w-5 h-5" />
            </div>
            <div>
                <h1 className="text-2xl font-semibold">Submissions</h1>
            </div>
        </div>

        <ProposalsComp />
    </div>;
};

export default SSubmissions;