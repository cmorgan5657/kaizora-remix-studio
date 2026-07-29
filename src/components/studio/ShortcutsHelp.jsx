import { X, Keyboard } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac');
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { keys: ['←', '→'], desc: 'Navigate between shots' },
  { keys: [MOD, 'E'], desc: 'Export current shot' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close dialogs' },
];

const FAQS = [
  { q: 'What is a character lock?', a: 'A character lock keeps your character visually consistent across every shot. Define identity and references once, and the compiler injects them into every generation automatically.' },
  { q: 'Why did my character change?', a: 'If your character is Described tier, it will drift. Referenced tier is mostly consistent but may drift in wide shots. Trained tier holds across angles, distance, and lighting.' },
  { q: 'What does training do and is it worth it?', a: 'Training creates a LoRA adapter that holds identity firmly. It costs 5 credits and takes ~8 minutes, but it is the only tier that actually solves drift.' },
  { q: 'What does the seed do?', a: 'The seed controls the starting noise for generation. Lock it for reproducible results. Change it for variation. Same seed + same settings = same output.' },
  { q: 'How do I fix part of a clip?', a: 'Use Surgical Revision (scissors icon). Select a region and time range, describe what should change, and only that portion is regenerated at proportional cost.' },
  { q: 'What do generations cost?', a: 'Draft: 1 credit (fast iteration). Standard: 3 credits. Final: 8 credits (full pipeline with upscale). Failed generations are automatically refunded.' },
  { q: 'Why is my text garbled?', a: 'AI models cannot reliably render text. Use the Text Composite post-processing stage instead — it renders text as a compositing pass for legible, editable text every time.' },
];

export default function ShortcutsHelp({ onClose, project }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-panel border border-border rounded-lg shadow-xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border sticky top-0 bg-panel z-10">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2"><Keyboard className="w-4 h-4" /> Help</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <span className="panel-title mb-2 block">Keyboard Shortcuts</span>
            <div className="space-y-1.5">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm text-secondary-foreground">{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (<kbd key={j} className="px-1.5 py-0.5 text-xs font-mono bg-card border border-border rounded text-foreground">{k}</kbd>))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {project && (
            <div>
              <span className="panel-title mb-2 block">Credits This Project</span>
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-secondary-foreground">Remaining balance</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{project.creditBalance ?? 0} credits</span>
              </div>
              {project.budgetCredits && (
                <div className="text-xs text-muted-foreground mt-1">Budget: {project.budgetCredits} credits · {Math.round(((project.budgetCredits - (project.creditBalance ?? 0)) / project.budgetCredits) * 100)}% used</div>
              )}
            </div>
          )}

          <div>
            <span className="panel-title mb-2 block">Frequently Asked</span>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <div className="text-sm font-medium text-foreground mb-0.5">{faq.q}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}