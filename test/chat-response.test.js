const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const handler = require('../api/chat');
const {
  CHAT_SYSTEM_PROMPT,
  formatGuestAnswer,
  localAnswer,
  normalizeAnswer
} = handler._test;

test('prompt asks for short, guest-first mobile answers', () => {
  const promptFile = fs.readFileSync(path.join(__dirname, '..', 'data', 'chatbot-system-prompt.txt'), 'utf8').trim();
  assert.equal(CHAT_SYSTEM_PROMPT, promptFile);
  assert.match(CHAT_SYSTEM_PROMPT, /Start with the answer/);
  assert.match(CHAT_SYSTEM_PROMPT, /1-3 short sentences/);
  assert.match(CHAT_SYSTEM_PROMPT, /correct spacing, particles/);
  assert.match(CHAT_SYSTEM_PROMPT, /Do not use Markdown headings/);
  assert.match(CHAT_SYSTEM_PROMPT, /no more than 4 non-empty mobile lines/);
  assert.doesNotMatch(CHAT_SYSTEM_PROMPT, /Never give one-line answers/);
  assert.doesNotMatch(CHAT_SYSTEM_PROMPT, /Guest WOW Mode/);
});

test('legacy long-form prompt is preserved for rollback', () => {
  const legacy = fs.readFileSync(path.join(__dirname, '..', 'docs', 'chatbot-system-prompt-legacy-2026-07-20.md'), 'utf8');
  assert.match(legacy, /Guest WOW Mode/);
  assert.match(legacy, /Warm greeting \/ acknowledgment/);
  assert.match(legacy, /max_output_tokens: 900|Format for mobile/);
});

test('Korean local answers are short and use corrected spacing', () => {
  const wifi = localAnswer('와이파이 비밀번호 알려줘');
  const checkout = localAnswer('체크아웃은 어떻게 해?');
  const restroom = localAnswer('공용 화장실 비밀번호');

  assert.ok(wifi.length <= 120);
  assert.match(wifi, /`8H3#22E97B`입니다/);
  assert.ok(checkout.length <= 180);
  assert.match(checkout, /개인 키 번호|퇴실 전/);
  assert.match(restroom, /뒤편/);
  assert.match(restroom, /`\*7003\*`입니다/);
});

test('answer normalization removes noisy spacing and blank lines', () => {
  assert.equal(
    normalizeAnswer('  첫 문장입니다.  \r\n\r\n\r\n  둘째 문장입니다.   '),
    '첫 문장입니다.\n\n둘째 문장입니다.'
  );
});

test('guest answer formatter removes presentation noise and enforces a mobile limit', () => {
  const verbose = `안녕하세요! 와이파이 바로 안내드릴게요 😊

**와이파이 정보**
- **SSID(네트워크 이름):** \`U+Net46F0_5G\`
- **비밀번호:** \`8H3#22E97B\`

**연결 방법**
- 비밀번호는 대소문자와 특수문자를 그대로 입력해 주세요.
- 연결이 안 되면 Wi-Fi를 껐다가 다시 켜 주세요.

원하시면 더 자세히 도와드릴게요.`;
  const answer = formatGuestAnswer(verbose, 'ko', '와이파이 비밀번호 알려줘');
  assert.doesNotMatch(answer, /안녕하세요|와이파이 정보|연결 방법|원하시면|\*\*|😊/);
  assert.ok(answer.length <= 320);
  assert.ok(answer.split('\n').length <= 5);
  assert.match(answer, /U\+Net46F0_5G/);
  assert.match(answer, /8H3#22E97B/);
});

test('API-key fallback returns a concise guest answer', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  let statusCode;
  let payload;
  const res = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return value;
    }
  };

  try {
    await handler({ method: 'POST', body: { message: '체크인은 몇 시야?' } }, res);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }

  assert.equal(statusCode, 200);
  assert.equal(payload.fallback, true);
  assert.ok(payload.answer.length <= 180);
  assert.match(payload.answer, /^체크인은 오후 4시부터/);
});

test('browser fallback uses the same concise Korean copy', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'guide-extay.html'), 'utf8');
  assert.match(html, /와이파이 이름은 `U\+Net46F0_5G`/);
  assert.match(html, /개인 키 번호는 당일 정오쯤 Airbnb 메시지로 보내드립니다/);
  assert.match(html, /밤 9시부터는 소음을 줄여 주세요/);
  assert.match(html, /건조기는 전원 → 건조 코스 → 시작 순서예요/);
  assert.match(html, /white-space:pre-wrap;overflow-wrap:anywhere;word-break:keep-all;text-align:left/);
  assert.doesNotMatch(html, /체크아웃 시간을 10분 초과하면 10분당 10,000원의 비용이 발생할 수 있습니다/);
});
