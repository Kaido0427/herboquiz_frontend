import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn, ArrowLeft, UserRound, PenLine } from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'
import { authService } from '@/services/herboquizService'
import { cn } from '@/utils/cn'

/**
 * Connexion en deux temps : le code, puis le nom.
 *
 * Le second temps n'est pas une formalite. Le code etant partage entre
 * plusieurs personnes, c'est le nom qui dit qui a attribue quel point. Le faire
 * CHOISIR plutot que taper evite qu'une meme personne apparaisse en « Eckson »
 * un soir et « Ekson » le lendemain — ce qui rendrait l'historique inutilisable
 * le jour d'une contestation.
 */
export default function ConnexionPage() {
  const { t } = useTranslation()
  const { connexion } = useSession()
  const navigate = useNavigate()

  const [etape, setEtape] = useState(1)
  const [code, setCode] = useState('')
  const [noms, setNoms] = useState([])
  const [nom, setNom] = useState('')
  const [saisieLibre, setSaisieLibre] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const champ = 'w-full rounded-xl bg-surface border border-bord px-4 py-3.5 outline-none focus:border-neon transition-colors'

  const verifier = async (e) => {
    e.preventDefault()
    setErreur(null); setEnvoi(true)
    try {
      const r = await authService.verifier(code)
      setNoms(r.noms)
      // Personne d'enregistre pour ce role : on bascule direct en saisie libre.
      setSaisieLibre(r.noms.length === 0)
      setEtape(2)
    } catch {
      setErreur(t('connexion.erreur_code'))
    } finally { setEnvoi(false) }
  }

  const entrer = async (nomChoisi) => {
    setErreur(null); setEnvoi(true)
    try {
      const r = await connexion(code, nomChoisi)
      navigate(r.role === 'admin' ? '/admin' : '/animation')
    } catch {
      setErreur(t('commun.erreur'))
    } finally { setEnvoi(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm anim-monte">
        <h1 className="titre text-3xl font-bold text-neon">{t('connexion.titre')}</h1>

        {etape === 1 ? (
          <form onSubmit={verifier}>
            <p className="mt-1 mb-7 text-sm text-texte-doux">{t('connexion.sous_titre')}</p>

            <label className="etiquette text-texte-faible">{t('connexion.code')}</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                   required autoCapitalize="characters" autoFocus
                   className={cn(champ, 'mt-1.5 titre text-2xl tracking-[0.3em] text-center')} />

            {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}

            <button type="submit" disabled={envoi || !code}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3.5 halo tape disabled:opacity-40">
              <LogIn size={18} />
              {envoi ? t('commun.chargement') : t('connexion.valider')}
            </button>
          </form>
        ) : (
          <div>
            <p className="mt-1 mb-2 text-sm text-texte-doux">{t('connexion.qui_es_tu')}</p>
            <p className="mb-6 text-xs text-texte-faible leading-relaxed">{t('connexion.aide_nom')}</p>

            {!saisieLibre ? (
              <>
                <div className="grid gap-2 cascade">
                  {noms.map((n) => (
                    <button key={n} onClick={() => entrer(n)} disabled={envoi}
                            className="flex items-center gap-3 rounded-xl bg-surface border border-bord px-4 py-3.5 text-left tape hover:border-neon disabled:opacity-40">
                      <UserRound size={16} className="text-neon-sourd shrink-0" />
                      {n}
                    </button>
                  ))}
                </div>

                <button onClick={() => setSaisieLibre(true)}
                        className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-texte-faible hover:text-neon transition-colors">
                  <PenLine size={14} />
                  {t('connexion.autre_nom')}
                </button>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); entrer(nom) }}>
                <input value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus
                       placeholder={t('connexion.nom')} className={champ} />
                <button type="submit" disabled={envoi || !nom}
                        className="mt-4 w-full rounded-xl bg-neon text-fond font-semibold py-3.5 halo tape disabled:opacity-40">
                  {envoi ? t('commun.chargement') : t('connexion.valider')}
                </button>
                {noms.length > 0 && (
                  <button type="button" onClick={() => setSaisieLibre(false)}
                          className="mt-3 w-full text-sm text-texte-faible hover:text-neon">
                    {t('connexion.choisir_liste')}
                  </button>
                )}
              </form>
            )}

            {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}

            <button onClick={() => { setEtape(1); setErreur(null) }}
                    className="mt-6 flex items-center gap-1.5 text-sm text-texte-faible hover:text-texte transition-colors">
              <ArrowLeft size={14} />
              {t('commun.retour')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
