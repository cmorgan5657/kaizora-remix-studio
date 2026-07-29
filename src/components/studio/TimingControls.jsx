import { Lock, Shuffle } from 'lucide-react';
import ControlSlider from '@/components/characters/ControlSlider';

const selectClass = 'w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function TimingControls({ timing, setTiming, shots }) {
  const update = (key, value) => setTiming((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-4">
      <ControlSlider label="Duration (seconds)" value={timing.duration} onChange={(v) => update('duration', v)} defaultValue={5} min={1} max={10} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="FPS">
          <select value={timing.fps} onChange={(e) => update('fps', Number(e.target.value))} className={selectClass}>
            <option value={24}>24</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </Field>
        <Field label="Resolution">
          <select value={timing.resolution} onChange={(e) => update('resolution', e.target.value)} className={selectClass}>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <div className="text-xs text-foreground">Continue from previous shot</div>
          <div className="text-xs text-muted-foreground">Use the last frame of the previous shot as the first frame.</div>
        </div>
        <button onClick={() => update('continueFromPrevious', !timing.continueFromPrevious)} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${timing.continueFromPrevious ? 'bg-accent' : 'bg-card-raised border border-border'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${timing.continueFromPrevious ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>
      <ControlSlider label="Anchor strength" value={timing.anchorStrength} onChange={(v) => update('anchorStrength', v)} defaultValue={60} />
      <p className="text-xs text-muted-foreground">Higher anchor strength holds continuity between shots more firmly.</p>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <div className="text-xs text-foreground">Shot seed</div>
          <div className="text-xs text-muted-foreground tabular-nums">{timing.shotSeed ?? 'Inherited'}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => update('seedLocked', !timing.seedLocked)} className={`p-1 rounded transition-colors ${timing.seedLocked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`} title={timing.seedLocked ? 'Unlock shot seed' : 'Lock shot seed'}>
            <Lock className="w-3 h-3" />
          </button>
          {!timing.seedLocked && (
            <button onClick={() => update('shotSeed', Math.floor(Math.random() * 1000000))} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Randomize shot seed">
              <Shuffle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <Field label="Same moment as">
        <select value={timing.sameMomentAsShotId || ''} onChange={(e) => update('sameMomentAsShotId', e.target.value || null)} className={selectClass}>
          <option value="">None (independent)</option>
          {shots?.map((s) => (
            <option key={s.id} value={s.id}>{s.name || `Shot ${(s.orderIndex ?? 0) + 1}`}</option>
          ))}
        </select>
      </Field>
      {timing.sameMomentAsShotId && (
        <p className="text-xs text-muted-foreground">Linked shots share the same moment from different angles. Lock the seed for deterministic consistency.</p>
      )}
    </div>
  );
}