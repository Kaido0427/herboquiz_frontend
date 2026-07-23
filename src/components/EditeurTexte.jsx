import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bold, Italic, List, ListOrdered, Heading, Quote, Eye, PenLine, Undo2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Editeur pour les textes longs (annonce, reglement, modalites).
 *
 * Une zone de texte nue est penible des que le texte depasse quelques lignes :
 * on ne voit pas ce qu'on ecrit, et il faut connaitre la syntaxe pour mettre en
 * gras. On ajoute donc une barre d'outils facon traitement de texte, un apercu,
 * et une hauteur qui s'adapte au contenu.
 *
 * Volontairement construit a la main plutot qu'avec une bibliotheque WYSIWYG :
 * celles-ci pesent plus de 100 Ko, et la page doit rester consultable depuis un
 * telephone modeste avec une connexion faible.
 */
export default function EditeurTexte({ valeur = '', onChange, rows = 6 }) {
  const { t } = useTranslation()
  const zone = useRef(null)
  const [apercu, setApercu] = useState(false)
  const [avant, setAvant] = useState(null)

  /** Entoure la selection, ou insere un marqueur au curseur si rien n'est selectionne. */
  const entourer = (ouvrant, fermant = ouvrant) => {
    const el = zone.current
    if (!el) return

    setAvant(valeur)
    const debut = el.selectionStart
    const fin = el.selectionEnd
    const selection = valeur.slice(debut, fin) || t('editeur.exemple')
    const suivant = valeur.slice(0, debut) + ouvrant + selection + fermant + valeur.slice(fin)

    onChange(suivant)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(debut + ouvrant.length, debut + ouvrant.length + selection.length)
    })
  }

  /** Prefixe chaque ligne selectionnee — listes, titres, citations. */
  const prefixer = (prefixe, numerote = false) => {
    const el = zone.current
    if (!el) return

    setAvant(valeur)
    const debut = valeur.lastIndexOf('\n', el.selectionStart - 1) + 1
    const fin = valeur.indexOf('\n', el.selectionEnd)
    const borne = fin === -1 ? valeur.length : fin

    const lignes = (valeur.slice(debut, borne) || t('editeur.exemple')).split('\n')
    const transformees = lignes.map((l, i) => (numerote ? `${i + 1}. ` : prefixe) + l.replace(/^([-*]\s|\d+\.\s|#+\s|>\s)/, ''))

    onChange(valeur.slice(0, debut) + transformees.join('\n') + valeur.slice(borne))
    requestAnimationFrame(() => el.focus())
  }

  const outils = [
    { icone: Bold,        titre: t('editeur.gras'),    action: () => entourer('**') },
    { icone: Italic,      titre: t('editeur.italique'), action: () => entourer('*') },
    { icone: Heading,     titre: t('editeur.titre'),   action: () => prefixer('## ') },
    { icone: List,        titre: t('editeur.liste'),   action: () => prefixer('- ') },
    { icone: ListOrdered, titre: t('editeur.liste_num'), action: () => prefixer('', true) },
    { icone: Quote,       titre: t('editeur.citation'), action: () => prefixer('> ') },
  ]

  // Hauteur adaptee au contenu : plus de zone geante a moitie vide, ni de
  // minuscule fenetre dans laquelle on ecrit un reglement de vingt lignes.
  const lignes = Math.min(24, Math.max(rows, valeur.split('\n').length + 1))

  return (
    <div className="rounded-xl border border-bord overflow-hidden bg-fond-2">
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-b border-bord bg-surface">
        {outils.map((o) => (
          <button key={o.titre} type="button" title={o.titre} onClick={o.action}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-texte-doux hover:text-neon hover:bg-fond-2 transition-colors">
            <o.icone size={15} />
          </button>
        ))}

        <span className="w-px h-5 bg-bord mx-1" />

        <button type="button" title={t('commun.annuler')} disabled={avant === null}
                onClick={() => { onChange(avant); setAvant(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-texte-doux hover:text-neon disabled:opacity-30">
          <Undo2 size={15} />
        </button>

        <button type="button" onClick={() => setApercu(!apercu)}
                className={cn(
                  'ml-auto flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs',
                  apercu ? 'bg-neon text-fond font-semibold' : 'text-texte-doux hover:text-neon',
                )}>
          {apercu ? <PenLine size={13} /> : <Eye size={13} />}
          {apercu ? t('editeur.editer') : t('editeur.apercu')}
        </button>
      </div>

      {apercu ? (
        <div className="px-4 py-3 min-h-[8rem] text-sm leading-relaxed">
          <Apercu texte={valeur} />
        </div>
      ) : (
        <textarea
          ref={zone}
          rows={lignes}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-4 py-3 outline-none resize-y leading-relaxed"
        />
      )}
    </div>
  )
}

/**
 * Rendu du texte mis en forme.
 *
 * On n'injecte jamais de HTML : chaque ligne est analysee et transformee en
 * elements React. Un texte colle depuis ailleurs ne peut donc pas introduire
 * de balise dans la page.
 */
export function Apercu({ texte = '' }) {
  const enrichir = (ligne, cle) => {
    const morceaux = []
    let reste = ligne
    let i = 0

    while (reste.length) {
      const gras = reste.match(/\*\*(.+?)\*\*/)
      const ital = reste.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
      const premier = [gras, ital].filter(Boolean).sort((a, b) => a.index - b.index)[0]

      if (!premier) { morceaux.push(reste); break }

      if (premier.index > 0) morceaux.push(reste.slice(0, premier.index))
      morceaux.push(
        premier === gras
          ? <strong key={`${cle}-${i}`} className="text-texte font-semibold">{premier[1]}</strong>
          : <em key={`${cle}-${i}`}>{premier[1]}</em>,
      )
      reste = reste.slice(premier.index + premier[0].length)
      i++
    }

    return morceaux
  }

  const lignes = texte.split('\n')
  const sortie = []
  let liste = null

  lignes.forEach((ligne, i) => {
    const puce = ligne.match(/^[-*]\s+(.*)/)
    const num = ligne.match(/^\d+\.\s+(.*)/)

    if (puce || num) {
      if (!liste || liste.type !== (puce ? 'ul' : 'ol')) {
        liste = { type: puce ? 'ul' : 'ol', items: [] }
        sortie.push(liste)
      }
      liste.items.push(enrichir((puce || num)[1], i))
      return
    }

    liste = null

    if (ligne.startsWith('## ')) { sortie.push(<h3 key={i} className="titre text-lg font-bold text-neon mt-4 mb-1">{ligne.slice(3)}</h3>); return }
    if (ligne.startsWith('> '))  { sortie.push(<blockquote key={i} className="border-l-2 border-neon-sourd pl-3 my-2 text-texte-doux italic">{enrichir(ligne.slice(2), i)}</blockquote>); return }
    if (!ligne.trim())           { sortie.push(<div key={i} className="h-2" />); return }

    sortie.push(<p key={i} className="mb-1.5">{enrichir(ligne, i)}</p>)
  })

  return (
    <div className="text-texte-doux">
      {sortie.map((bloc, i) =>
        bloc?.type === 'ul' || bloc?.type === 'ol' ? (
          bloc.type === 'ul' ? (
            <ul key={`l${i}`} className="list-disc pl-5 my-2 space-y-1">{bloc.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          ) : (
            <ol key={`l${i}`} className="list-decimal pl-5 my-2 space-y-1">{bloc.items.map((it, j) => <li key={j}>{it}</li>)}</ol>
          )
        ) : bloc,
      )}
    </div>
  )
}
