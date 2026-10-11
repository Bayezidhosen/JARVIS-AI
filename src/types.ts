export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  speechText?: string;
  speechTextBn?: string;
  timestamp: number;
  language?: 'Bangla' | 'English' | 'Banglish' | 'Auto';
  toolsUsed?: ToolExecutionResult[];
  pendingConfirmation?: PendingAction;
}

export interface ToolExecutionResult {
  toolName: string;
  action: string;
  status: 'success' | 'failed' | 'requires_confirmation' | 'cancelled';
  details: string;
  data?: any;
}

export interface PendingAction {
  id: string;
  toolName: string;
  description: string;
  params: any;
  dangerLevel: 'low' | 'medium' | 'high';
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime: string; // ISO string or human string
  dueDate: string;
  priority: 'low' | 'normal' | 'high';
  completed: boolean;
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'personal' | 'work' | 'system';
  updatedAt: number;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  command: string;
  tool: string;
  status: 'success' | 'failed' | 'denied';
  output: string;
}

export type ClapWakeStatus = 'disabled' | 'waiting' | 'first_clap' | 'detected' | 'listening' | 'error';

export interface UserPreferences {
  voiceEngine: 'gemini' | 'browser';
  geminiVoice: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir' | 'Charon';
  banglaVoiceType: 'neural-female' | 'neural-male' | 'neural-standard' | 'browser';
  browserVoiceName: string;
  banglaVoiceName: string;
  voiceLanguageMode: 'auto' | 'bangla' | 'english';
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechLanguage: 'auto' | 'bn-BD' | 'en-US';
  autoSpeak: boolean;
  continuousListening: boolean;
  soundEffects: boolean;
  fallbackToBrowser: boolean;
  theme: 'cyber-dark' | 'neon-blue' | 'light';
  requireConfirmations: boolean;
  desktopAgentEnabled: boolean;
  doubleClapWakeEnabled: boolean;
  clapSensitivity: 'low' | 'medium' | 'high';
  clapMinInterval: number; // ms, default 250
  clapMaxInterval: number; // ms, default 800
}
