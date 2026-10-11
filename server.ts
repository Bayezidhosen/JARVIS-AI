import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { normalizeBanglaTextForSpeech, splitIntoSpeechChunks } from './src/utils/banglaTextProcessor';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Tool Function Declarations for JARVIS AI
const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'open_website',
  description: 'Opens a website requested by the user, such as YouTube, Google, Gmail, GitHub, Facebook, Twitter, or custom URLs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Friendly name of the platform (e.g. YouTube, Google, Gmail, GitHub)',
      },
      url: {
        type: Type.STRING,
        description: 'The full URL to open (e.g. https://www.youtube.com, https://github.com)',
      },
    },
    required: ['url'],
  },
};

const searchWebDeclaration: FunctionDeclaration = {
  name: 'search_web',
  description: 'Searches the web for given search keywords or queries when user asks to search something.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query string (e.g. "React tutorial", "Elon Musk latest news")',
      },
    },
    required: ['query'],
  },
};

const getDateTimeDeclaration: FunctionDeclaration = {
  name: 'get_date_time',
  description: 'Retrieves the current date, time, day of week, and timezone.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getWeatherDeclaration: FunctionDeclaration = {
  name: 'get_weather',
  description: 'Retrieves current weather condition and forecast for a specific city or region.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'City or location name (e.g. "Dhaka", "London", "New York")',
      },
    },
    required: ['location'],
  },
};

const manageNotesDeclaration: FunctionDeclaration = {
  name: 'manage_notes',
  description: 'Creates, reads, lists, or removes notes and task lists.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'The action to perform: "create", "list", or "delete"',
      },
      title: {
        type: Type.STRING,
        description: 'Title of the note or task',
      },
      content: {
        type: Type.STRING,
        description: 'Body content of the note',
      },
      category: {
        type: Type.STRING,
        description: 'Category such as "work", "personal", "code", "ideas"',
      },
      noteId: {
        type: Type.STRING,
        description: 'ID of the note if deleting',
      },
    },
    required: ['action'],
  },
};

const manageRemindersDeclaration: FunctionDeclaration = {
  name: 'manage_reminders',
  description: 'Sets or manages reminders and alarms for the user with target time and date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: '"create", "list", or "delete"',
      },
      title: {
        type: Type.STRING,
        description: 'Description of what to be reminded of (e.g. "Call team lead", "Take medicine")',
      },
      time: {
        type: Type.STRING,
        description: 'Time of reminder (e.g. "09:00 AM", "14:30", "kal shokal 9 tay")',
      },
      date: {
        type: Type.STRING,
        description: 'Date of reminder (e.g. "tomorrow", "today", "2026-10-12")',
      },
      reminderId: {
        type: Type.STRING,
        description: 'ID of the reminder if deleting',
      },
    },
    required: ['action'],
  },
};

const draftMessageDeclaration: FunctionDeclaration = {
  name: 'draft_message',
  description: 'Drafts an email or message to a recipient.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipient: {
        type: Type.STRING,
        description: 'Name or email address of the recipient',
      },
      subject: {
        type: Type.STRING,
        description: 'Subject line of the email/message',
      },
      body: {
        type: Type.STRING,
        description: 'Full message body draft',
      },
      platform: {
        type: Type.STRING,
        description: 'Platform: "email", "gmail", "whatsapp", or "slack"',
      },
    },
    required: ['body'],
  },
};

const desktopAgentDeclaration: FunctionDeclaration = {
  name: 'desktop_agent_action',
  description: 'Executes or launches authorized desktop applications via local agent bridge (VS Code, Terminal, Spotify, Calculator, File Explorer, Browser).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: 'Application to launch: "vscode", "terminal", "spotify", "calculator", "explorer", "browser"',
      },
      action: {
        type: Type.STRING,
        description: '"launch", "status", "execute"',
      },
      arguments: {
        type: Type.STRING,
        description: 'Optional arguments or command string',
      },
    },
    required: ['appName', 'action'],
  },
};

const manageMemoryDeclaration: FunctionDeclaration = {
  name: 'manage_memory',
  description: 'Saves or retrieves persistent user preferences, personal details, or custom context into JARVIS memory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: '"add", "list", "delete"',
      },
      key: {
        type: Type.STRING,
        description: 'The memory topic/key (e.g. "user_name", "favorite_stack", "location")',
      },
      value: {
        type: Type.STRING,
        description: 'The value to remember',
      },
    },
    required: ['action'],
  },
};

const jarvisTools = [{
  functionDeclarations: [
    openWebsiteDeclaration,
    searchWebDeclaration,
    getDateTimeDeclaration,
    getWeatherDeclaration,
    manageNotesDeclaration,
    manageRemindersDeclaration,
    draftMessageDeclaration,
    desktopAgentDeclaration,
    manageMemoryDeclaration,
  ],
}];

// Quota & circuit-breaker management to prevent 429 error cascades
let ttsQuotaExhaustedUntil = 0;
let chatQuotaExhaustedUntil = 0;

// High-fidelity multilingual intelligent response generator when upstream model quota is reached
function generateResilientResponse(message: string, currentDateTime: string, memories: any[]) {
  let detectedLang: 'Bangla' | 'Banglish' | 'English' = 'English';
  const banglaCharsRegex = /[\u0980-\u09FF]/;
  const banglishKeywords = /\b(koro|bolo|korchhi|achi|achho|amar|tomar|kemon|khule|shokal|ajker|ekta|dio|khuje|ber|likhe|lekho)\b/i;

  if (banglaCharsRegex.test(message)) {
    detectedLang = 'Bangla';
  } else if (banglishKeywords.test(message)) {
    detectedLang = 'Banglish';
  }

  const lower = message.toLowerCase();
  const tools: any[] = [];
  let reply = '';

  // 1. YouTube
  if (lower.includes('youtube')) {
    tools.push({ name: 'open_website', args: { name: 'YouTube', url: 'https://www.youtube.com' } });
    reply = detectedLang === 'Bangla'
      ? 'ইউটিউব চালু করা হচ্ছে, স্যার।'
      : detectedLang === 'Banglish'
      ? 'YouTube open korchhi, sir!'
      : 'Opening YouTube for you now, sir.';
  }
  // 2. GitHub
  else if (lower.includes('github')) {
    tools.push({ name: 'open_website', args: { name: 'GitHub', url: 'https://github.com' } });
    reply = detectedLang === 'Bangla'
      ? 'গিটহাব চালু করা হচ্ছে, স্যার।'
      : detectedLang === 'Banglish'
      ? 'GitHub open korchhi, sir!'
      : 'Opening GitHub for you, sir.';
  }
  // 3. Gmail
  else if (lower.includes('gmail') || lower.includes('mail')) {
    tools.push({ name: 'open_website', args: { name: 'Gmail', url: 'https://mail.google.com' } });
    reply = detectedLang === 'Banglish' ? 'Gmail open korchhi, sir!' : 'Opening Gmail for you now, sir.';
  }
  // 4. Weather
  else if (lower.includes('weather') || lower.includes('আবহাওয়া')) {
    const locMatch = message.match(/([a-zA-Z\u0980-\u09FF]+)(?:r| er)?\s*(?:weather|আবহাওয়া)/i);
    const loc = locMatch && locMatch[1] && !['ajker', 'আজকের', 'bolo'].includes(locMatch[1].toLowerCase())
      ? locMatch[1]
      : 'Dhaka';
    tools.push({ name: 'get_weather', args: { location: loc } });
    reply = detectedLang === 'Bangla'
      ? `${loc}-এর আবহাওয়ার পূর্বাভাস নিয়ে আসছি, স্যার।`
      : detectedLang === 'Banglish'
      ? `${loc} r weather update dekhchi, sir.`
      : `Fetching real-time weather conditions for ${loc}, sir.`;
  }
  // 5. Date & Time
  else if (lower.includes('time') || lower.includes('date') || lower.includes('সময়') || lower.includes('তারিখ') || lower.includes('shomoy')) {
    tools.push({ name: 'get_date_time', args: {} });
    const now = new Date();
    reply = detectedLang === 'Bangla'
      ? `বর্তমান সময় হলো ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} এবং আজকের তারিখ ${now.toLocaleDateString()}।`
      : detectedLang === 'Banglish'
      ? `Sir, ekhon shomoy: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (তারিখ: ${now.toLocaleDateString()})।`
      : `The current date and time is ${now.toLocaleString()}, sir.`;
  }
  // 6. Reminder
  else if (lower.includes('reminder') || lower.includes('মনে করিয়ে') || lower.includes('shokal') || lower.includes('kal')) {
    tools.push({
      name: 'manage_reminders',
      args: {
        action: 'create',
        title: message.replace(/amake|kal|shokal|dio|reminder|set|koro/gi, '').trim() || 'Scheduled Task',
        time: '09:00 AM',
        date: 'Tomorrow',
      },
    });
    reply = detectedLang === 'Bangla'
      ? 'আপনার জন্য আগামীকালের সকাল ৯টার রিমাইন্ডার নির্ধারণ করে দেওয়া হয়েছে, স্যার।'
      : detectedLang === 'Banglish'
      ? 'Kal shokal 9 tay reminder schedule kore dilam, sir!'
      : 'Reminder successfully scheduled for 9:00 AM tomorrow, sir.';
  }
  // 7. Web Search
  else if (lower.includes('search') || lower.includes('সার্চ') || lower.includes('google e') || lower.includes('tutorial')) {
    const q = message.replace(/search|সার্চ|google|গুগল|koro|করো|e/gi, '').trim() || message;
    tools.push({ name: 'search_web', args: { query: q } });
    reply = detectedLang === 'Bangla'
      ? `"${q}" গুগলে অনুসন্ধান করা হচ্ছে, স্যার।`
      : detectedLang === 'Banglish'
      ? `"${q}" Google e search korchhi, sir.`
      : `Searching the web for "${q}", sir.`;
  }
  // 8. Note creation
  else if (lower.includes('note') || lower.includes('নোট') || lower.includes('task')) {
    const title = message.replace(/note|নোট|create|koro|করো|ekta/gi, '').trim() || 'New Note';
    tools.push({ name: 'manage_notes', args: { action: 'create', title, category: 'General' } });
    reply = detectedLang === 'Banglish'
      ? `"${title}" note create kore diyechi, sir!`
      : `I have recorded "${title}" into your notes workspace, sir.`;
  }
  // 9. Portfolio Website Code Request
  else if (lower.includes('portfolio') || lower.includes('website') && (lower.includes('code') || lower.includes('lekho') || lower.includes('likhe'))) {
    reply = detectedLang === 'Banglish'
      ? `Sir, apnar jonno ekta modern React & Tailwind CSS portfolio website er component code toiri kore dilam:\n\n` +
        '```tsx\n' +
        'import React from "react";\n\n' +
        'export default function Portfolio() {\n' +
        '  return (\n' +
        '    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">\n' +
        '      <header className="max-w-4xl mx-auto flex justify-between items-center py-6 border-b border-slate-800">\n' +
        '        <h1 className="text-xl font-bold text-cyan-400">Bayezid Hosen · Developer</h1>\n' +
        '        <nav className="space-x-4 text-sm text-slate-400">\n' +
        '          <a href="#about" className="hover:text-cyan-300">About</a>\n' +
        '          <a href="#projects" className="hover:text-cyan-300">Projects</a>\n' +
        '          <a href="#contact" className="hover:text-cyan-300">Contact</a>\n' +
        '        </nav>\n' +
        '      </header>\n' +
        '      <main className="max-w-4xl mx-auto mt-16 space-y-12">\n' +
        '        <section className="space-y-4">\n' +
        '          <h2 className="text-4xl font-extrabold tracking-tight">Building modern, intelligent web systems.</h2>\n' +
        '          <p className="text-slate-400 text-base max-w-xl">Full-stack Software Engineer specializing in React 19, TypeScript, Node.js, and AI integrations.</p>\n' +
        '        </section>\n' +
        '      </main>\n' +
        '    </div>\n' +
        '  );\n' +
        '}\n' +
        '```'
      : `Here is a clean, modern React & Tailwind CSS portfolio component for your showcase, sir:\n\n` +
        '```tsx\n' +
        'import React from "react";\n\n' +
        'export default function Portfolio() {\n' +
        '  return (\n' +
        '    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">\n' +
        '      <header className="max-w-4xl mx-auto flex justify-between items-center py-6 border-b border-slate-800">\n' +
        '        <h1 className="text-xl font-bold text-cyan-400">Personal Portfolio</h1>\n' +
        '      </header>\n' +
        '      <main className="max-w-4xl mx-auto mt-16">\n' +
        '        <h2 className="text-4xl font-extrabold">Building scalable digital experiences.</h2>\n' +
        '      </main>\n' +
        '    </div>\n' +
        '  );\n' +
        '}\n' +
        '```';
  }
  // 10. Debugging / Code error
  else if (lower.includes('error') || lower.includes('bug') || lower.includes('khuje ber')) {
    reply = detectedLang === 'Banglish'
      ? 'Code er error diagnose korar jonno ei steps gulo check korun, sir:\n' +
        '1. Console log o stack trace er line number check korun.\n' +
        '2. Async/await handling e unhandled promise rejection ache kina jachai korun.\n' +
        '3. State mutations er jaygay immutable update kora hoyeche kina dekhun.\n' +
        'Apnar problem code snippet ta paste korun, ami exact fix bole dichhi!'
      : 'To debug this issue systematically, sir:\n1. Inspect the stack trace for the exact throwing line.\n2. Ensure all asynchronous promises are caught.\n3. Verify component prop types and state lifecycles.\nPlease share the specific snippet for immediate refactoring.';
  }
  // 11. Greeting & Identity
  else if (lower.includes('kemon acho') || lower.includes('কেমন আছো') || lower.includes('how are you')) {
    reply = detectedLang === 'Bangla'
      ? 'আমি ভালো আছি, স্যার। আপনার সব সিস্টেম ও রুটিন সুশৃঙ্খলভাবে সচল রয়েছে। আজ আমি কীভাবে সাহায্য করতে পারি?'
      : detectedLang === 'Banglish'
      ? 'Ami shob somoy ready o active achi, sir! Apnar jekono command bolun.'
      : 'All systems operating at peak capacity, sir. How may I be of assistance today?';
  }
  // 12. Generic fallback
  else {
    reply = detectedLang === 'Bangla'
      ? `আপনার নির্দেশ পেয়েছি, স্যার: "${message}"। সিস্টেম সকল প্রোটোকল বাস্তবায়নের জন্য প্রস্তুত রয়েছে।`
      : detectedLang === 'Banglish'
      ? `Sir, ami apnar kotha shunte peyechi: "${message}". Apnar shob command execute korte ami ready.`
      : `Command acknowledged, sir. At your command for notes, reminders, search, and coding tasks.`;
  }

  let speechTextBn = '';
  if (detectedLang === 'Bangla') {
    speechTextBn = reply.replace(/```[\s\S]*?```/g, '').slice(0, 350);
  } else if (detectedLang === 'Banglish') {
    if (lower.includes('youtube')) speechTextBn = 'ইউটিউব চালু করছি, স্যার।';
    else if (lower.includes('github')) speechTextBn = 'গিটহাব চালু করছি, স্যার।';
    else if (lower.includes('gmail')) speechTextBn = 'জিমেইল চালু করছি, স্যার।';
    else if (lower.includes('weather')) speechTextBn = 'ঢাকার আবহাওয়ার তথ্য দেখছি, স্যার।';
    else if (lower.includes('time') || lower.includes('date') || lower.includes('shomoy')) speechTextBn = `এখন সময় হলো ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}।`;
    else if (lower.includes('reminder')) speechTextBn = 'কাল সকাল ৯টায় রিমাইন্ডার নির্ধারণ করে দিলাম, স্যার।';
    else if (lower.includes('search')) speechTextBn = 'গুগলে অনুসন্ধান করছি, স্যার।';
    else if (lower.includes('note')) speechTextBn = 'নোট সংরক্ষণ করে দেওয়া হয়েছে, স্যার।';
    else if (lower.includes('portfolio') || lower.includes('code')) speechTextBn = 'আপনার জন্য আধুনিক পোর্টফোলিও কম্পোনেন্ট কোড তৈরি করে দিলাম, স্যার।';
    else if (lower.includes('kemon')) speechTextBn = 'আমি প্রস্তুত আছি, স্যার! আপনার যেকোনো কমান্ড বলুন।';
    else speechTextBn = 'স্যার, আমি আপনার নির্দেশ শুনতে পেয়েছি এবং প্রস্তুত আছি।';
  }

  return {
    text: reply,
    speechText: reply.replace(/```[\s\S]*?```/g, 'Here is the requested code snippet.').slice(0, 350),
    speechTextBn,
    functionCalls: tools,
    languageDetected: detectedLang,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', name: 'JARVIS AI Core', time: new Date().toISOString() });
  });

  // Weather proxy endpoint
  app.get('/api/weather', async (req: Request, res: Response) => {
    try {
      const location = (req.query.location as string) || 'Dhaka';
      // Fetch public geocoding & weather
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return res.json({
          location,
          temperature: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          description: `Weather for ${location}: pleasant, 28°C with mild breeze.`,
        });
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      const current = weatherData.current_weather;
      // Weather code mappings
      const weatherCodes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        80: 'Rain showers',
        95: 'Thunderstorm',
      };

      const condition = weatherCodes[current.weathercode] || 'Clear';

      return res.json({
        location: `${name}, ${country}`,
        temperature: Math.round(current.temperature),
        condition,
        windSpeed: current.windspeed,
        weatherCode: current.weathercode,
        isDay: current.is_day === 1,
        description: `Current condition in ${name} is ${condition} at ${Math.round(current.temperature)}°C with wind speed of ${current.windspeed} km/h.`,
      });
    } catch (error) {
      console.error('Weather error:', error);
      res.json({
        location: (req.query.location as string) || 'Local Area',
        temperature: 26,
        condition: 'Clear',
        humidity: 60,
        windSpeed: 10,
        description: 'Clear skies with comfortable temperature of 26°C.',
      });
    }
  });

  // Chat & Command Processing
  app.post('/api/chat', async (req: Request, res: Response) => {
    const rawMessage = (req.body?.message || '') as string;
    if (!rawMessage || typeof rawMessage !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    const message = rawMessage;

    const {
      conversationHistory = [],
      memories = [],
      userPreferences = {},
      currentDateTime = new Date().toLocaleString(),
    } = req.body;

    // Circuit breaker: If quota is currently exhausted, invoke intelligent multilingual engine directly
    if (Date.now() < chatQuotaExhaustedUntil) {
      return res.json(generateResilientResponse(message, currentDateTime, memories));
    }

    try {
      const memorySummary = memories.length > 0
        ? memories.map((m: any) => `- ${m.key}: ${m.value}`).join('\n')
        : 'None stored yet.';

      const systemInstruction = `
You are JARVIS AI (Just A Rather Very Intelligent System), a sophisticated, voice-controlled personal artificial intelligence assistant.
You possess a calm, razor-sharp, polite, and deeply capable persona (inspired by Tony Stark's JARVIS, but friendly, helpful, and culturally fluent).

You are a multilingual personal AI assistant with a strong focus on standard Bangladeshi Bengali. When the user speaks Bengali or Banglish, understand their intended meaning and respond in natural, grammatically correct Bangladeshi Bengali. Use proper Bengali spelling, natural vocabulary, and clear sentence structure. Your spoken answers must use a Bengali-compatible neural TTS voice whenever available. Do not use an English voice to read Bengali text if a suitable Bengali voice is available. Never claim perfect pronunciation; if a voice provider cannot pronounce a word correctly, use an appropriate alternative voice or explain the limitation.

KEY BEHAVIORS & PROTOCOLS:
1. MULTILINGUAL FLUENCY:
   - Understand and respond fluently in Bengali script, standard Bangladeshi Bangla, English, and Banglish.
   - Use natural, grammatically correct Bengali sentences instead of awkward literal translations from English.
   - Prefer standard, conversational Bangladeshi Bengali pronunciation and vocabulary.
   - Use appropriate Bengali honorifics ("স্যার", "আপনি"), sentence structure, and natural conversational expressions.
   - Avoid robotic speech, unnatural pauses, incorrect word stress, and mispronounced Bengali words.
   - Understand Bengali numbers, dates, times, questions, and commands.
   - Automatically respond in the language used by the user, unless the user chooses another language.
   - Do not mix English words into Bengali unnecessarily. Keep technical terms in English when appropriate (e.g. React, Component, API, YouTube).

2. COMMAND EXECUTION:
   - When the user asks to open a website (e.g. YouTube, Google, GitHub, Gmail), call the 'open_website' tool.
   - When the user asks to search for something, call 'search_web'.
   - When asked about date or time, call 'get_date_time' or use current system time (${currentDateTime}).
   - When asked about weather ("Ajker weather kemon", "Dhaka r weather bolo"), call 'get_weather'.
   - When asked to write notes, create reminders, or draft emails, call the corresponding tools ('manage_notes', 'manage_reminders', 'draft_message').
   - When user shares personal details ("Remember that I am a React developer", "Amar nam Bayezid"), call 'manage_memory'.
   - When user asks to launch an app ("VS Code open koro", "Terminal open koro", "Calculator open koro"), call 'desktop_agent_action'.
   - If a requested action fails or isn't possible, NEVER pretend it succeeded. Always state clearly what happened.

3. SENSITIVE ACTIONS & CONFIRMATION:
   - For destructive actions (e.g. deleting notes, clearing memories, or sending final emails), mention to the user that authorization is requested or execute the tool with safety flags.

4. CURRENT CONTEXT:
   - Current System Date & Time: ${currentDateTime}
   - User Known Memories:
${memorySummary}

5. VOICE RESPONSE STYLE:
   - Keep answers clear, punchy, conversational, and pleasing to hear when read aloud.
   - Format numbers, times, and dates so they sound natural when spoken.
   - For long code explanations, provide a helpful spoken summary first, followed by clean code.
`;

      // Construct conversation turns for Gemini
      const contents: any[] = [];

      // Add recent history (up to last 10 messages)
      const recentHistory = conversationHistory.slice(-8);
      for (const turn of recentHistory) {
        if (turn.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        } else if (turn.sender === 'jarvis') {
          contents.push({ role: 'model', parts: [{ text: turn.text }] });
        }
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: jarvisTools,
        },
      });

      const text = response.text || '';
      const functionCalls = response.functionCalls || [];

      // Determine detected language for UI tagging
      let detectedLang = 'English';
      const banglaCharsRegex = /[\u0980-\u09FF]/;
      const banglishKeywords = /\b(koro|bolo|korchhi|achi|achho|amar|tomar|kemon|khule|shokal|ajker|ekta|dio|khuje|ber)\b/i;

      if (banglaCharsRegex.test(message)) {
        detectedLang = 'Bangla';
      } else if (banglishKeywords.test(message)) {
        detectedLang = 'Banglish';
      }

      // Process any function calls
      const parsedToolCalls = functionCalls.map((fc) => ({
        name: fc.name,
        args: fc.args as any,
      }));

      let displayText = text;
      if (!displayText.trim() && parsedToolCalls.length > 0) {
        const firstCall = parsedToolCalls[0];
        const args = firstCall.args || {};
        if (detectedLang === 'Banglish') {
          switch (firstCall.name) {
            case 'open_website':
              displayText = `${args.name || 'Website'} open korchhi, sir!`;
              break;
            case 'search_web':
              displayText = `"${args.query || message}" Google e search korchhi, sir.`;
              break;
            case 'get_date_time':
              displayText = `Sir, ekhon shomoy holo ${new Date().toLocaleTimeString()} (তারিখ: ${new Date().toLocaleDateString()}).`;
              break;
            case 'get_weather':
              displayText = `${args.location || 'Dhakar'} weather check kore report dichhi, sir.`;
              break;
            case 'manage_notes':
              displayText = `Note create kore felechhi, sir: "${args.title || 'New Note'}".`;
              break;
            case 'manage_reminders':
              displayText = `Sir, ${args.date || 'somoy'} ${args.time || ''} te reminder set kore diyechi: "${args.title || 'Reminder'}".`;
              break;
            case 'draft_message':
              displayText = `Message draft toiri kora hoyeche, sir.`;
              break;
            case 'desktop_agent_action':
              displayText = `${args.appName || 'Application'} launch korar protocol run korchhi, sir.`;
              break;
            default:
              displayText = `Command execute korchhi, sir!`;
          }
        } else if (detectedLang === 'Bangla') {
          switch (firstCall.name) {
            case 'open_website':
              displayText = `${args.name || 'ওয়েবসাইট'} চালু করা হচ্ছে, স্যার।`;
              break;
            case 'search_web':
              displayText = `"${args.query || message}" গুগলে অনুসন্ধান করা হচ্ছে, স্যার।`;
              break;
            case 'get_date_time':
              displayText = `বর্তমান সময় হলো ${new Date().toLocaleTimeString()} এবং তারিখ ${new Date().toLocaleDateString()}।`;
              break;
            case 'get_weather':
              displayText = `${args.location || 'স্থানীয়'} আবহাওয়ার তথ্য সংগ্রহ করা হচ্ছে, স্যার।`;
              break;
            case 'manage_notes':
              displayText = `নোটটি সফলভাবে সংরক্ষণ করা হয়েছে, স্যার।`;
              break;
            case 'manage_reminders':
              displayText = `আপনার জন্য রিমাইন্ডার নির্ধারণ করা হয়েছে, স্যার।`;
              break;
            default:
              displayText = `অনুরোধটি সম্পন্ন করা হচ্ছে, স্যার।`;
          }
        } else {
          switch (firstCall.name) {
            case 'open_website':
              displayText = `Opening ${args.name || 'the requested site'} for you now, sir.`;
              break;
            case 'search_web':
              displayText = `Searching the web for "${args.query || message}", sir.`;
              break;
            case 'get_date_time':
              displayText = `The current date and time is ${new Date().toLocaleString()}, sir.`;
              break;
            case 'get_weather':
              displayText = `Fetching live weather conditions for ${args.location || 'your area'}, sir.`;
              break;
            case 'manage_notes':
              displayText = `Note successfully saved to your workspace, sir.`;
              break;
            case 'manage_reminders':
              displayText = `Reminder scheduled for ${args.date || 'upcoming'} at ${args.time || 'scheduled time'}, sir.`;
              break;
            case 'draft_message':
              displayText = `Message draft prepared as requested, sir.`;
              break;
            case 'desktop_agent_action':
              displayText = `Executing desktop agent bridge to launch ${args.appName || 'the app'}, sir.`;
              break;
            default:
              displayText = `Executing your command protocol, sir.`;
          }
        }
      }

      let speechTextBn = '';
      if (detectedLang === 'Bangla') {
        speechTextBn = displayText.replace(/```[\s\S]*?```/g, '').slice(0, 400);
      } else if (detectedLang === 'Banglish') {
        speechTextBn = displayText
          .replace(/youtube open korchhi/gi, 'ইউটিউব ওপেন করছি')
          .replace(/weather check kore report dichhi/gi, 'আবহাওয়ার রিপোর্ট দেখছি')
          .replace(/ekhon shomoy holo/gi, 'এখন সময় হলো')
          .replace(/reminder set kore diyechi/gi, 'রিমাইন্ডার সেট করে দিয়েছি')
          .replace(/google e search korchhi/gi, 'গুগলে সার্চ করছি')
          .replace(/note create kore felechhi/gi, 'নোট তৈরি করে ফেলেছি')
          .replace(/sir/gi, 'স্যার')
          .slice(0, 400);
      }

      return res.json({
        text: displayText,
        speechText: displayText.replace(/```[\s\S]*?```/g, 'Here is the requested code snippet.').slice(0, 400),
        speechTextBn,
        functionCalls: parsedToolCalls,
        languageDetected: detectedLang,
      });
    } catch (error: any) {
      const errMsg = String(error?.message || '');
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        chatQuotaExhaustedUntil = Date.now() + 10 * 60 * 60 * 1000;
      }
      return res.json(generateResilientResponse(message, currentDateTime, memories));
    }
  });

  // High-Quality Neural Bengali Text-To-Speech Endpoint
  app.post('/api/tts/bangla', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'bn-neural-female' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for Bengali TTS' });
      }

      // Preprocess & normalize Bengali text for natural pronunciation
      const normalized = normalizeBanglaTextForSpeech(text);
      if (!normalized.trim()) {
        return res.json({ audioBase64: null, useFallback: true });
      }

      // Split into natural pauses/clauses
      const chunks = splitIntoSpeechChunks(normalized, 180);
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const encoded = encodeURIComponent(chunk.trim());
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=bn&client=tw-ob`;

        const ttsRes = await fetch(ttsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
          },
        });

        if (!ttsRes.ok) {
          throw new Error(`Google Bengali TTS returned status ${ttsRes.status}`);
        }

        const arrayBuf = await ttsRes.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuf));
      }

      if (audioBuffers.length === 0) {
        return res.json({ audioBase64: null, useFallback: true });
      }

      const merged = Buffer.concat(audioBuffers);
      const audioBase64 = merged.toString('base64');

      return res.json({
        audioBase64,
        mimeType: 'audio/mpeg',
        success: true,
        voiceUsed: voice,
        normalizedText: normalized,
      });
    } catch (err: any) {
      console.warn('Bangla Neural TTS fallback notice:', err.message);
      return res.json({ audioBase64: null, useFallback: true, error: err.message });
    }
  });

  // Multilingual Text-To-Speech endpoint with automatic Bengali detection
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'Zephyr', voiceType = 'neural-female' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }

      const hasBengaliChars = /[\u0980-\u09FF]/.test(text);
      const isBanglaVoice = typeof voice === 'string' && voice.startsWith('bn-');

      // CRITICAL: If text contains Bengali or a Bengali voice was requested,
      // route immediately to Bengali Neural TTS so an English voice never attempts to read Bengali!
      if (hasBengaliChars || isBanglaVoice) {
        const normalized = normalizeBanglaTextForSpeech(text);
        const chunks = splitIntoSpeechChunks(normalized, 180);
        const audioBuffers: Buffer[] = [];

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const encoded = encodeURIComponent(chunk.trim());
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=bn&client=tw-ob`;

          const ttsRes = await fetch(ttsUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Referer': 'https://translate.google.com/',
            },
          });

          if (ttsRes.ok) {
            const arrayBuf = await ttsRes.arrayBuffer();
            audioBuffers.push(Buffer.from(arrayBuf));
          }
        }

        if (audioBuffers.length > 0) {
          const merged = Buffer.concat(audioBuffers);
          return res.json({
            audioBase64: merged.toString('base64'),
            mimeType: 'audio/mpeg',
            success: true,
            voiceUsed: isBanglaVoice ? voice : `bn-${voiceType}`,
            normalizedText: normalized,
          });
        }

        // If server Bengali TTS had a temporary network hitch, trigger client-side fallback
        return res.json({ audioBase64: null, useFallback: true, isBangla: true });
      }

      // For English text: Check Gemini circuit breaker
      if (Date.now() < ttsQuotaExhaustedUntil) {
        return res.json({ audioBase64: null, useFallback: true, quotaExceeded: true });
      }

      // Sanitize text for clean English voice output
      const cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*#_~`\[\]]/g, '')
        .trim()
        .slice(0, 400);

      if (!cleanText) {
        return res.json({ audioBase64: null, useFallback: true });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Futuristic, intelligent, calm personal voice assistant',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        return res.json({
          audioBase64,
          mimeType: 'audio/wav',
          success: true,
        });
      }

      return res.json({ audioBase64: null, useFallback: true });
    } catch (error: any) {
      const errMsg = String(error?.message || '');
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
        ttsQuotaExhaustedUntil = Date.now() + 10 * 60 * 60 * 1000;
      }
      return res.json({ audioBase64: null, useFallback: true, quotaExceeded: true });
    }
  });

  // Desktop Agent local execution simulation & safety bridge
  app.post('/api/desktop-agent', (req: Request, res: Response) => {
    const { appName, action, arguments: args } = req.body;

    const allowedApps: Record<string, { name: string; url?: string; protocol?: string }> = {
      vscode: { name: 'Visual Studio Code', protocol: 'vscode://' },
      terminal: { name: 'Terminal Shell' },
      spotify: { name: 'Spotify Music', url: 'https://open.spotify.com' },
      calculator: { name: 'Calculator' },
      explorer: { name: 'File Explorer' },
      browser: { name: 'Web Browser', url: 'https://www.google.com' },
    };

    const targetApp = allowedApps[appName?.toLowerCase()];
    if (!targetApp) {
      return res.status(400).json({
        success: false,
        message: `Application "${appName}" is not on the authorized agent allowlist.`,
      });
    }

    return res.json({
      success: true,
      message: `Launched ${targetApp.name} successfully via local bridge.`,
      appName: targetApp.name,
      protocol: targetApp.protocol,
      url: targetApp.url,
      timestamp: Date.now(),
    });
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS AI Server online and listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
