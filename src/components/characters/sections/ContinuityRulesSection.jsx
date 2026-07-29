import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';

const SEVERITIES = ['Must Never Change', 'Should Stay Consistent', 'Flexible'];
const SEVERITY_COLORS = {
  'Must Never Change': 'text-destructive',
  'Should Stay Consistent': 'text-warning',
  'Flexible': 'text-muted-foreground',
};

const inputClass = 'flex-1 bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring';

export default function ContinuityRulesSection({ continuityRules, criticalFeatures, onAdd, onSeedFromCritical, onDelete }) {
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('Should Stay Consistent');

  const add = () => {
    if (!newDesc.trim()) return;
    onAdd(newDesc.trim(), newSeverity);
    setNewDesc('');
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Continuity Rules</h2>
        <p className="text-xs text-muted-foreground">Declarative constraints. The continuity checker uses these to flag breaks between shots.</p>
      </div>

      {criticalFeatures.length > 0 && (
        <button onClick={onSeedFromCritical} className="px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Seed {criticalFeatures.length} rule{criticalFeatures.length !== 1 ? 's' : ''} from critical features
        </button>
      )}

      <div className="flex items-center gap-2">
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className={inputClass} placeholder="Add a continuity rule..." />
        <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="bg-card border border-border rounded-md px-2 py-1.5 text-xs text-secondary-foreground outline-none focus:ring-2 focus:ring-ring">
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={add} className="p-1.5 text-muted-foreground hover:text-accent transition-colors"><Plus className="w-4 h-4" /></button>
      </div>

      <div className="space-y-2">
        {continuityRules.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-md">No continuity rules. Add constraints like "scar on left cheek must never change."</div>
        ) : continuityRules.map((r) => (
          <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-md bg-card border border-border">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.severity === 'Must Never Change' ? 'bg-destructive' : r.severity === 'Should Stay Consistent' ? 'bg-warning' : 'bg-muted-foreground'}`} />
            <span className="flex-1 text-sm text-secondary-foreground">{r.description}</span>
            <span className={`text-xs whitespace-nowrap ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
            <button onClick={() => onDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}