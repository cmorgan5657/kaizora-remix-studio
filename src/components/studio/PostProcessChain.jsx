import { Wrench, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ControlSlider from '@/components/characters/ControlSlider';

const STAGES = [
  { id: 'faceRestoration', name: 'Face Restoration', deterministic: true, desc: 'Restore faces below a frame-height threshold using character references.', settings: ['threshold', 'strength'] },
  { id: 'upscale', name: 'Upscale', deterministic: true, desc: 'Increase output resolution.', settings: ['targetResolution'] },
  { id: 'colorGrade', name: 'Color Grade', deterministic: true, desc: 'Applies style lock color grade, grain, and halation deterministically. Pixel-identical across every shot.' },
  { id: 'textComposite', name: 'Text Composite', deterministic: true, desc: 'Render text as a compositing pass. Legible, correct, editable text every time.' },
  { id: 'frameInterpolation', name: 'Frame Interpolation', deterministic: true, desc: 'Increase frame rate for smoother motion.', settings: ['targetFps'] },
  { id: 'artifactDetection', name: 'Artifact Detection', deterministic: true, desc: 'Always on. Scans for distorted hands, bad faces, flicker, frozen frames. Report only.', alwaysOn: true },
];

export default function PostProcessChain({ postProcess, setPostProcess }) {
  const [expanded, setExpanded] = useState(null);
  const update = (id, data) => setPostProcess((prev) => ({ ...prev, [id]: { ...prev[id], ...data } }));

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-2">Post-processing chain — deterministic passes run after generation. Changing a stage does not rerun earlier stages.</div>
      {STAGES.map((stage) => {
        const config = postProcess[stage.id] || { enabled: false };
        const isOn = stage.alwaysOn || config.enabled;
        return (
          <div key={stage.id} className={`rounded-md border ${isOn ? 'border-border-active bg-card' : 'border-border bg-card/50'}`}>
            <div className="flex items-center gap-2 p-2">
              {stage.deterministic ? <Wrench className="w-3 h-3 text-muted-foreground flex-shrink-0" /> : <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{stage.name}</div>
                <div className="text-xs text-muted-foreground truncate">{stage.desc}</div>
              </div>
              {stage.settings && (
                <button onClick={() => setExpanded(expanded === stage.id ? null : stage.id)} className="p-1 text-muted-foreground hover:text-foreground">
                  {expanded === stage.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              )}
              {!stage.alwaysOn && (
                <button onClick={() => update(stage.id, { enabled: !config.enabled })} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isOn ? 'bg-accent' : 'bg-card-raised border border-border'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${isOn ? 'left-4' : 'left-0.5'}`} />
                </button>
              )}
              {stage.alwaysOn && <span className="text-xs text-muted-foreground">Always on</span>}
            </div>
            {expanded === stage.id && stage.settings && (
              <div className="px-3 pb-3 space-y-3 border-t border-border pt-2">
                {stage.settings.includes('threshold') && <ControlSlider label="Face threshold (% of frame height)" value={config.threshold ?? 12} onChange={(v) => update(stage.id, { threshold: v })} defaultValue={12} min={5} max={50} />}
                {stage.settings.includes('strength') && <ControlSlider label="Restoration strength" value={config.strength ?? 60} onChange={(v) => update(stage.id, { strength: v })} defaultValue={60} />}
                {stage.settings.includes('targetResolution') && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target resolution</label>
                    <select value={config.targetResolution || '1080p'} onChange={(e) => update(stage.id, { targetResolution: e.target.value })} className="w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
                      <option>1080p</option><option>1440p</option><option>4K</option>
                    </select>
                  </div>
                )}
                {stage.settings.includes('targetFps') && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target FPS</label>
                    <select value={config.targetFps || 60} onChange={(e) => update(stage.id, { targetFps: Number(e.target.value) })} className="w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
                      <option value={30}>30</option><option value={60}>60</option><option value={120}>120</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}