import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Music, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function TypeIcon({ type, className }) {
  if (type === 'video') return <Video className={className} />;
  if (type === 'audio') return <Music className={className} />;
  return <ImageIcon className={className} />;
}

export default function ReferencePanel({ references, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const detectType = (file) => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'image';
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ type: detectType(file), url: file_url, name: file.name });
      }
      onChange([...(references || []), ...uploaded]);
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
  };

  const removeReference = (idx) => onChange(references.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-active'}`}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {uploading ? (
          <><Loader2 className="w-6 h-6 text-accent mx-auto mb-2 animate-spin" /><div className="text-sm text-secondary-foreground">Uploading…</div></>
        ) : (
          <><Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" /><div className="text-sm text-secondary-foreground">Drop files or click to upload</div><div className="text-xs text-muted-foreground mt-0.5">Images, video, or audio</div></>
        )}
      </div>

      {references && references.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Reference assets ({references.length})</div>
          <div className="grid grid-cols-2 gap-2">
            {references.map((ref, idx) => (
              <div key={idx} className="relative group rounded-md overflow-hidden border border-border bg-card">
                {ref.type === 'image' && <img src={ref.url} alt={ref.name} className="w-full h-24 object-cover" />}
                {ref.type === 'video' && <video src={ref.url} className="w-full h-24 object-cover" muted />}
                {ref.type === 'audio' && (
                  <div className="w-full h-24 flex items-center justify-center bg-card-raised"><Music className="w-8 h-8 text-muted-foreground" /></div>
                )}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-black/60 text-white flex items-center gap-1"><TypeIcon type={ref.type} className="w-3 h-3" /> {ref.type}</div>
                <button onClick={() => removeReference(idx)} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                <div className="px-2 py-1 text-[10px] text-muted-foreground truncate">{ref.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}