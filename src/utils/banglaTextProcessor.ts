/**
 * Bangla (Bengali) Text Processor & Speech Normalizer for JARVIS AI
 * Prepares natural, grammatically sound, and phonetically clear Bengali text
 * for Neural Text-to-Speech synthesis and speech recognition mapping.
 */

// Mapping English digits to Bengali digits
const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

// Common spoken numbers in Bengali for speech naturalness
const NUMBER_TO_WORD: Record<string, string> = {
  '১': 'এক',
  '২': 'দুই',
  '৩': 'তিন',
  '৪': 'চার',
  '৫': 'পাঁচ',
  '৬': 'ছয়',
  '৭': 'সাত',
  '৮': 'আট',
  '৯': 'নয়',
  '১০': 'দশ',
  '১১': 'এগারো',
  '১২': 'বারো',
  '১৩': 'তেরো',
  '১৪': 'চৌদ্দ',
  '১৫': 'পনেরো',
  '২০': 'বিশ',
  '২৫': 'পঁচিশ',
  '৩০': 'ত্রিশ',
  '৫০': 'পঞ্চাশ',
  '১০০': 'একশত',
};

// Common technical English words to natural phonetic Bengali for clear pronunciation
const TECH_TERMS_PHONETIC: [RegExp, string][] = [
  [/\b(react(\.js)?)\b/gi, 'রিয়েক্ট'],
  [/\b(javascript|js)\b/gi, 'জাভাস্ক্রিপ্ট'],
  [/\b(typescript|ts)\b/gi, 'টাইপস্ক্রিপ্ট'],
  [/\b(node(\.js)?)\b/gi, 'নোড জেএস'],
  [/\b(tailwind(\s*css)?)\b/gi, 'টেইলউইন্ড সিএসএস'],
  [/\b(youtube)\b/gi, 'ইউটিউব'],
  [/\b(google)\b/gi, 'গুগল'],
  [/\b(github)\b/gi, 'গিটহাব'],
  [/\b(gmail)\b/gi, 'জিমেইল'],
  [/\b(vs\s*code|vscode)\b/gi, 'ভিএস কোড'],
  [/\b(api)\b/gi, 'এপিআই'],
  [/\b(ui)\b/gi, 'ইউআই'],
  [/\b(ux)\b/gi, 'ইউএক্স'],
  [/\b(ai)\b/gi, 'এআই'],
  [/\b(code|coding)\b/gi, 'কোড'],
  [/\b(error|bug)\b/gi, 'এরর'],
  [/\b(debug|debugging)\b/gi, 'ডিবাগ'],
  [/\b(terminal)\b/gi, 'টার্মিনাল'],
  [/\b(browser)\b/gi, 'ব্রাউজার'],
  [/\b(website|web)\b/gi, 'ওয়েবসাইট'],
  [/\b(portfolio)\b/gi, 'পোর্টফোলিও'],
  [/\b(component)\b/gi, 'কম্পোনেন্ট'],
  [/\b(online)\b/gi, 'অনলাইন'],
  [/\b(offline)\b/gi, 'অফলাইন'],
  [/\b(update)\b/gi, 'আপডেট'],
  [/\b(search)\b/gi, 'সার্চ'],
  [/\b(reminder)\b/gi, 'রিমাইন্ডার'],
  [/\b(note)\b/gi, 'নোট'],
];

/**
 * Converts English digits to Bengali digits
 */
export function convertDigitsToBangla(text: string): string {
  return text.replace(/[0-9]/g, (digit) => EN_TO_BN_DIGITS[digit] || digit);
}

/**
 * Normalizes time and date strings into natural spoken Bengali phrases
 * e.g. "09:00 AM" -> "সকাল ৯টা"
 *      "04:30 PM" -> "বিকাল ৪টা ৩০ মিনিট"
 *      "21:15"    -> "রাত ৯টা ১৫ মিনিট"
 */
export function formatBanglaTimeForSpeech(timeStr: string): string {
  if (!timeStr) return '';

  // Match 12-hour format e.g., 9:00 AM or 09:30 PM
  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const period = match12[3] ? match12[3].toUpperCase() : '';

    let prefix = 'সকাল';
    if (period === 'PM') {
      if (hour < 12) hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    if (hour >= 4 && hour < 12) {
      prefix = 'সকাল';
    } else if (hour >= 12 && hour < 15) {
      prefix = 'দুপুর';
    } else if (hour >= 15 && hour < 18) {
      prefix = 'বিকাল';
    } else if (hour >= 18 && hour < 20) {
      prefix = 'সন্ধ্যা';
    } else {
      prefix = 'রাত';
    }

    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const bnHour = convertDigitsToBangla(String(displayHour));
    const bnMinute = convertDigitsToBangla(String(minute));

    if (minute === 0) {
      return `${prefix} ${bnHour}টা`;
    } else if (minute === 30) {
      return `${prefix} সাড়ে ${bnHour}টা`;
    } else if (minute === 15) {
      return `${prefix} সোয়া ${bnHour}টা`;
    } else if (minute === 45) {
      const nextHour = displayHour === 12 ? 1 : displayHour + 1;
      return `${prefix} পৌনে ${convertDigitsToBangla(String(nextHour))}টা`;
    } else {
      return `${prefix} ${bnHour}টা ${bnMinute} মিনিট`;
    }
  }

  return convertDigitsToBangla(timeStr);
}

/**
 * Prepares Bengali text before sending to Neural TTS:
 * 1. Strips out code blocks, URLs, markdown tags.
 * 2. Normalizes English technical words into Bengali phonetics.
 * 3. Formats digits, times, and dates.
 * 4. Preserves correct Bengali Unicode and punctuation (।, !, ?, ,).
 */
export function normalizeBanglaTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove Markdown code blocks entirely (never speak code verbatim)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' কোড ব্লকটি স্ক্রিনে প্রদর্শন করা হলো। ');
  cleaned = cleaned.replace(/`[^`]+`/g, ' কোড ');

  // 2. Remove markdown images and links [title](url) -> title
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 3. Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, ' ওয়েব লিঙ্ক ');

  // 4. Remove Markdown formatting symbols (*, _, #, ~, >, etc.)
  cleaned = cleaned.replace(/[*_#~>]/g, ' ');

  // 5. Format times in the text e.g. "৯:০০ AM" or "09:00"
  cleaned = cleaned.replace(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/gi, (match) => {
    return formatBanglaTimeForSpeech(match);
  });

  // 6. Phonetically convert English technical words so the Bengali voice pronounces them naturally
  for (const [pattern, phonetic] of TECH_TERMS_PHONETIC) {
    cleaned = cleaned.replace(pattern, phonetic);
  }

  // 7. Convert remaining English digits to Bengali digits
  cleaned = convertDigitsToBangla(cleaned);

  // 8. Fix English honorifics to Bengali equivalents
  cleaned = cleaned.replace(/\bSir\b/gi, 'স্যার');

  // 9. Standardize punctuation: replace English periods following Bengali text with Dari (।)
  cleaned = cleaned.replace(/([\u0980-\u09FF])\s*\./g, '$1।');

  // 10. Clean whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Splits text into natural speech chunks (up to maxChars)
 * without cutting words, respecting Bengali sentence boundaries (।, !, ?, \n).
 */
export function splitIntoSpeechChunks(text: string, maxChars: number = 180): string[] {
  if (!text || text.length <= maxChars) return [text];

  const sentences = text.split(/([।!?\n]+)/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = (sentences[i] || '') + (sentences[i + 1] || '');
    if (!sentence.trim()) continue;

    if ((currentChunk + sentence).length <= maxChars) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      if (sentence.length <= maxChars) {
        currentChunk = sentence;
      } else {
        // Fallback: split by comma or clause
        const clauses = sentence.split(/([,;]+)/);
        let subChunk = '';
        for (let j = 0; j < clauses.length; j += 2) {
          const clause = (clauses[j] || '') + (clauses[j + 1] || '');
          if ((subChunk + clause).length <= maxChars) {
            subChunk += clause;
          } else {
            if (subChunk.trim()) chunks.push(subChunk.trim());
            subChunk = clause;
          }
        }
        if (subChunk.trim()) currentChunk = subChunk;
        else currentChunk = '';
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Banglish dictionary and transliterator for spoken Bengali mapping
 */
export const BANGLISH_COMMON_PHRASES: [RegExp, string][] = [
  [/\byoutube open koro\b/gi, 'ইউটিউব চালু করো'],
  [/\byoutube open korchhi\b/gi, 'ইউটিউব চালু করছি'],
  [/\bgithub open koro\b/gi, 'গিটহাব চালু করো'],
  [/\bgithub open korchhi\b/gi, 'গিটহাব চালু করছি'],
  [/\bgmail open koro\b/gi, 'জিমেইল চালু করো'],
  [/\bgmail open korchhi\b/gi, 'জিমেইল চালু করছি'],
  [/\bajker weather bolo\b/gi, 'আজকের আবহাওয়ার খবর বলো'],
  [/\bajker weather kemon\b/gi, 'আজকের আবহাওয়া কেমন'],
  [/\bweather report\b/gi, 'আবহাওয়ার খবর'],
  [/\bamar jonno ekta portfolio website er code lekho\b/gi, 'আমার জন্য একটা পোর্টফোলিও ওয়েবসাইটের কোড লেখো'],
  [/\bportfolio website er code\b/gi, 'পোর্টফোলিও ওয়েবসাইটের কোড'],
  [/\bei code er error khuje ber koro\b/gi, 'এই কোডের এরর খুঁজে বের করো'],
  [/\berror khuje ber koro\b/gi, 'এরর বা ভুল খুঁজে বের করো'],
  [/\bamake kal shokal 9 tay reminder dio\b/gi, 'আমাকে কাল সকাল ৯টায় রিমাইন্ডার দিও'],
  [/\bshokal 9 tay reminder dio\b/gi, 'সকাল ৯টায় রিমাইন্ডার দিও'],
  [/\bgoogle e react tutorial search koro\b/gi, 'গুগলে রিয়েক্ট টিউটোরিয়াল সার্চ করো'],
  [/\bsearch koro\b/gi, 'সার্চ করো'],
  [/\bopen koro\b/gi, 'চালু করো'],
  [/\bkemon acho\b/gi, 'কেমন আছেন'],
  [/\bkemon achho\b/gi, 'কেমন আছেন'],
  [/\bami ready achi\b/gi, 'আমি প্রস্তুত আছি'],
  [/\bekhon shomoy bolo\b/gi, 'এখন সময় বলো'],
  [/\bshomoy koto\b/gi, 'সময় কত'],
  [/\btarikh koto\b/gi, 'তারিখ কত'],
  [/\bapnake dhonnobad\b/gi, 'আপনাকে ধন্যবাদ'],
  [/\bdhonnobad\b/gi, 'ধন্যবাদ'],
  [/\bshunche\b/gi, 'শুনছি'],
  [/\bbhalo achi\b/gi, 'ভালো আছি'],
  [/\bbhalo\b/gi, 'ভালো'],
  [/\bkaj koro\b/gi, 'কাজ করো'],
  [/\bthik ache\b/gi, 'ঠিক আছে'],
  [/\bshokal\b/gi, 'সকাল'],
  [/\bdupur\b/gi, 'দুপুর'],
  [/\bbikal\b/gi, 'বিকাল'],
  [/\brat\b/gi, 'রাত'],
  [/\bkal\b/gi, 'কাল'],
  [/\bami\b/gi, 'আমি'],
  [/\btumi\b/gi, 'আপনি'],
  [/\bapni\b/gi, 'আপনি'],
  [/\bsir\b/gi, 'স্যার'],
];

export function convertBanglishToBangla(text: string): string {
  let res = text;
  for (const [pattern, bn] of BANGLISH_COMMON_PHRASES) {
    res = res.replace(pattern, bn);
  }
  return res;
}
