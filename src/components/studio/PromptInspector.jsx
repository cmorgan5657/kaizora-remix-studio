import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, AlertTriangle } from 'lucide-react';

const SEGMENT_COLORS = {
  shotType: 'bg-info/20 text-info',
  character: 'bg-accent/20 text-accent',
  wardrobe: 'bg-purple-500/20 text-purple-400',
  intent: 'bg-card-raised text-secondary-foreground',
  environment: 'bg-success/20 text-success',
  lighting: 'bg-warning/20 text-warning',
  style: 'bg-pink-500/20 text-pink-400',
  quality: 'bg-muted text-muted-foreground',
};

export default function PromptInspector({ payload }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tokenPct = Math.min(100, (payload.tokenCount / payload.tokenBudget) * 100);
  const overBudget = payload.tokenCount > payload.tokenBudget;

  return (
    <div className="rounded-md bg-card border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-card-raised transition-colors">
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-xs font-medium text-secondary-foreground">What will be sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-card-raised overflow-hidden">
            <div className={`h-full rounded-full transition-all ${overBudget ? 'bg-warning' : 'bg-accent'}`} style={{ width: `${tokenPct}%` }} />
          </div>
          <span className={`text-xs tabular-nums ${overBudget ? 'text-warning' : 'text-muted-foreground'}`}>{payload.tokenCount}/{payload.tokenBudget}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Positive prompt <span className="opacity-60">(hover to see source)</span></div>
            <div className="flex flex-wrap gap-1">
              {payload.segments.map((seg, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded text-xs leading-snug ${SEGMENT_COLORS[seg.key] || 'bg-muted text-muted-foreground'}`} title={`Source: ${seg.source}`}>{seg.text}</span>
              ))}
              {payload.segments.length === 0 && <span className="text-xs text-muted-foreground">No segments. Type intent and add locks to compile.</span>}
            </div>
          </div>

          {payload.droppedSegments.length > 0 && (
            <div>
              <div className="text-xs text-warning mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dropped to fit token budget ({payload.tokenBudget} tokens)</div>
              <div className="flex flex-wrap gap-1">
                {payload.droppedSegments.map((seg, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-warning/10 text-warning line-through" title={`Dropped: exceeds token budget`}>{seg.text}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-1">Negative prompt</div>
            <div className="p-2 rounded bg-card-raised text-xs text-muted-foreground leading-relaxed">{payload.negativePrompt}</div>
          </div>

          {payload.conditioningChannels.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Active conditioning channels</div>
              <div className="space-y-1">
                {payload.conditioningChannels.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-secondary-foreground">{ch.name}</span>
                    <span className="px-1 py-0.5 rounded bg-card-raised text-muted-foreground">{ch.type}</span>
                    <span className="text-muted-foreground">w:{ch.weight}</span>
                    <span className="text-muted-foreground opacity-60">({ch.source})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Seed:</span>
              <span className="text-secondary-foreground tabular-nums">{payload.seed ?? 'random'}</span>
            </div>
            <button onClick={copyPayload} className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors">
              {copied ? <><Check className="w-3 h-3 text-success" /> Copied</> : <><Copy className="w-3 h-3" /> Copy payload</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}