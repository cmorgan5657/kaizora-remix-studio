import { Check } from 'lucide-react';

function VersionPanel({ version, label }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1 p-4">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {version ? (
        <>
          <Check className="w-8 h-8 text-success" />
          <div className="text-sm text-foreground">Version {version.versionNumber}</div>
          <div className="text-xs text-muted-foreground">{version.creditCost} credits</div>
          <div className="text-xs text-muted-foreground">Seed {version.resolvedSeed}</div>
          <div className="text-xs text-muted-foreground">{version.qualityTier}</div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">No version</div>
      )}
    </div>
  );
}

export default function ABCompare({ versionA, versionB }) {
  return (
    <div className="w-full h-full flex">
      <VersionPanel version={versionA} label="A" />
      <div className="w-px bg-border" />
      <VersionPanel version={versionB} label="B" />
    </div>
  );
}