// Shared by the API and the generated browser fallback. Keep this function
// self-contained so the browser bundle can be built without a bundler.
module.exports = function createGuestFallback(guide) {
  function detectLanguage(question, preferred = 'ko') {
    if (/[가-힣]/.test(question)) return 'ko';
    if (/[\u3040-\u30ff]/.test(question)) return 'ja';
    if (/[\u3400-\u9fff]/.test(question)) return 'zh';
    if (/[a-z]/i.test(question)) return 'en';
    return ['ko', 'en', 'ja', 'zh'].includes(preferred) ? preferred : 'ko';
  }
  function answer(question, preferred) {
    const q = String(question || '');
    const lang = detectLanguage(q, preferred);
    const pick = (ko, en, ja, zh) => ({ ko, en, ja, zh }[lang]);
    const matches = pattern => pattern.test(q);
    const g = guide;
    const host = pick('Airbnb 메시지로 호스트에게 확인해 주세요.', 'Please contact your host through Airbnb messages.', 'Airbnbメッセージでホストに確認してください。', '请通过 Airbnb 消息联系房东确认。');
    if (matches(/화재|불이 났|연기|침수|누수|갇혔|응급|긴급|fire\b|flood|emergency|injur|火災|緊急|火灾|紧急/i)) {
      return pick('위험한 장소에서 벗어나 안전을 확보하고, 긴급 구조가 필요하면 현지 긴급전화로 도움을 요청하세요. 예약 메시지에 안내된 실제 호스트 연락처를 확인해 주세요.', 'Move away from danger and seek local emergency help if needed. Use the actual host contact provided in your booking messages.', '危険な場所から離れ、安全を確保してください。必要なら現地の緊急窓口に連絡し、予約メッセージでホストの連絡先を確認してください。', '请离开危险区域并确保安全，必要时联系当地紧急救援。请查看预订消息中的真实房东联系方式。');
    }
    if (matches(/CCTV|카메라|감시|camera|監視|摄像|攝像/i)) {
      return pick(`CCTV는 ${g.security.cctv.location}되어 있고 객실 내부에는 없습니다. 안전과 보안을 위한 카메라입니다.`, 'CCTV is installed only at the entrance, for safety and security. There are no cameras inside the guest rooms.', '防犯カメラは入口にのみ設置されています。客室内にはありません。', '监控摄像头仅安装在入口处，用于安全保障。客房内部没有摄像头。');
    }
    if (matches(/방문 벨|초인종|모르는 사람|doorbell|stranger|呼び鈴|知らない人|门铃|陌生人/i)) {
      return pick(g.security.doorbell, 'Do not respond if an unknown person rings the doorbell. This protects guest privacy.', '知らない人が呼び鈴を鳴らしても応答しないでください。', '陌生人按门铃时请不要回应，以保护住客隐私。');
    }
    // Storage policy must precede check-in and locker/supply keywords.
    if (matches(/짐|캐리어|보관|luggage|baggage|suitcase|storage|荷物|行李|寄存/i) && !matches(/비품|수건|휴지|suppl|towel|備品|毛巾|공항|airport|空港|机场|機場|코인락커|물품보관함|locker|ロッカー|储物柜/i)) {
      return pick(`${g.checkInOut.luggageStorage.policy} 녹사평역 ${g.luggageLockers.floor} 엘리베이터·7-ELEVEN 주변 코인락커를 이용하고, 잔여함은 또타라커 앱이나 현장에서 확인해 주세요.`, 'Luggage storage at the property is not available before check-in or after checkout. Try the lockers near the B1 elevator and 7-ELEVEN at Noksapyeong Station; check availability in T locker or at the station.', 'チェックイン前・チェックアウト後の宿での荷物預かりはできません。緑莎坪駅B1のエレベーター・7-ELEVEN付近のロッカーをご利用ください。空きはT lockerまたは現地で確認してください。', '住宿不提供入住前或退房后的行李寄存。可使用绿莎坪站B1电梯及7-ELEVEN附近的储物柜，空柜情况请在T locker或现场确认。');
    }
    if (matches(/코인락커|물품보관함|또타라커|locker|ロッカー|储物柜|儲物櫃/i)) {
      const c = g.luggageLockers.listedCapacity;
      return pick(`녹사평역 B1 엘리베이터·7-ELEVEN 주변에 코인락커가 있습니다. 공개 데이터 기준 소형 ${c.small}개·중형 ${c.medium}개·대형 ${c.large}개이며 실제 잔여함은 또타라커 앱이나 현장에서 확인해 주세요.`, `Lockers are near the B1 elevator and 7-ELEVEN at Noksapyeong Station. Listed capacity: ${c.small} small, ${c.medium} medium and ${c.large} large; check actual availability in T locker or at the station.`, '緑莎坪駅B1のエレベーター・7-ELEVEN付近にロッカーがあります。空きはT lockerアプリまたは現地で確認してください。', '绿莎坪站B1电梯及7-ELEVEN附近有储物柜。请通过T locker应用或现场确认空柜。');
    }
    if (matches(/늦.*퇴실|퇴실.*늦|레이트|연장|지연|얼리|일찍.*입실|일찍.*체크인|late.*check|early.*check|延長|アーリー|レイト|提前入住|延迟退房|延遲退房/i)) return pick(g.checkInOut.lateCheckout, 'Early check-in, late checkout approval and any extra fee require host confirmation through Airbnb messages.', '早めのチェックイン、延長の可否と追加料金はAirbnbでホストに確認してください。', '提前入住、延迟退房及额外费用请通过Airbnb与房东确认。');
    if (matches(/체크아웃|퇴실|checkout|check-out|check out|チェックアウト|退房/i)) {
      return pick(`체크아웃은 ${g.checkInOut.checkOut}예요. 퇴실 전 설거지·분리수거, 냉난방·조명 끄기, 풍선·가랜드 처리, 소지품 확인, 창문·현관문 닫기를 확인해 주세요.`, `Checkout is at ${g.checkInOut.checkOut24}. Wash dishes, sort trash, turn off heating, AC and lights, remove event decorations, check your belongings, and close windows and the front door.`, `チェックアウトは${g.checkInOut.checkOut24}です。食器洗い・ゴミの分別、冷暖房と照明を切る、飾りと忘れ物の確認、窓と玄関を閉めることをお願いします。`, `退房时间为${g.checkInOut.checkOut24}。请洗碗、分类垃圾、关闭冷暖气及照明、清理装饰并检查随身物品，关好窗户与大门。`);
    }
    if (matches(/체크인|입실|도어락|키\s?번호|문.*안\s?열|check.?in|arrival|door code|door lock|lockout|チェックイン|ドア.*暗証|入住|门锁/i)) {
      return pick(`체크인은 ${g.checkInOut.checkIn}부터예요. 개인 키 번호는 당일 12시쯤 Airbnb 메시지로 전달됩니다. 키패드 터치 → 받은 번호 입력 → * 버튼 순서로 눌러 주세요.`, `Check-in starts at ${g.checkInOut.checkIn24}. Your personal door code arrives through Airbnb messages around noon that day. Touch the keypad, enter your code, then press *.`, `チェックインは${g.checkInOut.checkIn24}からです。個人用の暗証番号は当日正午ごろAirbnbで届きます。キーパッドをタッチし、番号を入力して*を押してください。`, `入住时间从${g.checkInOut.checkIn24}开始。个人门锁密码将在当天中午12点左右通过Airbnb发送。轻触键盘，输入收到的密码后按*。`);
    }
    if (matches(/wifi|wi-fi|와이파이|无线|無線/i)) {
      if (matches(/안\s?돼|안\s?되|불안|끊|문제|연결.*안|not work|connect|trouble|つなが|繋が|无法|连不上/i)) return pick(g.wifi.troubleshooting.slice(0, 3).join(' ') + ' 계속 안 되면 호스트에게 문의해 주세요.', 'Toggle Wi-Fi off and on, reselect the network, check for spaces around a pasted password, and try another device. Contact the host if it still fails.', 'Wi-Fiを入れ直し、ネットワークを再選択してください。パスワード前後の空白と他の機器での接続を確認し、改善しなければホストに連絡してください。', '请关闭再开启Wi-Fi并重新选择网络，检查密码前后空格，并尝试其他设备。仍无法连接时请联系房东。');
      return pick(`와이파이 이름은 \`${g.wifi.ssid}\`, 비밀번호는 \`${g.wifi.password}\`입니다. 대소문자와 특수문자를 그대로 입력해 주세요.`, `Wi-Fi: \`${g.wifi.ssid}\`. Password: \`${g.wifi.password}\`. Enter letters and symbols exactly as shown.`, `Wi-Fiは\`${g.wifi.ssid}\`、パスワードは\`${g.wifi.password}\`です。大文字・小文字・記号をそのまま入力してください。`, `Wi-Fi名称为\`${g.wifi.ssid}\`，密码为\`${g.wifi.password}\`。请准确输入大小写和符号。`);
    }
    if (matches(/공항|airport|incheon|gimpo|空港|机场|機場/i)) {
      const isGimpo = matches(/김포|gimpo|金浦/i);
      const airport = isGimpo ? '김포공항' : '인천공항';
      const route = isGimpo ? g.transport.gimpo.rail : g.transport.incheon.rail;
      return pick(`${airport}에서 공항철도 → 공덕역에서 6호선 환승 → 녹사평역 2번 출구 경로를 권장합니다. 페이지 기준 ${route.duration}이며, 마지막은 도보 약 15분 또는 짐이 많으면 택시를 이용하세요.`, `From ${isGimpo ? 'Gimpo' : 'Incheon'} Airport, take AREX to Gongdeok, transfer to Line 6, and leave Noksapyeong Station via Exit 2. Walk about 15 minutes or take a taxi for the final uphill stretch.`, `${isGimpo ? '金浦' : '仁川'}空港から空港鉄道で孔徳駅へ行き、6号線で緑莎坪駅2番出口へ。宿までは徒歩約15分で、荷物が多い場合は最後の区間をタクシーで移動してください。`, `从${isGimpo ? '金浦' : '仁川'}机场乘机场铁路到孔德站，换乘6号线到绿莎坪站2号出口。最后步行约15分钟，行李较多可乘出租车。`);
    }
    if (matches(/맛집|식당|브런치|카페|추천.*먹|restaurant|brunch|cafe|food recommendation|レストラン|おすすめ.*食|グルメ|餐厅|美食|早午餐/i)) {
      const brunch = matches(/브런치|아침|brunch|breakfast|朝食|ブランチ|早餐|早午餐/i);
      const place = g.restaurants.places.find(p => p.hostRecommended && p.category === (brunch ? 'brunch' : 'western'));
      return pick(`호스트 추천 중 ${place.name}을 추천합니다. ${place.description} 영업시간·휴무는 방문 전 지도에서 확인해 주세요.`, `A host pick is ${place.latinName}. See the Restaurants page for all ${g.restaurants.count} places and ${g.restaurants.hostPicks.length} host picks. Confirm current opening hours before visiting.`, `ホストのおすすめは${place.latinName}です。周辺グルメページで全${g.restaurants.count}店とホスト厳選${g.restaurants.hostPicks.length}店を確認できます。営業時間は訪問前に確認してください。`, `房东推荐${place.latinName}。周边美食页共有${g.restaurants.count}家餐厅，其中${g.restaurants.hostPicks.length}家为房东推荐。前往前请确认营业时间。`);
    }
    if (matches(/주차|parking|駐車|停车|停車/i)) return pick(`${g.parking.onSite}입니다. 모두의주차장 앱에서 확인하거나 용산2가동 기계식·용산2가 주민센터·해방촌 공영주차장을 이용하세요. 기계식 주차장은 SUV 이용이 불가합니다.`, 'There is no on-site parking. Check Modu Parking or the nearby Yongsan 2-ga and Haebangchon public lots. The mechanical lot does not accept SUVs.', '建物には駐車できません。周辺の有料公共駐車場をご利用ください。機械式駐車場はSUV不可です。', '建筑内无法停车，请使用附近收费公共停车场。机械式停车场不接收SUV。');
    if (matches(/주소|숙소.*위치|오는 길|오시는 길|녹사평|address|property location|directions|noksapyeong|住所|アクセス|地址|怎么走/i)) return pick(`${g.property.address}입니다. 녹사평역 2번 출구에서 도보 약 15분이며, 세븐일레븐과 베제투스 사이 골목으로 들어와 2층으로 올라오세요.`, `${g.property.englishAddress}. Walk about 15 minutes from Noksapyeong Station Exit 2, enter the alley between 7-ELEVEN and Vegetus, and go to the 2nd floor.`, '住所はソウル龍山区新興路59、2階です。緑莎坪駅2番出口から徒歩約15分。7-ELEVENとVegetusの間の路地から2階へお越しください。', '地址为首尔龙山区新兴路59号2楼。从绿莎坪站2号出口步行约15分钟，进入7-ELEVEN与Vegetus之间的小巷后上2楼。');
    if (matches(/미스터\s?팽|변기.*막|막힌.*변기|toilet.*clog|clog.*toilet|Mr\.? Pang|トイレ.*詰|马桶.*堵/i)) return pick('가이드북 6쪽에 미스터 팽 사용 안내가 있고 탄산 실린더는 욕실 거울장 안에 있습니다. 현장 제품과 안내를 확인하고, 해결되지 않으면 호스트에게 문의해 주세요.', 'The guidebook, page 6, explains the Mr. Pang unclogging device; its CO2 cylinder is in the bathroom mirror cabinet. Check the actual device and contact the host if unresolved.', 'ガイドブック6ページに詰まり対処器具の説明があります。シリンダーは浴室の鏡付き収納内です。改善しない場合はホストに連絡してください。', '指南第6页有疏通器使用说明，气瓶在浴室镜柜内。请核对现场设备，无法解决时联系房东。');
    if (matches(/공용.*화장실|화장실|restroom|toilet|bathroom|トイレ|洗手间|卫生间/i)) return pick(`화장실이 부족하면 ${g.appliances.sharedRestroom.location}을 이용해 주세요. 비밀번호는 \`${g.appliances.sharedRestroom.password}\`입니다.`, `An additional restroom is behind the 1st-floor restaurant. Passcode: \`${g.appliances.sharedRestroom.password}\`.`, `追加のトイレは1階レストランの裏にあります。暗証番号は\`${g.appliances.sharedRestroom.password}\`です。`, `额外的公共卫生间位于1楼餐厅后方。密码为\`${g.appliances.sharedRestroom.password}\`。`);
    if (matches(/비품|수건|휴지|suppl|cabinet|towel|備品|タオル|用品|毛巾/i)) return pick(`여분 수건·휴지·쓰레기 봉투는 비품 보관함에 있고 비밀번호는 \`${g.appliances.supplyCabinet.password}\`입니다. 2번 방이 열리지 않으면 싱크대 인덕션 아래도 확인해 주세요.`, `Extra supplies are in the supply cabinet, code \`${g.appliances.supplyCabinet.password}\`. If Room 2 does not open, also check under the induction cooktop.`, `予備の備品は備品棚にあり、暗証番号は\`${g.appliances.supplyCabinet.password}\`です。2番の部屋が開かない場合はIH下も確認してください。`, `备用用品在备品柜，密码为\`${g.appliances.supplyCabinet.password}\`。2号房打不开时也请查看电磁炉下方。`);
    if (matches(/쓰레기|분리수거|재활용|음식물|trash|garbage|recycl|food waste|ゴミ|ごみ|垃圾|回收/i)) return pick('일반 쓰레기와 재활용은 모두 베란다 쓰레기통에 넣어 주세요. 음식물은 부엌 싱크대 위 전용 통에 버리고, 장기 숙박 중 냄새가 나면 1층 입구 주황색 통에 배출해 주세요.', 'Put general waste and recycling in the bins on the balcony. Food waste goes in the bin above the kitchen sink; for long stays, use the orange bin at the 1F entrance if it smells.', '一般ゴミと資源ゴミはベランダのゴミ箱へ。生ゴミはキッチンシンク上の専用容器へ入れ、長期滞在で臭う場合は1階入口のオレンジ色の箱へ出してください。', '一般垃圾和可回收物都放入阳台垃圾桶。厨余放入厨房水槽上方专用桶，长住有异味时投放至1楼入口橙色桶。');
    if (matches(/건조|dryer|drying|乾燥|烘干|烘乾/i)) return pick('건조기는 전원 → 건조 코스 → 시작/일시정지 순서예요. 주머니 속 물건을 확인하고 밤에는 진동과 소음에 유의해 주세요.', 'Turn on the dryer, select a course, then press Start/Pause. Empty pockets first and keep nighttime noise low.', '乾燥機は電源、コース選択、開始/一時停止の順です。ポケットの中を確認し、夜間の騒音にご注意ください。', '烘干机按电源、选择程序、开始/暂停的顺序操作。先清空口袋，夜间注意噪音。');
    if (matches(/세탁|빨래|washer|washing|laundry|洗濯|洗衣/i)) return pick('세탁기는 전원 → 코스 선택 → 시작/일시정지 순서예요. 주머니를 확인하고, 사용 후 세탁기 문을 살짝 열어 내부를 말려 주세요. 밤에는 진동과 소음에 유의해 주세요.', 'Turn on the washer, select a course, then press Start/Pause. Empty pockets first and leave the washer door slightly open after use to dry the inside. Keep nighttime noise low.', '洗濯機は電源、コース選択、開始/一時停止の順です。ポケットを確認し、使用後は洗濯機の扉を少し開けて乾かしてください。夜間の騒音にご注意ください。', '洗衣机按电源、选择程序、开始/暂停的顺序操作。清空口袋，使用后将洗衣机门稍微打开晾干，夜间注意噪音。');
    if (matches(/tv|television|ott|netflix|티비|텔레비전|テレビ|电视|電視/i)) return pick('TV 리모컨에서 외부 입력을 선택하고, OTT 리모컨에서 원하는 서비스를 선택한 뒤 확인을 누르세요. 팝업은 바로 실행을 선택하세요. 작동이 안 되면 전원을 3초 이상 누르거나 셋톱 전원선을 10초간 분리 후 연결해 주세요.', 'Select external input with the TV remote, then choose a service and confirm with the OTT remote. Select Launch Now on the popup. If needed, hold Power for 3 seconds or unplug the set-top box for 10 seconds.', 'TVリモコンで外部入力を選び、OTTリモコンでサービスと確認を選びます。ポップアップはすぐ実行を選んでください。問題時は電源を3秒長押し、またはセットトップを10秒抜いて再接続します。', '用电视遥控器选外部输入，再用OTT遥控器选择服务并确认。弹窗选择立即运行。异常时长按电源3秒或拔下机顶盒电源10秒后重连。');
    if (matches(/난방|온수|보일러|heating|hot water|boiler|暖房|お湯|热水|暖气/i)) return pick('거실 스탠드 에어컨 뒤쪽 Rinnai 조절기에서 온수 버튼을 누르세요. 화면에 60도가 표시되면 온수가 정상 작동합니다. 외출 시에는 외출 버튼 또는 전원 버튼을 눌러 주세요.', 'Press Hot Water on the Rinnai controller behind the standing AC in the living room. A display of 60 indicates normal hot water operation. Use Away or Power when going out.', 'リビングのスタンドエアコン後ろのRinnai調節器でお湯ボタンを押してください。60の表示が正常です。外出時は外出または電源ボタンを押してください。', '按客厅立式空调后方Rinnai控制器的热水按钮，显示60表示正常。外出时按外出或电源按钮。');
    if (matches(/옥상|루프탑|rooftop|roof terrace|屋上|屋顶|露台/i)) return pick(g.appliances.rooftop.description + ' 늦은 시간에는 소음을 낮춰 주세요.', 'You can see Namsan Tower from the rooftop. Keep noise low, especially at night.', '屋上から南山タワーが見えます。夜間は静かにご利用ください。', '屋顶可欣赏南山塔景色，夜间请降低音量。');
    if (matches(/가이드북|pdf|guidebook|manual|ガイドブック|指南/i)) return pick(`가이드북 페이지에서 한글·영문 PDF를 볼 수 있습니다. ${g.property.guideUrl}#guidebook`, `Korean and English PDFs are on the Guidebook page: ${g.property.guideUrl}#guidebook`, `ガイドブックページで韓国語・英語PDFを確認できます。${g.property.guideUrl}#guidebook`, `指南页提供韩文和英文PDF：${g.property.guideUrl}#guidebook`);
    if (matches(/갤러리|사진|침실|침대|객실|gallery|photo|bedroom|beds|rooms|寝室|ベッド|卧室|床/i)) return pick(`객실 둘러보기에서 거실·다이닝·침실·루프탑 사진을 볼 수 있습니다. 정확한 객실·침대 수는 호스트에게 확인해 주세요. ${g.property.guideUrl}#gallery`, `See the Gallery for living, dining, bedroom and rooftop photos. Confirm room and bed counts with the host. ${g.property.guideUrl}#gallery`, 'ギャラリーでリビング・寝室・屋上の写真をご覧いただけます。部屋数・ベッド数はホストに確認してください。', '相册中有客厅、餐厅、卧室与屋顶照片。客房及床位数量请向房东确认。');
    if (matches(/매너|소음|조용|quiet|noise|静か|騒音|安静|噪音/i)) return pick(g.houseRules.noise, 'Quiet hours start after 9 PM. Lower conversation and rooftop noise at night.', '夜9時以降は会話や屋上での音を小さくしてください。', '晚上9点后为安静时间，请降低谈话及屋顶活动音量。');
    if (matches(/규칙|금연|흡연|반려|방문자|취사|촬영|rules?|smok|pets?|visitors?|cooking|filming|喫煙|ペット|吸烟|宠物/i)) return pick('예약 인원 외 방문자와 반려동물은 입실할 수 없습니다. 실내·베란다·현관·계단은 금연이며 흡연은 1층 지정 장소에서만 가능합니다. 냄새가 강한 음식은 피하고 간단한 취사만 해 주세요.', 'Extra visitors and pets are not allowed. No smoking indoors, on the balcony, at the entrance or on stairs; use the designated 1F smoking area. Keep cooking simple and avoid strong odors.', '追加の訪問者・ペットは不可です。室内・ベランダ・入口・階段は禁煙で、喫煙は1階指定場所のみです。強い臭いの料理は避けてください。', '不允许额外访客或宠物入住。室内、阳台、入口及楼梯禁烟，仅可在1楼指定区域吸烟。请简单烹饪并避免强烈气味。');
    return pick('📌 이 내용은 숙소 매뉴얼에 없고, 지금은 공개 웹 검색을 연결할 수 없어요.\nAirbnb 메시지로 호스트에게 확인해 주세요.', '📌 This is not in the property manual and public web search is unavailable right now.\nPlease contact your host through Airbnb messages.', '📌 宿泊施設のマニュアルにない内容で、現在は公開ウェブ検索を利用できません。\nAirbnbメッセージでホストに確認してください。', '📌 此内容不在住宿手册中，目前无法使用公开网页搜索。\n请通过 Airbnb 消息联系房东确认。');
  }
  return { answer, detectLanguage };
};
