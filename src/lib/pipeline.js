import { base44 } from '@/api/base44Client';

export const PIPELINE_STAGES = [
  { id: 'resolve', name: 'Resolve', duration: 400 },
  { id: 'precondition', name: 'Precondition', duration: 700 },
  { id: 'generate', name: 'Generate', duration: 2500 },
  { id: 'postprocess', name: 'Post-process', duration: 900 },
  { id: 'measure', name: 'Measure', duration: 600 },
  { id: 'finalize', name: 'Finalize', duration: 400 },
];

export const QUALITY_COSTS = { Draft: 1, Standard: 3, Final: 8 };

export async function runPipeline({ projectId, shotId, payload, qualityTier, onStageUpdate, onCreditUpdate }) {
  const creditsCharged = QUALITY_COSTS[qualityTier] || 1;

  let job = await base44.entities.GenerationJob.create({
    shotId,
    projectId,
    stage: 'resolve',
    status: 'processing',
    progress: 0,
    creditsCharged: 0,
    creditsRefunded: 0,
    startedAt: new Date().toISOString(),
  });

  let creditsDeducted = false;
  let currentStageId = 'resolve';

  try {
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      currentStageId = stage.id;

      onStageUpdate(stage.id, 'processing');
      await base44.entities.GenerationJob.update(job.id, { stage: stage.id, progress: Math.round((i / PIPELINE_STAGES.length) * 100) });

      await new Promise((resolve) => setTimeout(resolve, stage.duration));

      if (stage.id === 'generate') {
        const proj = await base44.entities.Project.get(projectId);
        const newBalance = Math.max(0, (proj.creditBalance || 0) - creditsCharged);
        await base44.entities.Project.update(projectId, { creditBalance: newBalance });
        await base44.entities.CreditTransaction.create({ projectId, type: 'generation', amount: -creditsCharged, referenceId: job.id });
        await base44.entities.GenerationJob.update(job.id, { creditsCharged });
        creditsDeducted = true;
        onCreditUpdate(newBalance);
      }

      onStageUpdate(stage.id, 'complete');
    }

    const existingVersions = await base44.entities.ShotVersion.filter({ shotId });
    const versionNumber = (existingVersions?.length || 0) + 1;

    const version = await base44.entities.ShotVersion.create({
      shotId,
      versionNumber,
      videoUrl: `https://cdn.kaizora.studio/shots/${shotId}/v${versionNumber}.mp4`,
      thumbnailUrl: `https://cdn.kaizora.studio/shots/${shotId}/v${versionNumber}.jpg`,
      resolvedPayload: payload,
      resolvedSeed: payload.seed,
      creditCost: creditsCharged,
      qualityTier,
    });

    await base44.entities.GenerationJob.update(job.id, { status: 'complete', progress: 100, versionId: version.id, completedAt: new Date().toISOString() });

    return { job, version };
  } catch (error) {
    if (creditsDeducted) {
      const proj = await base44.entities.Project.get(projectId);
      const newBalance = (proj.creditBalance || 0) + creditsCharged;
      await base44.entities.Project.update(projectId, { creditBalance: newBalance });
      await base44.entities.CreditTransaction.create({ projectId, type: 'refund', amount: creditsCharged, referenceId: job.id });
      await base44.entities.GenerationJob.update(job.id, { creditsRefunded: creditsCharged });
      onCreditUpdate(newBalance);
    }

    await base44.entities.GenerationJob.update(job.id, { status: 'failed', errorStage: currentStageId, errorMessage: error.message });
    throw error;
  }
}