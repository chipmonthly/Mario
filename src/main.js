import './style.css';
import {InkGame,CHAPTERS,MODES,clamp} from './engine.js';
import {Renderer} from './render.js';
import {InkAudio} from './audio.js';
import {WORLD_LINKS,REGION_POSITIONS,QUESTS,ABILITIES,questStage,MEMORY_TEXTS} from './world.js';
const $=id=>document.getElementById(id);
const game=new InkGame(),renderer=new Renderer($('game')),audio=new InkAudio();
const keys=new Set(),pressed=new Set(),touch=[new Set(),new Set()],touchPressed=[new Set(),new Set()],pointers=new Map();
let lastTime=0,accumulator=0,toastTimer=0,storyTimer=0,lastWorldSave=0,lastHUD='',best={},journey={cleared:{},log:[]},preferences={};
function readSaved(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private browsing still supports a complete session. */}}
best=readSaved('ink-kingdom-records',{});journey=readSaved('ink-kingdom-journey',journey);journey.cleared??={};journey.log??=[];preferences=readSaved('ink-kingdom-controls',{});
game.loadWorld(readSaved('ink-kingdom-world',null));
function persistWorld(){if(game.isWorld){save('ink-kingdom-world',game.exportWorld());$('save-indicator').textContent='旅程已保存 · '+game.world.visited.length+'/8 地域 · '+game.world.memories.length+'/16 记忆';}}
const coarse=matchMedia('(pointer:coarse)');
function resize(){
  game.touchDevice=coarse.matches;document.body.classList.toggle('touch-device',game.touchDevice);
  const c=$('game'),box=c.getBoundingClientRect();if(box.width<1||box.height<1)return;
  const height=game.touchDevice&&box.width>box.height*2?420:600;
  c.width=Math.round(height*box.width/box.height);c.height=height;game.viewWidth=c.width;game.splitStacked=game.touchDevice&&game.playerCount===2&&box.width<box.height*1.2;
}
new ResizeObserver(resize).observe($('game-viewport'));document.addEventListener('fullscreenchange',resize);coarse.addEventListener('change',()=>{clearInput();resize();});

// Each pointer retains its own player/control. Releasing one finger must not release another.
for(let player=0;player<2;player++){
  const bank=document.createElement('div');bank.className='touch-bank';bank.dataset.touchPlayer=player;
  bank.innerHTML=`<span class="touch-player-label">${player===0?'朱红 · 一':'青竹 · 二'}</span><div class="touch-direction"><button data-control="left" aria-label="玩家${player+1}向左">◀</button><button data-control="right" aria-label="玩家${player+1}向右">▶</button><button class="interact-button" data-control="down" aria-label="玩家${player+1}下潜或入纸门">探<small>↓</small></button></div><div class="touch-actions"><button data-control="fire" aria-label="玩家${player+1}莲火">火</button><button data-control="dash" aria-label="玩家${player+1}踏墨冲刺">墨<small>踏墨</small></button><button data-control="build" aria-label="折纸造桥">造<small>纸桥</small></button><button class="jump-button" data-control="jump" aria-label="玩家${player+1}跳跃">跃<small>再按二段跃</small></button></div>`;
  $('mobile-controls').append(bank);
}
function refreshTouch(){
  const before=touch.map(s=>new Set(s));touch.forEach(s=>s.clear());
  for(const value of pointers.values())touch[value.player].add(value.control);
  touch.forEach((set,player)=>{for(const control of set)if(!before[player].has(control))touchPressed[player].add(control);});
  document.querySelectorAll('[data-control]').forEach(b=>b.classList.toggle('is-held',touch[+b.closest('[data-touch-player]').dataset.touchPlayer].has(b.dataset.control)));
}
function clearInput(){keys.clear();pressed.clear();pointers.clear();touch.forEach(s=>s.clear());touchPressed.forEach(s=>s.clear());document.querySelectorAll('.is-held').forEach(b=>b.classList.remove('is-held'));}
$('mobile-controls').addEventListener('contextmenu',e=>e.preventDefault());
$('mobile-controls').addEventListener('pointerdown',e=>{
  const button=e.target.closest('[data-control]');if(!button)return;e.preventDefault();button.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{player:+button.closest('[data-touch-player]').dataset.touchPlayer,control:button.dataset.control});refreshTouch();
});
$('mobile-controls').addEventListener('pointermove',e=>{
  const active=pointers.get(e.pointerId);if(!active)return;e.preventDefault();
  const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-control]');
  if(over&&+over.closest('[data-touch-player]').dataset.touchPlayer===active.player&&['left','right','down'].includes(active.control)&&['left','right','down'].includes(over.dataset.control)){active.control=over.dataset.control;refreshTouch();}
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('mobile-controls').addEventListener(name,e=>{pointers.delete(e.pointerId);refreshTouch();});
function immersive(on){
  clearInput();document.body.classList.toggle('touch-immersive',on);resize();
  if(on){$('game').focus({preventScroll:true});}else if(game.state==='playing')pause();
  $('touch-focus').textContent=on?'↙ 退出沉浸':'⛶ 沉浸游玩';
}
$('touch-focus').addEventListener('click',()=>immersive(!document.body.classList.contains('touch-immersive')));
$('immersive-map').addEventListener('click',()=>openMap());
$('immersive-journal').addEventListener('click',()=>openJournal());
$('leave-immersive').addEventListener('click',()=>immersive(false));$('immersive-pause').addEventListener('click',pause);
for(const [id,key] of [['auto-jump','autoJump'],['large-controls','largeControls'],['haptics','haptics']]){
  $(id).checked=!!preferences[key];$(id).addEventListener('change',()=>{preferences[key]=$(id).checked;save('ink-kingdom-controls',preferences);applyPreferences();});
}
function applyPreferences(){game.autoJump=!!preferences.autoJump;document.body.classList.toggle('large-controls',!!preferences.largeControls);resize();}applyPreferences();
function vibrate(type){if(!preferences.haptics||!navigator.vibrate)return;const time={coin:8,seal:25,death:55,'boss-hit':30,dash:12,switch:20}[type];if(time)navigator.vibrate(time);}

CHAPTERS.forEach((chapter,i)=>{
  const button=document.createElement('button');button.className='chapter-card';button.dataset.chapter=i;button.setAttribute('aria-label',`选择第${chapter.numeral}卷：${chapter.name}`);
  button.innerHTML=`<div class="chapter-art"><canvas width="560" height="250" aria-hidden="true"></canvas><span class="chapter-badge"></span><span class="chapter-completion"></span></div><div class="chapter-info"><div><strong>${chapter.name}</strong><span>${chapter.feature}</span></div><p>${chapter.description}</p><small class="chapter-mechanism">${chapter.mechanic}</small></div>`;
  button.addEventListener('click',()=>{if(game.isWorld){if(game.world.visited.includes(i)){game.fastTravel(i);persistWorld();updateUI();}else{openMap();$('map-message').textContent='尚未抵达'+chapter.name+'，请沿地图上的连通路线前往。';return;}}else configure({chapter:i});$('game-viewport').scrollIntoView({behavior:'smooth',block:'center'});});$('chapter-grid').append(button);renderer.thumbnail(button.querySelector('canvas'),i);
});
function renderJourney(){
  $('journey-strip').innerHTML=CHAPTERS.map((c,i)=>`<span class="journey-step ${(game.isWorld?game.world.completed.includes(i):journey.cleared[i])?'complete':''}"><i>${(game.isWorld?game.world.completed.includes(i):journey.cleared[i])?'✓':c.numeral}</i><span>${c.spirit}<small>${(game.isWorld?game.world.completed.includes(i):journey.cleared[i])?'已归位':'待寻回'}</small></span>${i<CHAPTERS.length-1?'<b>···</b>':''}</span>`).join('');
  document.querySelectorAll('[data-chapter]').forEach(b=>{const record=journey.cleared[+b.dataset.chapter];b.querySelector('.chapter-completion').textContent=record?'★'.repeat(record.stars)+' · '+record.seals.filter(Boolean).length+' 藏印':'';});
}
function recordStory(speaker,text){if(!journey.log.some(e=>e.text===text)){journey.log.push({speaker,text,chapter:game.chapter});journey.log=journey.log.slice(-120);save('ink-kingdom-journey',journey);}}
function showStory(speaker,text){
  recordStory(speaker,text);$('story-speaker').textContent=speaker;$('story-text').textContent=text;$('story-bubble').classList.remove('hidden');clearTimeout(storyTimer);storyTimer=setTimeout(()=>$('story-bubble').classList.add('hidden'),8500);
}
$('dismiss-story').addEventListener('click',()=>$('story-bubble').classList.add('hidden'));
function openJournal(){
  if(game.state==='playing')pause();const root=$('journal-content');root.replaceChildren();
  const quests=document.createElement('section');quests.className='quest-list';for(const q of QUESTS){const card=document.createElement('article');const h=document.createElement('h3');h.textContent=q.name;const p=document.createElement('p');p.textContent=q.description;const b=document.createElement('b');b.textContent=questStage(game.world,q.id)+' · '+q.reward;card.append(h,p,b);quests.append(card);}root.append(quests);
  if(game.world.memories.length){const m=document.createElement('section');m.className='memory-pages';const h=document.createElement('h3');h.textContent='从暗室拾回的记忆 · '+game.world.memories.length+'/16';m.append(h);for(const key of game.world.memories){const [a,r]=key.split(':').map(Number),p=document.createElement('p');p.textContent=CHAPTERS[a].name+' · '+MEMORY_TEXTS[a][r];m.append(p);}root.append(m);}
  CHAPTERS.forEach((chapter,i)=>{const section=document.createElement('section');section.className='journal-chapter';const title=document.createElement('h3');title.textContent=`${chapter.numeral} · ${chapter.name} ${journey.cleared[i]?'— 灵印归位':'— 待续'}`;section.append(title);const note=document.createElement('p');note.textContent=chapter.story;section.append(note);const entries=journey.log.filter(e=>e.chapter===i);for(const entry of entries){const p=document.createElement('p');p.className='journal-entry';p.textContent=`${entry.speaker}：${entry.text}`;section.append(p);}root.append(section);});$('journal-dialog').showModal();
}
$('journal-button').addEventListener('click',openJournal);$('close-journal').addEventListener('click',()=>$('journal-dialog').close());
function toast(text){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),3300);}
function configure(options){
  persistWorld();clearInput();game.configure(options);$('story-bubble').classList.add('hidden');clearTimeout(storyTimer);lastHUD='';resize();updateUI();
  if(game.mode==='world')toast('山河会记住你 · 探键交谈和进门，M 看图，Q 造桥');
  else if(game.mode==='race')toast(game.touchDevice?'双人各有独立触屏按键；推荐横屏游玩':'朱红用 WASD + E，青竹用方向键 + .');
  else if(game.mode==='tide')toast('墨潮从左侧逼近，先看准落点再向前！');
  else if(game.mode==='hunt')toast('本地藏印都要带回，可以向左回头探索');
  else if(game.mode==='zen')toast('不受伤、无限重试，故事与机关依然保留');
}
function start(){clearInput();game.start();updateUI();if(game.touchDevice)immersive(true);else $('game-viewport').scrollIntoView({block:'center',behavior:'instant'});$('game').focus({preventScroll:true});}
function restart(auto=true){if(game.isWorld){clearInput();game.returnToCamp();persistWorld();updateUI();return;}clearInput();game.reset();if(auto)game.start();lastHUD='';updateUI();$('game').focus({preventScroll:true});}
function pause(){if(!['playing','paused'].includes(game.state))return;clearInput();game.pause();updateUI();if(game.state==='playing')$('game').focus({preventScroll:true});}
function updateUI(){
  $('start-overlay').classList.toggle('hidden',game.state!=='ready');$('canvas-caption').classList.toggle('hidden',game.state==='playing'&&game.splitScreen);
  $('canvas-caption').firstElementChild.textContent=game.level.subtitle;$('status-overlay').classList.toggle('hidden',!['paused','won','lost'].includes(game.state));
  $('chapter-index').textContent=CHAPTERS[game.chapter].numeral;$('chapter-number').textContent=String(game.chapter+1).padStart(2,'0');$('chapter-title').textContent=game.level.name;
  $('start-title').textContent=game.isWorld?(game.areaRoom!==null?'回到未绘之处':game.world.areas[String(game.chapter)]?'山河还记得你的脚步':game.level.name+' · 从此入画'):game.level.name;$('start-description').textContent=game.level.description;$('chapter-mechanics').textContent=game.level.mechanic;
  $('mode-status').textContent=`${MODES[game.mode]} · ${game.playerCount===1?'单人':'双人'}`;$('game-status').textContent={ready:'画卷已就绪',playing:'正在探索山河',paused:'片刻小憩',won:'此卷山河已通关',lost:'整装，再启程'}[game.state];
  $('pause-button').innerHTML=game.state==='paused'?'▷ <span>继续</span>':'Ⅱ <span>暂停</span>';$('immersive-pause').textContent=game.state==='paused'?'▷':'Ⅱ';
  $('race-scores').classList.toggle('hidden',game.playerCount!==2||game.state==='ready');$('mobile-controls').classList.toggle('two-players',game.playerCount===2);
  $('players-note').textContent=game.mode==='race'?'各自镜头，先抵朱印；两位玩家都有独立触屏键。':game.playerCount===2?'共享生命与机关进度；触屏双人拥有独立镜头和按键。':'一个人的江湖，也有万千风景。';
  document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===game.mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  document.querySelectorAll('[data-players]').forEach(b=>{const selected=+b.dataset.players===game.playerCount;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  document.querySelectorAll('[data-chapter]').forEach(b=>{const i=+b.dataset.chapter,selected=i===game.chapter;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);b.querySelector('.chapter-badge').textContent=`${CHAPTERS[i].numeral} / ${selected?'当前图卷':`第 ${String(i+1).padStart(2,'0')} 卷`}`;});
  const won=game.state==='won',lost=game.state==='lost';$('status-mark').textContent=won?'印':lost?'再':'憩';$('status-eyebrow').textContent=won?'A CHAPTER WELL TRAVELLED':lost?'EVERY LEAP IS A NEW BEGINNING':'TAKE A BREATH';
  $('status-title').textContent=won?(game.mode==='race'?`${game.winner===0?'朱红':'青竹'}，先行落印！`:game.chapter===7?'八方归色，山河重生':'此间山河，已入心间'):lost?'落墨，亦可重来':'且听风吟';
  $('status-description').textContent=won?game.level.ending:lost?'可以尝试「闲游山河」：免伤、无限重试，慢慢熟悉每条路。':'山河会在原地，等你回来。';
  $('status-primary').textContent=won?(game.chapter===7?'从头再游 →':'展开下一卷 →'):lost?'再试一次 →':'继续冒险 →';$('status-secondary').textContent=won?'重游此卷':'重新开始';$('result-stats').classList.toggle('hidden',!won);
  if(won){const record=best[`${game.chapter}-${game.mode}-${game.playerCount}`];$('result-stats').textContent=`藏印 ${game.sealCount}/${game.level.seals.length} · ${game.deaths===0?'无失足':'重试 '+game.deaths+' 次'} · 用时 ${game.elapsed.toFixed(1)}s · 金币 ${game.coins}${record?' · 最佳 '+record.toFixed(1)+'s':''}`;}
  $('restart-button').innerHTML=game.isWorld?'⌂ <span>回营</span>':'↻ <span>重来</span>';
  renderJourney();resize();lastHUD='';updateHUD();
}
function updateHUD(){
  const p=game.players[0],b=game.level.boss,signature=`${game.coins}-${game.world.wallet}-${game.world.paper}-${game.lives}-${Math.floor(game.elapsed*10)}-${game.sealCount}-${game.players.map(p=>p.score).join('-')}`;if(signature===lastHUD)return;lastHUD=signature;
  $('coin-count').textContent=String(game.isWorld?game.world.wallet:game.coins).padStart(2,'0');$('life-count').textContent=game.mode==='zen'?'∞':String(Math.max(0,game.lives)).padStart(2,'0');$('time-count').textContent=String(Math.floor(game.elapsed)).padStart(3,'0');$('p1-score').textContent=p.score;$('p2-score').textContent=game.players[1]?.score||0;
  $('immersive-stats').textContent=`♥ ${game.mode==='zen'?'∞':Math.max(0,game.lives)}　◉ ${game.coins}　藏印 ${game.sealCount}/${game.level.seals.length}`;
  $('seal-count').textContent=game.areaRoom!==null?(game.level.memory?.taken?'已读':'暗室'):`${game.sealCount} / ${game.level.seals.length}`;$('quest-text').textContent=game.objective();$('immersive-objective').textContent=game.objective();$('skill-status').textContent=p.dashCooldown>0?`踏墨 ${p.dashCooldown.toFixed(1)}s`:game.isWorld?`纸 ${game.world.paper}/${game.world.paperMax} · Q 造桥`:'踏墨就绪 · E';$('travel-progress').style.width=clamp(p.x/game.level.goal*100,0,100)+'%';
  $('boss-hud').classList.toggle('hidden',!b?.active||b.defeated||game.state!=='playing');if(b)$('boss-health').style.width=b.hp/b.maxHp*100+'%';
  document.querySelectorAll('[data-touch-player]').forEach(bank=>{const player=game.players[+bank.dataset.touchPlayer];if(!player)return;const button=bank.querySelector('[data-control="dash"]');button.classList.toggle('cooling',player.dashCooldown>0);button.querySelector('small').textContent=player.dashCooldown>0?player.dashCooldown.toFixed(1)+'s':'踏墨';bank.querySelector('[data-control="build"] small').textContent=game.isWorld?'纸 '+game.world.paper:'漫游专属';bank.querySelector('[data-control="build"]').classList.toggle('unpowered',!game.isWorld||!game.world.paper);bank.querySelector('[data-control="down"]').firstChild.textContent=game.isWorld&&game.context(player)?game.context(player).label.slice(0,1):'探';bank.querySelector('[data-control="fire"]').classList.toggle('unpowered',player.power!==2);});
  const context=game.context();$('interaction-hint').classList.toggle('hidden',!context||game.state!=='playing');if(context)$('interaction-hint').textContent=context.text;
}
function handleEvents(){
  for(const e of game.events){audio.event(e.type);vibrate(e.type);
    if(e.type==='travel'){clearInput();lastHUD='';updateUI();persistWorld();}
    if(e.type==='world-save')persistWorld();if(e.type==='dialogue')openNPC(e);if(e.type==='map')openMap();
    if(e.type==='ending-choice'){if(game.state==='playing')pause();$('ending-dialog').showModal();}
    if(e.type==='area-complete'){toast(CHAPTERS[e.area].name+'已复苏'+(e.gift?' · 学会'+e.gift:'')+' · 世界仍可探索');renderJourney();persistWorld();}
    if(e.type==='memory'){showStory('旧纸上的记忆',e.text);toast('记忆已收好 · '+game.world.memories.length+'/16');}
    if(e.type==='resource')toast('捡到两张旧纸');if(e.type==='build')toast('纸桥已折好 · 本地最多保留四座');if(e.type==='rest')toast('生命与纸张已补足');if(e.type==='quest')toast('故人的故事向前走了一步');
    if(e.type==='story')showStory(e.speaker,e.text);
    if(e.type==='checkpoint')toast('红旗已点亮 · 在此处、此高度重新启程');if(e.type==='life')toast('50 枚金币！额外获得一条生命');if(e.type==='catchup')toast('同伴已将你带回身旁');if(e.type==='seal')toast(`寻得藏印「${e.name}」 · ${game.sealCount}/${game.level.seals.length}`);if(e.type==='switch')toast(e.name+'已唤醒');if(e.type==='locked')toast(e.text);if(e.type==='gentle-return')toast('纸鹤接住了你 · 生命不受损');if(e.type==='boss-defeated')toast('墨障已散 · 最后的山门已开');
    if(e.type==='won'){
      const key=`${game.chapter}-${game.mode}-${game.playerCount}`;best[key]=Math.min(best[key]||Infinity,game.elapsed);save('ink-kingdom-records',best);
      const old=journey.cleared[game.chapter];journey.cleared[game.chapter]={stars:Math.max(old?.stars||0,game.sealCount===game.level.seals.length&&game.deaths===0?3:game.sealCount>=Math.ceil(game.level.seals.length*.6)?2:1),seals:game.level.seals.map((s,i)=>s.taken||old?.seals?.[i]||false)};recordStory(game.level.speaker,game.level.ending);save('ink-kingdom-journey',journey);
    }
    if(['won','lost'].includes(e.type)){clearInput();$('story-bubble').classList.add('hidden');updateUI();}
  }game.events.length=0;
}
function input(){
  return [0,1].map(id=>{
    const one=id===0,single=game.playerCount===1;
    const left=one?'KeyA':'ArrowLeft',right=one?'KeyD':'ArrowRight',jump=one?'KeyW':'ArrowUp',down=one?'KeyS':'ArrowDown';
    const held=key=>keys.has(key),edge=key=>pressed.has(key),t=touch[id],tp=touchPressed[id];
    return {left:held(left)||(one&&single&&held('ArrowLeft'))||t.has('left'),right:held(right)||(one&&single&&held('ArrowRight'))||t.has('right'),jump:held(jump)||(one&&held('Space'))||(one&&single&&held('ArrowUp'))||t.has('jump'),pressJump:edge(jump)||(one&&edge('Space'))||(one&&single&&edge('ArrowUp'))||tp.has('jump'),down:held(down)||(one&&single&&held('ArrowDown'))||t.has('down'),interact:edge(down)||(one&&single&&edge('ArrowDown'))||tp.has('down'),build:edge(one?'KeyQ':'Comma')||tp.has('build'),dash:edge(one?'KeyE':'Period')||tp.has('dash'),fire:held(one?'KeyF':'Slash')||t.has('fire')};
  });
}
function frame(ms){const delta=lastTime?Math.min((ms-lastTime)/1000,.08):0;lastTime=ms;accumulator+=delta;while(accumulator>=1/120){game.update(1/120,input());pressed.clear();touchPressed.forEach(s=>s.clear());accumulator-=1/120;}handleEvents();if(game.isWorld&&ms-lastWorldSave>3000&&game.state==='playing'){persistWorld();lastWorldSave=ms;}updateHUD();renderer.draw(game,ms/1000);audio.update(game.state==='playing');requestAnimationFrame(frame);}

$('start-button').addEventListener('click',start);$('pause-button').addEventListener('click',pause);$('restart-button').addEventListener('click',()=>restart());
$('status-primary').addEventListener('click',()=>{if(game.state==='paused')pause();else if(game.state==='won'){configure({chapter:(game.chapter+1)%CHAPTERS.length});start();}else restart();});$('status-secondary').addEventListener('click',()=>restart());
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>configure({mode:b.dataset.mode}));
for(const b of document.querySelectorAll('[data-players]'))b.addEventListener('click',()=>configure({players:+b.dataset.players,mode:game.mode==='race'&&+b.dataset.players===1?'classic':game.mode}));
$('nav-play').addEventListener('click',()=>{$('game-viewport').scrollIntoView({behavior:'smooth',block:'center'});$('game').focus({preventScroll:true});});
for(const id of ['nav-chapters','change-chapter'])$(id).addEventListener('click',()=>$('chapters-section').scrollIntoView({behavior:'smooth',block:'start'}));
function openHelp(){if(game.state==='playing')pause();$('help-dialog').showModal();}for(const id of ['nav-help','guide-more'])$(id).addEventListener('click',openHelp);
$('close-help').addEventListener('click',()=>$('help-dialog').close());$('help-play').addEventListener('click',()=>{$('help-dialog').close();if(game.state==='paused')pause();else if(game.state==='ready')start();});
for(const id of ['help-dialog','journal-dialog','world-map-dialog','npc-dialog'])$(id).addEventListener('click',e=>{if(e.target===$(id)){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('sound-button').addEventListener('click',async()=>{try{const on=await audio.toggle();$('sound-waves').setAttribute('d',on?'M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14':'m16 9 6 6m0-6-6 6');$('sound-button').setAttribute('aria-pressed',String(on));$('sound-button').setAttribute('aria-label',on?'关闭音效':'开启音效');}catch{audio.enabled=false;toast('当前浏览器暂不支持音效');}});
$('fullscreen-button').addEventListener('click',async()=>{if(game.touchDevice){immersive(!document.body.classList.contains('touch-immersive'));return;}try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-viewport').requestFullscreen();}catch{immersive(true);}});
const gameKeys=['KeyA','KeyD','KeyW','KeyS','KeyE','KeyQ','KeyF','Comma','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Slash','Period'];
document.addEventListener('keydown',e=>{if([...document.querySelectorAll('dialog')].some(d=>d.open))return;if(gameKeys.includes(e.code)){if(e.code==='Space'&&game.state!=='playing'&&e.target instanceof HTMLButtonElement)return;e.preventDefault();if(!keys.has(e.code))pressed.add(e.code);keys.add(e.code);}if(e.repeat)return;if(e.code==='Enter'&&e.target instanceof HTMLButtonElement)return;if(e.code==='Enter'&&game.state==='ready'){e.preventDefault();start();}else if(e.code==='KeyM'){e.preventDefault();openMap();}else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();pause();}else if(e.code==='KeyR'){e.preventDefault();restart();}});
document.addEventListener('keyup',e=>{keys.delete(e.code);});
window.addEventListener('pagehide',persistWorld);
window.addEventListener('blur',()=>{persistWorld();clearInput();if(game.state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.state==='playing')pause();}});window.addEventListener('orientationchange',()=>{clearInput();setTimeout(resize,80);});
$('game').addEventListener('pointerdown',()=>$('game').focus({preventScroll:true}));
let mapWasPlaying=false,npcWasPlaying=false;
function renderMap(){
  const w=game.world;game.storeArea();$('world-map-count').textContent=`${w.completed.length}/8 复苏 · ${w.memories.length}/16 记忆`;
  $('world-links').innerHTML=WORLD_LINKS.map(([a,b])=>{const [x1,y1]=REGION_POSITIONS[a],[x2,y2]=REGION_POSITIONS[b],known=w.visited.includes(a)&&w.visited.includes(b);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${known?'known':''}"/>`;}).join('');
  const root=$('world-nodes');root.replaceChildren();
  CHAPTERS.forEach((region,i)=>{const visited=w.visited.includes(i),cleared=w.completed.includes(i),button=document.createElement('button');button.dataset.region=i;button.className='world-node'+(visited?' visited':'')+(cleared?' restored':'')+(i===game.chapter?' here':'');button.style.left=REGION_POSITIONS[i][0]+'%';button.style.top=REGION_POSITIONS[i][1]+'%';button.setAttribute('aria-label',region.name+(visited?' · 返回营地':' · 尚未抵达'));const badge=document.createElement('i');badge.textContent=cleared?'✓':region.numeral;const title=document.createElement('strong');title.textContent=region.name;const note=document.createElement('small');note.textContent=(visited?'可回营':'未抵达')+' · '+[0,1].filter(r=>w.memories.includes(`${i}:${r}`)).length+'/2 忆';button.append(badge,title,note);button.addEventListener('click',()=>{if(!game.isWorld){$('map-message').textContent='切换「山河漫游」即可沿路探索和保存世界。独立挑战可以直接选择下方图卷。';return;}if(!visited){const from=WORLD_LINKS.filter(e=>e.includes(i)).map(e=>e.find(n=>n!==i)).filter(n=>w.visited.includes(n));$('map-message').textContent=from.length?'从'+from.map(n=>CHAPTERS[n].name).join('、')+'的路牌可以前往'+region.name+'。':'先沿已经发现的道路继续探索。区域之间的连线是实际可通行的双向路线。';return;}game.fastTravel(i);clearInput();$('world-map-dialog').close();updateUI();persistWorld();});root.append(button);});
  $('map-abilities').innerHTML=Object.entries(ABILITIES).map(([key,name])=>`<span class="${w.abilities[key]?'learned':''}">${w.abilities[key]?'✓':'○'} ${name}</span>`).join('')+`<span>纸 ${w.paper}/${w.paperMax} · 铜钱 ${w.wallet}</span>`;
}
function openMap(){mapWasPlaying=game.state==='playing';if(mapWasPlaying)pause();clearInput();renderMap();$('map-message').textContent=game.isWorld?'点选已抵达地域返回营地；未抵达的地域会提示从哪里前往。暗室入口需要在实际地图里寻找。':'山河漫游是一张连通世界；独立挑战不会重置已有旅程。';$('world-map-dialog').showModal();}
for(const id of ['world-map-button','summary-map'])$(id).addEventListener('click',openMap);
$('close-map').addEventListener('click',()=>$('world-map-dialog').close());
$('world-map-dialog').addEventListener('close',()=>{if(mapWasPlaying&&game.state==='paused')pause();});
function openNPC(data){npcWasPlaying=game.state==='playing';if(npcWasPlaying)pause();clearInput();$('npc-speaker').textContent=data.speaker;$('npc-text').textContent=data.text;$('npc-wallet').textContent=`铜钱 ${game.world.wallet} · 纸 ${game.world.paper}/${game.world.paperMax}`;
 const choices=$('npc-choices');choices.replaceChildren();for(const c of data.choices){const button=document.createElement('button');button.textContent=c.label;button.disabled=!!c.disabled;button.dataset.answer=c.id;button.addEventListener('click',()=>{const success=game.answerDialogue(c.id);if(success){$('npc-dialog').close();persistWorld();}else toast('暂时还做不到 · 先补足铜钱或完成提示的线索');});choices.append(button);}$('npc-dialog').showModal();
}
$('close-npc').addEventListener('click',()=>$('npc-dialog').close());$('npc-dialog').addEventListener('close',()=>{if(npcWasPlaying&&game.state==='paused')pause();});
for(const button of document.querySelectorAll('[data-ending]'))button.addEventListener('click',()=>{game.chooseEnding(button.dataset.ending);$('ending-dialog').close();if(game.state==='paused')pause();persistWorld();});
$('export-world').addEventListener('click',()=>{persistWorld();const blob=new Blob([JSON.stringify(game.exportWorld(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ink-kingdom-journey.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import-world').addEventListener('click',()=>$('world-file').click());
$('world-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('too large');const value=JSON.parse(await file.text());if(value.version!==1)throw Error('version');clearInput();game.loadWorld(value);$('world-map-dialog').close();persistWorld();updateUI();toast('旅程已接上，山河还记得你的脚步');}catch{toast('这个文件不是兼容的旅程存档，已有进度已保留');}e.target.value='';});
resize();updateUI();requestAnimationFrame(frame);
