import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { UserPlus, Check, ArrowLeft, CircleAlert } from 'lucide-react'
import { inscriptionService, publicService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

const CHAMP = 'w-full rounded-xl bg-surface border border-bord px-4 py-3 outline-none focus:border-neon transition-colors'

/**
 * Inscription en autonomie.
 *
 * Une partie des joueurs a deja ete saisie a la main par un administrateur,
 * avec le seul nom. On commence donc par verifier le nom : si la fiche existe,
 * on la COMPLETE au lieu d'en creer une seconde. Sans cette etape, le meme
 * joueur apparaitrait deux fois et le dimensionnement du format serait fausse.
 */
export default function InscriptionPage() {
  const { t } = useTranslation()
  const [etape, setEtape] = useState(1)
  const [form, setForm] = useState({
    nom: '', prenom: '', pseudo: '', email: '', telephone: '', lien_facebook: '',
  })
  const [reconnu, setReconnu] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [fini, setFini] = useState(null)

  const { data: pub } = useQuery({ queryKey: QUERY_KEYS.public, queryFn: publicService.tout })
  const ouvertes = pub?.reglages?.['inscriptions.ouvertes'] !== false

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const verifier = useMutation({
    mutationFn: () => inscriptionService.verifier(form.nom, form.prenom),
    onSuccess: (r) => { setReconnu(r.existe ? r : null); setEtape(2) },
  })

  const inscrire = useMutation({
    mutationFn: () => inscriptionService.inscrire(form),
    onSuccess: (r) => setFini(r),
    onError: (e) => setErreur(e?.response?.data?.message ?? t('commun.erreur')),
  })

  if (fini) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center anim-monte">
          <div className="w-16 h-16 mx-auto rounded-full bg-succes/15 border border-succes/40 grid place-items-center">
            <Check size={28} className="text-succes" />
          </div>
          <h1 className="titre mt-5 text-2xl font-bold">{t('inscription.merci')}</h1>
          <p className="mt-2 text-texte-doux">{fini.message}</p>
          <p className="mt-1 text-sm text-neon">{fini.nom}</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-sm text-texte-faible hover:text-neon">
            <ArrowLeft size={14} />
            {t('inscription.retour_accueil')}
          </Link>
        </div>
      </div>
    )
  }

  if (!ouvertes) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <CircleAlert size={26} className="mx-auto text-alerte" />
          <p className="mt-3 text-texte-doux">{t('inscription.fermees')}</p>
          <Link to="/" className="mt-6 inline-block text-sm text-neon">{t('inscription.retour_accueil')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm anim-monte">
        <h1 className="titre text-3xl font-bold text-neon">{t('inscription.titre')}</h1>

        {etape === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); verifier.mutate() }}>
            <p className="mt-1 mb-7 text-sm text-texte-doux">{t('inscription.sous_titre')}</p>

            <label className="etiquette text-texte-faible">{t('inscription.prenom')}</label>
            <input value={form.prenom} onChange={maj('prenom')} className={cn(CHAMP, 'mt-1.5 mb-4')} />

            <label className="etiquette text-texte-faible">{t('inscription.nom')}</label>
            <input value={form.nom} onChange={maj('nom')} required className={cn(CHAMP, 'mt-1.5')} />

            <button type="submit" disabled={verifier.isPending || !form.nom}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3.5 halo tape disabled:opacity-40">
              <UserPlus size={18} />
              {verifier.isPending ? t('commun.chargement') : t('inscription.continuer')}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setErreur(null); inscrire.mutate() }}>
            {/* Si la fiche existe deja, on le dit : la personne comprend
                pourquoi on ne lui redemande pas son nom. */}
            {reconnu && (
              <div className="mt-3 mb-5 rounded-xl border border-neon-sourd bg-neon/10 p-4">
                <p className="text-sm">{t('inscription.reconnu', { nom: reconnu.nom })}</p>
                <p className="mt-1 text-xs text-texte-doux">{t('inscription.completez')}</p>
              </div>
            )}

            <label className="etiquette text-texte-faible">{t('inscription.email')}</label>
            <input type="email" value={form.email} onChange={maj('email')} required
                   className={cn(CHAMP, 'mt-1.5 mb-4')} />

            <label className="etiquette text-texte-faible">{t('inscription.telephone')}</label>
            <input type="tel" value={form.telephone} onChange={maj('telephone')} required
                   placeholder="+229 …" className={cn(CHAMP, 'mt-1.5 mb-4')} />

            <label className="etiquette text-texte-faible">{t('inscription.pseudo')}</label>
            <input value={form.pseudo} onChange={maj('pseudo')} className={cn(CHAMP, 'mt-1.5')} />
            <p className="mt-1.5 mb-4 text-xs text-texte-faible">{t('inscription.aide_pseudo')}</p>

            <label className="etiquette text-texte-faible">{t('inscription.lien_fb')}</label>
            <input value={form.lien_facebook} onChange={maj('lien_facebook')}
                   placeholder="https://facebook.com/…" className={cn(CHAMP, 'mt-1.5')} />

            {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}

            <button type="submit" disabled={inscrire.isPending}
                    className="mt-6 w-full rounded-xl bg-neon text-fond font-semibold py-3.5 halo tape disabled:opacity-40">
              {inscrire.isPending ? t('commun.chargement') : t('inscription.valider')}
            </button>

            <button type="button" onClick={() => { setEtape(1); setErreur(null) }}
                    className="mt-5 flex items-center gap-1.5 text-sm text-texte-faible hover:text-texte">
              <ArrowLeft size={14} />
              {t('commun.retour')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
