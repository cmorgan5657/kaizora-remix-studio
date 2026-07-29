import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function PreFlightValidation({ warnings, blockingError }) {
  if (warnings.length === 0 && !blockingError) return null;
  return (
    <div className="space-y-1 mb-2">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-warning px-3 py-1.5 rounded-md bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1">{w.message}</span>
          {w.fixLabel && <button onClick={w.fix} className="text-accent hover:underline flex-shrink-0">{w.fixLabel}</button>}
        </div>
      ))}
      {blockingError && (
        <div className="flex items-center gap-2 text-xs text-destructive px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{blockingError}</span>
        </div>
      )}
    </div>
  );
}