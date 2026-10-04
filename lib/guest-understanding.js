// Property-neutral question understanding. No hotel policies, addresses or codes here.
// Self-contained because the same function is bundled for network-error handling.
module.exports = function createGuestUnderstanding() {
  const definitions = [
    ['early_checkin','checkin',/얼리|일찍.*(?:체크|입실)|(?:체크인|입실).*일찍|early.*check|check.*early|アーリー|早め.*(?:チェック|入)|提前入住|提早入住/i],
    ['late_checkout','checkin',/레이트|늦.*퇴실|퇴실.*늦|체크아웃.*연장|late.*check.?out|延長|レイト|延迟退房|延遲退房|延後退房/i],
    ['luggage','checkin',/짐|캐리어|가방.*(?:맡|두|보관)|luggage|baggage|suitcase|(?:leave|store|keep|drop).*bags?\b|^bags?$|荷物|スーツケース|行李|寄存|寄放/i],
    ['locker','checkin',/코인락커|코인라커|물품보관함|또타라커|\blockers?\b|ロッカー|储物柜|儲物櫃/i],
    ['access','checkin',/(?:카드|객실|룸|방|출입|현관).*키|열쇠|도어락|문.*(?:안열|안 열|잠|못)|비밀.*(?:문|현관)|(?:room|card|door)\s*keys?|key\s*cards?|lost.*key|left.*key|locked\s*out|door\s*(?:code|lock)|lockout|カードキー|ルームキー|鍵|暗証番号|房卡|房门|房門|门锁|門鎖|钥匙|鑰匙/i],
    ['checkin_time','checkin',/(?:체크인|입실|입장).*(?:시간|몇시|몇 시|언제)|(?:몇시|몇 시|언제).*(?:체크인|입실)|check.?in.*(?:time|when)|(?:when|what time).*check.?in|チェックイン.*(?:時間|何時)|入住.*(?:时间|時間|几点|幾點)/i],
    ['checkin_method','checkin',/체크인|체크 인|체크잉|첵인|입실|check[\s-]?in|チェックイン|入住/i],
    ['checkout_time','checkin',/체크아웃|체크 아웃|첵아웃|퇴실|check[\s-]?out|チェックアウト|退房/i],
    ['wifi','wifi',/와이파이|와파|인터넷|wi[\s-]?fi|internet|ネット|无线|無線|網路|网络/i],
    ['detergent','laundry',/세제|유연제|detergent|softener|洗剤|柔軟剤|洗衣液|洗衣粉|柔顺剂|柔順劑/i],
    ['towel','appliances',/수건|타올|타월|towels?|タオル|毛巾/i],
    ['toothbrush','rules',/칫솔|치약|toothbrush|toothpaste|歯ブラシ|歯磨き|牙刷|牙膏/i],
    ['supplies','appliances',/비품|어메니티|휴지|쓰레기봉투|supplies|amenities|cabinet|備品|アメニティ|トイレットペーパー|用品|備品櫃|纸巾|紙巾/i],
    ['washer','laundry',/세탁기|washer|washing\s*machine|洗濯機|洗衣机|洗衣機/i],
    ['hair_dryer','appliances',/드라이기|헤어드라이어|hair\s*dryer|ドライヤー|吹风机|吹風機/i],
    ['hair_straightener','appliances',/고데기|hair\s*straightener|curling\s*iron|ヘアアイロン|卷发棒|捲髮棒|直发器|直髮器/i],
    ['dryer','laundry',/건조기|dryer|乾燥機|烘干机|烘乾機/i],
    ['laundry','laundry',/세탁|빨래|laundry|洗濯|洗衣/i],
    ['trash','trash',/쓰레기|분리수거|재활용|음식물|trash|garbage|recycl|food waste|ゴミ|ごみ|垃圾|回收|厨余|廚餘/i],
    ['heat','appliances',/온수|난방|보일러|뜨거운물|hot water|heat|boiler|給湯|お湯|暖房|热水|熱水|供暖/i],
    ['tv','appliances',/\btv\b|티비|텔레비전|넷플릭스|ott|netflix|remote|テレビ|リモコン|电视|電視|遥控|遙控/i],
    ['rooftop','appliances',/옥상|루프탑|rooftop|roof terrace|屋上|屋顶|屋頂|天台/i],
    ['restroom','appliances',/화장실|변기|bathroom|restroom|toilet|トイレ|洗手间|洗手間|卫生间|衛生間|马桶|馬桶/i],
    ['parking','transport',/주차|parking|駐車|停车|停車/i],
    ['transport','transport',/공항|인천|김포|공항철도|심야|리무진|airport|incheon|gimpo|arex|limousine|空港|仁川|金浦|机场|機場/i],
    ['directions','checkin',/오는길|오는 길|오시는|숙소.*위치|주소|입구|녹사평|역.*출구|address|directions|noksapyeong|entrance|station.*exit|exit.*station|アクセス|住所|入口|駅.*出口|地址|怎么走|怎麼走|站.*出口/i],
    ['restaurants','restaurants',/맛집|식당|카페|브런치|restaurant|cafe|brunch|グルメ|レストラン|カフェ|美食|餐厅|餐廳|咖啡/i],
    ['tours','tours',/관광|투어|명소|남산|이태원|tour|attraction|sightseeing|namsan|itaewon|観光|景点|景點/i],
    ['contact','home',/연락|호스트|전화|카카오|카톡|contact|host|phone|kakao|連絡|電話|房东|房東|联系|聯絡/i],
    ['gallery','gallery',/침실|침대|객실|갤러리|bedroom|bed count|gallery|寝室|ベッド|卧室|臥室|床位/i],
    ['rules','rules',/규칙|금연|흡연|반려|방문자|취사|촬영|소음|rules?|smok|pets?|visitors?|cooking|filming|noise|喫煙|ペット|騒音|吸烟|吸煙|宠物|寵物|噪音/i],
    ['guidebook','guidebook',/가이드북|설명서|pdf|guidebook|manual|ガイドブック|指南书|指南書/i]
  ];
  function language(question, preferred='ko') {
    const q=String(question||'');
    if (/[가-힣]/.test(q)) return 'ko';
    if (/[\u3040-\u30ff]/.test(q)) return 'ja';
    if (/荷物|暗証番号|給湯|^(?:鍵|備品|駐車)[?？]*$/.test(q) && !/[请請吗嗎这這]/.test(q)) return 'ja';
    if (/[\u3400-\u9fff]/.test(q)) return preferred==='zh-TW'||/[體臺訊聯絡網頁覽門樓間裡這麼為與從碼]/.test(q)?'zh-TW':'zh';
    if (/^(?:wi[ -]?fi|tv|ott|arex|pdf)\s*[?？!！.]*$/i.test(q.trim())) return preferred;
    if (/[a-z]/i.test(q)) return 'en';
    return ['ko','en','ja','zh','zh-TW'].includes(preferred)?preferred:'ko';
  }
  function analyze(question, history=[]) {
    const q=String(question||'').normalize('NFKC').trim();
    const followup=/^(?:네|예|응|알려\s*주세요|알려줘|어디(?:야|에요|인가요)?|비번|비밀번호|몇\s*시|그거|그건|거기|yes|please|where|what time|tell me|それ|どこ|教えて|はい|在哪|哪里|哪裡|好的|請說|请说)[?？!！.\s]*$/i.test(q);
    const prior=followup?(history||[]).filter(m=>m?.role==='user'&&typeof m.content==='string').at(-1)?.content:'';
    const effective=prior?`${prior}\n후속 질문 / follow-up: ${q}`:q;
    let intents=definitions.filter(([, ,pattern])=>pattern.test(effective));
    const ids=intents.map(x=>x[0]);
    if (ids.some(id=>['early_checkin','checkin_time','access'].includes(id))) intents=intents.filter(x=>x[0]!=='checkin_method');
    if(ids.includes('late_checkout')) intents=intents.filter(x=>x[0]!=='checkout_time');
    if(ids.some(id=>['washer','dryer','detergent'].includes(id))) intents=intents.filter(x=>x[0]!=='laundry');
    if(ids.includes('hair_dryer'))intents=intents.filter(x=>x[0]!=='dryer');
    if(ids.includes('transport')) intents=intents.filter(x=>!['directions','tours'].includes(x[0]));
    const outbound=/(?:숙소|여기|호텔).*(?:공항|인천|김포).*(?:가|출발)|(?:공항|인천|김포)(?:으로|까지|에)\s*가|to\s+(?:incheon|gimpo|(?:the\s+)?airport)|(?:仁川|金浦|空港).*行き|(?:去|到|前往).*(?:机场|機場)/i.test(effective);
    const inbound=/(?:공항|인천|김포)에서|from\s+(?:incheon|gimpo|(?:the\s+)?airport)|空港から|从.*机场|從.*機場/i.test(effective);
    return {question:q,effective,followup:!!prior,intents:intents.map(x=>x[0]),routes:[...new Set(intents.map(x=>x[1]))],direction:outbound?'property_to_airport':inbound?'airport_to_property':'unspecified'};
  }
  return {analyze,language};
};
