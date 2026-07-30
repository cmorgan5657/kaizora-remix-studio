import { Plus, Trash2, AlertTriangle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { composeIdentityStatement, composeNegativePrompt } from '@/lib/characterCompiler';

const inputClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function FeatureRow({ feature, onUpdate, onDelete, onGenerateVisual, isGenerating }) {
  return (
    <div className="flex items-center gap-2">
      {feature.type === 'distinguishing' && (
        <div className="relative group flex-shrink-0">
          {feature.imageUrl ? (
            <>
              <img src={feature.imageUrl} alt="" className="w-12 h-12 rounded-md object-cover border border-border" />
              <button onClick={() => onGenerateVisual?.(feature.id)} disabled={isGenerating} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center disabled:opacity-40" title="Regenerate visual">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-white" />}
              </button>
            </>
          ) : (
            <button onClick={() => onGenerateVisual?.(feature.id)} disabled={isGenerating || !feature.description} className="w-12 h-12 rounded-md border border-dashed border-border flex items-center justify-center bg-card/30 text-muted-foreground hover:text-accent hover:border-border-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title={feature.description ? 'Generate visual' : 'Add a description first'}>
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}
      <input value={feature.description || ''} onChange={(e) => onUpdate(feature.id, { description: e.target.value })} className={inputClass} placeholder="Describe a feature..." />
      {feature.type === 'distinguishing' && (
        <button onClick={() => onUpdate(feature.id, { isCritical: !feature.isCritical })} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${feature.isCritical ? 'bg-accent-muted text-accent' : 'bg-card border border-border text-muted-foreground'}`}>
          {feature.isCritical ? 'Critical' : 'Normal'}
        </button>
      )}
      <button onClick={() => onDelete(feature.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function IdentitySection({ character, features, onUpdateCharacter, onAddFeature, onUpdateFeature, onDeleteFeature, onGenerateFeatureVisual, generatingFeatureId }) {
  if (!character) return null;
  const statement = composeIdentityStatement(character, features);
  const negativePrompt = composeNegativePrompt(features);
  const distinguishing = features.filter(f => f.type === 'distinguishing');
  const neverInclude = features.filter(f => f.type === 'neverInclude');
  const charCount = statement.length;
  const overLimit = charCount > 200;

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name"><input value={character.name || ''} onChange={(e) => onUpdateCharacter({ name: e.target.value })} className={inputClass} /></Field>
          <Field label="Role">
            <select value={character.role || ''} onChange={(e) => onUpdateCharacter({ role: e.target.value })} className={inputClass}>
              <option value="">Select...</option><option>Lead</option><option>Supporting</option><option>Background</option><option>Narrator</option>
            </select>
          </Field>
          <Field label={`Age range: ${character.ageRange || '—'}`}>
            <input type="range" min={1} max={100} value={character.ageRange || 25} onChange={(e) => onUpdateCharacter({ ageRange: Number(e.target.value) })} className="w-full accent-accent" />
          </Field>
          <Field label="Gender presentation"><input value={character.genderPresentation || ''} onChange={(e) => onUpdateCharacter({ genderPresentation: e.target.value })} className={inputClass} placeholder="e.g. feminine" /></Field>
          <Field label="Height"><input value={character.height || ''} onChange={(e) => onUpdateCharacter({ height: e.target.value })} className={inputClass} placeholder={`e.g. 5'10"`} /></Field>
          <Field label="Build"><input value={character.build || ''} onChange={(e) => onUpdateCharacter({ build: e.target.value })} className={inputClass} placeholder="e.g. athletic" /></Field>
          <Field label="Skin tone">
            <div className="flex items-center gap-2">
              <input type="color" value={character.skinTone || '#C68642'} onChange={(e) => onUpdateCharacter({ skinTone: e.target.value })} className="w-8 h-8 rounded border border-border bg-transparent cursor-pointer flex-shrink-0" />
              <input value={character.skinToneDescription || ''} onChange={(e) => onUpdateCharacter({ skinToneDescription: e.target.value })} className={inputClass} placeholder="Description" />
            </div>
          </Field>
          <Field label="Facial structure"><input value={character.facialStructure || ''} onChange={(e) => onUpdateCharacter({ facialStructure: e.target.value })} className={inputClass} placeholder="e.g. angular jaw" /></Field>
          <Field label="Hair color"><input value={character.hairColor || ''} onChange={(e) => onUpdateCharacter({ hairColor: e.target.value })} className={inputClass} /></Field>
          <Field label="Hair length"><input value={character.hairLength || ''} onChange={(e) => onUpdateCharacter({ hairLength: e.target.value })} className={inputClass} /></Field>
          <Field label="Hair texture"><input value={character.hairTexture || ''} onChange={(e) => onUpdateCharacter({ hairTexture: e.target.value })} className={inputClass} /></Field>
          <Field label="Hair style"><input value={character.hairStyle || ''} onChange={(e) => onUpdateCharacter({ hairStyle: e.target.value })} className={inputClass} /></Field>
          <Field label="Eye color"><input value={character.eyeColor || ''} onChange={(e) => onUpdateCharacter({ eyeColor: e.target.value })} className={inputClass} /></Field>
          <Field label="Eye shape"><input value={character.eyeShape || ''} onChange={(e) => onUpdateCharacter({ eyeShape: e.target.value })} className={inputClass} /></Field>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="panel-title">Distinguishing features</span>
          <button onClick={() => onAddFeature('distinguishing')} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        <div className="space-y-2">
          {distinguishing.length === 0 ? (
            <div className="text-xs text-muted-foreground p-2 border border-dashed border-border rounded-md">Add scars, tattoos, birthmarks — mark critical ones to seed continuity rules.</div>
          ) : distinguishing.map(f => <FeatureRow key={f.id} feature={f} onUpdate={onUpdateFeature} onDelete={onDeleteFeature} onGenerateVisual={onGenerateFeatureVisual} isGenerating={generatingFeatureId === f.id} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="panel-title">Never include</span>
          <button onClick={() => onAddFeature('neverInclude')} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        <div className="space-y-2">
          {neverInclude.length === 0 ? (
            <div className="text-xs text-muted-foreground p-2 border border-dashed border-border rounded-md">Add things the model should never generate for this character.</div>
          ) : neverInclude.map(f => <FeatureRow key={f.id} feature={f} onUpdate={onUpdateFeature} onDelete={onDeleteFeature} onGenerateVisual={onGenerateFeatureVisual} isGenerating={generatingFeatureId === f.id} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="panel-title">Identity statement</span>
          <span className={`text-xs tabular-nums flex items-center gap-1 ${overLimit ? 'text-warning' : 'text-muted-foreground'}`}>
            {overLimit && <AlertTriangle className="w-3 h-3" />}{charCount} chars{overLimit && ' · may dilute conditioning'}
          </span>
        </div>
        <div className="p-3 rounded-md bg-card border border-border text-sm text-secondary-foreground leading-relaxed">{statement || 'Fill in identity fields to compose the statement.'}</div>
      </div>

      {negativePrompt && (
        <div>
          <span className="panel-title mb-2 block">Negative prompt (auto-composed)</span>
          <div className="p-3 rounded-md bg-card border border-border text-sm text-muted-foreground leading-relaxed">{negativePrompt}</div>
        </div>
      )}
    </div>
  );
}