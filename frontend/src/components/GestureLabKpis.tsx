import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, Globe, Gauge, Clock, CheckCircle, Hand } from 'lucide-react';

export const GestureLabKpis: React.FC = () => {
  const {
    currentLabel,
    confidence,
    isStable,
    latencyMs,
    handsDetected,
    leftHand,
    rightHand,
    activeLanguage,
    sentenceTokens,
  } = useStore();

  // Determine Calibrated Recognition Status
  let recognitionStatus = 'Waiting for hands';
  let statusBadgeColor = 'bg-cream-100 text-charcoal-muted';

  if (handsDetected === 0) {
    recognitionStatus = 'No hands in frame';
    statusBadgeColor = 'bg-cream-200 text-charcoal-muted';
  } else if (confidence >= 0.75 && currentLabel !== 'NONE' && currentLabel !== 'UNKNOWN') {
    recognitionStatus = isStable ? 'High Confidence (Stable)' : 'High Confidence';
    statusBadgeColor = 'bg-pastel-mint text-emerald-900 border-emerald-600';
  } else if (confidence >= 0.45 && currentLabel !== 'NONE' && currentLabel !== 'UNKNOWN') {
    recognitionStatus = 'Medium (Confirmation Needed)';
    statusBadgeColor = 'bg-pastel-yellow text-amber-900 border-amber-600';
  } else if (handsDetected > 0) {
    recognitionStatus = 'Sign not recognised';
    statusBadgeColor = 'bg-pastel-pink text-rose-900 border-rose-500';
  }

  // Tracking Status
  let trackingStatusText = 'No hands detected';
  if (handsDetected >= 2) {
    trackingStatusText = 'Dual hands tracked';
  } else if (handsDetected === 1) {
    trackingStatusText = leftHand ? 'Left hand tracked' : 'Right hand tracked';
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Recognition Status */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Status</span>
            <Activity className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1.5">
            <span
              className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-lg border border-charcoal/30 ${statusBadgeColor}`}
            >
              {recognitionStatus}
            </span>
          </div>
          <div className="text-[10px] text-charcoal-muted truncate">
            {currentLabel !== 'NONE' ? `Sign: ${currentLabel}` : 'Camera standby'}
          </div>
        </div>

        {/* KPI 2: Active Language */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Language</span>
            <Globe className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1 text-lg font-black font-display text-charcoal">
            {activeLanguage}
          </div>
          <div className="text-[10px] text-charcoal-muted truncate">
            {activeLanguage === 'ISL'
              ? 'Indian Sign Language'
              : activeLanguage === 'BSL'
              ? 'British Sign Language'
              : 'American Sign Language'}
          </div>
        </div>

        {/* KPI 3: Calibrated Confidence */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Confidence</span>
            <Gauge className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1 text-lg font-black font-display text-charcoal">
            {handsDetected > 0 ? `${(confidence * 100).toFixed(1)}%` : '0.0%'}
          </div>
          <div className="text-[10px] text-charcoal-muted">
            {confidence >= 0.75 ? 'Tier: High' : confidence >= 0.45 ? 'Tier: Medium' : 'Tier: Low'}
          </div>
        </div>

        {/* KPI 4: Recognition Latency */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Latency</span>
            <Clock className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1 text-lg font-black font-display text-charcoal">
            {latencyMs > 0 ? `${latencyMs}ms` : '< 25ms'}
          </div>
          <div className="text-[10px] text-charcoal-muted">Pipeline + Inference</div>
        </div>

        {/* KPI 5: Session Detected Signs */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Detected Signs</span>
            <CheckCircle className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1 text-lg font-black font-display text-charcoal">
            {sentenceTokens.length}
          </div>
          <div className="text-[10px] text-charcoal-muted">In current session</div>
        </div>

        {/* KPI 6: Hand Tracking Status */}
        <div className="bg-white border-2 border-charcoal rounded-2xl p-3 shadow-hard-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-charcoal-muted text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Tracking</span>
            <Hand className="w-3.5 h-3.5 text-charcoal" />
          </div>
          <div className="my-1 text-sm font-extrabold text-charcoal truncate">
            {trackingStatusText}
          </div>
          <div className="text-[10px] text-charcoal-muted">
            {handsDetected} of 2 hands active
          </div>
        </div>
      </div>
    </div>
  );
};
