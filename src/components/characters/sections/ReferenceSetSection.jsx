import { useRef, useState } from 'react';
import { Upload, Trash2, Sparkles, AlertTriangle, Check, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ANGLE_SLOTS, DISTANCE_SLOTS, LIGHTING_SLOTS } from '@/lib/characterCompiler';

function Slot({ name, reference, badge, onUpload, onDelete, error }) {
  const hasImage = reference?.imageUrl;
  const qcWarn = reference?.qcStatus === 'warn';
  const qcBlock = reference?.qcStatus === 'block';
  const isGenerated = reference?.isGenerated;

  return (
    <div className="relative group">
      {hasImage ? (
        <div className="aspect-square rounded-md border border-border overflow-hidden relative bg-card-raised">
          <img src={reference.imageUrl} alt={name} className="w-full h-full object-cover" />
          {isGenerated && <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-accent-muted text-accent-foreground flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> Gen</span>}
          {qcWarn && <span className="absolute top-1 right-1 p-0.5 rounded bg-warning/20 text-warning" title={reference.qcMessages?.join('; ')}><AlertTriangle className="w-3 h-3" /></span>}
          {badge && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-accent text-accent-foreground">{badge}</span>}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button onClick={onUpload} className="p-1.5 text-white hover:text-accent bg-white/10 rounded" title="Replace"><RefreshCw className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 text-white hover:text-destructive bg-white/10 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ) : (
        <button onClick={onUpload} className="aspect-square w-full rounded-md border border-dashed border-border hover:border-border-active transition-colors flex flex-col items-center justify-center gap-1 bg-card/30 text-muted-foreground hover:text-secondary-foreground">
          <Upload className="w-4 h-4" />
          <span className="text-[10px] text-center px-1 leading-tight">{name}</span>
        </button>
      )}
      {hasImage && <span className="text-[10px] text-muted-foreground truncate block mt-1 text-center">{name}</span>}
      {error && <span className="text-[10px] text-destructive block mt-1">{error}</span>}
      {qcWarn && reference?.qcMessages?.length > 0 && !error && (
        <span className="text-[10px] text-warning block mt-1 leading-tight">{reference.qcMessages[0]}</span>
      )}
    </div>
  );
}

function SlotGroup({ title, slots, references, onUpload, onDelete, errors, badgeSlot }) {
  return (
    <div>
      <span className="panel-title mb-3 block">{title}</span>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const ref = references.find(r => r.slotName === slot);
          return (
            <Slot
              key={slot}
              name={slot}
              reference={ref}
              badge={slot === badgeSlot ? 'Highest impact' : undefined}
              onUpload={() => onUpload(slot)}
              onDelete={() => ref && onDelete(ref.id)}
              error={errors[slot]}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ReferenceSetSection({ characterId, references, onUpload, onDelete, onUpdateReference, onGenerateMissing, onGenerateFromSource, generating, generatingError }) {
  const fileInputRef = useRef(null);
  const sourceInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [uploadingSource, setUploadingSource] = useState(false);

  const triggerUpload = (slotGroup, slotName) => {
    setUploadTarget({ slotGroup, slotName });
    setErrors(prev => ({ ...prev, [slotName]: undefined }));
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    e.target.value = '';
    const result = await onUpload(uploadTarget.slotGroup, uploadTarget.slotName, file);
    if (!result.success) setErrors(prev => ({ ...prev, [uploadTarget.slotName]: result.error }));
    setUploadTarget(null);
  };

  const handleSourceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingSource(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSourceImageUrl(file_url);
    } catch (err) {}
    setUploadingSource(false);
  };

  const angleRefs = references.filter(r => r.slotGroup === 'angle');
  const distRefs = references.filter(r => r.slotGroup === 'distance');
  const lightRefs = references.filter(r => r.slotGroup === 'lighting');
  const filledCount = references.filter(r => r.imageUrl).length;
  const stackItems = references.filter(r => r.includedInStack && r.imageUrl);
  const canGenerate = filledCount >= 2 && !generating;

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="panel-title">Build from Source Image</span>
            <p className="text-xs text-muted-foreground mt-1">Upload one reference image and generate the entire reference set from it.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={sourceInputRef} type="file" accept="image/*" className="hidden" onChange={handleSourceFile} />
          {sourceImageUrl ? (
            <div className="relative group">
              <img src={sourceImageUrl} alt="Source" className="w-16 h-16 rounded-md object-cover border border-border" />
              <button onClick={() => sourceInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center" title="Replace source">
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button onClick={() => sourceInputRef.current?.click()} disabled={uploadingSource} className="px-3 py-2 text-xs text-muted-foreground hover:text-accent border border-dashed border-border rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-40">
              {uploadingSource ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload Source
            </button>
          )}
          <button onClick={() => onGenerateFromSource?.(sourceImageUrl)} disabled={!sourceImageUrl || generating} className="px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
            {generating ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> Generate All from Source</>}
          </button>
        </div>
      </div>

      <SlotGroup title="Angle Coverage" slots={ANGLE_SLOTS} references={angleRefs} onUpload={(slot) => triggerUpload('angle', slot)} onDelete={onDelete} errors={errors} />
      <SlotGroup title="Distance Coverage" slots={DISTANCE_SLOTS} references={distRefs} onUpload={(slot) => triggerUpload('distance', slot)} onDelete={onDelete} errors={errors} badgeSlot="Wide" />
      <SlotGroup title="Lighting Coverage" slots={LIGHTING_SLOTS} references={lightRefs} onUpload={(slot) => triggerUpload('lighting', slot)} onDelete={onDelete} errors={errors} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="panel-title">Generate Missing References</span>
            <p className="text-xs text-muted-foreground mt-1">Uses existing images to synthesize empty angle slots.</p>
          </div>
          <button onClick={onGenerateMissing} disabled={!canGenerate} className="px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
            {generating ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> Generate</>}
          </button>
        </div>
        {filledCount < 2 && <p className="text-xs text-muted-foreground">Upload at least 2 reference images to enable generation.</p>}
        {generatingError && <p className="text-xs text-destructive">{generatingError}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="panel-title">Reference Stack</span>
          <span className="text-xs text-muted-foreground">{stackItems.length} of 6 in stack</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">The images sent as conditioning. More is not better — cap at 6.</p>
        <div className="space-y-2">
          {references.filter(r => r.imageUrl).map((ref) => (
            <div key={ref.id} className="flex items-center gap-3 p-2 rounded-md bg-card border border-border">
              <img src={ref.imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-secondary-foreground truncate">{ref.slotGroup}: {ref.slotName}</div>
                <input type="range" min={0} max={100} value={ref.stackWeight || 100} onChange={(e) => onUpdateReference(ref.id, { stackWeight: Number(e.target.value) })} className="w-full accent-accent h-1 mt-1" />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{ref.stackWeight ?? 100}</span>
              <button
                onClick={() => {
                  if (!ref.includedInStack && stackItems.length >= 6) return;
                  onUpdateReference(ref.id, { includedInStack: !ref.includedInStack });
                }}
                disabled={!ref.includedInStack && stackItems.length >= 6}
                className={`px-2 py-1 text-xs rounded transition-colors ${ref.includedInStack ? 'bg-accent text-accent-foreground' : 'bg-card-raised text-muted-foreground border border-border'} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {ref.includedInStack ? <Check className="w-3 h-3" /> : 'Add'}
              </button>
            </div>
          ))}
          {references.filter(r => r.imageUrl).length === 0 && (
            <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-md flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Upload reference images to build the conditioning stack.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}