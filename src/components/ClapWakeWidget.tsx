import React, { useState } from 'react';
import { ClapWakeStatus } from '../types';
import {
  Volume2,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Hand,
  Sparkles,
  Mic,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ClapWakeWidgetProps {
  enabled: boolean;
  status: ClapWakeStatus;
  currentLevel: number;
  threshold: number;
  sensitivity: 'low' | 'medium' | 'high';
  micPermission?: 'unknown' | 'granted' | 'denied';
  onToggleEnabled: (enabled: boolean) => void;
  onChangeSensitivity: (sensitivity: 'low' | 'medium' | 'high') => void;
  onTestTrigger: () => void;
  onManualWake: () => void;
}

export const ClapWakeWidget: React.FC<ClapWakeWidgetProps> = ({
  enabled,
  status,
  currentLevel,
  threshold,
  sensitivity,
  micPermission = 'unknown',
  onToggleEnabled,
  onChangeSensitivity,
  onTestTrigger,
  onManualWake,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Meter percentage (0 to 100%)
  const levelPercent = Math.min(100, Math.round(currentLevel * 200));
  const thresholdPercent = Math.min(100, Math.round(threshold * 200));

  const handleToggleClick = (targetChecked: boolean) => {
    if (targetChecked && micPermission !== 'granted') {
      setShowPermissionPrompt(true);
    } else {
      onToggleEnabled(targetChecked);
    }
  };

  const confirmEnableWithPermission = () => {
    setShowPermissionPrompt(false);
    onToggleEnabled(true);
  };

  return (
    <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
      {/* Top Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              enabled
                ? status === 'detected'
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse'
                  : status === 'listening'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce'
                  : status === 'first_clap'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {status === 'listening' ? (
              <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Hand className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 tracking-wide">
                Double Clap Wake-Up
              </span>
              {/* Permission pill */}
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                  micPermission === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : micPermission === 'denied'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {micPermission === 'granted'
                  ? 'Mic: Ready'
                  : micPermission === 'denied'
                  ? 'Mic: Blocked'
                  : 'Mic: On Demand'}
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                title="Browser & Platform Info"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Hands-free wake: Clap twice (300-800ms) to trigger JARVIS
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggleClick(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Permission Explanation Modal / Banner */}
      {showPermissionPrompt && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-200 space-y-2 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 font-semibold text-cyan-300">
            <Mic className="w-4 h-4 text-cyan-400" />
            <span>Microphone Permission Request</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Double Clap Wake Mode requires temporary microphone access to continuously monitor for two rapid hand claps (300ms–800ms apart).
          </p>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>100% Local Processing: No audio stream is ever recorded, stored, or uploaded.</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowPermissionPrompt(false)}
              className="px-3 py-1 text-[11px] rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmEnableWithPermission}
              className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
            >
              Allow & Enable
            </button>
          </div>
        </div>
      )}

      {/* Info explanation popup */}
      {showInfo && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-[11px] text-slate-300 space-y-2 animate-fade-in">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Platform & Browser Behavior:
          </div>
          <p className="text-slate-400 leading-relaxed">
            • <strong>Local Processing:</strong> All acoustic transients are analyzed locally on-device using Web Audio API bandpass filtering (1.5kHz–5.5kHz). Zero audio data is stored or transmitted.
          </p>
          <p className="text-slate-400 leading-relaxed">
            • <strong>Active Page & Background:</strong> In standard web browsers, microphone listening runs while this tab is open. If your browser suspends audio in hidden tabs, you can keep the tab active or use the manual wake button.
          </p>
          <p className="text-slate-400 leading-relaxed">
            • <strong>Echo Suppression:</strong> The detector automatically inserts a 450ms settling pause after wake-up so the claps themselves are never misidentified as voice commands.
          </p>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="text-[10px] text-cyan-400 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* State Badge Bar: 4 Specific States (Disabled, Waiting for Claps, Double Clap Detected, Listening) */}
      <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">Detection State:</span>
          {/* Status Pills */}
          {!enabled ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Disabled
            </span>
          ) : status === 'detected' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Double Clap Detected!
            </span>
          ) : status === 'listening' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Listening...
            </span>
          ) : status === 'first_clap' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-400 animate-pulse flex items-center gap-1">
              <span>👏</span>
              Clap 1 Heard (Clap again now!)
            </span>
          ) : status === 'error' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-500/20 text-red-300 border border-red-500/40">
              Mic Error
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Waiting for Claps
            </span>
          )}
        </div>

        {/* Dual Clap Visual Progress */}
        {enabled && (
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all ${
                status === 'first_clap' || status === 'detected' || status === 'listening'
                  ? 'bg-amber-500/30 border border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-600'
              }`}
              title="First Clap"
            >
              👏1
            </div>
            <span className="text-slate-600 text-[10px]">➔</span>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all ${
                status === 'detected' || status === 'listening'
                  ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 shadow-sm animate-pulse'
                  : 'bg-slate-900 border border-slate-800 text-slate-600'
              }`}
              title="Second Clap"
            >
              👏2
            </div>
          </div>
        )}
      </div>

      {/* When Enabled: Acoustic Transient Meter & Controls */}
      {enabled ? (
        <div className="space-y-2.5 pt-1">
          {/* Transient Energy Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Acoustic Transient Energy</span>
              <span>
                Energy: {levelPercent}% · Threshold: {thresholdPercent}%
              </span>
            </div>

            <div className="relative w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              {/* Dynamic Energy Bar */}
              <div
                className={`h-full transition-all duration-75 ${
                  levelPercent >= thresholdPercent ? 'bg-cyan-400 shadow-sm' : 'bg-emerald-500'
                }`}
                style={{ width: `${levelPercent}%` }}
              />

              {/* Threshold Needle Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_4px_#f59e0b]"
                style={{ left: `${thresholdPercent}%` }}
                title={`Trigger Threshold (${thresholdPercent}%)`}
              />
            </div>
          </div>

          {/* Sensitivity & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Sensitivity:</span>
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeSensitivity(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                    sensitivity === s
                      ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  title={`${s.toUpperCase()} sensitivity`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Test Trigger & Manual Wake */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onTestTrigger}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                title="Simulate two claps to test wake-up sequence immediately"
              >
                <span>👏 Test Trigger</span>
              </button>

              <button
                type="button"
                onClick={onManualWake}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Manually wake JARVIS immediately"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Manual Wake</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Mode is disabled. Turn toggle on for hands-free wake.</span>
          <button
            type="button"
            onClick={onManualWake}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Manually wake JARVIS immediately"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Manual Wake</span>
          </button>
        </div>
      )}
    </div>
  );
};
