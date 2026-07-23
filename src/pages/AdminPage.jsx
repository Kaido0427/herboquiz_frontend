import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UsersRound, LayoutGrid, Settings, KeyRound, Trash2, Plus, RefreshCw, LogOut } from 'lucide-react'
import {
  participantService, equipeService, reglageService,
  simulationService, accesService,
} from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { useSession } from '@/contexts/SessionContext'
import { cn } from '@/utils/cn'

const CHAMP = 'w-full rounded-xl bg-surface border border-bord px-3 py-2 outline-none focus:border-neon'

/**
 * Espace d'administration.
 *
 * Principe directeur : tout ce qui pourrait un jour devoir changer se change
 * ICI. Aucun texte, aucun prix, aucun seuil du tournoi ne vit dans le code.
 * Les listes longues sont en onglets avec compteurs plutot qu'empilees.
 */
export default function AdminPage() {
  const { t } = useTranslation()
  const { deconnexion, utilisateur } = useSession()
  const [onglet, setOnglet] = useState('participants')

  const onglets = [
    { cle: 'participants', libelle: t('admin.onglet_participants'), icone: Users },
    { cle: 'equipes',      libelle: t('admin.onglet_equipes'),      icone: UsersRound },
    { cle: 'simulation',   libelle: t('admin.onglet_simulation'),   icone: LayoutGrid },
    { cle: 'reglages',     libelle: t('admin.onglet_reglages'),     icone: Settings },
    { cle: 'acces',        libelle: t('admin.onglet_acces'),        icone: KeyRound },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-neon">{t('admin.titre')}</h1>
        <button onClick={deconnexion} className="flex items-center gap-1.5 text-xs text-texte-faible hover:text-texte">
          <LogOut size={14} />
          {utilisateur?.nom}
        </button>
      </header>

      <nav className="flex gap-1 overflow-x-auto pb-2 mb-5">
        {onglets.map((o) => (
          <button key={o.cle} onClick={() => setOnglet(o.cle)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm',
              onglet === o.cle ? 'bg-neon text-fond font-semibold' : 'bg-surface text-texte-doux',
            )}>
            <o.icone size={14} />
            {o.libelle}
          </button>
        ))}
      </nav>

      {onglet === 'participants' && <OngletParticipants />}
      {onglet === 'equipes' && <OngletEquipes />}
      {onglet === 'simulation' && <OngletSimulation />}
      {onglet === 'reglages' && <OngletReglages />}
      {onglet === 'acces' && <OngletAcces />}
    </div>
  )
}

function OngletParticipants() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [form, setForm] = useState({ nom: '', prenom: '', pseudo: '', telephone: '', confirme: true })

  const { data: liste = [] } = useQuery({
    queryKey: QUERY_KEYS.participants, queryFn: participantService.liste,
  })
  const rafraichir = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.participants })

  const creer = useMutation({
    mutationFn: () => participantService.creer(form),
    onSuccess: () => { setForm({ nom: '', prenom: '', pseudo: '', telephone: '', confirme: true }); rafraichir() },
  })
  const supprimer = useMutation({ mutationFn: participantService.supprimer, onSuccess: rafraichir })

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); creer.mutate() }}
            className="rounded-2xl bg-surface border border-bord p-4 mb-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-texte-faible mb-1">{t('admin.nom')}</label>
          <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label className="block text-xs text-texte-faible mb-1">{t('admin.prenom')}</label>
          <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label className="block text-xs text-texte-faible mb-1">{t('admin.pseudo')}</label>
          <input value={form.pseudo} onChange={(e) => setForm({ ...form, pseudo: e.target.value })} className={CHAMP} />
          <p className="mt-1 text-xs text-texte-faible">{t('admin.aide_pseudo')}</p>
        </div>
        <div>
          <label className="block text-xs text-texte-faible mb-1">{t('admin.telephone')}</label>
          <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={CHAMP} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.confirme}
                 onChange={(e) => setForm({ ...form, confirme: e.target.checked })} className="accent-neon" />
          {t('admin.confirme')}
        </label>
        <button type="submit" disabled={creer.isPending}
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-2.5 disabled:opacity-50">
          <Plus size={16} />
          {t('admin.nouveau_participant')}
        </button>
      </form>

      {liste.length === 0 ? (
        <p className="text-texte-faible text-sm">{t('admin.aucun_participant')}</p>
      ) : (
        <ul className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
          {liste.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate">{p.nom_affiche}</p>
                <p className="text-xs text-texte-faible truncate">
                  {p.nom_complet}{p.telephone ? ` · ${p.telephone}` : ''}
                </p>
              </div>
              {!p.confirme && <span className="text-xs text-alerte">{t('commun.non')}</span>}
              <button onClick={() => supprimer.mutate(p.id)} className="text-texte-faible hover:text-danger">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OngletEquipes() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: liste = [] } = useQuery({ queryKey: QUERY_KEYS.equipes, queryFn: equipeService.liste })

  const generer = useMutation({
    mutationFn: equipeService.generer,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.equipes }),
  })

  return (
    <div>
      <div className="rounded-2xl bg-surface border border-bord p-4 mb-5">
        <p className="text-sm mb-1">{t('admin.generer_equipes')}</p>
        {/* Avertissement explicite : la regeneration efface les equipes, donc
            les points deja attribues partent avec elles. */}
        <p className="text-xs text-alerte mb-3">{t('admin.aide_generer')}</p>
        <div className="flex gap-2">
          {['solo', 'duo'].map((mode) => (
            <button key={mode} onClick={() => generer.mutate(mode)} disabled={generer.isPending}
                    className="flex-1 rounded-xl border border-bord py-2.5 disabled:opacity-50 hover:border-neon">
              {t(`admin.mode_${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <p className="text-texte-faible text-sm">{t('admin.aucune_equipe')}</p>
      ) : (
        <ul className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
          {liste.map((e) => (
            <li key={e.id} className="px-4 py-3">{e.libelle}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OngletSimulation() {
  const { t } = useTranslation()
  const [effectif, setEffectif] = useState('')
  const [resultat, setResultat] = useState(null)

  const simuler = useMutation({
    mutationFn: () => simulationService.simuler(effectif ? { effectif: Number(effectif) } : {}),
    onSuccess: setResultat,
  })
  const appliquer = useMutation({
    mutationFn: () => simulationService.appliquer({
      nb_poules: resultat.nb_poules || 1,
      qualifies: resultat.qualifies,
      nb_questions: resultat.nb_questions,
    }),
  })

  const Ligne = ({ libelle, valeur }) => (
    <div className="flex justify-between py-2 border-b border-bord last:border-0">
      <span className="text-texte-faible text-sm">{libelle}</span>
      <span className="font-semibold">{valeur}</span>
    </div>
  )

  return (
    <div>
      <div className="rounded-2xl bg-surface border border-bord p-4 mb-5">
        <label className="block text-xs text-texte-faible mb-1">{t('admin.effectif')}</label>
        <input type="number" min="0" value={effectif} onChange={(e) => setEffectif(e.target.value)}
               className={CHAMP} placeholder="—" />
        <p className="mt-1 text-xs text-texte-faible">{t('admin.aide_simulation')}</p>
        <button onClick={() => simuler.mutate()} disabled={simuler.isPending}
                className="mt-3 w-full rounded-xl bg-neon text-fond font-semibold py-2.5 disabled:opacity-50">
          {t('admin.simuler')}
        </button>
      </div>

      {resultat && (
        <div className="rounded-2xl bg-surface border border-bord p-4">
          <Ligne libelle={t('admin.mode')} valeur={t(`admin.mode_${resultat.mode}`)} />
          <Ligne libelle={t('admin.poules')} valeur={resultat.nb_poules || '—'} />
          <Ligne libelle={t('admin.par_poule')} valeur={resultat.par_poule} />
          <Ligne libelle={t('admin.qualifies')} valeur={resultat.qualifies} />
          <Ligne libelle={t('admin.tableau')} valeur={resultat.taille_tableau} />
          <Ligne libelle={t('admin.questions_conseillees')} valeur={resultat.nb_questions} />
          <Ligne libelle={t('admin.phases')} valeur={resultat.phases.map((p) => p.nom).join(' · ')} />

          {resultat.notes.map((n, i) => (
            <p key={i} className="mt-3 text-xs text-texte-doux leading-relaxed">{n}</p>
          ))}

          <button onClick={() => appliquer.mutate()} disabled={appliquer.isPending}
                  className="mt-4 w-full rounded-xl border border-neon-sourd text-neon py-2.5 disabled:opacity-50">
            {t('admin.appliquer')}
          </button>
        </div>
      )}
    </div>
  )
}

function OngletReglages() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modifs, setModifs] = useState({})

  const { data: groupes = {} } = useQuery({ queryKey: QUERY_KEYS.reglages, queryFn: reglageService.liste })

  const enregistrer = useMutation({
    mutationFn: () => reglageService.enregistrer(
      Object.entries(modifs).map(([cle, valeur]) => ({ cle, valeur })),
    ),
    onSuccess: () => { setModifs({}); qc.invalidateQueries({ queryKey: QUERY_KEYS.reglages }) },
  })

  const valeurDe = (r) => (modifs[r.cle] !== undefined ? modifs[r.cle] : (r.valeur ?? ''))

  return (
    <div>
      {Object.entries(groupes).map(([groupe, reglages]) => (
        <section key={groupe} className="mb-5">
          <h2 className="text-xs uppercase tracking-widest text-texte-faible mb-2">{groupe}</h2>
          <div className="rounded-2xl bg-surface border border-bord p-4 grid gap-4">
            {reglages.map((r) => (
              <div key={r.cle}>
                <label className="block text-sm mb-1">{r.libelle}</label>
                {r.type === 'markdown' ? (
                  <textarea rows={4} value={valeurDe(r)}
                            onChange={(e) => setModifs({ ...modifs, [r.cle]: e.target.value })}
                            className={CHAMP} />
                ) : r.type === 'booleen' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={valeurDe(r) === '1' || valeurDe(r) === true}
                           onChange={(e) => setModifs({ ...modifs, [r.cle]: e.target.checked ? '1' : '0' })}
                           className="accent-neon" />
                    {t('commun.oui')}
                  </label>
                ) : (
                  <input type={r.type === 'nombre' ? 'number' : 'text'} value={valeurDe(r)}
                         onChange={(e) => setModifs({ ...modifs, [r.cle]: e.target.value })}
                         className={CHAMP} />
                )}
                {r.aide && <p className="mt-1 text-xs text-texte-faible">{r.aide}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}

      {Object.keys(modifs).length > 0 && (
        <button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}
                className="sticky bottom-4 w-full rounded-xl bg-neon text-fond font-semibold py-3 halo-neon disabled:opacity-50">
          {t('commun.enregistrer')}
        </button>
      )}
    </div>
  )
}

function OngletAcces() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: liste = [] } = useQuery({ queryKey: QUERY_KEYS.acces, queryFn: accesService.liste })

  const regenerer = useMutation({
    mutationFn: accesService.regenerer,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.acces }),
  })

  return (
    <div>
      <ul className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
        {liste.map((a) => (
          <li key={a.id} className="px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-texte-faible">
                  {a.role === 'admin' ? t('admin.code_admin') : t('admin.code_modo')}
                </p>
                <p className="font-mono text-lg tracking-widest text-neon">{a.code_clair}</p>
              </div>
              <button
                onClick={() => { if (confirm(t('admin.confirmer_regenerer'))) regenerer.mutate(a.id) }}
                className="flex items-center gap-1.5 rounded-lg border border-bord px-3 py-2 text-sm hover:border-neon">
                <RefreshCw size={14} />
                {t('admin.regenerer')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-texte-faible">{t('admin.aide_regenerer')}</p>
    </div>
  )
}
