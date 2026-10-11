import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentStatus,
  Message,
  NoteItem,
  ReminderItem,
  MemoryItem,
  ActivityLogItem,
  UserPreferences,
  PendingAction,
  ToolExecutionResult,
  ClapWakeStatus,
} from './types';
import { jarvisSpeech } from './utils/speechEngine';
import { soundEffects } from './utils/soundEffects';
import { doubleClapDetector } from './utils/clapDetector';
import { JarvisOrb } from './components/JarvisOrb';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ConversationPanel } from './components/ConversationPanel';
import { QuickPrompts } from './components/QuickPrompts';
import { NotesView } from './components/NotesView';
import { RemindersView } from './components/RemindersView';
import { MemoryView } from './components/MemoryView';
import { ActivityLogView } from './components/ActivityLogView';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ClapWakeWidget } from './components/ClapWakeWidget';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  FileText,
  Calendar,
  Brain,
  ShieldCheck,
  Radio,
  Sun,
  Moon,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_PREFERENCES: UserPreferences = {
  voiceEngine: 'gemini',
  geminiVoice: 'Zephyr',
  banglaVoiceType: 'neural-female',
  browserVoiceName: '',
  banglaVoiceName: '',
  voiceLanguageMode: 'auto',
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  speechLanguage: 'auto',
  autoSpeak: true,
  continuousListening: false,
  soundEffects: true,
  fallbackToBrowser: true,
  theme: 'cyber-dark',
  requireConfirmations: true,
  desktopAgentEnabled: true,
  doubleClapWakeEnabled: false,
  clapSensitivity: 'medium',
  clapMinInterval: 250,
  clapMaxInterval: 800,
};

export default function App() {
  // Navigation & Core States
  const [activeTab, setActiveTab] = useState<'console' | 'notes' | 'reminders' | 'memory' | 'logs'>('console');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('jarvis_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'initial-welcome',
        sender: 'jarvis',
        text: 'Greetings, sir. JARVIS online and all protocols ready. How may I assist you today? (আপনি বাংলায়, ইংরেজিতে বা বাংলিশে কথা বলতে পারেন।)',
        speechText: 'Greetings, sir. JARVIS online and all protocols ready. How may I assist you today?',
        timestamp: Date.now(),
        language: 'English',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingAction | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Double Clap Wake Mode States
  const [clapStatus, setClapStatus] = useState<ClapWakeStatus>('disabled');
  const [clapEnergyLevel, setClapEnergyLevel] = useState(0);
  const [clapThreshold, setClapThreshold] = useState(0.26);
  const [wakeNotification, setWakeNotification] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('jarvis_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'note-1',
        title: 'Review React 19 features',
        content: 'Check Server Actions, useActionState, and new compiler improvements.',
        category: 'Code',
        pinned: true,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'note-2',
        title: 'Grocery checklist',
        content: 'Milk, green tea, fruits, fresh coffee beans.',
        category: 'Personal',
        pinned: false,
        createdAt: Date.now() - 7200000,
      },
    ];
  });

  // Reminders state
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('jarvis_reminders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'rem-1',
        title: 'Team Architecture Sync',
        dueDate: 'Today',
        dueTime: '04:00 PM',
        priority: 'high',
        completed: false,
        createdAt: Date.now() - 1000000,
      },
      {
        id: 'rem-2',
        title: 'Daily Standup Meeting',
        dueDate: 'Tomorrow',
        dueTime: '09:00 AM',
        priority: 'normal',
        completed: false,
        createdAt: Date.now() - 2000000,
      },
    ];
  });

  // Memories state
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('jarvis_memories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'mem-1',
        key: 'User Name',
        value: 'Sir / Bayezid',
        category: 'personal',
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'mem-2',
        key: 'Preferred Languages',
        value: 'Bangla, English, and Banglish',
        category: 'preference',
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'mem-3',
        key: 'Primary Tech Stack',
        value: 'TypeScript, React, Node.js, Tailwind CSS',
        category: 'work',
        updatedAt: Date.now() - 86400000,
      },
    ];
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    const saved = localStorage.getItem('jarvis_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'log-init',
        timestamp: Date.now(),
        command: 'System Boot & Neural Core Initialized',
        tool: 'system_core',
        status: 'success',
        output: 'All safety constraints and voice recognizers active.',
      },
    ];
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('jarvis_preferences');
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PREFERENCES;
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('jarvis_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('jarvis_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('jarvis_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('jarvis_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('jarvis_preferences', JSON.stringify(preferences));
    soundEffects.enabled = preferences.soundEffects;
  }, [preferences]);

  // Load available browser voices
  useEffect(() => {
    const loadVoices = () => {
      const v = jarvisSpeech.getAvailableBrowserVoices();
      if (v.length > 0) setBrowserVoices(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((perm) => {
          setMicPermission(perm.state as any);
          perm.onchange = () => {
            setMicPermission(perm.state as any);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Audio level analysis interval while listening or speaking
  useEffect(() => {
    let interval: any;
    if (status === 'listening' || status === 'speaking') {
      interval = setInterval(() => {
        if (audioAnalyser) {
          const data = new Uint8Array(audioAnalyser.frequencyBinCount);
          audioAnalyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;
          setAudioLevel(avg / 128);
        } else {
          // Simulated harmonic pulse
          setAudioLevel(0.3 + Math.random() * 0.4);
        }
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [status, audioAnalyser]);

  // Append to activity log
  const addLog = useCallback(
    (command: string, tool: string, status: 'success' | 'failed' | 'denied', output: string) => {
      const newLog: ActivityLogItem = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        command,
        tool,
        status,
        output,
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    []
  );

  // Play audio speech with interruption support
  const speakResponse = useCallback(
    async (text: string, speechTextBn?: string) => {
      setStatus('speaking');
      try {
        await jarvisSpeech.speakText(text, {
          voiceEngine: preferences.voiceEngine,
          geminiVoice: preferences.geminiVoice,
          banglaVoiceType: preferences.banglaVoiceType,
          browserVoiceName: preferences.browserVoiceName,
          banglaVoiceName: preferences.banglaVoiceName,
          voiceLanguageMode: preferences.voiceLanguageMode,
          speechTextBn: speechTextBn,
          rate: preferences.speechRate,
          pitch: preferences.speechPitch,
          volume: preferences.speechVolume,
          fallbackToBrowser: preferences.fallbackToBrowser,
          onStart: () => setStatus('speaking'),
          onEnd: () => setStatus('idle'),
          onError: () => {
            setStatus('idle');
          },
        });
      } catch (e) {
        setStatus('idle');
      }
    },
    [preferences]
  );

  // Stop speaking on demand (Interruption capability)
  const stopSpeaking = useCallback(() => {
    jarvisSpeech.stopSpeaking();
    setStatus('idle');
  }, []);

  // Execute a Tool Function
  const executeTool = async (
    name: string,
    args: any,
    userQuery: string
  ): Promise<ToolExecutionResult> => {
    setStatus('executing');
    try {
      switch (name) {
        case 'open_website': {
          let url = args.url;
          if (!url) {
            const queryName = (args.name || '').toLowerCase();
            if (queryName.includes('youtube')) url = 'https://www.youtube.com';
            else if (queryName.includes('github')) url = 'https://github.com';
            else if (queryName.includes('gmail')) url = 'https://mail.google.com';
            else url = 'https://www.google.com';
          }
          if (!url.startsWith('http')) url = 'https://' + url;

          window.open(url, '_blank', 'noopener,noreferrer');
          addLog(userQuery, 'open_website', 'success', `Opened URL ${url}`);
          return {
            toolName: 'open_website',
            action: 'Open Website',
            status: 'success',
            details: `Opened ${args.name || url}`,
            data: { url },
          };
        }

        case 'search_web': {
          const query = args.query || userQuery;
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
          addLog(userQuery, 'search_web', 'success', `Executed Google search for: "${query}"`);
          return {
            toolName: 'search_web',
            action: 'Web Search',
            status: 'success',
            details: `Searched for "${query}"`,
            data: { query },
          };
        }

        case 'get_date_time': {
          const now = new Date();
          const info = `${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString()}`;
          addLog(userQuery, 'get_date_time', 'success', info);
          return {
            toolName: 'get_date_time',
            action: 'Date & Time',
            status: 'success',
            details: info,
          };
        }

        case 'get_weather': {
          const loc = args.location || 'Dhaka';
          const res = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`);
          const weather = await res.json();
          addLog(userQuery, 'get_weather', 'success', weather.description || `${weather.temperature}°C in ${loc}`);
          return {
            toolName: 'get_weather',
            action: 'Weather Report',
            status: 'success',
            details: `${weather.location}: ${weather.condition}, ${weather.temperature}°C`,
            data: weather,
          };
        }

        case 'manage_notes': {
          const { action, title, content = '', category = 'General', noteId } = args;
          if (action === 'create' || !action) {
            const newNote: NoteItem = {
              id: `note-${Date.now()}`,
              title: title || 'New Voice Note',
              content: content,
              category: category,
              pinned: false,
              createdAt: Date.now(),
            };
            setNotes((prev) => [newNote, ...prev]);
            addLog(userQuery, 'manage_notes', 'success', `Created note: "${newNote.title}"`);
            return {
              toolName: 'manage_notes',
              action: 'Note Created',
              status: 'success',
              details: `Saved "${newNote.title}" to notes`,
              data: newNote,
            };
          } else if (action === 'delete') {
            if (noteId) {
              setNotes((prev) => prev.filter((n) => n.id !== noteId));
            } else if (title) {
              setNotes((prev) => prev.filter((n) => !n.title.toLowerCase().includes(title.toLowerCase())));
            }
            addLog(userQuery, 'manage_notes', 'success', `Deleted note`);
            return {
              toolName: 'manage_notes',
              action: 'Note Deleted',
              status: 'success',
              details: `Removed requested note`,
            };
          }
          return {
            toolName: 'manage_notes',
            action: 'Note Listed',
            status: 'success',
            details: `Active notes: ${notes.length}`,
          };
        }

        case 'manage_reminders': {
          const { action, title, time = '12:00 PM', date = 'Today', reminderId } = args;
          if (action === 'create' || !action) {
            const newRem: ReminderItem = {
              id: `rem-${Date.now()}`,
              title: title || 'Voice Reminder',
              dueDate: date,
              dueTime: time,
              priority: 'normal',
              completed: false,
              createdAt: Date.now(),
            };
            setReminders((prev) => [newRem, ...prev]);
            addLog(userQuery, 'manage_reminders', 'success', `Scheduled reminder: "${newRem.title}" at ${time} on ${date}`);
            return {
              toolName: 'manage_reminders',
              action: 'Reminder Scheduled',
              status: 'success',
              details: `Set for ${date} at ${time}: "${newRem.title}"`,
              data: newRem,
            };
          } else if (action === 'delete') {
            if (reminderId) {
              setReminders((prev) => prev.filter((r) => r.id !== reminderId));
            } else if (title) {
              setReminders((prev) => prev.filter((r) => !r.title.toLowerCase().includes(title.toLowerCase())));
            }
            addLog(userQuery, 'manage_reminders', 'success', `Removed reminder`);
            return {
              toolName: 'manage_reminders',
              action: 'Reminder Removed',
              status: 'success',
              details: `Deleted reminder`,
            };
          }
          return {
            toolName: 'manage_reminders',
            action: 'Reminders Listed',
            status: 'success',
            details: `Active reminders: ${reminders.length}`,
          };
        }

        case 'draft_message': {
          const { recipient = 'Recipient', subject = 'Message Draft', body, platform = 'email' } = args;
          const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          addLog(userQuery, 'draft_message', 'success', `Drafted ${platform} message for ${recipient}`);
          return {
            toolName: 'draft_message',
            action: 'Message Drafted',
            status: 'success',
            details: `Drafted to ${recipient}: "${subject}"`,
            data: { recipient, subject, body, mailto },
          };
        }

        case 'desktop_agent_action': {
          const { appName, action } = args;
          const res = await fetch('/api/desktop-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appName, action }),
          });
          const result = await res.json();
          if (result.success) {
            if (result.url) window.open(result.url, '_blank');
            else if (result.protocol) {
              window.location.href = result.protocol;
            }
            addLog(userQuery, 'desktop_agent_action', 'success', result.message);
            return {
              toolName: 'desktop_agent_action',
              action: 'App Launched',
              status: 'success',
              details: result.message,
            };
          } else {
            addLog(userQuery, 'desktop_agent_action', 'failed', result.message);
            return {
              toolName: 'desktop_agent_action',
              action: 'App Launch',
              status: 'failed',
              details: result.message,
            };
          }
        }

        case 'manage_memory': {
          const { action, key, value } = args;
          if (action === 'add' && key && value) {
            const newMem: MemoryItem = {
              id: `mem-${Date.now()}`,
              key,
              value,
              category: 'personal',
              updatedAt: Date.now(),
            };
            setMemories((prev) => [newMem, ...prev.filter((m) => m.key.toLowerCase() !== key.toLowerCase())]);
            addLog(userQuery, 'manage_memory', 'success', `Stored context: ${key} = ${value}`);
            return {
              toolName: 'manage_memory',
              action: 'Memory Stored',
              status: 'success',
              details: `Remembered "${key}: ${value}"`,
            };
          }
          return {
            toolName: 'manage_memory',
            action: 'Memory Accessed',
            status: 'success',
            details: `Loaded user context`,
          };
        }

        default:
          return {
            toolName: name,
            action: 'Unknown Tool',
            status: 'failed',
            details: `Unrecognized action ${name}`,
          };
      }
    } catch (e: any) {
      addLog(userQuery, name, 'failed', e.message || 'Execution error');
      return {
        toolName: name,
        action: name,
        status: 'failed',
        details: e.message || 'Error occurred during tool execution',
      };
    } finally {
      setStatus('idle');
    }
  };

  // Main Command Handler
  const handleSendCommand = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setInputMessage('');
    setInterimTranscript('');
    setErrorMessage(null);

    // Stop listening if it was active
    jarvisSpeech.stopListening();

    // Sound chime on command send
    soundEffects.playListeningStop();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages,
          memories,
          userPreferences: preferences,
          currentDateTime: new Date().toLocaleString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();
      const toolsExecuted: ToolExecutionResult[] = [];

      // Execute requested tools
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const fc of data.functionCalls) {
          // Check if sensitive and requires confirmation
          const isDestructive =
            (fc.name === 'manage_notes' && fc.args?.action === 'delete') ||
            (fc.name === 'manage_reminders' && fc.args?.action === 'delete') ||
            (fc.name === 'desktop_agent_action' && fc.args?.appName === 'terminal');

          if (isDestructive && preferences.requireConfirmations) {
            soundEffects.playAlert();
            setPendingConfirmation({
              id: `pending-${Date.now()}`,
              toolName: fc.name,
              description: `Confirm action: ${fc.name} (${JSON.stringify(fc.args)})`,
              params: fc.args,
              dangerLevel: 'medium',
            });
            toolsExecuted.push({
              toolName: fc.name,
              action: 'Awaiting Authorization',
              status: 'requires_confirmation',
              details: 'Action paused pending user confirmation',
            });
          } else {
            const result = await executeTool(fc.name, fc.args, text);
            toolsExecuted.push(result);
          }
        }
      }

      const jarvisReply: Message = {
        id: `jarvis-${Date.now()}`,
        sender: 'jarvis',
        text: data.text || 'Command processed, sir.',
        speechText: data.speechText || data.text,
        speechTextBn: data.speechTextBn,
        timestamp: Date.now(),
        language: data.languageDetected,
        toolsUsed: toolsExecuted,
      };

      setMessages((prev) => [...prev, jarvisReply]);
      soundEffects.playSuccessChime();

      // Trigger voice output
      if (preferences.autoSpeak && jarvisReply.speechText) {
        await speakResponse(jarvisReply.speechText, jarvisReply.speechTextBn);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Command processing error:', err);
      setStatus('idle');
      setErrorMessage(err.message || 'Neural link failed. Please check connection.');
      const fallbackMsg: Message = {
        id: `jarvis-err-${Date.now()}`,
        sender: 'jarvis',
        text: 'Apologies, sir. My neural engine experienced a momentary interruption. Could you please repeat that? (ক্ষমা করবেন, সাময়িক ত্রুটির কারণে অনুরোধটি সম্পন্ন করা যায়নি।)',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Start a fresh microphone listening session
  const startListeningSession = async () => {
    if (status === 'speaking') {
      stopSpeaking();
    }

    // Initialize audio analyzer for waveform
    const analyser = await jarvisSpeech.getAudioAnalyser();
    if (analyser) setAudioAnalyser(analyser);

    soundEffects.playListeningStart();
    setErrorMessage(null);
    setInterimTranscript('');

    jarvisSpeech.startListening(
      {
        onStart: () => {
          setStatus('listening');
        },
        onResult: (transcript: string, isFinal: boolean) => {
          if (isFinal) {
            setInterimTranscript('');
            handleSendCommand(transcript);
          } else {
            setInterimTranscript(transcript);
          }
        },
        onError: (err: string) => {
          setErrorMessage(err);
          setStatus('idle');
          soundEffects.playListeningStop();
        },
        onEnd: () => {
          setStatus((curr) => (curr === 'listening' ? 'idle' : curr));
        },
      },
      preferences.speechLanguage
    );
  };

  // Toggle Microphone Listening
  const toggleListening = async () => {
    if (status === 'speaking') {
      stopSpeaking();
      return;
    }

    if (status === 'listening') {
      jarvisSpeech.stopListening();
      setStatus('idle');
      soundEffects.playListeningStop();
      return;
    }

    startListeningSession();
  };

  // Hands-free Double Clap wake-up handler
  const handleDoubleClapWake = useCallback(
    (intervalMs?: number) => {
      // 1. Play dual-tone wake chime
      soundEffects.playClapWakeSound();

      // 2. Bring interface / window to attention
      try {
        window.focus();
      } catch (e) {}

      // Flash tab title
      const originalTitle = typeof document !== 'undefined' ? document.title : '';
      if (typeof document !== 'undefined') {
        document.title = '⚡ [JARVIS AWAKE] Listening...';
        setTimeout(() => {
          document.title = originalTitle;
        }, 4000);
      }

      // System notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification('JARVIS AI Awakened! 👏', {
            body: 'Double clap detected! Listening for your voice command...',
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
          setTimeout(() => notif.close(), 4000);
        } catch (e) {}
      }

      // 3. Visual notification banner & state transition
      const intervalText = intervalMs ? ` (${intervalMs}ms)` : '';
      setWakeNotification(`👏 Double Clap Detected${intervalText}! Waking JARVIS...`);
      setClapStatus('detected');
      setTimeout(() => setWakeNotification(null), 3500);

      // 4. Switch to console view
      setActiveTab('console');

      // 5. Log in security audit trail
      addLog(
        'Hands-Free Double Clap Wake',
        'acoustic_sensor',
        'success',
        `Acoustic transient verified (${intervalMs || 400}ms). Activated voice listening mode.`
      );

      // 6. Pause clap detector during speech recognition session
      doubleClapDetector.setPaused(true);

      // 7. Critical: Pause ~450ms after the clap so acoustic reverberation dies down
      // and the claps themselves are NOT recorded as a voice command transcript!
      setTimeout(() => {
        setClapStatus('listening');
        startListeningSession();
      }, 450);
    },
    [addLog]
  );

  // Continuous Double Clap Detection Lifecycle
  useEffect(() => {
    if (preferences.doubleClapWakeEnabled) {
      setClapThreshold(doubleClapDetector.getThreshold());

      doubleClapDetector
        .start(
          {
            onStatusChange: (newStatus) => {
              setClapStatus(newStatus);
            },
            onFirstClap: () => {
              setClapStatus('first_clap');
            },
            onDoubleClap: (intervalMs) => {
              handleDoubleClapWake(intervalMs);
            },
            onEnergyMeter: (level, thresh) => {
              setClapEnergyLevel(level);
              setClapThreshold(thresh);
            },
            onError: (errMsg) => {
              setErrorMessage(errMsg);
              setClapStatus('error');
              if (
                errMsg.toLowerCase().includes('denied') ||
                errMsg.toLowerCase().includes('permission')
              ) {
                setMicPermission('denied');
              }
            },
          },
          {
            sensitivity: preferences.clapSensitivity,
            minIntervalMs: preferences.clapMinInterval,
            maxIntervalMs: preferences.clapMaxInterval,
          }
        )
        .then((started) => {
          if (started) {
            setMicPermission('granted');
          }
        });
    } else {
      doubleClapDetector.stop();
      setClapStatus('disabled');
      setClapEnergyLevel(0);
    }

    return () => {
      doubleClapDetector.stop();
    };
  }, [
    preferences.doubleClapWakeEnabled,
    preferences.clapSensitivity,
    preferences.clapMinInterval,
    preferences.clapMaxInterval,
    handleDoubleClapWake,
  ]);

  // Synchronize pause state of clap detector when assistant is busy
  useEffect(() => {
    if (preferences.doubleClapWakeEnabled) {
      if (
        status === 'speaking' ||
        status === 'listening' ||
        status === 'executing' ||
        status === 'thinking'
      ) {
        doubleClapDetector.setPaused(true);
        if (status === 'listening') {
          setClapStatus('listening');
        }
      } else if (status === 'idle') {
        const timer = setTimeout(() => {
          doubleClapDetector.setPaused(false);
          setClapStatus((prev) => (prev === 'listening' || prev === 'detected' ? 'waiting' : prev));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [status, preferences.doubleClapWakeEnabled]);

  // Confirm pending action
  const handleAuthorizeAction = async () => {
    if (!pendingConfirmation) return;
    const action = pendingConfirmation;
    setPendingConfirmation(null);
    await executeTool(action.toolName, action.params, 'Confirmed authorization');
  };

  // Theme styling
  const isLight = preferences.theme === 'light';
  const isNeon = preferences.theme === 'neon-blue';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${
        isLight
          ? 'bg-slate-50 text-slate-900'
          : isNeon
          ? 'bg-slate-950 text-slate-100 [background:radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)]'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Futuristic Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Agent identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base md:text-lg bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  JARVIS AI
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  v3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Personal AI Voice Assistant · Bangla · English · Banglish
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'console'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
              <span className="text-[10px] opacity-75 font-mono">({notes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'reminders'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reminders</span>
              <span className="text-[10px] opacity-75 font-mono">({reminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'memory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Audit Log</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Double Clap status pill in header */}
            <button
              onClick={() => {
                const next = !preferences.doubleClapWakeEnabled;
                setPreferences((p) => ({ ...p, doubleClapWakeEnabled: next }));
                if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission().catch(() => {});
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                preferences.doubleClapWakeEnabled
                  ? clapStatus === 'listening'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm animate-pulse'
                    : clapStatus === 'detected'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm animate-pulse'
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Hands-Free Double Clap Wake Mode"
            >
              <span>👏</span>
              <span className="hidden sm:inline">Clap Wake:</span>
              <span className="font-semibold">
                {preferences.doubleClapWakeEnabled
                  ? clapStatus === 'listening'
                    ? 'Listening'
                    : clapStatus === 'detected'
                    ? 'Awake!'
                    : 'Armed'
                  : 'Off'}
              </span>
            </button>

            {status === 'speaking' && (
              <button
                onClick={stopSpeaking}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors animate-pulse"
                title="Stop Speaking"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Interrupt</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors shadow-sm"
              title="System Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex flex-col justify-between">
        {/* Wake Up Notification Banner */}
        {wakeNotification && (
          <div className="mb-4 p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(6,182,212,0.4)] animate-bounce">
            <div className="flex items-center gap-2.5 font-semibold text-sm">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>{wakeNotification}</span>
            </div>
            <button
              onClick={() => setWakeNotification(null)}
              className="text-cyan-400 hover:text-white font-mono text-xs px-2 py-1 rounded bg-cyan-900/40 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-400 hover:text-amber-200 font-mono text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: AI Console (Orb + Waveform + Conversation) */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left Column: Futuristic Arc Reactor Orb & Controls */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden space-y-4">
              {/* Background HUD Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

              {/* Hands-Free Double Clap Wake Widget */}
              <div className="w-full relative z-10">
                <ClapWakeWidget
                  enabled={preferences.doubleClapWakeEnabled}
                  status={clapStatus}
                  currentLevel={clapEnergyLevel}
                  threshold={clapThreshold}
                  sensitivity={preferences.clapSensitivity}
                  micPermission={micPermission}
                  onToggleEnabled={(enabled) => {
                    setPreferences((p) => ({ ...p, doubleClapWakeEnabled: enabled }));
                    if (enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission().catch(() => {});
                    }
                  }}
                  onChangeSensitivity={(sensitivity) =>
                    setPreferences((p) => ({ ...p, clapSensitivity: sensitivity }))
                  }
                  onTestTrigger={() => {
                    handleDoubleClapWake(420);
                  }}
                  onManualWake={() => {
                    soundEffects.playListeningStart();
                    setActiveTab('console');
                    setWakeNotification('⚡ Manual Wake Triggered! Listening...');
                    setTimeout(() => setWakeNotification(null), 2500);
                    startListeningSession();
                  }}
                />
              </div>

              {/* The Holographic Orb */}
              <JarvisOrb
                status={status}
                isListening={status === 'listening'}
                audioLevel={audioLevel}
                onClick={toggleListening}
              />

              {/* Real-time Waveform */}
              <div className="w-full mt-2">
                <AudioVisualizer status={status} analyser={audioAnalyser} height={42} />
              </div>

              {/* Live Speech Interim Preview */}
              {interimTranscript && (
                <div className="mt-2 w-full text-center px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono animate-pulse">
                  Listening: "{interimTranscript}"
                </div>
              )}

              {/* Primary Voice Action Bar */}
              <div className="mt-4 flex items-center gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex-1 py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg cursor-pointer ${
                    status === 'listening'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 animate-pulse'
                      : status === 'speaking'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/25'
                  }`}
                >
                  {status === 'listening' ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Stop Listening</span>
                    </>
                  ) : status === 'speaking' ? (
                    <>
                      <VolumeX className="w-5 h-5" />
                      <span>Interrupt Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Tap to Speak</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Spoken Voice Accent Selector */}
              <div className="mt-3 w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-medium">ভয়েস কণ্ঠ:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, voiceLanguageMode: 'bangla' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      preferences.voiceLanguageMode === 'bangla'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇧🇩 বাংলা কণ্ঠ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, voiceLanguageMode: 'auto' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      preferences.voiceLanguageMode === 'auto'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌐 Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, voiceLanguageMode: 'english' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      preferences.voiceLanguageMode === 'english'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* Voice mode hints */}
              <div className="mt-2 text-[11px] font-mono text-slate-400 text-center flex items-center gap-2">
                <span>Mic: {jarvisSpeech.isSpeechRecognitionSupported() ? 'Web Speech Ready' : 'Text Only'}</span>
                <span>·</span>
                <span>
                  {preferences.voiceLanguageMode === 'bangla'
                    ? '🇧🇩 বাংলা ভয়েস চালু'
                    : preferences.voiceEngine === 'gemini'
                    ? `Gemini (${preferences.geminiVoice})`
                    : 'Browser Voice'}
                </span>
              </div>
            </div>

            {/* Right Column: Conversation Stream & Input */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Conversation Feed */}
              <ConversationPanel
                messages={messages}
                onReplayAudio={speakResponse}
                activeStatus={status}
              />

              {/* Quick Prompt Suggestions */}
              <QuickPrompts
                onSelectPrompt={(text) => handleSendCommand(text)}
                disabled={status === 'thinking'}
              />

              {/* Text Input Control */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCommand();
                }}
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a command in English, বাংলা, or Banglish... (e.g. 'YouTube open koro')"
                    disabled={status === 'thinking'}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 shadow-inner backdrop-blur-md transition-all"
                  />
                  {inputMessage && (
                    <button
                      type="button"
                      onClick={() => setInputMessage('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || status === 'thinking'}
                  className="p-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send Command"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Notes & Tasks */}
        {activeTab === 'notes' && (
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
            <NotesView
              notes={notes}
              onAddNote={(title, content, category) => {
                const newNote: NoteItem = {
                  id: `note-${Date.now()}`,
                  title,
                  content,
                  category,
                  pinned: false,
                  createdAt: Date.now(),
                };
                setNotes((prev) => [newNote, ...prev]);
                addLog('Manual Note Creation', 'manage_notes', 'success', `Created note: ${title}`);
              }}
              onDeleteNote={(id) => {
                setNotes((prev) => prev.filter((n) => n.id !== id));
                addLog('Manual Note Deletion', 'manage_notes', 'success', `Deleted note ${id}`);
              }}
              onTogglePin={(id) => {
                setNotes((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
                );
              }}
            />
          </div>
        )}

        {/* Tab 3: Reminders View */}
        {activeTab === 'reminders' && (
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
            <RemindersView
              reminders={reminders}
              onAddReminder={(title, dueDate, dueTime, priority) => {
                const newRem: ReminderItem = {
                  id: `rem-${Date.now()}`,
                  title,
                  dueDate,
                  dueTime,
                  priority,
                  completed: false,
                  createdAt: Date.now(),
                };
                setReminders((prev) => [newRem, ...prev]);
                addLog('Manual Reminder Creation', 'manage_reminders', 'success', `Created reminder: ${title}`);
              }}
              onToggleComplete={(id) => {
                setReminders((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
                );
              }}
              onDeleteReminder={(id) => {
                setReminders((prev) => prev.filter((r) => r.id !== id));
                addLog('Manual Reminder Deletion', 'manage_reminders', 'success', `Deleted reminder ${id}`);
              }}
            />
          </div>
        )}

        {/* Tab 4: Memory View */}
        {activeTab === 'memory' && (
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
            <MemoryView
              memories={memories}
              onAddMemory={(key, value, category) => {
                const newMem: MemoryItem = {
                  id: `mem-${Date.now()}`,
                  key,
                  value,
                  category,
                  updatedAt: Date.now(),
                };
                setMemories((prev) => [newMem, ...prev.filter((m) => m.key !== key)]);
                addLog('Manual Context Addition', 'manage_memory', 'success', `Added context: ${key}`);
              }}
              onDeleteMemory={(id) => {
                setMemories((prev) => prev.filter((m) => m.id !== id));
                addLog('Manual Memory Removal', 'manage_memory', 'success', `Removed context ${id}`);
              }}
              onClearAllMemories={() => {
                setMemories([]);
                addLog('Wipe Context', 'manage_memory', 'success', 'All neural memories cleared');
              }}
              onClearConversationHistory={() => {
                setMessages([]);
                addLog('Clear Conversation', 'system_core', 'success', 'Conversation history cleared');
              }}
            />
          </div>
        )}

        {/* Tab 5: Activity & Security Audit Log */}
        {activeTab === 'logs' && (
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
            <ActivityLogView
              logs={activityLogs}
              onClearLogs={() => setActivityLogs([])}
            />
          </div>
        )}
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-2.5 text-[11px] text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">JARVIS ONLINE</span>
            <span>·</span>
            <span>Neural Model: Gemini 3.8 Flash</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Audio Status: {status.toUpperCase()}</span>
            <span>·</span>
            <span>Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(updates) => setPreferences((prev) => ({ ...prev, ...updates }))}
        browserVoices={browserVoices}
      />

      {/* Security Action Confirmation Modal */}
      <ConfirmationModal
        action={pendingConfirmation}
        onConfirm={handleAuthorizeAction}
        onCancel={() => {
          if (pendingConfirmation) {
            addLog(pendingConfirmation.toolName, pendingConfirmation.toolName, 'denied', 'User rejected execution clearance.');
          }
          setPendingConfirmation(null);
        }}
      />
    </div>
  );
}
