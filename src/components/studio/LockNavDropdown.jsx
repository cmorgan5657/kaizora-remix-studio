import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function LockNavDropdown({ label, icon: Icon, locks, lockType, onAdd, onEdit, onToggleActive }) {
  const [open, setOpen] = useState(false);
  const hasActive = (locks || []).some((l) => l.isActive);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${hasActive ? 'text-accent' : 'text-muted-foreground hover:text-secondary-foreground'}`}>
          <Icon className="w-3 h-3" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-56 p-2">
        {locks.length === 0 ? (
          <div className="py-3 text-xs text-muted-foreground text-center">No {label.toLowerCase()} yet</div>
        ) : (
          <div className="space-y-0.5">
            {locks.map((l) => (
              <div key={l.id} className="flex items-center gap-1 px-1 py-1 rounded hover:bg-card-raised">
                <button onClick={() => { onEdit(lockType, l.id); setOpen(false); }} className="flex-1 text-left text-sm text-foreground truncate min-w-0">
                  {l.name}
                </button>
                <button
                  onClick={() => onToggleActive(lockType, l.id, l.isActive)}
                  className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${l.isActive ? 'bg-accent' : 'bg-card-raised border border-border'}`}
                  title={l.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-all ${l.isActive ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-border mt-1 pt-1">
          <button onClick={() => { onAdd(); setOpen(false); }} className="w-full text-left px-1 py-1 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add new
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}