import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { mancheService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'

/** L'animateur choisit la manche qu'il va tenir. */
export default function ChoixManchePage() {
  const { t } = useTranslation()
  const { data: manches = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.manches,
    queryFn: mancheService.liste,
  })

  if (isLoading) return <p className="p-6 text-texte-doux">{t('commun.chargement')}</p>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t('animation.choisir_manche')}</h1>
      {manches.length === 0 ? (
        <p className="text-texte-doux">{t('animation.aucune_manche')}</p>
      ) : (
        <div className="grid gap-2">
          {manches.map((m) => (
            <Link key={m.id} to={`/animation/${m.id}`}
                  className="flex items-center justify-between rounded-xl bg-surface border border-bord px-4 py-4">
              <div>
                <p className="font-medium">{m.libelle}</p>
                <p className="text-xs text-texte-faible">{t(`admin.type_${m.type}`)} · {m.statut}</p>
              </div>
              <Play size={18} className="text-neon" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
