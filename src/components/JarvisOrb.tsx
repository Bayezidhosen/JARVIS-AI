import React, { useMemo } from 'react';
import { AgentStatus } from '../types';
import { Mic, MicOff, Volume2, Cpu, Sparkles, Loader2 } from 'lucide-react';

interface JarvisOrbProps {
  status: AgentStatus;
  isListening: boolean;
  audioLevel?: number; // 0 to 1
  onClick: () => void;
  statusLabel?: string;
}

export const JarvisOrb: React.FC<JarvisOrbProps> = ({
  status,
  isListening,
  audioLevel = 0,
  onClick,
  statusLabel,
}) => {
  // Theme styling based on active status
  const config = useMemo(() => {
    switch (status) {
      case 'listening':
        return {
          glowColor: 'rgba(16, 185, 129, 0.6)',
          ringColor: 'border-emerald-500/70',
          innerGlow: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-400/40',
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: <Mic className="w-8 h-8 text-emerald-300 animate-pulse" />,
          title: 'LISTENING',
          subtitle: 'Awaiting your command...',
        };
      case 'thinking':
        return {
          glowColor: 'rgba(139, 92, 246, 0.7)',
          ringColor: 'border-violet-500/70',
          innerGlow: 'bg-violet-500',
          textColor: 'text-violet-400',
          borderColor: 'border-violet-400/40',
          badgeBg: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
          icon: <Loader2 className="w-8 h-8 text-violet-300 animate-spin" />,
          title: 'THINKING',
          subtitle: 'Synthesizing neural response...',
        };
      case 'speaking':
        return {
          glowColor: 'rgba(6, 182, 212, 0.8)',
          ringColor: 'border-cyan-400/80',
          innerGlow: 'bg-cyan-400',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-400/50',
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          icon: <Volume2 className="w-8 h-8 text-cyan-300 animate-bounce" />,
          title: 'SPEAKING',
          subtitle: 'Click to interrupt anytime',
        };
      case 'executing':
        return {
          glowColor: 'rgba(234, 179, 8, 0.7)',
          ringColor: 'border-amber-500/75',
          innerGlow: 'bg-amber-400',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-400/40',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <Cpu className="w-8 h-8 text-amber-300 animate-pulse" />,
          title: 'EXECUTING',
          subtitle: 'Running requested tool protocol...',
        };
      case 'idle':
      default:
        return {
          glowColor: 'rgba(59, 130, 246, 0.4)',
          ringColor: 'border-cyan-500/40',
          innerGlow: 'bg-blue-500',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/30',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
          title: 'STANDBY',
          subtitle: 'Click orb or mic to activate',
        };
    }
  }, [status]);

  // Dynamic scale calculation based on audio loudness
  const dynamicScale = 1 + Math.min(audioLevel * 0.45, 0.35);

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Background radial glow */}
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, rgba(2, 6, 23, 0) 70%)`,
          transform: `scale(${dynamicScale * 1.1})`,
        }}
      />

      {/* Outer interactive Orb wrapper */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`JARVIS AI status: ${config.title}. Click to toggle voice control.`}
        className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full transition-transform active:scale-95"
      >
        {/* Main circular frame */}
        <div
          className="relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center p-2 transition-all duration-500"
          style={{ transform: `scale(${dynamicScale})` }}
        >
          {/* Outermost dotted tactical orbit ring */}
          <div
            className={`absolute inset-0 rounded-full border border-dashed ${config.ringColor} animate-ring-slow opacity-60`}
          />

          {/* Secondary rotating segmented ring */}
          <div
            className={`absolute inset-2 rounded-full border-t-2 border-b-2 border-transparent ${config.borderColor} animate-ring-reverse opacity-80`}
          />

          {/* Third geometric ring with tick accents */}
          <div className="absolute inset-5 rounded-full border border-cyan-500/20 flex items-center justify-center">
            <div className="absolute top-0 w-2 h-1 bg-cyan-400/80 rounded-full" />
            <div className="absolute bottom-0 w-2 h-1 bg-cyan-400/80 rounded-full" />
            <div className="absolute left-0 w-1 h-2 bg-cyan-400/80 rounded-full" />
            <div className="absolute right-0 w-1 h-2 bg-cyan-400/80 rounded-full" />
          </div>

          {/* Fourth pulsing acoustic ring */}
          <div
            className={`absolute inset-7 rounded-full border-2 ${config.ringColor} transition-transform duration-300 ${
              status === 'speaking' || status === 'listening' ? 'animate-ping opacity-25' : 'opacity-40'
            }`}
          />

          {/* Core Orb sphere */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl flex flex-col items-center justify-center overflow-hidden group-hover:border-cyan-300 transition-colors">
            {/* Holographic inner gradient */}
            <div
              className={`absolute inset-0 opacity-30 ${config.innerGlow} blur-lg transition-colors duration-500`}
            />

            {/* Rotating core lattice lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />

            {/* Center Status Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {config.icon}
            </div>

            {/* Subtle core pulse ring */}
            <div
              className={`absolute w-16 h-16 rounded-full border border-cyan-400/30 ${
                status !== 'idle' ? 'animate-pulse' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Holographic Status readout */}
      <div className="mt-4 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono tracking-wider transition-colors duration-300 uppercase shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'listening'
                ? 'bg-emerald-400 animate-ping'
                : status === 'speaking'
                ? 'bg-cyan-400 animate-pulse'
                : status === 'thinking'
                ? 'bg-violet-400 animate-ping'
                : status === 'executing'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-blue-400'
            }`}
          />
          <span className={`font-semibold ${config.textColor}`}>
            {statusLabel || config.title}
          </span>
          <span className="text-slate-500 text-[10px]">·</span>
          <span className="text-slate-400 text-[11px] lowercase tracking-normal">
            {config.subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};
