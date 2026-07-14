import { Plus, X } from "lucide-react";

interface MemberListInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
}

export default function MemberListInput({ values, onChange, placeholder = "Enter name", style, readOnly }: MemberListInputProps) {
  const update = (i: number, val: string) => {
    if (readOnly) return;
    const next = [...values];
    next[i] = val;
    onChange(next);
  };

  const add = () => { if (!readOnly) onChange([...values, ""]); };

  const remove = (i: number) => {
    if (readOnly) return;
    if (values.length === 1) { onChange([""]); return; }
    onChange(values.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...style }}>
      {values.map((val, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            style={{ ...inputStyle, ...(readOnly ? lockedInputStyle : {}) }}
            value={val}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => update(i, e.target.value)}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => remove(i)}
              style={iconBtn}
              title="Remove"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button type="button" onClick={add} style={addBtn}>
          <Plus size={12} />
          Add member
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  borderBottom: "1px solid black",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "12px",
  padding: "1px 0",
  background: "transparent",
};

const lockedInputStyle: React.CSSProperties = {
  background: "#f5f5f5",
  color: "#555",
  cursor: "not-allowed",
};

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  height: "16px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#999",
  padding: 0,
  flexShrink: 0,
};

const addBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#666",
  fontSize: "11px",
  padding: "2px 0",
  marginTop: "2px",
};
