import React, { Suspense, lazy } from 'react';
import { useStore } from './store/useStore';
import { InsightNavbar } from './components/InsightNavbar';

// Route-based code splitting for production chunk optimization
const InsightLandingPage = lazy(() =>
  import('./pages/InsightLandingPage').then((m) => ({ default: m.InsightLandingPage }))
);
const GestureLab = lazy(() =>
  import('./pages/GestureLab').then((m) => ({ default: m.GestureLab }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const SignLearningCentre = lazy(() =>
  import('./pages/SignLearningCentre').then((m) => ({ default: m.SignLearningCentre }))
);
const SignDictionary = lazy(() =>
  import('./pages/SignDictionary').then((m) => ({ default: m.SignDictionary }))
);
const AccessibilitySettingsPage = lazy(() =>
  import('./pages/AccessibilitySettingsPage').then((m) => ({ default: m.AccessibilitySettingsPage }))
);
const GemmaDashboard = lazy(() =>
  import('./pages/GemmaDashboard').then((m) => ({ default: m.GemmaDashboard }))
);
const ConnectPage = lazy(() =>
  import('./pages/ConnectPage').then((m) => ({ default: m.ConnectPage }))
);
const ResearchLab = lazy(() =>
  import('./pages/ResearchLab').then((m) => ({ default: m.ResearchLab }))
);
const TranslationEditor = lazy(() =>
  import('./pages/TranslationEditor').then((m) => ({ default: m.TranslationEditor }))
);
const ModelStatus = lazy(() =>
  import('./pages/ModelStatus').then((m) => ({ default: m.ModelStatus }))
);
const DataCollection = lazy(() =>
  import('./pages/DataCollection').then((m) => ({ default: m.DataCollection }))
);
const Analytics = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.Analytics }))
);
const SignWorkbook = lazy(() =>
  import('./pages/SignWorkbook').then((m) => ({ default: m.SignWorkbook }))
);
const FeedbackModal = lazy(() =>
  import('./components/FeedbackModal').then((m) => ({ default: m.FeedbackModal }))
);
const GeminiChatbot = lazy(() =>
  import('./components/GeminiChatbot').then((m) => ({ default: m.GeminiChatbot }))
);

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
    <div className="w-12 h-12 rounded-xl border-3 border-charcoal bg-pastel-mint shadow-hard mb-4 flex items-center justify-center font-bold text-lg font-mono animate-bounce">
      ⚡
    </div>
    <p className="font-bold font-display text-charcoal text-base">Loading iNSIGHT view...</p>
    <p className="text-xs text-charcoal-muted mt-1 font-mono">Optimized dynamic bundle delivery</p>
  </div>
);

export const App: React.FC = () => {
  const { activeTab, setActiveTab, accessibility } = useStore();

  const isLanding = activeTab === 'home' || activeTab === 'landing';

  return (
    <div
      style={{
        fontSize: `${accessibility.fontSizeScale * 100}%`,
      }}
      className={`min-h-screen bg-cream-100 text-charcoal flex flex-col font-sans selection:bg-pastel-mint selection:text-charcoal ${
        accessibility.highContrast ? 'bg-black text-white' : ''
      }`}
    >
      <InsightNavbar />

      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {isLanding && <InsightLandingPage />}
          {(activeTab === 'gesture-lab' || activeTab === 'translator') && <GestureLab />}
          {activeTab === 'workbook' && <SignWorkbook />}
          {activeTab === 'connect' && <ConnectPage />}
          {activeTab === 'research' && <ResearchLab />}
          {activeTab === 'learn' && <SignLearningCentre />}
          {activeTab === 'dictionary' && <SignDictionary />}
          {activeTab === 'about' && <AboutPage />}
          {activeTab === 'settings' && <AccessibilitySettingsPage />}
          {activeTab === 'gemma' && <GemmaDashboard />}
          {activeTab === 'editor' && <TranslationEditor />}
          {activeTab === 'status' && <ModelStatus />}
          {activeTab === 'collection' && <DataCollection />}
          {activeTab === 'analytics' && <Analytics />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <FeedbackModal />
        <GeminiChatbot />
      </Suspense>

      {!isLanding && (
        <footer className="border-t-2 border-charcoal bg-white py-4 px-6 text-center text-xs text-charcoal-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-charcoal font-display">iNSIGHT</span>
            <span>•</span>
            <span>Communication without barriers • Open-weight multimodal AI.</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px] text-charcoal">
            <span>Best Use of Gemma 4</span>
            <span>•</span>
            <span>Best Open-Source AI Project</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
