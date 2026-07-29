import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ControlSlider from '@/components/characters/ControlSlider';

const inputClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
const SCALES = ['Intimate', 'Room', 'Building', 'Landscape'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function EnvironmentLockEditor({ lock, onUpdate }) {
  const fileInputRef = useRef(null);
  const refImages = lock.referenceImages || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpdate({ referenceImages: [...refImages, file_url].slice(0, 3) });
  };

  const removeImage = (idx) => onUpdate({ referenceImages: refImages.filter((_, i) => i !== idx) });

  return (
    <div className="p-5 space-y-5">
      <Field label="Name"><input value={lock.name || ''} onChange={(e) => onUpdate({ name: e.target.value })} className={inputClass} /></Field>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Reference images (up to 3)</label>
        <div className="grid grid-cols-3 gap-2">
          {refImages.map((url, idx) => (
            <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-card-raised">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && <span className="absolute bottom-1 left-1 px-1 text-[10px] rounded bg-accent-muted text-accent-foreground">Primary</span>}
              <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 text-white bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          {refImages.length < 3 && (
            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-md border border-dashed border-border hover:border-border-active transition-colors flex items-center justify-center text-muted-foreground"><Upload className="w-4 h-4" /></button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {refImages[0] && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Depth map (auto-extracted from primary reference)</label>
          <div className="flex items-center gap-3">
            <div className="w-24 h-16 rounded-md overflow-hidden border border-border bg-card-raised flex-shrink-0">
              <img src={refImages[0]} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
            </div>
            <span className="text-xs text-muted-foreground">Depth conditioning is applied during generation to prevent environment warping on camera moves.</span>
          </div>
        </div>
      )}

      <Field label="Description"><textarea value={lock.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={inputClass} rows={2} placeholder="Describe the environment..." /></Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Interior / Exterior">
          <select value={lock.interiorExterior || 'interior'} onChange={(e) => onUpdate({ interiorExterior: e.target.value })} className={inputClass}>
            <option value="interior">Interior</option><option value="exterior">Exterior</option>
          </select>
        </Field>
        <Field label="Scale">
          <select value={lock.scale || 'Room'} onChange={(e) => onUpdate({ scale: e.target.value })} className={inputClass}>{SCALES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
      </div>

      <ControlSlider label="Lock strength" value={lock.lockStrength ?? 75} onChange={(v) => onUpdate({ lockStrength: v })} defaultValue={75} />
      <p className="text-xs text-muted-foreground">Higher lock strength holds the environment more firmly but gives the model less freedom, which can cause stiffness.</p>
    </div>
  );
}