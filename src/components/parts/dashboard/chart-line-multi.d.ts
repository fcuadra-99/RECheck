import { type Submissions } from "@/Data";
export interface ChartLineMultipleProps {
    title: string;
    desc: string;
    data: Submissions[];
}
export declare const ChartLineMultiple: React.FC<ChartLineMultipleProps>;
