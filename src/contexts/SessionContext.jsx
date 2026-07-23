import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '@/services/herboquizService'
import { session } from '@/services/api'

const Contexte = createContext(null)

export function SessionProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    if (!session.jeton()) { setPret(true); return }
    authService.moi()
      .then(setUtilisateur)
      .catch(() => session.fermer())
      .finally(() => setPret(true))
  }, [])

  const connexion = async (code, nom) => {
    const r = await authService.connexion(code, nom)
    session.ouvrir(r.jeton, r.nom)
    setUtilisateur({ role: r.role, nom: r.nom })
    return r
  }

  const deconnexion = async () => {
    try { await authService.deconnexion() } catch { /* le jeton peut deja etre invalide */ }
    session.fermer()
    setUtilisateur(null)
  }

  return (
    <Contexte.Provider value={{ utilisateur, pret, connexion, deconnexion, estAdmin: utilisateur?.role === 'admin' }}>
      {children}
    </Contexte.Provider>
  )
}

export const useSession = () => useContext(Contexte)
