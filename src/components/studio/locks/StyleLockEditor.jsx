import { useRef } from 'react';
import { Upload, Trash2, Wrench, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ControlSlider from '@/components/characters/ControlSlider';
import ReferenceInfluence from './ReferenceInfluence';

const inputClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

const COLOR_GRADES = ['Natural', 'Warm', 'Cool', 'Teal and Orange', 'Desaturated', 'High Contrast', 'Monochrome', 'Bleach Bypass', 'Custom'];
const FILM_STOCKS = ['Digital Clean', '35mm', '16mm', 'Super 8', 'VHS'];
const LENSES = ['Wide 24mm', 'Standard 35mm', 'Portrait 50mm', 'Telephoto 85mm', 'Anamorphic'];
const ASPECT_RATIOS = ['16:9', '9:16', '2.39:1', '1:1', '4:5'];

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{icon}{label}</label>
      {children}
    </div>
  );
}

export default function StyleLockEditor({ lock, onUpdate, references }) {
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpdate({ referenceImageUrl: file_url });
  };

  return (
    <div className="p-5 space-y-5">
      {references && references.length > 0 && <ReferenceInfluence references={references} lockLabel="Style Lock" />}
      <Field label="Name"><input value={lock.name || ''} onChange={(e) => onUpdate({ name: e.target.value })} className={inputClass} /></Field>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Reference image (optional)</label>
        {lock.referenceImageUrl ? (
          <div className="relative group w-full aspect-video rounded-md overflow-hidden border border-border bg-card-raised">
            <img src={lock.referenceImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-xs text-white bg-white/10 rounded">Replace</button>
              <button onClick={() => onUpdate({ referenceImageUrl: '' })} className="px-3 py-1 text-xs text-destructive bg-white/10 rounded">Remove</button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-video rounded-md border border-dashed border-border hover:border-border-active transition-colors flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="w-4 h-4" /> Upload reference
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Color grade" icon={<Wrench className="w-3 h-3 text-muted-foreground" />}>
          <select value={lock.colorGrade || 'Natural'} onChange={(e) => onUpdate({ colorGrade: e.target.value })} className={inputClass}>{COLOR_GRADES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Film stock" icon={<Wrench className="w-3 h-3 text-muted-foreground" />}>
          <select value={lock.filmStock || 'Digital Clean'} onChange={(e) => onUpdate({ filmStock: e.target.value })} className={inputClass}>{FILM_STOCKS.map((f) => <option key={f}>{f}</option>)}</select>
        </Field>
        <Field label="Lens" icon={<Sparkles className="w-3 h-3 text-accent" />}>
          <select value={lock.lens || 'Standard 35mm'} onChange={(e) => onUpdate({ lens: e.target.value })} className={inputClass}>{LENSES.map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <Field label="Aspect ratio" icon={<Wrench className="w-3 h-3 text-muted-foreground" />}>
          <select value={lock.aspectRatio || '16:9'} onChange={(e) => onUpdate({ aspectRatio: e.target.value })} className={inputClass}>{ASPECT_RATIOS.map((a) => <option key={a}>{a}</option>)}</select>
        </Field>
      </div>

      <ControlSlider label="Grain" icon={<Wrench className="w-3 h-3 text-muted-foreground" />} value={lock.grain ?? 0} onChange={(v) => onUpdate({ grain: v })} defaultValue={0} />
      <ControlSlider label="Halation" icon={<Wrench className="w-3 h-3 text-muted-foreground" />} value={lock.halation ?? 0} onChange={(v) => onUpdate({ halation: v })} defaultValue={0} />
      <ControlSlider label="Depth of field (Deep → Shallow)" icon={<Sparkles className="w-3 h-3 text-accent" />} value={lock.depthOfField ?? 50} onChange={(v) => onUpdate({ depthOfField: v })} defaultValue={50} />
      <ControlSlider label="Lock strength" value={lock.lockStrength ?? 75} onChange={(v) => onUpdate({ lockStrength: v })} defaultValue={75} />
      <p className="text-xs text-muted-foreground">Wrench = applied deterministically in post (pixel-identical across shots). Sparkle = passed as generation conditioning (influenced, not guaranteed). Higher lock strength holds firmer but can cause stiffness.</p>
    </div>
  );
}