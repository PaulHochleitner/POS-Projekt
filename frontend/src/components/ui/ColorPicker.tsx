interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-[#94a3b8]">
      {label}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-[#334155] bg-transparent"
      />
      <span className="font-mono text-[#64748b]">{value}</span>
    </label>
  );
}
