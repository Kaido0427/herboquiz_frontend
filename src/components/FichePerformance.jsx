import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { X, Trophy, Target, Swords, History, UsersRound, MessageCircle, ExternalLink, Mail, Phone } from 'lucide-react'
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

            {/* Contact regroupe ici plutot qu'entasse dans la liste : on ouvre
                la fiche de quelqu'un quand on veut le joindre, pas en parcourant
                dix lignes. Ce qui manque est dit explicitement, au lieu de
                laisser un trou qu'on prend pour un defaut d'affichage. */}
            <div className="carte p-4 mb-5">
              <p className="etiquette text-texte-faible mb-3">{t('perf.contact')}</p>

              <div className="grid gap-2">
                {data.participant.telephone ? (
                  <a href={`https://wa.me/${String(data.participant.telephone).replace(/\D/g, '')}`}
                     target="_blank" rel="noreferrer"
                     className="flex items-center gap-3 rounded-xl border border-bord px-3 py-2.5 tape hover:border-succes">
                    <MessageCircle size={16} className="text-succes shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm">{data.participant.telephone}</span>
                    <span className="text-xs text-texte-faible">{t('perf.whatsapp')}</span>
                  </a>
                ) : (
                  <p className="flex items-center gap-3 px-3 py-2.5 text-sm text-texte-faible">
                    <Phone size={16} className="shrink-0" />
                    {t('perf.telephone')} — {t('perf.non_fourni')}
                  </p>
                )}

                {data.participant.lien_facebook ? (
                  <a href={data.participant.lien_facebook} target="_blank" rel="noreferrer"
                     className="flex items-center gap-3 rounded-xl border border-bord px-3 py-2.5 tape hover:border-neon">
                    <ExternalLink size={16} className="text-neon shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm">{t('perf.facebook')}</span>
                  </a>
                ) : (
                  <p className="flex items-center gap-3 px-3 py-2.5 text-sm text-texte-faible">
                    <ExternalLink size={16} className="shrink-0" />
                    {t('perf.facebook')} — {t('perf.non_fourni')}
                  </p>
                )}

                {data.participant.email ? (
                  <a href={`mailto:${data.participant.email}`}
                     className="flex items-center gap-3 rounded-xl border border-bord px-3 py-2.5 tape hover:border-neon">
                    <Mail size={16} className="text-texte-doux shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm">{data.participant.email}</span>
                  </a>
                ) : (
                  <p className="flex items-center gap-3 px-3 py-2.5 text-sm text-texte-faible">
                    <Mail size={16} className="shrink-0" />
                    {t('perf.email')} — {t('perf.non_fourni')}
                  </p>
                )}
              </div>

              <p className="mt-3 pt-3 border-t border-bord text-xs text-texte-faible">
                {data.participant.auto_inscrit ? t('perf.inscrit_lui_meme') : t('perf.saisi_par_admin')}
              </p>
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
