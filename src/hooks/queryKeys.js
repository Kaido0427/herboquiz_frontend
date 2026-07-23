/** Cles de cache centralisees : une seule source de verite pour l'invalidation. */
export const QUERY_KEYS = {
  public: ['public'],
  moi: ['moi'],
  manches: ['manches'],
  manche: (id) => ['manches', id],
  animation: (id) => ['animation', id],
  participants: ['participants'],
  equipes: ['equipes'],
  questions: (mancheId) => ['questions', mancheId],
  reglages: ['reglages'],
  phases: ['phases'],
  preparation: ['preparation'],
  acces: ['acces'],
}
