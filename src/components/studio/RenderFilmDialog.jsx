import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, X, Film, Download, Loader2, SkipBack, SkipForward } from 'lucide-react';

const ASPECT_CLASS = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '2.39:1': 'aspect-[2.39/1]',
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
};

export default function RenderFilmDialog({ project, shots, onClose }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentClip, setCurrentClip] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const sortedShots = [...shots].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const results = await Promise.all(
          sortedShots.map((shot) =>
            base44.entities.ShotVersion.filter({ shotId: shot.id }).then((versions) => ({ shot, versions }))
          )
        );
        const compiled = [];
        for (const { shot, versions } of results) {
          if (!versions || versions.length === 0) continue;
          const sorted = [...versions].sort((a, b) => (a.versionNumber || 0) - (b.versionNumber || 0));
          const accepted = sorted.find((v) => v.isAccepted) || sorted[sorted.length - 1];
          if (accepted && accepted.videoUrl) {
            compiled.push({ shot, version: accepted });
          }
        }
        setClips(compiled);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, [shots]);

  useEffect(() => {
    if (isPlaying && videoRef.current && clips.length > 0) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentClip, isPlaying, clips]);

  const togglePlay = () => {
    if (!videoRef.current || clips.length === 0) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const handleEnded = () => {
    if (currentClip < clips.length - 1) {
      setCurrentClip(currentClip + 1);
      setCurrentTime(0);
    } else {
      setIsPlaying(false);
      setCurrentClip(0);
      setCurrentTime(0);
    }
  };

  const skipClip = (dir) => {
    const next = currentClip + dir;
    if (next >= 0 && next < clips.length) {
      setCurrentClip(next);
      setCurrentTime(0);
    }
  };

  const handleDownloadAll = () => {
    clips.forEach((clip, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = clip.version.videoUrl;
        a.download = `${String(i + 1).padStart(2, '0')}_${(clip.shot.name || 'shot').replace(/\s+/g, '_')}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 800);
    });
  };

  const totalDuration = clips.reduce((sum, c) => sum + (c.shot.duration || 5), 0);
  const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const aspectClass = ASPECT_CLASS[project?.aspectRatio] || 'aspect-video';
  const clipProgress = clips[currentClip] ? currentTime / (clips[currentClip].shot?.duration || 5) : 0;
  const overallProgress = clips.length > 0 ? ((currentClip + clipProgress) / clips.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Render Film</span>
          {!loading && clips.length > 0 && (
            <span className="text-xs text-muted-foreground">{clips.length} clips · {fmtTime(totalDuration)} total runtime</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Compiling film…</span>
            </div>
          ) : clips.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-center max-w-xs">
              <Film className="w-10 h-10 text-muted-foreground" />
              <div className="text-sm text-secondary-foreground">No clips ready</div>
              <div className="text-xs text-muted-foreground">Generate shots and mark versions as accepted to compile your film. Each shot needs at least one generated version.</div>
            </div>
          ) : (
            <div className={`relative w-full max-w-3xl ${aspectClass} bg-black rounded-lg overflow-hidden`}>
              <video
                key={currentClip}
                ref={videoRef}
                src={clips[currentClip]?.version?.videoUrl}
                poster={clips[currentClip]?.version?.thumbnailUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onEnded={handleEnded}
                onClick={togglePlay}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-xs text-white">
                Clip {currentClip + 1} / {clips.length} · {clips[currentClip]?.shot?.name}
              </div>
            </div>
          )}
        </div>

        {!loading && clips.length > 0 && (
          <div className="w-56 border-l border-border flex flex-col flex-shrink-0 max-[799px]:hidden">
            <div className="px-3 py-2 border-b border-border"><span className="panel-title">Clips</span></div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
              {clips.map((clip, i) => (
                <button
                  key={clip.shot.id}
                  onClick={() => { setCurrentClip(i); setCurrentTime(0); }}
                  className={`w-full text-left p-2 rounded-md border transition-colors flex items-center gap-2 ${i === currentClip ? 'bg-card border-accent' : 'bg-card border-border hover:border-border-active'}`}
                >
                  <span className="text-[10px] text-muted-foreground tabular-nums w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{clip.shot.name}</div>
                    <div className="text-[10px] text-muted-foreground">{clip.shot.shotType || '—'} · {clip.shot.duration || 5}s</div>
                  </div>
                  {clip.version.isAccepted && <span className="text-[9px] text-success font-medium">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!loading && clips.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border flex-shrink-0">
          <button onClick={() => skipClip(-1)} disabled={currentClip === 0} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"><SkipBack className="w-4 h-4" /></button>
          <button onClick={togglePlay} className="p-2 text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => skipClip(1)} disabled={currentClip === clips.length - 1} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"><SkipForward className="w-4 h-4" /></button>
          <div className="flex-1 h-1 bg-card rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{currentClip + 1} / {clips.length}</span>
          <button onClick={handleDownloadAll} className="px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download All
          </button>
        </div>
      )}
    </div>
  );
}