import { useState, useMemo, useEffect } from 'react';
import { Film, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { compilePrompt } from '@/lib/compiler';
import { parseIntent } from '@/lib/intentParser';
import IntentChips from './IntentChips';
import PromptInspector from './PromptInspector';
import PipelineProgress from './PipelineProgress';
import CameraControls from './CameraControls';
import MotionControls from './MotionControls';
import ABCompare from './ABCompare';
import PresetBar from './PresetBar';
import ConsistencyInspector from './ConsistencyInspector';
import TimingControls from './TimingControls';
import OutputControls from './OutputControls';
import SurgicalRevisionBar from './SurgicalRevisionBar';

const TABS = ['INTENT', 'CAMERA', 'MOTION', 'TIMING', 'OUTPUT'];

const QUALITY_MODES = [
  { id: 'Draft', cost: '1 credit' },
  { id: 'Standard', cost: '3 credits' },
  { id: 'Final', cost: '8 credits' },
];

export default function ShotWorkspace({ project, characters, styleLocks, envLocks, lightingLocks, resolvedSeed, generation, onGenerate, onRegenerate, presets, onSavePreset, selectedShot, onExport }) {
  const [activeTab, setActiveTab] = useState('INTENT');
  const [quality, setQuality] = useState('Draft');
  const [intentText, setIntentText] = useState('');
  const [camera, setCamera] = useState({ shotType: 'Medium', cameraMove: 'Static', cameraSpeed: 50, cameraDistance: 50, cameraEasing: 'Linear', cameraStartDelay: 0, cameraPath: [] });
  const [motion, setMotion] = useState({ motionMode: 'simple', posture: 'Standing', energy: 50, weight: 50, tension: 50, bodyFacing: 'Front', handState: 'At sides', armPosition: 'At sides', headTiltPitch: 0, headTiltRoll: 0, gestureFrequency: 'Occasional', gestureStyle: 'Natural', propInteraction: 'None', gazeTarget: 'Camera', eyeContactDuration: 'Brief', blinkRate: 'Natural' });
  const [abCompare, setAbCompare] = useState(false);
  const [timing, setTiming] = useState({ duration: 5, fps: 24, resolution: '1080p', continueFromPrevious: true, anchorStrength: 60 });

  useEffect(() => {
    if (!selectedShot) return;
    setIntentText(selectedShot.intentText || '');
    setCamera({ shotType: selectedShot.shotType || 'Medium', cameraMove: selectedShot.cameraMove || 'Static', cameraSpeed: selectedShot.cameraSpeed ?? 50, cameraDistance: selectedShot.cameraDistance ?? 50, cameraEasing: selectedShot.cameraEasing || 'Linear', cameraStartDelay: selectedShot.cameraStartDelay ?? 0, cameraPath: selectedShot.cameraPath || [] });
    setMotion({ motionMode: selectedShot.motionMode || 'simple', posture: selectedShot.posture || 'Standing', energy: selectedShot.energy ?? 50, weight: selectedShot.weight ?? 50, tension: selectedShot.tension ?? 50, bodyFacing: selectedShot.bodyFacing || 'Front', handState: selectedShot.handState || 'At sides', armPosition: selectedShot.armPosition || 'At sides', headTiltPitch: selectedShot.headTiltPitch ?? 0, headTiltRoll: selectedShot.headTiltRoll ?? 0, gestureFrequency: selectedShot.gestureFrequency || 'Occasional', gestureStyle: selectedShot.gestureStyle || 'Natural', propInteraction: selectedShot.propInteraction || 'None', gazeTarget: selectedShot.gazeTarget || 'Camera', eyeContactDuration: selectedShot.eyeContactDuration || 'Brief', blinkRate: selectedShot.blinkRate || 'Natural' });
    setTiming({ duration: selectedShot.duration ?? 5, fps: selectedShot.fps ?? 24, resolution: selectedShot.resolution || '1080p', continueFromPrevious: selectedShot.continueFromPrevious ?? true, anchorStrength: selectedShot.anchorStrength ?? 60 });
  }, [selectedShot?.id]);

  const parsedIntent = useMemo(() => parseIntent(intentText), [intentText]);

  const compiledPayload = useMemo(() => {
    const activeCharacter = characters?.find((c) => c.isActive);
    const activeStyle = styleLocks?.find((l) => l.isActive);
    const activeEnv = envLocks?.find((l) => l.isActive);
    const activeLight = lightingLocks?.find((l) => l.isActive);
    return compilePrompt({
      intent: intentText,
      shotType: `${camera.shotType} shot, ${camera.cameraMove} move`,
      cameraParams: camera,
      motionParams: motion,
      character: activeCharacter ? { identityStatement: activeCharacter.identityStatement, negativePromptFragment: activeCharacter.negativePromptFragment, tier: activeCharacter.tier, triggerToken: activeCharacter.id ? `kzr_char_${activeCharacter.id.slice(-4)}` : null } : null,
      style: activeStyle ? { colorGrade: activeStyle.colorGrade, filmStock: activeStyle.filmStock, lens: activeStyle.lens } : null,
      environment: activeEnv ? { description: activeEnv.description, interiorExterior: activeEnv.interiorExterior, scale: activeEnv.scale } : null,
      lighting: activeLight ? { mood: activeLight.mood, timeOfDay: activeLight.timeOfDay, keyDirection: activeLight.keyDirection } : null,
      seed: resolvedSeed,
      aspectRatio: project?.aspectRatio || '16:9',
      lockStrengths: { character: activeCharacter?.lockStrength, style: activeStyle?.lockStrength, environment: activeEnv?.lockStrength, lighting: activeLight?.lockStrength },
    });
  }, [intentText, characters, styleLocks, envLocks, lightingLocks, project, camera, motion]);

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

  const handleGenerate = () => onGenerate(compiledPayload, quality, camera, motion, timing);
  const handleRegenerate = () => onRegenerate?.(compiledPayload, quality, camera, motion, timing);
  const handleSurgicalRegenerate = (region, timeRange) => onRegenerate?.(compiledPayload, quality, camera, motion, timing, { region, timeRange });
  const isGenerating = generation?.status === 'running';

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="relative w-full max-w-3xl aspect-video bg-card border border-border rounded-lg flex flex-col items-center justify-center gap-2 overflow-y-auto scrollbar-thin p-4">
          {generation?.version && generation?.previousVersion && (
            <button onClick={() => setAbCompare(!abCompare)} className={`absolute top-2 right-2 z-10 px-2 py-1 text-xs rounded transition-colors ${abCompare ? 'bg-accent text-accent-foreground' : 'bg-card-raised border border-border text-muted-foreground hover:text-foreground'}`}>
              A/B Compare
            </button>
          )}
          {abCompare && generation?.version && generation?.previousVersion ? (
            <ABCompare versionA={generation.previousVersion} versionB={generation.version} />
          ) : generation?.status === 'running' ? (
            <PipelineProgress stages={generation.stages} />
          ) : generation?.status === 'complete' && generation.version ? (
            <>
              <Check className="w-10 h-10 text-success" />
              <div className="text-sm text-foreground">Shot generated</div>
              <div className="text-xs text-muted-foreground">Version {generation.version.versionNumber} · {generation.version.creditCost} credits · Seed {generation.version.resolvedSeed}</div>
              <div className="text-xs text-muted-foreground mt-1">Quality: {generation.version.qualityTier}</div>
              {generation.scores && <ConsistencyInspector scores={generation.scores} remedies={generation.remedies || []} />}
            </>
          ) : generation?.status === 'failed' ? (
            <>
              <AlertCircle className="w-10 h-10 text-destructive" />
              <div className="text-sm text-destructive">Generation failed</div>
              <div className="text-xs text-muted-foreground text-center max-w-sm">{generation.error || 'Unknown error'}</div>
              <div className="text-xs text-success mt-1">Credits refunded automatically</div>
            </>
          ) : (
            <>
              <Film className="w-12 h-12 text-muted-foreground" />
              <div className="text-sm text-secondary-foreground">No shot generated</div>
              <div className="text-xs text-muted-foreground">Set your controls and generate.</div>
            </>
          )}
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
          {activeTab === 'CAMERA' && (
            <div className="space-y-4">
              <CameraControls camera={camera} setCamera={setCamera} />
              <PresetBar presets={presets} onSave={(name) => onSavePreset(name, camera, motion)} onApply={(preset) => { setCamera(preset.cameraParams); setMotion(preset.motionParams); }} />
            </div>
          )}
          {activeTab === 'MOTION' && <MotionControls motion={motion} setMotion={setMotion} />}
          {activeTab === 'TIMING' && <TimingControls timing={timing} setTiming={setTiming} />}
          {activeTab === 'OUTPUT' && <OutputControls generation={generation} onExport={onExport} />}
        </div>
      </div>

      {selectedShot && generation?.status === 'complete' && (
        <SurgicalRevisionBar onRegenerate={handleSurgicalRegenerate} disabled={isGenerating} />
      )}

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
        <div className="flex items-center gap-2">
          {selectedShot && (
            <button onClick={handleRegenerate} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-card-raised border border-border rounded-md hover:border-border-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
          )}
          <button onClick={handleGenerate} disabled={isGenerating} className="px-5 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}