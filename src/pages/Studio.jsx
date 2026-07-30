import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Monitor, Film, LayoutGrid } from 'lucide-react';
import TopBar from '@/components/studio/TopBar';
import CharacterWorkspace from '@/components/characters/CharacterWorkspace';
import BottomBar from '@/components/studio/BottomBar';
import ProjectStatePanel from '@/components/studio/ProjectStatePanel';
import ShotWorkspace from '@/components/studio/ShotWorkspace';
import ShotsVersionsPanel from '@/components/studio/ShotsVersionsPanel';
import LockEditorDialog from '@/components/studio/LockEditorDialog';
import Timeline from '@/components/studio/Timeline';
import CreditDashboard from '@/components/studio/CreditDashboard';
import ProjectSettings from '@/components/studio/ProjectSettings';
import ShortcutsHelp from '@/components/studio/ShortcutsHelp';
import OnboardingHighlight from '@/components/studio/OnboardingHighlight';
import DirectorPanel from '@/components/studio/DirectorPanel';
import ProjectOverview from '@/components/studio/ProjectOverview';
import RenderFilmDialog from '@/components/studio/RenderFilmDialog';
import { runPipeline } from '@/lib/pipeline';
import { compilePrompt } from '@/lib/compiler';

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
  const generationStatusRef = useRef('idle');
  generationStatusRef.current = generation.status;
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState('studio');
  const [saving, setSaving] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [editingLock, setEditingLock] = useState(null);
  const [creditDashboardOpen, setCreditDashboardOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [activeSequenceId, setActiveSequenceId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [continuityFlags, setContinuityFlags] = useState([]);
  const [directorOpen, setDirectorOpen] = useState(true);
  const [showOverview, setShowOverview] = useState(false);
  const [filmDialogOpen, setFilmDialogOpen] = useState(false);
  const [references, setReferences] = useState(() => {
    try {
      const stored = localStorage.getItem(`kzr_refs_${projectId}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [externalPrompt, setExternalPrompt] = useState('');

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
      if (seqs.length > 0) setActiveSequenceId(seqs[0].id);
      setShots(existingShots);
      if (existingShots.length > 0) {
        const sorted = [...existingShots].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setSelectedShotId(sorted[0].id);
      }
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

  useEffect(() => {
    if (!selectedShotId) { setVersions([]); return; }
    base44.entities.ShotVersion.filter({ shotId: selectedShotId }).then((vers) => {
      setVersions(vers);
      if (generationStatusRef.current === 'running') return;
      const shot = shots.find((s) => s.id === selectedShotId);
      if (!shot || !vers || vers.length === 0) {
        setGeneration({ status: 'idle', stages: {}, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
        return;
      }
      const latest = shot.currentVersionId
        ? vers.find((v) => v.id === shot.currentVersionId)
        : [...vers].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      if (latest && (latest.videoUrl || (latest.clipUrls && latest.clipUrls.length > 0))) {
        setGeneration({ status: 'complete', stages: {}, job: null, version: latest, previousVersion: null, scores: null, remedies: null, error: null });
      } else {
        setGeneration({ status: 'idle', stages: {}, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
      }
    }).catch(() => {});
  }, [selectedShotId]);

  useEffect(() => {
    if (!activeSequenceId) { setContinuityFlags([]); return; }
    base44.entities.ContinuityFlag.filter({ sequenceId: activeSequenceId }).then(setContinuityFlags).catch(() => {});
  }, [activeSequenceId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport();
        return;
      }

      if (e.key === '?') {
        setShortcutsHelpOpen(true);
        return;
      }

      if (e.key === 'Escape' && shortcutsHelpOpen) {
        setShortcutsHelpOpen(false);
        return;
      }

      const sortedShots = [...shots].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      const currentIndex = sortedShots.findIndex((s) => s.id === selectedShotId);

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentIndex > 0) setSelectedShotId(sortedShots[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentIndex >= 0 && currentIndex < sortedShots.length - 1) setSelectedShotId(sortedShots[currentIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shots, selectedShotId, versions, shortcutsHelpOpen]);

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

  const handleGenerate = async (payload, qualityTier, camera, motion, timing) => {
    const seed = payload.seed ?? resolvedSeed ?? Math.floor(Math.random() * 1000000);
    const finalPayload = { ...payload, seed };
    setGeneration({ status: 'running', stages: { resolve: 'queued', precondition: 'queued', generate: 'queued', postprocess: 'queued', measure: 'queued', finalize: 'queued' }, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
    try {
      let seq = sequences.find((s) => s.id === activeSequenceId) || sequences[0];
      if (!seq) {
        seq = await base44.entities.Sequence.create({ projectId, name: 'Main Sequence', orderIndex: 0 });
        setSequences([seq]);
        setActiveSequenceId(seq.id);
      }
      const { cameraPath, ...cameraRest } = camera;
      const { shotSeed: _ts, seedLocked: _sl, ...timingRest } = timing;
      const shot = await base44.entities.Shot.create({ sequenceId: seq.id, projectId, name: `Shot ${shots.length + 1}`, intentText: externalPrompt, orderIndex: shots.length, status: 'generating', qualityTier, shotSeed: seed, seedLocked: project.seedLocked, referenceAssets: payload.references || [], generationMode: payload.generationMode, selectedModel: payload.selectedModel, ...cameraRest, cameraPath: cameraPath && cameraPath.length > 0 ? cameraPath : null, ...motion, ...timingRest });
      setShots((prev) => [...prev, shot]);
      setSelectedShotId(shot.id);
      const activeCharacter = characters.find((c) => c.isActive);
      const activeStyle = styleLocks.find((l) => l.isActive);
      const activeEnv = envLocks.find((l) => l.isActive);
      const activeLight = lightingLocks.find((l) => l.isActive);
      const result = await runPipeline({ projectId, shotId: shot.id, payload: finalPayload, qualityTier, character: activeCharacter, styleLock: activeStyle, envLock: activeEnv, lightingLock: activeLight, postProcess: payload.postProcessChain, onStageUpdate: (stageId, status) => setGeneration((prev) => ({ ...prev, stages: { ...prev.stages, [stageId]: status } })), onCreditUpdate: (newBalance) => setProject((prev) => ({ ...prev, creditBalance: newBalance })) });
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

  const handleSelectShot = (shotId) => setSelectedShotId(shotId);

  const handleRegenerate = async (payload, qualityTier, camera, motion, timing, surgical) => {
    if (!selectedShotId) return;
    const seed = payload.seed ?? resolvedSeed ?? Math.floor(Math.random() * 1000000);
    const finalPayload = { ...payload, seed };
    setGeneration({ status: 'running', stages: { resolve: 'queued', precondition: 'queued', generate: 'queued', postprocess: 'queued', measure: 'queued', finalize: 'queued' }, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
    try {
      const { cameraPath, ...cameraRest } = camera;
      const { shotSeed: _ts, seedLocked: _sl, ...timingRest } = timing;
      const shotUpdateData = { ...cameraRest, cameraPath: cameraPath && cameraPath.length > 0 ? cameraPath : null, ...motion, ...timingRest, status: 'generating', qualityTier, shotSeed: seed, referenceAssets: payload.references || [], generationMode: payload.generationMode, selectedModel: payload.selectedModel };
      await base44.entities.Shot.update(selectedShotId, shotUpdateData);
      setShots((prev) => prev.map((s) => (s.id === selectedShotId ? { ...s, ...shotUpdateData } : s)));
      const activeCharacter = characters.find((c) => c.isActive);
      const activeStyle = styleLocks.find((l) => l.isActive);
      const activeEnv = envLocks.find((l) => l.isActive);
      const activeLight = lightingLocks.find((l) => l.isActive);
      const result = await runPipeline({ projectId, shotId: selectedShotId, payload: finalPayload, qualityTier, character: activeCharacter, styleLock: activeStyle, envLock: activeEnv, lightingLock: activeLight, postProcess: payload.postProcessChain, onStageUpdate: (stageId, status) => setGeneration((prev) => ({ ...prev, stages: { ...prev.stages, [stageId]: status } })), onCreditUpdate: (newBalance) => setProject((prev) => ({ ...prev, creditBalance: newBalance })) });
      await base44.entities.Shot.update(selectedShotId, { status: 'complete', currentVersionId: result.version.id });
      if (surgical) {
        await base44.entities.ShotVersion.update(result.version.id, { isPartialRegeneration: true, regeneratedRegion: surgical.region, regeneratedTimeRange: surgical.timeRange });
      }
      setShots((prev) => prev.map((s) => (s.id === selectedShotId ? { ...s, status: 'complete', currentVersionId: result.version.id } : s)));
      base44.entities.ShotVersion.filter({ shotId: selectedShotId }).then(setVersions).catch(() => {});
      setGeneration((prev) => ({ ...prev, status: 'complete', job: result.job, version: result.version, scores: result.scores, remedies: result.remedies, previousVersion: prev.version }));
    } catch (error) {
      setGeneration((prev) => ({ ...prev, status: 'failed', error: error.message }));
    }
  };

  const handleUpdateSettings = async (data) => {
    await updateProject(data);
  };

  const handleExport = () => {
    const shot = shots.find((s) => s.id === selectedShotId);
    if (!shot) return;
    const shotVersions = versions.filter((v) => v.shotId === shot.id);
    const version = shotVersions.find((v) => v.isAccepted) || shotVersions.find((v) => v.id === shot.currentVersionId) || shotVersions[shotVersions.length - 1];
    if (!version || !version.videoUrl) return;
    setExporting(true);
    const a = document.createElement('a');
    a.href = version.videoUrl;
    a.download = `${(shot.name || 'shot').replace(/\s+/g, '_')}_v${version.versionNumber}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setExporting(false), 1500);
  };

  const handleUpdateBudget = async (budget) => {
    await base44.entities.Project.update(projectId, { budgetCredits: budget });
    setProject((prev) => ({ ...prev, budgetCredits: budget }));
  };

  const handleDeleteShot = async (shotId) => {
    await base44.entities.Shot.delete(shotId);
    setShots((prev) => prev.filter((s) => s.id !== shotId));
    if (selectedShotId === shotId) setSelectedShotId(null);
  };

  const handleAcceptVersion = async (versionId, shotId) => {
    const shotVersions = versions.filter((v) => v.shotId === shotId);
    await Promise.all(shotVersions.filter((v) => v.isAccepted && v.id !== versionId).map((v) => base44.entities.ShotVersion.update(v.id, { isAccepted: false })));
    await base44.entities.ShotVersion.update(versionId, { isAccepted: true });
    await base44.entities.Shot.update(shotId, { currentVersionId: versionId });
    base44.entities.ShotVersion.filter({ shotId }).then(setVersions).catch(() => {});
    setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, currentVersionId: versionId } : s)));
  };

  const handleRenameShot = async (shotId, name) => {
    await base44.entities.Shot.update(shotId, { name });
    setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, name } : s)));
  };

  const handleDeleteVersion = async (versionId) => {
    await base44.entities.ShotVersion.delete(versionId);
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  };

  const handleAddShot = async () => {
    const seq = sequences.find((s) => s.id === activeSequenceId) || sequences[0];
    if (!seq) return;
    const shot = await base44.entities.Shot.create({
      sequenceId: seq.id,
      projectId,
      name: `Shot ${shots.length + 1}`,
      orderIndex: shots.length,
      status: 'draft',
    });
    setShots((prev) => [...prev, shot]);
    setSelectedShotId(shot.id);
  };

  const handleDuplicateShot = async (shotId) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot) return;
    const { id, created_date, updated_date, created_by_id, currentVersionId, status, orderIndex, name, ...rest } = shot;
    const dup = await base44.entities.Shot.create({
      ...rest,
      name: `${name} (copy)`,
      orderIndex: shots.length,
      status: 'draft',
    });
    setShots((prev) => [...prev, dup]);
    setSelectedShotId(dup.id);
  };

  const handleToggleFavorite = async (versionId, currentFavorite) => {
    await base44.entities.ShotVersion.update(versionId, { isFavorite: !currentFavorite });
    setVersions((prev) => prev.map((v) => (v.id === versionId ? { ...v, isFavorite: !currentFavorite } : v)));
  };
  const handleCreateSequence = async () => {
    const seq = await base44.entities.Sequence.create({ projectId, name: `Sequence ${sequences.length + 1}`, orderIndex: sequences.length });
    setSequences((prev) => [...prev, seq]);
    setActiveSequenceId(seq.id);
  };

  const handleRenameSequence = async (seqId, name) => {
    await base44.entities.Sequence.update(seqId, { name });
    setSequences((prev) => prev.map((s) => (s.id === seqId ? { ...s, name } : s)));
  };

  const handleDeleteSequence = async (seqId) => {
    const seqShots = shots.filter((s) => s.sequenceId === seqId);
    if (seqShots.length > 0) return;
    await base44.entities.Sequence.delete(seqId);
    const remaining = sequences.filter((s) => s.id !== seqId);
    setSequences(remaining);
    if (activeSequenceId === seqId) setActiveSequenceId(remaining[0]?.id || null);
  };

  const handleSelectSequence = (seqId) => setActiveSequenceId(seqId);

  const handleToggleSeqSeedLock = async (seqId) => {
    const seq = sequences.find((s) => s.id === seqId);
    if (!seq) return;
    if (seq.seedLocked) {
      await base44.entities.Sequence.update(seqId, { seedLocked: false });
      setSequences((prev) => prev.map((s) => (s.id === seqId ? { ...s, seedLocked: false } : s)));
    } else {
      const seed = seq.sequenceSeed ?? Math.floor(Math.random() * 1000000);
      await base44.entities.Sequence.update(seqId, { seedLocked: true, sequenceSeed: seed });
      setSequences((prev) => prev.map((s) => (s.id === seqId ? { ...s, seedLocked: true, sequenceSeed: seed } : s)));
    }
  };

  const handleRandomizeSeqSeed = async (seqId) => {
    const seq = sequences.find((s) => s.id === seqId);
    if (!seq || seq.seedLocked) return;
    const seed = Math.floor(Math.random() * 1000000);
    await base44.entities.Sequence.update(seqId, { sequenceSeed: seed });
    setSequences((prev) => prev.map((s) => (s.id === seqId ? { ...s, sequenceSeed: seed } : s)));
  };

  const handleReorderShots = async (reordered) => {
    setShots((prev) => prev.map((s) => {
      const updated = reordered.find((r) => r.id === s.id);
      return updated ? { ...s, orderIndex: updated.orderIndex } : s;
    }));
    await Promise.all(reordered.map((s) => base44.entities.Shot.update(s.id, { orderIndex: s.orderIndex })));
  };
  const handleCreateShotsFromAI = async (shotSuggestions) => {
    const seq = sequences.find((s) => s.id === activeSequenceId) || sequences[0];
    if (!seq) return;
    const startOrder = shots.length;
    const newShots = await Promise.all(
      shotSuggestions.map((s, i) => base44.entities.Shot.create({
        sequenceId: seq.id, projectId, name: s.name, intentText: s.intentText,
        shotType: s.shotType, cameraMove: s.cameraMove, duration: s.duration || 5,
        orderIndex: startOrder + i, status: 'draft', referenceAssets: references,
      }))
    );
    setShots((prev) => [...prev, ...newShots]);
    if (!selectedShotId && newShots.length > 0) setSelectedShotId(newShots[0].id);
  };

  const handleQuickBuild = async (shotSuggestions) => {
    let seq = sequences.find((s) => s.id === activeSequenceId) || sequences[0];
    if (!seq) {
      seq = await base44.entities.Sequence.create({ projectId, name: 'Quick Build', orderIndex: 0 });
      setSequences([seq]);
      setActiveSequenceId(seq.id);
    }
    const startOrder = shots.length;
    const newShots = [];
    for (let i = 0; i < shotSuggestions.length; i++) {
      const s = shotSuggestions[i];
      const shot = await base44.entities.Shot.create({
        sequenceId: seq.id, projectId, name: s.name, intentText: s.intentText,
        shotType: s.shotType, cameraMove: s.cameraMove, duration: s.duration || 6,
        orderIndex: startOrder + i, status: 'generating', referenceAssets: references,
        generationMode: references.length > 0 ? 'image2video' : 'text2video',
      });
      newShots.push(shot);
    }
    setShots((prev) => [...prev, ...newShots]);
    if (newShots.length > 0) setSelectedShotId(newShots[0].id);

    for (const shot of newShots) {
      setSelectedShotId(shot.id);
      const seed = resolvedSeed ?? Math.floor(Math.random() * 1000000);
      const payload = compilePrompt({
        intent: shot.intentText || '', shotType: `${shot.shotType || 'Medium'} shot, ${shot.cameraMove || 'Static'} move`,
        cameraParams: { shotType: shot.shotType, cameraMove: shot.cameraMove }, motionParams: {},
        character: null, style: null, environment: null, lighting: null,
        seed, aspectRatio: project?.aspectRatio || '16:9', lockStrengths: {}, references,
      });
      setGeneration({ status: 'running', stages: { resolve: 'queued', precondition: 'queued', generate: 'queued', postprocess: 'queued', measure: 'queued', finalize: 'queued' }, job: null, version: null, previousVersion: null, scores: null, remedies: null, error: null });
      try {
        const result = await runPipeline({
          projectId, shotId: shot.id, payload: { ...payload, seed, duration: shot.duration }, qualityTier: 'Draft',
          character: null, styleLock: null, envLock: null, lightingLock: null,
          postProcess: { faceRestoration: { enabled: false }, upscale: { enabled: false }, colorGrade: { enabled: false } },
          onStageUpdate: (stageId, status) => setGeneration((prev) => ({ ...prev, stages: { ...prev.stages, [stageId]: status } })),
          onCreditUpdate: (newBalance) => setProject((prev) => ({ ...prev, creditBalance: newBalance })),
        });
        await base44.entities.Shot.update(shot.id, { status: 'complete', currentVersionId: result.version.id });
        setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, status: 'complete', currentVersionId: result.version.id } : s)));
        setGeneration((prev) => ({ ...prev, status: 'complete', version: result.version, scores: result.scores, remedies: result.remedies }));
      } catch (error) {
        await base44.entities.Shot.update(shot.id, { status: 'failed' });
        setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, status: 'failed' } : s)));
        setGeneration((prev) => ({ ...prev, status: 'failed', error: error.message }));
      }
    }
  };

  const handleAutoBuild = async (plan) => {
    setSaving(true);
    try {
      if (plan.styleLock) {
        await base44.entities.StyleLock.create({ projectId, name: plan.styleLock.name || 'Auto Style', colorGrade: plan.styleLock.colorGrade || 'Natural', filmStock: plan.styleLock.filmStock || 'Digital Clean', lens: plan.styleLock.lens || 'Standard 35mm', isActive: true, lockStrength: 75 });
      }
      if (plan.environmentLock) {
        await base44.entities.EnvironmentLock.create({ projectId, name: plan.environmentLock.name || 'Auto Environment', description: plan.environmentLock.description || '', interiorExterior: plan.environmentLock.interiorExterior || 'interior', scale: plan.environmentLock.scale || 'Room', isActive: true, lockStrength: 75 });
      }
      if (plan.lightingLock) {
        await base44.entities.LightingLock.create({ projectId, name: plan.lightingLock.name || 'Auto Lighting', mood: plan.lightingLock.mood || 'Natural', timeOfDay: plan.lightingLock.timeOfDay || 'Day', keyDirection: plan.lightingLock.keyDirection || 'N', keyIntensity: 75, fillRatio: 40, colorTemperature: 5600, isActive: true, lockStrength: 75 });
      }
      for (const char of plan.characters || []) {
        await base44.entities.Character.create({ projectId, name: char.name || 'Unnamed', role: ['Lead', 'Supporting', 'Background', 'Narrator'].includes(char.role) ? char.role : 'Supporting', identityStatement: char.identityStatement || '', ageRange: char.ageRange, genderPresentation: char.genderPresentation, height: char.height, build: char.build, skinTone: char.skinTone, hairColor: char.hairColor, hairLength: char.hairLength, eyeColor: char.eyeColor, tier: 'described', sheetStrength: 0, isActive: true, lockStrength: 75 });
      }
      let shotOrder = shots.length;
      for (let si = 0; si < (plan.sequences || []).length; si++) {
        const seq = plan.sequences[si];
        const newSeq = await base44.entities.Sequence.create({ projectId, name: seq.name || `Sequence ${sequences.length + si + 1}`, orderIndex: sequences.length + si });
        await Promise.all((seq.shots || []).map((s, i) => base44.entities.Shot.create({
          sequenceId: newSeq.id, projectId, name: s.name || `Shot ${shotOrder + i + 1}`, intentText: s.intentText || '', shotType: s.shotType, cameraMove: s.cameraMove, duration: s.duration || 5, orderIndex: shotOrder + i, status: 'draft', referenceAssets: references,
        })));
        shotOrder += (seq.shots || []).length;
      }
      await loadData();
      setShowOverview(true);
      setDirectorOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenShot = (shotId) => {
    setSelectedShotId(shotId);
    setShowOverview(false);
  };

  const handleApplyIntent = async (intentText) => {
    if (!selectedShotId) return;
    await base44.entities.Shot.update(selectedShotId, { intentText });
    setShots((prev) => prev.map((s) => (s.id === selectedShotId ? { ...s, intentText } : s)));
    setExternalPrompt(intentText);
  };

  const selectedShot = shots.find((s) => s.id === selectedShotId) || null;

  useEffect(() => {
    if (!selectedShot) return;
    setReferences((prev) => {
      const shotRefs = selectedShot.referenceAssets || [];
      const existingUrls = new Set(prev.map((r) => r.url));
      const newRefs = shotRefs.filter((r) => !existingUrls.has(r.url));
      return newRefs.length > 0 ? [...prev, ...newRefs] : prev;
    });
    setExternalPrompt(selectedShot.intentText || '');
  }, [selectedShot?.id]);

  useEffect(() => {
    localStorage.setItem(`kzr_refs_${projectId}`, JSON.stringify(references));
  }, [references, projectId]);

  // Receive external prompt + reference asset sent from another page via URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get('prompt');
    const refUrl = urlParams.get('refUrl');
    const refName = urlParams.get('refName');
    const refType = urlParams.get('refType') || 'image';
    if (refUrl) {
      setReferences((prev) => prev.some((r) => r.url === refUrl) ? prev : [...prev, { type: refType, url: refUrl, name: refName || 'External reference' }]);
    }
    if (prompt) setExternalPrompt(prompt);
  }, []);

  const STAGE_NAMES = { resolve: 'Resolving settings', precondition: 'Preparing conditioning', generate: 'Generating', postprocess: 'Restoring faces', measure: 'Measuring consistency', finalize: 'Finalizing' };
  const activeStageId = generation.status === 'running' ? Object.entries(generation.stages).find(([, s]) => s === 'processing')?.[0] : null;
  const generatingStage = activeStageId ? STAGE_NAMES[activeStageId] : null;

  const onboardingStep = shots.length === 0 ? (characters.length === 0 ? 'character_needed' : 'intent_needed') : null;

  const panelProps = { characters, styleLocks, envLocks, lightingLocks, references, onReferencesChange: setReferences, externalPrompt, onExternalPromptChange: setExternalPrompt, onAddCharacter: handleAddCharacter, onAddStyleLock: addStyleLock, onAddEnvLock: addEnvLock, onAddLightingLock: addLightingLock, onEditLock: handleEditLock, onToggleLockActive: handleToggleLockActive };

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
      <TopBar project={project} onRename={handleRename} activeWorkspace={activeWorkspace} onWorkspaceChange={handleWorkspaceChange} saving={saving} onOpenCredits={() => setCreditDashboardOpen(true)} onExport={handleExport} canExport={versions.length > 0} exporting={exporting} onOpenSettings={() => setProjectSettingsOpen(true)} onOpenHelp={() => setShortcutsHelpOpen(true)} directorOpen={directorOpen} onToggleDirector={() => setDirectorOpen(!directorOpen)} onRenderFilm={() => setFilmDialogOpen(true)} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} onAddStyleLock={addStyleLock} onAddEnvLock={addEnvLock} onAddLightingLock={addLightingLock} onEditLock={handleEditLock} onToggleLockActive={handleToggleLockActive} />

      <div className="flex-1 flex overflow-hidden relative">
        {activeWorkspace === 'studio' ? (
          <>
            <aside className="w-[240px] flex-shrink-0 border-r border-border max-[1099px]:hidden overflow-hidden">
              <ProjectStatePanel {...panelProps} />
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-panel flex-shrink-0">
                <span className="text-xs text-muted-foreground">{showOverview ? 'Project Overview' : (selectedShot?.name || 'Shot Editor')}</span>
                {shots.length > 0 && (
                  <button onClick={() => setShowOverview(!showOverview)} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                    {showOverview ? <><Film className="w-3 h-3" /> Shot Editor</> : <><LayoutGrid className="w-3 h-3" /> Overview</>}
                  </button>
                )}
              </div>
              {showOverview ? (
                <ProjectOverview project={project} characters={characters} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} sequences={sequences} shots={shots} references={references} onSelectShot={handleOpenShot} />
              ) : (
                <>
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
                  <ShotWorkspace project={project} characters={characters} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} resolvedSeed={resolvedSeed} generation={generation} onGenerate={handleGenerate} onRegenerate={handleRegenerate} presets={presets} onSavePreset={handleSavePreset} selectedShot={selectedShot} onExport={handleExport} shots={shots} references={references} directorOpen={directorOpen} externalPrompt={externalPrompt} onExternalPromptChange={setExternalPrompt} />
                </>
              )}
            </main>

            <aside className={`flex-shrink-0 border-l border-border overflow-hidden ${directorOpen ? 'w-[440px]' : 'w-[340px] max-[1399px]:hidden'}`}>
              {directorOpen ? (
                <DirectorPanel project={project} characters={characters} shots={shots} sequences={sequences} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} selectedShot={selectedShot} references={references} onCreateShots={handleCreateShotsFromAI} onApplyIntent={handleApplyIntent} onAutoBuild={handleAutoBuild} onQuickBuild={handleQuickBuild} onClose={() => setDirectorOpen(false)} />
              ) : (
                <ShotsVersionsPanel shots={shots} references={references} onSelectShot={handleSelectShot} selectedShotId={selectedShotId} versions={versions} onToggleFavorite={handleToggleFavorite} onDeleteShot={handleDeleteShot} onAcceptVersion={handleAcceptVersion} onRenameShot={handleRenameShot} onDeleteVersion={handleDeleteVersion} onAddShot={handleAddShot} onDuplicateShot={handleDuplicateShot} onOpenDirector={() => setDirectorOpen(true)} />
                            )}
            </aside>

            <button onClick={() => setLeftDrawerOpen(true)} className="hidden max-[1099px]:flex absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center bg-panel border border-border border-l-0 rounded-r-md text-muted-foreground hover:text-foreground transition-colors z-30">›</button>
            {!directorOpen && <button onClick={() => setRightDrawerOpen(true)} className="hidden max-[1399px]:flex absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center bg-panel border border-border border-r-0 rounded-l-md text-muted-foreground hover:text-foreground transition-colors z-30">‹</button>}

            {leftDrawerOpen && (
              <>
                <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setLeftDrawerOpen(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-[240px] z-50 border-r border-border overflow-hidden"><ProjectStatePanel {...panelProps} /></div>
              </>
            )}
            {rightDrawerOpen && (
              <>
                <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setRightDrawerOpen(false)} />
                <div className={`absolute right-0 top-0 bottom-0 z-50 border-l border-border overflow-hidden ${directorOpen ? 'w-[440px]' : 'w-[340px]'}`}>{directorOpen ? <DirectorPanel project={project} characters={characters} shots={shots} sequences={sequences} styleLocks={styleLocks} envLocks={envLocks} lightingLocks={lightingLocks} selectedShot={selectedShot} references={references} onCreateShots={handleCreateShotsFromAI} onApplyIntent={handleApplyIntent} onAutoBuild={handleAutoBuild} onQuickBuild={handleQuickBuild} onClose={() => { setDirectorOpen(false); setRightDrawerOpen(false); }} /> : <ShotsVersionsPanel shots={shots} references={references} onSelectShot={handleSelectShot} selectedShotId={selectedShotId} versions={versions} onToggleFavorite={handleToggleFavorite} onDeleteShot={handleDeleteShot} onAcceptVersion={handleAcceptVersion} onRenameShot={handleRenameShot} onDeleteVersion={handleDeleteVersion} onAddShot={handleAddShot} onDuplicateShot={handleDuplicateShot} onOpenDirector={() => setDirectorOpen(true)} />}</div>
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
          <Timeline shots={shots} sequences={sequences} activeSequenceId={activeSequenceId} onSelectSequence={handleSelectSequence} onCreateSequence={handleCreateSequence} onRenameSequence={handleRenameSequence} onDeleteSequence={handleDeleteSequence} onReorder={handleReorderShots} onSelectShot={handleSelectShot} selectedShotId={selectedShotId} onToggleSeqSeedLock={handleToggleSeqSeedLock} onRandomizeSeqSeed={handleRandomizeSeqSeed} continuityFlags={continuityFlags} />
        )}
      </div>

      <BottomBar seed={resolvedSeed} seedLocked={project.seedLocked} seedScope={seedScope} onToggleSeedLock={handleToggleSeedLock} onRandomizeSeed={handleRandomizeSeed} cost="1 credit" generatingStage={generatingStage} />

      {projectSettingsOpen && (
        <ProjectSettings project={project} onClose={() => setProjectSettingsOpen(false)} onUpdate={handleUpdateSettings} />
      )}

      {shortcutsHelpOpen && (
        <ShortcutsHelp onClose={() => setShortcutsHelpOpen(false)} project={project} />
      )}

      <OnboardingHighlight step={onboardingStep} />

      {creditDashboardOpen && (
        <CreditDashboard projectId={projectId} project={project} onClose={() => setCreditDashboardOpen(false)} onUpdateBudget={handleUpdateBudget} />
      )}

      {filmDialogOpen && (
        <RenderFilmDialog project={project} shots={shots} onClose={() => setFilmDialogOpen(false)} />
      )}

      {editingLock && (
        <LockEditorDialog
          lockType={editingLock.type}
          lock={editingLock.lock}
          references={references}
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