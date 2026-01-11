import type { FormFieldData } from './pdfFormService';

/**
 * Service for managing predefined field configurations for templates
 * Admins can configure fields that will be pre-placed on templates for researchers
 */

export interface TemplateFieldConfig {
  templateId: string;
  templateName: string;
  fields: FormFieldData[];
  lastModified: string;
  modifiedBy?: string;
}

const STORAGE_KEY = 'template_field_configurations';

export class TemplateFieldConfigService {
  /**
   * Save field configuration for a template
   */
  static saveConfiguration(config: TemplateFieldConfig): void {
    try {
      const configurations = this.getAllConfigurations();
      const existingIndex = configurations.findIndex(c => c.templateId === config.templateId);
      
      if (existingIndex >= 0) {
        configurations[existingIndex] = {
          ...config,
          lastModified: new Date().toISOString()
        };
      } else {
        configurations.push({
          ...config,
          lastModified: new Date().toISOString()
        });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configurations));
      console.log('Template field configuration saved:', config.templateId);
    } catch (error) {
      console.error('Error saving template field configuration:', error);
      throw new Error('Failed to save template configuration');
    }
  }

  /**
   * Get field configuration for a specific template
   */
  static getConfiguration(templateId: string): TemplateFieldConfig | null {
    try {
      const configurations = this.getAllConfigurations();
      return configurations.find(c => c.templateId === templateId) || null;
    } catch (error) {
      console.error('Error loading template field configuration:', error);
      return null;
    }
  }

  /**
   * Get all template field configurations
   */
  static getAllConfigurations(): TemplateFieldConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading all configurations:', error);
      return [];
    }
  }

  /**
   * Delete field configuration for a template
   */
  static deleteConfiguration(templateId: string): void {
    try {
      const configurations = this.getAllConfigurations();
      const filtered = configurations.filter(c => c.templateId !== templateId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('Template field configuration deleted:', templateId);
    } catch (error) {
      console.error('Error deleting template field configuration:', error);
      throw new Error('Failed to delete template configuration');
    }
  }

  /**
   * Check if a template has predefined fields configured
   */
  static hasConfiguration(templateId: string): boolean {
    const config = this.getConfiguration(templateId);
    return config !== null && config.fields.length > 0;
  }

  /**
   * Get predefined fields for a template
   */
  static getPredefinedFields(templateId: string): FormFieldData[] {
    const config = this.getConfiguration(templateId);
    console.log(`📋 getPredefinedFields for templateId: "${templateId}"`, config ? `Found ${config.fields.length} fields` : 'No config found');
    
    // Debug: Log all available configurations
    const allConfigs = this.getAllConfigurations();
    console.log(`📋 All available configurations:`, allConfigs.map(c => ({ id: c.templateId, name: c.templateName, fieldCount: c.fields.length })));
    
    return config ? config.fields : [];
  }

  /**
   * Export all configurations as JSON
   */
  static exportConfigurations(): string {
    const configurations = this.getAllConfigurations();
    return JSON.stringify(configurations, null, 2);
  }

  /**
   * Import configurations from JSON
   */
  static importConfigurations(jsonString: string): void {
    try {
      const configurations = JSON.parse(jsonString);
      if (!Array.isArray(configurations)) {
        throw new Error('Invalid configuration format');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configurations));
      console.log('Configurations imported successfully');
    } catch (error) {
      console.error('Error importing configurations:', error);
      throw new Error('Failed to import configurations');
    }
  }
}
