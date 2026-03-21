import { useRef, useState } from "react";
import { Menu, Upload, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DocumentEditorContainerComponent,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-lists/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-splitbuttons/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-documenteditor/styles/material.css";

DocumentEditorContainerComponent.Inject(Toolbar);

export default function skibidi() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const editorRef = useRef<DocumentEditorContainerComponent>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (fileExt !== "docx" && fileExt !== "doc") {
      toast.error("Only DOCX/DOC files are supported");
      return;
    }

    setUploadedFile(file);

    // Read file and open in editor
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (editorRef.current) {
        editorRef.current.documentEditor.open(base64);
        toast.success(`${file.name} loaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = () => {
    if (!editorRef.current) {
      toast.error("Editor not ready");
      return;
    }

    const fileName = uploadedFile?.name || "document.docx";
    editorRef.current.documentEditor.save(fileName, "Docx");
    toast.success("Document saved!");
  };

  const handleExportPDF = () => {
    if (!editorRef.current) {
      toast.error("Editor not ready");
      return;
    }

    const fileName = uploadedFile?.name.replace(/\.(docx|doc)$/i, ".pdf") || "document.pdf";
    editorRef.current.documentEditor.save(fileName, "Pdf" as any);
    toast.success("Exported to PDF!");
  };

  const handleGetFormData = () => {
    if (!editorRef.current) {
      toast.error("Editor not ready");
      return;
    }

    // Get all form fields from the document
    const formFields = editorRef.current.documentEditor.getFormFieldNames();
    const formData: Record<string, any> = {};

    formFields.forEach((fieldName: string) => {
      const field = editorRef.current!.documentEditor.getFormFieldInfo(fieldName);
      formData[fieldName] = (field as any)?.value || "";
    });

    console.log("Form Data:", formData);
    toast.success(`Retrieved ${formFields.length} form field(s)`);
    
    // Show in alert for demo
    if (Object.keys(formData).length > 0) {
      alert(JSON.stringify(formData, null, 2));
    } else {
      toast.info("No form fields found in document");
    }
  };

  return (
    <div className="flex h-[90vh] bg-gray-50 mt-5">
      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-lg border-r p-4 space-y-4 z-40 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-600">Document Editor</h2>
          <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden">
            <Menu size={20} />
          </button>
        </div>

        {/* File Upload */}
        <label className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer text-sm">
          <Upload size={16} />
          Upload DOCX
          <input
            type="file"
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {uploadedFile && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            📎 {uploadedFile.name}
          </div>
        )}

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700">Actions</h3>
          
          <button
            onClick={handleSaveDocument}
            className="flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 w-full text-sm"
          >
            <Save size={16} />
            Save DOCX
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 w-full text-sm"
          >
            📄 Export PDF
          </button>

          <button
            onClick={handleGetFormData}
            className="flex items-center gap-2 px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 w-full text-sm"
          >
            <Eye size={16} />
            Get Form Data
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Features</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✅ Full Word editing</li>
            <li>✅ Form fields support</li>
            <li>✅ Track changes</li>
            <li>✅ Comments</li>
            <li>✅ Tables & images</li>
            <li>✅ Export to PDF</li>
          </ul>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {!uploadedFile ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-2xl text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Syncfusion Document Editor
              </h1>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-3">Getting Started:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Upload a DOCX file using the button in the sidebar</li>
                  <li>Edit the document with full Word-like features</li>
                  <li>Use the toolbar to format text, insert tables, images, etc.</li>
                  <li>Add form fields using the toolbar</li>
                  <li>Click "Get Form Data" to extract form field values</li>
                  <li>Save as DOCX or export to PDF</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <DocumentEditorContainerComponent
            ref={editorRef}
            id="document-editor"
            height="100%"
            enableToolbar={true}
            serviceUrl="https://ej2services.syncfusion.com/production/web-services/api/documenteditor/"
          />
        )}
      </div>
    </div>
  );
}
