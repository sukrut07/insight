import React from 'react';
import { useStore } from '../store/useStore';
import {
  Sliders,
  Volume2,
  Eye,
  Type,
  Activity,
  Contrast,
  Keyboard,
  Shield,
  RotateCcw,
  Sparkles,
  Camera,
} from 'lucide-react';

export const AccessibilitySettingsPage: React.FC = () => {
  const { accessibility, updateAccessibility } = useStore();

  const handleResetDefaults = () => {
    updateAccessibility({
      largeText: false,
      highContrast: false,
      fontSizeScale: 1.0,
      speechOutput: false,
      speechRate: 175,
      reducedMotion: false,
      visualAlerts: true,
      showLandmarksOverlay: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="neo-card bg-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="neo-pill bg-pastel-pink text-charcoal text-xs font-bold">
                Universal Access
              </span>
              <span className="text-xs font-mono text-charcoal-muted">
                Perception Preferences
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display text-charcoal tracking-tight">
              Accessibility Settings.
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl">
              Personalize visual hierarchy, speech synthesis, and keyboard shortcuts for a comfortable experience.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-4 py-2 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Typography & Contrast */}
        <div className="neo-card bg-white p-6 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b-2 border-charcoal">
            <div className="p-2.5 bg-pastel-mint border-2 border-charcoal rounded-xl text-charcoal shadow-hard-xs">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display text-charcoal">Visual & Typography</h2>
              <p className="text-xs text-charcoal-muted">Scale text and adjust contrast ratios</p>
            </div>
          </div>

          {/* Large Typography Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">Large Typography Mode</span>
              <span className="text-xs text-charcoal-muted">Enlarges primary translation output</span>
            </div>
            <input
              type="checkbox"
              id="large-text-toggle"
              checked={accessibility.largeText}
              onChange={(e) => updateAccessibility({ largeText: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>

          {/* High Contrast Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">High Contrast Mode</span>
              <span className="text-xs text-charcoal-muted">Pure dark background with vivid borders</span>
            </div>
            <input
              type="checkbox"
              id="high-contrast-toggle"
              checked={accessibility.highContrast}
              onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>

          {/* Font Scale Selection */}
          <div className="p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-charcoal">Font Scale Multiplier</span>
              <span className="font-mono text-purple-700">{Math.round(accessibility.fontSizeScale * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1.0, 1.15, 1.3].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => updateAccessibility({ fontSizeScale: scale })}
                  className={`neo-btn py-1.5 text-xs font-mono font-bold transition-all ${
                    accessibility.fontSizeScale === scale
                      ? 'bg-charcoal text-cream-100'
                      : 'bg-white text-charcoal'
                  }`}
                >
                  {Math.round(scale * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio & Speech Feedback */}
        <div className="neo-card bg-white p-6 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b-2 border-charcoal">
            <div className="p-2.5 bg-pastel-lavender border-2 border-charcoal rounded-xl text-charcoal shadow-hard-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display text-charcoal">Audio & Speech Output</h2>
              <p className="text-xs text-charcoal-muted">Configure text-to-speech preferences</p>
            </div>
          </div>

          {/* Automatic Speech Output */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">Auto-Speak Translations</span>
              <span className="text-xs text-charcoal-muted">Speak translated sentences aloud upon completion</span>
            </div>
            <input
              type="checkbox"
              id="speech-toggle"
              checked={accessibility.speechOutput}
              onChange={(e) => updateAccessibility({ speechOutput: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>

          {/* Visual Alerts Alternative */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">Visual Flash Alerts</span>
              <span className="text-xs text-charcoal-muted">Flash indicator on recognition rather than sound</span>
            </div>
            <input
              type="checkbox"
              id="visual-alerts-toggle"
              checked={accessibility.visualAlerts}
              onChange={(e) => updateAccessibility({ visualAlerts: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>

          {/* Speech Rate Slider */}
          <div className="p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-charcoal">Speech Rate (WPM)</span>
              <span className="font-mono text-purple-700">{accessibility.speechRate} wpm</span>
            </div>
            <input
              type="range"
              min="120"
              max="240"
              step="5"
              value={accessibility.speechRate}
              onChange={(e) => updateAccessibility({ speechRate: Number(e.target.value) })}
              className="w-full accent-charcoal cursor-pointer"
            />
          </div>
        </div>

        {/* Camera & Motion */}
        <div className="neo-card bg-white p-6 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b-2 border-charcoal">
            <div className="p-2.5 bg-pastel-blue border-2 border-charcoal rounded-xl text-charcoal shadow-hard-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display text-charcoal">Camera & Motion</h2>
              <p className="text-xs text-charcoal-muted">MediaPipe visual overlays and animations</p>
            </div>
          </div>

          {/* Landmarks Overlay */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">Show Landmarks Skeleton</span>
              <span className="text-xs text-charcoal-muted">Display 21-point tracking mesh over hands</span>
            </div>
            <input
              type="checkbox"
              id="landmarks-toggle"
              checked={accessibility.showLandmarksOverlay}
              onChange={(e) => updateAccessibility({ showLandmarksOverlay: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 rounded-2xl border-2 border-charcoal">
            <div>
              <span className="text-sm font-bold text-charcoal block">Reduced Motion</span>
              <span className="text-xs text-charcoal-muted">Disable non-essential pulse and hover animations</span>
            </div>
            <input
              type="checkbox"
              id="reduced-motion-toggle"
              checked={accessibility.reducedMotion}
              onChange={(e) => updateAccessibility({ reducedMotion: e.target.checked })}
              className="w-5 h-5 accent-charcoal cursor-pointer rounded"
            />
          </div>
        </div>

        {/* Keyboard Navigation Cheatsheet */}
        <div className="neo-card bg-white p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b-2 border-charcoal">
            <div className="p-2.5 bg-pastel-yellow border-2 border-charcoal rounded-xl text-charcoal shadow-hard-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display text-charcoal">Keyboard Navigation</h2>
              <p className="text-xs text-charcoal-muted">Accessible hotkeys and screen-reader controls</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-cream-100 rounded-xl border-2 border-charcoal">
              <span className="text-charcoal-muted font-bold">Spacebar</span>
              <span className="text-charcoal font-semibold">Pause / Resume Recognition</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cream-100 rounded-xl border-2 border-charcoal">
              <span className="text-charcoal-muted font-bold">Shift + Enter</span>
              <span className="text-charcoal font-semibold">Refine / Orchestrate Translation</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cream-100 rounded-xl border-2 border-charcoal">
              <span className="text-charcoal-muted font-bold">Alt + S</span>
              <span className="text-charcoal font-semibold">Speak Translation Aloud</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cream-100 rounded-xl border-2 border-charcoal">
              <span className="text-charcoal-muted font-bold">Alt + C</span>
              <span className="text-charcoal font-semibold">Clear Sentence Tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
