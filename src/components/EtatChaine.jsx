import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, TriangleAlert, Info } from 'lucide-react'
import { preparationService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

/**
 * Bandeau de coherence, affiche en tete des ecrans Participants, Equipes et
 * Format.
 *
 * Ces trois ecrans dependent l'un de l'autre mais fonctionnaient isolement :
 * un inscrit ajoute apres la constitution des equipes restait sans equipe, en
 * silence, et on ne le decouvrait que le soir du match. Le bandeau montre la
 * chaine entiere et signale ce qui ne suit plus.
 */
export default function EtatChaine() {
  const { t } = useTranslation()
  const { data } = useQuery({ queryKey: QUERY_KEYS.preparation, queryFn: preparationService.etat })

  if (!data) return null

  const etapes = [
    [data.participants_confirmes, t('admin.chaine_inscrits')],
    [data.equipes, t('admin.chaine_equipes')],
    [data.poules, t('admin.chaine_poules')],
    [data.manches_poule, t('admin.chaine_manches')],
  ]

  return (
    <div className="carte p-4 mb-5">
      <p className="etiquette text-texte-faible mb-3">{t('admin.chaine')}</p>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {etapes.map(([valeur, libelle], i) => (
          <div key={libelle} className="flex items-center gap-1 shrink-0">
            <div className={cn('rounded-lg px-3 py-2 text-center min-w-[4.5rem]',
              valeur > 0 ? 'bg-neon/10 border border-neon-sourd' : 'bg-fond-2 border border-bord')}>
              <p className={cn('titre text-lg font-bold leading-none',
                valeur > 0 ? 'text-neon' : 'text-texte-faible')}>{valeur}</p>
              <p className="mt-0.5 text-[10px] text-texte-faible">{libelle}</p>
            </div>
            {i < etapes.length - 1 && <ArrowRight size={13} className="text-texte-faible shrink-0" />}
          </div>
        ))}
      </div>

      {data.alertes.map((a) => (
        <p key={a.cle} className={cn('mt-3 flex items-start gap-2 text-xs leading-relaxed',
          a.gravite === 'alerte' ? 'text-alerte' : 'text-texte-doux')}>
          {a.gravite === 'alerte' ? <TriangleAlert size={13} className="shrink-0 mt-0.5" />
                                  : <Info size={13} className="shrink-0 mt-0.5" />}
          <span>
            {t(`admin.alerte_${a.cle}`, { nombre: a.nombre })}
            {a.noms?.length > 0 && <span className="text-texte-faible"> ({a.noms.join(', ')})</span>}
          </span>
        </p>
      ))}

      <p className="mt-3 pt-3 border-t border-bord text-xs text-texte-doux">
        {t(`admin.etape_${data.prochaine_etape}`)}
      </p>
    </div>
  )
}
