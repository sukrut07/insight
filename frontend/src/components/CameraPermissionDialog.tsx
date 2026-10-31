import React from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, X, Video } from 'lucide-react';
import { CameraDevice, CameraErrorResult } from '../services/cameraService';

interface CameraPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableCamera: (deviceId?: string) => Promise<boolean>;
  devices: CameraDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  error: CameraErrorResult | null;
  isRequesting: boolean;
}

export const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({
  isOpen,
  onClose,
  onEnableCamera,
  devices,
  selectedDeviceId,
  onSelectDevice,
  error,
  isRequesting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="neo-card bg-white max-w-lg w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-charcoal hover:bg-cream-100 p-1.5 rounded-lg border-2 border-charcoal/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-pastel-mint border-2 border-charcoal rounded-2xl text-charcoal shadow-hard-xs">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 id="camera-dialog-title" className="text-xl font-black font-display text-charcoal">
              Camera Access Required
            </h2>
            <p className="text-xs text-charcoal-muted font-mono font-bold">
              User-Initiated Perception Workflow
            </p>
          </div>
        </div>

        <div className="space-y-4 my-5 text-xs text-charcoal-muted leading-relaxed">
          <p>
            iNSIGHT uses real-time computer vision (MediaPipe Holistic) to track hands,
            posture, and spatial movements to interpret sign language.
          </p>

          <div className="p-4 bg-pastel-mint/40 border-2 border-charcoal rounded-2xl flex items-start space-x-3 text-charcoal">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-800 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-xs">Local Privacy Guarantee</span>
              All camera frames are processed strictly locally in your browser and local Python AI runtime.
              Your camera feed is never uploaded to any cloud services.
            </div>
          </div>

          {devices.length > 1 && (
            <div className="space-y-1.5">
              <label htmlFor="camera-select" className="block text-xs font-bold text-charcoal">
                Select Camera Input:
              </label>
              <select
                id="camera-select"
                value={selectedDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="w-full bg-cream-100 border-2 border-charcoal rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none focus:ring-2 focus:ring-pastel-mint"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-pastel-pink border-2 border-charcoal rounded-2xl flex items-start space-x-3 text-xs text-charcoal">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-700 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">{error.message}</span>
                <span className="text-charcoal-muted">{error.actionableHint}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-charcoal">
          <button
            type="button"
            onClick={onClose}
            className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRequesting}
            onClick={async () => {
              const ok = await onEnableCamera(selectedDeviceId || undefined);
              if (ok) onClose();
            }}
            className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal px-5 py-2 text-xs font-bold flex items-center space-x-2"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting Access...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Enable Camera</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
