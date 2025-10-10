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

export const formTemplates: FormTemplate[] = [
  {
    id: 'protocol-final-report',
    name: 'Protocol Final Report',
    description: 'Template for final protocol reporting and study completion documentation',
    templateUrl: '/templates/Protocol_Final_Report_Template.pdf',
    category: 'protocol',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Protocol_Final_Report_Template.pdf'
  },
  {
    id: 'progress-report',
    name: 'Progress Report',
    description: 'Template for research progress reporting and milestone updates',
    templateUrl: '/templates/Progress_Report_Template.pdf',
    category: 'report',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Progress_Report_Template.pdf'
  },
  {
    id: 'new-event-report',
    name: 'Report of New Event (RNE)',
    description: 'Template for reporting new research events and incidents',
    templateUrl: '/templates/Report_New_Event_Template.pdf',
    category: 'report',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Report_New_Event_Template.pdf'
  },
  {
    id: 'protocol-amendment',
    name: 'Protocol Amendment',
    description: 'Template for protocol amendment requests and modifications',
    templateUrl: '/templates/Protocol_Amendment_Template.pdf',
    category: 'protocol',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Protocol_Amendment_Template.pdf'
  },
  {
    id: 'continuing-review',
    name: 'Continuing Review Application',
    description: 'Template for continuing review applications and renewals',
    templateUrl: '/templates/Continuing_Review_Template.pdf',
    category: 'application',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Continuing_Review_Template.pdf'
  },
  {
    id: 'early-termination',
    name: 'Early Study Termination',
    description: 'Template for early study termination reports and documentation',
    templateUrl: '/templates/Early_Termination_Template.pdf',
    category: 'report',
    fileType: 'pdf',
    version: '1.0',
    fileName: 'Early_Termination_Template.pdf'
  }
];

export class TemplateDownloadService {
  static async downloadTemplate(templateId: string): Promise<void> {
    const template = formTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      // Create a temporary link to download the template
      const link = document.createElement('a');
      link.href = template.templateUrl;
      link.download = template.fileName;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Log download for analytics
      console.log(`Template downloaded: ${template.name}`);
    } catch (error) {
      console.error('Error downloading template:', error);
      throw new Error('Failed to download template');
    }
  }

  static getTemplatesByCategory(category: string): FormTemplate[] {
    return formTemplates.filter(template => template.category === category);
  }

  static getAllTemplates(): FormTemplate[] {
    return formTemplates;
  }

  // Get templates that can be uploaded through the forms section (excludes Protocol Final Report)
  static getUploadableTemplates(): FormTemplate[] {
    return formTemplates.filter(template => template.id !== 'protocol-final-report');
  }

  static getTemplateById(id: string): FormTemplate | undefined {
    return formTemplates.find(template => template.id === id);
  }

  static previewTemplate(templateId: string): void {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      window.open(template.templateUrl, '_blank');
    }
  }
}
