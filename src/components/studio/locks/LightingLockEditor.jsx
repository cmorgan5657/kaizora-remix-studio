import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { kelvinToRGB } from '@/lib/colorUtils';
import ControlSlider from '@/components/characters/ControlSlider';
import ReferenceInfluence from './ReferenceInfluence';

const inputClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

const COMPASS = [
  { id: 'NW', label: '↖' }, { id: 'N', label: '↑' }, { id: 'NE', label: '↗' },
  { id: 'W', label: '←' }, { id: 'C', label: '·' }, { id: 'E', label: '→' },
  { id: 'SW', label: '↙' }, { id: 'S', label: '↓' }, { id: 'SE', label: '↘' },
];
const MOODS = ['Natural', 'Dramatic', 'Soft', 'Harsh', 'Moody'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function LightingLockEditor({ lock, onUpdate, references }) {
  const [newSource, setNewSource] = useState('');
  const practicalSources = lock.practicalSources || [];
  const swatchColor = kelvinToRGB(lock.colorTemperature || 5600);

  const addSource = () => {
    if (!newSource.trim()) return;
    onUpdate({ practicalSources: [...practicalSources, newSource.trim()] });
    setNewSource('');
  };

  return (
    <div className="p-5 space-y-5">
      {references && references.length > 0 && <ReferenceInfluence references={references} lockLabel="Lighting Lock" />}
      <Field label="Name"><input value={lock.name || ''} onChange={(e) => onUpdate({ name: e.target.value })} className={inputClass} /></Field>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Key light direction</label>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-1 w-32">
            {COMPASS.map((d) => (
              <button key={d.id} onClick={() => d.id !== 'C' && onUpdate({ keyDirection: d.id })} disabled={d.id === 'C'} className={`aspect-square rounded-md text-sm flex items-center justify-center transition-colors ${lock.keyDirection === d.id ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-muted-foreground hover:border-border-active'} disabled:cursor-default`}>{d.label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => onUpdate({ keyDirection: 'Top' })} className={`px-3 py-1 text-xs rounded ${lock.keyDirection === 'Top' ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-muted-foreground'}`}>Top</button>
            <button onClick={() => onUpdate({ keyDirection: 'Bottom' })} className={`px-3 py-1 text-xs rounded ${lock.keyDirection === 'Bottom' ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-muted-foreground'}`}>Bottom</button>
          </div>
          <span className="text-sm text-secondary-foreground">{lock.keyDirection || 'N'}</span>
        </div>
      </div>

      <ControlSlider label="Key intensity" value={lock.keyIntensity ?? 75} onChange={(v) => onUpdate({ keyIntensity: v })} defaultValue={75} />
      <ControlSlider label="Fill ratio" value={lock.fillRatio ?? 40} onChange={(v) => onUpdate({ fillRatio: v })} defaultValue={40} />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">Color temperature</label>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: swatchColor }} />
            <span className="text-xs text-secondary-foreground tabular-nums">{lock.colorTemperature || 5600}K</span>
          </div>
        </div>
        <input type="range" min={2700} max={7500} step={100} value={lock.colorTemperature || 5600} onChange={(e) => onUpdate({ colorTemperature: Number(e.target.value) })} className="w-full accent-accent h-1 cursor-pointer" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Practical sources</label>
        <div className="space-y-1.5 mb-2">
          {practicalSources.map((src, idx) => (
            <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-card border border-border">
              <span className="flex-1 text-sm text-secondary-foreground">{src}</span>
              <button onClick={() => onUpdate({ practicalSources: practicalSources.filter((_, i) => i !== idx) })} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={newSource} onChange={(e) => setNewSource(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSource()} className={inputClass} placeholder="e.g. Desk lamp (left side)" />
          <button onClick={addSource} className="p-1.5 text-muted-foreground hover:text-accent"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Time of day"><input value={lock.timeOfDay || ''} onChange={(e) => onUpdate({ timeOfDay: e.target.value })} className={inputClass} placeholder="e.g. Golden hour" /></Field>
        <Field label="Mood"><select value={lock.mood || 'Natural'} onChange={(e) => onUpdate({ mood: e.target.value })} className={inputClass}>{MOODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>

      <ControlSlider label="Lock strength" value={lock.lockStrength ?? 75} onChange={(v) => onUpdate({ lockStrength: v })} defaultValue={75} />
      <p className="text-xs text-muted-foreground">Higher lock strength holds the lighting more firmly but gives the model less freedom, which can cause stiffness.</p>
    </div>
  );
}