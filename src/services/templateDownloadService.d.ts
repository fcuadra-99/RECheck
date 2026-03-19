export interface FormTemplate {
    id: string;
    name: string;
    description: string;
    templateUrl: string;
    category: 'protocol' | 'report' | 'application';
    fileType: 'pdf' | 'docx';
    version: string;
    fileName: string;
}
export declare const formTemplates: FormTemplate[];
export declare class TemplateDownloadService {
    static downloadTemplate(templateId: string): Promise<void>;
    static getTemplatesByCategory(category: string): FormTemplate[];
    static getAllTemplates(): FormTemplate[];
    static getUploadableTemplates(): FormTemplate[];
    static getUploadOnlyTemplates(): FormTemplate[];
    static getTemplateById(id: string): FormTemplate | undefined;
    static previewTemplate(templateId: string): void;
}
