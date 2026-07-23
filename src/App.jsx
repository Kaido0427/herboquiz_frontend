import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/contexts/SessionContext'
import PublicPage from '@/pages/PublicPage'
import ConnexionPage from '@/pages/ConnexionPage'
import InscriptionPage from '@/pages/InscriptionPage'
import ChoixManchePage from '@/pages/ChoixManchePage'
import AnimationPage from '@/pages/AnimationPage'
import AdminPage from '@/pages/AdminPage'

/** Barriere d'acces. Le vrai controle est cote serveur ; ceci evite juste
 *  d'afficher un ecran vide a quelqu'un qui n'a rien a y faire. */
function Protege({ children, adminSeul = false }) {
  const { utilisateur, pret, estAdmin } = useSession()
  const { t } = useTranslation()

  if (!pret) return <p className="p-6 text-texte-doux">{t('commun.chargement')}</p>
  if (!utilisateur) return <Navigate to="/connexion" replace />
  if (adminSeul && !estAdmin) return <Navigate to="/animation" replace />

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/connexion" element={<ConnexionPage />} />
      <Route path="/inscription" element={<InscriptionPage />} />
      <Route path="/animation" element={<Protege><ChoixManchePage /></Protege>} />
      <Route path="/animation/:mancheId" element={<Protege><AnimationPage /></Protege>} />
      <Route path="/admin" element={<Protege adminSeul><AdminPage /></Protege>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
