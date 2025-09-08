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
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">React PDF Viewer with `&lt;iframe&gt;`</h1>

                <div className="bg-white p-2 rounded-lg shadow-lg max-w-4xl w-full h-[80vh]">
                    <iframe
                        title="PDF Document Viewer"
                        src="src\assets\somefile.pdf"
                        className="w-full h-full rounded-lg"
                    ></iframe>
                </div>

                <p className="mt-4 text-center text-gray-600">
                    This PDF viewer uses the browser's built-in capabilities, no external libraries are needed.
                </p>
            </div>
        </>
    );
};

export default SDashboard;