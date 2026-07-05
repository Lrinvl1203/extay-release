const fs = require('fs');
const path = require('path');

function readGuideKnowledge() {
  const candidates = [
    path.join(process.cwd(), 'data', 'guide-knowledge.json'),
    path.join(__dirname, '..', 'data', 'guide-knowledge.json')
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (_) {}
  }
  return null;
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

const LOCAL_ANSWERS = [
  {
    keys: ['wifi', 'wi-fi', '와이파이', '无线', '無線'],
    ko: '와이파이 ID는 `U+Net46F0_5G`, 비밀번호는 `8H3#22E97B` 입니다. 대소문자와 특수문자를 그대로 입력해 주세요.',
    en: 'The Wi-Fi ID is `U+Net46F0_5G` and the password is `8H3#22E97B`. Please enter uppercase/lowercase letters and symbols exactly as shown.',
    ja: 'Wi-Fi IDは `U+Net46F0_5G`、パスワードは `8H3#22E97B` です。大文字・小文字・記号をそのまま入力してください。',
    zh: 'Wi-Fi 名称是 `U+Net46F0_5G`，密码是 `8H3#22E97B`。请按显示内容准确输入大小写和符号。'
  },
  {
    keys: ['check-in', 'checkin', 'check in', 'arrival', 'door code', 'door lock', '체크인', '입실', '도어락', '키번호'],
    ko: '체크인은 오후 4시부터입니다. 비대면 셀프 체크인이며 개인 키번호는 체크인 당일 12시쯤 Airbnb/호스트 메시지로 안내됩니다. 키패드를 살짝 터치한 뒤 안내받은 번호와 * 버튼을 누르면 됩니다.',
    en: 'Check-in starts at 16:00. This is self check-in. Your personal door code is sent through Airbnb/host messages around noon on check-in day. Touch the keypad, then enter the code you received followed by the * button.'
  },
  {
    keys: ['checkout', 'check-out', 'check out', 'leave', '체크아웃', '퇴실'],
    ko: '체크아웃은 오전 11시입니다. 퇴실 전 설거지, 쓰레기 분리수거, 거실과 침실 에어컨 끄기, 창문 닫기, 현관문 닫기를 확인해 주세요. 체크아웃 시간을 10분 초과하면 10분당 10,000원의 비용이 발생할 수 있습니다.',
    en: 'Checkout is at 11:00. Before leaving, please wash dishes, sort trash, turn off the living room and bedroom AC, close the windows, and make sure the front door is closed. A late checkout fee may apply after a 10-minute grace period.'
  },
  {
    keys: ['address', 'location', 'directions', 'noksapyeong', 'haebangchon', '주소', '위치', '오는 길', '오시는 길', '녹사평', '해방촌'],
    ko: '숙소는 서울시 용산구 신흥로 59, 2층입니다. 녹사평역 2번 출구에서 도보 약 15분, 마을버스 이용 시 약 10분입니다. 세븐일레븐과 베제투스 레스토랑 사이 골목으로 들어와 2층으로 올라오세요.',
    en: 'The stay is on the 2nd floor, 59 Sinheung-ro, Yongsan-gu, Seoul. It is about 15 minutes on foot from Noksapyeong Station Exit 2, or about 10 minutes by village bus. Enter the alley between Seven Eleven and Vegetus restaurant, then go up to the 2nd floor.'
  },
  {
    keys: ['parking', 'car', '주차', '차'],
    ko: '건물 주차는 불가합니다. 모두의주차장 앱에서 실시간 주차 가능 여부를 확인하거나 용산2가동 기계식 공용주차장, 용산2가 주민센터 공용주차장, 해방촌공영주차장 같은 주변 유료 공영주차장을 이용해 주세요.',
    en: 'There is no on-site parking. Please check real-time availability with the Modu Parking app or use nearby paid public parking such as Yongsan 2-ga mechanical public parking, Yongsan 2-ga Community Center public parking, or Haebangchon public parking.'
  },
  {
    keys: ['rule', 'rules', 'smoking', 'pet', 'visitor', 'noise', 'quiet', 'cooking', 'filming', '규칙', '금연', '흡연', '반려동물', '방문자', '소음', '매너타임', '취사', '촬영'],
    ko: '예약 인원 외 방문자 입실, 반려동물 동반, 상업적 촬영은 불가합니다. 객실, 화장실, 베란다, 현관입구, 계단은 모두 금연 구역입니다. 실내에서는 간단한 취사만 가능하며 냄새나 연기가 많은 음식은 피해주세요. 21시 이후에는 매너타임입니다.',
    en: 'Extra visitors, pets, and commercial filming are not allowed. The room, bathroom, balcony, entrance, and stairs are all non-smoking areas. Please keep indoor cooking simple and avoid food with strong smoke or odor. Quiet hours start after 21:00.'
  },
  {
    keys: ['tv', 'television', 'ott', 'netflix', 'youtube', 'nsm', '티비', '텔레비전', '넷플릭스', '유튜브', 'テレビ', '電視', '电视'],
    ko: 'TV 리모컨은 외부입력 선택이 필요할 때 사용하고, OTT 전용 리모컨에서 원하는 OTT를 선택한 뒤 확인 버튼을 누르세요. 팝업이 뜨면 바로 실행을 선택하면 됩니다.',
    en: 'Use the TV remote when selecting an external input. On the OTT remote, choose the OTT service you want and press confirm. If a pop-up appears, select run now.',
    ja: '外部入力を選ぶときはTVリモコンを使います。OTT専用リモコンで見たいOTTを選び、確認ボタンを押してください。ポップアップが出たら「すぐ実行」を選びます。',
    zh: '需要选择外部输入时请使用电视遥控器。用 OTT 专用遥控器选择想看的 OTT 后按确认。弹窗出现时请选择立即运行。'
  },
  {
    keys: ['boiler', 'heating', 'hot water', '난방', '온수', '보일러', '暖房', 'お湯', '熱水', '热水', '暖气'],
    ko: '거실 스탠드 에어컨 뒤쪽의 Rinnai 조절기에서 온수 버튼을 누르세요. 화면에 60도가 표시되면 온수가 정상 작동합니다.',
    en: 'Use the Rinnai controller behind the standing AC in the living room. Press the hot-water button. If 60 degrees appears on the screen, hot water is working normally.',
    ja: 'リビングのスタンドエアコン後ろにあるRinnaiコントローラーで、お湯ボタンを押してください。画面に60度が表示されれば正常に作動しています。',
    zh: '请使用客厅立式空调后方的 Rinnai 控制器，按热水按钮。屏幕显示 60 度时，热水正常工作。'
  },
  {
    keys: ['supplies', 'cabinet', 'towel', 'toilet paper', 'trash bag', '비품', '보관함', '수건', '휴지', '쓰레기 봉투', '備品', 'タオル', '用品', '毛巾'],
    ko: '수건, 휴지, 쓰레기 봉투 등 여분 비품은 비밀 보관함에 있습니다. 비밀번호는 007입니다. 2번 방이 열리지 않으면 싱크대 인덕션 아래도 확인해 주세요.',
    en: 'Extra towels, toilet paper, trash bags, and supplies are in the secret supply cabinet. The password is 007. If room 2 does not open, also check under the induction cooktop.',
    ja: 'タオル、トイレットペーパー、ゴミ袋などの予備備品は秘密の備品棚にあります。暗証番号は007です。2番の部屋が開かない場合は、シンク横のIH下も確認してください。',
    zh: '备用毛巾、卫生纸、垃圾袋等在秘密备品柜里。密码是 007。如果 2 号房打不开，也请查看电磁炉下方。'
  },
  {
    keys: ['washer', 'washing', 'laundry', 'detergent', '세탁', '세탁기', '세제', '빨래', '洗濯', '洗剤', '洗衣', '洗衣机', '洗衣機'],
    ko: '세탁기는 전원 버튼을 누르고 코스를 선택한 뒤 시작/일시정지를 누르세요. 건조기는 전원과 건조 코스를 선택한 뒤 시작 버튼을 누르면 됩니다. 밤에는 진동과 소음에 유의해 주세요.',
    en: 'Turn on the washer, choose a course, and press start/pause. For the dryer, turn it on, choose a drying course, and press start. At night, please be mindful of vibration and noise.',
    ja: '洗濯機は電源を入れてコースを選び、開始/一時停止を押してください。乾燥機は電源を入れ、乾燥コースを選んで開始します。夜は振動と騒音にご注意ください。',
    zh: '洗衣机请打开电源、选择程序后按开始/暂停。烘干机请打开电源、选择烘干程序后按开始。夜间请注意震动和噪音。'
  },
  {
    keys: ['restroom', 'toilet', 'bathroom', '7003', '화장실', '공용 화장실', '비밀 화장실', 'トイレ', '洗手间', '卫生间'],
    ko: '일행이 많아 화장실이 부족할 때는 1층 레스토랑 뒷편 공용 화장실을 이용할 수 있습니다. 비밀번호는 *7003* 입니다.',
    en: 'If your group needs another restroom, use the shared restroom behind the 1st-floor restaurant. The password is *7003*.',
    ja: '人数が多くトイレが足りない場合は、1階レストラン裏の共用トイレを利用できます。暗証番号は *7003* です。',
    zh: '同行人数较多、卫生间不够用时，可以使用 1 楼餐厅后方的公共卫生间。密码是 *7003*。'
  },
  {
    keys: ['trash', 'garbage', 'recycling', 'food waste', '쓰레기', '재활용', '음식물', 'ゴミ', 'ごみ', 'リサイクル', '垃圾', '回收', '廚餘', '厨余'],
    ko: '음식물 쓰레기는 부엌 싱크대 위 음식물 쓰레기통에 버려 주세요. 일반 쓰레기 및 재활용은 모두 베란다에 비치된 쓰레기통에 넣어주세요. 장기 숙박 중 음식물 냄새가 나면 1층 입구 주황색 통을 이용해 주세요.',
    en: 'Put food waste in the food-waste bin above the kitchen sink. Put both general trash and recycling into the trash bins placed on the balcony. For longer stays, use the orange bin near the 1st-floor entrance if food waste starts to smell.',
    ja: '食品ゴミはキッチンシンク上の食品ゴミ箱に入れてください。一般ゴミとリサイクル品はどちらもバルコニーに置かれたゴミ箱に入れてください。長期滞在で食品ゴミの臭いが気になる場合は、1階入口のオレンジ色の箱をご利用ください。',
    zh: '厨余垃圾请放入厨房水槽上方的厨余桶。一般垃圾和可回收物都请放入阳台上的垃圾桶。长住时如厨余有异味，请使用 1 楼入口附近的橙色桶。'
  }
];

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
  const q = String(question || '').toLowerCase();
  const lang = detectQuestionLanguage(question);
  const hit = LOCAL_ANSWERS.find(item => item.keys.some(key => q.includes(key.toLowerCase())));
  if (hit) return hit[lang] || hit.en || hit.ko;
  return {
    ko: '와이파이, 체크인·체크아웃, 위치, 주차, 숙소 규칙, TV·OTT, 온수·난방, 비품 보관함, 세탁기·건조기, 공용 화장실, 옥상, 쓰레기 배출 방법을 확인할 수 있습니다. 개인 도어락 키번호나 긴급 상황은 Airbnb/호스트 메시지를 확인해 주세요.',
    en: 'I can help with Wi-Fi, check-in/out, location, parking, house rules, TV/OTT, hot water and heating, supply cabinet, washer/dryer, shared restroom, rooftop, and trash disposal. For your personal door code or urgent issues, please check Airbnb/host messages.',
    ja: 'Wi-Fi、TV/OTT、お湯・暖房、備品棚、洗濯機・乾燥機、共用トイレ、屋上、ゴミの出し方をご案内できます。予約、ドアロック、緊急時はホストに直接ご確認ください。',
    zh: '我可以帮助查询 Wi-Fi、TV/OTT、热水/暖气、备品柜、洗衣机/烘干机、公共卫生间、屋顶和垃圾处理方法。关于预订、门锁或紧急情况，请直接联系房东确认。'
  }[lang];
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
    const targetLanguage = languageName(targetLanguageCode);

    const guide = readGuideKnowledge();
    const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
    const system = `You are the AI guest-communication manager and premium hotel concierge for 익스테이 맨션 해방촌 (Extay Mansion Haebangchon), an Airbnb property. Your goal is not just to answer questions, but to make guests feel "this place has outstanding service."

CORE RULES:
1. Answer in TARGET_LANGUAGE, based only on the latest guest question. Do not copy the language of GUIDE_KNOWLEDGE or older chat history. Use natural, warm expressions in TARGET_LANGUAGE.
2. Always use GUIDE_KNOWLEDGE as the primary source. Answer directly and accurately from it first.
3. For topics NOT in GUIDE_KNOWLEDGE, actively supplement with web search, general knowledge, local info, and travel tips. When doing so, add a TARGET_LANGUAGE equivalent of: "This is not clearly covered in the guide, so additional confirmation or host confirmation may be needed."
4. Never guess door lock passwords, private access codes, or undisclosed security info. Direct the guest to check Airbnb/host messages.
5. For urgent issues (fire, flood, lockout), tell the guest to contact the host immediately.

LANGUAGE LOCK:
- TARGET_LANGUAGE is determined from the latest guest question, not from GUIDE_KNOWLEDGE.
- Translate guide facts into TARGET_LANGUAGE.
- Keep the full answer in TARGET_LANGUAGE, including headings, bullets, closing sentence, and host-confirmation notes.
- If the latest guest question mixes languages, use the dominant language; if unclear, use Korean.

RESPONSE STYLE — Guest WOW Mode:
- Never give one-line answers. Never make guests search again.
- Think like a hotel concierge + travel planner + local expert.
- Proactively include what guests will likely ask next.
- Consider: actual travel route, difficulty level, first-time visitor perspective, luggage/carrier convenience, foreign traveler tips.

TRANSPORTATION QUESTIONS — always include:
- Best recommended method / easiest / fastest / cheapest
- Estimated time and cost
- Bus number, subway line, transfers, frequency, last train warnings
- Which exit to use, walking distance, stairs/slopes, carrier convenience
- Rainy day and late-night options, taxi/app tips, transit card tips

RESTAURANT/NEARBY QUESTIONS — always include:
- Walking time, popular menu, wait time, peak hours
- Solo-dining friendly, foreigner-friendly, reservation needed, late-night hours
- Local favorite vs tourist spot, rainy-day recommendation

SMART CONCIERGE — for each question, proactively add:
- Airport → also cover check-in time, luggage storage, late-night check-in
- Restaurants → also recommend nearby cafes, dessert, convenience stores
- Transport → also cover transit card, taxi apps, translation apps

PROPERTY POLICY RULES — for these topics, NEVER guess if not in GUIDE_KNOWLEDGE:
Early check-in, late checkout, luggage storage, extra guests, pets, refunds, smoking, parties, extra bedding, parking, check-in method changes.
Instead use a TARGET_LANGUAGE equivalent of: "The host is currently checking whether this is possible, and I will provide accurate final guidance after confirmation. [Final guidance pending host confirmation]"

UNCERTAIN INFO: If info may be outdated, add a TARGET_LANGUAGE equivalent of: "This is based on the latest information currently available, and some details may vary depending on actual operating conditions."

ONE-MESSAGE COMPLETION RULE (very important):
- Aim to resolve the guest's need in 1~2 messages total.
- Do NOT end with "please let me know your departure time / carrier size" type requests.
- Instead, give a complete answer based on the most common travel scenario.
- Only ask 1 clarifying question if truly impossible to answer otherwise — put it last, keep it under 10% of the response.
- Ideal result: guest reads and thinks "OK, I got it. I can follow this right now."

ANSWER STRUCTURE:
1. Warm greeting / acknowledgment
2. Core answer to the question
3. Practical tips and proactive extras
4. Host confirmation note (if applicable)
5. Invite further questions
6. Warm closing

Format for mobile: short paragraphs, bullet points, clear action steps.`;


    const input = [
      { role: 'system', content: system },
      { role: 'user', content: `GUIDE_KNOWLEDGE:\n${JSON.stringify(guide, null, 2)}` },
      ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1200) })),
      { role: 'user', content: `TARGET_LANGUAGE: ${targetLanguage}\nLATEST_GUEST_QUESTION:\n${question}` }
    ];

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input,
        tools: [{ type: 'web_search_preview', search_context_size: 'low' }],
        tool_choice: 'auto',
        temperature: 0.2,
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('OpenAI API fallback:', response.status, data?.error?.code || data?.error?.message || 'unknown');
      return res.status(200).json({
        fallback: true,
        answer: localAnswer(question)
      });
    }

    const answer = extractText(data) || '죄송합니다. 답변을 생성하지 못했습니다. 호스트에게 확인해 주세요.';
    return res.status(200).json({ answer, model, searched: JSON.stringify(data).includes('web_search') });
  } catch (err) {
    console.warn('Chat API fallback:', err.message || String(err));
    return res.status(200).json({
      fallback: true,
      answer: localAnswer(parseBody(req).message)
    });
  }
};
