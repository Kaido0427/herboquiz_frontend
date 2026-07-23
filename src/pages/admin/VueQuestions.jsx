import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ClipboardPaste, Check } from 'lucide-react'
import { mancheService, questionService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

const CHAMP = 'w-full rounded-xl bg-fond-2 border border-bord px-3 py-2.5 outline-none focus:border-neon transition-colors'

/**
 * Preparation des questions, manche par manche.
 *
 * C'est ce qui rend l'ecran d'animation possible : le jour du match, tout est
 * deja saisi et l'animateur n'a plus qu'a enchainer. Deux facons d'entrer les
 * questions, parce que les deux usages existent : une par une quand on les
 * ecrit au fil de l'eau, ou par lot quand on les a deja redigees ailleurs.
 */
export default function VueQuestions() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [mancheId, setMancheId] = useState('')
  const [ligne, setLigne] = useState({ texte: '', reponse: '' })
  const [lot, setLot] = useState('')
  const [modeLot, setModeLot] = useState(false)

  const { data: manches = [] } = useQuery({ queryKey: QUERY_KEYS.manches, queryFn: mancheService.liste })
  const { data: questions = [] } = useQuery({
    queryKey: QUERY_KEYS.questions(mancheId),
    queryFn: () => questionService.liste(mancheId),
    enabled: !!mancheId,
  })

  const rafraichir = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.questions(mancheId) })

  const ajouter = useMutation({
    mutationFn: () => questionService.creerLot(mancheId, [ligne]),
    onSuccess: () => { setLigne({ texte: '', reponse: '' }); rafraichir() },
  })

  /**
   * Import par lot : « question | reponse » par ligne. Les lignes mal formees
   * sont ignorees plutot que de faire echouer tout l'import — on prefere
   * importer 18 questions sur 20 et signaler, que de tout rejeter.
   */
  const analyserLot = () => lot
    .split('\n')
    .map((l) => l.split('|'))
    .filter((p) => p.length >= 2 && p[0].trim() && p[1].trim())
    .map((p) => ({ texte: p[0].trim(), reponse: p.slice(1).join('|').trim() }))

  const importer = useMutation({
    mutationFn: () => questionService.creerLot(mancheId, analyserLot()),
    onSuccess: () => { setLot(''); setModeLot(false); rafraichir() },
  })

  const supprimer = useMutation({ mutationFn: questionService.supprimer, onSuccess: rafraichir })

  const valides = analyserLot().length

  return (
    <div>
      <div className="mb-5">
        <h1 className="titre text-2xl font-bold">{t('admin.onglet_questions')}</h1>
        <p className="mt-1 text-sm text-texte-doux leading-relaxed">{t('admin.aide_questions')}</p>
      </div>

      <div className="carte p-5 mb-6">
        <label className="block text-sm font-medium mb-1.5">{t('admin.choisir_manche_questions')}</label>
        <select value={mancheId} onChange={(e) => setMancheId(e.target.value)} className={CHAMP}>
          <option value="">{t('admin.selectionner')}</option>
          {manches.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </select>
      </div>

      {mancheId && (
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setModeLot(false)}
              className={cn('flex-1 rounded-xl border py-2.5 text-sm tape',
                !modeLot ? 'border-neon text-neon bg-neon/5' : 'border-bord text-texte-doux')}>
              {t('admin.ajouter_ligne')}
            </button>
            <button onClick={() => setModeLot(true)}
              className={cn('flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm tape',
                modeLot ? 'border-neon text-neon bg-neon/5' : 'border-bord text-texte-doux')}>
              <ClipboardPaste size={14} />
              {t('admin.coller_lot')}
            </button>
          </div>

          {modeLot ? (
            <div className="carte p-5 mb-6">
              <p className="text-xs text-texte-faible mb-3 leading-relaxed">{t('admin.aide_coller')}</p>
              <textarea rows={8} value={lot} onChange={(e) => setLot(e.target.value)}
                        className={CHAMP + ' resize-y leading-relaxed'} />
              <button onClick={() => importer.mutate()} disabled={!valides || importer.isPending}
                      className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-40">
                <Check size={16} />
                {t('admin.importer')} {valides > 0 && `(${valides})`}
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); ajouter.mutate() }} className="carte p-5 mb-6 grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('admin.texte_question')}</label>
                <textarea rows={2} value={ligne.texte} onChange={(e) => setLigne({ ...ligne, texte: e.target.value })}
                          className={CHAMP + ' resize-y'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('admin.reponse')}</label>
                <input value={ligne.reponse} onChange={(e) => setLigne({ ...ligne, reponse: e.target.value })}
                       className={CHAMP} />
              </div>
              <button type="submit" disabled={!ligne.texte || !ligne.reponse || ajouter.isPending}
                      className="flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-40">
                <Plus size={16} />
                {t('admin.ajouter_ligne')}
              </button>
            </form>
          )}

          <p className="etiquette text-texte-faible mb-2">
            {questions.length} {t('admin.questions_prep')}
          </p>

          {questions.length === 0 ? (
            <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{t('admin.aucune_question')}</p>
          ) : (
            <ol className="carte divide-y divide-bord cascade">
              {questions.map((q, i) => (
                <li key={q.id} className="flex gap-3 px-4 py-3">
                  <span className="titre text-neon-sourd font-bold tabular-nums shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{q.texte}</p>
                    <p className="text-xs text-neon-fort mt-0.5">{q.reponse}</p>
                  </div>
                  <button onClick={() => supprimer.mutate(q.id)} title={t('admin.supprimer_question')}
                          className="text-texte-faible hover:text-danger transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
