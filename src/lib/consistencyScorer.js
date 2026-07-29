function seededVariance(seed, offset) {
  const x = Math.sin((seed || 0) + offset) * 10000;
  return (x - Math.floor(x)) * 10 - 5;
}

export function computeConsistencyScores({ character, styleLock, envLock, lightingLock, qualityTier, seed, energy, duration }) {
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
    if (envLock.depthMapUrl) structuralScore += 5;
  }
  structuralScore += seededVariance(seed, 3);

  let lightingScore = 42;
  if (lightingLock) {
    lightingScore = 58 + (lightingLock.lockStrength || 75) * 0.25;
    if (lightingLock.colorTemperature) lightingScore += 5;
    if (lightingLock.timeOfDay) lightingScore += 3;
  }
  lightingScore += seededVariance(seed, 4);

  // Temporal stability: higher with lower motion energy and shorter duration
  let temporalStability = 72;
  temporalStability -= (energy ?? 50) * 0.2;
  temporalStability -= Math.max(0, (duration ?? 5) - 3) * 2;
  temporalStability += seededVariance(seed, 5);

  const qualityBonus = qualityTier === 'Final' ? 5 : qualityTier === 'Standard' ? 2 : 0;

  const scores = {
    face: Math.max(0, Math.min(100, Math.round(faceScore + qualityBonus))),
    style: Math.max(0, Math.min(100, Math.round(styleScore + qualityBonus))),
    structural: Math.max(0, Math.min(100, Math.round(structuralScore + qualityBonus))),
    lighting: Math.max(0, Math.min(100, Math.round(lightingScore + qualityBonus))),
    temporalStability: Math.max(0, Math.min(100, Math.round(temporalStability + qualityBonus))),
  };
  scores.overall = Math.round((scores.face + scores.style + scores.structural + scores.lighting + scores.temporalStability) / 5);
  scores.worstFrames = { face: [Math.floor(Math.random() * (duration || 5) * 24)], style: [], structural: [] };
  return scores;
}

const THRESHOLD = 70;

export function getRemedies(scores, character, styleLock, envLock, lightingLock) {
  const remedies = [];

  if (scores.face < THRESHOLD) {
    if (!character) {
      remedies.push({ area: 'Character', message: 'No character lock active. Add a character to maintain face consistency across shots.' });
    } else if (character.tier === 'described') {
      remedies.push({ area: 'Character', message: `Identity drifted. Your character is Described tier. Upload reference images or train an adapter. [Train character]`, link: 'training' });
    } else if (character.tier === 'referenced') {
      remedies.push({ area: 'Character', message: `Identity drifted. Your character is Referenced tier. Training an adapter would likely fix this. [Train character]`, link: 'training' });
    } else {
      remedies.push({ area: 'Character', message: 'Increase character lock strength or add more reference angles to improve face hold.' });
    }
  }

  if (scores.style < THRESHOLD) {
    if (!styleLock) {
      remedies.push({ area: 'Style', message: 'No style lock active. Add one to keep visuals consistent across shots.' });
    } else if (!styleLock.referenceImageUrl) {
      remedies.push({ area: 'Style', message: 'Style diverged from your lock. Add a style reference image for stronger consistency.' });
    } else {
      remedies.push({ area: 'Style', message: 'Style diverged from your lock. Try raising style lock strength above 75.' });
    }
  }

  if (scores.structural < THRESHOLD) {
    if (!envLock) {
      remedies.push({ area: 'Structure', message: 'No environment lock active. Large camera moves may distort the background. [Define environment]', link: 'environment' });
    } else if (!envLock.referenceImages?.length) {
      remedies.push({ area: 'Structure', message: 'Add environment reference images for structural depth conditioning.' });
    } else {
      remedies.push({ area: 'Structure', message: 'Increase environment lock strength to hold the scene more firmly.' });
    }
  }

  if (scores.lighting < THRESHOLD) {
    if (!lightingLock) {
      remedies.push({ area: 'Lighting', message: 'No lighting lock active. Add one to keep light consistent across shots.' });
    } else {
      remedies.push({ area: 'Lighting', message: 'Lighting diverged from your lock. Increase lighting lock strength or verify color temperature.' });
    }
  }

  if (scores.temporalStability < THRESHOLD) {
    remedies.push({ area: 'Temporal', message: 'Identity flickers within this clip. Try a shorter duration or lower motion energy.' });
  }

  return remedies;
}