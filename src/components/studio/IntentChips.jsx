import { X, AlertTriangle } from 'lucide-react';

const CHIP_COLORS = {
  Subject: 'bg-info/20 text-info',
  Action: 'bg-accent/20 text-accent',
  Object: 'bg-success/20 text-success',
  Direction: 'bg-warning/20 text-warning',
  Emotion: 'bg-pink-500/20 text-pink-400',
};

export default function IntentChips({ chips, conflict, onRemoveChip, onRemoveConflict }) {
  if (chips.length === 0 && !conflict) return null;

  return (
    <div className="space-y-2">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${CHIP_COLORS[chip.type] || 'bg-muted text-muted-foreground'}`}>
              <span className="opacity-60">{chip.type}:</span>
              {chip.value}
              <button onClick={() => onRemoveChip(i)} className="ml-0.5 hover:text-foreground"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}
      {conflict && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/30 text-xs text-warning">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{conflict.message}</span>
          {onRemoveConflict && <button onClick={onRemoveConflict} className="whitespace-nowrap underline hover:text-foreground">Remove</button>}
        </div>
      )}
    </div>
  );
}