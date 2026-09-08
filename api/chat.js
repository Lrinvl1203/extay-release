const fs = require('fs');
const path = require('path');

const { createHash } = require('node:crypto');
const GUIDE_KNOWLEDGE = require('../data/guide-knowledge.json');
const createGuestFallback = require('../lib/guest-fallback');
const guestFallback = createGuestFallback(GUIDE_KNOWLEDGE);

function readChatSystemPrompt() {
  const candidates = [
    path.join(process.cwd(), 'data', 'chatbot-system-prompt.txt'),
    path.join(__dirname, '..', 'data', 'chatbot-system-prompt.txt')
  ];
  for (const p of candidates) {
    try {
      const prompt = fs.readFileSync(p, 'utf8').trim();
      if (prompt) return prompt;
    } catch (_) {}
  }
  throw new Error('Missing data/chatbot-system-prompt.txt');
}

function extractText(output) {
  if (typeof output?.output_text === 'string') return output.output_text;
  const parts = [];
  for (const item of output?.output || []) {
    for (const c of item?.content || []) {
      if (typeof c?.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('\n').trim();
}

function normalizeAnswer(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const CHAT_SYSTEM_PROMPT = readChatSystemPrompt();
// Serialize the shared prefix once per function instance. No per-request
// language, guest details, timestamps, or conversation content go here.
const GUIDE_CONTEXT = `GUIDE_KNOWLEDGE:\n${JSON.stringify(GUIDE_KNOWLEDGE)}`;
const PROMPT_CACHE_KEY = 'extay-guide:' + createHash('sha256')
  .update(CHAT_SYSTEM_PROMPT + '\n' + GUIDE_CONTEXT).digest('hex').slice(0, 24);

function buildRequestBody(question, history = [], model = 'gpt-5.4-mini') {
  const messages = (Array.isArray(history) ? history : [])
    .filter(m => m && typeof m.content === 'string')
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 1200) }));
  // Older pages included the current question at the end of history.
  if (messages.at(-1)?.role === 'user' && messages.at(-1).content.trim() === question) messages.pop();
  return {
    model,
    input: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'developer', content: GUIDE_CONTEXT },
      ...messages.slice(-6),
      { role: 'user', content: `TARGET_LANGUAGE: ${languageName(detectQuestionLanguage(question))}\nLATEST_GUEST_QUESTION:\n${question}` }
    ],
    prompt_cache_key: PROMPT_CACHE_KEY,
    tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
    tool_choice: 'auto',
    temperature: 0.2,
    max_output_tokens: 1200
  };
}

const DECORATIVE_HEADING_PATTERN = /^(?:와이파이 정보|연결 방법|체크인 시간|체크인 방법|세탁기 사용 방법|건조기 사용 방법|사용 방법|사용 전 꼭 확인해 주세요|꼭 참고해 주세요|도착 팁|추가 팁|참고|Wi-?Fi information|How to connect|Check-in time|Check-in steps|Washer|Dryer|Important|Tips)$/i;
const TRAILING_INVITATION_PATTERN = /(?:원하시면|궁금한 점|언제든(?:지)?|도와드릴게요|편안한 .*되시|feel free|let me know|happy to help|if you(?:'d| would) like|如需|随时|いつでも|ご希望でしたら)/i;
const KOREAN_SPACING_REPLACEMENTS = [
  [/키번호/g, '키 번호'],
  [/현관입구/g, '현관 입구'],
  [/뒷편/g, '뒤편'],
  [/일반쓰레기/g, '일반 쓰레기'],
  [/음식물쓰레기/g, '음식물 쓰레기'],
  [/종량제봉투/g, '종량제 봉투'],
  [/공용화장실/g, '공용 화장실'],
  [/금연구역/g, '금연 구역'],
  [/체크인시간/g, '체크인 시간'],
  [/체크아웃시간/g, '체크아웃 시간'],
  [/예약인원/g, '예약 인원'],
  [/숙박인원/g, '숙박 인원'],
  [/확인해주세요/g, '확인해 주세요'],
  [/안내해주세요/g, '안내해 주세요'],
  [/이용해주세요/g, '이용해 주세요'],
  [/입력해주세요/g, '입력해 주세요'],
  [/선택해주세요/g, '선택해 주세요'],
  [/눌러주세요/g, '눌러 주세요'],
  [/넣어주세요/g, '넣어 주세요'],
  [/열어주세요/g, '열어 주세요'],
  [/닫아주세요/g, '닫아 주세요'],
  [/피해주세요/g, '피해 주세요'],
  [/알려주세요/g, '알려 주세요']
];

function normalizeKoreanSpacing(value) {
  return KOREAN_SPACING_REPLACEMENTS.reduce((answer, [pattern, replacement]) => answer.replace(pattern, replacement), value);
}

function formatGuestAnswer(value, languageCode = 'ko', question = '') {
  const normalized = normalizeAnswer(value)
    .replace(/\s*\(\[[^\]\n]+\]\([^\)\n]+\)\)?/g, '')
    .replace(/\s*\(\[[^\]\n]*\]\([^\n]*$/g, '')
    .replace(/\s*(?:【[^】\n]+】|cite[^\n]+)/g, '');
  const rawLines = (languageCode === 'ko' ? normalizeKoreanSpacing(normalized) : normalized)
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (rawLines.length > 1 && /^(?:안녕하세요|안녕하십니까|Hello|Hi\b|こんにちは|您好|你好)/i.test(rawLines[0])) rawLines.shift();

  const lines = rawLines.filter((line, index) => {
    if (DECORATIVE_HEADING_PATTERN.test(line)) return false;
    const next = rawLines[index + 1] || '';
    return !(line.length <= 28 && !/[.!?。！？:：]$/.test(line) && /^(?:[-*•]|\d+[.)])\s*/.test(next));
  });

  while (lines.length > 1 && TRAILING_INVITATION_PATTERN.test(lines[lines.length - 1])) lines.pop();

  return lines.join('\n');
}

function publicSearchDisclosure(languageCode) {
  return {
    ko: '🔎 숙소 매뉴얼에 없는 내용이라 공개 웹 정보를 참고했습니다.\n📌 실제 운행·운영 정보는 달라질 수 있으니 Airbnb 메시지로 호스트에게 한 번 더 확인해 주세요.',
    en: '🔎 This is based on public web information, not the property manual.\n📌 Service details can change, so please reconfirm with the host through Airbnb messages.',
    ja: '🔎 宿泊施設のマニュアルにないため、公開ウェブ情報を参考にしています。\n📌 運行・営業状況は変わるため、Airbnbメッセージでホストにもご確認ください。',
    zh: '🔎 此信息参考公开网页，并非住宿手册内容。\n📌 运营情况可能变化，请通过 Airbnb 消息向房东再次确认。'
  }[languageCode] || publicSearchDisclosure('ko');
}

function addPublicSearchDisclosure(answer, languageCode) {
  const normalized = normalizeAnswer(answer);
  const disclosure = publicSearchDisclosure(languageCode);
  if (!normalized) return disclosure;
  if (/(?:공개\s*(?:웹|검색)|public\s*(?:web|search)|公開.*(?:ウェブ|検索)|公开.*(?:网页|网络|搜索))/i.test(normalized)) return normalized;
  return `${normalized}\n${disclosure}`;
}

function detectQuestionLanguage(question) {
  const q = String(question || '');
  if (/[가-힣]/.test(q)) return 'ko';
  if (/[\u3040-\u30ff]/.test(q)) return 'ja';
  if (/[\u3400-\u9fff]/.test(q)) return 'zh';
  if (/[a-z]/i.test(q)) return 'en';
  return 'ko';
}

function languageName(code) {
  return {
    ko: 'Korean',
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese'
  }[code] || 'Korean';
}

function localAnswer(question) {
  return guestFallback.answer(question);
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (_) {
      return {};
    }
  }
  return req.body || {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const body = parseBody(req);
    return res.status(200).json({
      fallback: true,
      answer: localAnswer(body.message)
    });
  }

  try {
    const body = parseBody(req);
    const question = String(body.message || '').trim().slice(0, 1200);
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!question) return res.status(400).json({ error: 'message is required' });
    const targetLanguageCode = detectQuestionLanguage(question);

    const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildRequestBody(question, history, model))
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('OpenAI API fallback:', response.status, data?.error?.code || data?.error?.message || 'unknown');
      return res.status(200).json({
        fallback: true,
        answer: localAnswer(question)
      });
    }

    const searched = (data.output || []).some(item => item.type === 'web_search_call');
    const baseAnswer = formatGuestAnswer(extractText(data), targetLanguageCode, question);
    const answer = searched
      ? addPublicSearchDisclosure(baseAnswer, targetLanguageCode)
      : (baseAnswer || '답변을 만들지 못했어요. Airbnb 메시지로 호스트에게 확인해 주세요.');
    const usage = data.usage ? {
      input_tokens: data.usage.input_tokens,
      cached_tokens: data.usage.input_tokens_details?.cached_tokens || 0,
      output_tokens: data.usage.output_tokens
    } : undefined;
    console.info('Chat usage:', JSON.stringify({ model, knowledge_version: GUIDE_KNOWLEDGE.source.version, ...usage, searched }));
    return res.status(200).json({ answer, model, searched, usage });
  } catch (err) {
    console.warn('Chat API fallback:', err.message || String(err));
    return res.status(200).json({
      fallback: true,
      answer: localAnswer(parseBody(req).message)
    });
  }
};

module.exports._test = {
  CHAT_SYSTEM_PROMPT,
  GUIDE_KNOWLEDGE,
  buildRequestBody,
  detectQuestionLanguage,
  formatGuestAnswer,
  addPublicSearchDisclosure,
  localAnswer,
  normalizeAnswer,
  normalizeKoreanSpacing,
  publicSearchDisclosure
};
