import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Undo2, Flag, ChevronLeft, Trophy, MinusCircle } from 'lucide-react'
import { animationService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

/**
 * L'ecran qui justifie toute l'application.
 *
 * Contexte reel : l'animateur est sur son telephone, dans un groupe Messenger
 * qui attend, et il doit enchainer question apres question. Tout ici est plie
 * a deux gestes et rien de plus :
 *   1. copier la question pour la coller dans le groupe,
 *   2. taper sur celui qui a trouve.
 *
 * Aucune saisie, aucun menu, aucune confirmation. Les cibles sont larges parce
 * qu'on tape vite et a une main.
 */
export default function AnimationPage() {
  const { t } = useTranslation()
  const { mancheId } = useParams()
  const qc = useQueryClient()
  const [copie, setCopie] = useState(false)
  // Ce qui vient d'etre valide, affiche un instant avant la suite.
  const [flash, setFlash] = useState(null)
  const [transition, setTransition] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.animation(mancheId),
    queryFn: () => animationService.vue(mancheId),
    // Deux animateurs peuvent tenir deux poules en parallele : on rafraichit
    // pour ne pas travailler sur un classement perime.
    refetchInterval: 15000,
  })

  const rafraichir = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.animation(mancheId) })

  /**
   * Attribution avec un temps de respiration.
   *
   * Sans lui, l'ecran sautait a la question suivante dans la milliseconde :
   * l'animateur ne voyait pas ce qu'il venait de valider et ne savait pas si
   * son appui avait ete pris. On affiche donc le point marque, puis on
   * enchaine — le delai est court, mais il change tout.
   */
  const attribuer = useMutation({
    mutationFn: (equipe) =>
      animationService.attribuer(mancheId, {
        equipe_id: equipe?.id ?? null,
        question_id: data?.question?.id ?? null,
      }),
    onMutate: (equipe) => {
      setFlash(equipe ? { libelle: equipe.libelle } : { aucun: true })
      setTransition(true)
    },
    onSuccess: () => {
      // On laisse le retour visible avant de basculer sur la suite.
      setTimeout(() => {
        rafraichir()
        setFlash(null)
        setTimeout(() => setTransition(false), 60)
      }, 1100)
    },
    onError: () => { setFlash(null); setTransition(false) },
  })

  const annuler = useMutation({
    mutationFn: () => animationService.annuler(mancheId),
    onSuccess: rafraichir,
  })

  const terminer = useMutation({
    mutationFn: () => animationService.terminer(mancheId),
    onSuccess: rafraichir,
  })

  const copierQuestion = async () => {
    if (!data?.question) return
    await navigator.clipboard.writeText(data.question.texte)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  if (isLoading) {
    return <p className="p-6 text-texte-doux">{t('commun.chargement')}</p>
  }

  const { manche, question, equipes, classement } = data
  const scores = Object.fromEntries(classement.map((c) => [c.equipe_id, c.points]))
  const enCours = attribuer.isPending || annuler.isPending || transition

  return (
    <div className="min-h-screen pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-bord">
        <Link to="/animation" className="text-texte-faible hover:text-texte" aria-label={t('commun.retour')}>
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <p className="font-semibold truncate">{manche.libelle}</p>
          <p className="text-xs text-texte-faible">
            {t('animation.question')} {Math.min(manche.question_courante + 1, manche.nb_questions)}{' '}
            {t('animation.sur')} {manche.nb_questions}
          </p>
        </div>
      </header>

      {/* Retour d'action : ce qui vient d'etre valide, visible le temps qu'il
          faut pour en etre sur. */}
      {flash && (
        <div className="fixed inset-x-0 top-1/3 z-40 px-6 pointer-events-none">
          <div className={cn('anim-eclat mx-auto max-w-sm rounded-2xl border px-5 py-4 text-center backdrop-blur',
            flash.aucun
              ? 'border-bord bg-surface/95'
              : 'border-neon-sourd bg-surface/95 halo')}>
            {flash.aucun ? (
              <>
                <MinusCircle size={22} className="mx-auto text-texte-faible" />
                <p className="mt-2 text-sm text-texte-doux">{t('animation.aucun_point')}</p>
              </>
            ) : (
              <>
                <Trophy size={22} className="mx-auto text-neon" />
                <p className="titre mt-2 text-xl font-bold truncate">{flash.libelle}</p>
                <p className="text-sm text-neon">{t('animation.a_marque')}</p>
              </>
            )}
          </div>
        </div>
      )}

      {question ? (
        <section className={cn('px-4 pt-5', transition ? 'anim-sort-gauche' : 'anim-entre-droite')}
                 key={manche.question_courante}>
          {/* La question, et le bouton qui evite de la retaper dans Messenger.
              C'est le geste qui fait gagner le plus de temps sur la soiree. */}
          <div className="rounded-2xl bg-surface border border-bord p-4">
            <p className="text-lg leading-snug">{question.texte}</p>

            <button
              type="button"
              onClick={copierQuestion}
              className={cn(
                'mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors',
                copie ? 'bg-succes text-fond' : 'bg-neon text-fond halo-neon',
              )}
            >
              {copie ? <Check size={18} /> : <Copy size={18} />}
              {copie ? t('animation.question_copiee') : t('animation.copier_question')}
            </button>

            <p className="mt-4 text-xs uppercase tracking-widest text-texte-faible">
              {t('animation.reponse_attendue')}
            </p>
            <p className="text-neon-fort font-semibold">{question.reponse}</p>
          </div>

          <p className="mt-6 mb-2 text-sm text-texte-doux">{t('animation.qui_a_trouve')}</p>

          {/* Cibles larges : on tape vite, a une main, sans regarder. */}
          <div className="grid gap-2">
            {equipes.map((e) => (
              <button
                key={e.id}
                type="button"
                disabled={enCours}
                onClick={() => attribuer.mutate(e)}
                className="flex items-center justify-between rounded-xl bg-surface-haute border border-bord px-4 py-4 text-left active:border-neon disabled:opacity-50"
              >
                <span className="font-medium">{e.libelle}</span>
                <span className="text-neon font-bold tabular-nums">{scores[e.id] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Cas frequent : la question tombe a plat. Il ne doit pas quitter l'ecran. */}
          <button
            type="button"
            disabled={enCours}
            onClick={() => attribuer.mutate(null)}
            className="mt-3 w-full rounded-xl border border-bord py-3 text-texte-doux disabled:opacity-50"
          >
            {t('animation.personne')}
          </button>
        </section>
      ) : (
        <p className="px-4 pt-8 text-texte-doux">{t('animation.aucune_question')}</p>
      )}

      <section className="px-4 pt-8">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={enCours}
            onClick={() => annuler.mutate()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-bord py-3 text-texte-doux disabled:opacity-50"
          >
            <Undo2 size={16} />
            {t('animation.annuler_dernier')}
          </button>
          <button
            type="button"
            onClick={() => terminer.mutate()}
            className="flex items-center justify-center gap-2 rounded-xl border border-bord px-4 text-texte-doux"
          >
            <Flag size={16} />
            {t('animation.terminer')}
          </button>
        </div>

        <p className="mt-8 mb-2 text-sm text-texte-doux">{t('animation.classement')}</p>
        <ol className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
          {classement.map((c, i) => (
            <li key={c.equipe_id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-texte-faible tabular-nums">{i + 1}</span>
              <span className="flex-1 truncate">{c.libelle}</span>
              <span className={cn('font-bold tabular-nums', i === 0 ? 'text-neon' : 'text-texte-doux')}>
                {c.points}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
