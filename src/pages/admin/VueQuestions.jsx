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
  const [mancheId, setMancheId] = useState('banque')
  const [selection, setSelection] = useState([])
  const [cible, setCible] = useState('')
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
  const analyserLot = () => {
    const valides = []
    const rejetees = []

    lot.split('\n').forEach((ligne, i) => {
      if (!ligne.trim()) return

      // Plusieurs separateurs acceptes : on recopie souvent depuis un tableur
      // ou un document, ou la tabulation et le point-virgule sont courants.
      const sep = ['|', '\t', ';'].find((c) => ligne.includes(c))
      if (!sep) { rejetees.push({ n: i + 1, texte: ligne.trim() }); return }

      const [avant, ...apres] = ligne.split(sep)
      const texte = avant.trim()
      const reponse = apres.join(sep).trim()

      // Une question sans reponse ne sert a rien en direct : l'animateur ne
      // saurait pas quoi valider. On la signale au lieu de la jeter en silence.
      if (!texte || !reponse) { rejetees.push({ n: i + 1, texte: ligne.trim() }); return }

      valides.push({ texte, reponse })
    })

    return { valides, rejetees }
  }

  const importer = useMutation({
    mutationFn: () => questionService.creerLot(mancheId, analyserLot().valides),
    onSuccess: () => { setLot(''); setModeLot(false); rafraichir() },
  })

  const supprimer = useMutation({ mutationFn: questionService.supprimer, onSuccess: rafraichir })

  const affecter = useMutation({
    mutationFn: () => questionService.affecter(cible, selection),
    onSuccess: () => { setSelection([]); setCible(''); rafraichir() },
  })

  const { valides, rejetees } = analyserLot()

  return (
    <div>
      <div className="mb-5">
        <h1 className="titre text-2xl font-bold">{t('admin.onglet_questions')}</h1>
        <p className="mt-1 text-sm text-texte-doux leading-relaxed">{t('admin.aide_questions')}</p>
      </div>

      <div className="carte p-5 mb-6">
        <label className="block text-sm font-medium mb-1.5">{t('admin.choisir_manche_questions')}</label>
        <select value={mancheId} onChange={(e) => { setMancheId(e.target.value); setSelection([]) }} className={CHAMP}>
          <option value="banque">{t('admin.banque')}</option>
          {manches.map((m) => (
            <option key={m.id} value={m.id}>{m.libelle}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-texte-faible">{t('admin.aide_choix_manche')}</p>
      </div>

      {(
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
              <p className="text-xs text-texte-faible mb-2 leading-relaxed">{t('admin.aide_format')}</p>
              <pre className="mb-3 rounded-lg bg-fond-2 border border-bord p-3 text-[11px] text-texte-doux overflow-x-auto whitespace-pre">{t('admin.exemple_format')}</pre>

              <textarea rows={8} value={lot} onChange={(e) => setLot(e.target.value)}
                        className={CHAMP + ' resize-y leading-relaxed'} />

              {/* Compte-rendu AVANT l'import. Sans lui, une ligne mal formee
                  disparaissait sans un mot : on croyait avoir importe vingt
                  questions, il y en avait dix-huit. */}
              {lot.trim() && (
                <div className="mt-3 text-xs">
                  {valides.length > 0 && (
                    <p className="text-succes">
                      <strong>{valides.length}</strong> {t('admin.lignes_valides')}
                    </p>
                  )}
                  {rejetees.length > 0 && (
                    <div className="mt-2 rounded-lg border border-alerte/40 bg-alerte/10 p-3">
                      <p className="text-alerte">
                        <strong>{rejetees.length}</strong> {t('admin.lignes_ignorees')}
                      </p>
                      <ul className="mt-1.5 space-y-0.5 text-texte-doux">
                        {rejetees.slice(0, 6).map((r) => (
                          <li key={r.n} className="truncate">ligne {r.n} : « {r.texte} »</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-texte-faible">{t('admin.corriger_lignes')}</p>
                    </div>
                  )}
                  {valides.length === 0 && rejetees.length === 0 && (
                    <p className="text-texte-faible">{t('admin.rien_a_importer')}</p>
                  )}
                </div>
              )}

              <button onClick={() => importer.mutate()} disabled={!valides.length || importer.isPending}
                      className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-40">
                <Check size={16} />
                {t('admin.importer')} {valides.length > 0 && `(${valides.length})`}
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

          {/* Rattachement depuis la banque : c'est le moment ou l'on decide
              quelles questions partent dans quelle manche. */}
          {mancheId === 'banque' && selection.length > 0 && (
            <div className="carte p-4 mb-3 halo">
              <p className="text-sm mb-2">
                <strong className="text-neon">{selection.length}</strong> {t('admin.selection')}
              </p>
              {manches.length === 0 ? (
                <p className="text-xs text-alerte">{t('admin.aucune_manche_dispo')}</p>
              ) : (
                <div className="flex gap-2">
                  <select value={cible} onChange={(e) => setCible(e.target.value)} className={CHAMP}>
                    <option value="">{t('admin.affecter_a')}</option>
                    {manches.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                  </select>
                  <button disabled={!cible || affecter.isPending}
                          onClick={() => affecter.mutate()}
                          className="shrink-0 rounded-xl bg-neon text-fond font-semibold px-4 tape disabled:opacity-40">
                    {t('admin.affecter')}
                  </button>
                </div>
              )}
            </div>
          )}

          {questions.length === 0 ? (
            <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{t('admin.aucune_question')}</p>
          ) : (
            <ol className="carte divide-y divide-bord cascade">
              {questions.map((q, i) => (
                <li key={q.id} className="flex gap-3 px-4 py-3">
                  <span className="titre text-neon-sourd font-bold tabular-nums shrink-0">{i + 1}</span>
                  {mancheId === 'banque' && (
                    <input type="checkbox" className="accent-neon mt-1 shrink-0"
                           checked={selection.includes(q.id)}
                           onChange={() => setSelection((s) => s.includes(q.id)
                             ? s.filter((x) => x !== q.id) : [...s, q.id])} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{q.texte}</p>
                    <p className="text-xs text-neon-fort mt-0.5">{q.reponse}</p>
                    {q.propose_par && (
                      <p className="text-[10px] text-texte-faible mt-0.5">
                        {t('admin.propose_par')} {q.propose_par}
                      </p>
                    )}
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
