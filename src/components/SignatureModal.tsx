import { useState, useRef, useEffect } from 'react';
import { X, Edit3, FileText, Upload } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
  title?: string;
}

type SignatureTab = 'draw' | 'type' | 'upload';

export default function SignatureModal({ isOpen, onClose, onSave, title = 'Add Signature' }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<SignatureTab>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas to transparent instead of white
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear to transparent instead of white
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to data URL
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
    onClose();
  };

  const handleSaveTypedSignature = () => {
    if (!typedSignature.trim()) {
      alert('Please enter your signature');
      return;
    }

    // Create a canvas with the typed signature with transparent background
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // No background fill - canvas is transparent by default
    // Just draw the text
    ctx.fillStyle = 'black';
    ctx.font = `48px ${selectedFont}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploadedSignature = () => {
    if (!uploadedImage) {
      alert('Please upload an image');
      return;
    }

    onSave(uploadedImage);
    onClose();
  };

  const handleClose = () => {
    setTypedSignature('');
    setUploadedImage(null);
    clearCanvas();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'draw'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Edit3 className="w-4 h-4 inline-block mr-2" />
            Draw
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'type'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Type
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Draw Tab */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Draw your signature in the box below:</p>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{
                backgroundImage: `
                  linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                  linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                  linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={250}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair"
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveDrawnSignature}
                  className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Signature
                </button>
              </div>
            </div>
          )}

          {/* Type Tab */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Type your signature below:</p>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Choose a font style:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'cursive', label: 'Cursive', style: 'cursive' },
                    { name: 'serif', label: 'Serif', style: 'serif' },
                    { name: 'fantasy', label: 'Elegant', style: 'fantasy' }
                  ].map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        selectedFont === font.name
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div style={{ fontFamily: font.style }} className="text-2xl truncate">
                        {typedSignature || 'Your Name'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-lg p-8 min-h-[150px] flex items-center justify-center" style={{
                backgroundImage: `
                  linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                  linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                  linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}>
                <div
                  style={{ fontFamily: selectedFont }}
                  className="text-4xl text-black"
                >
                  {typedSignature || 'Preview will appear here'}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveTypedSignature}
                  className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Signature
                </button>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Upload an image of your signature:</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
              </button>

              {uploadedImage && (
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-40 mx-auto"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSaveUploadedSignature}
                  disabled={!uploadedImage}
                  className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Signature
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
