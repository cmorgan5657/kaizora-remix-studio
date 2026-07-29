import { X, Keyboard } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac');
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { keys: ['←', '→'], desc: 'Navigate between shots' },
  { keys: [MOD, 'E'], desc: 'Export current shot' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close dialogs' },
];

export default function ShortcutsHelp({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-panel border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2"><Keyboard className="w-4 h-4" /> Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-secondary-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-1.5 py-0.5 text-xs font-mono bg-card border border-border rounded text-foreground">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}