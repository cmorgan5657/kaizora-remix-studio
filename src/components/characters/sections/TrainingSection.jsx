import { Check, X, AlertCircle } from 'lucide-react';
import { ANGLE_SLOTS, DISTANCE_SLOTS, LIGHTING_SLOTS } from '@/lib/characterCompiler';

export default function TrainingSection({ character, references }) {
  const totalImages = references.filter(r => r.imageUrl).length;
  const angleCount = ANGLE_SLOTS.filter(s => references.some(r => r.slotGroup === 'angle' && r.slotName === s && r.imageUrl)).length;
  const distCount = DISTANCE_SLOTS.filter(s => references.some(r => r.slotGroup === 'distance' && r.slotName === s && r.imageUrl)).length;
  const lightCount = LIGHTING_SLOTS.filter(s => references.some(r => r.slotGroup === 'lighting' && r.slotName === s && r.imageUrl)).length;
  const hasDuplicates = references.some(r => r.qcStatus === 'block');
  const allMinRes = references.filter(r => r.imageUrl).every(r => r.qcStatus !== 'warn' || !r.qcMessages?.some(m => m.includes('512px')));

  const checks = [
    { label: 'At least 15 reference images total', pass: totalImages >= 15, detail: `${totalImages} of 15` },
    { label: 'At least 5 distinct angles', pass: angleCount >= 5, detail: `${angleCount} of 5` },
    { label: 'At least 2 distance variations', pass: distCount >= 2, detail: `${distCount} of 2` },
    { label: 'At least 2 lighting variations', pass: lightCount >= 2, detail: `${lightCount} of 2` },
    { label: 'No duplicate or near-duplicate images', pass: !hasDuplicates, detail: hasDuplicates ? 'Duplicates found' : 'Pass' },
    { label: 'All images at least 512px', pass: allMinRes, detail: allMinRes ? 'Pass' : 'Some below 512px' },
  ];
  const allPass = checks.every(c => c.pass);

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Training</h2>
        <p className="text-xs text-muted-foreground">Train a character adapter (LoRA) for the strongest consistency. Costs credits and takes minutes.</p>
      </div>

      {character?.tier === 'trained' && (
        <div className="p-3 rounded-md bg-success/10 border border-success/30 text-sm text-success flex items-center gap-2">
          <Check className="w-4 h-4" /> This character is trained and validated.
        </div>
      )}

      <div>
        <span className="panel-title mb-3 block">Readiness Checklist</span>
        <div className="space-y-2">
          {checks.map((c) => (
            <div key={c.label} className={`flex items-center gap-3 p-2.5 rounded-md border ${c.pass ? 'bg-card border-border' : 'bg-card border-border'}`}>
              {c.pass ? <Check className="w-4 h-4 text-success flex-shrink-0" /> : <X className="w-4 h-4 text-destructive flex-shrink-0" />}
              <span className="flex-1 text-sm text-secondary-foreground">{c.label}</span>
              <span className={`text-xs tabular-nums ${c.pass ? 'text-success' : 'text-destructive'}`}>{c.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-md bg-card border border-border space-y-3">
        <span className="panel-title">Training Configuration</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-20">Trigger token</label>
          <code className="flex-1 text-xs text-accent bg-accent-muted/30 px-2 py-1 rounded">kzr_char_{character?.id?.slice(-4) || 'xxxx'}</code>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-20">Strength</label>
          <select className="flex-1 bg-card-raised border border-border rounded-md px-2 py-1 text-xs text-secondary-foreground outline-none focus:ring-2 focus:ring-ring">
            <option>Light — more flexible, less identity hold</option>
            <option>Standard — balanced</option>
            <option>Strong — holds identity harder, resists changes more</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Estimated time: ~8 minutes</span>
          <span>Cost: 5 credits</span>
        </div>
        <button disabled={!allPass} className="w-full py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {allPass ? 'Train Character Adapter' : 'Complete readiness checklist to train'}
        </button>
        {!allPass && (
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Training will be available in Phase 10. Fix the failing items above first.</p>
        )}
      </div>
    </div>
  );
}