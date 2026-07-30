import { base44 } from '@/api/base44Client';

const SHOT_TYPES = 'Extreme Wide, Wide, Full, Medium Wide, Medium, Medium Close, Close Up, Extreme Close Up, Over the Shoulder, POV, Two Shot, Insert';
const CAMERA_MOVES = 'Static, Dolly In, Dolly Out, Truck Left, Truck Right, Pedestal Up, Pedestal Down, Pan Left, Pan Right, Tilt Up, Tilt Down, Orbit Left, Orbit Right, Crane Up, Crane Down, Push In, Pull Out, Handheld Follow, Steadicam Follow, Zoom In, Zoom Out';

const SCENE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    sceneCount: { type: 'number' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          summary: { type: 'string' },
          keyMoments: { type: 'array', items: { type: 'string' } },
          characters: { type: 'array', items: { type: 'string' } },
          emotionalTone: { type: 'string' },
        },
      },
    },
  },
};

const SHOT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          intentText: { type: 'string' },
          shotType: { type: 'string' },
          cameraMove: { type: 'string' },
          duration: { type: 'number' },
          sceneName: { type: 'string' },
        },
      },
    },
  },
};

const COMPARE_SCHEMA = {
  type: 'object',
  properties: {
    accuracyScore: { type: 'number' },
    missingBeats: { type: 'array', items: { type: 'string' } },
    inaccuracies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          shotName: { type: 'string' },
          issue: { type: 'string' },
          correction: { type: 'string' },
        },
      },
    },
    overallAssessment: { type: 'string' },
    correctedShots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          intentText: { type: 'string' },
          shotType: { type: 'string' },
          cameraMove: { type: 'string' },
          duration: { type: 'number' },
          sceneName: { type: 'string' },
        },
      },
    },
  },
};

function buildScenePrompt(script) {
  return `You are a professional AI film director and screenwriter for Kaizora Remix Studio. Carefully and thoroughly analyze the following script and break it into distinct SCENES (story beats). Take your time — read every line, identify every transition, every emotional shift, every location change.

For each scene provide:
- name: A short, descriptive scene name
- summary: What happens in this scene (2-3 sentences capturing the narrative arc)
- keyMoments: The key visual and emotional moments that MUST be captured on screen (3-5 items)
- characters: Which characters appear in this scene
- emotionalTone: The dominant emotional tone (e.g., tense, hopeful, ominous, melancholic)

CRITICAL: Do not skip or compress any part of the script. Every scene matters. If the script has 8 scenes, list 8 scenes. Be exhaustive and precise.

Script:
${script}`;
}

function buildShotPrompt(script, scenes, hasRefs) {
  return `You are a professional AI film director and cinematographer for Kaizora Remix Studio. Based on the scene breakdown below, build a COMPLETE sequence of detailed shots that tell the full story — scene by scene, beat by beat.

SCENE BREAKDOWN:
${JSON.stringify(scenes, null, 2)}

CRITICAL REQUIREMENTS:
- Build shots for EVERY scene. Do not skip any scene. Each scene should get 1-4 shots depending on its complexity.
- Each shot should be 10, 12, or 15 seconds long.
- Each shot's intentText must be EXTREMELY DETAILED — write 3-5 full sentences describing: what the character does (specific actions, gestures, facial expressions), camera movement and framing, lighting and mood, environment details, and emotional tone. Include specific details from the script — character names, dialogue snippets, locations, props, costumes.
- Each shot should flow naturally into the next — think about transitions, continuity, and pacing.
- The intentText will be used directly as the video generation prompt, so make it cinematic and visually descriptive.
${hasRefs ? '- Use the attached reference images as the visual source of truth for appearance, style, and setting. Describe how each shot relates to what you see in the references.\n' : ''}
For each shot provide:
- name: Short descriptive name (e.g., "Maya enters the alley")
- intentText: 3-5 SENTENCES of detailed cinematic description
- shotType: One of: ${SHOT_TYPES}
- cameraMove: One of: ${CAMERA_MOVES}
- duration: 10, 12, or 15 seconds
- sceneName: Which scene this shot belongs to (must match a scene name from the breakdown)

ORIGINAL SCRIPT (for reference — ensure every detail is captured):
${script}`;
}

function buildComparePrompt(script, shots) {
  const shotSummary = shots.map((s) => ({
    name: s.name,
    intentText: s.intentText,
    sceneName: s.sceneName,
    shotType: s.shotType,
    cameraMove: s.cameraMove,
  }));

  return `You are a script supervisor and continuity expert for Kaizora Remix Studio. Your job is to compare the generated shot list to the ORIGINAL SCRIPT and verify ABSOLUTE ACCURACY. Be rigorous and critical.

ORIGINAL SCRIPT:
${script}

GENERATED SHOTS:
${JSON.stringify(shotSummary, null, 2)}

Perform a thorough accuracy audit:
1. COMPLETENESS: Is every part of the script represented in the shots? Read through the script line by line and check that every story beat, every character moment, every location, and every key event has a corresponding shot. List any missing story beats in missingBeats.
2. ACCURACY: Do the shots accurately reflect the script's content, characters, dialogue, and events? For each shot that contains inaccuracies (wrong character actions, misattributed dialogue, incorrect setting, wrong emotional tone), list it in inaccuracies with the specific issue and a correction.
3. ORDER: Are the shots in the correct narrative order matching the script?
4. REDUNDANCY: Are there any redundant or duplicate shots that should be merged or removed?

Then provide:
- accuracyScore: 0-100 (how faithfully the shots represent the script)
- missingBeats: Array of story beats from the script not covered by any shot
- inaccuracies: Array of { shotName, issue, correction } for shots that don't match the script
- overallAssessment: A summary paragraph of the accuracy analysis
- correctedShots: If ANY shots need correction (due to inaccuracies, missing details, or missing beats that should be added as new shots), provide the FULL corrected shot list here. If no corrections are needed, return the original shots unchanged. Each shot must have: name, intentText, shotType, cameraMove, duration, sceneName.

If you found missing beats, ADD them as new shots in correctedShots. The correctedShots array should be the complete, final, accurate shot list.`;
}

export async function runQuickBuild({ script, context, referenceImageUrls, onPhaseUpdate }) {
  const fileUrls = referenceImageUrls?.length > 0 ? referenceImageUrls : null;

  // Phase 1: Scene Breakdown
  onPhaseUpdate?.({ phase: 'breaking-down', message: '📖 Analyzing script and breaking into scenes…' });
  const sceneResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `${context}\n\n${buildScenePrompt(script)}`,
    response_json_schema: SCENE_SCHEMA,
    file_urls: fileUrls,
  });
  const scenes = sceneResponse.scenes || [];

  // Phase 2: Build detailed shots per scene
  onPhaseUpdate?.({ phase: 'building-shots', message: `🎬 Building detailed shots for ${scenes.length} scenes…` });
  const shotResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `${context}\n\n${buildShotPrompt(script, scenes, !!fileUrls)}`,
    response_json_schema: SHOT_SCHEMA,
    file_urls: fileUrls,
  });
  let shots = shotResponse.shots || [];

  // Phase 3: Compare to script for accuracy
  onPhaseUpdate?.({ phase: 'comparing', message: `🔍 Comparing ${shots.length} shots to the script for accuracy…` });
  const compareResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `${context}\n\n${buildComparePrompt(script, shots)}`,
    response_json_schema: COMPARE_SCHEMA,
  });

  // Use corrected shots if the accuracy check produced them
  if (compareResponse.correctedShots && compareResponse.correctedShots.length > 0) {
    shots = compareResponse.correctedShots;
  }

  onPhaseUpdate?.({ phase: 'complete', message: '✓ Script analysis and accuracy check complete.' });

  return {
    scenes,
    shots,
    accuracyReport: compareResponse,
  };
}