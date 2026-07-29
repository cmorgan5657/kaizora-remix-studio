import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Monitor, Film } from 'lucide-react';
import TopBar from '@/components/studio/TopBar';
import CharacterWorkspace from '@/components/characters/CharacterWorkspace';
import BottomBar from '@/components/studio/BottomBar';
import ProjectStatePanel from '@/components/studio/ProjectStatePanel';
import ShotWorkspace from '@/components/studio/ShotWorkspace';
import ShotsVersionsPanel from '@/components/studio/ShotsVersionsPanel';
import LockEditorDialog from '@/components/studio/LockEditorDialog';
import { runPipeline } from '@/lib/pipeline';

export default function Studio() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [styleLocks, setStyleLocks] = useState([]);
  const [envLocks, setEnvLocks] = useState([]);
  const [lightingLocks, setLightingLocks] = useState([]);
  const [shots, setShots] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [resolvedSeed, setResolvedSeed] = useState(null);
  const [generation, setGeneration] = useState({ status: 'idle', stages: {}, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState('studio');
  const [saving, setSaving] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [editingLock, setEditingLock] = useState(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [proj, chars, styles, envs, lights, seqs, existingShots, psts] = await Promise.all([
        base44.entities.Project.get(projectId),
        base44.entities.Character.filter({ projectId }),
        base44.entities.StyleLock.filter({ projectId }),
        base44.entities.EnvironmentLock.filter({ projectId }),
        base44.entities.LightingLock.filter({ projectId }),
        base44.entities.Sequence.filter({ projectId }),
        base44.entities.Shot.filter({ projectId }),
        base44.entities.CameraPreset.filter({ projectId }),
      ]);
      setProject(proj);
      setCharacters(chars);
      setStyleLocks(styles);
      setEnvLocks(envs);
      setLightingLocks(lights);
      setSequences(seqs);
      setShots(existingShots);
      setPresets(psts);
      setActiveWorkspace(proj.activeWorkspace || 'studio');
      if (proj.seedLocked) setResolvedSeed(proj.projectSeed);
      else setResolvedSeed(Math.floor(Math.random() * 1000000));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateProject = async (data) => {
    setSaving(true);
    setProject((prev) => ({ ...prev, ...data }));
    await base44.entities.Project.update(projectId, data);
    setSaving(false);
  };

  const handleRename = (name) => updateProject({ name });
  const handleWorkspaceChange = (ws) => { setActiveWorkspace(ws); updateProject({ activeWorkspace: ws }); };
  const handleToggleSeedLock = () => {
    if (project.seedLocked) {
      updateProject({ seedLocked: false });
    } else {
      updateProject({ seedLocked: true, projectSeed: resolvedSeed });
    }
  };
  const handleRandomizeSeed = () => { if (!project.seedLocked) setResolvedSeed(Math.floor(Math.random() * 1000000)); };

  const handleAddCharacter = async () => {
    const char = await base44.entities.Character.create({ projectId, name: 'New Character', tier: 'described', sheetStrength: 7, isActive: true, lockStrength: 75 });
    setCharacters((prev) => [...prev, char]);
  };

  const handleAddLock = async (entityName, defaults, setter) => {
    const item = await base44.entities[entityName].create({ projectId, ...defaults });
    setter((prev) => [...prev, item]);
  };

  const addStyleLock = () => handleAddLock('StyleLock', { name: 'New Style', colorGrade: 'Natural', filmStock: 'Digital Clean', grain: 0, halation: 0, lens: 'Standard 35mm', depthOfField: 50, aspectRatio: '16:9', isActive: true, lockStrength: 75 }, setStyleLocks);
  const addEnvLock = () => handleAddLock('EnvironmentLock', { name: 'New Environment', description: '', interiorExterior: 'interior', scale: 'Room', isActive: true, lockStrength: 75 }, setEnvLocks);
  const addLightingLock = () => handleAddLock('LightingLock', { name: 'New Lighting', keyDirection: 'N', keyIntensity: 75, fillRatio: 40, colorTemperature: 5600, timeOfDay: 'Day', mood: 'Natural', isActive: true, lockStrength: 75 }, setLightingLocks);

  const handleUpdateLock = async (type, id, data) => {
    const setters = { StyleLock: setStyleLocks, EnvironmentLock: setEnvLocks, LightingLock: setLightingLocks };
    setters[type]((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
    await base44.entities[type].update(id, data);
  };
  const handleToggleLockActive = (type, id, currentActive) => handleUpdateLock(type, id, { isActive: !currentActive });
  const handleEditLock = (type, id) => {
    const lists = { StyleLock: styleLocks, EnvironmentLock: envLocks, LightingLock: lightingLocks };
    const lock = lists[type].find((l) => l.id === id);
    if (lock) setEditingLock({ type, lock });
  };

  const handleGenerate = async (payload, qualityTier) => {
    const seed = payload.seed ?? resolvedSeed ?? Math.floor(Math.random() * 1000000);
    const finalPayload = { ...payload, seed };
    setGeneration({ status: 'running', stages: { resolve: 'queued', precondition: 'queued', generate: 'queued', postprocess: 'queued', measure: 'queued', finalize: 'queued' }, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
    try {
      let seq = sequences[0];
      if (!seq) {
        seq = await base44.entities.Sequence.create({ projectId, name: 'Main Sequence', orderIndex: 0 });
        setSequences([seq]);
      }
      const shot = await base44.entities.Shot.create({ sequenceId: seq.id, projectId, name: `Shot ${shots.length + 1}`, intentText: payload.positivePrompt, orderIndex: shots.length, status: 'generating', qualityTier, shotSeed: seed, seedLocked: project.seedLocked });
      setShots((prev) => [...prev, shot]);
      const activeCharacter = characters.find((c) => c.isActive);
      const activeStyle = styleLocks.find((l) => l.isActive);
      const activeEnv = envLocks.find((l) => l.isActive);
      const activeLight = lightingLocks.find((l) => l.isActive);
      const result = await runPipeline({ projectId, shotId: shot.id, payload: finalPayload, qualityTier, character: activeCharacter, styleLock: activeStyle, envLock: activeEnv, lightingLock: activeLight, onStageUpdate: (stageId, status) => setGeneration((prev) => ({ ...prev, stages: { ...prev.stages, [stageId]: status } })), onCreditUpdate: (newBalance) => setProject((prev) => ({ ...prev, creditBalance: newBalance })) });
      await base44.entities.Shot.update(shot.id, { status: 'complete', currentVersionId: result.version.id });
      setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, status: 'complete', currentVersionId: result.version.id } : s)));
      setGeneration((prev) => ({ ...prev, status: 'complete', job: result.job, version: result.version, scores: result.scores, remedies: result.remedies, previousVersion: prev.version }));
    } catch (error) {
      setGeneration((prev) => ({ ...prev, status: 'failed', error: error.message }));
    }
  };

  const handleSavePreset = async (name, cameraParams, motionParams) => {
    const preset = await base44.entities.CameraPreset.create({ projectId, name, cameraParams, motionParams });
    setPresets((prev) => [...prev, preset]);
  };

  const panelProps = { characters, styleLocks, envLocks, lightingLocks, onAddCharacter: handleAddCharacter, onAddStyleLock: addStyleLock, onAddEnvLock: addEnvLock, onAddLightingLock: addLightingLock, onEditLock: handleEditLock, onToggleLockActive: handleToggleLockActive };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-card-raised border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">Project not found.</div>;
  }

  const seedScope = project.seedLocked ? 'project lock' : 'random';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar project={project} onRename={handleRename} activeWorkspace={activeWorkspace} onWorkspaceChange={handleWorkspaceChange} saving={saving} />

      <div className="flex-1 flex overflow-hidden relative">
        {activeWorkspace === 'studio' ? (
          <>
            <aside className="w-[300px] flex-shrink-0 border-r border-border max-[1099px]:hidden overflow-hidden">
              <ProjectStatePanel {...panelProps} />
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
              <div className="hidden max-[1099px]:flex items-center gap-2 px-4 py-2 border-b border-border bg-panel overflow-x-auto scrollbar-thin">
                <span className="text-xs text-muted-foreground flex-shrink-0">Active:</span>
                {characters.filter((c) => c.isActive).map((c) => (
                  <span key={c.id} className="px-2 py-0.5 text-xs rounded bg-card-raised text-secondary-foreground flex-shrink-0">{c.name}</span>
                ))}
                {styleLocks.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-2 py-0.5 text-xs rounded bg-card-raised text-secondary-foreground flex-shrink-0">Style</span>
                ))}
                {envLocks.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-2 py-0.5 text-xs rounded bg-card-raised text-secondary-foreground flex-shrink-0">Env</span>
                ))}
                {lightingLocks.filter((l) => l.isActive).map((l) => (
                  <span key={l.id} className="px-2 py-0.5 text-xs rounded bg-card-raised text-secondary-foreground flex-shrink-0">Light</span>
                ))}
              </div>
              <ShotWorkspace project={project} characters={characters} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} resolvedSeed={resolvedSeed} generation={generation} onGenerate={handleGenerate} presets={presets} onSavePreset={handleSavePreset} />
            </main>

            <aside className="w-[340px] flex-shrink-0 border-l border-border max-[1399px]:hidden overflow-hidden">
              <ShotsVersionsPanel shots={shots} />
            </aside>

            <button onClick={() => setLeftDrawerOpen(true)} className="hidden max-[1099px]:flex absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center bg-panel border border-border border-l-0 rounded-r-md text-muted-foreground hover:text-foreground transition-colors z-30">›</button>
            <button onClick={() => setRightDrawerOpen(true)} className="hidden max-[1399px]:flex absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center bg-panel border border-border border-r-0 rounded-l-md text-muted-foreground hover:text-foreground transition-colors z-30">‹</button>

            {leftDrawerOpen && (
              <>
                <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setLeftDrawerOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-[300px] z-50 border-r border-border overflow-hidden"><ProjectStatePanel {...panelProps} /></div>
              </>
            )}
            {rightDrawerOpen && (
              <>
                <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setRightDrawerOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-[340px] z-50 border-l border-border overflow-hidden"><ShotsVersionsPanel shots={shots} /></div>
              </>
            )}
          </>
        ) : activeWorkspace === 'characters' ? (
          <CharacterWorkspace
            projectId={projectId}
            characters={characters}
            onUpdateCharacter={(updated) => setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))}
            onCreateCharacter={(created) => setCharacters((prev) => [...prev, created])}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Film className="w-12 h-12" />
            <div className="text-sm">Sequence workspace</div>
            <div className="text-xs">Available in a later build phase.</div>
          </div>
        )}
      </div>

      <BottomBar seed={resolvedSeed} seedLocked={project.seedLocked} seedScope={seedScope} onToggleSeedLock={handleToggleSeedLock} onRandomizeSeed={handleRandomizeSeed} cost="1 credit" />

      {editingLock && (
        <LockEditorDialog
          lockType={editingLock.type}
          lock={editingLock.lock}
          onClose={() => setEditingLock(null)}
          onUpdate={(data) => {
            handleUpdateLock(editingLock.type, editingLock.lock.id, data);
            setEditingLock((prev) => ({ ...prev, lock: { ...prev.lock, ...data } }));
          }}
        />
      )}

      <div className="hidden max-[799px]:flex fixed inset-0 z-[100] bg-background items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-base font-medium text-foreground mb-2">Larger screen required</h2>
          <p className="text-sm text-muted-foreground">Kaizora Remix Studio requires a screen at least 800px wide. Please use a larger display.</p>
        </div>
      </div>
    </div>
  );
}