const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=require('../data/guide-knowledge.json');
const u=require('../lib/guest-understanding')();
const c=require('../lib/property-concierge')(guide,u,require('../lib/guest-fallback')(guide));
const handler=require('../api/chat');
const browser={};vm.runInNewContext(fs.readFileSync(require.resolve('../assets/chat-fallback.js'),'utf8'),browser);
const questions=[['ko','여분 수건 어디있나요','2번 방'],['ko','수건 어디','2번 방'],['ko','비품 위치 알려줘','2번 방'],['en','Where are extra towels?','Room 2'],['en','Where are supplies?','Room 2'],['ja','予備のタオルはどこですか？','2番の部屋'],['ja','備品はどこにありますか？','2番の部屋'],['zh','备用毛巾在哪里？','2号房间'],['zh','用品在哪儿？','2号房间'],['zh-TW','備用毛巾在哪裡？','2 號房間'],['zh-TW','備品在哪裡？','2 號房間']];
for(const [lang,q,room] of questions)test(`verified supply location keeps room and cabinet distinct: ${q}`,async()=>{
 const direct=c.direct(q,lang);assert.ok(direct);assert.ok(direct.answer.includes(room));assert.match(direct.answer,/007/);
 assert.doesNotMatch(direct.answer,/2\s*(?:號|号)\s*(?:櫃|柜|置物|储物)|(?:cabinet|locker)\s*2|2番の(?:棚|ロッカー)|2번\s*보관함/i);
 assert.deepEqual(direct.links.map(l=>l.route),['appliances']);
 assert.equal(browser.ExtayChatFallback.answer(q,lang),direct.answer);
 const savedFetch=global.fetch;global.fetch=()=>{throw new Error('verified supply location must not call provider');};
 try {let payload;const res={setHeader(){},status(){return this;},json(p){payload=p;}};
 await handler({method:'POST',body:{message:q,language:lang}},res);
 assert.equal(payload.model,'verified-guide');assert.equal(payload.answer,direct.answer);assert.equal(payload.knowledge_version,guide.source.version);
 } finally {global.fetch=savedFetch;}
});
for(const [lang,q] of [['ko','여분 수건 어디고 사용한 수건은 어디 둬요?'],['ko','비품 말고 세제 있나요?'],['en','Where are extra towels and can I check in early?'],['ja','使用済みタオルはどこに置けばいい？'],['zh','备用毛巾在哪里，洗衣液收费吗？'],['zh-TW','備用毛巾在哪裡？2 號房間打不開，密碼是什麼？']])test(`nuanced supply request is not replaced by location-only fast path: ${q}`,()=>{
 const direct=c.direct(q,lang);assert.ok(!direct||!/007/.test(direct.answer));
});
test('structured entity and prompt preserve source meaning without granting room access',()=>{
 const alternate=guide.appliances.supplyCabinet.alternateAccess;
 assert.equal(alternate.entityType,'room');assert.equal(alternate.roomNumber,2);
 assert.equal(Object.keys(alternate.roomLabels).length,5);
 const prompt=fs.readFileSync(require.resolve('../data/chatbot-system-prompt.txt'),'utf8');
 assert.match(prompt,/never a cabinet, drawer or locker number/);assert.match(prompt,/equate 007 with its door code/);
});
