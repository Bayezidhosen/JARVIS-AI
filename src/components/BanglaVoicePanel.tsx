import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { jarvisSpeech } from '../utils/speechEngine';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Check,
  ShieldCheck,
  Languages,
  Sliders,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface BanglaVoicePanelProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  browserVoices: SpeechSynthesisVoice[];
}

export const OFFICIAL_BANGLA_TEST_SENTENCE =
  'আসসালামু আলাইকুম! আমি আপনার ব্যক্তিগত এআই সহকারী। আপনি আমাকে বাংলায় যেকোনো প্রশ্ন করতে পারেন। আমি আপনার কথা বুঝে সহজ ও স্পষ্ট বাংলায় উত্তর দেওয়ার চেষ্টা করব।';

export const BANGLA_PRONUNCIATION_TESTS = [
  {
    id: 'official-sentence',
    title: 'মূল পরিচিতি বাক্য (Official Prompt Test)',
    tag: 'প্রমিত বাংলা',
    text: OFFICIAL_BANGLA_TEST_SENTENCE,
  },
  {
    id: 'juktakkhor',
    title: 'যুক্তাক্ষর ও উচ্চারণ স্পষ্টতা',
    tag: 'যুক্তবর্ণ',
    text: 'বিজ্ঞান ও প্রযুক্তির উৎকর্ষে ব্যক্তিগত স্বাস্থ্য, শৃঙ্খলা এবং স্পষ্ট দৃষ্টিভঙ্গি অত্যন্ত গুরুত্বপূর্ণ।',
  },
  {
    id: 'numbers-time',
    title: 'সংখ্যা, তারিখ ও সময়ের উচ্চারণ',
    tag: 'সংখ্যা ও সময়',
    text: 'আজ ১২ই অক্টোবর, এখন সময় সকাল ৯টা ১৫ মিনিট। তাপমাত্রা ৩১ ডিগ্রি সেলসিয়াস এবং রিমাইন্ডার কোড ১২৩৪৫।',
  },
  {
    id: 'tech-terms',
    title: 'ইংরেজি প্রযুক্তিগত শব্দ',
    tag: 'প্রযুক্তি শব্দ',
    text: 'আমি React, TypeScript এবং Node.js দিয়ে তৈরি এআই সহকারী। YouTube ও GitHub-এ কোড ডিবাগ করতে সক্ষম।',
  },
  {
    id: 'mixed-sentence',
    title: 'মিশ্র বাক্য (Bangla-English Mixed)',
    tag: 'মিশ্র বাক্য',
    text: 'আমার জন্য একটা modern portfolio website এর component code তৈরি করুন এবং error সমাধান করুন।',
  },
];

export const BanglaVoicePanel: React.FC<BanglaVoicePanelProps> = ({
  preferences,
  onUpdatePreferences,
  browserVoices,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState<string | null>(null);
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);

  // Play given text with the configured voice engine
  const handlePlayVoiceTest = async (testId: string, testText: string) => {
    if (isPlayingTest === testId) {
      jarvisSpeech.stopSpeaking();
      setIsPlayingTest(null);
      return;
    }

    jarvisSpeech.stopSpeaking();
    setIsPlayingTest(testId);
    setTestStatusMessage('উচ্চারণ প্লে হচ্ছে...');

    try {
      await jarvisSpeech.speakText(testText, {
        voiceEngine: preferences.voiceEngine,
        banglaVoiceType: preferences.banglaVoiceType,
        browserVoiceName: preferences.browserVoiceName,
        banglaVoiceName: preferences.banglaVoiceName,
        voiceLanguageMode: 'bangla',
        rate: preferences.speechRate,
        pitch: preferences.speechPitch,
        volume: preferences.speechVolume,
        fallbackToBrowser: preferences.fallbackToBrowser,
        onStart: () => {
          setIsPlayingTest(testId);
        },
        onEnd: () => {
          setIsPlayingTest(null);
          setTestStatusMessage('উচ্চারণ সম্পন্ন হয়েছে।');
          setTimeout(() => setTestStatusMessage(null), 3000);
        },
        onError: (err) => {
          setIsPlayingTest(null);
          setTestStatusMessage(`ত্রুটি: ${err}`);
          setTimeout(() => setTestStatusMessage(null), 4000);
        },
      });
    } catch {
      setIsPlayingTest(null);
    }
  };

  const handleStopPlaying = () => {
    jarvisSpeech.stopSpeaking();
    setIsPlayingTest(null);
  };

  // Filter available browser Bengali voices
  const installedBengaliVoices = browserVoices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('bn') ||
      v.name.toLowerCase().includes('bangla') ||
      v.name.toLowerCase().includes('bengali')
  );

  return (
    <div className="space-y-5 text-slate-100">
      {/* Voice Engine & Quality Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">বাংলা কণ্ঠস্বর ও উচ্চারণ ইঞ্জিন</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-semibold">
                বাংলা (bn-BD)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রমিত বাংলাদেশি বাংলা উচ্চারণ, ব্যাকরণগত শুদ্ধতা এবং স্বাভাবিক কথ্য কণ্ঠ
            </p>
          </div>
        </div>

        {isPlayingTest && (
          <button
            type="button"
            onClick={handleStopPlaying}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors animate-pulse"
          >
            <VolumeX className="w-4 h-4" />
            <span>ভয়েস থামান</span>
          </button>
        )}
      </div>

      {/* Section 1: Voice Persona Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>পছন্দের বাংলা কণ্ঠস্বর নির্বাচন করুন:</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              id: 'neural-female',
              title: 'বাংলা নিউরাল — নারী কণ্ঠ',
              sub: 'Bangladesh (bn-BD) · স্পষ্ট ও সুমধুর',
              badge: 'প্রস্তাবিত',
              icon: '👩',
            },
            {
              id: 'neural-male',
              title: 'বাংলা নিউরাল — পুরুষ কণ্ঠ',
              sub: 'Bangladesh (bn-BD) · গম্ভীর ও আত্মবিশ্বাসী',
              badge: 'পুরুষ কণ্ঠ',
              icon: '👨',
            },
            {
              id: 'neural-standard',
              title: 'বাংলা নিউরাল — স্ট্যান্ডার্ড',
              sub: 'সুষম ও আনুষ্ঠানিক উচ্চারণ',
              badge: 'স্ট্যান্ডার্ড',
              icon: '🎙️',
            },
            {
              id: 'browser',
              title: 'ব্রাউজার স্পিচ সিন্থেসিস',
              sub: installedBengaliVoices.length > 0 ? `${installedBengaliVoices.length}টি ভয়েস ইনস্টল রয়েছে` : 'সিস্টেম ইঞ্জিন ব্যাকআপ',
              badge: 'ব্রাউজার',
              icon: '🌐',
            },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onUpdatePreferences({ banglaVoiceType: v.id as any })}
              className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                preferences.banglaVoiceType === v.id
                  ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{v.icon}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                  {v.badge}
                </span>
              </div>
              <div className="font-semibold text-xs text-slate-100">{v.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{v.sub}</div>
              {preferences.banglaVoiceType === v.id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Specific Browser Bengali voice selector if browser mode is selected */}
      {preferences.banglaVoiceType === 'browser' && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-fade-in">
          <label className="text-xs text-slate-300 font-medium">ইনস্টল থাকা বাংলা সিস্টেম ভয়েস:</label>
          <select
            value={preferences.banglaVoiceName}
            onChange={(e) => onUpdatePreferences({ banglaVoiceName: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
          >
            <option value="">স্বয়ংক্রিয় নির্বাচন (Auto Select Best Voice)</option>
            {installedBengaliVoices.map((v, i) => (
              <option key={i} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
            {installedBengaliVoices.length === 0 && (
              <option value="system-bn">Google বাংলা / সিস্টেম বাংলা ভয়েস (bn-BD)</option>
            )}
          </select>
          <p className="text-[10px] text-slate-400">
            ক্রোম, এজ বা অ্যান্ড্রয়েডে বিল্ট-ইন বাংলা ভয়েস সক্রিয় থাকলে ডিভাইস থেকে উচ্চারিত হবে।
          </p>
        </div>
      )}

      {/* Section 2: Speech Controls (Speed & Volume & Language Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
        {/* Speaking Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              কথার গতি (Speed):
            </span>
            <span className="font-mono text-cyan-400 text-[11px] font-semibold">
              {preferences.speechRate}x
            </span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.35"
            step="0.05"
            value={preferences.speechRate}
            onChange={(e) => onUpdatePreferences({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>ধীর (0.75x)</span>
            <span>স্বাভাবিক (1.0x)</span>
            <span>দ্রুত (1.35x)</span>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              শব্দের মাত্রা (Volume):
            </span>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">
              {Math.round((preferences.speechVolume ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={preferences.speechVolume ?? 1}
            onChange={(e) => onUpdatePreferences({ speechVolume: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>কম (20%)</span>
            <span>মাঝারি</span>
            <span>পূর্ণ (100%)</span>
          </div>
        </div>

        {/* Spoken Language Mode */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-purple-400" />
            ভাষার অগ্রাধিকার:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'auto', label: 'স্বয়ংক্রিয়' },
              { id: 'bangla', label: 'বাংলা' },
              { id: 'english', label: 'English' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdatePreferences({ voiceLanguageMode: m.id as any })}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all ${
                  preferences.voiceLanguageMode === m.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-400">
            {preferences.voiceLanguageMode === 'bangla'
              ? 'সব উত্তরের জন্য প্রমিত বাংলা কণ্ঠ চালু'
              : preferences.voiceLanguageMode === 'auto'
              ? 'ব্যবহারকারীর ভাষা অনুযায়ী স্বয়ংক্রিয় কণ্ঠ'
              : 'ইংরেজি ভাষার কণ্ঠ চালু'}
          </p>
        </div>
      </div>

      {/* Fallback Option Toggle */}
      <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer">
        <div>
          <div className="font-semibold text-slate-200">সার্ভার ব্যাকআপ ও অফলাইন ফলব্যাক সক্রিয় রাখুন</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            সার্ভার সাময়িক সাড়া না দিলে ব্রাউজার বাংলা স্পিচ ইঞ্জিনের মাধ্যমে কথা বলা অব্যাহত রাখবে
          </div>
        </div>
        <input
          type="checkbox"
          checked={preferences.fallbackToBrowser ?? true}
          onChange={(e) => onUpdatePreferences({ fallbackToBrowser: e.target.checked })}
          className="rounded accent-emerald-500 w-4 h-4 cursor-pointer ml-3"
        />
      </label>

      {/* Section 3: The Official Bengali Pronunciation Test Suite */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span>
              বাংলা উচ্চারণ ও টেস্ট স্যুট (Bengali Pronunciation Tests)
            </span>
          </div>
          {testStatusMessage && (
            <span className="text-[11px] font-mono text-emerald-400 animate-pulse">
              {testStatusMessage}
            </span>
          )}
        </div>

        {/* Main Card: The Official User Prompt Test Sentence */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 relative overflow-hidden shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                অফিসিয়াল টেস্ট বাক্য (Mandatory Sentence)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {preferences.banglaVoiceType === 'neural-female'
                  ? '👩 নারী কণ্ঠ'
                  : preferences.banglaVoiceType === 'neural-male'
                  ? '👨 পুরুষ কণ্ঠ'
                  : '🎙️ স্ট্যান্ডার্ড'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handlePlayVoiceTest('official-sentence', OFFICIAL_BANGLA_TEST_SENTENCE)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPlayingTest === 'official-sentence'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isPlayingTest === 'official-sentence' ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>থামান (Stop)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>উচ্চারণ শুনুন (Play Test)</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm md:text-base text-emerald-100 leading-relaxed font-sans select-all font-medium">
            "{OFFICIAL_BANGLA_TEST_SENTENCE}"
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>✅ প্রমিত স্বরভঙ্গি ও প্রাকৃতিক বাক্যগঠন</span>
            <span>✅ দাঁড়ি ও যতিচিহ্নে স্বাভাবিক বিরতি</span>
            <span>✅ কোনো রোবোটিক অস্পষ্টতা নেই</span>
          </div>
        </div>

        {/* Secondary Category Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {BANGLA_PRONUNCIATION_TESTS.slice(1).map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                    {t.tag}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlayVoiceTest(t.id, t.text)}
                  className={`p-1.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                    isPlayingTest === t.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                  title="Play this pronunciation test"
                >
                  {isPlayingTest === t.id ? (
                    <Square className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  <span>{isPlayingTest === t.id ? 'থামান' : 'টেস্ট'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assurance Footer */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>উচ্চারণ নীতি:</strong> ইংরেজি কারিগরি পরিভাষা (React, YouTube, Code) স্বাভাবিক রেখে বাকি সকল বাক্য শুদ্ধ ব্যাকরণ ও প্রমিত বাংলাদেশি বাংলা উচ্চারণে রূপান্তরিত হয়ে অডিও উৎপন্ন হয়।
        </span>
      </div>
    </div>
  );
};
