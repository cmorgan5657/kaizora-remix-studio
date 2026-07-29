const MOTION_PRESETS = [
  { name: 'Confident Approach', desc: 'Strong, purposeful', params: { posture: 'Upright', energy: 70, weight: 60, tension: 40, gestureFrequency: 'Occasional', gestureStyle: 'Natural' } },
  { name: 'Nervous Idle', desc: 'Fidgety, anxious', params: { posture: 'Hunched', energy: 65, weight: 40, tension: 80, gestureFrequency: 'Frequent', gestureStyle: 'Restrained' } },
  { name: 'Exhausted Collapse', desc: 'Heavy, drained', params: { posture: 'Collapsed', energy: 15, weight: 85, tension: 20, gestureFrequency: 'None', gestureStyle: 'Natural' } },
  { name: 'Alert Scan', desc: 'Tense, watchful', params: { posture: 'Coiled', energy: 55, weight: 50, tension: 75, gestureFrequency: 'None', gestureStyle: 'Minimal', gazeTarget: 'Off Right' } },
  { name: 'Casual Conversation', desc: 'Relaxed, social', params: { posture: 'Relaxed', energy: 40, weight: 50, tension: 30, gestureFrequency: 'Occasional', gestureStyle: 'Expressive' } },
  { name: 'Dramatic Reveal', desc: 'Deliberate, theatrical', params: { posture: 'Upright', energy: 60, weight: 65, tension: 55, gestureFrequency: 'Occasional', gestureStyle: 'Theatrical' } },
  { name: 'Combat Ready', desc: 'Coiled, explosive', params: { posture: 'Coiled', energy: 80, weight: 60, tension: 90, gestureFrequency: 'None', gestureStyle: 'Minimal' } },
  { name: 'Grieving Stillness', desc: 'Heavy, withdrawn', params: { posture: 'Collapsed', energy: 20, weight: 70, tension: 35, gestureFrequency: 'None', gestureStyle: 'Restrained' } },
  { name: 'Playful Energy', desc: 'Light, bouncy', params: { posture: 'Upright', energy: 75, weight: 35, tension: 25, gestureFrequency: 'Frequent', gestureStyle: 'Expressive' } },
  { name: 'Guarded Withdrawal', desc: 'Closed, defensive', params: { posture: 'Leaning Back', energy: 30, weight: 55, tension: 65, gestureFrequency: 'None', gestureStyle: 'Restrained' } },
];

export default function MotionPresets({ onApply, activePreset }) {
  return (
    <div>
      <span className="panel-title mb-2 block">Motion Presets</span>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {MOTION_PRESETS.map((preset) => (
          <button key={preset.name} onClick={() => onApply(preset)} className={`flex-shrink-0 w-32 p-2 rounded-md border text-left transition-colors ${activePreset === preset.name ? 'border-accent bg-accent-muted/20' : 'border-border bg-card hover:border-border-active'}`}>
            <div className="text-xs font-medium text-foreground">{preset.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{preset.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}