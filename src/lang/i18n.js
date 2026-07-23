import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'

// Une seule langue pour l'instant, mais la mecanique est en place : aucun
// texte n'est ecrit dans les composants, donc ajouter une langue ne demandera
// pas de rouvrir le JSX.
i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n
