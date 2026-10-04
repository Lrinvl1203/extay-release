const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=require('../data/guide-knowledge.json');
const u=require('../lib/guest-understanding')();
const c=require('../lib/property-concierge')(guide,u,require('../lib/guest-fallback')(guide));
const handler=require('../api/chat');
const browser={};vm.runInNewContext(fs.readFileSync(require.resolve('../assets/chat-fallback.js'),'utf8'),browser);
const emergencies=[
 ['ko','세탁기에서 연기나고 불났어요'],['ko','건조기에서 연기 나요'],['ko','난방기에서 가스 냄새나요'],['ko','TV 만지다 감전됐어요'],['ko','세탁기에서 타는 냄새나요'],
 ['en','The washer is on fire, what should I do?'],['en','Smoke is coming from the dryer'],['en','I smell a gas leak near the boiler'],['en','There is a burning smell from the washer'],
 ['ja','洗濯機で火災が起きています'],['ja','乾燥機から煙が出ています'],['ja','給湯器からガス漏れしています'],['ja','洗濯機が焦げ臭い'],
 ['zh','洗衣机起火了，怎么办'],['zh','烘干机冒烟了'],['zh','热水器漏气了'],['zh','洗衣机有烧焦的味道'],
 ['zh-TW','洗衣機著火了，怎麼辦'],['zh-TW','烘乾機冒煙了'],['zh-TW','熱水器漏氣了'],['zh-TW','洗衣機有燒焦的味道']
];
for(const [lang,q] of emergencies)test(`danger always precedes appliance instructions: ${q}`,()=>{
 const direct=c.direct(q,lang);assert.ok(direct);assert.match(direct.answer,/119/);assert.deepEqual(direct.links,[]);
 assert.doesNotMatch(direct.answer,/코스 선택|Start\/Pause|開始\/一時停止|选择程序|選擇程序/);
 assert.equal(browser.ExtayChatFallback.answer(q,lang),direct.answer);
});
for(const q of ['세탁기 사용법','불이 안 켜져요','온수 어떻게 켜','Do you have a Fire TV stick?','Is the property smoke free?','Where is the smoke detector?'])test(`ordinary topic is not an emergency: ${q}`,()=>assert.equal(u.emergency(q),false));
const contrasts=[['ko','짐말고 와이파이 비번 알려줘'],['en','Not luggage but Wi-Fi password please'],['ja','荷物ではなくWi-Fiのパスワード'],['zh','不是行李而是Wi-Fi密码'],['zh-TW','不是行李而是Wi-Fi密碼']];
for(const [lang,q] of contrasts)test(`rejected topic never wins: ${q}`,()=>{
 const a=c.fallback(q,lang);assert.match(a.answer,new RegExp(guide.wifi.ssid.replace('+','\\+')));assert.match(a.answer,/8H3#22E97B/);
 assert.deepEqual(a.links.map(l=>l.route),['wifi']);assert.doesNotMatch(a.answer,/locker|락커|ロッカー|置物櫃|储物柜/);
 assert.equal(browser.ExtayChatFallback.answer(q,lang),a.answer);
});
for(const q of ['김포공항 가는법','인천공항 가려면','숙소에서 김포공항 가는법','to Gimpo Airport','空港行き','去机场','前往機場'])test(`outbound remains outbound on error: ${q}`,()=>{
 assert.equal(u.analyze(q).direction,'property_to_airport');assert.match(c.answer(q),/녹사평|Noksapyeong|緑莎坪|绿莎坪|綠莎坪/);
 assert.doesNotMatch(c.answer(q),/공항에서 공항철도 → 공덕/);
});
for(const [lang,q] of [['ko','경복궁역 5번 출구에서 경복궁 입구 어떻게가요'],['en','Seoul Station exit to the museum?'],['ja','景福宮駅から入口への行き方'],['zh','景福宫站出口怎么走'],['zh-TW','景福宮站出口怎麼走']])test(`unknown external route is not replaced by hotel arrival: ${q}`,()=>{
 const a=c.fallback(q,lang);assert.doesNotMatch(a.answer,/신흥로|녹사평|Noksapyeong|緑莎坪|绿莎坪|綠莎坪/);assert.deepEqual(a.links,[]);
});
for(const [lang,q] of [['ko','침실 몇개야'],['en','How many bedrooms?'],['ja','寝室はいくつ？'],['zh','有几个卧室'],['zh-TW','有幾間臥室']])test(`confirmed bedroom count survives errors: ${q}`,()=>{
 const a=c.answer(q,lang);assert.match(a,/3/);assert.equal(browser.ExtayChatFallback.answer(q,lang),a);
});
test('degraded multi-topic question retains both verified facts',()=>{
 const a=c.answer('짐 맡겨도돼요 그리고 와이파이 비번은?');assert.match(a,/짐 보관은 불가/);assert.match(a,/8H3#22E97B/);
});
test('danger follow-up retains its immediate original context',()=>{
 const history=[{role:'user',content:'세탁기에서 연기 나요'}];assert.match(c.answer('어떻게 해요','ko',history),/119/);
});
test('API emergency guard works before missing-key or upstream calls',async()=>{
 const savedKey=process.env.OPENAI_API_KEY,savedFetch=global.fetch;delete process.env.OPENAI_API_KEY;
 global.fetch=()=>{throw new Error('must not call provider for emergency');};
 try{let payload;const res={setHeader(){},status(){return this;},json(p){payload=p;}};
 await handler({method:'POST',body:{message:'세탁기에서 연기 나요',language:'ko'}},res);
 assert.equal(payload.model,'verified-guide');assert.match(payload.answer,/119/);assert.deepEqual(payload.links,[]);
 }finally{global.fetch=savedFetch;if(savedKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=savedKey;}
});
test('extra supplies are actually visible in the target page, not just chatbot data',()=>{
 const page=require('../data/guide-pages.json').pages.find(p=>p.route==='appliances');assert.match(page.text,/여분 수건/);assert.match(page.text,/007/);assert.match(page.text,/인덕션 아래/);
 const html=fs.readFileSync(require.resolve('../guide-extay.html'),'utf8');assert.doesNotMatch(html,/010-000-0000|sExtayTemp|CONTACT_DETAILS|id="contactModal"/);
 assert.match(html,/Extra towels & supplies/);assert.match(html,/予備のタオル・備品/);assert.match(html,/备用毛巾与用品/);assert.match(html,/備用毛巾與用品/);
 assert.match(html,/const local=window\.ExtayChatFallback\.fallback/);
});
