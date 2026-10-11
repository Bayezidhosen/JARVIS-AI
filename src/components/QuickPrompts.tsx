import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const prompts = [
    { label: 'YouTube open koro', lang: 'Banglish', text: 'Hey Jarvis, YouTube open koro.' },
    { label: 'Ajker weather bolo', lang: 'Banglish', text: 'Dhakar ajker weather bolo.' },
    { label: 'Portfolio website code', lang: 'Banglish', text: 'Amar jonno ekta portfolio website er modern React code lekho.' },
    { label: 'Reminder set koro', lang: 'Banglish', text: 'Amake kal shokal 9 tay reminder dio meeting attend korar jonno.' },
    { label: 'React tutorial search', lang: 'Banglish', text: 'Google e React tutorial search koro.' },
    { label: 'Current date & time', lang: 'English', text: 'Jarvis, what is the current date and time?' },
    { label: 'Open GitHub', lang: 'English', text: 'Open GitHub for me.' },
    { label: 'ক্যালকুলেটর চালু করো', lang: 'বাংলা', text: 'Jarvis, ক্যালকুলেটর চালু করো।' },
    { label: 'বাংলায় কথা বলো', lang: 'বাংলা', text: 'Jarvis, এখন থেকে বাংলায় কথা বলো।' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-mono text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Try sample commands:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors disabled:opacity-50 disabled:pointer-events-none text-left flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="text-[10px] text-slate-500 uppercase font-mono">
              {p.lang}
            </span>
            <span className="text-slate-200">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
