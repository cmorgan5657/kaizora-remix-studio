import { base44 } from '@/api/base44Client';

/**
 * Analyzes reference assets in depth — frame by frame for visual assets,
 * word by word for audio — and returns structured analysis objects.
 */
export async function analyzeReferences(references) {
  if (!references || references.length === 0) return [];

  const analyses = await Promise.all(
    references.map(async (ref) => {
      try {
        if (ref.type === 'audio') {
          return await analyzeAudio(ref);
        }
        return await analyzeVisual(ref);
      } catch (e) {
        return { ...ref, analysis: null, error: e.message };
      }
    })
  );

  return analyses;
}

async function analyzeVisual(ref) {
  const kind = ref.type === 'video' ? 'video' : 'image';
  const breakdownInstruction = kind === 'video'
    ? 'Break down the video shot by shot — each shot\'s framing, camera movement, subject action, and timing.'
    : 'Describe the composition frame by frame — every element visible.';

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a forensic reference analyst for an AI video generation studio. Analyze this ${kind} in extreme detail so it can be reproduced with pixel-level accuracy. ${breakdownInstruction}

Extract:
- Subject: appearance, wardrobe, expression, pose, micro-details
- Camera: angle, framing, focal length, movement, lens characteristics
- Lighting: direction, quality, color temperature, shadows, mood
- Color palette and grading
- Environment and set dressing
- Style, aesthetic, and film stock qualities
- Any text, graphics, or UI visible
- Key distinguishing details that must be preserved

This is the SOURCE OF TRUTH for generation. Be exhaustive.`,
    file_urls: [ref.url],
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        shotBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        subject: { type: 'string' },
        camera: { type: 'string' },
        lighting: { type: 'string' },
        colorPalette: { type: 'string' },
        environment: { type: 'string' },
        style: { type: 'string' },
        keyDetails: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  return { ...ref, analysis: response };
}

async function analyzeAudio(ref) {
  const transcriptResult = await base44.integrations.Core.TranscribeAudio({ audio_url: ref.url });
  const transcript = typeof transcriptResult === 'string' ? transcriptResult : transcriptResult?.text || '';

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a music and audio analyst for an AI video generation studio. This transcription is from a reference audio track that serves as the SOURCE OF TRUTH for timing and mood. Analyze it for frame-accurate video synchronization.

Transcript: "${transcript}"

Extract:
- Word-by-word emphasis and pacing notes
- Structural sections: verses, choruses, bridges, instrumental breaks
- Emotional energy per section (calm, building, peak, etc.)
- Rhythm and tempo characteristics
- Key lyrical themes and narrative arc
- Specific sync beats where visual changes should occur`,
    response_json_schema: {
      type: 'object',
      properties: {
        transcript: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              content: { type: 'string' },
              energy: { type: 'string' },
            },
          },
        },
        rhythm: { type: 'string' },
        themes: { type: 'array', items: { type: 'string' } },
        keyBeats: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  return { ...ref, analysis: response, transcript };
}

/**
 * Compiles analyzed references into a single authoritative text block
 * that gets injected into the generation prompt as the source of truth.
 */
export function compileReferenceAnalysis(analyses) {
  const parts = [];

  analyses.forEach((a, i) => {
    if (!a.analysis) return;
    const an = a.analysis;
    const label = a.type === 'audio' ? 'AUDIO REF' : `${a.type === 'video' ? 'VIDEO' : 'IMAGE'} REF`;

    if (an.summary) parts.push(`[${label} ${i + 1}] ${an.summary}`);
    if (an.subject) parts.push(`Subject: ${an.subject}`);
    if (an.camera) parts.push(`Camera: ${an.camera}`);
    if (an.lighting) parts.push(`Lighting: ${an.lighting}`);
    if (an.colorPalette) parts.push(`Color: ${an.colorPalette}`);
    if (an.environment) parts.push(`Environment: ${an.environment}`);
    if (an.style) parts.push(`Style: ${an.style}`);
    if (an.keyDetails?.length) parts.push(`Key details: ${an.keyDetails.join(', ')}`);
    if (an.shotBreakdown?.length) {
      parts.push(`Shot breakdown: ${an.shotBreakdown.map((s) => s.description).join(' → ')}`);
    }
    if (an.sections?.length) {
      parts.push(`Audio structure: ${an.sections.map((s) => `${s.label}: ${s.content} (${s.energy})`).join(' | ')}`);
    }
    if (an.rhythm) parts.push(`Rhythm: ${an.rhythm}`);
    if (an.themes?.length) parts.push(`Themes: ${an.themes.join(', ')}`);
    if (an.keyBeats?.length) parts.push(`Sync beats: ${an.keyBeats.join('; ')}`);
  });

  return parts.join('. ');
}