export interface DetailProps {
  label: string
  value?: string
}

export default function Detail({ label, value }: DetailProps) {
  return (
    <div className="flex justify-between">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value || "-"}</span>
    </div>
  )
}
