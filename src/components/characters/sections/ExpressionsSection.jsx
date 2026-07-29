import { Upload, Trash2 } from 'lucide-react';
import { CORE_EXPRESSIONS, EXTENDED_EXPRESSIONS } from '@/lib/characterCompiler';
import { useRef, useState } from 'react';

function ExpressionSlot({ name, expression, onUpload, onDelete }) {
  const hasImage = expression?.imageUrl;
  return (
    <div className="relative group">
      {hasImage ? (
        <div className="aspect-square rounded-md border border-border overflow-hidden relative bg-card-raised">
          <img src={expression.imageUrl} alt={name} className="w-full h-full object-cover" />
          {expression.isGenerated && <span className="absolute top-1 left-1 px-1 py-0.5 text-[10px] rounded bg-accent-muted text-accent-foreground">Gen</span>}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button onClick={onUpload} className="p-1.5 text-white hover:text-accent bg-white/10 rounded"><Upload className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 text-white hover:text-destructive bg-white/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ) : (
        <button onClick={onUpload} className="aspect-square w-full rounded-md border border-dashed border-border hover:border-border-active transition-colors flex flex-col items-center justify-center gap-1 bg-card/30 text-muted-foreground hover:text-secondary-foreground">
          <Upload className="w-4 h-4" />
          <span className="text-[10px] text-center px-1 leading-tight">{name}</span>
        </button>
      )}
      {hasImage && <span className="text-[10px] text-muted-foreground truncate block mt-1 text-center">{name}</span>}
    </div>
  );
}

export default function ExpressionsSection({ expressions, onUpload, onDelete }) {
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [showExtended, setShowExtended] = useState(false);

  const triggerUpload = (name) => { setUploadTarget(name); fileInputRef.current?.click(); };
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    e.target.value = '';
    await onUpload(uploadTarget, file);
    setUploadTarget(null);
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div>
        <span className="panel-title mb-3 block">Core Expressions</span>
        <div className="grid grid-cols-4 gap-2">
          {CORE_EXPRESSIONS.map((name) => {
            const expr = expressions.find(e => e.expressionName === name);
            return <ExpressionSlot key={name} name={name} expression={expr} onUpload={() => triggerUpload(name)} onDelete={() => expr && onDelete(expr.id)} />;
          })}
        </div>
      </div>

      <div>
        <button onClick={() => setShowExtended(!showExtended)} className="panel-title mb-3 block hover:text-foreground transition-colors">
          Extended Expressions {showExtended ? '−' : '+'}
        </button>
        {showExtended && (
          <div className="grid grid-cols-4 gap-2">
            {EXTENDED_EXPRESSIONS.map((name) => {
              const expr = expressions.find(e => e.expressionName === name);
              return <ExpressionSlot key={name} name={name} expression={expr} onUpload={() => triggerUpload(name)} onDelete={() => expr && onDelete(expr.id)} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}