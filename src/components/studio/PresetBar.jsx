import { useState } from 'react';
import { Save, Upload } from 'lucide-react';

const inputClass = 'flex-1 bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

export default function PresetBar({ presets, onSave, onApply }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');

  return (
    <div className="pt-3 border-t border-border space-y-2">
      <div className="text-xs text-muted-foreground">Presets (camera + motion)</div>
      <div className="flex items-center gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
          <option value="">Select preset…</option>
          {presets?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => { const p = presets?.find((x) => x.id === selected); if (p) { onApply(p); setSelected(''); } }} disabled={!selected} className="px-2.5 py-1.5 text-xs text-accent-foreground bg-accent rounded disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"><Upload className="w-3 h-3" /> Apply</button>
      </div>
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="New preset name…" />
        <button onClick={() => { if (name.trim()) { onSave(name.trim()); setName(''); } }} disabled={!name.trim()} className="px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"><Save className="w-3 h-3" /> Save</button>
      </div>
    </div>
  );
}