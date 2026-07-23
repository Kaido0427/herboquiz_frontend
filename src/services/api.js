import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
})

// Le jeton vit dans le navigateur de l'animateur : il reste connecte d'une
// manche a l'autre sans ressaisir le code au milieu d'un match.
const CLE_JETON = 'herboquiz.jeton'
const CLE_NOM = 'herboquiz.nom'

export const session = {
  jeton: () => localStorage.getItem(CLE_JETON),
  nom: () => localStorage.getItem(CLE_NOM) || '',
  ouvrir(jeton, nom) {
    localStorage.setItem(CLE_JETON, jeton)
    localStorage.setItem(CLE_NOM, nom)
  },
  fermer() {
    localStorage.removeItem(CLE_JETON)
    localStorage.removeItem(CLE_NOM)
  },
}

api.interceptors.request.use((config) => {
  const jeton = session.jeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // 401 = le code a ete regenere ou la session a expire. On nettoie pour que
    // l'ecran de connexion reprenne la main plutot que d'echouer en boucle.
    if (error.response?.status === 401) session.fermer()
    return Promise.reject(error)
  },
)

export default api
