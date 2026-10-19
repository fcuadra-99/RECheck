import { useState, useEffect } from 'react';
import { TemplateFieldConfigService } from '@/services/templateFieldConfigService';
import type { FormFieldData } from '@/services/pdfFormService';

/**
 * Hook to load predefined fields for a template
 * Handles async loading from database with localStorage fallback
 */
export function useTemplateFields(templateId: string | null) {
  const [fields, setFields] = useState<FormFieldData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) {
      setFields([]);
      return;
    }

    let mounted = true;

    const loadFields = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const predefinedFields = await TemplateFieldConfigService.getPredefinedFields(templateId);
        
        if (mounted) {
          setFields(predefinedFields);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load fields'));
          setFields([]);
          setLoading(false);
        }
      }
    };

    loadFields();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  return { fields, loading, error };
}

/**
 * Synchronous version that uses only localStorage
 * Use this for immediate access without async
 */
export function useTemplateFieldsSync(templateId: string | null): FormFieldData[] {
  const [fields, setFields] = useState<FormFieldData[]>([]);

  useEffect(() => {
    if (!templateId) {
      setFields([]);
      return;
    }

    const predefinedFields = TemplateFieldConfigService.getPredefinedFieldsSync(templateId);
    setFields(predefinedFields);
  }, [templateId]);

  return fields;
}
