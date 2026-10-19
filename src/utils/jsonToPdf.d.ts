import type { ReactElement } from 'react';
export declare const downloadJsonAsPdf: (jsonData: Record<string, any>, outputFileName: string, title: string) => void;
type DownloadFormDesignParams = {
    form: ReactElement;
    outputFileName: string;
    renderWidthPx?: number;
};
export declare const downloadFormDesignAsPdf: ({ form, outputFileName, renderWidthPx, }: DownloadFormDesignParams) => Promise<void>;
export {};
