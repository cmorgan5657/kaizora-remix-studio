import { useState } from 'react';
import { Film, Sparkles, Wrench } from 'lucide-react';

const TABS = ['INTENT', 'CAMERA', 'MOTION', 'TIMING', 'OUTPUT'];

const QUALITY_MODES = [
  { id: 'Draft', cost: '1 credit' },
  { id: 'Standard', cost: '3 credits' },
  { id: 'Final', cost: '8 credits' },
];

export default function ShotWorkspace() {
  const [activeTab, setActiveTab] = useState('INTENT');
  const [quality, setQuality] = useState('Draft');

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full max-w-3xl aspect-video bg-card border border-border rounded-lg flex flex-col items-center justify-center gap-2">
          <Film className="w-12 h-12 text-muted-foreground" />
          <div className="text-sm text-secondary-foreground">No shot generated</div>
          <div className="text-xs text-muted-foreground">Set your controls and generate.</div>
        </div>
      </div>

      <div className="border-t border-border bg-panel">
        <div className="flex items-center px-4 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-secondary-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 min-h-[120px]">
          {activeTab === 'INTENT' && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Describe what happens in this shot. Your character and locks are applied automatically.</div>
              <textarea
                placeholder="e.g. She walks toward the camera, stops, and looks up at the sky."
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
              />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                Compiled prompt inspector appears here once locks are active.
              </div>
            </div>
          )}
          {activeTab !== 'INTENT' && (
            <div className="text-xs text-muted-foreground">{activeTab} controls — available in a later phase.</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-panel gap-4">
        <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border">
          {QUALITY_MODES.map((q) => (
            <button
              key={q.id}
              onClick={() => setQuality(q.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                quality === q.id ? 'bg-card-raised text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'
              }`}
            >
              {q.id}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Cost: <span className="text-secondary-foreground tabular-nums">{QUALITY_MODES.find((q) => q.id === quality)?.cost}</span>
        </div>
        <button className="px-5 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">
          Generate
        </button>
      </div>
    </div>
  );
}