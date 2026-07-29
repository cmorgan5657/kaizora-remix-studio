import { useState } from 'react';
import ControlSlider from '@/components/characters/ControlSlider';
import ActionLibrary from '@/components/motion/ActionLibrary';
import MotionPresets from '@/components/motion/MotionPresets';

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

const POSTURES = ['Standing', 'Sitting', 'Lying', 'Leaning', 'Crouching'];
const BODY_FACINGS = ['Front', 'Profile', 'Three-quarter', 'Back'];
const HAND_STATES = ['At sides', 'In pockets', 'Gesturing', 'Holding prop', 'Crossed'];
const ARM_POSITIONS = ['At sides', 'Raised', 'Crossed', 'One raised'];
const GESTURE_FREQUENCIES = ['None', 'Occasional', 'Frequent', 'Constant'];
const GESTURE_STYLES = ['Natural', 'Animated', 'Restrained', 'Exaggerated'];
const PROP_INTERACTIONS = ['None', 'Reading', 'Drinking', 'Smoking', 'Phone', 'Writing'];
const GAZE_TARGETS = ['Camera', 'Away left', 'Away right', 'Down', 'Up'];
const EYE_CONTACT_DURATIONS = ['None', 'Brief', 'Sustained', 'Breaking'];
const BLINK_RATES = ['Natural', 'Reduced', 'None'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function MotionControls({ motion, setMotion }) {
  const update = (key, value) => setMotion((prev) => ({ ...prev, [key]: value }));
  const isAdvanced = motion.motionMode === 'advanced';
  const [selectedAction, setSelectedAction] = useState(motion.selectedAction || null);
  const [activePreset, setActivePreset] = useState(motion.motionPresetName || null);

  const handleSelectAction = (action) => { setSelectedAction(action); };
  const handleApplyPreset = (preset) => { setActivePreset(preset.name); setMotion((prev) => ({ ...prev, ...preset.params, motionPresetName: preset.name })); };

  return (
    <div className="space-y-4">
      <ActionLibrary selectedAction={selectedAction} onSelect={handleSelectAction} />

      <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border w-fit">
        <button onClick={() => update('motionMode', 'simple')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${!isAdvanced ? 'bg-card-raised text-foreground' : 'text-muted-foreground'}`}>Simple</button>
        <button onClick={() => update('motionMode', 'advanced')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${isAdvanced ? 'bg-card-raised text-foreground' : 'text-muted-foreground'}`}>Advanced</button>
      </div>

      {!isAdvanced ? (
        <div className="space-y-4">
          <ControlSlider label="Energy (Still → Explosive)" value={motion.energy} onChange={(v) => update('energy', v)} defaultValue={50} />
          <ControlSlider label="Gesture frequency (None → Constant)" value={motion.energy} onChange={(v) => update('gestureFrequency', ['None', 'Occasional', 'Frequent', 'Constant'][Math.floor(v / 25)])} defaultValue={50} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Posture"><select value={motion.posture} onChange={(e) => update('posture', e.target.value)} className={selectClass}>{POSTURES.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Body facing"><select value={motion.bodyFacing} onChange={(e) => update('bodyFacing', e.target.value)} className={selectClass}>{BODY_FACINGS.map((b) => <option key={b}>{b}</option>)}</select></Field>
            <Field label="Hand state"><select value={motion.handState} onChange={(e) => update('handState', e.target.value)} className={selectClass}>{HAND_STATES.map((h) => <option key={h}>{h}</option>)}</select></Field>
            <Field label="Arm position"><select value={motion.armPosition} onChange={(e) => update('armPosition', e.target.value)} className={selectClass}>{ARM_POSITIONS.map((a) => <option key={a}>{a}</option>)}</select></Field>
          </div>

          <ControlSlider label="Energy (Still → Explosive)" value={motion.energy} onChange={(v) => update('energy', v)} defaultValue={50} />
          <ControlSlider label="Weight (Light → Grounded)" value={motion.weight} onChange={(v) => update('weight', v)} defaultValue={50} />
          <ControlSlider label="Tension (Loose → Rigid)" value={motion.tension} onChange={(v) => update('tension', v)} defaultValue={50} />
          <div className="grid grid-cols-2 gap-4">
            <ControlSlider label="Head tilt — Pitch (up/down)" value={motion.headTiltPitch} onChange={(v) => update('headTiltPitch', v)} defaultValue={0} min={-100} max={100} />
            <ControlSlider label="Head tilt — Roll (left/right)" value={motion.headTiltRoll} onChange={(v) => update('headTiltRoll', v)} defaultValue={0} min={-100} max={100} />
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <div className="text-xs text-muted-foreground">Gesture</div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Frequency"><select value={motion.gestureFrequency} onChange={(e) => update('gestureFrequency', e.target.value)} className={selectClass}>{GESTURE_FREQUENCIES.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Style"><select value={motion.gestureStyle} onChange={(e) => update('gestureStyle', e.target.value)} className={selectClass}>{GESTURE_STYLES.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Prop interaction"><select value={motion.propInteraction} onChange={(e) => update('propInteraction', e.target.value)} className={selectClass}>{PROP_INTERACTIONS.map((p) => <option key={p}>{p}</option>)}</select></Field>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <div className="text-xs text-muted-foreground">Gaze</div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Gaze target"><select value={motion.gazeTarget} onChange={(e) => update('gazeTarget', e.target.value)} className={selectClass}>{GAZE_TARGETS.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Eye contact"><select value={motion.eyeContactDuration} onChange={(e) => update('eyeContactDuration', e.target.value)} className={selectClass}>{EYE_CONTACT_DURATIONS.map((e) => <option key={e}>{e}</option>)}</select></Field>
              <Field label="Blink rate"><select value={motion.blinkRate} onChange={(e) => update('blinkRate', e.target.value)} className={selectClass}>{BLINK_RATES.map((b) => <option key={b}>{b}</option>)}</select></Field>
            </div>
          </div>
        </>
      )}

      <div className="pt-2 border-t border-border">
        <MotionPresets onApply={handleApplyPreset} activePreset={activePreset} />
      </div>
    </div>
  );
}