// EXTAY-specific presentation of EXTAY knowledge. Never imports another property.
module.exports = function createPropertyConcierge(guide, understanding, legacy) {
  const labels={
    ko:{checkin:'체크인 · 체크아웃 안내 보기',wifi:'와이파이 안내 보기',appliances:'시설 · 비품 안내 보기',laundry:'세탁 안내 보기',trash:'쓰레기 배출 안내 보기',transport:'교통 안내 보기',rules:'이용 규칙 보기',restaurants:'주변 맛집 보기',tours:'추천 투어 보기',home:'호스트 연락 안내 보기',gallery:'객실 둘러보기',guidebook:'가이드북 보기'},
    en:{checkin:'Check-in & checkout guide',wifi:'Wi-Fi guide',appliances:'Facilities & supplies',laundry:'Laundry guide',trash:'Waste disposal guide',transport:'Transport guide',rules:'House rules',restaurants:'Nearby restaurants',tours:'Nearby tours',home:'Contact your host',gallery:'Room gallery',guidebook:'Guidebook'},
    ja:{checkin:'チェックイン・チェックアウト案内',wifi:'Wi-Fi案内',appliances:'設備・備品案内',laundry:'洗濯案内',trash:'ゴミ出し案内',transport:'交通案内',rules:'利用ルール',restaurants:'周辺グルメ',tours:'周辺観光',home:'ホストへの連絡',gallery:'客室を見る',guidebook:'ガイドブック'},
    zh:{checkin:'入住与退房指南',wifi:'Wi-Fi指南',appliances:'设施与用品指南',laundry:'洗衣指南',trash:'垃圾分类指南',transport:'交通指南',rules:'住宿规则',restaurants:'周边美食',tours:'周边景点',home:'联系房东',gallery:'客房相册',guidebook:'指南书'},
    'zh-TW':{checkin:'入住與退房指南',wifi:'Wi-Fi指南',appliances:'設施與用品指南',laundry:'洗衣指南',trash:'垃圾分類指南',transport:'交通指南',rules:'住宿規則',restaurants:'周邊美食',tours:'周邊景點',home:'聯絡房東',gallery:'客房相冊',guidebook:'指南書'}
  };
  const pick=(lang,ko,en,ja,zh,tw)=>({ko,en,ja,zh,'zh-TW':tw}[lang]||ko);
  function unconfirmed(lang) {
    return pick(lang,'현재 숙소 안내에서는 이 내용을 확인할 수 없어요. Airbnb 예약 메시지로 호스트에게 확인해 주세요.', 'The current property guide does not confirm this detail. Please ask your host through Airbnb booking messages.', '現在の宿泊案内ではこの内容を確認できません。Airbnbの予約メッセージでホストに確認してください。', '当前住宿指南未确认这项信息，请通过Airbnb预订消息向房东确认。', '目前住宿指南未確認這項資訊，請透過Airbnb訂房訊息向房東確認。');
  }
  const isUsedTowel=question=>/사용한|쓴\s*수건|used|dirty|使用済|使った|用过|用過|脏|髒/i.test(question);
  function usedTowelAnswer(lang) {
    return pick(lang,'사용한 수건은 새 비품과 섞어 넣지 말아 주세요. 숙소 안내에는 사용한 수건을 둘 위치가 명시되어 있지 않으니 Airbnb 메시지로 호스트에게 확인해 주세요.', 'Please keep used towels separate from clean supplies. The guide does not state a used-towel return location; please ask your host through Airbnb.', '使用済みタオルは清潔な備品と混ぜないでください。返却場所は案内に明記されていないため、Airbnbでホストに確認してください。', '请不要把用过的毛巾和干净用品混放。指南未注明用过毛巾的放置地点，请通过Airbnb向房东确认。', '請勿將用過的毛巾與乾淨備品混放。指南未註明用過毛巾的放置地點，請透過Airbnb向房東確認。');
  }
  function luggageAnswer(lang) {
    // Direct translations avoid an incomplete character conversion table.
    if(guide.checkInOut.luggageStorage.beforeCheckIn!==false || guide.checkInOut.luggageStorage.afterCheckOut!==false) return unconfirmed(lang);
    const floor=guide.luggageLockers.floor;
    return pick(lang,`체크인 전·체크아웃 후 숙소 내 짐 보관은 불가합니다. 녹사평역 ${floor} 엘리베이터·7-ELEVEN 주변 코인락커를 이용하고, 잔여함은 또타라커 앱이나 현장에서 확인해 주세요.`, `Luggage storage at the property is not available before check-in or after checkout. Try the lockers near the ${floor} elevator and 7-ELEVEN at Noksapyeong Station; check availability in T locker or at the station.`, `チェックイン前・チェックアウト後の宿での荷物預かりはできません。緑莎坪駅${floor}のエレベーター・7-ELEVEN付近のロッカーをご利用ください。空きはT lockerまたは現地で確認してください。`, `住宿不提供入住前或退房后的行李寄存。可使用绿莎坪站${floor}电梯及7-ELEVEN附近的储物柜，空柜情况请在T locker或现场确认。`, `住宿不提供入住前或退房後的行李寄放。可使用綠莎坪站${floor}電梯及7-ELEVEN附近的置物櫃，實際空位請透過T locker或在現場確認。`);
  }
  function links(routes,lang='ko') {
    return [...new Set(routes||[])].filter(route=>guide.source.screens.includes(route)).slice(0,3).map(route=>({route,label:(labels[lang]||labels.ko)[route]||route,url:guide.property.guideUrl+'#'+route}));
  }
  function direct(question,preferred='ko',history=[],forceLanguage=false) {
    const context=understanding.analyze(question,history),lang=forceLanguage?preferred:understanding.language(question,preferred);
    const q=context.question.replace(/[\s?？!！.,。]/g,'').toLowerCase();
    const towelReturn=context.intents.includes('towel') && context.intents.every(id=>['towel','supplies'].includes(id)) && isUsedTowel(context.question) && /넣|두|놓|반납|수거|돌려|put|return|leave|collect|deposit|置|戻|返|回収|放|还|還|收/i.test(context.question) && !/말고|아니|instead|not.*(?:used|dirty)|ではなく|じゃなく|不是|而是/i.test(context.question);
    // Only fast-path known, simple facts. Nuance, multiple questions and follow-ups go to the model.
    if(context.followup||(!towelReturn&&context.intents.length!==1)||q.length>55||/변경|바꾸|승인|분실|잃어|찾아|도난|예외|요금|얼마|(?:if|but|lost|stolen|change|fee|cost)\b|紛失|料金|変更|丢|丟|遗失|遺失|费用|費用|更改/i.test(context.question)) return null;
    const id=context.intents[0],g=guide;
    let answer;
    if(towelReturn) answer=usedTowelAnswer(lang);
    if(id==='detergent' && /^(?:(?:세탁)?세제(?:가|는)?(?:있나요|있어요|있어|비치되어있나요)?|섬유유연제(?:있나요)?|(?:isthere|is|doyouhave)?(?:laundry)?detergent(?:provided|available)?|洗剤(?:は)?(?:ありますか)?|(?:有)?洗衣(?:液|粉)(?:吗|嗎)?)$/.test(q)) answer=pick(lang,'현재 숙소 안내에는 세제·섬유유연제 비치 여부가 명시되어 있지 않아요. Airbnb 메시지로 호스트에게 확인해 주세요.', 'The guide does not confirm whether detergent or fabric softener is provided. Please ask your host through Airbnb.', '洗剤・柔軟剤の備え付けは現在の案内では確認できません。Airbnbでホストに確認してください。', '当前指南未说明是否提供洗衣液或柔顺剂，请通过Airbnb向房东确认。', '目前指南未說明是否提供洗衣精或柔軟精，請透過Airbnb向房東確認。');
    if(id==='checkin_time' && /^(?:(?:체크인|입실)(?:은|이)?(?:시간|몇시|언제)(?:인가요|에요|야|부터|부터야|부터인가요|예요|해요)?|몇시(?:에)?입실(?:해요)?|(?:whattimeis|whenis|whencan(?:i)?)(?:checkin)|checkintime|チェックイン(?:は)?(?:時間|何時)|入住(?:时间|時間|几点|幾點))$/.test(q)) answer=pick(lang,`체크인은 ${g.checkInOut.checkIn}부터예요.`, `Check-in starts at ${g.checkInOut.checkIn24}.`, `チェックインは${g.checkInOut.checkIn24}からです。`, `入住时间从${g.checkInOut.checkIn24}开始。`, `入住時間從${g.checkInOut.checkIn24}開始。`);
    if(id==='early_checkin' && /^(?:얼리체크인|earlycheckin|アーリーチェックイン|提前入住|提早入住)$/.test(q)) {
      answer=pick(lang,`정규 체크인은 ${g.checkInOut.checkIn}부터예요. 얼리 체크인 가능 여부는 Airbnb 메시지로 호스트에게 확인해 주세요. 체크인 전 숙소 내 짐 보관은 불가하며, 녹사평역 코인락커를 이용할 수 있어요.`, `Regular check-in starts at ${g.checkInOut.checkIn24}. Please ask your host through Airbnb about early check-in. The property cannot store luggage before check-in; Noksapyeong Station lockers are an alternative.`, `通常のチェックインは${g.checkInOut.checkIn24}からです。早めの入室はAirbnbでホストに確認してください。宿での荷物預かりはできませんが、緑莎坪駅のロッカーを利用できます。`, `正常入住从${g.checkInOut.checkIn24}开始。提前入住请通过Airbnb向房东确认。住宿不提供入住前行李寄存，可使用绿莎坪站储物柜。`, `正常入住從${g.checkInOut.checkIn24}開始。提前入住請透過Airbnb向房東確認。住宿不提供入住前行李寄存，可使用綠莎坪站置物櫃。`);
    }
    if(id==='luggage' && /^(?:짐|짐보관|짐맡기기|캐리어|가방|캐리어보관|가방보관|(?:짐|가방|캐리어)(?:좀)?맡(?:길수있나요|겨도돼요)|bags?|luggage|baggage|suitcase|luggagestorage|(?:can|could|may)i(?:leave|store)(?:my|the)?(?:bags|luggage|baggage)|荷物|荷物預かり|スーツケース|行李|寄存行李|寄放行李)$/.test(q)) answer=luggageAnswer(lang);
    if(id==='checkout_time' && /^(?:체크아웃시간|퇴실시간|몇시퇴실|checkouttime|チェックアウト時間|退房时间|退房時間)$/.test(q)) answer=pick(lang,`체크아웃은 ${g.checkInOut.checkOut}까지예요.`, `Please check out by ${g.checkInOut.checkOut24}.`, `チェックアウトは${g.checkInOut.checkOut24}までです。`, `请在${g.checkInOut.checkOut24}前退房。`, `請在${g.checkInOut.checkOut24}前退房。`);
    if(id==='checkin_method' && /^(?:체크인|체크인방법|첵인|입실|입실방법|checkin|checkinmethod|チェックイン|入住|入住方法)$/.test(q)) answer=legacy.answer('체크인',lang,{forceLanguage:true});
    if(id==='wifi' && /^(?:와이파이|와파|와이파이비번|와이파이비밀번호|wifi|wifipassword|wifi密码|wifi密碼)$/.test(q)) answer=legacy.answer('Wi-Fi',lang,{forceLanguage:true});
    if(!answer)return null;
    return {answer,links:links(context.routes,lang),context,language:lang};
  }
  function answer(question,preferred='ko',history=[]) {
    const exact=direct(question,preferred,history);if(exact)return exact.answer;
    const context=understanding.analyze(question,history),lang=understanding.language(question,preferred);
    const id=context.intents[0],g=guide;
    if(id==='luggage')return luggageAnswer(lang);
    if(['hair_dryer','hair_straightener'].includes(id))return unconfirmed(lang);
    if(id==='contact')return pick(lang,'호스트에게는 Airbnb 예약 메시지로 연락해 주세요. 공개 전화번호나 카카오톡 링크는 제공되지 않습니다.', 'Please contact your host through Airbnb booking messages. A public phone number or KakaoTalk link is not provided.', 'Airbnbの予約メッセージでホストに連絡してください。公開の電話番号やKakaoTalkリンクはありません。', '请通过Airbnb预订消息联系房东，未提供公开电话号码或KakaoTalk链接。', '請透過Airbnb訂房訊息聯絡房東，未提供公開電話號碼或KakaoTalk連結。');
    if(id==='towel' && isUsedTowel(context.effective))return usedTowelAnswer(lang);
    if(id==='early_checkin')return direct('얼리체크인',lang,[],true)?.answer;
    if(id==='detergent')return pick(lang,'현재 숙소 안내에는 세제·섬유유연제 비치 여부가 명시되어 있지 않아요. Airbnb 메시지로 호스트에게 확인해 주세요.', 'The guide does not confirm whether detergent or fabric softener is provided. Please ask your host through Airbnb.', '洗剤・柔軟剤の備え付けは現在の案内では確認できません。Airbnbでホストに確認してください。', '当前指南未说明是否提供洗衣液或柔顺剂，请通过Airbnb向房东确认。', '目前指南未說明是否提供洗衣精或柔軟精，請透過Airbnb向房東確認。');
    if(['washer','dryer'].includes(id)&&/용량|容量|capacity|kg|킬로/i.test(question))return pick(lang,'현재 숙소 안내에는 해당 기기의 용량이 명시되어 있지 않아요. Airbnb 메시지로 호스트에게 확인해 주세요.', 'The current guide does not state this appliance’s capacity. Please confirm with your host through Airbnb.', 'この機器の容量は現在の案内に明記されていません。Airbnbでホストに確認してください。', '当前指南未注明该设备的容量，请通过Airbnb向房东确认。', '目前指南未註明此設備的容量，請透過Airbnb向房東確認。');
    if(id==='towel')return pick(lang,`여분 수건은 비품 보관함에 있어요. 보관함 비밀번호는 ${g.appliances.supplyCabinet.password}입니다. 2번 방이 열리지 않으면 싱크대 인덕션 아래도 확인해 주세요.`, `Extra towels are in the supply cabinet, code ${g.appliances.supplyCabinet.password}. If Room 2 does not open, also check under the induction cooktop.`, `予備のタオルは備品棚にあります。暗証番号は${g.appliances.supplyCabinet.password}です。2番の部屋が開かない場合はIH下も確認してください。`, `备用毛巾在备品柜，密码为${g.appliances.supplyCabinet.password}。2号房打不开时也请查看电磁炉下方。`, `備用毛巾在備品櫃，密碼為${g.appliances.supplyCabinet.password}。2號房打不開時也請查看電磁爐下方。`);
    if(id==='access') return pick(lang,`숙소는 개인 도어락 번호로 셀프 체크인해요. 번호는 체크인 당일 12시쯤 Airbnb 메시지로 전달됩니다. 키패드를 터치하고 받은 번호 뒤에 *를 눌러 주세요. 번호를 받지 못했거나 문이 열리지 않으면 Airbnb로 호스트에게 연락해 주세요.`, 'Entry uses your personal door code, sent via Airbnb around noon on check-in day. Touch the keypad, enter that code, then press *. If you cannot find the code or open the door, contact your host through Airbnb.', '入室は個人用の暗証番号を使います。当日正午ごろAirbnbで届きます。キーパッドに触れ、受け取った番号の後に*を押してください。番号が届かない、または開かない場合はAirbnbでホストに連絡してください。', '住宿使用个人门锁密码，当天中午12点左右通过Airbnb发送。轻触键盘，输入收到的密码后按*。没有收到密码或无法开门时，请通过Airbnb联系房东。', '住宿使用個人門鎖密碼，當天中午12點左右透過Airbnb傳送。輕觸鍵盤，輸入收到的密碼後按*。沒有收到密碼或無法開門時，請透過Airbnb聯絡房東。');
    if(id==='transport'&&context.direction==='property_to_airport') return pick(lang,'숙소에서 녹사평역 2번 출구로 이동해 6호선 공덕 방면 열차를 타세요. 공덕역에서 공항철도 일반열차로 환승해 목적지인 김포공항 또는 인천공항에서 내리시면 됩니다. 현재 시간표·막차는 확인할 수 없으니 심야 이동은 공식 운행 정보를 확인해 주세요.', 'From the property, go to Noksapyeong Station Exit 2. Take Line 6 toward Gongdeok, then transfer to an AREX all-stop train for Gimpo or Incheon Airport. Current departure times are unavailable here; check official schedules for late-night travel.', '宿から緑莎坪駅2番出口へ移動し、6号線で孔徳駅へ。空港鉄道の一般列車に乗り換え、金浦空港または仁川空港で降りてください。深夜は公式時刻表を確認してください。', '从住宿前往绿莎坪站2号出口，乘6号线到孔德站，换乘机场铁路普通列车，在金浦机场或仁川机场下车。深夜出行请确认官方时刻表。', '從住宿前往綠莎坪站2號出口，乘6號線到孔德站，轉乘機場鐵路普通列車，在金浦機場或仁川機場下車。深夜出行請確認官方時刻表。');
    // Canonical concepts improve offline synonym coverage without pretending to resolve every nuance.
    const canonical={luggage:'짐 보관',locker:'코인락커',checkout_time:'체크아웃',checkin_method:'체크인',wifi:'Wi-Fi',supplies:'비품',washer:'세탁기',dryer:'건조기',laundry:'세탁',trash:'쓰레기',heat:'온수 난방',tv:'TV',rooftop:'루프탑',contact:'호스트 연락',parking:'주차',directions:'주소'};
    return legacy.answer(canonical[id]||question,lang,{forceLanguage:true});
  }
  return {direct,answer,links,analyze:understanding.analyze,language:understanding.language};
};
