import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ActiveTab } from '../types';
import { fetchModelStatus } from '../services/api';
import {
  Video,
  Languages,
  Activity,
  FolderPlus,
  BarChart3,
  Home,
  Cpu,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Sliders,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, modelStatus, setModelStatus, activeLanguage } = useStore();

  useEffect(() => {
    fetchModelStatus()
      .then(setModelStatus)
      .catch((err) => console.error('Failed to fetch model status:', err));
    const interval = setInterval(() => {
      fetchModelStatus().then(setModelStatus).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [setModelStatus]);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'translator', label: 'Translator', icon: <Video className="w-4 h-4" /> },
    { id: 'learn', label: 'Learn & Practice', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'dictionary', label: 'Dictionary', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'gemma', label: 'Gemma 4 AI', icon: <Sparkles className="w-4 h-4 text-brand-cyan" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Accessibility', icon: <Sliders className="w-4 h-4" /> },
    { id: 'status', label: 'Diagnostics', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-dark-950/85 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('translator')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-cyan/20">
          <Languages className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-white">SignBridge 2.0</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
              {activeLanguage} • Multilingual
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">ISL • BSL • ASL Local Intelligence Platform</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center space-x-1 glass-panel px-1.5 py-1 rounded-xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-cyan text-dark-950 font-semibold shadow-md shadow-brand-cyan/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Hardware / Engine Telemetry Badges */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-800 text-slate-300">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Execution</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-800 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="font-mono text-[11px]">
            {modelStatus?.mps_gpu_acceleration ? 'Apple MPS' : 'CPU'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-800">
          {modelStatus?.ollama_available ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">Gemma 4</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[11px]">Literal Mode</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
