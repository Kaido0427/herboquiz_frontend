import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/contexts/SessionContext'
import { useQuery } from '@tanstack/react-query'
import { Play, FileText, LogOut, ShieldCheck } from 'lucide-react'
import { mancheService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'

/** L'animateur choisit la manche qu'il va tenir. */
export default function ChoixManchePage() {
  const { t } = useTranslation()
  const { deconnexion, estAdmin } = useSession()
  const { data: manches = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.manches,
    queryFn: mancheService.liste,
  })

  if (isLoading) return <p className="p-6 text-texte-doux">{t('commun.chargement')}</p>

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="titre text-2xl font-bold flex-1">{t('animation.choisir_manche')}</h1>
        {/* Reserve a l'admin : un animateur n'a pas d'espace admin ou revenir. */}
        {estAdmin && (
          <Link to="/admin" title={t('nav.vers_admin')}
                className="flex items-center gap-1.5 rounded-lg border border-neon-sourd text-neon px-2.5 py-1.5 text-xs tape hover:bg-neon/10 transition-colors">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">{t('nav.vers_admin')}</span>
          </Link>
        )}
        <button onClick={deconnexion} className="text-texte-faible hover:text-danger transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <Link to="/questions"
            className="carte flex items-center gap-3 px-4 py-3.5 mb-5 tape hover:border-neon">
        <FileText size={17} className="text-neon-sourd shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{t('animation.preparer')}</p>
          <p className="text-xs text-texte-faible">{t('animation.aide_preparer')}</p>
        </div>
      </Link>
      {manches.length === 0 ? (
        <p className="text-texte-doux">{t('animation.aucune_manche')}</p>
      ) : (
        <div className="grid gap-2">
          {manches.map((m) => (
            <Link key={m.id} to={`/animation/${m.id}`}
                  className="carte flex items-center justify-between px-4 py-4 tape hover:border-neon">
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
