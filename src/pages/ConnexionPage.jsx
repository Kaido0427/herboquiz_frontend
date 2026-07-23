import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'

export default function ConnexionPage() {
  const { t } = useTranslation()
  const { connexion } = useSession()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null); setEnvoi(true)
    try {
      const r = await connexion(code, nom)
      navigate(r.role === 'admin' ? '/admin' : '/animation')
    } catch {
      setErreur(t('connexion.erreur_code'))
    } finally { setEnvoi(false) }
  }

  const champ = 'w-full rounded-xl bg-surface border border-bord px-4 py-3 outline-none focus:border-neon'

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={soumettre} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-neon">{t('connexion.titre')}</h1>
        <p className="mt-1 mb-6 text-sm text-texte-doux">{t('connexion.sous_titre')}</p>

        <label className="block text-sm mb-1">{t('connexion.code')}</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
               required autoCapitalize="characters" className={champ + ' font-mono tracking-widest'} />

        <label className="block text-sm mt-4 mb-1">{t('connexion.nom')}</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} required className={champ} />
        <p className="mt-1 text-xs text-texte-faible">{t('connexion.aide_nom')}</p>

        {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}

        <button type="submit" disabled={envoi}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 halo-neon disabled:opacity-50">
          <LogIn size={18} />
          {envoi ? t('commun.chargement') : t('connexion.valider')}
        </button>
      </form>
    </div>
  )
}
