import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { X, Trophy, Target, Swords, History, UsersRound } from 'lucide-react'
import { performanceService } from '@/services/herboquizService'
import { cn } from '@/utils/cn'

/**
 * Parcours d'un participant.
 *
 * Les chiffres se deduisent du journal des points, jamais d'un total stocke :
 * ils ne peuvent donc pas diverger du classement affiche ailleurs. Le journal
 * detaille est la pour repondre a « qui m'a enleve ce point ? » sans que
 * personne ait a se souvenir.
 */
export default function FichePerformance({ participantId, onFermer }) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['performances', participantId],
    queryFn: () => performanceService.show(participantId),
    enabled: !!participantId,
  })

  if (!participantId) return null

  return (
    <div className="fixed inset-0 z-50 bg-fond/95 backdrop-blur overflow-y-auto anim-monte">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <p className="etiquette text-texte-faible anim-pulse">{t('commun.chargement')}</p>
            ) : (
              <>
                <p className="etiquette text-neon-sourd">{t('perf.titre')}</p>
                <h2 className="titre text-2xl font-bold truncate">{data.participant.nom_affiche}</h2>
                {data.participant.nom_complet !== data.participant.nom_affiche && (
                  <p className="text-sm text-texte-faible truncate">{data.participant.nom_complet}</p>
                )}
              </>
            )}
          </div>
          <button onClick={onFermer} className="shrink-0 w-9 h-9 grid place-items-center rounded-lg text-texte-doux hover:text-ink hover:bg-surface">
            <X size={18} />
          </button>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <Chiffre icone={Trophy} valeur={data.total_points} libelle={t('perf.points')} accent />
              <Chiffre icone={Target} valeur={data.bonnes_reponses} libelle={t('perf.bonnes_reponses')} />
              <Chiffre icone={Swords} valeur={data.manches_jouees} libelle={t('perf.manches')} />
            </div>

            {data.equipes.length > 0 && (
              <div className="carte p-4 mb-5">
                <p className="etiquette text-texte-faible mb-2">
                  <UsersRound size={12} className="inline mr-1" />
                  {t('perf.equipe')}
                </p>
                {data.equipes.map((e, i) => (
                  <p key={i} className="text-sm">
                    {e.libelle}
                    {e.coequipier.length > 0 && (
                      <span className="text-texte-faible"> — {t('perf.avec')} {e.coequipier.join(', ')}</span>
                    )}
                  </p>
                ))}
              </div>
            )}

            {data.manches.length === 0 ? (
              <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{t('perf.rien_joue')}</p>
            ) : (
              <>
                <p className="etiquette text-texte-faible mb-2">{t('perf.par_manche')}</p>
                <ul className="carte divide-y divide-bord mb-5 cascade">
                  {data.manches.map((m, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-3">
                      {m.rang && (
                        <span className={cn('titre w-7 text-center font-bold tabular-nums',
                          m.rang === 1 ? 'text-or' : m.rang === 2 ? 'text-argent'
                          : m.rang === 3 ? 'text-bronze' : 'text-texte-faible')}>
                          {m.rang}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">{m.manche}</p>
                        <p className="text-xs text-texte-faible">
                          {m.bonnes_reponses} {t('perf.bonnes_reponses_court')}
                        </p>
                      </div>
                      <span className="titre font-bold text-neon tabular-nums">{m.points}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {data.journal.length > 0 && (
              <>
                <p className="etiquette text-texte-faible mb-2">
                  <History size={12} className="inline mr-1" />
                  {t('perf.journal')}
                </p>
                <p className="text-xs text-texte-faible mb-2 leading-relaxed">{t('perf.aide_journal')}</p>
                <ul className="carte divide-y divide-bord text-sm">
                  {data.journal.map((j, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-neon tabular-nums shrink-0">+{j.points}</span>
                      <span className="flex-1 truncate text-texte-doux">{j.manche}</span>
                      <span className="text-xs text-texte-faible truncate">{j.attribue_par}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Chiffre({ icone: Icone, valeur, libelle, accent }) {
  return (
    <div className={cn('carte px-3 py-3 text-center', accent && 'halo')}>
      <Icone size={14} className={cn('mx-auto', accent ? 'text-neon' : 'text-texte-faible')} />
      <p className={cn('titre mt-1 text-2xl font-bold leading-none', accent ? 'text-neon' : 'text-texte')}>
        {valeur}
      </p>
      <p className="mt-1 text-[10px] text-texte-faible">{libelle}</p>
    </div>
  )
}
