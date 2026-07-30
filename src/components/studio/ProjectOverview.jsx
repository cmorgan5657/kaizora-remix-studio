import { Film, Users, Palette, Sun, Mountain, Clapperboard, Music } from 'lucide-react';
import { Image as UIImage } from '@/components/ui/image';

export default function ProjectOverview({ project, characters, styleLocks, envLocks, lightingLocks, sequences, shots, references, onSelectShot }) {
  const activeStyle = styleLocks?.find((l) => l.isActive);
  const activeEnv = envLocks?.find((l) => l.isActive);
  const activeLight = lightingLocks?.find((l) => l.isActive);

  const sortedSeqs = [...(sequences || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const shotsBySeq = sortedSeqs.map((seq) => ({
    ...seq,
    seqShots: (shots || []).filter((s) => s.sequenceId === seq.id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
  }));
  const unseqShots = (shots || []).filter((s) => !sequences?.some((seq) => seq.id === s.sequenceId));

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-semibold text-foreground">{project?.name}</h1>
            <div className="text-xs text-muted-foreground mt-1">
              {characters?.length || 0} characters · {sequences?.length || 0} sequences · {shots?.length || 0} shots · {project?.aspectRatio}
            </div>
          </div>
          <Clapperboard className="w-5 h-5 text-muted-foreground" />
        </div>

        {references?.length > 0 && (
          <div>
            <span className="panel-title">Reference Assets</span>
            <div className="mt-2 flex gap-2 flex-wrap">
              {references.map((ref, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-card flex items-center justify-center">
                  {ref.type === 'image' ? (
                    <UIImage src={ref.url} fittingType="fill" className="w-full h-full" />
                  ) : ref.type === 'audio' ? (
                    <Music className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Film className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeStyle || activeEnv || activeLight) && (
          <div>
            <span className="panel-title">Visual Direction</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeStyle && <LockCard icon={Palette} label="Style" name={activeStyle.name} detail={`${activeStyle.colorGrade || ''} · ${activeStyle.filmStock || ''} · ${activeStyle.lens || ''}`} />}
              {activeEnv && <LockCard icon={Mountain} label="Environment" name={activeEnv.name} detail={activeEnv.description || `${activeEnv.interiorExterior || ''} · ${activeEnv.scale || ''}`} />}
              {activeLight && <LockCard icon={Sun} label="Lighting" name={activeLight.name} detail={`${activeLight.mood || ''} · ${activeLight.timeOfDay || ''}`} />}
            </div>
          </div>
        )}

        {characters?.length > 0 && (
          <div>
            <span className="panel-title">Characters</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {characters.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.role}{c.isActive ? ' · Active' : ''}</div>
                    </div>
                  </div>
                  {c.identityStatement && <div className="text-xs text-secondary-foreground mt-2 line-clamp-3">{c.identityStatement}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(shotsBySeq.length > 0 || unseqShots.length > 0) && (
          <div>
            <span className="panel-title">Sequences & Shots</span>
            <div className="mt-2 space-y-3">
              {shotsBySeq.map((seq) => (
                <div key={seq.id}>
                  <div className="text-xs font-medium text-secondary-foreground mb-1">{seq.name} <span className="text-muted-foreground">({seq.seqShots.length} shots)</span></div>
                  <div className="space-y-1">
                    {seq.seqShots.map((shot) => (
                      <ShotRow key={shot.id} shot={shot} onClick={() => onSelectShot(shot.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {unseqShots.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-secondary-foreground mb-1">Unassigned <span className="text-muted-foreground">({unseqShots.length} shots)</span></div>
                  <div className="space-y-1">
                    {unseqShots.map((shot) => (
                      <ShotRow key={shot.id} shot={shot} onClick={() => onSelectShot(shot.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LockCard({ icon: Icon, label, name, detail }) {
  return (
    <div className="p-2.5 rounded-lg bg-card border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground truncate">{name}</div>
      <div className="text-xs text-secondary-foreground line-clamp-2">{detail}</div>
    </div>
  );
}

function ShotRow({ shot, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left p-2 rounded-md bg-card border border-border hover:border-accent transition-colors flex items-center gap-3">
      <div className="w-10 h-8 rounded bg-card-raised flex items-center justify-center flex-shrink-0">
        <Film className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{shot.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{shot.intentText || 'No intent set'}</div>
      </div>
      <div className="text-[10px] text-muted-foreground flex-shrink-0 text-right">
        <div>{shot.shotType || '—'}</div>
        <div>{shot.cameraMove || '—'} · {shot.duration || 5}s</div>
      </div>
    </button>
  );
}