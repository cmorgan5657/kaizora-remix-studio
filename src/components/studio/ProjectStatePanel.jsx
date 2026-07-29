import { Plus, Palette, Mountain, Sun, MoreVertical } from 'lucide-react';
import ReferencePanel from '@/components/studio/ReferencePanel';

function LockCard({ name, icon: Icon, subtitle, thumbnail, isActive, onToggleActive, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-2 p-2 rounded-md bg-card border transition-colors group cursor-pointer ${isActive === false ? 'border-border opacity-50' : 'border-border hover:border-border-active'}`}>
      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded bg-card-raised flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{name}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
        className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${isActive ? 'bg-accent' : 'bg-card-raised border border-border'}`}
        title={isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
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
        {onAdd && <button onClick={onAdd} data-onboarding={title === 'Characters' ? 'add-character' : undefined} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export default function ProjectStatePanel({ styleLocks, envLocks, lightingLocks, references, onReferencesChange, onAddStyleLock, onAddEnvLock, onAddLightingLock, onEditLock, onToggleLockActive }) {
  const activeLocks = [styleLocks, envLocks, lightingLocks].filter((l) => l.some((i) => i.isActive)).length;

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="px-4 py-3 border-b border-border">
        <span className="panel-title">Project State</span>
        <div className="text-xs text-muted-foreground mt-1">{activeLocks} of 3 active locks</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        <Section title="Style Lock" onAdd={onAddStyleLock}>
          {styleLocks.length === 0 ? (
            <EmptyCard icon={Palette} text="No style lock. Keeps visuals consistent across shots." />
          ) : styleLocks.map((l) => (
            <LockCard key={l.id} name={l.name} icon={Palette} subtitle={l.colorGrade} thumbnail={l.referenceImageUrl} isActive={l.isActive} onToggleActive={() => onToggleLockActive('StyleLock', l.id, l.isActive)} onClick={() => onEditLock('StyleLock', l.id)} />
          ))}
        </Section>

        <Section title="Environment Lock" onAdd={onAddEnvLock}>
          {envLocks.length === 0 ? (
            <EmptyCard icon={Mountain} text="No environment. Prevents background warping on camera moves." />
          ) : envLocks.map((l) => (
            <LockCard key={l.id} name={l.name} icon={Mountain} subtitle={l.scale} thumbnail={l.referenceImages?.[0]} isActive={l.isActive} onToggleActive={() => onToggleLockActive('EnvironmentLock', l.id, l.isActive)} onClick={() => onEditLock('EnvironmentLock', l.id)} />
          ))}
        </Section>

        <Section title="Lighting Lock" onAdd={onAddLightingLock}>
          {lightingLocks.length === 0 ? (
            <EmptyCard icon={Sun} text="No lighting lock. Keeps light consistent across shots." />
          ) : lightingLocks.map((l) => (
            <LockCard key={l.id} name={l.name} icon={Sun} subtitle={l.mood} isActive={l.isActive} onToggleActive={() => onToggleLockActive('LightingLock', l.id, l.isActive)} onClick={() => onEditLock('LightingLock', l.id)} />
          ))}
        </Section>
      </div>

      <div className="border-t border-border p-4">
        <span className="panel-title">Reference Assets</span>
        <div className="mt-2">
          <ReferencePanel references={references || []} onChange={onReferencesChange} />
        </div>
      </div>
    </div>
  );
}