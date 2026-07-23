import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Pencil, X } from 'lucide-react'
import { reglageService } from '@/services/herboquizService'
import { QUERY_KEYS } from '@/hooks/queryKeys'
import { cn } from '@/utils/cn'

/**
 * Messages prets a coller dans le groupe (Messenger / WhatsApp).
 *
 * Le texte vit dans les reglages, editable : jamais dans le code. Les
 * {{reperes}} sont remplaces a l'affichage ET a la copie par les vraies valeurs
 * des autres reglages, donc un message ne peut pas partir avec un vieux lien ou
 * une date perimee. On copie exactement ce que l'apercu montre.
 */

// Correspondance repere -> valeur. C'est de la plomberie, pas du contenu : le
// contenu vient des reglages, ceci ne fait que pointer dessus. Une seule source
// de verite, aucune valeur recopiee a la main.
function construireVariables(parCle, origin) {
  const devise = parCle['prix.devise'] || 'FCFA'
  const prix = (cle) => (parCle[cle] ? `${parCle[cle]} ${devise}` : '')
  return {
    nom_tournoi: parCle['tournoi.nom'] || '',
    organisateur: parCle['tournoi.organisateur'] || '',
    date_debut: parCle['tournoi.debut'] || '',
    date_limite: parCle['inscriptions.date_limite'] || '',
    canal_poules: parCle['tournoi.canal_poules'] || '',
    canal_finales: parCle['tournoi.canal_finales'] || '',
    lien_inscription: `${origin}/inscription`,
    lien_site: parCle['tournoi.url'] || origin,
    prix_premier: prix('prix.premier'),
    prix_deuxieme: prix('prix.deuxieme'),
    prix_troisieme: prix('prix.troisieme'),
    prix_meilleur: prix('prix.meilleur_marqueur'),
  }
}

// Un repere inconnu est laisse tel quel : l'admin voit sa faute de frappe plutot
// qu'un trou silencieux dans le message.
function rendre(tpl, vars) {
  return (tpl || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, cle) =>
    vars[cle] !== undefined ? vars[cle] : m)
}

export default function VueMessages() {
  const { t } = useTranslation()
  const { data: groupes = {} } = useQuery({
    queryKey: QUERY_KEYS.reglages,
    queryFn: reglageService.liste,
  })

  const messages = groupes.messages || []
  const parCle = Object.fromEntries(
    Object.values(groupes).flat().map((r) => [r.cle, r.valeur ?? '']),
  )
  const vars = construireVariables(parCle, window.location.origin)

  return (
    <div>
      <div className="mb-5">
        <h1 className="titre text-2xl font-bold">{t('admin.onglet_messages')}</h1>
        <p className="mt-1 text-sm text-texte-doux leading-relaxed">{t('admin.aide_messages')}</p>
      </div>

      {messages.length === 0 ? (
        <p className="carte px-5 py-8 text-center text-sm text-texte-faible">{t('admin.aucun_message')}</p>
      ) : (
        <div className="grid gap-5 cascade">
          {messages.map((m) => <CarteMessage key={m.cle} reglage={m} vars={vars} />)}
        </div>
      )}
    </div>
  )
}

function CarteMessage({ reglage, vars }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const refTexte = useRef(null)

  const [edition, setEdition] = useState(false)
  const [texte, setTexte] = useState(reglage.valeur ?? '')
  const [copie, setCopie] = useState(false)

  const rendu = rendre(edition ? texte : (reglage.valeur ?? ''), vars)

  const copier = async () => {
    await navigator.clipboard.writeText(rendu)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  const enregistrer = useMutation({
    mutationFn: () => reglageService.enregistrer([{ cle: reglage.cle, valeur: texte }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.reglages })
      setEdition(false)
    },
  })

  // Le repere s'insere la ou est le curseur, pas au bout du texte : on ecrit un
  // message, on ne le recompose pas.
  const inserer = (cle) => {
    const ta = refTexte.current
    const token = `{{${cle}}}`
    const debut = ta ? ta.selectionStart : texte.length
    const fin = ta ? ta.selectionEnd : texte.length
    const suivant = texte.slice(0, debut) + token + texte.slice(fin)
    setTexte(suivant)
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      ta.selectionStart = ta.selectionEnd = debut + token.length
    })
  }

  return (
    <section className="carte p-5">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="titre text-lg font-semibold text-neon flex-1">{reglage.libelle}</h2>
        <button onClick={() => { setTexte(reglage.valeur ?? ''); setEdition(!edition) }}
                className="flex items-center gap-1.5 text-xs text-texte-faible hover:text-neon transition-colors">
          {edition ? <X size={14} /> : <Pencil size={14} />}
          {edition ? t('commun.fermer') : t('admin.modifier_message')}
        </button>
      </div>

      {reglage.aide && !edition && (
        <p className="text-xs text-texte-faible mb-3 leading-relaxed">{reglage.aide}</p>
      )}

      {edition && (
        <div className="mb-4">
          <textarea ref={refTexte} value={texte} onChange={(e) => setTexte(e.target.value)} rows={10}
                    className="w-full rounded-xl bg-fond-2 border border-bord px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-neon transition-colors font-mono" />

          <p className="etiquette text-texte-faible mt-3 mb-1.5">{t('admin.variables_dispo')}</p>
          <p className="text-xs text-texte-faible mb-2 leading-relaxed">{t('admin.aide_variables')}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(vars).map((cle) => (
              <button key={cle} type="button" onClick={() => inserer(cle)}
                      className="rounded-lg bg-fond-2 border border-bord px-2 py-1 text-xs text-texte-doux hover:border-neon hover:text-neon transition-colors">
                {`{{${cle}}}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}
                    className="flex items-center gap-2 rounded-xl bg-neon text-fond font-semibold px-5 py-2.5 tape disabled:opacity-50">
              <Check size={16} />
              {t('commun.enregistrer')}
            </button>
          </div>
        </div>
      )}

      {/* Apercu : exactement ce qui atterrit dans le presse-papier. Les sauts de
          ligne et les emojis s'affichent tels qu'ils partiront dans le groupe. */}
      <p className="etiquette text-texte-faible mb-1.5">{t('admin.apercu_message')}</p>
      <div className="rounded-xl bg-fond-2 border border-bord px-4 py-3.5 mb-4 text-sm leading-relaxed whitespace-pre-wrap">
        {rendu}
      </div>

      <button type="button" onClick={copier}
              className={cn('w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-3 tape',
                copie ? 'bg-succes text-fond' : 'bg-neon text-fond')}>
        {copie ? <Check size={16} /> : <Copy size={16} />}
        {copie ? t('admin.message_copie') : t('admin.copier_message')}
      </button>
    </section>
  )
}
