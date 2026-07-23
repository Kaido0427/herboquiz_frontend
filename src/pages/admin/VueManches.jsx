import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Swords, Users } from 'lucide-react'
import { mancheService, equipeService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

const CHAMP = 'w-full rounded-xl bg-fond-2 border border-bord px-3 py-2.5 outline-none focus:border-neon transition-colors'

/**
 * Creation et suivi des manches.
 *
 * Deux natures differentes derriere un meme ecran : une manche de poule se
 * joue sur un nombre de questions fixe, un duel s'arrete des qu'un joueur
 * atteint le score cible. Le formulaire n'affiche donc que le champ qui a un
 * sens pour le type choisi, plutot que de laisser un champ inerte a l'ecran.
 */
export default function VueManches() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const vide = { libelle: '', type: 'poule', nb_questions_prevu: 15, score_cible: 5, equipes: [] }
  const [form, setForm] = useState(vide)

  const { data: manches = [] } = useQuery({ queryKey: QUERY_KEYS.manches, queryFn: mancheService.liste })
  const { data: equipes = [] } = useQuery({ queryKey: QUERY_KEYS.equipes, queryFn: equipeService.liste })

  const rafraichir = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.manches })

  const creer = useMutation({
    mutationFn: () => mancheService.creer({
      libelle: form.libelle,
      type: form.type,
      nb_questions_prevu: Number(form.nb_questions_prevu),
      // Le score cible ne concerne que les duels : l'envoyer sur une poule
      // ferait croire a une regle qui n'existe pas.
      score_cible: form.type === 'duel' ? Number(form.score_cible) : null,
      equipes: form.equipes,
    }),
    onSuccess: () => { setForm(vide); rafraichir() },
  })

  const supprimer = useMutation({ mutationFn: mancheService.supprimer, onSuccess: rafraichir })

  const basculerEquipe = (id) => setForm((f) => ({
    ...f,
    equipes: f.equipes.includes(id) ? f.equipes.filter((x) => x !== id) : [...f.equipes, id],
  }))

  const statutCouleur = { a_venir: 'bg-neon-sourd', en_cours: 'bg-danger anim-pulse', terminee: 'bg-texte-faible' }

  return (
    <div>
      <div className="mb-5">
        <h1 className="titre text-2xl font-bold">{t('admin.onglet_manches')}</h1>
        <p className="mt-1 text-sm text-texte-doux leading-relaxed">{t('admin.aide_manche')}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); creer.mutate() }} className="carte p-5 mb-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('admin.libelle')}<span className="text-neon ml-0.5">*</span>
            </label>
            <input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                   className={CHAMP} placeholder="Poule A" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('admin.type')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[['poule', Users], ['duel', Swords]].map(([type, Icone]) => (
                <button key={type} type="button" onClick={() => setForm({ ...form, type })}
                  className={cn('flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm tape',
                    form.type === type ? 'border-neon text-neon bg-neon/5' : 'border-bord text-texte-doux')}>
                  <Icone size={15} />
                  {t(`admin.type_${type}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {form.type === 'poule' ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('admin.nb_questions')}</label>
            <input type="number" min="1" max="100" value={form.nb_questions_prevu}
                   onChange={(e) => setForm({ ...form, nb_questions_prevu: e.target.value })} className={CHAMP} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('admin.score_cible')}</label>
            <input type="number" min="1" max="50" value={form.score_cible}
                   onChange={(e) => setForm({ ...form, score_cible: e.target.value })} className={CHAMP} />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('admin.choisir_equipes')}
            {form.equipes.length > 0 && (
              <span className="ml-2 text-neon">{form.equipes.length} {t('admin.equipes_affectees')}</span>
            )}
          </label>
          {equipes.length === 0 ? (
            <p className="text-sm text-texte-faible">{t('admin.aucune_equipe')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {equipes.map((e) => (
                <button key={e.id} type="button" onClick={() => basculerEquipe(e.id)}
                  className={cn('rounded-lg border px-2.5 py-1.5 text-sm tape',
                    form.equipes.includes(e.id)
                      ? 'border-neon text-neon bg-neon/10'
                      : 'border-bord text-texte-doux')}>
                  {e.libelle}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={creer.isPending || !form.libelle || form.equipes.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3 tape disabled:opacity-40">
          <Plus size={16} />
          {t('admin.creer_manche')}
        </button>
      </form>

      {manches.length === 0 ? (
        <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{t('admin.aucune_manche_creer')}</p>
      ) : (
        <ul className="carte divide-y divide-bord cascade">
          {manches.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statutCouleur[m.statut])} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{m.libelle}</p>
                <p className="text-xs text-texte-faible">
                  {t(`admin.type_${m.type}`)} · {m.equipes?.length ?? 0} {t('admin.equipes_affectees')}
                  {m.type === 'duel' ? ` · ${m.score_cible} pts` : ` · ${m.nb_questions_prevu} q.`}
                </p>
              </div>
              <span className="etiquette text-texte-faible hidden sm:block">
                {t(`admin.manche_${m.statut}`)}
              </span>
              <button onClick={() => supprimer.mutate(m.id)} className="text-texte-faible hover:text-danger transition-colors">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
