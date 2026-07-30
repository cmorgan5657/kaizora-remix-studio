import { base44 } from '@/api/base44Client';
import { computeConsistencyScores, getRemedies } from './consistencyScorer';
import { generateVideo, restoreFaces, upscale, colorGrade, detectArtifacts } from './integrations';
import { analyzeReferences, compileReferenceAnalysis } from './referenceAnalyzer';

export const PIPELINE_STAGES = [
  { id: 'resolve', name: 'Resolving settings', duration: 400 },
  { id: 'precondition', name: 'Preparing conditioning', duration: 700 },
  { id: 'generate', name: 'Generating', duration: 2500 },
  { id: 'postprocess', name: 'Restoring faces', duration: 900 },
  { id: 'measure', name: 'Measuring consistency', duration: 600 },
  { id: 'finalize', name: 'Finalizing', duration: 400 },
];

export const QUALITY_COSTS = { Draft: 1, Standard: 3, Final: 8 };

export async function runPipeline({ projectId, shotId, payload, qualityTier, character, styleLock, envLock, lightingLock, postProcess, onStageUpdate, onCreditUpdate }) {
  const creditsCharged = QUALITY_COSTS[qualityTier] || 1;

  let job = await base44.entities.GenerationJob.create({
    shotId, projectId, stage: 'resolve', status: 'processing', progress: 0,
    creditsCharged: 0, creditsRefunded: 0, startedAt: new Date().toISOString(),
  });

  let creditsDeducted = false;
  let currentStageId = 'resolve';
  let measureResult = { scores: null, remedies: [], artifacts: [] };
  let videoUrl = null;
  let generatedClipUrls = [];
  let enhancedPayload = payload;

  try {
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      currentStageId = stage.id;
      onStageUpdate(stage.id, 'processing');
      await base44.entities.GenerationJob.update(job.id, { stage: stage.id, progress: Math.round((i / PIPELINE_STAGES.length) * 100) });

      if (stage.id === 'resolve') {
        await new Promise((r) => setTimeout(r, stage.duration));
      }

      if (stage.id === 'precondition') {
        if (payload.references?.length > 0) {
          try {
            const analyses = await analyzeReferences(payload.references);
            const analysisText = compileReferenceAnalysis(analyses);
            if (analysisText) {
              enhancedPayload = {
                ...payload,
                positivePrompt: `${payload.positivePrompt}. REFERENCE ANALYSIS (SOURCE OF TRUTH): ${analysisText}`,
                referenceAnalysis: analyses,
              };
            }
          } catch (e) {
            // Analysis failed — proceed with IP-Adapter conditioning only
          }
        }
        await new Promise((r) => setTimeout(r, stage.duration));
      }

      if (stage.id === 'generate') {
        const proj = await base44.entities.Project.get(projectId);
        const newBalance = Math.max(0, (proj.creditBalance || 0) - creditsCharged);
        await base44.entities.Project.update(projectId, { creditBalance: newBalance });
        await base44.entities.CreditTransaction.create({ projectId, type: 'generation', amount: -creditsCharged, referenceId: job.id });
        await base44.entities.GenerationJob.update(job.id, { creditsCharged });
        creditsDeducted = true;
        onCreditUpdate(newBalance);

        // INTEGRATION POINT: call video generation adapter
        const result = await generateVideo({ ...enhancedPayload, qualityTier });
        videoUrl = result.videoUrl;
        generatedClipUrls = result.clipUrls || (videoUrl ? [videoUrl] : []);
      }

      if (stage.id === 'postprocess') {
        // Run enabled post-processing stages — each caches independently
        if (postProcess?.faceRestoration?.enabled && character) {
          const restored = await restoreFaces(videoUrl, [], { threshold: postProcess.faceRestoration.threshold || 12, strength: postProcess.faceRestoration.strength || 60 });
          videoUrl = restored.videoUrl;
        }
        if (postProcess?.upscale?.enabled) {
          const upscaled = await upscale(videoUrl, postProcess.upscale.targetResolution || '1080p');
          videoUrl = upscaled.videoUrl;
        }
        if (postProcess?.colorGrade?.enabled && styleLock) {
          const graded = await colorGrade(videoUrl, { colorGrade: styleLock.colorGrade, grain: styleLock.grain, halation: styleLock.halation });
          videoUrl = graded.videoUrl;
        }
      }

      if (stage.id === 'measure') {
        measureResult.scores = computeConsistencyScores({ character, styleLock, envLock, lightingLock, qualityTier, seed: payload.seed, energy: payload.motionParams?.energy, duration: payload.duration });
        measureResult.remedies = getRemedies(measureResult.scores, character, styleLock, envLock, lightingLock);

        // Artifact detection (always on, report only)
        const artifactResult = await detectArtifacts(videoUrl);
        measureResult.artifacts = artifactResult.flags || [];
      }

      onStageUpdate(stage.id, 'complete');
    }

    const existingVersions = await base44.entities.ShotVersion.filter({ shotId });
    const versionNumber = (existingVersions?.length || 0) + 1;
    const version = await base44.entities.ShotVersion.create({
      shotId, versionNumber, videoUrl,
      clipUrls: generatedClipUrls.length > 0 ? generatedClipUrls : (videoUrl ? [videoUrl] : []),
      thumbnailUrl: null,
      resolvedPayload: enhancedPayload, resolvedSeed: enhancedPayload.seed, creditCost: creditsCharged, qualityTier,
    });

    // Persist consistency scores
    if (measureResult.scores) {
      await base44.entities.ConsistencyScore.create({
        versionId: version.id,
        characterIdentityMean: measureResult.scores.face,
        characterIdentityMin: Math.round(measureResult.scores.face * 0.9),
        styleScore: measureResult.scores.style,
        environmentScore: measureResult.scores.structural,
        lightingScore: measureResult.scores.lighting,
        temporalStability: measureResult.scores.temporalStability,
        overallScore: measureResult.scores.overall,
        worstFrames: measureResult.scores.worstFrames,
      });
    }

    // Persist artifact flags
    for (const flag of measureResult.artifacts) {
      await base44.entities.ArtifactFlag.create({ versionId: version.id, type: flag.type, frameNumber: flag.frameNumber, severity: flag.severity, description: flag.description });
    }

    await base44.entities.GenerationJob.update(job.id, { status: 'complete', progress: 100, versionId: version.id, completedAt: new Date().toISOString() });
    return { job, version, scores: measureResult.scores, remedies: measureResult.remedies, artifacts: measureResult.artifacts };
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