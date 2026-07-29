import { useState, useEffect } from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const THRESHOLD = 70;

export default function ConsistencyDriftIndicator({ versionId, hasReferences }) {
  const [score, setScore] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!versionId) { setScore(null); return; }
    let cancelled = false;
    base44.entities.ConsistencyScore.filter({ versionId })
      .then((r) => { if (!cancelled) setScore(r[0] || null); })
      .catch(() => { if (!cancelled) setScore(null); });
    return () => { cancelled = true; };
  }, [versionId]);

  if (!score) return null;

  const overall = score.overallScore ?? Math.round(
    ((score.characterIdentityMean || 0) + (score.styleScore || 0) + (score.environmentScore || 0) + (score.lightingScore || 0) + (score.temporalStability || 0)) / 5
  );

  const color = overall >= THRESHOLD ? 'text-success' : overall >= 50 ? 'text-warning' : 'text-destructive';
  const dotClass = overall >= THRESHOLD ? 'bg-success' : overall >= 50 ? 'bg-warning' : 'bg-destructive';

  const suggestions = [];
  if ((score.characterIdentityMean ?? 100) < THRESHOLD)
    suggestions.push({ area: 'Character', message: `Identity ${score.characterIdentityMean}/100. Raise character lock to 85+ or add front/profile reference angles.` });
  if ((score.styleScore ?? 100) < THRESHOLD)
    suggestions.push({ area: 'Style', message: hasReferences ? 'Drift from style reference. Increase IP-Adapter weight in Style lock.' : 'Add a style reference image or raise style lock strength.' });
  if ((score.environmentScore ?? 100) < THRESHOLD)
    suggestions.push({ area: 'Environment', message: hasReferences ? 'Background drift. Increase environment reference influence in lock editor.' : 'Tighten environment lock or add a reference image.' });
  if ((score.lightingScore ?? 100) < THRESHOLD)
    suggestions.push({ area: 'Lighting', message: hasReferences ? 'Lighting mismatch. Increase lighting reference weight or adjust key direction/temperature.' : 'Adjust key direction, fill ratio, or color temperature.' });
  if ((score.temporalStability ?? 100) < THRESHOLD)
    suggestions.push({ area: 'Temporal', message: 'Flicker detected. Enable face restoration, raise anchor strength, or reduce camera speed.' });

  const hasDrift = suggestions.length > 0;

  return (
    <div className="px-1 py-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); if (hasDrift) setExpanded(!expanded); }}
        className={`flex items-center gap-1 text-[10px] ${color} ${hasDrift ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span className="font-medium tabular-nums">{overall}</span>
        {hasDrift && <AlertTriangle className="w-2.5 h-2.5" />}
        {hasDrift && <ChevronRight className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />}
      </button>
      {expanded && hasDrift && (
        <div className="mt-1 space-y-1">
          {suggestions.map((s, i) => (
            <div key={i} className="text-[10px] text-muted-foreground leading-snug pl-2.5">
              <span className="font-medium text-secondary-foreground">{s.area}:</span> {s.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}