import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, GripVertical } from 'lucide-react';

export interface FormFieldData {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'signature';
  value: any;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
}

interface PDFFormFieldProps {
  field: FormFieldData;
  value: any;
  onChange: (value: any) => void;
  scale: number;
  onDelete?: () => void;
  canDelete?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
  isTransparent?: boolean; // New prop for transparency
  onSignatureClick?: () => void; // New prop for signature fields
}

export default function PDFFormField({ 
  field, 
  value, 
  onChange, 
  scale, 
  onDelete, 
  canDelete = false,
  onPositionChange,
  onSizeChange,
  isDraggable = false,
  isResizable = false,
  isTransparent = false,
  onSignatureClick
}: PDFFormFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const [localValue, setLocalValue] = useState<any>('');
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync localValue with value prop when value changes from parent AND we're not currently editing
  useEffect(() => {
    console.log('Value prop changed:', value, 'isEditing:', isEditing);
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent click from bubbling to page
    }
    if (!field.readonly) {
      // Initialize localValue with current value when starting to edit
      console.log('Starting edit, setting localValue to:', value);
      setLocalValue(value || '');
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    setIsFocused(false);
    // Save the local value to parent on blur
    console.log('Saving value on blur:', localValue, 'for field:', field.name);
    onChange(localValue);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Saving value via button:', localValue, 'for field:', field.name);
    onChange(localValue);
    setIsEditing(false);
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (field.type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setLocalValue(checked);
      onChange(checked);
    } else {
      const newValue = e.target.value;
      setLocalValue(newValue);
      // Don't call onChange here - only update local state while typing
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - field.x * scale,
      y: e.clientY - field.y * scale
    });
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !onPositionChange) return;
    
    const newX = (e.clientX - dragStart.x) / scale;
    const newY = (e.clientY - dragStart.y) / scale;
    
    onPositionChange(Math.max(0, newX), Math.max(0, newY));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isResizable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      width: field.width,
      height: field.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !onSizeChange) return;
    
    const deltaX = (e.clientX - resizeStart.mouseX) / scale;
    const deltaY = (e.clientY - resizeStart.mouseY) / scale;
    
    const newWidth = Math.max(50, resizeStart.width + deltaX);
    const newHeight = Math.max(20, resizeStart.height + deltaY);
    
    onSizeChange(newWidth, newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  // Calculate position and size based on scale
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${field.x * scale}px`,
    top: `${field.y * scale}px`,
    width: `${field.width * scale}px`,
    height: `${field.height * scale}px`,
    zIndex: isEditing || isFocused ? 50 : 10,
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
  };

  const renderField = () => {
    switch (field.type) {
      case 'checkbox':
        return (
          <div
            style={innerStyle}
            className={`flex items-center justify-center cursor-pointer ${
              isFocused ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={handleClick}
          >
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleCheckboxChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              className="w-full h-full cursor-pointer"
              disabled={field.readonly}
            />
          </div>
        );

      case 'select':
        return (
          <div style={innerStyle}>
            {isEditing ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={localValue || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full h-full px-2 text-sm border-2 border-indigo-500 rounded bg-white focus:outline-none"
              >
                <option value="">Select...</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div
                onClick={handleClick}
                className={`w-full h-full px-2 text-sm flex items-center cursor-pointer bg-blue-50 bg-opacity-50 border-2 border-dashed ${
                  value ? 'border-green-400' : 'border-blue-400'
                } hover:bg-blue-100 hover:bg-opacity-70 transition-colors rounded`}
              >
                <span className="truncate text-gray-700">{value || 'Click to select...'}</span>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div style={innerStyle} className="relative">
            {isEditing ? (
              <div className="relative w-full h-full flex flex-col gap-1">
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={localValue || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="flex-1 w-full p-2 text-sm border-2 border-indigo-500 rounded bg-white resize-none focus:outline-none"
                  placeholder="Enter text..."
                />
                <button
                  onClick={handleSave}
                  className="w-full py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center text-xs font-medium gap-1"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            ) : (
              <div
                onClick={handleClick}
                className={`w-full h-full p-2 text-sm cursor-pointer bg-blue-50 bg-opacity-50 border-2 border-dashed ${
                  value ? 'border-green-400' : 'border-blue-400'
                } hover:bg-blue-100 hover:bg-opacity-70 transition-colors rounded overflow-hidden`}
              >
                {value ? (
                  <span className="text-gray-700 whitespace-pre-wrap break-words">{value}</span>
                ) : (
                  <span className="text-gray-400 italic">Click to enter text...</span>
                )}
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div style={innerStyle}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onSignatureClick) {
                  onSignatureClick();
                } else {
                  handleClick(e);
                }
              }}
              className={`w-full h-full p-2 cursor-pointer border-2 border-dashed ${
                value ? 'border-green-400' : 'border-yellow-400 bg-yellow-50 bg-opacity-50'
              } hover:bg-yellow-100 hover:bg-opacity-70 transition-colors rounded flex items-center justify-center overflow-hidden`}
            >
              {value ? (
                // Display the signature image with no background
                <img 
                  src={value} 
                  alt="Signature" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-500 italic flex items-center">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Click to sign
                </span>
              )}
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div style={innerStyle} className="relative">
            {isEditing ? (
              <div className="relative w-full h-full flex items-center gap-1">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={localValue || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="flex-1 h-full px-2 text-sm border-2 border-blue-500 rounded-none bg-blue-50 focus:outline-none focus:bg-white font-sans"
                  placeholder=""
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.2',
                    color: '#000000'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave(e as any);
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                    }
                  }}
                />
                {isDraggable && (
                  <button
                    onClick={handleSave}
                    className="h-full px-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center text-xs font-medium"
                    title="Save (Enter) or Esc to cancel"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={handleClick}
                className={`w-full h-full px-2 text-sm flex items-center cursor-text border transition-all font-sans ${
                  isTransparent && !value
                    ? 'bg-transparent border-transparent hover:border-blue-400 hover:border hover:bg-blue-50 hover:bg-opacity-30'
                    : value
                    ? 'bg-transparent border-transparent hover:border-blue-400 hover:border hover:bg-blue-50 hover:bg-opacity-20'
                    : 'bg-white border-gray-400 hover:border-blue-500 hover:bg-blue-50'
                }`}
                style={{
                  fontSize: '12px',
                  lineHeight: '1.2',
                  color: '#000000',
                  minHeight: '100%'
                }}
                title={field.required ? 'Required field' : 'Click to fill'}
              >
                {value ? (
                  <span className="truncate text-gray-900 font-medium">{value}</span>
                ) : (
                  <span className={`italic text-xs ${isTransparent ? 'text-indigo-400 opacity-0 group-hover:opacity-100' : 'text-gray-400'}`}>
                    {isTransparent ? 'Click to type' : 'Click to enter...'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      style={style} 
      className={`pdf-form-field group ${isDragging ? 'z-50 cursor-move' : ''} ${isResizing ? 'z-50' : ''}`}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to page
    >
      {renderField()}
      
      {/* Drag Handle - Show on hover (even when filled) */}
      {isDraggable && !isEditing && (
        <div
          onMouseDown={handleDragStart}
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-move z-50 flex items-center space-x-1"
          title="Drag to move"
        >
          <GripVertical className="w-3 h-3" />
          <span className="text-xs font-medium">Move</span>
        </div>
      )}
      
      {/* Resize Handle - Show on hover (even when filled) */}
      {isResizable && !isEditing && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-nwse-resize z-50"
          title="Drag to resize"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Delete Button - Show on hover (even when filled) */}
      {canDelete && onDelete && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-50"
          title="Delete field"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
