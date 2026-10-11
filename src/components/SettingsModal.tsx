import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { BanglaVoicePanel } from './BanglaVoicePanel';
import {
  Settings,
  X,
  Volume2,
  Mic,
  Palette,
  Shield,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  browserVoices: SpeechSynthesisVoice[];
  initialTab?: 'bangla' | 'voice' | 'clap' | 'general';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  browserVoices,
  initialTab = 'bangla',
}) => {
  const [activeTab, setActiveTab] = useState<'bangla' | 'voice' | 'clap' | 'general'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                JARVIS System Configuration
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Bengali Neural Voice · Audio Engine · Speech Recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bangla')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bangla'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇧🇩</span>
            <span>বাংলা ভয়েস ও টেস্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>ভয়েস ইঞ্জিন (English/Neural)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clap')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clap'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👏</span>
            <span>ডাবল ক্ল্যাপ ওয়েক-আপ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-slate-700 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>সাধারণ ও থিম</span>
          </button>
        </div>

        {/* TAB 1: BANGLA VOICE & PRONUNCIATION TEST SUITE */}
        {activeTab === 'bangla' && (
          <div className="animate-fade-in pt-1">
            <BanglaVoicePanel
              preferences={preferences}
              onUpdatePreferences={onUpdatePreferences}
              browserVoices={browserVoices}
            />
          </div>
        )}

        {/* TAB 2: GENERAL VOICE ENGINE & ENGLISH VOICES */}
        {activeTab === 'voice' && (
          <div className="space-y-4 animate-fade-in pt-1">
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">ইংরেজি ও সাধারণ স্পিচ ইঞ্জিন:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePreferences({ voiceEngine: 'browser' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    preferences.voiceEngine === 'browser'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Browser Speech Synthesis</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ডিভাইস নেটিভ স্পিচ এপিআই</div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdatePreferences({ voiceEngine: 'gemini' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    preferences.voiceEngine === 'gemini'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Gemini Neural Voice</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ইংরেজি কণ্ঠের জন্য হাই-কোয়ালিটি মডেল</div>
                </button>
              </div>
            </div>

            {/* Gemini Voice Persona */}
            {preferences.voiceEngine === 'gemini' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Gemini Voice Persona (ইংরেজি কথপোকথনে):</label>
                <select
                  value={preferences.geminiVoice}
                  onChange={(e) => onUpdatePreferences({ geminiVoice: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                >
                  <option value="Zephyr">Zephyr (Calm, articulate, pleasant)</option>
                  <option value="Puck">Puck (Energetic, sharp)</option>
                  <option value="Kore">Kore (Polite, warm)</option>
                  <option value="Fenrir">Fenrir (Deep, authoritative)</option>
                  <option value="Charon">Charon (Measured, stoic)</option>
                </select>
              </div>
            )}

            {/* Browser English Voice */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300">ইংরেজি ব্রাউজার কণ্ঠ:</label>
              <select
                value={preferences.browserVoiceName}
                onChange={(e) => onUpdatePreferences({ browserVoiceName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              >
                <option value="">স্বয়ংক্রিয় সিস্টেম ভয়েস</option>
                {browserVoices
                  .filter((v) => v.lang.startsWith('en'))
                  .map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: DOUBLE CLAP WAKE UP SETTINGS */}
        {activeTab === 'clap' && (
          <div className="space-y-3 animate-fade-in pt-1">
            <label className="flex items-center justify-between text-xs cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-slate-200 font-medium">হ্যান্ডস-ফ্রি ডাবল ক্ল্যাপ ওয়েক-আপ সক্রিয় করুন</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  দুইবার হাততালি দিলে JARVIS সক্রিয় হবে এবং ভয়েস শোনার জন্য প্রস্তুত হবে
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.doubleClapWakeEnabled}
                onChange={(e) => onUpdatePreferences({ doubleClapWakeEnabled: e.target.checked })}
                className="rounded accent-emerald-500 w-5 h-5 cursor-pointer ml-3 shrink-0"
              />
            </label>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>ক্ল্যাপ শনাক্তকরণ সেনসিটিভিটি:</span>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    {preferences.clapSensitivity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onUpdatePreferences({ clapSensitivity: lvl })}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono uppercase transition-colors ${
                        preferences.clapSensitivity === lvl
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400">সর্বনিম্ন ব্যবধান (ms):</label>
                  <input
                    type="number"
                    min={150}
                    max={500}
                    step={25}
                    value={preferences.clapMinInterval}
                    onChange={(e) =>
                      onUpdatePreferences({ clapMinInterval: Number(e.target.value) || 250 })
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">সর্বোচ্চ ব্যবধান (ms):</label>
                  <input
                    type="number"
                    min={500}
                    max={1200}
                    step={50}
                    value={preferences.clapMaxInterval}
                    onChange={(e) =>
                      onUpdatePreferences({ clapMaxInterval: Number(e.target.value) || 800 })
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GENERAL & THEME */}
        {activeTab === 'general' && (
          <div className="space-y-4 animate-fade-in pt-1">
            {/* Theme */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-cyan-400" />
                ভিজ্যুয়াল ইন্টারফেস থিম:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cyber-dark', label: 'Deep Cyber' },
                  { id: 'neon-blue', label: 'Arc Reactor' },
                  { id: 'light', label: 'Clean Light' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onUpdatePreferences({ theme: th.id as any })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      preferences.theme === th.id
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center justify-between text-xs cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">প্রসিডিউরাল অডিও সাউন্ড ইফেক্টস (চিমস)</span>
                <input
                  type="checkbox"
                  checked={preferences.soundEffects}
                  onChange={(e) => onUpdatePreferences({ soundEffects: e.target.checked })}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">ভয়েস কমান্ডের পর স্বয়ংক্রিয়ভাবে অডিও কথা বলা</span>
                <input
                  type="checkbox"
                  checked={preferences.autoSpeak}
                  onChange={(e) => onUpdatePreferences({ autoSpeak: e.target.checked })}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">গুরুত্বপূর্ণ বা ক্ষতিকর কাজের আগে সম্মতি চাওয়া</span>
                <input
                  type="checkbox"
                  checked={preferences.requireConfirmations}
                  onChange={(e) => onUpdatePreferences({ requireConfirmations: e.target.checked })}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <div className="text-[10px] text-slate-400 font-mono">
            {activeTab === 'bangla' && '🇧🇩 প্রমিত বাংলাদেশি বাংলা নিউরাল অডিও ইঞ্জিন সক্রিয়'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-md cursor-pointer"
          >
            পরিবর্তন প্রয়োগ ও বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
