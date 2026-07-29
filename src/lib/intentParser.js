const ACTION_KEYWORDS = ['walks', 'walk', 'runs', 'run', 'jumps', 'stands', 'sits', 'turns', 'looks', 'reaches', 'grabs', 'throws', 'catches', 'pushes', 'pulls', 'points', 'waves', 'nods', 'shakes', 'laughs', 'cries', 'sighs', 'gasps', 'recoils', 'celebrates', 'approaches', 'retreats', 'enters', 'exits', 'stops', 'picks up', 'sets down'];
const DIRECTION_KEYWORDS = ['toward the camera', 'away from the camera', 'toward', 'away', 'left', 'right', 'forward', 'backward', 'into', 'out of', 'across', 'through', 'around', 'past'];
const EMOTION_KEYWORDS = ['angry', 'happy', 'sad', 'surprised', 'fearful', 'disgusted', 'contemplative', 'determined', 'exhausted', 'amused', 'skeptical', 'relieved', 'anxious', 'confident', 'nervous', 'calm', 'excited', 'bored', 'curious', 'hopeful'];
const APPEARANCE_KEYWORDS = ['hair', 'eyes', 'skin', 'face', 'wearing', 'dressed', 'outfit', 'clothes', 'tall', 'short', 'blonde', 'brunette', 'redhead', 'beard', 'mustache', 'glasses', 'hat', 'jacket', 'dress', 'shirt', 'pants', 'helmet', 'scar', 'tattoo'];

export function parseIntent(text) {
  if (!text || !text.trim()) return { chips: [], conflict: null };

  const lower = text.toLowerCase();
  const chips = [];

  const actionMatch = ACTION_KEYWORDS.find((k) => lower.includes(k));
  if (actionMatch) chips.push({ type: 'Action', value: actionMatch });

  const directionMatch = DIRECTION_KEYWORDS.find((k) => lower.includes(k));
  if (directionMatch) chips.push({ type: 'Direction', value: directionMatch });

  const emotionMatch = EMOTION_KEYWORDS.find((k) => lower.includes(k));
  if (emotionMatch) chips.push({ type: 'Emotion', value: emotionMatch });

  const subjectMatch = lower.match(/\b(he|she|they|it|the character|the subject)\b/);
  if (subjectMatch) chips.push({ type: 'Subject', value: subjectMatch[0] });

  const objectMatch = lower.match(/\b(?:grab|throw|catch|push|pull|pick up|set down|hold|reach)\s+(?:a\s+|the\s+|an\s+)?(\w+)/);
  if (objectMatch) chips.push({ type: 'Object', value: objectMatch[1] });

  const appearanceMatch = APPEARANCE_KEYWORDS.find((k) => lower.includes(k));
  const conflict = appearanceMatch
    ? { word: appearanceMatch, message: 'Your character is already defined. Describing appearance here can conflict with your character lock.' }
    : null;

  return { chips, conflict };
}