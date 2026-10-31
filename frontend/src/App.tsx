import React from 'react';
import { useStore } from './store/useStore';
import { InsightNavbar } from './components/InsightNavbar';
import { FeedbackModal } from './components/FeedbackModal';
import { InsightLandingPage } from './pages/InsightLandingPage';
import { GestureLab } from './pages/GestureLab';
import { AboutPage } from './pages/AboutPage';
import { SignLearningCentre } from './pages/SignLearningCentre';
import { SignDictionary } from './pages/SignDictionary';
import { AccessibilitySettingsPage } from './pages/AccessibilitySettingsPage';
import { GemmaDashboard } from './pages/GemmaDashboard';
import { ConnectPage } from './pages/ConnectPage';
import { ResearchLab } from './pages/ResearchLab';
import { TranslationEditor } from './pages/TranslationEditor';
import { ModelStatus } from './pages/ModelStatus';
import { DataCollection } from './pages/DataCollection';
import { Analytics } from './pages/Analytics';
import { SignWorkbook } from './pages/SignWorkbook';

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
      </main>

      <FeedbackModal />

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
