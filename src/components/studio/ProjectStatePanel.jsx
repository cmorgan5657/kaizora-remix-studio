import ReferencePanel from '@/components/studio/ReferencePanel';

export default function ProjectStatePanel({ styleLocks, envLocks, lightingLocks, references, onReferencesChange, externalPrompt, onExternalPromptChange }) {
  const activeLocks = [styleLocks, envLocks, lightingLocks].filter((l) => l.some((i) => i.isActive)).length;

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="px-4 py-3 border-b border-border">
        <span className="panel-title">Project State</span>
        <div className="text-xs text-muted-foreground mt-1">{activeLocks} of 3 active locks</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col">
        <div>
          <span className="panel-title">Reference Assets</span>
          <div className="mt-2">
            <ReferencePanel references={references || []} onChange={onReferencesChange} />
          </div>
        </div>

        <div className="mt-4 flex-1 flex flex-col min-h-0">
          <span className="panel-title">Prompt</span>
          <div className="mt-2 flex-1 flex flex-col min-h-0">
            <textarea
              value={externalPrompt || ''}
              onChange={(e) => onExternalPromptChange?.(e.target.value)}
              placeholder="Enter or paste your custom prompt here…"
              className="w-full flex-1 bg-card border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none min-h-[220px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}