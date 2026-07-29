import { Plus, Trash2 } from 'lucide-react';

const inputClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring';

export default function WardrobeSection({ wardrobeStates, onAdd, onUpdate, onDelete }) {
  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Wardrobe</h2>
        <button onClick={onAdd} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add Outfit</button>
      </div>
      <p className="text-xs text-muted-foreground">Explicit wardrobe state prevents drift between shots. Each outfit is applied as conditioning, not described in prose.</p>

      <div className="space-y-3">
        {wardrobeStates.length === 0 ? (
          <div className="text-xs text-muted-foreground p-4 border border-dashed border-border rounded-md">No outfits defined. Add one to keep wardrobe consistent across shots.</div>
        ) : wardrobeStates.map((w) => (
          <div key={w.id} className="p-3 rounded-md bg-card border border-border space-y-2">
            <div className="flex items-center gap-2">
              <input value={w.name || ''} onChange={(e) => onUpdate(w.id, { name: e.target.value })} className={inputClass} placeholder="Outfit name" />
              <button onClick={() => onUpdate(w.id, { isDefault: !w.isDefault })} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${w.isDefault ? 'bg-accent text-accent-foreground' : 'bg-card-raised text-muted-foreground border border-border'}`}>
                {w.isDefault ? 'Default' : 'Set default'}
              </button>
              <button onClick={() => onDelete(w.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <input value={w.description || ''} onChange={(e) => onUpdate(w.id, { description: e.target.value })} className={inputClass} placeholder="Description: what they wear..." />
          </div>
        ))}
      </div>
    </div>
  );
}