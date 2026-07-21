import { Application, ModelProfile, JobPost } from '@/src/types';
import { Candidate, CandidateTag } from '@/src/types/candidate';

export const transformToCandidates = (
  applications: Application[],
  modelProfiles: ModelProfile[],
  jobs: JobPost[] = []
): Candidate[] => {
  return applications
    .filter((app) => app.status === 'PENDING')
    .reduce<Candidate[]>((acc, app) => {
      const profile = modelProfiles.find((p) => p.userId === app.modelUserId);
      if (!profile) return acc;

      // Trouver l'annonce correspondante
      const job = jobs.find((j) => j.id === app.jobId);

      // Utiliser uniquement les tags réels du profil
      const tags = profile.tags && profile.tags.length > 0
        ? (profile.tags as CandidateTag[])
        : [];

      acc.push({
        ...profile,
        applicationId: app.id,
        application: app,
        jobTitle: job?.title,
        tags: tags,
        availability: 'Disponibilité à confirmer',
      });

      return acc;
    }, []);
};
