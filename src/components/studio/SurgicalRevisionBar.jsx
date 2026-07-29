import { useState } from 'react';
import { Scissors } from 'lucide-react';

const selectClass = 'bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring';

const REGIONS = ['Full frame', 'Face', 'Background', 'Left half', 'Right half', 'Top half', 'Bottom half'];
const TIME_RANGES = ['Full duration', 'First half', 'Second half', 'First second', 'Last second'];

export default function SurgicalRevisionBar({ onRegenerate, disabled }) {
  const [region, setRegion] = useState('Face');
  const [timeRange, setTimeRange] = useState('Full duration');

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-panel">
      <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
        <Scissors className="w-3.5 h-3.5" />
        <span className="text-xs">Surgical Revision</span>
      </div>
      <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
        {REGIONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={selectClass}>
        {TIME_RANGES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button onClick={() => onRegenerate(region, timeRange)} disabled={disabled} className="ml-auto px-3 py-1 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Regenerate Region
      </button>
    </div>
  );
}