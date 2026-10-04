const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=require('../data/guide-knowledge.json');
const understanding=require('../lib/guest-understanding')();
const concierge=require('../lib/property-concierge')(guide,understanding,require('../lib/guest-fallback')(guide));
const handler=require('../api/chat');
const browser={};
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/chat-fallback.js'),'utf8'),browser);

for(const [q,language] of [['헤어드라이기 있는거 맞죠','ko'],['Is a hair dryer provided?','en'],['ドライヤーありますか？','ja'],['有吹风机吗','zh'],['有吹風機嗎','zh-TW']])test(`private amenity fallback is not a public-search error: ${language}`,()=>{
  const answer=concierge.answer(q,language);
  assert.match(answer,/Airbnb/);
  assert.doesNotMatch(answer,/공개|웹 검색|web search|公開ウェブ|公开|公開網頁|건조 코스|dryer.*Start/i);
  assert.equal(browser.ExtayChatFallback.answer(q,language),answer);
});

for(const q of ['寄放行李','行李','提前入住','入住','退房時間','Wi-Fi','用品','儲物櫃'])test(`authored Traditional Chinese fallback remains traditional: ${q}`,()=>{
  const answer=concierge.answer(q,'zh-TW');
  assert.doesNotMatch(answer,/[后柜绿电储请过场层预订门发备号现]/);
  assert.equal(browser.ExtayChatFallback.answer(q,'zh-TW'),answer);
});

for(const q of ['동대문역 6번출구 나오면 되지?','Dongdaemun Station Exit 6?','東大門駅6番出口でいい？','东大门站6号出口对吗','東大門站6號出口對嗎'])test(`station/exit question carries property directions context: ${q}`,()=>{
  assert.ok(understanding.analyze(q).routes.includes('checkin'));
  // Not a hard-coded correction for one station: the model still reads the full question.
  assert.equal(concierge.direct(q),null);
  const answer=concierge.answer(q);
  assert.doesNotMatch(answer,/동대문|Dongdaemun|東大門|东大门|503|8282/);
});

test('model directions instructions correct a false premise without overriding explicit sightseeing destinations',()=>{
  const prompt=handler._test.CHAT_SYSTEM_PROMPT;
  assert.match(prompt,/station\/exit confirmation with no other destination/);
  assert.match(prompt,/If the guest explicitly names another destination/);
  assert.match(prompt,/restriction from physical absence/);
  assert.match(prompt,/do not invent a collection basket/);
  const decoded=handler._test.decodeAnswer({output_text:JSON.stringify({answer:'공식 관광 안내를 확인해 주세요.',guideRoutes:[]})});
  assert.equal(decoded.structured,true);
  assert.deepEqual(decoded.routes,[]);
});

for(const [q,language] of [['쓴수건 다시 비품함에 넣음 돼?','ko'],['Where should I put used towels?','en'],['使ったタオルはどこに置く？','ja'],['用过的毛巾放哪','zh'],['用過的毛巾放哪','zh-TW']])test(`used towels do not receive clean-stock instructions: ${language}`,()=>{
  const answer=concierge.answer(q,language);
  assert.match(answer,/Airbnb/);
  assert.doesNotMatch(answer,/007|인덕션|induction|IH|电磁炉|電磁爐|객실 안에|collection basket/i);
});

test('luggage-room false premise is answered by the actual storage policy, not an invented room',()=>{
  assert.match(concierge.answer('짐보관실 몇 호에요? 홈페이지에 있다고 들었는데'),/짐 보관은 불가/);
  assert.doesNotMatch(concierge.answer('짐보관실 몇 호에요? 홈페이지에 있다고 들었는데'),/보관실.*없|503|8282/);
});

test('no known intent still gets a neutral confirmation message, not a fake public-search diagnosis',()=>{
  for(const [q,lang] of [['가습기 있나요','ko'],['Is a humidifier provided?','en'],['加湿器はありますか','ja'],['有加湿器吗','zh'],['有加濕器嗎','zh-TW']]){
    assert.doesNotMatch(concierge.answer(q,lang),/공개|web search|公開ウェブ|公开网页|公開網頁/i);
  }
});

test('API failure paths return safe property answers and identifiable non-sensitive reasons',async()=>{
  const saved={key:process.env.OPENAI_API_KEY,fetch:global.fetch,warn:console.warn};
  const logs=[];console.warn=(...args)=>logs.push(args.join(' '));
  const question='헤어드라이기 있는거 맞죠';
  const modes=[
    ['missing_api_key',null],
    ['upstream_error',async()=>({ok:false,status:429,json:async()=>({error:{message:'must not log this raw error'}})})],
    ['incomplete_output',async()=>({ok:true,json:async()=>({status:'incomplete'})})],
    ['empty_output',async()=>({ok:true,json:async()=>({output_text:JSON.stringify({answer:'',guideRoutes:[]})})})],
    ['timeout',async()=>{const e=new Error('private debug detail');e.name='TimeoutError';throw e;}],
    ['invalid_upstream_response',async()=>({ok:true,json:async()=>{throw new SyntaxError('private debug detail');}})],
    ['network_error',async()=>{throw new Error('private debug detail');}]
  ];
  try{
    for(const [reason,mock] of modes){
      if(mock){process.env.OPENAI_API_KEY='test-placeholder';global.fetch=mock;}else delete process.env.OPENAI_API_KEY;
      let result,code;const res={setHeader(){},status(c){code=c;return this;},json(p){result=p;return p;}};
      await handler({method:'POST',body:{message:question,language:'ko'}},res);
      assert.equal(code,200);assert.equal(result.fallback,true);assert.equal(result.fallback_reason,reason);
      assert.equal(result.searched,false);assert.equal(result.links[0].route,'appliances');
      assert.match(result.answer,/Airbnb/);assert.doesNotMatch(result.answer,/공개|웹 검색|건조 코스/);
    }
    assert.doesNotMatch(logs.join('\n'),/헤어드라이기|private debug detail|must not log|test-placeholder/);
    assert.match(logs.join('\n'),/"status":429/);
  }finally{
    global.fetch=saved.fetch;console.warn=saved.warn;
    if(saved.key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=saved.key;
  }
});
