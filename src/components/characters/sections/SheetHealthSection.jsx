import SheetHealthRing from '../SheetHealthRing';
import { ArrowRight } from 'lucide-react';

export default function SheetHealthSection({ sheetData, onNavigate }) {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Sheet Health</h2>
        <p className="text-xs text-muted-foreground">Your character's consistency readiness, broken down by what matters.</p>
      </div>

      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border border-border">
        <SheetHealthRing strength={sheetData.strength} size={140} />
        <span className="text-sm text-secondary-foreground capitalize">{sheetData.tier} tier</span>
      </div>

      <div>
        <span className="panel-title mb-3 block">Breakdown</span>
        <div className="space-y-2">
          {sheetData.breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-secondary-foreground w-40 flex-shrink-0">{item.label}</span>
              <div className="flex-1 h-2 rounded-full bg-card-raised overflow-hidden">
                <div className={`h-full rounded-full ${item.score / item.weight > 0.5 ? 'bg-success' : item.score > 0 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${(item.score / item.weight) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{item.score}/{item.weight}{item.filled !== undefined ? ` (${item.filled}/${item.total})` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {sheetData.recommendations.length > 0 && (
        <div>
          <span className="panel-title mb-3 block">Recommendations</span>
          <div className="space-y-2">
            {sheetData.recommendations.map((rec, i) => (
              <button key={i} onClick={() => onNavigate(rec.link)} className="w-full text-left p-3 rounded-md bg-card border border-border hover:border-border-active transition-colors flex items-start gap-2 group">
                <p className="flex-1 text-sm text-secondary-foreground leading-relaxed">{rec.text}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}