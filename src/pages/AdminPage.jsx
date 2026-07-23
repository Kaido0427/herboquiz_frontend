import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, UsersRound, LayoutGrid, Settings, KeyRound, Trash2, Plus,
  RefreshCw, LogOut, Check, ChevronRight, Menu, X, ShieldCheck, Wand2,
  Swords, HelpCircle, Trophy, ArrowRight, MessageCircle, ExternalLink, Eye, Copy, Check as CheckIcon,
} from 'lucide-react'
import {
  participantService, equipeService, reglageService,
  simulationService, accesService, phaseService, preparationService,
} from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { useSession } from '@/contexts/SessionContext'
import EditeurTexte from '@/components/EditeurTexte'
import EtatChaine from '@/components/EtatChaine'
import FichePerformance from '@/components/FichePerformance'
import VueManches from '@/pages/admin/VueManches'
import VueQuestions from '@/pages/admin/VueQuestions'
import { cn } from '@/utils/cn'

const CHAMP = 'w-full rounded-xl bg-fond-2 border border-bord px-3 py-2.5 outline-none focus:border-neon transition-colors'

/**
 * Espace d'administration.
 *
 * Deux principes :
 *  - Tout ce qui pourrait un jour devoir changer se change ICI. Aucun texte,
 *    aucun prix, aucun seuil du tournoi ne vit dans le code.
 *  - Les sections sont groupees comme l'organisateur y pense (le tournoi, les
 *    joueurs, le deroulement, le systeme), pas comme la base est structuree.
 *    Une rangee d'onglets a plat obligeait a chercher ; une colonne groupee se
 *    parcourt des yeux.
 */
export default function AdminPage() {
  const { t } = useTranslation()
  const { deconnexion, utilisateur } = useSession()
  const [vue, setVue] = useState('reglages')
  const [menuOuvert, setMenuOuvert] = useState(false)

  const sections = [
    {
      titre: t('admin.section_tournoi'),
      entrees: [{ cle: 'reglages', libelle: t('admin.onglet_reglages'), icone: Settings }],
    },
    {
      titre: t('admin.section_joueurs'),
      entrees: [
        { cle: 'participants', libelle: t('admin.onglet_participants'), icone: Users },
        { cle: 'equipes', libelle: t('admin.onglet_equipes'), icone: UsersRound },
      ],
    },
    {
      titre: t('admin.section_deroulement'),
      entrees: [
        { cle: 'simulation', libelle: t('admin.onglet_simulation'), icone: LayoutGrid },
        { cle: 'manches', libelle: t('admin.onglet_manches'), icone: Swords },
        { cle: 'questions', libelle: t('admin.onglet_questions'), icone: HelpCircle },
      ],
    },
    {
      titre: t('admin.section_systeme'),
      entrees: [{ cle: 'acces', libelle: t('admin.onglet_acces'), icone: KeyRound }],
    },
  ]

  const courante = sections.flatMap((s) => s.entrees).find((e) => e.cle === vue)

  const Navigation = () => (
    <nav className="space-y-6">
      {sections.map((s) => (
        <div key={s.titre}>
          <p className="etiquette text-texte-faible px-3 mb-2">{s.titre}</p>
          <div className="space-y-0.5">
            {s.entrees.map((e) => (
              <button key={e.cle} onClick={() => { setVue(e.cle); setMenuOuvert(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left transition-colors',
                  vue === e.cle
                    ? 'bg-neon/10 text-neon border border-neon-sourd'
                    : 'text-texte-doux hover:bg-surface border border-transparent',
                )}>
                <e.icone size={15} />
                {e.libelle}
                {vue === e.cle && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen">
      {/* Barre superieure : contexte global (qui suis-je, sortir), constante. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-bord bg-fond/90 backdrop-blur">
        <button onClick={() => setMenuOuvert(!menuOuvert)} className="lg:hidden text-texte-doux">
          {menuOuvert ? <X size={20} /> : <Menu size={20} />}
        </button>
        <p className="titre font-bold text-neon">HerboQuiz</p>
        <span className="hidden sm:block text-texte-faible">·</span>
        <p className="hidden sm:block text-sm text-texte-doux">{courante?.libelle}</p>

        <div className="ml-auto flex items-center gap-3">
          {/* Aller voir la page publique ne doit pas obliger a se deconnecter. */}
          <Link to="/" title={t('admin.voir_annonce')}
                className="text-texte-faible hover:text-neon transition-colors">
            <Eye size={16} />
          </Link>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-texte-faible">
            <ShieldCheck size={13} className="text-neon-sourd" />
            {utilisateur?.nom}
          </span>
          <button onClick={deconnexion} className="text-texte-faible hover:text-danger transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-6">
        <aside className={cn(
          'lg:block lg:w-56 lg:shrink-0',
          menuOuvert
            ? 'fixed inset-x-0 top-14 bottom-0 z-20 bg-fond p-4 overflow-y-auto anim-glisse'
            : 'hidden',
        )}>
          <Navigation />
        </aside>

        <main className="flex-1 min-w-0 anim-monte" key={vue}>
          {vue === 'reglages' && <VueReglages />}
          {vue === 'participants' && <VueParticipants />}
          {vue === 'equipes' && <VueEquipes />}
          {vue === 'simulation' && <VueSimulation />}
          {vue === 'manches' && <VueManches />}
          {vue === 'questions' && <VueQuestions />}
          {vue === 'acces' && <VueAcces />}
        </main>
      </div>
    </div>
  )
}

function EnTete({ titre, aide }) {
  return (
    <div className="mb-5">
      <h1 className="titre text-2xl font-bold">{titre}</h1>
      {aide && <p className="mt-1 text-sm text-texte-doux leading-relaxed">{aide}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------

function VueReglages() {
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
  const nbModifs = Object.keys(modifs).length

  return (
    <div className="pb-24">
      <EnTete titre={t('admin.onglet_reglages')} />
      <LienInscription />

      {Object.entries(groupes).map(([groupe, reglages]) => (
        <section key={groupe} className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="titre text-lg font-semibold text-neon">
              {t(`admin.groupe.${groupe}`, groupe)}
            </h2>
          </div>
          <p className="text-xs text-texte-faible mb-3">{t(`admin.aide_reglages_groupe.${groupe}`, '')}</p>

          <div className="carte p-5 grid gap-5">
            {reglages.map((r) => (
              <div key={r.cle}>
                <label className="block text-sm font-medium mb-1.5">{r.libelle}</label>

                {r.type === 'markdown' ? (
                  <EditeurTexte valeur={valeurDe(r)} onChange={(v) => setModifs({ ...modifs, [r.cle]: v })} />
                ) : r.type === 'booleen' ? (
                  <Bascule valeur={valeurDe(r) === '1' || valeurDe(r) === true}
                           onChange={(v) => setModifs({ ...modifs, [r.cle]: v ? '1' : '0' })} />
                ) : (
                  <input type={r.type === 'nombre' ? 'number' : 'text'} value={valeurDe(r)}
                         onChange={(e) => setModifs({ ...modifs, [r.cle]: e.target.value })}
                         className={CHAMP} />
                )}

                {r.aide && <p className="mt-1.5 text-xs text-texte-faible leading-relaxed">{r.aide}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Barre d'enregistrement : n'apparait que s'il y a quelque chose a
          enregistrer, et indique combien de champs ont bouge. */}
      {nbModifs > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bord bg-fond/95 backdrop-blur px-4 py-3 anim-monte">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <p className="text-sm text-texte-doux">
              <strong className="text-neon">{nbModifs}</strong> {t('admin.modifications')}
            </p>
            <button onClick={() => setModifs({})} className="ml-auto text-sm text-texte-faible hover:text-texte">
              {t('commun.annuler')}
            </button>
            <button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}
                    className="flex items-center gap-2 rounded-xl bg-neon text-fond font-semibold px-5 py-2.5 halo tape disabled:opacity-50">
              <Check size={16} />
              {t('commun.enregistrer')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Le lien a diffuser dans le groupe.
 *
 * Il etait accessible mais nulle part affiche : il fallait le reconstruire de
 * tete pour le partager. Un bouton de copie evite de le retaper sur un
 * telephone, et une faute d'adresse envoyee a tout le groupe.
 */
function LienInscription() {
  const { t } = useTranslation()
  const [copie, setCopie] = useState(false)
  const lien = `${window.location.origin}/inscription`

  const copier = async () => {
    await navigator.clipboard.writeText(lien)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <div className="carte p-4 mb-6 halo">
      <p className="etiquette text-texte-faible mb-2">{t('admin.lien_inscription')}</p>
      <div className="flex gap-2">
        <input readOnly value={lien} onFocus={(e) => e.target.select()}
               className="flex-1 min-w-0 rounded-xl bg-fond-2 border border-bord px-3 py-2.5 text-sm text-neon outline-none" />
        <button type="button" onClick={copier}
                className={cn('shrink-0 flex items-center gap-2 rounded-xl px-4 font-semibold tape',
                  copie ? 'bg-succes text-fond' : 'bg-neon text-fond')}>
          {copie ? <CheckIcon size={16} /> : <Copy size={16} />}
          <span className="hidden sm:inline">{copie ? t('admin.lien_copie') : t('admin.copier_lien')}</span>
        </button>
      </div>
    </div>
  )
}

function Bascule({ valeur, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!valeur)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        valeur ? 'bg-neon' : 'bg-bord')}>
      <span className={cn('inline-block h-4.5 w-4.5 transform rounded-full bg-fond transition-transform',
        valeur ? 'translate-x-6' : 'translate-x-1')} style={{ height: 18, width: 18 }} />
    </button>
  )
}

// ---------------------------------------------------------------------------

function VueParticipants() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const vide = { nom: '', prenom: '', pseudo: '', telephone: '', confirme: true }
  const [form, setForm] = useState(vide)
  const [fiche, setFiche] = useState(null)

  const { data: liste = [] } = useQuery({ queryKey: QUERY_KEYS.participants, queryFn: participantService.liste })
  const rafraichir = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.participants })

  const creer = useMutation({
    mutationFn: () => participantService.creer(form),
    onSuccess: () => { setForm(vide); rafraichir() },
  })
  const supprimer = useMutation({ mutationFn: participantService.supprimer, onSuccess: rafraichir })

  const confirmes = liste.filter((p) => p.confirme).length

  return (
    <div>
      <EnTete titre={`${t('admin.onglet_participants')} (${confirmes}/${liste.length})`}
              aide={t('admin.aide_confirme')} />
      <EtatChaine />

      <form onSubmit={(e) => { e.preventDefault(); creer.mutate() }} className="carte p-5 mb-6 grid gap-4 sm:grid-cols-2">
        <Champ libelle={t('admin.nom')} requis valeur={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
        <Champ libelle={t('admin.prenom')} valeur={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
        <Champ libelle={t('admin.pseudo')} aide={t('admin.aide_pseudo')} valeur={form.pseudo}
               onChange={(v) => setForm({ ...form, pseudo: v })} />
        <Champ libelle={t('admin.telephone')} valeur={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />

        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <Bascule valeur={form.confirme} onChange={(v) => setForm({ ...form, confirme: v })} />
          {t('admin.confirme')}
        </label>

        <button type="submit" disabled={creer.isPending || !form.nom}
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-40">
          <Plus size={16} />
          {t('admin.nouveau_participant')}
        </button>
      </form>

      {liste.length === 0 ? (
        <Vide message={t('admin.aucun_participant')} />
      ) : (
        <ul className="carte divide-y divide-bord cascade">
          {liste.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', p.confirme ? 'bg-succes' : 'bg-alerte')} />
              <button onClick={() => setFiche(p.id)} title={t('perf.voir_parcours')}
                      className="flex-1 min-w-0 text-left group">
                <p className="truncate group-hover:text-neon transition-colors">{p.nom_affiche}</p>
                <p className="text-xs text-texte-faible truncate">
                  {p.nom_complet}{p.telephone ? ` · ${p.telephone}` : ''}{p.email ? ` · ${p.email}` : ''}
                </p>
              </button>

              <button onClick={() => setFiche(p.id)} title={t('perf.voir_parcours')}
                      className="text-texte-faible hover:text-neon transition-colors shrink-0">
                <BarChart3 size={15} />
              </button>

              {/* Contact direct depuis les informations fournies. Ouvrir le lien
                  sert aussi de verification : un profil qui ne s'ouvre pas est a
                  controler avant de valider l'inscription. */}
              {p.telephone && (
                <a href={`https://wa.me/${String(p.telephone).replace(/\D/g, '')}`}
                   target="_blank" rel="noreferrer" title={t('admin.contacter_whatsapp')}
                   className="text-texte-faible hover:text-succes transition-colors shrink-0">
                  <MessageCircle size={15} />
                </a>
              )}
              {p.lien_facebook && (
                <a href={p.lien_facebook} target="_blank" rel="noreferrer"
                   title={t('admin.contacter_facebook')}
                   className="text-texte-faible hover:text-neon transition-colors shrink-0">
                  <ExternalLink size={15} />
                </a>
              )}

              <button onClick={() => supprimer.mutate(p.id)} className="text-texte-faible hover:text-danger transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FichePerformance participantId={fiche} onFermer={() => setFiche(null)} />
    </div>
  )
}

function Champ({ libelle, valeur, onChange, aide, requis }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {libelle}{requis && <span className="text-neon ml-0.5">*</span>}
      </label>
      <input value={valeur} onChange={(e) => onChange(e.target.value)} className={CHAMP} />
      {aide && <p className="mt-1.5 text-xs text-texte-faible">{aide}</p>}
    </div>
  )
}

function Vide({ message }) {
  return <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{message}</p>
}

// ---------------------------------------------------------------------------

function VueEquipes() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: liste = [] } = useQuery({ queryKey: QUERY_KEYS.equipes, queryFn: equipeService.liste })

  const generer = useMutation({
    mutationFn: equipeService.generer,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.equipes }),
  })

  return (
    <div>
      <EnTete titre={`${t('admin.onglet_equipes')} (${liste.length})`} />
      <EtatChaine />

      <div className="carte p-5 mb-6">
        <p className="font-medium mb-1">{t('admin.generer_equipes')}</p>
        {/* Avertissement explicite : reconstituer efface les equipes, donc les
            points deja attribues partent avec elles. */}
        <p className="text-xs text-alerte mb-4 leading-relaxed">{t('admin.aide_generer')}</p>
        <div className="grid grid-cols-2 gap-3">
          {['solo', 'duo'].map((mode) => (
            <button key={mode} onClick={() => generer.mutate(mode)} disabled={generer.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl border border-bord py-3 tape hover:border-neon disabled:opacity-40">
              <Wand2 size={15} className="text-neon-sourd" />
              {t(`admin.mode_${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <Vide message={t('admin.aucune_equipe')} />
      ) : (
        <ul className="carte divide-y divide-bord cascade">
          {liste.map((e) => <li key={e.id} className="px-4 py-3">{e.libelle}</li>)}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function VueSimulation() {
  const { t } = useTranslation()
  const [effectif, setEffectif] = useState('')
  const [resultat, setResultat] = useState(null)

  // L'effectif reel est la valeur qui compte : on la pre-remplit plutot que de
  // demander a l'administrateur de la retrouver ailleurs. Elle reste modifiable
  // pour eprouver un autre scenario.
  const { data: prep } = useQuery({ queryKey: QUERY_KEYS.preparation, queryFn: preparationService.etat })
  const reel = prep?.participants_confirmes

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

  return (
    <div>
      <EnTete titre={t('admin.onglet_simulation')} aide={t('admin.aide_simulation')} />
      <EtatChaine />

      <BlocTours />

      <div className="carte p-5 mb-6">
        <label className="block text-sm font-medium mb-1.5">{t('admin.effectif')}</label>
        <p className="mb-2 text-xs text-texte-faible">{t('admin.effectif_auto')}</p>
        <div className="flex gap-3">
          <input type="number" min="0" value={effectif === '' ? (reel ?? '') : effectif}
                 onChange={(e) => setEffectif(e.target.value)}
                 className={CHAMP} placeholder="—" />
          <button onClick={() => simuler.mutate()} disabled={simuler.isPending}
                  className="shrink-0 rounded-xl bg-neon text-fond font-semibold px-5 tape disabled:opacity-50">
            {t('admin.simuler')}
          </button>
        </div>
      </div>

      {resultat && (
        <div className="anim-monte">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Stat libelle={t('admin.mode')} valeur={t(`admin.mode_${resultat.mode}`)} accent />
            <Stat libelle={t('admin.poules')} valeur={resultat.nb_poules || '—'} />
            <Stat libelle={t('admin.par_poule')} valeur={resultat.par_poule} />
            <Stat libelle={t('admin.qualifies')} valeur={resultat.qualifies} />
            <Stat libelle={t('admin.tableau')} valeur={resultat.taille_tableau} />
            <Stat libelle={t('admin.questions_conseillees')} valeur={resultat.nb_questions} accent />
          </div>

          <div className="carte p-5">
            <p className="etiquette text-texte-faible mb-2">{t('admin.phases')}</p>
            <div className="flex flex-wrap gap-1.5">
              {resultat.phases.map((p) => (
                <span key={p.nom} className="rounded-lg bg-fond-2 border border-bord px-2.5 py-1 text-sm">
                  {p.nom}
                </span>
              ))}
            </div>

            {resultat.notes.map((n, i) => (
              <p key={i} className="mt-3 text-xs text-texte-doux leading-relaxed border-l-2 border-neon-sourd pl-3">{n}</p>
            ))}

            <button onClick={() => appliquer.mutate()} disabled={appliquer.isPending}
                    className="mt-5 w-full rounded-xl border border-neon-sourd text-neon py-3 tape disabled:opacity-50">
              {appliquer.isSuccess ? t('commun.enregistrer') : t('admin.appliquer')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Enchainement des tours.
 *
 * Le bouton n'est actif que lorsque le tour precedent est reellement termine :
 * generer un tour a partir de classements incomplets produirait de mauvaises
 * affiches, et c'est irrattrapable une fois annonce au groupe.
 */
function BlocTours() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: etat } = useQuery({ queryKey: QUERY_KEYS.phases, queryFn: phaseService.etat })

  const generer = useMutation({
    mutationFn: phaseService.generer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.phases })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.manches })
    },
  })

  if (!etat) return null

  const raison = etat.nb_poules === 0 ? t('admin.pas_de_poules')
    : !etat.poules_terminees && etat.duels_existants === 0 ? t('admin.poules_en_cours')
    : !etat.peut_generer && etat.duels_existants > 0 && !etat.dernier_tour_fini ? t('admin.tour_en_cours')
    : !etat.peut_generer ? t('admin.tournoi_fini')
    : null

  return (
    <div className={cn('carte p-5 mb-6', etat.peut_generer && 'halo')}>
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={15} className="text-neon-sourd" />
        <p className="font-medium">{t('admin.tour_suivant')}</p>
      </div>
      <p className="text-xs text-texte-faible mb-4 leading-relaxed">{t('admin.aide_tours')}</p>

      {etat.tours.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {etat.tours.map((tour) => (
            <span key={tour.ordre}
              className={cn('rounded-lg border px-2.5 py-1 text-xs',
                tour.termine ? 'border-succes/40 text-succes' : 'border-bord text-texte-doux')}>
              {tour.nom} · {tour.matchs}
            </span>
          ))}
        </div>
      )}

      {/* Une egalite parfaite doit se voir AVANT d'annoncer les qualifies au
          groupe : apres, c'est trop tard pour poser un barrage. */}
      {etat.egalites_barrage?.length > 0 && (
        <div className="mb-4 rounded-xl border border-alerte/40 bg-alerte/10 p-4">
          <p className="text-sm font-medium text-alerte">{t('admin.egalite_barrage')}</p>
          <p className="mt-1 text-xs text-texte-doux leading-relaxed">{t('admin.aide_barrage')}</p>
          <ul className="mt-2 text-xs text-texte-doux">
            {etat.egalites_barrage.map((e, i) => (
              <li key={i}>· {e.poule} — {e.points} pts</li>
            ))}
          </ul>
        </div>
      )}

      {etat.peut_generer ? (
        <button onClick={() => generer.mutate()} disabled={generer.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-50">
          {etat.prochain_tour}
          <ArrowRight size={16} />
        </button>
      ) : (
        <p className="text-sm text-texte-doux">{raison}</p>
      )}
    </div>
  )
}

function Stat({ libelle, valeur, accent }) {
  return (
    <div className={cn('carte px-4 py-3', accent && 'halo')}>
      <p className="etiquette text-texte-faible">{libelle}</p>
      <p className={cn('titre mt-1 text-xl font-bold', accent ? 'text-neon' : 'text-texte')}>{valeur}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function VueAcces() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: liste = [] } = useQuery({ queryKey: QUERY_KEYS.acces, queryFn: accesService.liste })

  const regenerer = useMutation({
    mutationFn: accesService.regenerer,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.acces }),
  })

  return (
    <div>
      <EnTete titre={t('admin.onglet_acces')} aide={t('admin.aide_regenerer')} />

      <div className="grid gap-3 sm:grid-cols-2">
        {liste.map((a) => (
          <div key={a.id} className={cn('carte p-5', a.role === 'admin' && 'halo')}>
            <p className="etiquette text-texte-faible">
              {a.role === 'admin' ? t('admin.code_admin') : t('admin.code_modo')}
            </p>
            <p className="titre my-3 text-3xl font-bold tracking-[0.2em] text-neon">{a.code_clair}</p>
            <button
              onClick={() => { if (confirm(t('admin.confirmer_regenerer'))) regenerer.mutate(a.id) }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-bord py-2.5 text-sm tape hover:border-neon">
              <RefreshCw size={14} />
              {t('admin.regenerer')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
