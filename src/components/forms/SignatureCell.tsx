import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Pen, Upload, RotateCcw, Check } from "lucide-react";
import { supabase } from "@/DB";

interface SignatureCellProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  /** Storage context for organized uploads */
  proposalId?: number;
  formName?: string;
}

export default function SignatureCell({ value, onChange, readOnly, proposalId, formName }: SignatureCellProps) {
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

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // If small enough (<200KB), just use base64 — avoids storage overhead
    if (file.size < 200 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) => onChange(ev.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Large image — upload to storage and store URL
    setUploading(true);
    try {
      const folder = proposalId && formName
        ? `${proposalId}/Send Forms/${formName}/signature`
        : `signatures`;
      const path = `${folder}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      // Fall back to base64 if upload fails
      const reader = new FileReader();
      reader.onload = (ev) => onChange(ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  if (readOnly) {
    return value
      ? <div style={previewWrap}><img src={value} alt="signature" style={previewImg} /></div>
      : <div style={{ ...idleWrap, color: "#aaa", fontSize: "11px" }}>Signature pending</div>;
  }

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
        {uploading ? "Uploading..." : <><Upload size={11} /> Upload</>}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
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
