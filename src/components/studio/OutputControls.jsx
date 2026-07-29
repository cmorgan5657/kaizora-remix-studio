import { Download } from 'lucide-react';

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function OutputControls({ generation, onExport }) {
  const hasVersion = generation?.status === 'complete' && generation.version;
  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">Export settings</div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Format">
          <select className={selectClass} defaultValue="MP4 (H.264)">
            <option>MP4 (H.264)</option>
            <option>MP4 (H.265)</option>
            <option>WebM</option>
            <option>ProRes 422</option>
          </select>
        </Field>
        <Field label="Resolution">
          <select className={selectClass} defaultValue="1080p">
            <option>720p</option>
            <option>1080p</option>
            <option>4K</option>
          </select>
        </Field>
      </div>
      <button onClick={onExport} disabled={!hasVersion} className="px-4 py-2 text-sm text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
        <Download className="w-4 h-4" /> Export current version
      </button>
      {!hasVersion && <p className="text-xs text-muted-foreground">Generate a shot first, then export the result.</p>}
    </div>
  );
}