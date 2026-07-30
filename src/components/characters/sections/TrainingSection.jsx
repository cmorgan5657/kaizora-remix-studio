import { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { ANGLE_SLOTS, DISTANCE_SLOTS, LIGHTING_SLOTS } from '@/lib/characterCompiler';

const STRENGTH_OPTIONS = [
  { value: 'Light', label: 'Light — more flexible, less identity hold' },
  { value: 'Standard', label: 'Standard — balanced' },
  { value: 'Strong', label: 'Strong — holds identity harder, resists changes more' },
];

export default function TrainingSection({ character, references, adapter, training, onTrain }) {
  const [strength, setStrength] = useState('Standard');

  useEffect(() => {
    if (adapter?.trainingStrength) setStrength(adapter.trainingStrength);
  }, [adapter?.id]);

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

  const isTraining = training || adapter?.status === 'training' || adapter?.status === 'validating';
  const isComplete = adapter?.status === 'complete';
  const isFailed = adapter?.status === 'failed';
  const progress = adapter?.progress ?? 0;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Training</h2>
        <p className="text-xs text-muted-foreground">Train a character adapter (LoRA) for the strongest consistency. Costs 5 credits and takes a few minutes.</p>
      </div>

      {isComplete && (
        <div className="p-3 rounded-md bg-success/10 border border-success/30 text-sm text-success flex items-center gap-2">
          <Check className="w-4 h-4" /> Adapter v{adapter.versionNumber} trained and validated. Validation score: {adapter.validationScore}/100.
        </div>
      )}

      {isFailed && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Training failed. You can retry below.
        </div>
      )}

      {isTraining && (
        <div className="p-4 rounded-md bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {adapter?.status === 'validating' ? 'Validating adapter…' : 'Training adapter…'}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-card-raised rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Progress is saved automatically. You can navigate away and come back.</p>
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
          <select value={strength} onChange={(e) => setStrength(e.target.value)} disabled={isTraining} className="flex-1 bg-card-raised border border-border rounded-md px-2 py-1 text-xs text-secondary-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
            {STRENGTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Estimated time: ~8 minutes</span>
          <span>Cost: 5 credits</span>
        </div>
        {isComplete ? (
          <button onClick={() => onTrain(strength)} disabled={!allPass} className="w-full py-2 text-sm font-medium text-secondary-foreground bg-card-raised border border-border rounded-md hover:border-border-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Retrain (New Version)
          </button>
        ) : (
          <button onClick={() => onTrain(strength)} disabled={!allPass || isTraining} className="w-full py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isTraining ? <><Loader2 className="w-4 h-4 animate-spin" /> Training…</> : isFailed ? 'Retry Training' : allPass ? 'Train Character Adapter' : 'Complete readiness checklist to train'}
          </button>
        )}
        {!allPass && !isTraining && (
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Fix the failing items above before training.</p>
        )}
      </div>
    </div>
  );
}