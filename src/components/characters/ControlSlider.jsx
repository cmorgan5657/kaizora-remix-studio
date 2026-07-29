import { RotateCcw } from 'lucide-react';

export default function ControlSlider({ label, value, onChange, min = 0, max = 100, step = 1, defaultValue = 50, unit = '' }) {
  const modified = value !== defaultValue;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {modified && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
          <label className="text-xs text-muted-foreground">{label}</label>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-secondary-foreground tabular-nums">{value}{unit}</span>
          {modified && (
            <button onClick={() => onChange(defaultValue)} className="text-muted-foreground hover:text-accent transition-colors" title="Reset">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(defaultValue)}
        className="w-full accent-accent h-1 cursor-pointer"
      />
    </div>
  );
}