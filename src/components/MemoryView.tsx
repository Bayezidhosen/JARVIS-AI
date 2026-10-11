import React, { useState } from 'react';
import { MemoryItem } from '../types';
import { Brain, Plus, Trash2, Shield, Sparkles, RefreshCw } from 'lucide-react';

interface MemoryViewProps {
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string, category: 'preference' | 'personal' | 'work' | 'system') => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onClearConversationHistory: () => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
  onClearConversationHistory,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<'preference' | 'personal' | 'work' | 'system'>('personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    onAddMemory(key, value, category);
    setKey('');
    setValue('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Neural Memory & Context
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Facts, personal details, and user preferences retained by JARVIS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-start gap-2.5 text-xs text-indigo-200">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-300">Privacy Safeguard:</span> JARVIS never stores passwords, API tokens, credit cards, or sensitive identity documents. Memories are scoped locally and injected only into authorized conversational contexts.
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Memory Key (e.g. User Name, Favorite Language)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="personal">Personal Info</option>
              <option value="preference">Preference / Setting</option>
              <option value="work">Work & Development</option>
              <option value="system">System Context</option>
            </select>
          </div>

          <textarea
            placeholder="Value or details to remember..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Memories List */}
      {memories.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No memories recorded yet. Tell JARVIS: <span className="text-indigo-400">"Amar nam Bayezid, remember this"</span> or click "Add Memory".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-indigo-300">
                    {mem.key}
                  </span>
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-200 break-words mt-1">
                  {mem.value}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 mt-2 font-mono">
                <span className="uppercase text-[10px] text-indigo-400">
                  {mem.category}
                </span>
                <span>
                  {new Date(mem.updatedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone: Memory Management */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onClearConversationHistory}
          className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          Clear Conversation History
        </button>

        {memories.length > 0 && (
          <button
            onClick={onClearAllMemories}
            className="px-3 py-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-900/40 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe All Memories
          </button>
        )}
      </div>
    </div>
  );
};
