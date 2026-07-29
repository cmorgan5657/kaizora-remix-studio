import ReferencePanel from '@/components/studio/ReferencePanel';

export default function ProjectStatePanel({ styleLocks, envLocks, lightingLocks, references, onReferencesChange }) {
  const activeLocks = [styleLocks, envLocks, lightingLocks].filter((l) => l.some((i) => i.isActive)).length;

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="px-4 py-3 border-b border-border">
        <span className="panel-title">Project State</span>
        <div className="text-xs text-muted-foreground mt-1">{activeLocks} of 3 active locks</div>
      </div>

      <div className="flex-1" />

      <div className="border-t border-border p-4">
        <span className="panel-title">Reference Assets</span>
        <div className="mt-2">
          <ReferencePanel references={references || []} onChange={onReferencesChange} />
        </div>
      </div>
    </div>
  );
}