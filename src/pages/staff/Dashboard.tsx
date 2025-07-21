import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { ChartLineMultiple } from "@/components/chart-line-multi";
import { data as Data } from "@/Data"


const SDashboard = () => {
    return (
        <>
            <div className="flex-1 [&>*]:my-3">
                <h1 className="text-[30px] font-medium">Dashboard</h1>
                <ChartLineMultiple title="Submissions" desc="..." data={Data.subm} />
                <ChartLineMultiple title="Approved" desc="..." data={Data.subm} />
                <ChartLineMultiple title="Approved" desc="..." data={Data.subm} />
            </div>
        </>
    );
};

export default SDashboard;