import { useRef, useState } from 'react';
import { Play, Pause, Film } from 'lucide-react';

export default function ShotThumbnail({ videoUrl, className = '' }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Film className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <video ref={videoRef} src={videoUrl} muted preload="metadata" className="w-full h-full object-cover" onEnded={() => setPlaying(false)} />
      <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
        {playing ? (
          <Pause className="w-3.5 h-3.5 text-white drop-shadow" fill="currentColor" />
        ) : (
          <Play className="w-3.5 h-3.5 text-white drop-shadow" fill="currentColor" />
        )}
      </button>
    </div>
  );
}