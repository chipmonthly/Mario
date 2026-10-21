import {makeLevel,CHAPTERS} from './levels.js';
import {makeHiddenRoom} from './expansions.js';
import {normalizeWorld,worldKey,REGION_GIFTS,npcDialogue,ABILITIES} from './world.js';
const near=(p,b,range=78)=>Math.abs(p.x+p.w/2-b.x-b.w/2)<range&&Math.abs(p.y+p.h-b.y-b.h)<85;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function apply(l,s){
 if(!s||typeof s!=='object')return;
 for(const [key,field]of[['coins','taken'],['seals','taken'],['switches','active'],['checkpoints','active'],['resources','taken']])if(Array.isArray(s[key]))l[key]?.forEach((item,i)=>item[field]=s[key][i]===true);
 if(Array.isArray(s.enemies))l.enemies.forEach((e,i)=>{e.dead=s.enemies[i]===true;e.timer=0;});
 if(Array.isArray(s.used))l.platforms.forEach((b,i)=>b.used=s.used[i]===true);
 if(Array.isArray(s.destroyed))l.platforms.forEach((b,i)=>b.destroyed=s.destroyed[i]===true);
 if(l.npc)l.npc.rescued=s.fox===true;
 if(l.memory)l.memory.taken=s.memory===true;
 if(l.sequence&&s.sequence){l.sequence.progress=clamp(+s.sequence.progress||0,0,l.sequence.order.length);l.sequence.solved=s.sequence.solved===true;}
 if(l.boss&&s.boss){l.boss.hp=clamp(+s.boss.hp||0,0,l.boss.maxHp);l.boss.defeated=s.boss.defeated===true;l.boss.active=false;}
 l.phase=s.phase==='moon'?'moon':'sun';
 if(Array.isArray(s.bridges))for(const p of s.bridges.slice(-4))if(p&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y))l.platforms.push({x:clamp(p.x,0,l.length-50),y:clamp(p.y,50,550),w:clamp(+p.w||130,80,200),h:15,type:'paperBridge',built:true});
}
export const worldMethods={
 storeArea(){
  if(!this.isWorld||!this.level)return;
  const l=this.level,s={};for(const [key,field]of[['coins','taken'],['seals','taken'],['switches','active'],['checkpoints','active'],['resources','taken']])s[key]=l[key]?.map(x=>!!x[field])||[];
  s.used=l.platforms.filter(b=>!b.built).map(b=>!!b.used);s.enemies=l.enemies.map(e=>!!e.dead);s.destroyed=l.platforms.filter(b=>!b.built).map(b=>!!b.destroyed);s.fox=!!l.npc?.rescued;s.memory=!!l.memory?.taken;s.boss=l.boss?{hp:l.boss.hp,defeated:l.boss.defeated}:null;s.sequence=l.sequence?{progress:l.sequence.progress,solved:l.sequence.solved}:null;s.phase=l.phase;s.bridges=l.platforms.filter(b=>b.built).map(({x,y,w})=>({x,y,w}));
  this.world.areas[worldKey(this.chapter,this.areaRoom)]=s;this.world.current=this.chapter;this.world.room=this.areaRoom;this.world.health=this.lives;this.world.time=this.elapsed;this.world.playerCount=this.playerCount;this.world.powers=this.players.map(p=>p.power);
  const p=this.players[0];if(p&&!p.dead&&p.y<600)this.world.lastPosition={area:this.chapter,room:this.areaRoom,x:p.x,y:p.y};
 },
 exportWorld(){this.storeArea();return JSON.parse(JSON.stringify(this.world));},
 loadWorld(value){this.world=normalizeWorld(value);this.lives=this.world.health;this.elapsed=this.world.time;this.playerCount=this.world.playerCount;this.mode='world';this.areaRoom=this.world.room;this.loadArea(this.world.current,this.world.room,this.world.lastPosition,{ready:true,skipStore:true,positionIsTop:true});},
 loadArea(area,room=null,spawn=null,{ready=false,skipStore=false,positionIsTop=false}={}){
  if(!this.isWorld)return false;if(!skipStore)this.storeArea();
  const previous=this.chapter;this.chapter=clamp(area,0,CHAPTERS.length-1);this.areaRoom=room;
  this.level=room===null?makeLevel(this.chapter):makeHiddenRoom(CHAPTERS[this.chapter],this.chapter,room);
  apply(this.level,this.world.areas[worldKey(this.chapter,room)]);
  if(this.chapter===7&&this.world.quests['blank-name']&&this.level.boss){this.level.boss.hp=Math.min(5,this.level.boss.hp);this.level.boss.maxHp=5;}
  this.world.current=this.chapter;this.world.room=room;if(!this.world.visited.includes(this.chapter))this.world.visited.push(this.chapter);
  const remembered=this.level.checkpoints.filter(c=>c.active).at(-1)||this.level.checkpoints[0];
  const where=spawn||{x:remembered.x,y:remembered.y};
  const old=this.players||[];this.players=Array.from({length:this.playerCount},(_,id)=>{const p=this.newPlayer(id,clamp(where.x+id*37,0,this.level.length-40));Object.assign(p,{y:positionIsTop?where.y:where.y-p.h,checkpoint:remembered.x,checkpointY:remembered.y,invincible:2,portalCooldown:ready?0:1.2,power:positionIsTop?(this.world.powers?.[id]||0):(old[id]?.power??0)});if(p.power){p.h=48;if(!positionIsTop)p.y-=10;}return p;});
  this.items=[];this.projectiles=[];this.hazards=[];this.particles=[];this.popups=[];this.camera=clamp(this.players[0].x-this.viewWidth*.36,0,Math.max(0,this.level.length-this.viewWidth));this.cameras=[this.camera,this.camera];
  this.sealCount=this.level.seals.filter(s=>s.taken).length;this.state=ready?'ready':'playing';this.winner=null;this.lastGoalHint=-10;this.world.lastPosition={area:this.chapter,room,x:this.players[0].x,y:this.players[0].y};
  this.updatePlatforms(0);if(!ready){this.emit('travel',{from:previous,area:this.chapter,room});this.emit('story',{speaker:room===null?this.level.speaker:'未绘之处',text:this.level.story});}return true;
 },
 travelDoor(door){
  if(!this.isWorld)return false;
  if(door.requires&&!this.world.abilities[door.requires]){this.emit('locked',{text:`需要「${ABILITIES[door.requires]}」 · 记住这个入口，以后再来`});return false;}
  const source=this.chapter;
  if(door.returnFromRoom){const r=this.world.returnPoints?.[worldKey(source,this.areaRoom)];return this.loadArea(source,null,r||{x:180,y:500});}
  if(door.room!==null){this.world.returnPoints??={};this.world.returnPoints[worldKey(source,door.room)]={x:door.x,y:door.y+door.h};return this.loadArea(door.to,door.room,{x:160,y:500});}
  const target=makeLevel(door.to),reverse=target.doors.find(d=>d.to===source&&d.room===null);return this.loadArea(door.to,null,reverse?{x:reverse.x,y:reverse.y+reverse.h}:null);
 },
 fastTravel(area){
  if(!this.isWorld||!this.world.visited.includes(area))return false;
  const l=makeLevel(area),snapshot=this.world.areas[String(area)],active=l.checkpoints.filter((c,i)=>snapshot?.checkpoints?.[i]);const c=active.at(-1)||l.checkpoints[0];return this.loadArea(area,null,{x:c.x,y:c.y});
 },
 returnToCamp(){
  if(!this.isWorld)return false;
  const w=this.world.lastCamp,area=w?.area??this.chapter;this.lives=5;return this.loadArea(area,null,{x:w?.x||180,y:w?.y||500});
 },
 restAtCamp(p=this.players[0]){
  this.lives=5;this.world.paper=this.world.paperMax;p.invincible=2;
  const c=this.level.checkpoints.find(c=>Math.abs(c.x-p.x)<90)||{x:p.safeX,y:p.safeY};p.checkpoint=c.x;p.checkpointY=c.y;this.world.lastCamp={area:this.chapter,x:c.x,y:c.y};
  this.emit('rest');this.emit('world-save');
 },
 makeBridge(p){
  if(!this.isWorld||!this.world.abilities.bridge){this.emit('locked',{text:'山河漫游中，可以折纸造桥；其他玩法保留跳跃挑战。'});return;}
  if(!this.world.paper){this.emit('locked',{text:'纸用完了 · 营地免费补纸，或去夜市补给'});return;}
  const width=this.world.npcFlags.bridgeUpgrade||this.world.ending==='open-scroll'?180:130;
  const b={x:clamp(p.x+(p.face>0?22:-width+6),0,this.level.length-width),y:clamp(p.y+p.h+20,90,550),w:width,h:15,type:'paperBridge',built:true};
  if(this.level.platforms.some(s=>!['ledge','moving','crumble','vanish','phase'].includes(s.type)&&b.x<s.x+s.w&&b.x+b.w>s.x&&b.y<s.y+s.h&&b.y+b.h>s.y)){this.emit('locked',{text:'这里已有地面 · 在空中或沟壑上方折纸造桥'});return;}
  const bridges=this.level.platforms.filter(s=>s.built);if(bridges.length>=4)this.level.platforms.splice(this.level.platforms.indexOf(bridges[0]),1);
  this.level.platforms.push(b);this.world.paper--;this.emit('build');this.particlesAt(b.x+width/2,b.y,'#e6d3a7',12);this.emit('world-save');
 },
 context(p=this.players[0]){
  if(!this.isWorld)return null;const candidates=[];
  const add=(type,item,label,text)=>candidates.push({type,item,label,text,distance:Math.abs(p.x+p.w/2-item.x-(item.w||0)/2)+Math.abs(p.y+p.h-item.y-(item.h||0))*.3});
  for(const person of this.level.people||[])if(!(person.role==='fox'&&!this.world.npcFlags.fox)&&near(p,person,72))add('person',person,'交谈',({artisan:'灯市匠人',fox:'纸狐阿砚',ferryman:'摆渡人',monk:'古寺老僧',keeper:'守灯人',guide:'纸鹤引路人'})[person.role]+' · 探键交谈');
  for(const door of this.level.doors||[])if(near(p,door,66))add('door',door,'进入',door.requires&&!this.world.abilities[door.requires]?`旧门 · 需要${ABILITIES[door.requires]}`:door.returnFromRoom?'返回原路':door.room===null?'前往'+CHAPTERS[door.to].name:'进入'+door.name);
  for(const stone of this.level.switches||[])if(stone.group==='echo'&&near(p,stone,55))add('crystal',stone,'鸣石',stone.name+'晶石 · 探键敲出回声');
  for(const anchor of this.level.phaseAnchors||[])if(near(p,anchor,60))add('phase',anchor,'翻页',`翻至${this.level.phase==='sun'?'月':'日'}页 · 探键`);
  for(const c of this.level.checkpoints)if(c.camp&&Math.abs(c.x-p.x)<60&&Math.abs(c.y-p.y-p.h)<80)add('camp',c,'歇脚','营地 · 免费补纸与恢复生命');
  return candidates.sort((a,b)=>a.distance-b.distance)[0]||null;
 },
 worldInteract(p,input){
  if(!this.isWorld||!input.interact||p.portalCooldown>0)return false;
  const c=this.context(p);if(!c)return false;
  if(c.type==='door')return this.travelDoor(c.item);
  if(c.type==='person'){this.activeNPC=c.item;this.emit('dialogue',npcDialogue(this,c.item));return true;}
  if(c.type==='crystal'){this.activateSwitch(c.item,p);p.portalCooldown=.3;return false;}
  if(c.type==='phase'){this.level.phase=this.level.phase==='sun'?'moon':'sun';p.portalCooldown=.5;this.emit('phase');this.emit('world-save');return false;}
  this.restAtCamp(p);return false;
 },
 answerDialogue(action){
  const w=this.world;if(!this.isWorld)return false;
  const reward=(text)=>{this.emit('story',{speaker:'山河旧事',text});this.emit('quest');this.emit('world-save');return true;};
  if(action==='leave')return true;if(action==='map'){this.emit('map');return true;}if(action==='rest'){this.restAtCamp();return reward('歇过脚，纸也补好了。山河的路还长，不必赶。');}
  if(action==='lantern'){if(w.abilities.lantern)return false;if(w.wallet<6){this.emit('locked',{text:'还差铜钱，先沿屋檐和巷道逛逛吧'});return false;}w.wallet-=6;w.abilities.lantern=true;return reward('照影灯已点亮。暗门在地图上留下线索，回竹林旧井就能看见它。');}
  if(action==='paper'){if(w.wallet<2)return false;w.wallet-=2;w.paper=Math.min(w.paperMax,w.paper+3);return reward('收好这三张纸。桥不必原本就有，也可以由你来造。');}
  if(action==='bridge-upgrade'){if(w.npcFlags.bridgeUpgrade||w.wallet<8)return false;w.wallet-=8;w.npcFlags.bridgeUpgrade=true;return reward('折纸桥加固了：现在能铺得更长，回访旧路时也许用得上。');}
  if(action==='letter'&&!w.quests.letter&&w.completed.includes(1)){w.quests.letter=true;w.abilities.lotus=true;return reward('家书已交付。摆渡人教你莲步渡水：不按下潜时可以踏水而行，按探仍能潜入水底。');}
  if(action==='fox-name'&&!w.quests['fox-name']&&w.npcFlags.fox&&w.memories.length>=3){w.quests['fox-name']=true;w.paperMax=Math.min(12,w.paperMax+3);w.paper=w.paperMax;return reward('“小砚……”阿砚想起了疏桐的声音。纸张上限增加三张，世界记住了这次重逢。');}
  if(action==='blank-name'&&!w.quests['blank-name']&&w.abilities.echo){w.quests['blank-name']=true;return reward('画师擦掉道路，是因为舍不得女儿远行。你带走了这段真相，星河守卫的墨障将减少两层。');}
  if(action==='home-lamp'&&!w.quests['home-lamp']&&w.abilities.lantern){w.quests['home-lamp']=true;w.abilities.warmth=true;return reward('暖墨护身已学会。霜岭的逆风变轻，旧狐窟的冰封也愿意为你化开。');}
  return false;
 },
 completeArea(){
  if(!this.isWorld||this.areaRoom!==null||this.world.completed.includes(this.chapter))return;
  const w=this.world;w.completed.push(this.chapter);w.paper=Math.min(w.paperMax,w.paper+3);
  const gift=REGION_GIFTS[this.chapter];if(gift)w.abilities[gift]=true;
  if(this.chapter===0)w.npcFlags.fox=true;
  this.emit('area-complete',{area:this.chapter,gift:gift?ABILITIES[gift]:null});this.emit('story',{speaker:this.level.speaker,text:this.level.ending});this.emit('world-save');
  if(this.chapter===7)this.emit('ending-choice');
 },
 chooseEnding(choice){
  if(!this.isWorld||!this.world.completed.includes(7)||!['leave-white','open-scroll'].includes(choice))return false;
  this.world.ending=choice;
  this.emit('story',{speaker:'山河最后一页',text:choice==='leave-white'?'你保留了一页空白，给尚未归来的故事。纸鸢现在能更长久地滑翔。山河仍向你敞开，灯会一直亮着。':'你为旧画打开了新的窗。折纸桥现在铺得更长。山河仍可自由探索，远行与归来，从此都有自己的路。'});this.emit('world-save');return true;
 },
};
