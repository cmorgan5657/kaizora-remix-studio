import { Check, Loader2, Circle } from 'lucide-react';

const STAGES = [
  { id: 'resolve', name: 'Resolve' },
  { id: 'precondition', name: 'Precondition' },
  { id: 'generate', name: 'Generate' },
  { id: 'postprocess', name: 'Post-process' },
  { id: 'measure', name: 'Measure' },
  { id: 'finalize', name: 'Finalize' },
];

export default function PipelineProgress({ stages }) {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
        <div className="text-sm text-secondary-foreground">Generating…</div>
      </div>
      <div className="space-y-1.5">
        {STAGES.map((stage) => {
          const stageStatus = stages[stage.id] || 'queued';
          return (
            <div key={stage.id} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                stageStatus === 'complete' ? 'bg-success text-success-foreground' :
                stageStatus === 'processing' ? 'bg-accent text-accent-foreground' :
                'bg-card-raised text-muted-foreground'
              }`}>
                {stageStatus === 'complete' ? <Check className="w-3 h-3" /> :
                 stageStatus === 'processing' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 <Circle className="w-2 h-2" />}
              </div>
              <span className={`text-xs ${stageStatus === 'processing' ? 'text-foreground' : stageStatus === 'complete' ? 'text-secondary-foreground' : 'text-muted-foreground'}`}>
                {stage.name}
              </span>
              {stage.id === 'generate' && stageStatus === 'complete' && (
                <span className="text-xs text-success ml-auto">Credits charged</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}