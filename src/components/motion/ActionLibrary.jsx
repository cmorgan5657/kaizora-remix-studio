import { useState } from 'react';
import { Search } from 'lucide-react';

const ACTION_GROUPS = {
  Locomotion: ['Walk', 'Run', 'Jog', 'Sprint', 'Pace', 'Stroll', 'Limp', 'Sneak', 'Stumble', 'Stop', 'Turn', 'Approach', 'Retreat', 'Enter Frame', 'Exit Frame'],
  Stationary: ['Stand', 'Sit', 'Kneel', 'Crouch', 'Lie Down', 'Lean Against', 'Rise', 'Sit Down'],
  'Upper body': ['Reach', 'Grab', 'Throw', 'Catch', 'Push', 'Pull', 'Point', 'Wave', 'Nod', 'Shake Head', 'Shrug', 'Cross Arms'],
  Interaction: ['Hand Object', 'Receive Object', 'Open', 'Close', 'Press', 'Pick Up', 'Set Down'],
  Expressive: ['Laugh', 'Cry', 'Sigh', 'Gasp', 'Recoil', 'Flinch', 'Celebrate', 'Slump'],
};

const ACTION_PARAMS = {
  Walk: { speed: true, direction: true, path: true },
  Run: { speed: true, direction: true, path: true },
  Reach: { target: true, hand: true },
  Grab: { target: true, hand: true },
  Throw: { target: true },
  Point: { target: true },
};

export default function ActionLibrary({ selectedAction, onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = Object.entries(ACTION_GROUPS).map(([category, actions]) => ({
    category,
    actions: actions.filter((a) => a.toLowerCase().includes(query.toLowerCase())),
  })).filter((g) => g.actions.length > 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actions..." className="w-full bg-card border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
        {filtered.map(({ category, actions }) => (
          <div key={category}>
            <span className="panel-title mb-1.5 block">{category}</span>
            <div className="flex flex-wrap gap-1">
              {actions.map((action) => (
                <button key={action} onClick={() => onSelect(action)} className={`px-2 py-1 text-xs rounded transition-colors ${selectedAction === action ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-secondary-foreground hover:border-border-active'}`}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No actions found.</div>}
      </div>
      {selectedAction && <div className="text-xs text-muted-foreground pt-2 border-t border-border">Selected: <span className="text-foreground">{selectedAction}</span></div>}
    </div>
  );
}