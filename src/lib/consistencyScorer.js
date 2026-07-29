function seededVariance(seed, offset) {
  const x = Math.sin((seed || 0) + offset) * 10000;
  return (x - Math.floor(x)) * 10 - 5;
}

export function computeConsistencyScores({ character, styleLock, envLock, lightingLock, qualityTier, seed }) {
  let faceScore = 42;
  if (character) {
    const baseScore = character.tier === 'trained' ? 88 : character.tier === 'referenced' ? 70 : 50;
    const sheetBonus = (character.sheetStrength || 0) * 0.12;
    const lockFactor = (character.lockStrength || 75) / 100;
    faceScore = baseScore + sheetBonus + (100 - baseScore - sheetBonus) * 0.2 * lockFactor;
  }
  faceScore += seededVariance(seed, 1);

  let styleScore = 42;
  if (styleLock) {
    styleScore = 58 + (styleLock.lockStrength || 75) * 0.25;
    if (styleLock.referenceImageUrl) styleScore += 8;
  }
  styleScore += seededVariance(seed, 2);

  let structuralScore = 42;
  if (envLock) {
    structuralScore = 54 + (envLock.lockStrength || 75) * 0.25;
    if (envLock.referenceImages?.length > 0) structuralScore += 10;
  }
  structuralScore += seededVariance(seed, 3);

  const qualityBonus = qualityTier === 'Final' ? 5 : qualityTier === 'Standard' ? 2 : 0;

  return {
    face: Math.max(0, Math.min(100, Math.round(faceScore + qualityBonus))),
    style: Math.max(0, Math.min(100, Math.round(styleScore + qualityBonus))),
    structural: Math.max(0, Math.min(100, Math.round(structuralScore + qualityBonus))),
  };
}

const THRESHOLD = 70;

export function getRemedies(scores, character, styleLock, envLock) {
  const remedies = [];

  if (scores.face < THRESHOLD) {
    if (!character) {
      remedies.push({ area: 'Face', message: 'No character lock active. Add a character to maintain face consistency across shots.' });
    } else if (character.tier === 'described') {
      remedies.push({ area: 'Face', message: 'Character is text-only (Described tier). Upload reference images or train a LoRA adapter to improve face hold.' });
    } else if (character.tier === 'referenced') {
      remedies.push({ area: 'Face', message: 'Character is referenced. Training a LoRA adapter will significantly improve face consistency.' });
    } else {
      remedies.push({ area: 'Face', message: 'Increase character lock strength or add more reference angles to improve face hold.' });
    }
  }

  if (scores.style < THRESHOLD) {
    if (!styleLock) {
      remedies.push({ area: 'Style', message: 'No style lock active. Add one to keep visuals consistent across shots.' });
    } else if (!styleLock.referenceImageUrl) {
      remedies.push({ area: 'Style', message: 'Add a style reference image for stronger visual consistency.' });
    } else {
      remedies.push({ area: 'Style', message: 'Increase style lock strength to hold the look more firmly.' });
    }
  }

  if (scores.structural < THRESHOLD) {
    if (!envLock) {
      remedies.push({ area: 'Structure', message: 'No environment lock active. Add one to prevent background warping on camera moves.' });
    } else if (!envLock.referenceImages?.length) {
      remedies.push({ area: 'Structure', message: 'Add environment reference images for structural depth conditioning.' });
    } else {
      remedies.push({ area: 'Structure', message: 'Increase environment lock strength to hold the scene more firmly.' });
    }
  }

  return remedies;
}