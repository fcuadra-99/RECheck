import { useEffect, useState } from "react";
import { Menu, Eye, Text, CheckSquare, Calendar, List, Trash2 } from "lucide-react";
import { toast } from "sonner";

declare const Office: any;
declare const Word: any;

interface ContentControl {
  id: string;
  title: string;
  tag: string;
  type: 'text' | 'checkbox' | 'date' | 'dropdown';
}

export default function OfficeJsPrototype() {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controls, setControls] = useState<ContentControl[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof Office !== 'undefined') {
      Office.onReady((info: any) => {
        if (info.host === Office.HostType.Word) {
          setIsOfficeReady(true);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const insertTextControl = async () => {
    toast.info("Text control feature - Office.js integration needed");
  };

  const insertCheckboxControl = async () => {
    toast.info("Checkbox feature - Office.js integration needed");
  };

  const insertDateControl = async () => {
    toast.info("Date picker feature - Office.js integration needed");
  };

  const insertDropdownControl = async () => {
    toast.info("Dropdown feature - Office.js integration needed");
  };


  const readFormValues = async () => {
    toast.info("Read values feature - Office.js integration needed");
  };

  const protectDocument = async () => {
    toast.info("Protect document feature - Office.js integration needed");
  };

  return (
    <div className="flex h-[90vh] bg-gray-50 mt-5">
      <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white px-4 py-3 text-center font-black text-lg z-50 shadow-lg">
        📝 Office.js Word Add-in Prototype
      </div>
      
      <div className={`fixed md:static top-16 left-0 h-full w-64 bg-white shadow-lg border-r p-4 space-y-4 z-40 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-600">Word Controls</h2>
          <button onClick={() => setSidebarOpen((s) => !s)} className="md:hidden">
            <Menu size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Insert Field</h3>
              <button onClick={insertTextControl} className="flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 w-full text-sm">
                <Text size={16} /> Text Field
              </button>
              <button onClick={insertCheckboxControl} className="flex items-center gap-2 px-3 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 w-full text-sm">
                <CheckSquare size={16} /> Checkbox
              </button>
              <button onClick={insertDateControl} className="flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 w-full text-sm">
                <Calendar size={16} /> Date Picker
              </button>
              <button onClick={insertDropdownControl} className="flex items-center gap-2 px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 w-full text-sm">
                <List size={16} /> Dropdown
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <button onClick={readFormValues} className="flex items-center gap-2 px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 w-full text-sm">
                <Eye size={16} /> Read Values
              </button>
              <button onClick={protectDocument} className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 w-full text-sm">
                🔒 Protect Doc
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-gray-100 overflow-y-auto mt-16 p-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Office.js Prototype</h1>
            <p className="text-gray-600">This prototype demonstrates Office.js integration for Word documents.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
