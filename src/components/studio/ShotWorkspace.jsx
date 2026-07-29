import { useState, useMemo } from 'react';
import { Film } from 'lucide-react';
import { compilePrompt } from '@/lib/compiler';
import { parseIntent } from '@/lib/intentParser';
import IntentChips from './IntentChips';
import PromptInspector from './PromptInspector';

const TABS = ['INTENT', 'CAMERA', 'MOTION', 'TIMING', 'OUTPUT'];

const QUALITY_MODES = [
  { id: 'Draft', cost: '1 credit' },
  { id: 'Standard', cost: '3 credits' },
  { id: 'Final', cost: '8 credits' },
];

export default function ShotWorkspace({ project, characters, styleLocks, envLocks, lightingLocks }) {
  const [activeTab, setActiveTab] = useState('INTENT');
  const [quality, setQuality] = useState('Draft');
  const [intentText, setIntentText] = useState('');

  const parsedIntent = useMemo(() => parseIntent(intentText), [intentText]);

  const compiledPayload = useMemo(() => {
    const activeCharacter = characters?.find((c) => c.isActive);
    const activeStyle = styleLocks?.find((l) => l.isActive);
    const activeEnv = envLocks?.find((l) => l.isActive);
    const activeLight = lightingLocks?.find((l) => l.isActive);
    return compilePrompt({
      intent: intentText,
      character: activeCharacter ? { identityStatement: activeCharacter.identityStatement, negativePromptFragment: activeCharacter.negativePromptFragment, tier: activeCharacter.tier, triggerToken: activeCharacter.id ? `kzr_char_${activeCharacter.id.slice(-4)}` : null } : null,
      style: activeStyle ? { colorGrade: activeStyle.colorGrade, filmStock: activeStyle.filmStock, lens: activeStyle.lens } : null,
      environment: activeEnv ? { description: activeEnv.description, interiorExterior: activeEnv.interiorExterior, scale: activeEnv.scale } : null,
      lighting: activeLight ? { mood: activeLight.mood, timeOfDay: activeLight.timeOfDay, keyDirection: activeLight.keyDirection } : null,
      seed: project?.seedLocked ? project.projectSeed : null,
      aspectRatio: project?.aspectRatio || '16:9',
      lockStrengths: { character: activeCharacter?.lockStrength, style: activeStyle?.lockStrength, environment: activeEnv?.lockStrength, lighting: activeLight?.lockStrength },
    });
  }, [intentText, characters, styleLocks, envLocks, lightingLocks, project]);

  const removeChip = (index) => {
    const chip = parsedIntent.chips[index];
    if (!chip) return;
    setIntentText((prev) => prev.replace(new RegExp(chip.value, 'i'), '').replace(/\s+/g, ' ').trim());
  };

  const removeConflict = () => {
    if (!parsedIntent.conflict) return;
    const word = parsedIntent.conflict.word;
    const sentences = intentText.split(/(?<=[.!?])\s+/);
    setIntentText(sentences.filter((s) => !s.toLowerCase().includes(word)).join(' '));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full max-w-3xl aspect-video bg-card border border-border rounded-lg flex flex-col items-center justify-center gap-2">
          <Film className="w-12 h-12 text-muted-foreground" />
          <div className="text-sm text-secondary-foreground">No shot generated</div>
          <div className="text-xs text-muted-foreground">Set your controls and generate.</div>
        </div>
      </div>

      <div className="border-t border-border bg-panel">
        <div className="flex items-center px-4 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-secondary-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 min-h-[120px]">
          {activeTab === 'INTENT' && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Describe what happens in this shot. Your character and locks are applied automatically.</div>
              <textarea
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
                placeholder="e.g. She walks toward the camera, stops, and looks up at the sky."
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
              />
              <IntentChips chips={parsedIntent.chips} conflict={parsedIntent.conflict} onRemoveChip={removeChip} onRemoveConflict={removeConflict} />
              <PromptInspector payload={compiledPayload} />
            </div>
          )}
          {activeTab !== 'INTENT' && (
            <div className="text-xs text-muted-foreground">{activeTab} controls — available in a later phase.</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-panel gap-4">
        <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border">
          {QUALITY_MODES.map((q) => (
            <button
              key={q.id}
              onClick={() => setQuality(q.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                quality === q.id ? 'bg-card-raised text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'
              }`}
            >
              {q.id}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Cost: <span className="text-secondary-foreground tabular-nums">{QUALITY_MODES.find((q) => q.id === quality)?.cost}</span>
        </div>
        <button className="px-5 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">
          Generate
        </button>
      </div>
    </div>
  );
}