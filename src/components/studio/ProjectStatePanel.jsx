import { Plus, User, Palette, Mountain, Sun, MoreVertical } from 'lucide-react';

function EntityCard({ name, icon: Icon, subtitle }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-card border border-border hover:border-border-active transition-colors group cursor-pointer">
      <div className="w-8 h-8 rounded bg-card-raised flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{name}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function EmptyCard({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md border border-dashed border-border text-muted-foreground">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs leading-snug">{text}</span>
    </div>
  );
}

function Section({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="panel-title">{title}</span>
        {onAdd && (
          <button onClick={onAdd} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

const TIER_LABELS = {
  described: 'Described — will drift',
  referenced: 'Referenced — mostly consistent',
  trained: 'Trained — holds across angles',
};

export default function ProjectStatePanel({ characters, styleLocks, envLocks, lightingLocks, onAddCharacter, onAddStyleLock, onAddEnvLock, onAddLightingLock }) {
  const activeLocks = [styleLocks, envLocks, lightingLocks].filter((l) => l.some((i) => i.isActive)).length;

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="px-4 py-3 border-b border-border">
        <span className="panel-title">Project State</span>
        <div className="text-xs text-muted-foreground mt-1">{activeLocks} of 3 active locks</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        <Section title="Characters" onAdd={onAddCharacter}>
          {characters.length === 0 ? (
            <EmptyCard icon={User} text="No characters yet. Define one once and it stays consistent across every shot." />
          ) : (
            characters.map((c) => (
              <EntityCard key={c.id} name={c.name} icon={User} subtitle={`${TIER_LABELS[c.tier] || c.tier} · ${c.sheetStrength || 0}/100`} />
            ))
          )}
        </Section>

        <Section title="Style Lock" onAdd={onAddStyleLock}>
          {styleLocks.length === 0 ? (
            <EmptyCard icon={Palette} text="No style lock. Keeps visuals consistent across shots." />
          ) : (
            styleLocks.map((l) => <EntityCard key={l.id} name={l.name} icon={Palette} subtitle={l.colorGrade} />)
          )}
        </Section>

        <Section title="Environment Lock" onAdd={onAddEnvLock}>
          {envLocks.length === 0 ? (
            <EmptyCard icon={Mountain} text="No environment. Prevents background warping on camera moves." />
          ) : (
            envLocks.map((l) => <EntityCard key={l.id} name={l.name} icon={Mountain} subtitle={l.scale} />)
          )}
        </Section>

        <Section title="Lighting Lock" onAdd={onAddLightingLock}>
          {lightingLocks.length === 0 ? (
            <EmptyCard icon={Sun} text="No lighting lock. Keeps light consistent across shots." />
          ) : (
            lightingLocks.map((l) => <EntityCard key={l.id} name={l.name} icon={Sun} subtitle={l.mood} />)
          )}
        </Section>
      </div>
    </div>
  );
}