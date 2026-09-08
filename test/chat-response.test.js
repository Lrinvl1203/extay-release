const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const handler = require('../api/chat');
const {
  CHAT_SYSTEM_PROMPT,
  formatGuestAnswer,
  localAnswer,
  normalizeAnswer,
  normalizeKoreanSpacing
} = handler._test;

test('prompt asks for short, guest-first mobile answers', () => {
  const promptFile = fs.readFileSync(path.join(__dirname, '..', 'data', 'chatbot-system-prompt.txt'), 'utf8').trim();
  assert.equal(CHAT_SYSTEM_PROMPT, promptFile);
  assert.match(CHAT_SYSTEM_PROMPT, /Start with the answer/);
  assert.match(CHAT_SYSTEM_PROMPT, /1-3 short sentences/);
  assert.match(CHAT_SYSTEM_PROMPT, /correct spacing, particles/);
  assert.match(CHAT_SYSTEM_PROMPT, /Do not use Markdown headings/);
  assert.match(CHAT_SYSTEM_PROMPT, /proactively web-search/);
  assert.match(CHAT_SYSTEM_PROMPT, /no more than 5 non-empty mobile lines/);
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
  assert.doesNotMatch(answer, /안녕하세요|와이파이 정보|연결 방법|원하시면|\*\*/);
  assert.ok(answer.length <= 320);
  assert.ok(answer.split('\n').length <= 5);
  assert.match(answer, /U\+Net46F0_5G/);
  assert.match(answer, /8H3#22E97B/);
});

test('public web results keep useful emoji and receive a clear manual-and-host disclosure', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  const originalInfo = console.info;
  process.env.OPENAI_API_KEY = 'test-placeholder';
  console.info = () => {};
  global.fetch = async () => ({ok:true, json:async()=>({
    output_text:'🚌 심야 공항버스는 공항에서 서울역 방향으로 운행하는 노선을 확인해 보세요.',
    output:[{type:'web_search_call'}],
    usage:{input_tokens:12000,input_tokens_details:{cached_tokens:11008},output_tokens:32}
  })});
  let payload;
  const res = {setHeader(){}, status(){return this;}, json(body){payload=body;return body;}};
  try {
    await handler({method:'POST',body:{message:'인천공항 심야버스가 있나요?',history:[]}}, res);
    assert.equal(payload.searched, true);
    assert.match(payload.answer, /^🚌/);
    assert.match(payload.answer, /공개 웹 정보를 참고/);
    assert.match(payload.answer, /호스트에게 한 번 더 확인/);
  } finally {
    global.fetch = originalFetch;
    console.info = originalInfo;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test('guest answer formatter removes complete and truncated web citations', () => {
  const answer = formatGuestAnswer(
    '🚌 직행 심야버스는 확인되지 않았습니다. ([airport.kr](https://airport.kr/night))\n택시를 이용하세요. ([airport.kr](https://airport.kr/',
    'ko',
    '심야버스가 있나요?'
  );
  assert.match(answer, /^🚌/);
  assert.doesNotMatch(answer, /airport\.kr|https?:\/\/|\(\[/);
});

test('Korean spacing guard corrects common guest-facing forms', () => {
  assert.equal(
    normalizeKoreanSpacing('개인 키번호를 확인해주세요. 현관입구에서 번호를 눌러주세요.'),
    '개인 키 번호를 확인해 주세요. 현관 입구에서 번호를 눌러 주세요.'
  );
  assert.equal(
    formatGuestAnswer('개인 키번호는 Airbnb 메시지를 확인해주세요.', 'ko', '체크인 방법'),
    '개인 키 번호는 Airbnb 메시지를 확인해 주세요.'
  );
  assert.equal(
    formatGuestAnswer('음식물쓰레기는 전용 통에, 일반쓰레기는 종량제봉투에 넣어주세요.', 'ko', '쓰레기는 어디에 버려?'),
    '음식물 쓰레기는 전용 통에, 일반 쓰레기는 종량제 봉투에 넣어 주세요.'
  );
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
  const vm = require('node:vm');
  const browser = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'chat-fallback.js'), 'utf8'), browser);
  assert.match(html, /src="assets\/chat-fallback.js"/);
  assert.match(html, /ExtayChatFallback.answer\(question,currentLang\)/);
  assert.doesNotMatch(html, /const extayGuideAnswers=/);
  for (const question of ['와이파이 비밀번호', '체크인 전 짐 보관', '숙소 CCTV', '체크아웃', '세탁기', '쓰레기', 'Can I leave luggage?', 'チェックアウト', '监控摄像头']) {
    assert.equal(browser.ExtayChatFallback.answer(question), localAnswer(question));
  }
  assert.match(browser.ExtayChatFallback.answer('심야버스가 있나요?'), /공개 웹 검색을 연결할 수 없어요/);
  assert.match(html, /white-space:pre-wrap;overflow-wrap:anywhere;word-break:keep-all;text-align:left/);
});
