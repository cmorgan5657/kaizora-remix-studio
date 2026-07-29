import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ControlSlider from '@/components/characters/ControlSlider';

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

const SHOT_TYPES = ['Wide', 'Medium', 'Close-up', 'Extreme Close-up', 'Over-the-shoulder', 'POV', 'Aerial', 'Establishing'];
const CAMERA_MOVES = ['Static', 'Pan', 'Tilt', 'Dolly', 'Tracking', 'Crane', 'Handheld', 'Orbit', 'Zoom'];
const EASINGS = ['Linear', 'Ease In', 'Ease Out', 'Ease In-Out'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function CameraControls({ camera, setCamera }) {
  const update = (key, value) => setCamera((prev) => ({ ...prev, [key]: value }));
  const [showPath, setShowPath] = useState(false);
  const path = camera.cameraPath || [];

  const addKeyframe = () => update('cameraPath', [...path, { x: 0, y: 0, z: 0 }]);
  const removeKeyframe = (idx) => update('cameraPath', path.filter((_, i) => i !== idx));
  const updateKeyframe = (idx, axis, value) => update('cameraPath', path.map((k, i) => (i === idx ? { ...k, [axis]: value } : k)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Shot type">
          <select value={camera.shotType} onChange={(e) => update('shotType', e.target.value)} className={selectClass}>{SHOT_TYPES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Camera move">
          <select value={camera.cameraMove} onChange={(e) => update('cameraMove', e.target.value)} className={selectClass}>{CAMERA_MOVES.map((m) => <option key={m}>{m}</option>)}</select>
        </Field>
        <Field label="Easing">
          <select value={camera.cameraEasing} onChange={(e) => update('cameraEasing', e.target.value)} className={selectClass}>{EASINGS.map((e) => <option key={e}>{e}</option>)}</select>
        </Field>
      </div>
      <ControlSlider label="Speed (Slow → Fast)" value={camera.cameraSpeed} onChange={(v) => update('cameraSpeed', v)} defaultValue={50} />
      <ControlSlider label="Distance (Close → Far)" value={camera.cameraDistance} onChange={(v) => update('cameraDistance', v)} defaultValue={50} />
      <ControlSlider label="Start delay (frames @24fps)" value={camera.cameraStartDelay} onChange={(v) => update('cameraStartDelay', v)} defaultValue={0} max={120} />

      <div className="pt-2 border-t border-border">
        <button onClick={() => setShowPath(!showPath)} className="text-xs text-muted-foreground hover:text-accent transition-colors">
          {showPath ? '− Hide' : '+ Show'} advanced path keyframes
        </button>
        {showPath && (
          <div className="mt-3 space-y-2">
            {path.map((kf, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">KF{idx + 1}</span>
                {['x', 'y', 'z'].map((axis) => (
                  <input key={axis} type="number" value={kf[axis]} onChange={(e) => updateKeyframe(idx, axis, Number(e.target.value))} className="w-16 bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground" placeholder={axis.toUpperCase()} />
                ))}
                <button onClick={() => removeKeyframe(idx)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={addKeyframe} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"><Plus className="w-3 h-3" /> Add keyframe</button>
          </div>
        )}
      </div>
    </div>
  );
}