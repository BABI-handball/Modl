import { ModelProfile, Application } from './index';

export type CandidateTag = 'RUNWAY' | 'COMMERCIAL' | 'EDITORIAL' | 'FITNESS' | 'BEAUTY' | 'LIFESTYLE';

export interface Candidate extends ModelProfile {
  applicationId: string;
  application: Application;
  jobTitle?: string; // Titre de l'annonce pour laquelle le modèle a postulé
  tags: CandidateTag[];
  availability: string; // ex: "Disponible cette semaine"
}
