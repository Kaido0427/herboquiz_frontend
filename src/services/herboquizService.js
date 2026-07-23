import api from './api'

export const authService = {
  verifier: (code) => api.post('/connexion/verifier', { code }).then((r) => r.data),
  connexion: (code, nom) => api.post('/connexion', { code, nom }).then((r) => r.data),
  moi: () => api.get('/moi').then((r) => r.data),
  deconnexion: () => api.post('/deconnexion').then((r) => r.data),
}

export const publicService = {
  tout: () => api.get('/public').then((r) => r.data),
}

export const animationService = {
  vue: (mancheId) => api.get(`/manches/${mancheId}/animation`).then((r) => r.data),
  attribuer: (mancheId, payload) => api.post(`/manches/${mancheId}/point`, payload).then((r) => r.data),
  annuler: (mancheId) => api.post(`/manches/${mancheId}/annuler`).then((r) => r.data),
  terminer: (mancheId) => api.post(`/manches/${mancheId}/terminer`).then((r) => r.data),
}

export const mancheService = {
  liste: () => api.get('/manches').then((r) => r.data),
  detail: (id) => api.get(`/manches/${id}`).then((r) => r.data),
  creer: (d) => api.post('/manches', d).then((r) => r.data),
  modifier: (id, d) => api.put(`/manches/${id}`, d).then((r) => r.data),
  supprimer: (id) => api.delete(`/manches/${id}`).then((r) => r.data),
}

export const participantService = {
  liste: () => api.get('/participants').then((r) => r.data),
  creer: (d) => api.post('/participants', d).then((r) => r.data),
  modifier: (id, d) => api.put(`/participants/${id}`, d).then((r) => r.data),
  supprimer: (id) => api.delete(`/participants/${id}`).then((r) => r.data),
}

export const equipeService = {
  liste: () => api.get('/equipes').then((r) => r.data),
  generer: (mode) => api.post('/equipes/generer', { mode }).then((r) => r.data),
  supprimer: (id) => api.delete(`/equipes/${id}`).then((r) => r.data),
}

export const questionService = {
  liste: (mancheId) => api.get('/questions', { params: { manche_id: mancheId } }).then((r) => r.data),
  creerLot: (mancheId, questions) =>
    api.post('/questions/lot', { manche_id: mancheId, questions }).then((r) => r.data),
  supprimer: (id) => api.delete(`/questions/${id}`).then((r) => r.data),
}

export const reglageService = {
  liste: () => api.get('/reglages').then((r) => r.data),
  enregistrer: (reglages) => api.put('/reglages', { reglages }).then((r) => r.data),
}

export const simulationService = {
  simuler: (payload) => api.post('/simulation', payload).then((r) => r.data),
  appliquer: (payload) => api.post('/simulation/appliquer', payload).then((r) => r.data),
}

export const accesService = {
  liste: () => api.get('/acces').then((r) => r.data),
  regenerer: (id) => api.post(`/acces/${id}/regenerer`).then((r) => r.data),
  sessions: () => api.get('/acces/sessions').then((r) => r.data),
}

export const phaseService = {
  etat: () => api.get('/phases/etat').then((r) => r.data),
  generer: () => api.post('/phases/generer').then((r) => r.data),
}

export const inscriptionService = {
  verifier: (nom, prenom) => api.post('/inscription/verifier', { nom, prenom }).then((r) => r.data),
  inscrire: (donnees) => api.post('/inscription', donnees).then((r) => r.data),
}
