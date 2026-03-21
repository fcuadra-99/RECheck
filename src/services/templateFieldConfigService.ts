import type { FormFieldData } from './pdfFormService';
import { supabase } from '@/DB';

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

const STORAGE_KEY = 'template_field_configurations';

export class TemplateFieldConfigService {
  /**
   * Save field configuration for a template (now uses Supabase)
   */
  static async saveConfiguration(config: TemplateFieldConfig, userId?: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      // Check if configuration exists
      const { data: existing } = await supabase
        .from('template_field_configurations')
        .select('id')
        .eq('template_id', config.templateId)
        .single();

      const configData = {
        template_id: config.templateId,
        template_name: config.templateName,
        fields: config.fields,
        last_modified: timestamp,
        modified_by: userId || config.modifiedBy || null
      };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('template_field_configurations')
          .update(configData)
          .eq('template_id', config.templateId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('template_field_configurations')
          .insert(configData);

        if (error) throw error;
      }

      console.log('✅ Template field configuration saved to database:', config.templateId);
      
      // Also save to localStorage as backup
      this.saveToLocalStorage(config);
    } catch (error) {
      console.error('❌ Error saving template field configuration to database:', error);
      // Fallback to localStorage
      console.log('Falling back to localStorage...');
      this.saveToLocalStorage(config);
    }
  }

  /**
   * Get field configuration for a specific template (from database)
   */
  static async getConfiguration(templateId: string): Promise<TemplateFieldConfig | null> {
    try {
      const { data, error } = await supabase
        .from('template_field_configurations')
        .select('*')
        .eq('template_id', templateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, try localStorage
          return this.getFromLocalStorage(templateId);
        }
        throw error;
      }

      if (data) {
        return {
          templateId: data.template_id,
          templateName: data.template_name,
          fields: data.fields,
          lastModified: data.last_modified,
          modifiedBy: data.modified_by
        };
      }

      return this.getFromLocalStorage(templateId);
    } catch (error) {
      console.error('Error loading template field configuration from database:', error);
      return this.getFromLocalStorage(templateId);
    }
  }

  /**
   * Get all template field configurations (from database)
   */
  static async getAllConfigurations(): Promise<TemplateFieldConfig[]> {
    try {
      const { data, error } = await supabase
        .from('template_field_configurations')
        .select('*')
        .order('template_name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map(row => ({
          templateId: row.template_id,
          templateName: row.template_name,
          fields: row.fields,
          lastModified: row.last_modified,
          modifiedBy: row.modified_by
        }));
      }

      // Fallback to localStorage
      return this.getAllFromLocalStorage();
    } catch (error) {
      console.error('Error loading all configurations from database:', error);
      return this.getAllFromLocalStorage();
    }
  }

  /**
   * Delete field configuration for a template (from database)
   */
  static async deleteConfiguration(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_field_configurations')
        .delete()
        .eq('template_id', templateId);

      if (error) throw error;

      console.log('✅ Template field configuration deleted from database:', templateId);
      
      // Also delete from localStorage
      this.deleteFromLocalStorage(templateId);
    } catch (error) {
      console.error('❌ Error deleting template field configuration from database:', error);
      // Fallback to localStorage
      this.deleteFromLocalStorage(templateId);
    }
  }

  // ============ LocalStorage fallback methods ============

  private static saveToLocalStorage(config: TemplateFieldConfig): void {
    try {
      const configurations = this.getAllFromLocalStorage();
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
      console.log('Saved to localStorage as backup:', config.templateId);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private static getFromLocalStorage(templateId: string): TemplateFieldConfig | null {
    try {
      const configurations = this.getAllFromLocalStorage();
      return configurations.find(c => c.templateId === templateId) || null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  private static getAllFromLocalStorage(): TemplateFieldConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading all from localStorage:', error);
      return [];
    }
  }

  private static deleteFromLocalStorage(templateId: string): void {
    try {
      const configurations = this.getAllFromLocalStorage();
      const filtered = configurations.filter(c => c.templateId !== templateId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }


  /**
   * Check if a template has predefined fields configured
   */
  static async hasConfiguration(templateId: string): Promise<boolean> {
    const config = await this.getConfiguration(templateId);
    return config !== null && config.fields.length > 0;
  }

  /**
   * Get predefined fields for a template (async version)
   */
  static async getPredefinedFields(templateId: string): Promise<FormFieldData[]> {
    const config = await this.getConfiguration(templateId);
    console.log(`📋 getPredefinedFields for templateId: "${templateId}"`, config ? `Found ${config.fields.length} fields` : 'No config found');
    return config ? config.fields : [];
  }

  /**
   * Get predefined fields for a template (synchronous fallback - uses localStorage only)
   */
  static getPredefinedFieldsSync(templateId: string): FormFieldData[] {
    const config = this.getFromLocalStorage(templateId);
    return config ? config.fields : [];
  }

  /**
   * Migrate localStorage configurations to database
   */
  static async migrateLocalStorageToDatabase(userId?: string): Promise<{ migrated: number; errors: number }> {
    const localConfigs = this.getAllFromLocalStorage();
    let migrated = 0;
    let errors = 0;

    console.log(`🔄 Migrating ${localConfigs.length} configurations from localStorage to database...`);

    for (const config of localConfigs) {
      try {
        await this.saveConfiguration(config, userId);
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate ${config.templateId}:`, error);
        errors++;
      }
    }

    console.log(`✅ Migration complete: ${migrated} migrated, ${errors} errors`);
    return { migrated, errors };
  }

  /**
   * Export all configurations as JSON
   */
  static async exportConfigurations(): Promise<string> {
    const configurations = await this.getAllConfigurations();
    return JSON.stringify(configurations, null, 2);
  }

  /**
   * Import configurations from JSON
   */
  static async importConfigurations(jsonString: string, userId?: string): Promise<void> {
    try {
      const configurations = JSON.parse(jsonString);
      if (!Array.isArray(configurations)) {
        throw new Error('Invalid configuration format');
      }

      for (const config of configurations) {
        await this.saveConfiguration(config, userId);
      }

      console.log('✅ Configurations imported successfully');
    } catch (error) {
      console.error('❌ Error importing configurations:', error);
      throw new Error('Failed to import configurations');
    }
  }
}
