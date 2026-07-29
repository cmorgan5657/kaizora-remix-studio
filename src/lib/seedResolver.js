export function resolveSeed(shot, sequence, project) {
  if (shot?.seedLocked && shot.shotSeed != null) return { seed: shot.shotSeed, scope: 'shot' };
  if (sequence?.seedLocked && sequence.sequenceSeed != null) return { seed: sequence.sequenceSeed, scope: 'sequence' };
  if (project?.seedLocked && project.projectSeed != null) return { seed: project.projectSeed, scope: 'project' };
  return { seed: null, scope: 'random' };
}

export function getSeedScope(shot, sequence, project) {
  return resolveSeed(shot, sequence, project).scope;
}