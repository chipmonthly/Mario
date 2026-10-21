import {freshWorld} from './world.js';
import {worldMethods} from './world-runtime.js';
import {CHAPTERS,makeLevel} from './levels.js';
export {CHAPTERS,makeLevel};
export const W=1120,H=600,FLOOR=500;
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MODES={world:'山河漫游',classic:'山河故事',race:'双人竞速',tide:'墨潮追逐',hunt:'寻印游记',zen:'闲游山河'};
const oneWay=b=>['ledge','moving','vanish','crumble','spring','pier','awning','paperBridge','phase'].includes(b.type);
function makePlayer(id,x=140){return{id,x,y:462,w:28,h:38,vx:0,vy:0,grounded:true,coyote:.13,jumpBuffer:0,airJumps:1,power:0,invincible:0,star:0,dead:0,face:1,anim:0,score:0,checkpoint:140,checkpointY:500,safeX:x,safeY:500,shootCooldown:0,dashCooldown:0,dashTime:0,portalCooldown:0,dropThrough:0,inWater:false,onPlatform:null};}

export class InkGame{
  constructor(){this.world=freshWorld();this.areaRoom=null;this.newPlayer=makePlayer;this.mode='classic';this.playerCount=1;this.chapter=0;this.viewWidth=W;this.touchDevice=false;this.splitStacked=false;this.autoJump=false;this.reset();}
  get isWorld(){return this.mode==='world'||this.mode==='zen';}
  get splitScreen(){return this.playerCount===2&&(this.mode==='race'||this.touchDevice);}
  reset(){
    this.level=makeLevel(this.chapter);this.players=Array.from({length:this.playerCount},(_,i)=>makePlayer(i,140+i*52));
    this.state='ready';this.coins=0;this.lives=3;this.elapsed=0;this.camera=0;this.cameras=[0,0];this.tick=0;
    this.items=[];this.projectiles=[];this.hazards=[];this.particles=[];this.popups=[];this.events=[];this.checkpointReached=false;this.winner=null;this.tideX=-280;this.sealCount=0;this.deaths=0;this.lastGoalHint=-10;
  }
  configure(options={}){
    if(this.isWorld)this.storeArea();const mode=options.mode??this.mode;
    this.mode=Object.hasOwn(MODES,mode)?mode:'classic';this.playerCount=this.mode==='race'?2:clamp(options.players??this.playerCount,1,2);
    this.chapter=clamp(options.chapter??(this.isWorld?this.world.current:this.chapter),0,CHAPTERS.length-1);this.areaRoom=null;this.reset();
    if(this.isWorld){this.lives=this.world.health||3;this.elapsed=this.world.time||0;const last=this.world.lastPosition,restore=options.chapter===undefined&&last?.area===this.chapter;this.loadArea(this.chapter,restore?this.world.room:null,restore?last:null,{ready:true,skipStore:true,positionIsTop:restore});}
  }
  emit(type,data={}){this.events.push({type,...data});}
  start(){if(this.state==='ready'){this.state='playing';this.emit('start');this.emit('story',{speaker:this.level.speaker,text:this.level.story});}}
  pause(){if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing';}
  particlesAt(x,y,color,count=12){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*190,vy:-Math.random()*180-30,life:.45+Math.random()*.5,color,size:Math.random()*4+2});}
  popup(x,y,text,color='#ad4536'){this.popups.push({x,y,text,color,life:1.2});}
  addCoin(p,x,y){this.coins++;if(this.isWorld)this.world.wallet++;p.score+=100;this.popup(x,y,'+100','#8d7946');this.emit('coin');if(this.coins%50===0){this.lives++;this.emit('life');}}
  grow(p,power){if(!p.power){p.y-=10;p.h=48;}p.power=Math.max(p.power,power);p.invincible=1;this.emit('power');this.popup(p.x,p.y-12,power===2?'红莲 · 莲火在手':'灵芝 · 身轻力壮');}
  hurt(p){
    if(this.mode==='zen'||p.invincible>0||p.star>0||p.dashTime>0||p.dead)return;
    if(p.power){p.power=0;p.h=38;p.y+=10;p.invincible=2.5;this.emit('hurt');this.particlesAt(p.x+14,p.y+16,'#b35943',8);}else this.die(p);
  }
  die(p){
    if(p.dead||this.state!=='playing')return;
    this.deaths++;
    if(this.mode==='zen'){this.respawn(p);this.emit('gentle-return');return;}
    this.lives--;p.dead=1.1;p.vy=-400;p.vx=0;this.emit('death');this.particlesAt(p.x+14,p.y+20,'#4d6253',18);
    if(this.lives<=0){if(this.isWorld){this.lives=3;this.world.wallet=Math.max(0,this.world.wallet-2);this.emit('story',{speaker:'纸鹤',text:'我接住你了。少了两枚铜钱，但点过的灯、找到的记忆都还在。'});}else{this.state='lost';this.emit('lost');}}
  }
  respawn(p){
    const other=this.players.find(q=>q!==p&&!q.dead&&q.grounded&&!q.inWater&&q.onPlatform?.type!=='crumble');
    let x=p.checkpoint,y=p.checkpointY;
    if(other&&this.mode!=='race'){x=other.x;y=other.y+other.h;}
    if(this.mode==='tide'&&x<this.tideX+80){const next=this.level.checkpoints.find(c=>c.x>this.tideX+150);if(next){x=next.x;y=next.y;}else{x=p.safeX;y=p.safeY;}}
    Object.assign(p,{x,y:y-38,h:38,vx:0,vy:0,power:0,dead:0,invincible:3,star:0,grounded:true,airJumps:1,dashTime:0,dashCooldown:0,jumpBuffer:0,portalCooldown:1,dropThrough:0,onPlatform:null});
  }
  hitBlock(b,p){
    if(b.type==='question'&&!b.used){b.used=true;b.bump=.22;this.emit('bump');if(b.item==='coin'){this.addCoin(p,b.x+20,b.y-8);this.particlesAt(b.x+20,b.y,'#c2a451',6);}else this.items.push({x:b.x+7,y:b.y-29,w:26,h:28,type:b.item,vx:60,vy:-100,life:20});}
    else if(b.type==='brick'){b.bump=.18;this.emit('bump');if(p.power||p.dashTime>0){b.destroyed=true;this.particlesAt(b.x+20,b.y+20,'#6c7761',16);p.score+=50;}}
  }
  solids(){return [...this.level.platforms.filter(b=>!b.destroyed&&!(b.type==='crumble'&&b.fallen>0)&&(b.type!=='vanish'||b.active)&&(!b.phaseKey||b.phaseKey===this.level.phase)),...this.level.gates.filter(b=>!b.open)];}
  moveBody(body,dt,solids,player=false){
    body.x+=body.vx*dt;
    for(const b of solids){if(oneWay(b)||!overlap(body,b))continue;
      if(player&&body.dashTime>0&&b.type==='brick'){this.hitBlock(b,body);if(b.destroyed)continue;}
      if(body.vx>0)body.x=b.x-body.w;else if(body.vx<0)body.x=b.x+b.w;
      if(!player)body.vx*=-1;else body.vx=0;
    }
    const oldBottom=body.y+body.h;body.y+=body.vy*dt;body.grounded=false;body.onPlatform=null;
    for(const b of solids){if((player&&body.dropThrough>0&&oneWay(b))||!overlap(body,b))continue;
      if(body.vy>=0&&oldBottom<=b.y+9){body.y=b.y-body.h;body.vy=0;body.grounded=true;body.onPlatform=b;}
      else if(!oneWay(b)&&body.vy<0&&body.y+body.h>b.y+b.h){body.y=b.y+b.h;body.vy=0;if(player)this.hitBlock(b,body);}
    }
  }
  updatePlatforms(dt){
    for(const b of this.level.platforms){
      b.phaseActive=!b.phaseKey||b.phaseKey===this.level.phase;
      b.bump=Math.max(0,(b.bump||0)-dt);
      if(b.type==='moving'){
        const oldX=b.x,oldY=b.y;
        b.x=b.baseX+(b.axis==='x'?(Math.sin(this.tick*b.speed+b.phase)+1)*b.range/2:0);
        b.y=b.baseY+(b.axis==='y'?Math.sin(this.tick*b.speed+b.phase)*b.range:0);
        for(const p of this.players)if(p.onPlatform===b&&!p.dead){p.x+=b.x-oldX;p.y+=b.y-oldY;}
      }
      if(b.type==='vanish')b.active=Math.sin(this.tick*1.1+b.phase)>-.68;
      if(b.type==='crumble'){
        b.fallen=Math.max(0,(b.fallen||0)-dt);
        if(this.players.some(p=>p.onPlatform===b&&!p.dead))b.crack=(b.crack||0)+dt;else if(!b.fallen)b.crack=0;
        if(b.crack>.65&&!b.fallen){b.fallen=2.8;b.crack=0;this.particlesAt(b.x+b.w/2,b.y,'#a5a48b',8);}
      }
    }
    for(const s of this.level.switches)s.cooldown=Math.max(0,(s.cooldown||0)-dt);
    for(const gate of this.level.gates){
      const should=gate.requirement==='fox'?this.level.npc?.rescued:gate.requirement==='boss'?this.level.boss?.defeated:gate.requirement==='sequence'?this.level.sequence?.solved:gate.requirement==='world'?!this.isWorld||this.world.completed.filter(i=>i!==7).length>=7:(gate.switchIds||this.level.switches.map((_,i)=>i)).every(i=>this.level.switches[i]?.active);
      if(should&&!gate.open){gate.open=true;this.emit('gate');this.particlesAt(gate.x,gate.y+30,'#c1a864',18);}
    }
  }
  doubleJump(p){p.vy=-610;p.airJumps=0;p.jumpBuffer=0;this.emit('double-jump');this.particlesAt(p.x+14,p.y+p.h,'#c7d5ba',12);}
  dash(p){if(p.dashCooldown>0||p.dead)return;p.dashTime=.19;p.dashCooldown=2.4;p.vy=0;p.vx=p.face*650;this.emit('dash');this.particlesAt(p.x+14,p.y+20,'#526f67',10);}
  activateSwitch(s,p){
    if(s.active||s.cooldown>0)return;
    const seq=this.level.sequence;
    if(seq&&!seq.solved&&s.group==='echo'){
      if(s.name!==seq.order[seq.progress]){seq.progress=0;for(const q of this.level.switches)if(q.group==='echo'){q.active=false;q.cooldown=1;}this.emit('locked',{text:'回声散了 · 再试：'+seq.order.join(' → ')});if(this.isWorld)this.emit('world-save');return;}
      seq.progress++;if(seq.progress===seq.order.length)seq.solved=true;
    }
    s.active=true;s.cooldown=.75;p.score+=300;this.emit('switch',{name:s.name});this.popup(s.x,s.y-10,s.name+' · 已唤醒');this.particlesAt(s.x+18,s.y+10,'#e0bf6e',14);if(this.isWorld)this.emit('world-save');
  }
  objective(){
    const l=this.level;
    if(this.isWorld&&this.areaRoom!==null)return this.level.memory?.taken?'记忆已收好 · 从纸门返回原路':this.level.switches.some(s=>!s.active)?'点亮昔今灯 · '+this.level.switches.filter(s=>s.active).length+'/2':'两灯已亮 · 去读那页记忆';
    if(this.isWorld&&this.world.completed.includes(this.chapter))return '地域已复苏 · 寻暗室、回访故人，或沿路牌前往远方';
    if(this.level.sequence&&!this.level.sequence.solved)return '回声次序：'+this.level.sequence.order.join(' → ')+' · '+this.level.sequence.progress+'/3';
    if(this.mode==='hunt'&&this.sealCount<this.level.seals.length){const p=this.players[0],s=l.seals.filter(s=>!s.taken).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];return `藏印 ${this.sealCount}/${l.seals.length} · ${s.x<p.x?'←':'→'} ${s.name}`;}
    if(l.npc&&!l.npc.rescued)return '找到纸狐阿砚 · 触碰即可救援';
    if(l.switches.some(s=>!s.active))return `${l.theme==='river'?'点亮沿河灯台':l.theme==='temple'?'敲响古寺铜钟':l.theme==='market'?'点亮归乡灯':l.theme==='snow'?'点亮避风灯':'唤醒记忆碑'} ${l.switches.filter(s=>s.active).length}/${l.switches.length}`;
    if(this.isWorld&&l.gates.some(g=>g.requirement==='world'&&!g.open))return '先复苏七方地域 · '+this.world.completed.filter(i=>i!==7).length+'/7 · 从山河图回访故人';
    if(l.boss&&!l.boss.defeated)return l.boss.active?'唤醒墨魇 · 踩头 / 踏墨 / 莲火':'穿过山门，寻找墨魇';
    return '灵印已回应 · 前往朱印归亭';
  }
  goalAllowed(){return this.level.gates.every(g=>g.open)&&(this.mode!=='hunt'||this.sealCount===this.level.seals.length);}
  update(dt,inputs=[]){
    if(this.state!=='playing')return;
    dt=Math.min(dt,1/30);this.tick+=dt;this.elapsed+=dt;const lv=this.level;this.updatePlatforms(dt);
    const solids=this.solids();if(this.mode==='tide')this.tideX=-280+this.elapsed*55;
    for(const p of this.players){
      const input=inputs[p.id]||{};
      if(p.dead){p.dead-=dt;p.vy+=1300*dt;p.y+=p.vy*dt;if(p.dead<=0)this.respawn(p);continue;}
      for(const timer of ['invincible','star','shootCooldown','dashCooldown','dashTime','portalCooldown','dropThrough'])p[timer]=Math.max(0,p[timer]-dt);
      p.inWater=lv.water.some(w=>p.x+p.w>w.x&&p.x<w.x+w.w&&p.y+p.h>w.y+15);
      p.coyote=p.grounded?.14:Math.max(0,p.coyote-dt);p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
      if(p.grounded){p.airJumps=1;if(!['moving','vanish','crumble'].includes(p.onPlatform?.type)){p.safeX=p.x;p.safeY=p.y+p.h;}}
      if(input.pressJump||(this.autoJump&&input.jump&&p.grounded))p.jumpBuffer=.16;
      if(input.down&&p.grounded&&p.onPlatform&&oneWay(p.onPlatform)){p.dropThrough=.25;p.y+=10;p.vy=100;p.grounded=false;p.onPlatform=null;p.coyote=0;}
      if(this.worldInteract(p,input))return;
      if(input.build)this.makeBridge(p);
      if(input.dash)this.dash(p);
      const move=(input.right?1:0)-(input.left?1:0);
      if(move)p.face=move;
      if(p.dashTime>0){p.vx=p.face*650;p.vy=0;}
      else{
        let target=move*(p.inWater?175:p.star?310:260);const ice=p.onPlatform?.type==='ice',accel=p.grounded?(ice?(move?850:240):1900):1300;
        const storm=this.level.blizzards?.find(z=>overlap(p,z));if(storm&&this.isWorld&&!this.world.abilities.warmth)target+=storm.direction*70*(.5+.5*Math.sin(this.tick));
        p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);
        if(p.inWater){
          p.airJumps=1;
          if(this.autoJump&&input.jump&&p.vy>0)p.jumpBuffer=.16;
          if(p.jumpBuffer>0){p.vy=-510;p.jumpBuffer=0;this.emit('swim');}
          p.vy=clamp(p.vy+(input.down?650:300)*dt,-520,input.down?230:120);
        }else{
          if(p.jumpBuffer>0&&p.coyote>0){p.vy=-670;p.grounded=false;p.coyote=0;p.jumpBuffer=0;this.emit('jump');this.particlesAt(p.x+14,p.y+p.h,'#78866b',5);}
          else if(input.pressJump&&p.airJumps>0&&!p.grounded)this.doubleJump(p);
          if(!input.jump&&p.vy< -250)p.vy+=2100*dt;
          const wind=lv.winds.find(w=>overlap(p,w));
          const lowGravity=this.level.gravityZones?.some(z=>overlap(p,z));
          p.vy=wind?Math.max(-330,p.vy-1000*dt):Math.min(900,p.vy+(lowGravity?680:1800)*dt);
          if(this.isWorld&&this.world.abilities.glide&&input.jump&&p.vy>0)p.vy=Math.min(p.vy,this.world.ending==='leave-white'?90:150);
        }
      }
      p.anim+=Math.abs(p.vx)*dt*.035;const playerSolids=this.isWorld&&this.world.abilities.lotus&&!input.down?[...solids,...lv.water.map(w=>({x:w.x,y:w.y,w:w.w,h:8,type:'pier'}))]:solids;this.moveBody(p,dt,playerSolids,true);p.x=clamp(p.x,0,lv.length-p.w);
      if(p.y<30){p.y=30;p.vy=Math.max(0,p.vy);}
      if(p.onPlatform?.type==='spring'){p.vy=-880;p.grounded=false;p.airJumps=1;p.onPlatform=null;this.emit('spring');this.particlesAt(p.x+14,p.y+p.h,'#b4c58a',10);}
      if(p.y>H+100||(this.mode==='tide'&&p.x<this.tideX+12)){this.die(p);continue;}
      if(this.playerCount===2&&!this.splitScreen){const other=this.players.find(q=>q!==p&&!q.dead);if(other&&other.x-p.x>this.viewWidth*.72){this.respawn(p);this.emit('catchup');continue;}}
      for(const c of lv.coins)if(!c.taken&&overlap(p,c)){c.taken=true;this.addCoin(p,c.x,c.y);}
      for(const s of lv.seals)if(!s.taken&&overlap(p,s)){s.taken=true;this.sealCount++;p.score+=750;this.emit('seal',{name:s.name});this.popup(s.x,s.y-20,'灵印 · '+s.name,'#a57d3c');this.particlesAt(s.x+13,s.y+15,'#d9bc6d',20);}
      for(const s of lv.switches)if(overlap(p,s)&&(s.group!=='echo'||input.interact))this.activateSwitch(s,p);
      if(lv.npc&&!lv.npc.rescued&&overlap(p,lv.npc)){lv.npc.rescued=true;if(this.isWorld)this.world.npcFlags.fox=true;p.score+=500;this.emit('rescue');this.emit('story',{speaker:'纸狐阿砚',text:'你找到我了！树冠上有一道纸门，通向藏印的竹亭。向右走，我会替你打开归竹门。'});}
      for(const portal of lv.portals)if(input.interact&&p.portalCooldown<=0&&Math.abs(p.x-portal.x)<65&&Math.abs(p.y-portal.y)<85){p.x=portal.targetX;p.y=portal.targetY;p.vx=0;p.vy=0;p.portalCooldown=1.5;this.emit('portal');this.popup(p.x,p.y-15,'纸门 · 别有洞天');break;}
      if(this.isWorld){
        for(const r of lv.resources||[])if(!r.taken&&overlap(p,r)){r.taken=true;this.world.paper=Math.min(this.world.paperMax,this.world.paper+2);this.emit('resource');}
        if(lv.memory&&!lv.memory.taken&&overlap(p,lv.memory)&&lv.switches.every(s=>s.active)){lv.memory.taken=true;if(!this.world.memories.includes(lv.memory.key))this.world.memories.push(lv.memory.key);p.score+=1000;this.emit('memory',{text:lv.memory.text,key:lv.memory.key});this.emit('world-save');}
      }
      for(const s of lv.spikes)if(overlap(p,s))this.hurt(p);
      for(const e of lv.enemies){
        if(e.dead||!overlap(p,e))continue;
        if(p.star>0||p.dashTime>0){this.killEnemy(e,p);continue;}
        if(p.vy>50&&p.y+p.h-e.y<23&&e.type!=='fish'){p.y=e.y-p.h;p.vy=input.jump?-480:-330;p.airJumps=1;this.killEnemy(e,p);this.emit('stomp');}else this.hurt(p);
      }
      if(input.fire&&p.power===2&&p.shootCooldown<=0){this.projectiles.push({x:p.x+(p.face>0?p.w:0),y:p.y+17,w:10,h:10,vx:p.face*440,vy:-40,life:2.5,owner:p});p.shootCooldown=.32;this.emit('fire');}
      for(const c of lv.checkpoints)if(Math.abs(p.x-c.x)<60&&Math.abs(p.y+p.h-c.y)<90&&p.checkpoint<c.x){p.checkpoint=c.x;p.checkpointY=c.y;this.checkpointReached=true;if(!c.active){c.active=true;this.emit('checkpoint');this.popup(c.x,c.y-100,'此处落笔 · 复活点');if(this.isWorld){this.world.lastCamp={area:this.chapter,x:c.x,y:c.y};this.emit('world-save');}}}
      for(const trigger of lv.triggers)if(!trigger.seen&&p.x>=trigger.x){trigger.seen=true;this.emit('story',{speaker:lv.speaker,text:trigger.text});}
      if(p.x+p.w>=lv.goal&&Math.abs(p.y+p.h-lv.goalY)<120){
        if(this.goalAllowed()){if(this.isWorld){this.completeArea();continue;}this.state='won';this.winner=p.id;p.score+=1000+Math.max(0,300-Math.floor(this.elapsed))*10;this.emit('won',{winner:p.id});break;}
        else if(this.elapsed-this.lastGoalHint>4){this.lastGoalHint=this.elapsed;this.emit('locked',{text:this.objective()});}
      }
    }
    this.updateEnemies(dt,solids);this.updateItems(dt,solids);this.updateProjectiles(dt,solids);this.updateBoss(dt);
    for(const a of this.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=450*dt;a.life-=dt;}this.particles=this.particles.filter(a=>a.life>0);
    for(const a of this.popups){a.y-=25*dt;a.life-=dt;}this.popups=this.popups.filter(a=>a.life>0);
    const alive=this.players.filter(p=>!p.dead),group=alive.length?alive:this.players,center=group.reduce((s,p)=>s+p.x,0)/group.length;
    this.camera+=(clamp(center-this.viewWidth*.36,0,Math.max(0,lv.length-this.viewWidth))-this.camera)*Math.min(1,dt*8);
    const pane=this.splitStacked?this.viewWidth*2:this.viewWidth/2;
    this.cameras=this.players.map((p,i)=>{const target=clamp(p.x-pane*.36,0,Math.max(0,lv.length-pane));return (this.cameras[i]||0)+(target-(this.cameras[i]||0))*Math.min(1,dt*8);});
  }
  updateEnemies(dt,solids){
    for(const e of this.level.enemies){
      if(e.dead){e.timer-=dt;continue;}if(!this.players.some(p=>Math.abs(p.x-e.x)<1100))continue;e.timer+=dt;
      if(e.type==='wisp'||e.type==='fish'){e.x=e.spawnX+Math.sin(this.tick*.9+e.spawnX)*65;e.y=e.baseY+Math.sin(this.tick*1.5)*20;continue;}
      if(e.type==='hopper'&&e.grounded&&e.timer>1.5){e.vy=-420;e.timer=0;}
      if(e.grounded){const ahead=e.vx<0?e.x-5:e.x+e.w+5;if(!solids.some(b=>ahead>b.x&&ahead<b.x+b.w&&Math.abs(b.y-e.y-e.h)<9))e.vx*=-1;}
      e.vy=Math.min(850,e.vy+1800*dt);this.moveBody(e,dt,solids);if(e.y>H+70){e.dead=true;e.timer=0;}
    }
  }
  updateItems(dt,solids){
    for(const i of this.items){i.life-=dt;i.vy=Math.min(850,i.vy+1300*dt);this.moveBody(i,dt,solids);for(const p of this.players)if(!p.dead&&i.life>0&&overlap(i,p)){i.life=0;p.score+=500;if(i.type==='star'){p.star=9;this.emit('power');this.popup(p.x,p.y-15,'星光 · 万法不侵');}else this.grow(p,i.type==='flower'?2:1);this.particlesAt(p.x+14,p.y,'#c9ad55',12);}}
    this.items=this.items.filter(i=>i.life>0&&i.y<H+100);
  }
  updateProjectiles(dt,solids){
    for(const f of this.projectiles){
      f.life-=dt;f.x+=f.vx*dt;f.vy+=1100*dt;const prev=f.y+f.h;f.y+=f.vy*dt;
      for(const s of this.level.switches)if(overlap(f,s)){this.activateSwitch(s,f.owner);f.life=0;}
      const boss=this.level.boss;if(boss?.active&&!boss.defeated&&overlap(f,boss)){this.hurtBoss(f.owner);f.life=0;}
      for(const b of solids)if(overlap(f,b)){if(prev<=b.y+8&&f.vy>0){f.y=b.y-f.h;f.vy=-340;}else if(!oneWay(b))f.life=0;}
      for(const e of this.level.enemies)if(!e.dead&&overlap(f,e)){f.life=0;this.killEnemy(e,f.owner);this.emit('stomp');}if(f.y>H)f.life=0;
    }this.projectiles=this.projectiles.filter(f=>f.life>0);
  }
  hurtBoss(p){const b=this.level.boss;if(!b||b.defeated||b.invincible>0)return;b.hp--;b.invincible=.85;p.score+=350;this.emit('boss-hit');this.particlesAt(b.x+40,b.y+25,'#af6350',18);if(b.hp<=0){b.defeated=true;this.hazards=[];this.emit('boss-defeated');this.emit('story',{speaker:'墨魇',text:'原来……我也能画出光。谢谢你还记得我。把最后的灵印带回山河吧。'});p.score+=2500;}}
  updateBoss(dt){
    const b=this.level.boss;if(!b||b.defeated)return;
    if(!b.active&&this.players.some(p=>p.x>(b.activateX??3470)&&!p.dead)){b.active=true;this.emit('story',{speaker:'墨魇',text:'被遗忘的墨，也想留在画里……来吧，让钟声告诉我答案。'});}
    if(!b.active)return;b.invincible=Math.max(0,b.invincible-dt);b.clock+=dt;b.x=b.homeX+Math.sin(b.clock*.85)*75;
    const phase=b.clock%4.5;b.phase=phase<2.5?'watching':phase<3.5?'warning':'attack';
    const cycle=Math.floor(b.clock/4.5);
    if(phase>=3.5&&b.attackCycle===cycle){b.attackCycle=cycle+1;for(const direction of [-1,1])this.hazards.push({x:b.x+40,y:478,w:30,h:22,vx:direction*200,life:2.8});this.emit('boss-wave');}
    for(const p of this.players){if(p.dead||!overlap(p,b))continue;if(p.vy>60&&p.y+p.h-b.y<27){this.hurtBoss(p);p.y=b.y-p.h;p.vy=-590;p.airJumps=1;}else if(p.dashTime>0||p.star>0){this.hurtBoss(p);p.vy=-260;}else this.hurt(p);}
    for(const h of this.hazards){h.x+=h.vx*dt;h.life-=dt;for(const p of this.players)if(!p.dead&&overlap(h,p))this.hurt(p);}this.hazards=this.hazards.filter(h=>h.life>0);
  }
  killEnemy(e,p){e.dead=true;e.timer=.4;p.score+=200;if(this.isWorld){this.world.npcFlags.kills=(this.world.npcFlags.kills||0)+1;if(this.world.npcFlags.kills%3===0)this.world.paper=Math.min(this.world.paperMax,this.world.paper+1);}this.popup(e.x,e.y,'+200');this.particlesAt(e.x+15,e.y+15,'#5f6c51',9);}
}

Object.assign(InkGame.prototype,worldMethods);
