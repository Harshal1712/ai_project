import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { HelpModal } from './components/layout/HelpModal';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Pages
import { Dashboard } from './pages/Dashboard';
import { CreateTransformation } from './pages/CreateTransformation';
import { ProcessingScreen } from './pages/ProcessingScreen';
import { ResultsPage } from './pages/ResultsPage';
import { VideoSummarizer } from './pages/VideoSummarizer';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
import { VerificationPage } from './pages/VerificationPage';
import { MyProjects } from './pages/MyProjects';
import { DocumentsPage } from './pages/DocumentsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

import { NavigationTab } from './types';

function pathToTab(pathname: string): NavigationTab {
  if (pathname.startsWith('/create')) return 'create';
  if (pathname.startsWith('/projects/') && pathname.endsWith('/processing')) return 'processing';
  if (pathname.startsWith('/projects/')) return 'results';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/documents')) return 'documents';
  if (pathname.startsWith('/video-summarizer')) return 'video-summarizer';
  if (pathname.startsWith('/document-intelligence')) return 'document-intelligence';
  if (pathname.startsWith('/verification')) return 'verification';
  if (pathname.startsWith('/templates')) return 'templates';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}

const TAB_TO_PATH: Record<NavigationTab, string> = {
  dashboard: '/dashboard',
  create: '/create',
  processing: '/dashboard',
  results: '/projects',
  projects: '/projects',
  documents: '/documents',
  'video-summarizer': '/video-summarizer',
  'document-intelligence': '/document-intelligence',
  verification: '/verification',
  templates: '/templates',
  history: '/history',
  analytics: '/analytics',
  settings: '/settings',
};

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const activeTab = pathToTab(location.pathname);
  const setActiveTab = (tab: NavigationTab) => navigate(TAB_TO_PATH[tab]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        completedTransformationsCount={0}
      />

      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenNewTransformation={() => navigate('/create')}
        user={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <main className={`flex-1 pt-20 px-4 sm:px-8 pb-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Outlet />
      </main>

      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateTransformation />} />
              <Route path="/projects" element={<MyProjects />} />
              <Route path="/projects/:id/processing" element={<ProcessingScreen />} />
              <Route path="/projects/:id" element={<ResultsPage />} />
              <Route path="/video-summarizer" element={<VideoSummarizer />} />
              <Route path="/document-intelligence" element={<DocumentIntelligence />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
