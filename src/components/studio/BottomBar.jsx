import { Lock, Unlock, Dices, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function BottomBar({ seed, seedLocked, seedScope, onToggleSeedLock, onRandomizeSeed, cost }) {
  const [copied, setCopied] = useState(false);

  const copySeed = () => {
    navigator.clipboard.writeText(String(seed));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <footer className="h-9 flex items-center justify-between px-4 border-t border-border bg-panel flex-shrink-0 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground flex-1">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Ready
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Seed:</span>
        <span className="tabular-nums text-secondary-foreground">{seed ?? '—'}</span>
        {seedScope && <span className="text-muted-foreground">({seedScope})</span>}
        <button
          onClick={onToggleSeedLock}
          className={`p-1 rounded transition-colors ${seedLocked ? 'text-accent' : 'text-muted-foreground hover:text-secondary-foreground'}`}
        >
          {seedLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button
          onClick={onRandomizeSeed}
          disabled={seedLocked}
          className="p-1 rounded text-muted-foreground hover:text-secondary-foreground transition-colors disabled:opacity-30"
        >
          <Dices className="w-3 h-3" />
        </button>
        <button onClick={copySeed} className="p-1 rounded text-muted-foreground hover:text-secondary-foreground transition-colors">
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <div className="text-secondary-foreground tabular-nums flex-1 text-right">{cost ?? '—'}</div>
    </footer>
  );
}