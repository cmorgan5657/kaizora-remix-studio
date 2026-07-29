import SheetHealthRing from './SheetHealthRing';
import { TIER_LABELS } from '@/lib/characterCompiler';

export default function CharacterCardPreview({ character, sheetData }) {
  if (!character) return null;
  const tierLabel = TIER_LABELS[sheetData.tier] || TIER_LABELS.described;
  const tierColor = sheetData.tier === 'trained' ? 'text-success' : sheetData.tier === 'referenced' ? 'text-warning' : 'text-muted-foreground';
  const topRec = sheetData.recommendations[0];

  return (
    <aside className="w-[280px] flex-shrink-0 border-l border-border bg-panel overflow-y-auto scrollbar-thin p-4 space-y-4">
      <div className="panel-title">Character Card</div>
      <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-card-raised flex items-center justify-center text-xl font-semibold text-muted-foreground">
          {character.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-foreground">{character.name}</div>
          <div className={`text-xs mt-1 ${tierColor}`}>{sheetData.tier}</div>
        </div>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">{tierLabel}</p>
      </div>

      <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center gap-2">
        <SheetHealthRing strength={sheetData.strength} size={100} label="Sheet Strength" />
      </div>

      {topRec && (
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">Top recommendation</div>
          <p className="text-xs text-secondary-foreground leading-relaxed">{topRec.text}</p>
        </div>
      )}
    </aside>
  );
}