import { User, Clapperboard, Plus, Check, Sparkles } from 'lucide-react';

export default function DirectorMessage({ message, hasSelectedShot, onCreateShots, onApplyIntent, onAutoBuild }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-card-raised' : 'bg-accent/20'}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-secondary-foreground" /> : <Clapperboard className="w-3.5 h-3.5 text-accent" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-sm leading-relaxed rounded-lg px-3 py-2 max-w-full ${isUser ? 'bg-card-raised text-foreground' : message.error ? 'bg-destructive/10 text-destructive' : 'bg-card text-foreground'}`}>
          {message.content}
        </div>

        {message.shotSuggestions && (
          <div className="mt-2 space-y-1.5 text-left">
            {message.shotSuggestions.map((shot, i) => (
              <div key={i} className="p-2 rounded-md bg-card border border-border text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-foreground">{shot.name}</span>
                  <span className="text-[10px] text-muted-foreground">{shot.shotType} · {shot.cameraMove} · {shot.duration}s</span>
                </div>
                <div className="text-xs text-muted-foreground">{shot.intentText}</div>
              </div>
            ))}
            {!message.created ? (
              <button onClick={() => onCreateShots(message.shotSuggestions)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors mt-1">
                <Plus className="w-3.5 h-3.5" /> Create {message.shotSuggestions.length} shots
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-success mt-1"><Check className="w-3.5 h-3.5" /> Added to project</div>
            )}
          </div>
        )}

        {message.autoBuildPlan && (
          <div className="mt-2 text-left space-y-2">
            {message.autoBuildPlan.title && <div className="text-xs font-semibold text-foreground">🎬 {message.autoBuildPlan.title}</div>}
            {message.autoBuildPlan.characters?.length > 0 && (
              <div className="p-2 rounded-md bg-card border border-border">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{message.autoBuildPlan.characters.length} Characters</div>
                {message.autoBuildPlan.characters.map((c, i) => (
                  <div key={i} className="text-xs text-secondary-foreground mb-0.5"><span className="font-medium text-foreground">{c.name}</span> <span className="text-muted-foreground">({c.role})</span> — {c.identityStatement}</div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {message.autoBuildPlan.styleLock && <div className="flex-1 p-1.5 rounded-md bg-card border border-border"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Style</div><div className="text-xs text-foreground">{message.autoBuildPlan.styleLock.name}</div></div>}
              {message.autoBuildPlan.environmentLock && <div className="flex-1 p-1.5 rounded-md bg-card border border-border"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Environment</div><div className="text-xs text-foreground">{message.autoBuildPlan.environmentLock.name}</div></div>}
              {message.autoBuildPlan.lightingLock && <div className="flex-1 p-1.5 rounded-md bg-card border border-border"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Lighting</div><div className="text-xs text-foreground">{message.autoBuildPlan.lightingLock.name}</div></div>}
            </div>
            {message.autoBuildPlan.sequences?.map((seq, i) => (
              <div key={i} className="p-2 rounded-md bg-card border border-border">
                <div className="text-xs font-medium text-foreground mb-1">{seq.name} <span className="text-muted-foreground">({seq.shots?.length || 0} shots)</span></div>
                {seq.shots?.map((shot, j) => (
                  <div key={j} className="text-xs text-muted-foreground mb-0.5"><span className="text-secondary-foreground">{shot.name}</span> — {shot.intentText} <span className="text-border-active">·</span> {shot.shotType} <span className="text-border-active">·</span> {shot.cameraMove} <span className="text-border-active">·</span> {shot.duration}s</div>
                ))}
              </div>
            ))}
            {!message.built ? (
              <button onClick={() => onAutoBuild(message.autoBuildPlan)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Build entire project
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-success"><Check className="w-3.5 h-3.5" /> Project built — check your studio</div>
            )}
          </div>
        )}

        {message.promptSuggestion && (
          <div className="mt-2 text-left">
            <div className="p-2 rounded-md bg-card border border-border">
              <div className="text-xs text-muted-foreground mb-1">Suggested intent:</div>
              <div className="text-sm text-foreground italic">"{message.promptSuggestion}"</div>
            </div>
            {!message.applied ? (
              <button onClick={() => onApplyIntent(message.promptSuggestion)} disabled={!hasSelectedShot} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors mt-1.5 disabled:opacity-50 disabled:cursor-not-allowed" title={hasSelectedShot ? '' : 'Select a shot first'}>
                <Check className="w-3.5 h-3.5" /> {hasSelectedShot ? 'Apply to selected shot' : 'Select a shot first'}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-success mt-1.5"><Check className="w-3.5 h-3.5" /> Applied</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}