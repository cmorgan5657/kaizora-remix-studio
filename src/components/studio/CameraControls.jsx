import { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import ControlSlider from '@/components/characters/ControlSlider';

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
const btnClass = (active) => `px-2 py-1 text-xs rounded transition-colors ${active ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-secondary-foreground hover:border-border-active'}`;

const SHOT_TYPES = ['Extreme Wide', 'Wide', 'Full', 'Medium Wide', 'Medium', 'Medium Close', 'Close Up', 'Extreme Close Up', 'Over the Shoulder', 'POV', 'Two Shot', 'Insert'];
const CAMERA_MOVES = ['Static', 'Dolly In', 'Dolly Out', 'Truck Left', 'Truck Right', 'Pedestal Up', 'Pedestal Down', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Orbit Left', 'Orbit Right', 'Crane Up', 'Crane Down', 'Push In', 'Pull Out', 'Whip Pan', 'Rack Focus', 'Handheld Follow', 'Steadicam Follow', 'Zoom In', 'Zoom Out', 'Dolly Zoom'];
const EASINGS = ['Linear', 'Ease In', 'Ease Out', 'Ease In-Out'];
const LARGE_MOVES = ['Dolly In', 'Dolly Out', 'Truck Left', 'Truck Right', 'Crane Up', 'Crane Down', 'Orbit Left', 'Orbit Right', 'Whip Pan', 'Zoom In', 'Zoom Out', 'Dolly Zoom'];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function CameraControls({ camera, setCamera, hasEnvLock }) {
  const update = (key, value) => setCamera((prev) => ({ ...prev, [key]: value }));
  const [showPath, setShowPath] = useState(false);
  const path = camera.cameraPath || [];
  const isLargeMove = LARGE_MOVES.includes(camera.cameraMove);

  const addKeyframe = () => update('cameraPath', [...path, { x: 0, y: 0, z: 0 }]);
  const removeKeyframe = (idx) => update('cameraPath', path.filter((_, i) => i !== idx));
  const updateKeyframe = (idx, axis, value) => update('cameraPath', path.map((k, i) => (i === idx ? { ...k, [axis]: value } : k)));

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Shot type</label>
        <div className="flex flex-wrap gap-1">
          {SHOT_TYPES.map((s) => (
            <button key={s} onClick={() => update('shotType', s)} className={btnClass(camera.shotType === s)}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Camera move</label>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto scrollbar-thin p-1">
          {CAMERA_MOVES.map((m) => (
            <button key={m} onClick={() => update('cameraMove', m)} className={btnClass(camera.cameraMove === m)}>{m}</button>
          ))}
        </div>
      </div>

      {hasEnvLock ? (
        <div className="flex items-center gap-2 text-xs text-success px-3 py-1.5 rounded-md bg-success/10 border border-success/30">
          <span className="w-1.5 h-1.5 rounded-full bg-success" /> Spatial anchor: on — depth conditioning prevents environment warping.
        </div>
      ) : isLargeMove && (
        <div className="flex items-center gap-2 text-xs text-warning px-3 py-1.5 rounded-md bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-3 h-3" /> No environment lock. Large camera moves may distort the background. [Define environment]
        </div>
      )}

      <ControlSlider label="Speed (Slow → Fast)" value={camera.cameraSpeed} onChange={(v) => update('cameraSpeed', v)} defaultValue={50} />
      <ControlSlider label="Distance (Close → Far)" value={camera.cameraDistance} onChange={(v) => update('cameraDistance', v)} defaultValue={50} />
      <ControlSlider label="Start delay (frames @24fps)" value={camera.cameraStartDelay} onChange={(v) => update('cameraStartDelay', v)} defaultValue={0} max={120} />

      <Field label="Easing">
        <select value={camera.cameraEasing} onChange={(e) => update('cameraEasing', e.target.value)} className={selectClass}>{EASINGS.map((e) => <option key={e}>{e}</option>)}</select>
      </Field>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-foreground">Motion blur</span>
        <button onClick={() => update('motionBlur', !camera.motionBlur)} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${camera.motionBlur ? 'bg-accent' : 'bg-card-raised border border-border'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${camera.motionBlur ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="pt-2 border-t border-border">
        <button onClick={() => setShowPath(!showPath)} className="text-xs text-muted-foreground hover:text-accent transition-colors">
          {showPath ? '− Hide' : '+ Show'} camera path keyframes
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