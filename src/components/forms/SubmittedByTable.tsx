import { useState } from "react";
import { Plus, X } from "lucide-react";
import SignatureCell from "./SignatureCell";

interface Member {
  name: string;
  signature: string;
}

interface SubmittedByTableProps {
  members: Member[];
  onChange: (members: Member[]) => void;
  title?: string;
}

export default function SubmittedByTable({ members, onChange, title = "Submitted by:" }: SubmittedByTableProps) {
  const updateName = (i: number, name: string) => {
    const next = [...members];
    next[i] = { ...next[i], name };
    onChange(next);
  };

  const updateSig = (i: number, signature: string) => {
    const next = [...members];
    next[i] = { ...next[i], signature };
    onChange(next);
  };

  const add = () => onChange([...members, { name: "", signature: "" }]);

  const remove = (i: number) => {
    if (members.length === 1) { onChange([{ name: "", signature: "" }]); return; }
    onChange(members.filter((_, idx) => idx !== i));
  };

  return (
    <div style={wrap}>
      <strong>{title}</strong>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Signature</th>
            <th style={{ ...th, width: "24px" }}></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={i}>
              <td style={tdName}>
                <input
                  style={nameInput}
                  value={m.name}
                  placeholder="Enter name"
                  onChange={(e) => updateName(i, e.target.value)}
                />
              </td>
              <td style={tdSig}>
                <SignatureCell value={m.signature} onChange={(v) => updateSig(i, v)} />
              </td>
              <td style={tdRemove}>
                <button type="button" onClick={() => remove(i)} style={removeBtn} title="Remove">
                  <X size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={add} style={addBtn}>
        <Plus size={12} /> Add member
      </button>
    </div>
  );
}

export function useSubmittedByMembers() {
  return useState<{ name: string; signature: string }[]>([{ name: "", signature: "" }]);
}

const wrap: React.CSSProperties = { marginTop: "20px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "6px" };
const th: React.CSSProperties = { border: "1px solid black", padding: "6px", background: "#f0f0f0", fontWeight: 700, fontSize: "12px", textAlign: "left" };
const tdName: React.CSSProperties = { border: "1px solid black", padding: "6px", verticalAlign: "middle", width: "45%" };
const tdSig: React.CSSProperties = { border: "1px solid black", padding: "6px", verticalAlign: "middle" };
const tdRemove: React.CSSProperties = { border: "1px solid black", padding: "4px", verticalAlign: "middle", width: "24px", textAlign: "center" };
const nameInput: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid black", outline: "none", fontFamily: "inherit", fontSize: "12px", background: "transparent" };
const removeBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", color: "#999", padding: 0 };
const addBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#666", fontSize: "11px", padding: "4px 0", marginTop: "4px", fontFamily: "inherit" };
