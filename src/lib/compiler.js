export const TOKEN_BUDGET = 1500;

const QUALITY_MODIFIERS = 'high quality, detailed, sharp focus, professional, cinematic';
const ARTIFACT_SUPPRESSION = 'blurry, distorted, deformed, disfigured, bad anatomy, extra limbs, missing limbs, duplicate, watermark, text artifacts, low quality, jpeg artifacts, mutated hands, fused fingers, too many fingers';

const DROP_PRIORITY = ['quality', 'style', 'environment'];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

export function compilePrompt(input) {
  const {
    shotType = '',
    character = null,
    wardrobe = null,
    intent = '',
    environment = null,
    lighting = null,
    style = null,
    seed = null,
    duration = 5,
    fps = 24,
    resolution = '1080p',
    aspectRatio = '16:9',
    characterConditioning = null,
    structuralConditioning = null,
    firstFrameRef = null,
    lastFrameRef = null,
    cameraParams = {},
    motionParams = {},
    guidanceScale = 7.5,
    lockStrengths = {},
    postProcessChain = [],
    references = [],
  } = input;

  const segments = [];

  if (shotType) segments.push({ key: 'shotType', text: shotType, source: 'Camera' });
  if (character) {
    const charText = character.tier === 'trained' && character.triggerToken ? character.triggerToken : character.identityStatement;
    if (charText) segments.push({ key: 'character', text: charText, source: 'Character Lock' });
  }
  if (wardrobe?.description) segments.push({ key: 'wardrobe', text: wardrobe.description, source: 'Wardrobe' });
  if (intent) segments.push({ key: 'intent', text: intent, source: 'Shot Description' });
  if (environment) {
    const envParts = [environment.description, environment.interiorExterior, environment.scale].filter(Boolean);
    if (envParts.length > 0) segments.push({ key: 'environment', text: envParts.join(', '), source: 'Environment Lock' });
  }
  if (lighting) {
    const lightParts = [lighting.mood, lighting.timeOfDay, `${lighting.keyDirection} key light`].filter(Boolean);
    if (lightParts.length > 0) segments.push({ key: 'lighting', text: lightParts.join(', '), source: 'Lighting Lock' });
  }
  if (style) {
    const styleParts = [style.colorGrade, style.filmStock, style.lens].filter(Boolean);
    if (styleParts.length > 0) segments.push({ key: 'style', text: styleParts.join(', '), source: 'Style Lock' });
  }
  segments.push({ key: 'quality', text: QUALITY_MODIFIERS, source: 'System' });

  let positivePrompt = segments.map((s) => s.text).join('. ');
  let tokenCount = estimateTokens(positivePrompt);

  const droppedSegments = [];
  while (tokenCount > TOKEN_BUDGET && droppedSegments.length < DROP_PRIORITY.length) {
    const dropKey = DROP_PRIORITY[droppedSegments.length];
    const seg = segments.find((s) => s.key === dropKey && !droppedSegments.includes(s));
    if (!seg) break;
    droppedSegments.push(seg);
    positivePrompt = segments.filter((s) => !droppedSegments.includes(s)).map((s) => s.text).join('. ');
    tokenCount = estimateTokens(positivePrompt);
  }

  const negativeParts = [ARTIFACT_SUPPRESSION];
  if (character?.negativePromptFragment) negativeParts.push(character.negativePromptFragment);
  const negativePrompt = negativeParts.filter(Boolean).join(', ');

  const conditioningChannels = [];
  if (characterConditioning) {
    if (characterConditioning.type === 'adapter') {
      conditioningChannels.push({ name: 'Character Adapter', type: 'LoRA', weight: lockStrengths.character ?? 75, source: character.triggerToken || 'trained' });
    } else if (characterConditioning.type === 'stack' && characterConditioning.stack?.length > 0) {
      characterConditioning.stack.forEach((img, i) => {
        conditioningChannels.push({ name: `Reference ${i + 1}`, type: 'IP-Adapter', weight: img.weight ?? 100, source: 'reference stack' });
      });
    }
  } else if (character) {
    conditioningChannels.push({ name: 'Character', type: character.tier === 'trained' ? 'LoRA' : character.tier === 'referenced' ? 'IP-Adapter' : 'Text', weight: lockStrengths.character ?? 75, source: character.tier });
  }
  if (structuralConditioning?.depthMapUrl) {
    conditioningChannels.push({ name: 'Depth Map', type: 'ControlNet', weight: lockStrengths.environment ?? 75, source: 'Environment Lock' });
  }

  // Reference assets heavily influence Style, Environment, and Lighting locks
  const referenceConditioning = { style: [], environment: [], lighting: [] };
  const refAssets = (references || []).filter((r) => r.type === 'image' || r.type === 'video');
  refAssets.forEach((ref, i) => {
    const sWeight = lockStrengths.style ?? 75;
    const eWeight = lockStrengths.environment ?? 75;
    const lWeight = lockStrengths.lighting ?? 75;
    conditioningChannels.push({ name: `Style Ref ${i + 1}`, type: 'IP-Adapter', weight: sWeight, source: 'reference asset → Style Lock', url: ref.url });
    conditioningChannels.push({ name: `Env Ref ${i + 1}`, type: 'IP-Adapter', weight: eWeight, source: 'reference asset → Environment Lock', url: ref.url });
    conditioningChannels.push({ name: `Light Ref ${i + 1}`, type: 'IP-Adapter', weight: lWeight, source: 'reference asset → Lighting Lock', url: ref.url });
    referenceConditioning.style.push({ url: ref.url, weight: sWeight });
    referenceConditioning.environment.push({ url: ref.url, weight: eWeight });
    referenceConditioning.lighting.push({ url: ref.url, weight: lWeight });
  });

  return {
    positivePrompt,
    negativePrompt,
    segments: segments.filter((s) => !droppedSegments.includes(s)),
    droppedSegments,
    tokenCount,
    tokenBudget: TOKEN_BUDGET,
    characterConditioning,
    structuralConditioning,
    firstFrameRef,
    lastFrameRef,
    cameraParams,
    motionParams,
    seed,
    duration,
    fps,
    resolution,
    aspectRatio,
    guidanceScale,
    conditioningChannels,
    postProcessChain,
    referenceConditioning,
  };
}