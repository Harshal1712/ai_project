import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { HelpModal } from './components/layout/HelpModal';

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

// Types & Mock Data
import { 
  NavigationTab, 
  ProjectItem, 
  SourceContent, 
  TransformationConfig, 
  OutputType,
  TransformationTemplate,
  SourceType
} from './types';
import { MOCK_PROJECTS, MOCK_VERIFICATION, MOCK_DOC_INTELLIGENCE, MOCK_VIDEO_INTELLIGENCE } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState<ProjectItem>(MOCK_PROJECTS[0]);

  // Active Processing Task State
  const [processingData, setProcessingData] = useState<{
    source: SourceContent;
    config: TransformationConfig;
    outputs: OutputType[];
  } | null>(null);

  // Initial Source Type for Create Wizard
  const [createSourceType, setCreateSourceType] = useState<SourceType>('pdf');

  // Toggle dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Start Processing Handler
  const handleStartProcessing = (
    source: SourceContent, 
    config: TransformationConfig, 
    outputs: OutputType[]
  ) => {
    setProcessingData({ source, config, outputs });
    setActiveTab('processing');
  };

  // Complete Processing Handler (Simulation Done)
  const handleProcessingComplete = () => {
    if (!processingData) return;

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: processingData.source.name.replace(/\.[^/.]+$/, '') + ' Transformation',
      source: processingData.source,
      config: processingData.config,
      selectedOutputTypes: processingData.outputs,
      outputs: processingData.outputs.map((type, idx) => ({
        id: `out-${Date.now()}-${idx}`,
        type: type,
        title: `${type} — ${processingData.source.name}`,
        content: `Generated ${type} tailored for ${processingData.config.audience} in ${processingData.config.language} (${processingData.config.tone} tone).\n\n1. Strategic Objective: ${processingData.config.objective}\n2. Core Fact Summary: All extracted entity vectors match ground-truth source parameters line-by-line.\n3. Enterprise Governance: Verified compliant with ISO/IEC 42001 and internal SLA guidelines.`,
        slides: type === 'Presentation / PPT' ? MOCK_PROJECTS[0].outputs[2].slides : undefined,
        quiz: type === 'MCQs / Quiz' ? MOCK_VIDEO_INTELLIGENCE.quiz : undefined
      })),
      verification: MOCK_VERIFICATION,
      createdAt: 'Just now',
      status: 'Completed',
      version: 'v1.0'
    };

    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
    setProcessingData(null);
    setActiveTab('results');
  };

  // Quick Action Launcher from Dashboard
  const handleQuickAction = (actionId: string) => {
    if (actionId === 'youtube') {
      setCreateSourceType('youtube');
    } else if (actionId === 'doc') {
      setCreateSourceType('pdf');
    } else {
      setCreateSourceType('pdf');
    }
    setActiveTab('create');
  };

  // Use Template Launcher
  const handleUseTemplate = (tpl: TransformationTemplate) => {
    setActiveTab('create');
  };

  // Open Project Handler
  const handleOpenProject = (proj: ProjectItem) => {
    setActiveProject(proj);
    setActiveTab('results');
  };

  // Delete Project Handler
  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        completedTransformationsCount={projects.length}
      />

      {/* Top Header Bar */}
      <TopBar 
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenNewTransformation={() => {
          setCreateSourceType('pdf');
          setActiveTab('create');
        }}
      />

      {/* Main Workspace Area */}
      <main 
        className={`flex-1 pt-20 px-4 sm:px-8 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab}
            projects={projects}
            onOpenProject={handleOpenProject}
            onQuickAction={handleQuickAction}
          />
        )}

        {activeTab === 'create' && (
          <CreateTransformation 
            onStartProcessing={handleStartProcessing}
            initialSourceType={createSourceType}
          />
        )}

        {activeTab === 'processing' && processingData && (
          <ProcessingScreen 
            source={processingData.source}
            config={processingData.config}
            selectedOutputs={processingData.outputs}
            onComplete={handleProcessingComplete}
          />
        )}

        {activeTab === 'results' && activeProject && (
          <ResultsPage 
            project={activeProject}
            onOpenVerification={() => setActiveTab('verification')}
            onOpenReconfigure={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'video-summarizer' && (
          <VideoSummarizer />
        )}

        {activeTab === 'document-intelligence' && (
          <DocumentIntelligence />
        )}

        {activeTab === 'verification' && (
          <VerificationPage />
        )}

        {activeTab === 'projects' && (
          <MyProjects 
            projects={projects}
            onOpenProject={handleOpenProject}
            setActiveTab={setActiveTab}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'templates' && (
          <TemplatesPage 
            setActiveTab={setActiveTab}
            onUseTemplate={handleUseTemplate}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Help Modal */}
      <HelpModal 
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}

export default App;
