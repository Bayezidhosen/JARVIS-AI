import React, { useRef, useEffect } from 'react';
import { Message, ToolExecutionResult } from '../types';
import {
  Volume2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  FileText,
  Mail,
  CloudSun,
  Terminal,
  Brain,
  Search,
  Sparkles,
} from 'lucide-react';

interface ConversationPanelProps {
  messages: Message[];
  onReplayAudio: (text: string, speechTextBn?: string) => void;
  activeStatus: string;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  onReplayAudio,
  activeStatus,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, activeStatus]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'open_website':
        return <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />;
      case 'search_web':
        return <Search className="w-3.5 h-3.5 text-blue-400" />;
      case 'get_weather':
        return <CloudSun className="w-3.5 h-3.5 text-amber-400" />;
      case 'manage_notes':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'manage_reminders':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'draft_message':
        return <Mail className="w-3.5 h-3.5 text-pink-400" />;
      case 'desktop_agent_action':
        return <Terminal className="w-3.5 h-3.5 text-yellow-400" />;
      case 'manage_memory':
        return <Brain className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[500px] min-h-[320px] rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-inner"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              JARVIS AI Ready
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Press the Orb or Microphone, or type below. Speak freely in{' '}
              <strong className="text-cyan-300">English</strong>,{' '}
              <strong className="text-emerald-300">বাংলা (Bangla)</strong>, or{' '}
              <strong className="text-violet-300">Banglish</strong>!
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Sender label and metadata */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1 font-mono">
                <span className={isUser ? 'text-blue-300 font-medium' : 'text-cyan-300 font-medium'}>
                  {isUser ? 'You' : 'JARVIS'}
                </span>
                <span>·</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {msg.language && (
                  <>
                    <span>·</span>
                    <span className="text-[10px] text-slate-400">
                      {msg.language}
                    </span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all shadow-md ${
                  isUser
                    ? 'bg-blue-600/90 text-white border border-blue-500/40 rounded-tr-sm'
                    : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-sm backdrop-blur-md'
                }`}
              >
                {/* Text body with markdown-like code formatting */}
                <div className="whitespace-pre-wrap break-words">
                  {msg.text}
                </div>

                {/* Tool executions summary cards */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1.5">
                    <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                      Actions Executed
                    </div>
                    {msg.toolsUsed.map((tool: ToolExecutionResult, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs text-slate-200"
                      >
                        <div className="p-1 rounded bg-slate-800">
                          {renderToolIcon(tool.toolName)}
                        </div>
                        <div className="flex-1 truncate">
                          <span className="font-semibold text-cyan-300 mr-1.5">
                            {tool.action}:
                          </span>
                          <span className="text-slate-300">{tool.details}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            tool.status === 'success'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {tool.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Action Bar for JARVIS replies */}
              {!isUser && (
                <div className="flex items-center gap-2 px-1 text-slate-400">
                  <button
                    onClick={() => onReplayAudio(msg.speechText || msg.text, msg.speechTextBn)}
                    title="Speak audio"
                    className="p-1 rounded hover:bg-slate-800 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Play Voice</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    title="Copy response"
                    className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
