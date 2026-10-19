import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { StatsPage } from '@/pages/StatsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SetupPage } from '@/pages/SetupPage'
import { SurveyEditPage } from '@/pages/SurveyEditPage'
import { SurveyDetailPage } from '@/pages/SurveyDetailPage'
import { useAppConfig } from '@/lib/app-config'

function Router() {
  const { isConfigured } = useAppConfig()

  if (!isConfigured) {
    return <SetupPage mode="setup" />
  }

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage mode="edit" />} />
      <Route
        path="/"
        element={
          <AppShell>
            <HomePage />
          </AppShell>
        }
      />
      <Route
        path="/stats"
        element={
          <AppShell>
            <StatsPage />
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell>
            <SettingsPage />
          </AppShell>
        }
      />
      <Route path="/survey/new" element={<SurveyEditPage />} />
      <Route path="/survey/:id" element={<SurveyDetailPage />} />
      <Route path="/survey/:id/edit" element={<SurveyEditPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Router />
    </HashRouter>
  )
}
