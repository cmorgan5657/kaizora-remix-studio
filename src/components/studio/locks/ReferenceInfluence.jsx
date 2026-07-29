import { Image as ImageIcon, Video, Music, Link2 } from 'lucide-react';

function TypeIcon({ type, className }) {
  if (type === 'video') return <Video className={className} />;
  if (type === 'audio') return <Music className={className} />;
  return <ImageIcon className={className} />;
}

export default function ReferenceInfluence({ references, lockLabel }) {
  if (!references || references.length === 0) return null;
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Link2 className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-medium text-accent">Influencing {lockLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {references.map((ref, idx) => (
          <div key={idx} className="relative w-14 h-14 rounded-md overflow-hidden border border-border bg-card-raised flex-shrink-0">
            {ref.type === 'image' && <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />}
            {ref.type === 'video' && <video src={ref.url} className="w-full h-full object-cover" muted />}
            {ref.type === 'audio' && <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 flex items-center justify-center py-0.5">
              <TypeIcon type={ref.type} className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Wired as IP-Adapter conditioning, weighted by this lock's strength.</p>
    </div>
  );
}