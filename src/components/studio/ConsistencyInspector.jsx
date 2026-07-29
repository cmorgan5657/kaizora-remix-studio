import { Check, AlertCircle } from 'lucide-react';

function ScoreBar({ label, score }) {
  const color = score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive';
  const textColor = score >= 70 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium tabular-nums ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-card-raised overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ConsistencyInspector({ scores, remedies }) {
  if (!scores) return null;
  const overall = Math.round((scores.face + scores.style + scores.structural) / 3);
  const overallColor = overall >= 70 ? 'text-success' : overall >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className="w-full max-w-sm space-y-3 mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary-foreground">Consistency Scores</span>
        <span className={`text-xs font-medium tabular-nums ${overallColor}`}>Overall: {overall}</span>
      </div>
      <div className="space-y-2">
        <ScoreBar label="Face" score={scores.face} />
        <ScoreBar label="Style" score={scores.style} />
        <ScoreBar label="Structure" score={scores.structural} />
      </div>
      {remedies.length > 0 ? (
        <div className="space-y-1.5">
          {remedies.map((r, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/30 text-xs text-warning">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span><span className="font-medium">{r.area}:</span> {r.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-success">
          <Check className="w-3.5 h-3.5" />
          All scores above threshold. No action needed.
        </div>
      )}
    </div>
  );
}