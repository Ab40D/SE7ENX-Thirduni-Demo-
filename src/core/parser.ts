/**
 * SE7ENX — multilingual command parser.
 *
 * Deterministic, rule-based NLU for four language modes:
 *   en → English, fr → French, ar → Modern Standard Arabic, dz → Algerian Darija.
 *
 * The parser is intentionally narrow: it recognises the documented commands
 * and common variations, and answers a small set of contextual questions.
 * It never guesses a device state and never executes anything by itself.
 */
import type { LanguageCode, ParseOutcome, QuestionIntent } from './types';

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_TATWEEL = /\u0640/g;
const ARABIC_INDIC = /[\u0660-\u0669]/g;
const PERSIAN_INDIC = /[\u06F0-\u06F9]/g;

function stripLatinDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function stripArabicDiacritics(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, '')
    .replace(ARABIC_TATWEEL, '');
}

function normalizeArabicLetters(input: string): string {
  return input
    .replace(/[أإآٱ]/g, '\u0627') // أ إ آ → ا
    .replace(/ى/g, '\u064A') // ى → ي
    .replace(/ة/g, '\u0647') // ة → ه
    .replace(/ؤ/g, '\u0648') // ؤ → و
    .replace(/ئ/g, '\u064A') // ئ → ي
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

/**
 * Produces a comparable form: lower-case, no diacritics, Latin & Arabic
 * letter unification, Arabic-Indic digits → ASCII, punctuation → spaces.
 */
export function normalize(raw: string): string {
  let text = raw.toLowerCase();
  text = stripLatinDiacritics(text);
  text = stripArabicDiacritics(text);
  text = normalizeArabicLetters(text);
  text = text.replace(PERSIAN_INDIC, (d) => String(d.charCodeAt(0) - 0x06F0));
  text = text.replace(ARABIC_INDIC, (d) => String(d.charCodeAt(0) - 0x0660));
  text = text.replace(/[\u061F\u060C\u061B\u06D4\u2026\u00AB\u00BB]/g, ' ');
  text = text.replace(/[^0-9a-z\u0600-\u06FF]+/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export function tokenize(raw: string): string[] {
  const n = normalize(raw);
  return n.length ? n.split(' ') : [];
}

function isArabicLang(lang: LanguageCode): boolean {
  return lang === 'ar' || lang === 'dz';
}

/** Does the normalized text contain any of the given words? */
function containsWord(tokens: string[], lang: LanguageCode, words: string[]): boolean {
  const set = new Set(words.map((w) => normalize(w)));
  if (isArabicLang(lang)) {
    const joined = tokens.join(' ');
    return [...set].some((w) => w.length > 0 && joined.includes(w));
  }
  return tokens.some((t) => set.has(t));
}

/** Contiguous token-sequence match, e.g. "current light status". */
function containsSequence(tokens: string[], sequence: string[]): boolean {
  const seq = sequence.map((s) => normalize(s));
  if (!seq.length || seq.length > tokens.length) return false;
  for (let i = 0; i + seq.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function containsAnySequence(tokens: string[], sequences: string[][]): boolean {
  return sequences.some((seq) => containsSequence(tokens, seq));
}

/* ------------------------------------------------------------------ */
/* Lexicons                                                            */
/* ------------------------------------------------------------------ */

interface Lexicon {
  light: string[];
  shutter: string[];
  plug: string[];
  ambient: string[];
  occupancy: string[];
  on: string[];
  off: string[];
  open: string[];
  close: string[];
  stop: string[];
  brightness: string[];
  increase: string[];
  decrease: string[];
  reset: string[];
  questions: Partial<Record<QuestionIntent, string[][]>>;
}

const EN: Lexicon = {
  light: ['light', 'lights', 'lamp', 'lamps', 'lighting', 'luminaire', 'bulb', 'bulbs'],
  shutter: ['shutter', 'shutters', 'blind', 'blinds', 'shade', 'window', 'curtain', 'curtains'],
  plug: ['plug', 'socket', 'outlet', 'power'],
  ambient: ['ambient', 'daylight', 'sunlight', 'background light'],
  occupancy: ['occupancy', 'presence', 'someone', 'somebody', 'nobody', 'empty room'],
  on: ['turn on', 'switch on', 'power on', 'light on', 'lights on', 'on'],
  off: ['turn off', 'switch off', 'power off', 'light off', 'lights off', 'off', 'extinguish', 'kill the light', 'lights out'],
  open: ['open', 'raise', 'lift'],
  close: ['close', 'shut', 'lower', 'bring down'],
  stop: ['stop', 'pause', 'halt', 'hold', 'freeze'],
  brightness: ['brightness', 'bright', 'dim', 'dimm', 'intensity', 'light level', 'level of light', 'lux'],
  increase: ['brighter', 'increase', 'raise the brightness', 'more light', 'up'],
  decrease: ['dimmer', 'decrease', 'reduce', 'less light', 'down'],
  reset: ['reset', 'restart', 'default', 'initial state'],
  questions: {
    who: [['who', 'are', 'you'], ['your', 'name'], ['who', 'you', 'are']],
    what: [['what', 'is', 'se7enx'], ['what', 'does', 'se7enx', 'do'], ['how', 'does', 'se7enx', 'work'], ['what', 'is', 'se7enx']],
    controls: [['what', 'can', 'i', 'control'], ['what', 'can', 'i', 'do'], ['what', 'can', 'you', 'control'], ['which', 'devices']],
    lightStatus: [
      ['current', 'light', 'status'],
      ['light', 'status'],
      ['light', 'state'],
      ['is', 'the', 'light', 'on'],
      ['what', 'is', 'the', 'light'],
      ['how', 'bright', 'is', 'the', 'light'],
      ['brightness', 'of', 'the', 'light'],
    ],
    shutterStatus: [
      ['shutter', 'position'],
      ['shutter', 'status'],
      ['where', 'is', 'the', 'shutter'],
      ['how', 'much', 'is', 'the', 'shutter'],
      ['shutter', 'state'],
    ],
    gestures: [
      ['hand', 'gesture'],
      ['hand', 'gestures'],
      ['gesture', 'control'],
      ['how', 'do', 'gestures', 'work'],
      ['how', 'do', 'i', 'use', 'gestures'],
      ['gesture'],
      ['gestures'],
    ],
    realBuilding: [['real', 'building'], ['connected', 'to', 'a', 'real'], ['physical', 'device'], ['real', 'device'], ['actual', 'building'], ['real', 'hardware']],
    automation: [['smart', 'building'], ['building', 'automation'], ['knx'], ['mqtt'], ['home', 'assistant'], ['automation']],
    help: [['help'], ['what', 'can', 'i', 'say'], ['commands'], ['examples']],
    greetings: [['hello'], ['hi'], ['hey'], ['salam'], ['salaam'], ['bonjour'], ['salut']],
    thanks: [['thank', 'you'], ['thanks'], ['merci']],
  },
};

const FR: Lexicon = {
  light: ['lumiere', 'lampe', 'eclairage', 'lampes', 'luminaire'],
  shutter: ['volet', 'volets', 'rideau', 'rideaux', 'store', 'stores', 'jalousie', 'fenetre'],
  plug: ['prise', 'prises', 'plug', 'socket', 'interrupteur'],
  ambient: ['ambiant', 'ambiance', 'lumiere du jour', 'luminosite ambiante'],
  occupancy: ['occupation', 'presence', 'quelqu un', 'personne', 'vide'],
  on: ['allume', 'allumer', 'allume la', 'mets la lumiere', 'marche'],
  off: ['eteins', 'eteindre', 'eteint', 'coupe', 'coupe la lumiere', 'arrete la lumiere', 'extinguis'],
  open: ['ouvre', 'ouvrir', 'leve'],
  close: ['ferme', 'fermer', 'descends', 'abaisse'],
  stop: ['arrete', 'arreter', 'stop', 'halte', 'pause', 'gele'],
  brightness: ['luminosite', 'reglage de la luminosite', 'intensite', 'niveau de lumiere'],
  increase: ['plus clair', 'augmente', 'augmenter', 'plus de lumiere'],
  decrease: ['moins clair', 'diminue', 'diminuer', 'moins de lumiere', 'reduis'],
  reset: ['reinitialise', 'reinitialiser', 'reset', 'par defaut'],
  questions: {
    who: [['qui', 'es', 'tu'], ['qui', 'etes', 'vous'], ['ton', 'nom']],
    what: [['qu', 'est', 'ce', 'que', 'se7enx'], ['c', 'est', 'quoi', 'se7enx'], ['comment', 'ca', 'marche'], ['comment', 'fonctionne', 'se7enx']],
    controls: [['que', 'puis', 'je', 'controler'], ['que', 'puis', 'je', 'faire'], ['qu', 'est', 'ce', 'que', 'je', 'peux', 'controler'], ['quels', 'appareils']],
    lightStatus: [
      ['etat', 'de', 'la', 'lumiere'],
      ['etat', 'lumiere'],
      ['quelle', 'est', 'la', 'lumiere'],
      ['est', 'ce', 'que', 'la', 'lumiere', 'est', 'allumee'],
      ['luminosite', 'actuelle'],
      ['quelle', 'est', 'la', 'luminosite'],
    ],
    shutterStatus: [['position', 'du', 'volet'], ['position', 'volet'], ['ou', 'est', 'le', 'volet'], ['etat', 'du', 'volet']],
    gestures: [['geste'], ['gestes'], ['mains'], ['comment', 'utiliser', 'les', 'gestes'], ['mouvement', 'de', 'main']],
    realBuilding: [['batiment', 'reel'], ['vrai', 'batiment'], ['materiel', 'reel'], ['appareil', 'reel'], ['materiel', 'physique']],
    automation: [['domotique'], ['batiment', 'intelligent'], ['automatisation'], ['knx'], ['mqtt']],
    help: [['aide'], ['que', 'puis', 'je', 'dire'], ['exemples'], ['commandes']],
    greetings: [['bonjour'], ['salut'], ['coucou'], ['salam']],
    thanks: [['merci']],
  },
};

const AR: Lexicon = {
  light: ['الضوء', 'الضو', 'الإضاءة', 'الاضاءة', 'الإنارة', 'الانارة', 'اللمبة', 'المبة', 'اللامبة', 'الاضاءه'],
  shutter: ['الستارة', 'الستاره', 'البريد', 'الشيش', 'شيش', 'الستور', 'الرياض', 'الرول'],
  plug: ['المقبس', 'المقابس', 'البplug', 'plug', 'الفيشة', 'الفيشة'],
  ambient: ['الإضاءة المحيطة', 'الاضاءة المحيطية', 'النهار', 'ضوء النهار', 'المحيط'],
  occupancy: ['الإشغال', 'الاشغال', 'الحضور', 'يوجد شخص', 'لا يوجد شخص', 'شخص في الغرفة', 'فارغ'],
  on: ['شعل', 'شعل', 'شغل', 'شغل', 'ولع', 'ولع', 'شغّل', 'شعل ال'],
  off: ['طفي', 'اطفأ', 'أطفأ', 'طفا', 'أغلق الضوء', 'غلق الضوء'],
  open: ['افتح', 'افتح', 'فتح', 'ارفع', 'حل'],
  close: ['اغلق', 'اطبق', 'سدد', 'اخفض', 'انزل'],
  stop: ['حبس', 'اوقف', 'وقف', 'توقف', 'جمّد'],
  brightness: ['الإضاءة', 'الاضاءة', 'السطوع', 'سطوع', 'شدة الإضاءة', 'درجة الإضاءة', 'الluminosite'],
  increase: ['زد', 'زد ال', 'زود', 'زد ال', 'انرع', 'زیادة', 'زید', 'زید ال'],
  decrease: ['نقص', 'انقص', 'خفف', 'خفض', 'نقص ال', 'تنقص'],
  reset: ['reset', 'ريست', 'اعد', 'أعد', 'الوضع الافتراضي', 'رجع للوضع'],
  questions: {
    who: [['من', 'انت'], ['من', 'انتي'], ['شكون', 'انتي'], ['شكون', 'نتا']],
    what: [['ما', 'هو', 'se7enx'], ['ما', 'هي', 'se7enx'], ['شنو', 'هو', 'se7enx'], ['شو', 'هو', 'se7enx']],
    controls: [['ماذا', 'يمكنني', 'التحكم'], ['بماذا', 'تتحكم'], ['شنو', 'نقدر', 'نتحكم'], ['شو', 'نقدر', 'نتحكم'], ['ما', 'الاشياء', 'اللي', 'نقدر']],
    lightStatus: [
      ['حالة', 'الضوء'],
      ['وضعية', 'الضوء'],
      ['هل', 'الضو', 'مولع'],
      ['هل', 'الضوء', 'مولع'],
      ['شحال', 'الضو'],
      ['شحال', 'الإضاءة'],
      ['كم', 'الإضاءة'],
    ],
    shutterStatus: [
      ['وضعية', 'الستارة'],
      ['موقع', 'الستارة'],
      ['فين', 'الستارة'],
      ['شحال', 'الستارة'],
      ['وضعية', 'الفولي'],
      ['فين', 'الفولي'],
    ],
    gestures: [['اشارة', 'اليد'], ['حركة', 'اليد'], ['الاشارات', 'اليدوية'], ['كيفاش', 'نستعمل', 'اليد'], ['gesture']],
    realBuilding: [['مبنى', 'حقيقي'], ['مبنى', 'واقعي'], ['جهاز', 'حقيقي'], ['معدات', 'حقيقية'], ['مركب', 'حقيقي']],
    automation: [['مبنى', 'ذكي'], ['الautomation', 'الذكية'], ['automation', 'des', 'batiments'], ['أتمتة', 'المباني'], ['knx'], ['mqtt']],
    help: [['مساعدة'], ['ساعدني'], ['شكون', 'الأوامر'], ['examples'], ['help']],
    greetings: [['السلام', 'عليكم'], ['مرحبا'], ['اهلا', 'وسهلا'], ['أهلا'], ['salam'], ['hello']],
    thanks: [['شكرا'], ['شكرًا'], ['merci']],
  },
};

const DZ: Lexicon = {
  light: ['الضو', 'الضوء', 'الإضاءة', 'الاضاءة', 'اللمبة', 'المبة', 'النور', 'الضوء'],
  shutter: ['الفولي', 'فولي', 'الستارة', 'الستاره', 'البريد', 'الشيش', 'شيش', 'الرياض'],
  plug: ['الفيشة', 'المقبس', 'plug', 'البplug'],
  ambient: ['ضوء النهار', 'النهار', 'الإضاءة المحيطة', 'المحيط'],
  occupancy: ['شخص', 'كاين', 'ما كاينش', 'الغرفة', 'فارغة', 'الحضور'],
  on: ['شعل', 'شغل', 'ولع', 'علّي', 'رفع', 'شعل ال'],
  off: ['طفي', 'أطفأ', 'اطفأ', 'طفا', 'سوّد', 'سود'],
  open: ['حل', 'حلّ', 'افتح', 'فتح', 'علّي', 'رفع'],
  close: ['سد', 'سدّ', 'أغلق', 'اغلق', 'اخفض', 'نزّل'],
  stop: ['حبس', 'وقّف', 'اوقف', 'وقف', 'جمّد', 'جمّد'],
  brightness: ['الإضاءة', 'الاضاءة', 'السطوع', 'سطوع', 'شدة الضوء', 'مستوى الإضاءة'],
  increase: ['زيد', 'زود', 'انرع', 'زیاد', 'علّي ال'],
  decrease: ['نقص', 'انقص', 'خفف', 'خفض'],
  reset: ['reset', 'ريست', 'رجع', 'أعد', 'اعد', 'الوضع الافتراضي'],
  questions: {
    who: [['شكون', 'انتي'], ['شكون', 'نتا'], ['شكون', 'انت'], ['من', 'انت']],
    what: [['شنو', 'هو', 'se7enx'], ['شو', 'هو', 'se7enx'], ['شنو', 'هاذي'], ['ما', 'هو', 'se7enx']],
    controls: [['شنو', 'نقدر', 'نتحكم'], ['شو', 'نقدر', 'نتحكم'], ['شنو', 'تتحكم'], ['ما', 'نقدر', 'نتحكم']],
    lightStatus: [['شحال', 'الضو'], ['واش', 'الضو', 'مولع'], ['حالة', 'الضو'], ['شحال', 'الإضاءة']],
    shutterStatus: [['فين', 'الفولي'], ['شحال', 'الفولي'], ['وضعية', 'الفولي'], ['فين', 'الستارة']],
    gestures: [['حركة', 'اليد'], ['اشارة', 'اليد'], ['كيفاش', 'نستعمل', 'اليد']],
    realBuilding: [['مبنى', 'حقيقي'], ['بني', 'حقيقي'], ['جهاز', 'حقيقي']],
    automation: [['مبنى', 'ذكي'], ['الdomotique'], ['أتمتة']],
    help: [['ساعدني'], ['شكون', 'الأوامر'], ['امثلة']],
    greetings: [['السلام', 'عليكم'], ['مرحبا', 'يا', 'رب'], ['أهلا', 'وسهلا'], ['salam']],
    thanks: [['شكرا', 'بزاف'], ['شكرا']],
  },
};

function lexiconFor(lang: LanguageCode): Lexicon {
  switch (lang) {
    case 'fr':
      return FR;
    case 'ar':
      return AR;
    case 'dz':
      return DZ;
    default:
      return EN;
  }
}

/** Arabic mode also accepts the standard-Arabic vocabulary. */
function mergedLexicon(lang: LanguageCode): Lexicon {
  if (lang !== 'dz') return lexiconFor(lang);
  const base = lexiconFor('dz');
  const std = AR;
  const merge = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  const mergeSeq = (a: string[][], b: string[][]) => [...new Map([...a, ...b].map((seq) => [seq.join(' '), seq])).values()];
  return {
    light: merge(base.light, std.light),
    shutter: merge(base.shutter, std.shutter),
    plug: merge(base.plug, std.plug),
    ambient: merge(base.ambient, std.ambient),
    occupancy: merge(base.occupancy, std.occupancy),
    on: merge(base.on, std.on),
    off: merge(base.off, std.off),
    open: merge(base.open, std.open),
    close: merge(base.close, std.close),
    stop: merge(base.stop, std.stop),
    brightness: merge(base.brightness, std.brightness),
    increase: merge(base.increase, std.increase),
    decrease: merge(base.decrease, std.decrease),
    reset: merge(base.reset, std.reset),
    questions: {
      who: mergeSeq(base.questions.who ?? [], std.questions.who ?? []),
      what: mergeSeq(base.questions.what ?? [], std.questions.what ?? []),
      controls: mergeSeq(base.questions.controls ?? [], std.questions.controls ?? []),
      lightStatus: mergeSeq(base.questions.lightStatus ?? [], std.questions.lightStatus ?? []),
      shutterStatus: mergeSeq(base.questions.shutterStatus ?? [], std.questions.shutterStatus ?? []),
      gestures: mergeSeq(base.questions.gestures ?? [], std.questions.gestures ?? []),
      realBuilding: mergeSeq(base.questions.realBuilding ?? [], std.questions.realBuilding ?? []),
      automation: mergeSeq(base.questions.automation ?? [], std.questions.automation ?? []),
      help: mergeSeq(base.questions.help ?? [], std.questions.help ?? []),
      greetings: mergeSeq(base.questions.greetings ?? [], std.questions.greetings ?? []),
      thanks: mergeSeq(base.questions.thanks ?? [], std.questions.thanks ?? []),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Device + action detection                                           */
/* ------------------------------------------------------------------ */

type DeviceKey = 'light' | 'shutter' | 'plug' | 'ambient' | 'occupancy';

function detectDevice(tokens: string[], lang: LanguageCode, lex: Lexicon): DeviceKey | null {
  if (containsWord(tokens, lang, lex.shutter)) return 'shutter';
  if (containsWord(tokens, lang, lex.plug)) return 'plug';
  if (containsWord(tokens, lang, lex.ambient)) return 'ambient';
  if (containsWord(tokens, lang, lex.occupancy)) return 'occupancy';
  if (containsWord(tokens, lang, lex.light)) return 'light';
  // "set the brightness to 45 %" names no device but obviously means the light.
  if (containsWord(tokens, lang, lex.brightness)) return 'light';
  return null;
}

function extractNumber(tokens: string[]): number | null {
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const value = Number.parseInt(token, 10);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

function hasAny(tokens: string[], lang: LanguageCode, words: string[]): boolean {
  return containsWord(tokens, lang, words);
}

/* ------------------------------------------------------------------ */
/* Question routing                                                    */
/* ------------------------------------------------------------------ */

const QUESTION_ORDER: QuestionIntent[] = [
  'greetings',
  'thanks',
  'who',
  'realBuilding',
  'automation',
  'gestures',
  'lightStatus',
  'shutterStatus',
  'controls',
  'help',
  'what',
];

export function detectQuestion(tokens: string[], lex: Lexicon): QuestionIntent | null {
  for (const intent of QUESTION_ORDER) {
    const sequences = lex.questions[intent];
    if (!sequences || !sequences.length) continue;
    if (containsAnySequence(tokens, sequences)) return intent;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main parser                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parses a free-text utterance into a command, a question intent, or a
 * failure. Never throws; never mutates any state.
 */
export function parseCommand(raw: string, lang: LanguageCode = 'en'): ParseOutcome {
  const tokens = tokenize(raw);
  if (!tokens.length) return { type: 'unknown' };
  const lex = mergedLexicon(lang);

  // 1. Questions are resolved before commands so an informational question
  //    never accidentally toggles a device.
  const question = detectQuestion(tokens, lex);
  if (question) return { type: 'question', intent: question };

  // 2. Explicit reset request.
  if (hasAny(tokens, lang, lex.reset) && !detectDevice(tokens, lang, lex)) {
    return { type: 'command', command: { kind: 'reset' }, confidence: 'exact' };
  }

  const device = detectDevice(tokens, lang, lex);
  const number = extractNumber(tokens);

  // 3. Occupancy.
  if (device === 'occupancy') {
    if (hasAny(tokens, lang, lex.on)) return { type: 'command', command: { kind: 'occupancy.toggle' }, confidence: 'fuzzy' };
    return { type: 'command', command: { kind: 'occupancy.toggle' }, confidence: 'fuzzy' };
  }

  // 4. Ambient level.
  if (device === 'ambient') {
    if (number === null) return { type: 'unknown' };
    if (number > 100 || number < 0) return { type: 'invalid', reason: 'range', device: 'ambient' };
    return { type: 'command', command: { kind: 'ambient.set', value: number }, confidence: 'exact' };
  }

  // 5. Shutter.
  if (device === 'shutter') {
    const wantsStop = hasAny(tokens, lang, lex.stop);
    const wantsOpen = hasAny(tokens, lang, lex.open);
    const wantsClose = hasAny(tokens, lang, lex.close);

    if (wantsStop && !wantsOpen && !wantsClose) {
      return { type: 'command', command: { kind: 'shutter.stop' }, confidence: 'exact' };
    }
    if (wantsOpen && !wantsClose) {
      if (number !== null) {
        if (number > 100) return { type: 'invalid', reason: 'range', device: 'shutter' };
        return { type: 'command', command: { kind: 'shutter.position', value: number }, confidence: 'exact' };
      }
      return { type: 'command', command: { kind: 'shutter.open' }, confidence: 'exact' };
    }
    if (wantsClose && !wantsOpen) {
      if (number !== null) {
        if (number > 100) return { type: 'invalid', reason: 'range', device: 'shutter' };
        return { type: 'command', command: { kind: 'shutter.position', value: number }, confidence: 'exact' };
      }
      return { type: 'command', command: { kind: 'shutter.close' }, confidence: 'exact' };
    }
    if (number !== null) {
      if (number > 100) return { type: 'invalid', reason: 'range', device: 'shutter' };
      return { type: 'command', command: { kind: 'shutter.position', value: number }, confidence: 'exact' };
    }
    if (wantsStop) return { type: 'command', command: { kind: 'shutter.stop' }, confidence: 'fuzzy' };
    return { type: 'unknown' };
  }

  // 6. Smart plug.
  if (device === 'plug') {
    const off = hasAny(tokens, lang, lex.off);
    const on = hasAny(tokens, lang, lex.on);
    if (off && !on) return { type: 'command', command: { kind: 'plug.off' }, confidence: 'exact' };
    if (on && !off) return { type: 'command', command: { kind: 'plug.on' }, confidence: 'exact' };
    return { type: 'command', command: { kind: 'plug.toggle' }, confidence: 'fuzzy' };
  }

  // 7. Light (explicit or implied).
  const explicitLight = device === 'light';
  const brightnessWord = hasAny(tokens, lang, lex.brightness);
  const off = hasAny(tokens, lang, lex.off);
  const on = hasAny(tokens, lang, lex.on);

  if (explicitLight || off || on) {
    if (number !== null && (explicitLight || brightnessWord)) {
      if (number > 100) return { type: 'invalid', reason: 'range', device: 'light' };
      return { type: 'command', command: { kind: 'light.brightness', value: number }, confidence: 'exact' };
    }
    if (hasAny(tokens, lang, lex.increase)) {
      return { type: 'command', command: { kind: 'light.brighter' }, confidence: 'exact' };
    }
    if (hasAny(tokens, lang, lex.decrease)) {
      return { type: 'command', command: { kind: 'light.dimmer' }, confidence: 'exact' };
    }
    if (off && !on) return { type: 'command', command: { kind: 'light.off' }, confidence: 'exact' };
    if (on && !off) return { type: 'command', command: { kind: 'light.on' }, confidence: 'exact' };
    if (off && on) return { type: 'command', command: { kind: 'light.toggle' }, confidence: 'fuzzy' };
  }

  return { type: 'unknown' };
}

/** Localised sample commands shown in the UI. */
export function sampleCommands(lang: LanguageCode): string[] {
  switch (lang) {
    case 'fr':
      return [
        'Allume la lumière.',
        'Éteins la lumière.',
        'Règle la luminosité à 45 pour cent.',
        'Ouvre le volet.',
        'Ferme le volet.',
        'Arrête le volet.',
      ];
    case 'ar':
      return [
        'شعل الضوء.',
        'طفي الضوء.',
        'خلي الإضاءة 45 بالمئة.',
        'افتح الستارة.',
        'أغلق الستارة.',
      ];
    case 'dz':
      return [
        'شعل الضو.',
        'طفي الضو.',
        'نقص الضو لـ 45 بالمية.',
        'حلّ الفولي.',
        'سدّ الفولي.',
        'حبس الفولي.',
      ];
    default:
      return [
        'Turn on the light.',
        'Turn off the light.',
        'Set brightness to 45 percent.',
        'Open the shutter.',
        'Close the shutter.',
        'Set the shutter to 70 percent.',
        'Stop the shutter.',
        'What is the current light status?',
      ];
  }
}
