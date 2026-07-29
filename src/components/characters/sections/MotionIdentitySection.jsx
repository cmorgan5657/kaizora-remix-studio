import ControlSlider from '../ControlSlider';

const POSTURES = ['Upright', 'Relaxed', 'Slouched', 'Leaning Forward', 'Leaning Back', 'Hunched', 'Coiled', 'Collapsed'];
const GESTURE_STYLES = ['Minimal', 'Natural', 'Expressive', 'Theatrical'];
const GESTURE_FREQS = ['None', 'Occasional', 'Frequent', 'Constant'];

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

export default function MotionIdentitySection({ motionProfile, onUpdate }) {
  const mp = motionProfile || { defaultEnergy: 50, defaultWeight: 50, defaultTension: 50 };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Motion Identity</h2>
        <p className="text-xs text-muted-foreground">Your character's default physical behavior. Applied to every shot unless overridden.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Default posture</label>
          <select value={mp.defaultPosture || ''} onChange={(e) => onUpdate({ defaultPosture: e.target.value })} className={selectClass}>
            <option value="">Select...</option>
            {POSTURES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <ControlSlider label="Default energy" value={mp.defaultEnergy ?? 50} onChange={(v) => onUpdate({ defaultEnergy: v })} defaultValue={50} />
        <ControlSlider label="Default weight" value={mp.defaultWeight ?? 50} onChange={(v) => onUpdate({ defaultWeight: v })} defaultValue={50} />
        <ControlSlider label="Default tension" value={mp.defaultTension ?? 50} onChange={(v) => onUpdate({ defaultTension: v })} defaultValue={50} />

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Gesture frequency</label>
          <select value={mp.defaultGestureFrequency || ''} onChange={(e) => onUpdate({ defaultGestureFrequency: e.target.value })} className={selectClass}>
            <option value="">Select...</option>
            {GESTURE_FREQS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Gesture style</label>
          <select value={mp.defaultGestureStyle || ''} onChange={(e) => onUpdate({ defaultGestureStyle: e.target.value })} className={selectClass}>
            <option value="">Select...</option>
            {GESTURE_STYLES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}