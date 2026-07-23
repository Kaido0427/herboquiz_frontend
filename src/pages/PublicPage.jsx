import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trophy, CalendarDays, Users, ScrollText, LogIn } from 'lucide-react'
import { publicService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

/**
 * Page ouverte a tous.
 *
 * Elle doit rester legere : beaucoup la consulteront depuis un telephone
 * modeste avec une connexion faible. Et surtout, aucun joueur n'a BESOIN de
 * cette page pour jouer — elle informe, elle ne conditionne rien.
 */
export default function PublicPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.public,
    queryFn: publicService.tout,
    refetchInterval: 30000,
  })

  if (isLoading) return <p className="p-6 text-texte-doux">{t('commun.chargement')}</p>

  const r = data.reglages
  const devise = r['prix.devise'] ?? ''
  const montant = (v) => `${Number(v ?? 0).toLocaleString('fr-FR')} ${devise}`

  const Section = ({ icone: Icone, titre, children }) => (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-sm uppercase tracking-widest text-texte-faible mb-3">
        <Icone size={14} />
        {titre}
      </h2>
      {children}
    </section>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest text-texte-faible">{r['tournoi.organisateur']}</p>
        <h1 className="mt-2 text-3xl font-bold text-neon">{r['tournoi.nom']}</h1>
        <p className="mt-3 text-texte-doux">{r['tournoi.debut']}</p>
        <p className="mt-1 text-sm text-texte-faible">
          {data.nb_inscrits} {t('public.inscrits')}
        </p>
      </header>

      {r['textes.annonce'] && (
        <p className="mt-8 whitespace-pre-line leading-relaxed text-texte-doux">{r['textes.annonce']}</p>
      )}

      <Section icone={Trophy} titre={t('public.prix')}>
        <div className="grid grid-cols-3 gap-2">
          {[
            [t('public.premier'), r['prix.premier']],
            [t('public.deuxieme'), r['prix.deuxieme']],
            [t('public.troisieme'), r['prix.troisieme']],
          ].map(([rang, valeur], i) => (
            <div key={rang} className={cn(
              'rounded-xl border p-3 text-center',
              i === 0 ? 'border-neon-sourd bg-surface halo-neon' : 'border-bord bg-surface',
            )}>
              <p className="text-xs text-texte-faible">{rang}</p>
              <p className={cn('mt-1 font-bold', i === 0 ? 'text-neon' : 'text-texte')}>{montant(valeur)}</p>
            </div>
          ))}
        </div>
        {r['prix.versement'] && <p className="mt-3 text-xs text-texte-faible">{r['prix.versement']}</p>}
      </Section>

      {/* L'information la plus importante avant le coup d'envoi : sans methode
          d'inscription claire et sans date de cloture, il n'y a pas de tournoi. */}
      {r['inscriptions.ouvertes'] && (
        <Section icone={Users} titre={t('public.comment_sinscrire')}>
          <div className="rounded-xl bg-surface border border-bord p-4">
            <p className="whitespace-pre-line text-texte-doux">{r['inscriptions.comment']}</p>
            {r['inscriptions.date_limite'] && (
              <p className="mt-3 text-sm">
                <span className="text-texte-faible">{t('public.date_limite')} : </span>
                <span className="text-neon font-semibold">{r['inscriptions.date_limite']}</span>
              </p>
            )}
          </div>
        </Section>
      )}

      <Section icone={Trophy} titre={t('public.classement')}>
        {data.classement.length === 0 ? (
          <p className="text-texte-faible text-sm">{t('public.aucun_classement')}</p>
        ) : (
          <ol className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
            {data.classement.map((c, i) => (
              <li key={c.libelle + i} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-texte-faible tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate">{c.libelle}</span>
                <span className={cn('font-bold tabular-nums', i === 0 ? 'text-neon' : 'text-texte-doux')}>
                  {c.points}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section icone={CalendarDays} titre={t('public.calendrier')}>
        {data.manches.length === 0 ? (
          <p className="text-texte-faible text-sm">{t('public.aucune_manche')}</p>
        ) : (
          <ul className="rounded-2xl bg-surface border border-bord divide-y divide-bord">
            {data.manches.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <span>{m.libelle}</span>
                <span className="text-xs text-texte-faible">{m.statut}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {r['textes.reglement'] && (
        <Section icone={ScrollText} titre={t('public.reglement')}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-texte-doux">{r['textes.reglement']}</p>
        </Section>
      )}

      {data.participants.length > 0 && (
        <Section icone={Users} titre={t('public.participants')}>
          {/* Volontairement sans numero de telephone : il sert a verser les
              prix, il n'a rien a faire sur une page ouverte a tous. */}
          <div className="flex flex-wrap gap-2">
            {data.participants.map((p, i) => (
              <span key={i} className="rounded-lg bg-surface border border-bord px-3 py-1 text-sm">
                {p.nom_affiche}
              </span>
            ))}
          </div>
        </Section>
      )}

      <footer className="mt-12 pt-6 border-t border-bord text-center">
        <p className="text-sm text-texte-faible italic">{r['textes.pied_page']}</p>
        <Link to="/connexion" className="mt-4 inline-flex items-center gap-1.5 text-xs text-texte-faible hover:text-neon">
          <LogIn size={13} />
          {t('nav.admin')}
        </Link>
      </footer>
    </div>
  )
}
