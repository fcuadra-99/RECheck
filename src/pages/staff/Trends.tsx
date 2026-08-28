import { ChartLineMulti } from "@/components/parts/dashboard";
import { data as Data } from "@/Data"

const STrends = () => {
    return (
        <>
            <div className="flex-1 [&>*]:my-3">
                <h1 className="text-[30px] font-medium">Trends</h1>
                <ChartLineMulti
                    title="Proposals" desc="..." data={Data.subm} />
                <ChartLineMulti
                    title="Pending" desc="..." data={Data.subm} />
                <ChartLineMulti
                    title="Approved" desc="..." data={Data.subm} />
            </div>
        </>
    );
};

export default STrends;