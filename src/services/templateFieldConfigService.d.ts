import type { FormFieldData } from './pdfFormService';
/**
 * Service for managing predefined field configurations for templates
 * Admins can configure fields that will be pre-placed on templates for researchers
 * Now uses Supabase for cross-browser/cross-device support
 */
export interface TemplateFieldConfig {
    templateId: string;
    templateName: string;
    fields: FormFieldData[];
    lastModified: string;
    modifiedBy?: string;
}
export declare class TemplateFieldConfigService {
    /**
     * Save field configuration for a template (now uses Supabase)
     */
    static saveConfiguration(config: TemplateFieldConfig, userId?: string): Promise<void>;
    /**
     * Get field configuration for a specific template (from database)
     */
    static getConfiguration(templateId: string): Promise<TemplateFieldConfig | null>;
    /**
     * Get all template field configurations (from database)
     */
    static getAllConfigurations(): Promise<TemplateFieldConfig[]>;
    /**
     * Delete field configuration for a template (from database)
     */
    static deleteConfiguration(templateId: string): Promise<void>;
    private static saveToLocalStorage;
    private static getFromLocalStorage;
    private static getAllFromLocalStorage;
    private static deleteFromLocalStorage;
    /**
     * Check if a template has predefined fields configured
     */
    static hasConfiguration(templateId: string): Promise<boolean>;
    /**
     * Get predefined fields for a template (async version)
     */
    static getPredefinedFields(templateId: string): Promise<FormFieldData[]>;
    /**
     * Get predefined fields for a template (synchronous fallback - uses localStorage only)
     */
    static getPredefinedFieldsSync(templateId: string): FormFieldData[];
    /**
     * Migrate localStorage configurations to database
     */
    static migrateLocalStorageToDatabase(userId?: string): Promise<{
        migrated: number;
        errors: number;
    }>;
    /**
     * Export all configurations as JSON
     */
    static exportConfigurations(): Promise<string>;
    /**
     * Import configurations from JSON
     */
    static importConfigurations(jsonString: string, userId?: string): Promise<void>;
}
