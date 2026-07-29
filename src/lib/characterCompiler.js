export const ANGLE_SLOTS = ['Front', 'Front 3/4 Left', 'Profile Left', 'Rear 3/4 Left', 'Rear', 'Rear 3/4 Right', 'Profile Right', 'Front 3/4 Right'];
export const DISTANCE_SLOTS = ['Extreme Close Up', 'Close Up', 'Medium', 'Wide'];
export const LIGHTING_SLOTS = ['Soft Key', 'Hard Key', 'Backlit', 'Side Lit', 'Low Light', 'Mixed Color'];
export const CORE_EXPRESSIONS = ['Neutral', 'Happy', 'Sad', 'Angry', 'Surprised', 'Fearful', 'Disgusted', 'Contemptuous'];
export const EXTENDED_EXPRESSIONS = ['Contemplative', 'Determined', 'Exhausted', 'Amused', 'Skeptical', 'Relieved', 'Anxious', 'Confident'];

export const TIER_LABELS = {
  described: 'Will drift between shots',
  referenced: 'Mostly consistent, may drift in wide shots and unusual angles',
  trained: 'Holds across angles, distance, and lighting',
};

const IDENTITY_FIELDS = ['name', 'ageRange', 'genderPresentation', 'height', 'build', 'skinToneDescription', 'hairColor', 'eyeColor', 'facialStructure'];

export function composeIdentityStatement(char, features) {
  if (!char) return '';
  const parts = [];
  if (char.ageRange) parts.push(`${char.ageRange}-year-old`);
  if (char.genderPresentation) parts.push(char.genderPresentation);
  if (char.height || char.build) {
    const physique = [char.height, char.build].filter(Boolean).join(', ');
    parts.push(`with a ${physique} build`);
  }
  if (char.skinToneDescription) parts.push(`${char.skinToneDescription} skin`);
  const hair = [char.hairColor, char.hairLength, char.hairTexture, char.hairStyle].filter(Boolean).join(' ');
  if (hair) parts.push(`${hair} hair`);
  const eyes = [char.eyeColor, char.eyeShape].filter(Boolean).join(' ');
  if (eyes) parts.push(`${eyes} eyes`);
  if (char.facialStructure) parts.push(`${char.facialStructure} facial structure`);
  const distinguishing = (features || []).filter(f => f.type === 'distinguishing' && f.description);
  if (distinguishing.length > 0) parts.push(`distinguishable by ${distinguishing.map(f => f.description).join(' and ')}`);
  if (parts.length === 0) return '';
  return `${char.name || 'This character'} is ${parts.join(', ')}.`;
}

export function composeNegativePrompt(features) {
  return (features || [])
    .filter(f => f.type === 'neverInclude' && f.description)
    .map(f => f.description)
    .join(', ');
}

export function computeSheetData(char, references, expressions, features, wardrobeStates, continuityRules) {
  const breakdown = [];
  let strength = 0;

  const hasTrainedAdapter = char?.tier === 'trained' && char?.activeAdapterId;
  const trainedScore = hasTrainedAdapter ? 35 : 0;
  strength += trainedScore;
  breakdown.push({ label: 'Trained adapter', weight: 35, score: trainedScore });

  const angleFilled = ANGLE_SLOTS.filter(s => references?.some(r => r.slotGroup === 'angle' && r.slotName === s && r.imageUrl)).length;
  const angleScore = Math.round((angleFilled / 8) * 20);
  strength += angleScore;
  breakdown.push({ label: 'Angle coverage', weight: 20, score: angleScore, filled: angleFilled, total: 8 });

  const distFilled = DISTANCE_SLOTS.filter(s => references?.some(r => r.slotGroup === 'distance' && r.slotName === s && r.imageUrl)).length;
  const distScore = Math.round((distFilled / 4) * 15);
  strength += distScore;
  breakdown.push({ label: 'Distance coverage', weight: 15, score: distScore, filled: distFilled, total: 4 });

  const lightFilled = LIGHTING_SLOTS.filter(s => references?.some(r => r.slotGroup === 'lighting' && r.slotName === s && r.imageUrl)).length;
  const lightScore = Math.round((lightFilled / 6) * 10);
  strength += lightScore;
  breakdown.push({ label: 'Lighting coverage', weight: 10, score: lightScore, filled: lightFilled, total: 6 });

  const exprFilled = CORE_EXPRESSIONS.filter(n => expressions?.some(e => e.expressionName === n && e.imageUrl)).length;
  const exprScore = Math.round((exprFilled / 8) * 8);
  strength += exprScore;
  breakdown.push({ label: 'Expressions defined', weight: 8, score: exprScore, filled: exprFilled, total: 8 });

  const identityFilled = IDENTITY_FIELDS.filter(f => char?.[f]).length;
  const identityScore = Math.round((identityFilled / IDENTITY_FIELDS.length) * 7);
  strength += identityScore;
  breakdown.push({ label: 'Identity fields', weight: 7, score: identityScore, filled: identityFilled, total: IDENTITY_FIELDS.length });

  const rulesScore = (continuityRules?.length || 0) > 0 ? 3 : 0;
  strength += rulesScore;
  breakdown.push({ label: 'Continuity rules', weight: 3, score: rulesScore });

  const wardrobeScore = (wardrobeStates?.length || 0) > 0 ? 2 : 0;
  strength += wardrobeScore;
  breakdown.push({ label: 'Wardrobe defined', weight: 2, score: wardrobeScore });

  strength = Math.min(100, Math.round(strength));

  const recommendations = [];
  if (!hasTrainedAdapter) recommendations.push({ text: 'Not trained. Expect drift between shots. Training takes about 8 minutes.', weight: 35, link: 'training' });
  if (!references?.some(r => r.slotGroup === 'distance' && r.slotName === 'Wide' && r.imageUrl)) recommendations.push({ text: 'No Wide reference. Faces commonly warp in wide shots and you have nothing preventing it.', weight: 15, link: 'reference' });
  if (angleFilled < 5) recommendations.push({ text: `Only ${angleFilled} of 8 angle slots filled. More angles improve consistency.`, weight: 20, link: 'reference' });
  if (distFilled < 2) recommendations.push({ text: `Only ${distFilled} of 4 distance slots filled. Add distance variations for shot flexibility.`, weight: 15, link: 'reference' });
  if (lightFilled < 2) recommendations.push({ text: `Only ${lightFilled} of 6 lighting slots filled. Add lighting variations for scene flexibility.`, weight: 10, link: 'reference' });
  if (exprFilled < 4) recommendations.push({ text: `Only ${exprFilled} of 8 core expressions defined. Add expressions for emotion control.`, weight: 8, link: 'expressions' });
  if (identityFilled < IDENTITY_FIELDS.length) recommendations.push({ text: `${IDENTITY_FIELDS.length - identityFilled} identity fields still empty. Fill them for better conditioning.`, weight: 7, link: 'identity' });
  recommendations.sort((a, b) => b.weight - a.weight);

  return { strength, breakdown, recommendations, tier: char?.tier || 'described' };
}