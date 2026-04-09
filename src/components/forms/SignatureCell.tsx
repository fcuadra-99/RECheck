import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Pen, Upload, RotateCcw, Check } from "lucide-react";

interface SignatureCellProps {
  value: string; // base64 data URL or ""
  onChange: (val: string) => void;
}

export default function SignatureCell({ value, onChange }: SignatureCellProps) {
  const [mode, setMode] = useState<"idle" | "draw">("idle");
  const sigRef = useRef<SignatureCanvas>(null);

  const handleDone = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL("image/png"));
    }
    setMode("idle");
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (mode === "draw") {
    return (
      <div style={drawWrap}>
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{ style: canvasStyle }}
          backgroundColor="white"
        />
        <div style={drawActions}>
          <button type="button" onClick={handleClear} style={btnGray} title="Clear">
            <RotateCcw size={12} /> Clear
          </button>
          <button type="button" onClick={handleDone} style={btnGreen} title="Done">
            <Check size={12} /> Done
          </button>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div style={previewWrap}>
        <img src={value} alt="signature" style={previewImg} />
        <div style={previewActions}>
          <button type="button" onClick={() => setMode("draw")} style={btnGray}>
            <Pen size={11} /> Redo
          </button>
          <button type="button" onClick={() => onChange("")} style={btnGray}>
            <RotateCcw size={11} /> Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={idleWrap}>
      <button type="button" onClick={() => setMode("draw")} style={btnOutline}>
        <Pen size={11} /> Draw
      </button>
      <label style={btnOutline}>
        <Upload size={11} /> Upload
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
      </label>
    </div>
  );
}

const drawWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px" };
const canvasStyle: React.CSSProperties = { width: "100%", height: "80px", border: "1px solid #ccc", borderRadius: "2px", cursor: "crosshair" };
const drawActions: React.CSSProperties = { display: "flex", gap: "4px" };
const previewWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px" };
const previewImg: React.CSSProperties = { maxWidth: "100%", maxHeight: "80px", objectFit: "contain", border: "1px solid #eee" };
const previewActions: React.CSSProperties = { display: "flex", gap: "4px" };
const idleWrap: React.CSSProperties = { display: "flex", gap: "6px", alignItems: "center", minHeight: "40px" };

const base: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "3px",
  fontSize: "10px", padding: "3px 7px", borderRadius: "3px",
  cursor: "pointer", border: "1px solid #ccc", background: "white",
  fontFamily: "inherit",
};
const btnGray: React.CSSProperties = { ...base, color: "#555" };
const btnGreen: React.CSSProperties = { ...base, background: "#16a34a", color: "white", border: "1px solid #16a34a" };
const btnOutline: React.CSSProperties = { ...base, color: "#444" };
