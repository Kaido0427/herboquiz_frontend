import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trophy, CalendarDays, Users, ScrollText, LogIn, Medal, Radio, Sparkles } from 'lucide-react'
import { publicService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { Apercu } from '@/components/EditeurTexte'
import { cn } from '@/utils/cn'

/**
 * Page ouverte a tous.
 *
 * Deux exigences qui ont dicte la mise en page :
 *  - Elle doit rester legere. Beaucoup la consulteront depuis un telephone
 *    modeste avec une connexion faible, et aucun joueur n'en a BESOIN pour
 *    jouer : elle informe, elle ne conditionne rien.
 *  - Le classement est ce qu'on vient voir. Il passe donc devant le reste, et
 *    le podium se lit d'un coup d'oeil sans avoir a comparer des chiffres.
 */
export default function PublicPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.public,
    queryFn: publicService.tout,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="etiquette text-texte-faible anim-pulse">{t('commun.chargement')}</p>
      </div>
    )
  }

  const r = data.reglages
  const devise = r['prix.devise'] ?? ''
  // Montant et devise separes : sur un ecran de 320 px, chaque carte du podium
  // fait environ 90 px et « 10 000 FCFA » d'un seul tenant deborde.
  const montant = (v) => Number(v ?? 0).toLocaleString('fr-FR')
  const podium = data.classement.slice(0, 3)
  const suite = data.classement.slice(3)
  const enDirect = data.manches.some((m) => m.statut === 'en_cours')

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">

      {/* ---------- En-tete ---------- */}
      <header className="pt-12 pb-10 text-center anim-monte">
        <p className="etiquette text-neon-sourd">{r['tournoi.organisateur']}</p>

        <h1 className="titre mt-3 text-4xl sm:text-5xl font-bold leading-tight">
          <span className="text-neon">{r['tournoi.nom']}</span>
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="carte px-3 py-1.5 text-sm text-texte-doux">{r['tournoi.debut']}</span>
          <span className="carte px-3 py-1.5 text-sm">
            <strong className="text-neon">{data.nb_inscrits}</strong>
            <span className="text-texte-doux"> {t('public.inscrits')}</span>
          </span>
          {enDirect && (
            <span className="flex items-center gap-1.5 rounded-full bg-danger/15 border border-danger/40 px-3 py-1.5 text-sm text-danger">
              <Radio size={13} className="anim-pulse" />
              {t('public.en_direct')}
            </span>
          )}
        </div>
      </header>

      {/* ---------- Podium : la raison d'etre de la page ---------- */}
      {podium.length > 0 && (
        <section className="anim-monte">
          <TitreSection icone={Trophy} libelle={t('public.podium')} />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 0, 2].map((rang) => {
              const e = podium[rang]
              if (!e) return <div key={rang} />
              const couleurs = ['text-or', 'text-argent', 'text-bronze']
              const hauteurs = ['pt-4 pb-7', 'pt-7 pb-5', 'pt-9 pb-4']
              return (
                <div key={rang}
                  className={cn('carte flex flex-col items-center px-2 text-center', hauteurs[rang],
                    rang === 0 && 'halo-or')}>
                  <Medal size={rang === 0 ? 26 : 20} className={couleurs[rang]} />
                  <p className="mt-2 text-xs sm:text-sm font-medium truncate w-full">{e.libelle}</p>
                  <p className={cn('titre mt-1 font-bold tabular-nums', rang === 0 ? 'text-2xl text-or' : 'text-xl text-texte-doux')}>
                    {e.points}
                  </p>
                </div>
              )
            })}
          </div>

          {suite.length > 0 && (
            <ol className="carte mt-3 divide-y divide-bord cascade">
              {suite.map((c, i) => (
                <li key={c.libelle + i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-texte-faible tabular-nums text-sm">{i + 4}</span>
                  <span className="flex-1 truncate text-sm">{c.libelle}</span>
                  <span className="tabular-nums text-texte-doux">{c.points}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {data.classement.length === 0 && (
        <section className="carte px-5 py-8 text-center anim-monte">
          <Sparkles size={22} className="mx-auto text-neon-sourd" />
          <p className="mt-3 text-sm text-texte-doux">{t('public.aucun_classement')}</p>
        </section>
      )}

      {/* ---------- Recompenses ---------- */}
      <section className="mt-12">
        <TitreSection icone={Trophy} libelle={t('public.prix')} />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            [t('public.premier'), r['prix.premier'], 'text-or', 'halo-or'],
            [t('public.deuxieme'), r['prix.deuxieme'], 'text-argent', ''],
            [t('public.troisieme'), r['prix.troisieme'], 'text-bronze', ''],
          ].map(([rang, valeur, couleur, halo]) => (
            <div key={rang} className={cn('carte px-2 sm:px-3 py-4 text-center', halo)}>
              <p className="etiquette text-texte-faible">{rang}</p>
              <p className={cn('titre mt-1.5 text-base sm:text-xl font-bold leading-none', couleur)}>
                {montant(valeur)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-texte-faible">{devise}</p>
            </div>
          ))}
        </div>
        {r['prix.versement'] && (
          <p className="mt-3 text-xs text-texte-faible text-center">{r['prix.versement']}</p>
        )}
      </section>

      {/* ---------- Inscriptions : l'information la plus utile avant le debut ---------- */}
      {r['inscriptions.ouvertes'] && (
        <section className="mt-12">
          <TitreSection icone={Users} libelle={t('public.comment_sinscrire')} />
          <div className="carte p-5 halo">
            <Apercu texte={r['inscriptions.comment'] ?? ''} />
            {/* Le lien doit etre le geste evident de la page : c'est ce qu'on
                attend des visiteurs avant le coup d'envoi. */}
            <Link to="/inscription"
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-neon text-fond font-semibold py-3.5 halo tape">
              <Users size={17} />
              {t('public.s_inscrire')}
            </Link>

            {r['inscriptions.date_limite'] && (
              <p className="mt-4 pt-4 border-t border-bord text-sm">
                <span className="etiquette text-texte-faible">{t('public.date_limite')}</span>
                <span className="block titre text-lg text-neon font-semibold">{r['inscriptions.date_limite']}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ---------- Annonce ---------- */}
      {r['textes.annonce'] && (
        <section className="mt-12">
          <TitreSection icone={Sparkles} libelle={r['tournoi.nom']} />
          <div className="carte p-5 leading-relaxed">
            <Apercu texte={r['textes.annonce']} />
          </div>
        </section>
      )}

      {/* ---------- Calendrier ---------- */}
      <section className="mt-12">
        <TitreSection icone={CalendarDays} libelle={t('public.calendrier')} />
        {data.manches.length === 0 ? (
          <p className="carte px-5 py-6 text-sm text-texte-faible text-center">{t('public.aucune_manche')}</p>
        ) : (
          <ul className="carte divide-y divide-bord cascade">
            {data.manches.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                  m.statut === 'en_cours' ? 'bg-danger anim-pulse'
                    : m.statut === 'terminee' ? 'bg-texte-faible' : 'bg-neon-sourd')} />
                <span className="flex-1 truncate">{m.libelle}</span>
                <span className="etiquette text-texte-faible">{t(`public.${m.statut === 'terminee' ? 'termine' : m.statut === 'en_cours' ? 'en_cours' : 'a_venir'}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Reglement ---------- */}
      {r['textes.reglement'] && (
        <section className="mt-12">
          <TitreSection icone={ScrollText} libelle={t('public.reglement')} />
          <div className="carte p-5 text-sm">
            <Apercu texte={r['textes.reglement']} />
          </div>
        </section>
      )}

      {/* ---------- Participants ---------- */}
      {data.participants.length > 0 && (
        <section className="mt-12">
          <TitreSection icone={Users} libelle={`${t('public.participants')} (${data.participants.length})`} />
          {/* Volontairement sans numero de telephone : il sert a verser les prix,
              il n'a rien a faire sur une page ouverte a tous. */}
          <div className="flex flex-wrap gap-1.5">
            {data.participants.map((p, i) => (
              <span key={i} className="rounded-lg bg-surface border border-bord px-2.5 py-1 text-sm text-texte-doux">
                {p.nom_affiche}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 pt-8 border-t border-bord text-center">
        <p className="titre text-sm text-texte-faible italic">{r['textes.pied_page']}</p>
        <Link to="/connexion"
              className="mt-5 inline-flex items-center gap-1.5 text-xs text-texte-faible hover:text-neon transition-colors">
          <LogIn size={13} />
          {t('nav.admin')}
        </Link>
      </footer>
    </div>
  )
}

function TitreSection({ icone: Icone, libelle }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icone size={14} className="text-neon-sourd" />
      <h2 className="etiquette text-texte-faible">{libelle}</h2>
      <span className="flex-1 h-px bg-gradient-to-r from-bord to-transparent" />
    </div>
  )
}
