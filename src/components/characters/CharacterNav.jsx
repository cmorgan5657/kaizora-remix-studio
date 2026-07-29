import { User, Images, GraduationCap, Smile, Shirt, Activity, ShieldCheck, Plus } from 'lucide-react';

const SECTIONS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'reference', label: 'Reference Set', icon: Images },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'expressions', label: 'Expressions', icon: Smile },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'motion', label: 'Motion Identity', icon: Activity },
  { id: 'continuity', label: 'Continuity Rules', icon: ShieldCheck },
  { id: 'health', label: 'Sheet Health', icon: ShieldCheck },
];

export default function CharacterNav({ characters, selectedCharacterId, onSelectCharacter, onCreateCharacter, activeSection, onSelectSection, sheetStrength }) {
  return (
    <nav className="w-[220px] flex-shrink-0 border-r border-border bg-panel flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <select
            value={selectedCharacterId || ''}
            onChange={(e) => onSelectCharacter(e.target.value)}
            className="flex-1 bg-card border border-border rounded-md px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring min-w-0"
          >
            {characters.length === 0 && <option value="">No characters</option>}
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={onCreateCharacter} className="p-1.5 text-muted-foreground hover:text-accent transition-colors bg-card border border-border rounded-md" title="New character">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {sheetStrength !== undefined && selectedCharacterId && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sheet strength:</span>
            <span className={`text-xs font-medium tabular-nums ${sheetStrength >= 75 ? 'text-success' : sheetStrength >= 50 ? 'text-warning' : 'text-destructive'}`}>{sheetStrength}/100</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onSelectSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors border-l-2 ${
                activeSection === s.id ? 'bg-card text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-secondary-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}