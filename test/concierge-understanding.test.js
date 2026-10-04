const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const createUnderstanding=require('../lib/guest-understanding');
const createConcierge=require('../lib/property-concierge');
const guide=require('../data/guide-knowledge.json');
const pages=require('../data/guide-pages.json');
const u=createUnderstanding();
const c=createConcierge(guide,u,require('../lib/guest-fallback')(guide));
const handler=require('../api/chat');
const synonyms={
  luggage:['짐','캐리어 맡길수있나요','가방 좀 맡겨도돼요','짐두고나갔다와도됨?','bags','Can I leave my bags?','luggage storage','baggage','荷物','荷物を預けたい','スーツケース','行李','寄存行李','寄放行李'],
  checkin_time:['체크인시간','입실몇시','몇시에 입실해요','What time is check-in?','When can I check in?','チェックインは何時？','入住时间','入住幾點'],
  access:['객실키 분실','룸키 분실','방 열쇠 잃어버림','카드키 두고나옴','Lost room key','key card missing','locked out','カードキーをなくした','鍵を部屋に忘れた','房卡丢了','鑰匙留在房間'],
  early_checkin:['얼리체크인','일찍 입실할수있음','early check in','アーリーチェックイン','提前入住','提早入住'],
  towel:['여분수건','타월있나요','towel','タオル','毛巾'],
  detergent:['세탁세제','detergent','洗剤','洗衣液','洗衣粉'],
  dryer:['건조기 용량','dryer capacity','乾燥機','烘干机','烘乾機'],
  contact:['호스트 연락','카카오톡','host contact','ホストへの連絡','联系房东','聯絡房東']
};
for(const [intent,questions] of Object.entries(synonyms))for(const q of questions)test(`meaning: ${intent} ← ${q}`,()=>assert.ok(u.analyze(q).intents.includes(intent),JSON.stringify(u.analyze(q))));
for(const [q,lang] of [['짐','ko'],['bags','en'],['荷物','ja'],['行李','zh'],['寄放行李','zh-TW']])test(`isolated luggage fact: ${lang}`,()=>{
  const answer=c.direct(q,lang);
  assert.ok(answer);
  assert.match(answer.answer,/불가|not available|できません|不提供/);
  assert.doesNotMatch(answer.answer,/503|8282|ENT|동대문|Dongdaemun|再発行|재발급/);
  assert.equal(answer.links[0].route,'checkin');
  assert.equal(new URL(answer.links[0].url).hostname,'extay-release.vercel.app');
});
test('early arrival uses own policy and does not invent approval or prohibition',()=>{
  const a=c.direct('얼리체크인').answer;
  assert.match(a,/오후 4시/);assert.match(a,/호스트/);assert.match(a,/짐 보관은 불가/);assert.match(a,/녹사평/);
  assert.doesNotMatch(a,/얼리.*(?:불가능|제공되지|불가합니다)|503|8282/);
  assert.doesNotMatch(a,/^(네|아니오)/);
});
test('meaning hints do not override complex questions',()=>{
  for(const q of ['짐 보관 요금 얼마','짐 잃어버렸어요','짐 보관 안되면 택배로 보내주나요','체크인 시간 변경 가능','체크인시간에 직원이 와요?','체크인시간과 와이파이','건조기 용량','세탁세제 있나요'])assert.equal(c.direct(q),null,q);
});
test('follow-up is linked to recent guest topic, not matched as a new topic',()=>{
  const h=[{role:'user',content:'여분 수건 있나요?'},{role:'assistant',content:'비품 보관함에 있어요.'}];
  const a=u.analyze('비번',h);assert.equal(a.followup,true);assert.deepEqual(a.routes,['appliances']);assert.equal(c.direct('비번','ko',h),null);
  assert.deepEqual(u.analyze('알려주세요',[]).routes,[]);
});
test('airport direction is preserved across five languages',()=>{
  for(const q of ['인천공항으로 가는법','숙소에서 김포공항 가려면','to airport','How do I get to Incheon Airport?','空港行き','去机场','前往機場'])assert.equal(u.analyze(q).direction,'property_to_airport',q);
  for(const q of ['인천공항에서 숙소 가는법','from airport','空港から宿','从机场到住宿','從機場到住宿'])assert.equal(u.analyze(q).direction,'airport_to_property',q);
});
test('current website supplies all twelve pages and three bedrooms',()=>{
  assert.deepEqual(pages.pages.map(p=>p.route).sort(),guide.source.screens.slice().sort());
  assert.match(pages.pages.find(p=>p.route==='home').text,/세 개의 방|세 개의 침실/);
  assert.equal(guide.gallery.bedrooms,3);
  assert.doesNotMatch(JSON.stringify(pages),/010-000-0000|sExtayTemp|anotherhouse-guide|503호|8282/);
});
test('generic understanding module contains no hotel facts',()=>{
  assert.doesNotMatch(createUnderstanding.toString(),/8282|503|16:00|007|동대문|신흥로|어나더하우스|anotherhouse-guide/);
});
test('browser and server understanding and fallback agree',()=>{
  const browser={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/chat-fallback.js'),'utf8'),browser);
  for(const q of Object.values(synonyms).flat())assert.equal(browser.ExtayChatFallback.answer(q),c.answer(q),q);
  for(const lang of ['ko','en','ja','zh','zh-TW'])assert.equal(browser.ExtayChatFallback.answer('Wi-Fi',lang),c.answer('Wi-Fi',lang));
});
test('structured guide links only permit current EXTAY routes',()=>{
  const parsed=handler._test.decodeAnswer({output_text:JSON.stringify({answer:'침실은 세 개예요.',guideRoutes:['gallery','other-hotel','gallery']})});
  assert.equal(parsed.answer,'침실은 세 개예요.');
  assert.deepEqual(c.links(parsed.routes).map(l=>l.route),['gallery']);
  const body=handler._test.buildRequestBody('세탁세제 있나요');
  assert.equal(body.store,false);assert.equal(body.max_output_tokens,8192);
  assert.equal(body.text.format.type,'json_schema');
  assert.match(body.input[1].content,/pageSnapshot/);
});
test('ambiguous access vocabulary never grants another hotel key reissue',()=>{
  for(const q of synonyms.access){const a=c.answer(q);assert.doesNotMatch(a,/8282|503|ENT|재발급|reissu|replacement|再発行|补办|補辦/);assert.match(a,/Airbnb/);}
});
test('no API key: verified short question still works without fake external disclaimer',async()=>{
  const previous=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;
  let payload,code;const res={setHeader(){},status(c){code=c;return this},json(p){payload=p;return p}};
  try{await handler({method:'POST',body:{message:'짐'}},res);assert.equal(code,200);assert.equal(payload.model,'verified-guide');assert.equal(payload.searched,false);assert.match(payload.answer,/보관은 불가/);assert.doesNotMatch(payload.answer,/공개 웹 정보/);await handler({method:'POST',body:{message:''}},res);assert.equal(code,400);}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});
test('structured model output reaches the UI with valid links and no public disclaimer',async()=>{
  const key=process.env.OPENAI_API_KEY,fetch=global.fetch,info=console.info;process.env.OPENAI_API_KEY='test-placeholder';console.info=()=>{};
  global.fetch=async()=>({ok:true,json:async()=>({output_text:JSON.stringify({answer:'현재 안내에는 세제 비치 여부가 명시되어 있지 않아요. Airbnb로 호스트에게 확인해 주세요.',guideRoutes:['laundry']}),output:[]})});
  let payload;const res={setHeader(){},status(){return this},json(p){payload=p}};
  try{await handler({method:'POST',body:{message:'세탁세제 있나요'}},res);assert.equal(payload.links[0].route,'laundry');assert.match(payload.answer,/세제/);assert.doesNotMatch(payload.answer,/전원 버튼|공개 웹 정보|^네/);}finally{global.fetch=fetch;console.info=info;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
test('all inline browser scripts parse',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../guide-extay.html'),'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
