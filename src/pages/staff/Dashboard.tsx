import { ChartLineMultiple } from "@/components/parts/chart-line-multi";
import { data as Data } from "@/Data"

const SDashboard = () => {
    return (
        <>
            <div className="flex-1 [&>*]:my-3">
                <h1 className="text-[30px] font-medium">Dashboard</h1>
                <ChartLineMultiple
                    title="Applications" desc="..." data={Data.subm} />
                <ChartLineMultiple
                    title="Pending" desc="..." data={Data.subm} />
                <ChartLineMultiple
                    title="Approved" desc="..." data={Data.subm} />
            </div>
        </>
    );
};

export default SDashboard;