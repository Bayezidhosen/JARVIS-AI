import React, { useEffect, useRef } from 'react';
import { AgentStatus } from '../types';

interface AudioVisualizerProps {
  status: AgentStatus;
  analyser?: AnalyserNode | null;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  status,
  analyser,
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      animationId = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (status === 'listening' && analyser) {
        // Real microphone data
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Simulated harmonic wave when speaking, listening without direct mic, or thinking
        phase += 0.08;
        for (let i = 0; i < bufferLength; i++) {
          if (status === 'speaking') {
            dataArray[i] = Math.floor(
              60 +
                Math.sin(phase * 1.5 + i * 0.4) * 50 +
                Math.sin(phase * 0.8 + i * 0.2) * 30
            );
          } else if (status === 'listening') {
            dataArray[i] = Math.floor(
              40 + Math.sin(phase * 2 + i * 0.3) * 35 + Math.random() * 20
            );
          } else if (status === 'thinking') {
            dataArray[i] = Math.floor(
              25 + Math.sin(phase * 3 + i * 0.5) * 20
            );
          } else {
            // Idle gentle hum
            dataArray[i] = Math.floor(8 + Math.sin(phase * 0.5 + i * 0.2) * 5);
          }
        }
      }

      // Draw mirrored bar equalizer
      const numBars = 36;
      const barWidth = Math.max(3, Math.floor(width / numBars) - 2);
      const gap = 3;
      const totalWidth = numBars * (barWidth + gap);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < numBars; i++) {
        const dataIndex = Math.floor((i / numBars) * bufferLength);
        const value = dataArray[dataIndex] || 10;
        const normalized = Math.min(value / 255, 1);

        // Height scaled by status
        let barHeight = Math.max(3, normalized * h * 0.85);
        if (status === 'idle') barHeight = 4 + Math.sin(phase + i * 0.3) * 2;

        const x = startX + i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        // Color based on status
        let gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (status === 'listening') {
          gradient.addColorStop(0, '#34d399');
          gradient.addColorStop(1, '#059669');
        } else if (status === 'speaking') {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#0284c7');
        } else if (status === 'thinking') {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(1, '#7c3aed');
        } else if (status === 'executing') {
          gradient.addColorStop(0, '#facc15');
          gradient.addColorStop(1, '#d97706');
        } else {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, analyser]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden py-1">
      <canvas
        ref={canvasRef}
        width={420}
        height={height}
        className="max-w-full opacity-85 transition-opacity duration-300"
      />
    </div>
  );
};
