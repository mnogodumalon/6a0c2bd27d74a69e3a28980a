import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import MitgliederPage from '@/pages/MitgliederPage';
import KursePage from '@/pages/KursePage';
import BuchungenPage from '@/pages/BuchungenPage';
import PublicFormMitglieder from '@/pages/public/PublicForm_Mitglieder';
import PublicFormKurse from '@/pages/public/PublicForm_Kurse';
import PublicFormBuchungen from '@/pages/public/PublicForm_Buchungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6a0c2bb73be88fb13d6da8f8" element={<PublicFormMitglieder />} />
              <Route path="public/6a0c2bba5a97c0d9a76d187f" element={<PublicFormKurse />} />
              <Route path="public/6a0c2bbaf17fab41001998d6" element={<PublicFormBuchungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="mitglieder" element={<MitgliederPage />} />
                <Route path="kurse" element={<KursePage />} />
                <Route path="buchungen" element={<BuchungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
