import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Plus } from 'lucide-react';
import { computeSheetData, composeIdentityStatement, composeNegativePrompt, ANGLE_SLOTS, DISTANCE_SLOTS, LIGHTING_SLOTS } from '@/lib/characterCompiler';
import { runQC } from '@/lib/imageQC';
import CharacterNav from './CharacterNav';
import CharacterCardPreview from './CharacterCardPreview';
import IdentitySection from './sections/IdentitySection';
import ReferenceSetSection from './sections/ReferenceSetSection';
import TrainingSection from './sections/TrainingSection';
import ExpressionsSection from './sections/ExpressionsSection';
import WardrobeSection from './sections/WardrobeSection';
import MotionIdentitySection from './sections/MotionIdentitySection';
import ContinuityRulesSection from './sections/ContinuityRulesSection';
import SheetHealthSection from './sections/SheetHealthSection';

export default function CharacterWorkspace({ projectId, characters, onUpdateCharacter, onCreateCharacter }) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeSection, setActiveSection] = useState('identity');
  const [features, setFeatures] = useState([]);
  const [references, setReferences] = useState([]);
  const [expressions, setExpressions] = useState([]);
  const [wardrobeStates, setWardrobeStates] = useState([]);
  const [motionProfile, setMotionProfile] = useState(null);
  const [continuityRules, setContinuityRules] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatingFeatureId, setGeneratingFeatureId] = useState(null);

  const selected = characters.find(c => c.id === selectedId);

  useEffect(() => { if (!selectedId && characters.length > 0) setSelectedId(characters[0].id); }, [characters, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    Promise.all([
      base44.entities.CharacterFeature.filter({ characterId: selectedId }),
      base44.entities.CharacterReference.filter({ characterId: selectedId }),
      base44.entities.CharacterExpression.filter({ characterId: selectedId }),
      base44.entities.WardrobeState.filter({ characterId: selectedId }),
      base44.entities.MotionProfile.filter({ characterId: selectedId }),
      base44.entities.ContinuityRule.filter({ characterId: selectedId }),
    ]).then(([feats, refs, exprs, wardrobe, motion, rules]) => {
      setFeatures(feats); setReferences(refs); setExpressions(exprs);
      setWardrobeStates(wardrobe); setMotionProfile(motion[0] || null); setContinuityRules(rules);
    }).catch(() => {});
  }, [selectedId]);

  const sheetData = useMemo(() => computeSheetData(selected, references, expressions, features, wardrobeStates, continuityRules), [selected, references, expressions, features, wardrobeStates, continuityRules]);

  useEffect(() => {
    if (!selected || sheetData.strength === selected.sheetStrength) return;
    base44.entities.Character.update(selected.id, { sheetStrength: sheetData.strength }).catch(() => {});
    onUpdateCharacter({ ...selected, sheetStrength: sheetData.strength });
  }, [sheetData.strength, selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const statement = composeIdentityStatement(selected, features);
    const negative = composeNegativePrompt(features);
    if (statement !== (selected.identityStatement || '') || negative !== (selected.negativePromptFragment || '')) {
      base44.entities.Character.update(selected.id, { identityStatement: statement, negativePromptFragment: negative }).catch(() => {});
      onUpdateCharacter({ ...selected, identityStatement: statement, negativePromptFragment: negative });
    }
  }, [features, selected?.name, selected?.ageRange, selected?.genderPresentation, selected?.height, selected?.build, selected?.skinToneDescription, selected?.hairColor, selected?.hairLength, selected?.hairTexture, selected?.hairStyle, selected?.eyeColor, selected?.eyeShape, selected?.facialStructure, selected?.id]);

  const updateCharacter = (data) => { onUpdateCharacter({ ...selected, ...data }); base44.entities.Character.update(selected.id, data).catch(() => {}); };
  const addFeature = async (type) => { const f = await base44.entities.CharacterFeature.create({ characterId: selectedId, description: '', type, isCritical: false }); setFeatures(p => [...p, f]); };
  const updateFeature = (id, data) => { base44.entities.CharacterFeature.update(id, data).catch(() => {}); setFeatures(p => p.map(f => f.id === id ? { ...f, ...data } : f)); };
  const deleteFeature = async (id) => { await base44.entities.CharacterFeature.delete(id); setFeatures(p => p.filter(f => f.id !== id)); };

  const uploadReference = async (slotGroup, slotName, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const existingHashes = references.filter(r => r.phash).map(r => ({ phash: r.phash, slotName: r.slotName, imageUrl: r.imageUrl }));
      const qc = await runQC(file_url, existingHashes);
      if (qc.isDuplicate) return { success: false, error: qc.messages[0] };
      const existing = references.find(r => r.slotGroup === slotGroup && r.slotName === slotName);
      if (existing) await base44.entities.CharacterReference.delete(existing.id);
      const ref = await base44.entities.CharacterReference.create({ characterId: selectedId, slotGroup, slotName, imageUrl: file_url, isGenerated: false, qcStatus: qc.status, qcMessages: qc.messages, phash: qc.phash, stackWeight: 100, includedInStack: false });
      setReferences(p => existing ? p.map(r => r.id === existing.id ? ref : r) : [...p, ref]);
      return { success: true };
    } catch (e) { return { success: false, error: 'Upload failed. Please try again.' }; }
  };
  const deleteReference = async (id) => { await base44.entities.CharacterReference.delete(id); setReferences(p => p.filter(r => r.id !== id)); };
  const updateReference = (id, data) => { base44.entities.CharacterReference.update(id, data).catch(() => {}); setReferences(p => p.map(r => r.id === id ? { ...r, ...data } : r)); };

  const generateMissing = async () => {
    if (!selected || references.filter(r => r.imageUrl).length < 2) return;
    setGenerating(true);
    const empty = ANGLE_SLOTS.filter(s => !references.some(r => r.slotGroup === 'angle' && r.slotName === s && r.imageUrl));
    for (const slot of empty) {
      try {
        const prompt = `${composeIdentityStatement(selected, features)} ${slot} view.`;
        const { url } = await base44.integrations.Core.GenerateImage({ prompt });
        const ref = await base44.entities.CharacterReference.create({ characterId: selectedId, slotGroup: 'angle', slotName: slot, imageUrl: url, isGenerated: true, qcStatus: 'pass', qcMessages: [], stackWeight: 100, includedInStack: false });
        setReferences(p => [...p, ref]);
      } catch (e) {}
    }
    setGenerating(false);
  };

  const generateFeatureVisual = async (featureId) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature || !feature.description) return;
    setGeneratingFeatureId(featureId);
    try {
      const prompt = `Extreme close-up detail reference: ${feature.description}. ${composeIdentityStatement(selected, features)} Sharp focus, studio lighting, high detail.`;
      const existingImages = references.filter(r => r.imageUrl).slice(0, 4).map(r => r.imageUrl);
      const { url } = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: existingImages.length > 0 ? existingImages : null });
      await base44.entities.CharacterFeature.update(featureId, { imageUrl: url });
      setFeatures(p => p.map(f => f.id === featureId ? { ...f, imageUrl: url } : f));
    } catch (e) {}
    setGeneratingFeatureId(null);
  };

  const generateFromSourceImage = async (sourceImageUrl) => {
    if (!selected || !sourceImageUrl) return;
    setGenerating(true);
    const identity = composeIdentityStatement(selected, features);
    const allSlots = [
      ...ANGLE_SLOTS.map(s => ({ group: 'angle', name: s })),
      ...DISTANCE_SLOTS.map(s => ({ group: 'distance', name: s })),
      ...LIGHTING_SLOTS.map(s => ({ group: 'lighting', name: s })),
    ];
    const empty = allSlots.filter(({ group, name }) => !references.some(r => r.slotGroup === group && r.slotName === name && r.imageUrl));
    for (const { group, name } of empty) {
      try {
        const prompt = `${identity} ${name} view. Professional studio reference photo, sharp focus.`;
        const { url } = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: [sourceImageUrl] });
        const ref = await base44.entities.CharacterReference.create({ characterId: selectedId, slotGroup: group, slotName: name, imageUrl: url, isGenerated: true, qcStatus: 'pass', qcMessages: [], stackWeight: 100, includedInStack: false });
        setReferences(p => [...p, ref]);
      } catch (e) {}
    }
    setGenerating(false);
  };

  const uploadExpression = async (name, file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = expressions.find(e => e.expressionName === name);
    if (existing) await base44.entities.CharacterExpression.delete(existing.id);
    const expr = await base44.entities.CharacterExpression.create({ characterId: selectedId, expressionName: name, imageUrl: file_url, isGenerated: false });
    setExpressions(p => existing ? p.map(e => e.id === existing.id ? expr : e) : [...p, expr]);
  };
  const deleteExpression = async (id) => { await base44.entities.CharacterExpression.delete(id); setExpressions(p => p.filter(e => e.id !== id)); };

  const addWardrobe = async () => { const w = await base44.entities.WardrobeState.create({ characterId: selectedId, name: 'New Outfit', description: '', isDefault: wardrobeStates.length === 0 }); setWardrobeStates(p => [...p, w]); };
  const updateWardrobe = (id, data) => { base44.entities.WardrobeState.update(id, data).catch(() => {}); setWardrobeStates(p => p.map(w => w.id === id ? { ...w, ...data } : w)); };
  const deleteWardrobe = async (id) => { await base44.entities.WardrobeState.delete(id); setWardrobeStates(p => p.filter(w => w.id !== id)); };

  const updateMotion = async (data) => {
    if (motionProfile) { base44.entities.MotionProfile.update(motionProfile.id, data).catch(() => {}); setMotionProfile(p => ({ ...p, ...data })); }
    else { const m = await base44.entities.MotionProfile.create({ characterId: selectedId, defaultEnergy: 50, defaultWeight: 50, defaultTension: 50, ...data }); setMotionProfile(m); }
  };

  const addRule = async (description, severity) => { const r = await base44.entities.ContinuityRule.create({ characterId: selectedId, description, severity }); setContinuityRules(p => [...p, r]); };
  const deleteRule = async (id) => { await base44.entities.ContinuityRule.delete(id); setContinuityRules(p => p.filter(r => r.id !== id)); };
  const seedFromCritical = async () => {
    const critical = features.filter(f => f.type === 'distinguishing' && f.isCritical && f.description);
    for (const f of critical) {
      if (continuityRules.some(r => r.description.includes(f.description))) continue;
      const r = await base44.entities.ContinuityRule.create({ characterId: selectedId, description: `${f.description} must stay consistent`, severity: 'Must Never Change' });
      setContinuityRules(p => [...p, r]);
    }
  };

  const createCharacter = async () => {
    const char = await base44.entities.Character.create({ projectId, name: 'New Character', tier: 'described', sheetStrength: 0, isActive: true, lockStrength: 75 });
    onCreateCharacter(char); setSelectedId(char.id); setActiveSection('identity');
  };

  if (characters.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <User className="w-12 h-12" />
        <div className="text-sm text-secondary-foreground">No characters yet</div>
        <div className="text-xs">Define your character once and it stays consistent across every shot.</div>
        <button onClick={createCharacter} className="mt-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Create Character</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <CharacterNav characters={characters} selectedCharacterId={selectedId} onSelectCharacter={setSelectedId} onCreateCharacter={createCharacter} activeSection={activeSection} onSelectSection={setActiveSection} sheetStrength={sheetData.strength} />
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        {activeSection === 'identity' && <IdentitySection character={selected} features={features} onUpdateCharacter={updateCharacter} onAddFeature={addFeature} onUpdateFeature={updateFeature} onDeleteFeature={deleteFeature} onGenerateFeatureVisual={generateFeatureVisual} generatingFeatureId={generatingFeatureId} />}
        {activeSection === 'reference' && selected && <ReferenceSetSection characterId={selectedId} references={references} onUpload={uploadReference} onDelete={deleteReference} onUpdateReference={updateReference} onGenerateMissing={generateMissing} onGenerateFromSource={generateFromSourceImage} generating={generating} />}
        {activeSection === 'training' && <TrainingSection character={selected} references={references} />}
        {activeSection === 'expressions' && <ExpressionsSection expressions={expressions} onUpload={uploadExpression} onDelete={deleteExpression} />}
        {activeSection === 'wardrobe' && <WardrobeSection wardrobeStates={wardrobeStates} onAdd={addWardrobe} onUpdate={updateWardrobe} onDelete={deleteWardrobe} />}
        {activeSection === 'motion' && <MotionIdentitySection motionProfile={motionProfile} onUpdate={updateMotion} />}
        {activeSection === 'continuity' && <ContinuityRulesSection continuityRules={continuityRules} criticalFeatures={features.filter(f => f.type === 'distinguishing' && f.isCritical)} onAdd={addRule} onSeedFromCritical={seedFromCritical} onDelete={deleteRule} />}
        {activeSection === 'health' && <SheetHealthSection sheetData={sheetData} onNavigate={setActiveSection} />}
      </div>
      <CharacterCardPreview character={selected} sheetData={sheetData} />
    </div>
  );
}