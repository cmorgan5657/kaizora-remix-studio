import { useState, useMemo, useEffect } from 'react';
import { Film, Loader2, Check, AlertCircle, RefreshCw, Copy } from 'lucide-react';
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
import VideoPlayer from './VideoPlayer';
import PreFlightValidation from './PreFlightValidation';
import ModelSelector from './ModelSelector';

const TABS = ['MODEL', 'INTENT', 'CAMERA', 'MOTION', 'TIMING', 'OUTPUT'];

const ASPECT_STYLE_DIRECTOR_OPEN = {
  '16:9': 'aspect-video max-w-[614px]',
  '9:16': 'aspect-[9/16] max-w-[256px]',
  '2.39:1': 'aspect-[2.39/1] max-w-[614px]',
  '1:1': 'aspect-square max-w-[358px]',
  '4:5': 'aspect-[4/5] max-w-[307px]',
};

const ASPECT_STYLE_DIRECTOR_CLOSED = {
  '16:9': 'aspect-video max-w-[768px]',
  '9:16': 'aspect-[9/16] max-w-[320px]',
  '2.39:1': 'aspect-[2.39/1] max-w-[768px]',
  '1:1': 'aspect-square max-w-[448px]',
  '4:5': 'aspect-[4/5] max-w-[384px]',
};

const QUALITY_MODES = [
  { id: 'Draft', cost: '1 credit' },
  { id: 'Standard', cost: '3 credits' },
  { id: 'Final', cost: '8 credits' },
];

export default function ShotWorkspace({ project, characters, styleLocks, envLocks, lightingLocks, resolvedSeed, generation, onGenerate, onRegenerate, presets, onSavePreset, selectedShot, onExport, shots, references, directorOpen }) {
  const ASPECT_STYLE = directorOpen ? ASPECT_STYLE_DIRECTOR_OPEN : ASPECT_STYLE_DIRECTOR_CLOSED;
  const [activeTab, setActiveTab] = useState('INTENT');
  const [quality, setQuality] = useState('Draft');
  const [intentText, setIntentText] = useState('');
  const [camera, setCamera] = useState({ shotType: 'Medium', cameraMove: 'Static', cameraSpeed: 50, cameraDistance: 50, cameraEasing: 'Linear', cameraStartDelay: 0, cameraPath: [] });
  const [motion, setMotion] = useState({ motionMode: 'simple', posture: 'Standing', energy: 50, weight: 50, tension: 50, bodyFacing: 'Front', handState: 'At sides', armPosition: 'At sides', headTiltPitch: 0, headTiltRoll: 0, gestureFrequency: 'Occasional', gestureStyle: 'Natural', propInteraction: 'None', gazeTarget: 'Camera', eyeContactDuration: 'Brief', blinkRate: 'Natural' });
  const [abCompare, setAbCompare] = useState(false);
  const [postProcess, setPostProcess] = useState({
    faceRestoration: { enabled: true, threshold: 12, strength: 60 },
    upscale: { enabled: false, targetResolution: '1080p' },
    colorGrade: { enabled: true },
    textComposite: { enabled: false },
    frameInterpolation: { enabled: false, targetFps: 60 },
    artifactDetection: { enabled: true },
  });
  const [generationMode, setGenerationMode] = useState('text2video');
  const [selectedModel, setSelectedModel] = useState('veo3');
  const [timing, setTiming] = useState({ duration: 5, fps: 24, resolution: '1080p', continueFromPrevious: true, anchorStrength: 60, shotSeed: null, seedLocked: false, sameMomentAsShotId: null });

  useEffect(() => {
    if (!selectedShot) return;
    setIntentText(selectedShot.intentText || '');
    setCamera({ shotType: selectedShot.shotType || 'Medium', cameraMove: selectedShot.cameraMove || 'Static', cameraSpeed: selectedShot.cameraSpeed ?? 50, cameraDistance: selectedShot.cameraDistance ?? 50, cameraEasing: selectedShot.cameraEasing || 'Linear', cameraStartDelay: selectedShot.cameraStartDelay ?? 0, cameraPath: selectedShot.cameraPath || [] });
    setMotion({ motionMode: selectedShot.motionMode || 'simple', posture: selectedShot.posture || 'Standing', energy: selectedShot.energy ?? 50, weight: selectedShot.weight ?? 50, tension: selectedShot.tension ?? 50, bodyFacing: selectedShot.bodyFacing || 'Front', handState: selectedShot.handState || 'At sides', armPosition: selectedShot.armPosition || 'At sides', headTiltPitch: selectedShot.headTiltPitch ?? 0, headTiltRoll: selectedShot.headTiltRoll ?? 0, gestureFrequency: selectedShot.gestureFrequency || 'Occasional', gestureStyle: selectedShot.gestureStyle || 'Natural', propInteraction: selectedShot.propInteraction || 'None', gazeTarget: selectedShot.gazeTarget || 'Camera', eyeContactDuration: selectedShot.eyeContactDuration || 'Brief', blinkRate: selectedShot.blinkRate || 'Natural' });
    setTiming({ duration: selectedShot.duration ?? 5, fps: selectedShot.fps ?? 24, resolution: selectedShot.resolution || '1080p', continueFromPrevious: selectedShot.continueFromPrevious ?? true, anchorStrength: selectedShot.anchorStrength ?? 60, shotSeed: selectedShot.shotSeed ?? null, seedLocked: selectedShot.seedLocked ?? false, sameMomentAsShotId: selectedShot.sameMomentAsShotId ?? null });
    setGenerationMode(selectedShot.generationMode || 'text2video');
    setSelectedModel(selectedShot.selectedModel || 'veo3');
  }, [selectedShot?.id, selectedShot?.intentText]);

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

  const getSeed = () => timing.seedLocked && timing.shotSeed != null ? timing.shotSeed : resolvedSeed;
  const handleGenerate = () => onGenerate({ ...compiledPayload, seed: getSeed(), postProcessChain: postProcess, references, generationMode, selectedModel }, quality, camera, motion, timing);
  const handleRegenerate = () => onRegenerate?.({ ...compiledPayload, seed: getSeed(), postProcessChain: postProcess, references, generationMode, selectedModel }, quality, camera, motion, timing);
  const handleSurgicalRegenerate = (region, timeRange) => onRegenerate?.({ ...compiledPayload, seed: getSeed(), postProcessChain: postProcess }, quality, camera, motion, timing, { region, timeRange });
  const isGenerating = generation?.status === 'running';

  const QUALITY_CREDITS = { Draft: 1, Standard: 3, Final: 8 };
  const preFlightWarnings = useMemo(() => {
    const warnings = [];
    const activeChar = characters?.find((c) => c.isActive);
    if (activeChar && (activeChar.sheetStrength || 0) < 50) {
      warnings.push({ message: `Character sheet strength is ${activeChar.sheetStrength || 0}/100. Below 50, expect drift between shots.` });
    }
    const activeEnv = envLocks?.find((l) => l.isActive);
    if (!activeEnv && camera.cameraMove !== 'Static') {
      warnings.push({ message: 'No environment lock. Large camera moves may distort the background.' });
    }
    if (compiledPayload.tokenCount > compiledPayload.tokenBudget) {
      warnings.push({ message: `Compiled prompt is ${compiledPayload.tokenCount} tokens (budget: ${compiledPayload.tokenBudget}). Lowest-priority segments will be dropped.` });
    }
    const needsRef = ['image2image', 'image2video', 'video2video', 'audio2audio'].includes(generationMode);
    if (needsRef && references.length === 0) {
      warnings.push({ message: `${generationMode.replace('2', ' → ')} mode requires at least one reference asset. Upload one in the REFERENCE tab.` });
    }
    if (parsedIntent.conflict) {
      warnings.push({ message: parsedIntent.conflict.message });
    }
    return warnings;
  }, [characters, envLocks, camera.cameraMove, compiledPayload.tokenCount, compiledPayload.tokenBudget, parsedIntent.conflict, generationMode, references]);
  const blockingError = (project?.creditBalance ?? 0) < (QUALITY_CREDITS[quality] || 1) ? `Insufficient credits. Need ${QUALITY_CREDITS[quality] || 1}, have ${project?.creditBalance ?? 0}.` : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className={`relative w-full ${ASPECT_STYLE[project?.aspectRatio] || 'aspect-video max-w-3xl'} bg-card border border-border rounded-lg flex flex-col items-center justify-center gap-2 overflow-y-auto scrollbar-thin p-4`}>
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
              <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
                {characters?.filter((c) => c.isActive).map((c) => (
                  <span key={c.id} className="px-1.5 py-0.5 text-[10px] rounded bg-accent/20 text-accent">{c.name}</span>
                ))}
                {styleLocks?.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-1.5 py-0.5 text-[10px] rounded bg-pink-500/20 text-pink-400">Style</span>
                ))}
                {envLocks?.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-1.5 py-0.5 text-[10px] rounded bg-success/20 text-success">Env</span>
                ))}
                {lightingLocks?.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-1.5 py-0.5 text-[10px] rounded bg-warning/20 text-warning">Light</span>
                ))}
              </div>
              <div className="w-full flex-1 min-h-0">
                <VideoPlayer videoUrl={generation.version.videoUrl} thumbnailUrl={generation.version.thumbnailUrl} duration={timing.duration} resolution={timing.resolution} />
              </div>
              <div className="text-xs text-muted-foreground text-center">Version {generation.version.versionNumber} · {generation.version.creditCost} credits · Seed {generation.version.resolvedSeed}</div>
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
        <div className="flex items-center px-2 border-b border-border overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab ? 'text-foreground border-accent' : 'text-muted-foreground border-transparent hover:text-secondary-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 min-h-[100px] max-h-[240px] overflow-y-auto scrollbar-thin">
          {activeTab === 'MODEL' && <ModelSelector mode={generationMode} model={selectedModel} onModeChange={setGenerationMode} onModelChange={setSelectedModel} hasReferences={references.length > 0} />}
          {activeTab === 'INTENT' && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Describe what happens in this shot. Your character and locks are applied automatically.</div>
              <textarea
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
                data-onboarding="intent-field"
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
              <CameraControls camera={camera} setCamera={setCamera} hasEnvLock={!!envLocks?.some((l) => l.isActive)} />
              <PresetBar presets={presets} onSave={(name) => onSavePreset(name, camera, motion)} onApply={(preset) => { setCamera(preset.cameraParams); setMotion(preset.motionParams); }} />
            </div>
          )}
          {activeTab === 'MOTION' && <MotionControls motion={motion} setMotion={setMotion} />}
          {activeTab === 'TIMING' && <TimingControls timing={timing} setTiming={setTiming} shots={shots?.filter((s) => s.id !== selectedShot?.id)} />}
          {activeTab === 'OUTPUT' && <OutputControls generation={generation} onExport={onExport} postProcess={postProcess} setPostProcess={setPostProcess} />}
        </div>
      </div>

      {selectedShot && generation?.status === 'complete' && (
        <SurgicalRevisionBar onRegenerate={handleSurgicalRegenerate} disabled={isGenerating} />
      )}

      <PreFlightValidation warnings={preFlightWarnings} blockingError={blockingError} />

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-panel gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 bg-card rounded-md p-0.5 border border-border">
          {QUALITY_MODES.map((q) => (
            <button
              key={q.id}
              onClick={() => setQuality(q.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                quality === q.id ? 'bg-card-raised text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'
              }`}
            >
              {q.id}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="capitalize">{generationMode.replace('2', ' → ')}</span>
          <span className="text-border-active">·</span>
          <span className="text-secondary-foreground">{selectedModel.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
          <span className="text-border-active">·</span>
          <span>Cost: <span className="text-secondary-foreground tabular-nums">{QUALITY_MODES.find((q) => q.id === quality)?.cost}</span></span>
        </div>
        <div className="flex items-center gap-2">
          {selectedShot && (
            <>
              <button onClick={handleRegenerate} disabled={isGenerating} className="px-3 py-1.5 text-sm font-medium text-secondary-foreground bg-card-raised border border-border rounded-md hover:border-border-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" title="Same seed, refine settings">
                <RefreshCw className="w-4 h-4" /> Refine
              </button>
              {generation?.version?.resolvedPayload && (
                <button onClick={() => onRegenerate?.({ ...generation.version.resolvedPayload, seed: generation.version.resolvedSeed, postProcessChain: postProcess }, quality, camera, motion, timing)} disabled={isGenerating} className="px-2.5 py-1.5 text-sm font-medium text-secondary-foreground bg-card-raised border border-border rounded-md hover:border-border-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" title="Reproduce from stored payload exactly">
                  <Copy className="w-4 h-4" /> Reproduce
                </button>
              )}
            </>
          )}
          <button onClick={handleGenerate} disabled={isGenerating || !!blockingError} data-onboarding="generate-btn" className="px-4 py-1.5 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}