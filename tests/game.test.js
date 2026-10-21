import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InkGame,CHAPTERS,FLOOR,makeLevel} from '../src/engine.js';
import {traverse,HUNT_ROUTES,huntRoute} from './traverse.js';
const run=(g,seconds,input=[{}])=>{for(let i=0;i<seconds*120;i++)g.update(1/120,input);};
const begin=(options={})=>{const g=new InkGame();g.configure(options);g.start();return g;};

test('chapters have different terrain, routes, objectives and signature mechanisms',()=>{
  const maps=CHAPTERS.map((_,i)=>makeLevel(i));
  for(const l of maps){assert.ok(l.seals.length>=3);assert.ok(l.checkpoints.length>=3);assert.ok(l.goal>3000);assert.ok(l.platforms.some(p=>p.x+p.w>=l.goal&&p.y===l.goalY));assert.ok(l.sections.length>=4);}
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
    const a=new Set(maps[i].platforms.map(b=>`${b.type}:${b.x}:${b.y}:${b.w}`)),b=new Set(maps[j].platforms.map(b=>`${b.type}:${b.x}:${b.y}:${b.w}`));
    assert.ok([...a].filter(x=>b.has(x)).length/Math.min(a.size,b.size)<.2,`Chapters ${i+1} and ${j+1} should not reuse the same route`);
  }
  assert.ok(maps[0].npc&&maps[0].portals.length===2);assert.ok(maps[1].winds.length&&maps[1].platforms.some(p=>p.type==='island'));
  assert.ok(maps[2].water.length&&maps[2].switches.length>=2);assert.ok(maps[3].boss&&maps[3].spikes.length);
});
test('movement, variable-height jump and landing still work',()=>{
  const g=begin();run(g,.2,[{right:true}]);assert.ok(g.players[0].x>155);const p=g.players[0],base=p.y;
  g.update(1/120,[{jump:true,pressJump:true}]);assert.ok(p.vy<0);run(g,.25,[{jump:true}]);assert.ok(p.y<base-85);run(g,.8);assert.ok(p.grounded);assert.equal(p.y,FLOOR-p.h);
  const high=begin(),low=begin();for(const game of [high,low])game.update(1/120,[{jump:true,pressJump:true}]);run(high,.22,[{jump:true}]);run(low,.22,[{}]);assert.ok(high.players[0].y<low.players[0].y-20);
});
test('one air jump is available, and only landing restores it',()=>{
  const g=begin(),p=g.players[0];g.update(1/120,[{jump:true,pressJump:true}]);run(g,.2,[{jump:true}]);
  g.update(1/120,[{jump:true,pressJump:true}]);assert.equal(p.airJumps,0);assert.ok(p.vy< -500);run(g,.1,[{jump:true}]);const vy=p.vy;
  g.update(1/120,[{jump:true,pressJump:true}]);assert.ok(p.vy>vy);run(g,1);assert.ok(p.grounded);assert.equal(p.airJumps,1);
});
test('ink dash works without a fire flower, breaks enemies, and has a cooldown',()=>{
  const g=begin(),p=g.players[0],e=g.level.enemies[0];p.x=e.x-80;p.face=1;g.update(1/120,[{dash:true}]);assert.ok(p.dashTime>0);run(g,.15,[{}]);assert.ok(e.dead);assert.ok(p.dashCooldown>2);
  const cooldown=p.dashCooldown;g.update(1/120,[{dash:true}]);assert.ok(p.dashCooldown<cooldown);run(g,2.5);assert.equal(p.dashCooldown,0);
});
test('question blocks release power-ups and collection grows the player',()=>{
  const g=begin(),p=g.players[0];p.x=434;g.update(1/120,[{jump:true,pressJump:true}]);run(g,.25,[{jump:true}]);assert.equal(g.level.platforms.find(b=>b.x===430).used,true);assert.equal(g.items.length,1);
  const item=g.items[0];p.x=item.x;p.y=item.y;p.vy=0;g.update(1/120);assert.equal(p.power,1);assert.equal(p.h,48);assert.equal(g.items.length,0);
});
test('coins count once, fifty coins reward a life, stomping defeats enemies',()=>{
  const g=begin(),p=g.players[0],c=g.level.coins[0];p.x=c.x;p.y=c.y;g.update(1/120);assert.equal(g.coins,1);g.update(1/120);assert.equal(g.coins,1);for(let i=0;i<49;i++)g.addCoin(p,0,0);assert.equal(g.lives,4);
  const e=g.level.enemies[0];p.x=e.x;p.y=e.y-p.h+2;p.vy=160;p.grounded=false;g.update(1/120);assert.ok(e.dead);assert.ok(p.vy<0);
});
test('checkpoints remember their height, and death restores the correct sky island',()=>{
  const g=begin({chapter:1}),p=g.players[0],c=g.level.checkpoints.find(c=>c.y===280);p.x=c.x;p.y=c.y-p.h;p.vy=0;g.update(1/120);assert.ok(c.active);assert.equal(p.checkpointY,280);
  p.y=720;g.update(1/120);assert.equal(g.lives,2);run(g,1.2);assert.equal(p.x,c.x);assert.equal(p.y,c.y-p.h);assert.ok(p.invincible>0);
  p.invincible=0;g.die(p);run(g,1.2);p.invincible=0;g.die(p);assert.equal(g.state,'lost');
});
test('spring launches players, wind lifts them, crumbling paths return after falling',()=>{
  const g=begin(),p=g.players[0],spring=g.level.platforms.find(b=>b.type==='spring');p.x=spring.x+8;p.y=spring.y-p.h-1;p.vy=220;p.grounded=false;
  run(g,.025,[{jump:true}]);assert.ok(p.vy< -750);
  const sky=begin({chapter:1}),q=sky.players[0],wind=sky.level.winds[0];q.x=wind.x+50;q.y=wind.y+80;q.vy=0;q.grounded=false;run(sky,.3);assert.ok(q.vy< -200);assert.ok(q.y<wind.y+80);
  const b=g.level.platforms.find(b=>b.type==='crumble');p.x=b.x+20;p.y=b.y-p.h;p.vy=0;p.grounded=true;run(g,.8);assert.ok(b.fallen>0);p.x=100;p.y=462;run(g,3.2);assert.equal(b.fallen,0);
});
test('river supports repeated swim strokes, deliberate diving, and one-way piers',()=>{
  const g=begin({chapter:2}),p=g.players[0];p.x=700;p.y=515;p.grounded=false;p.vy=0;
  g.update(1/120,[{jump:true,pressJump:true}]);assert.ok(p.inWater);assert.ok(p.vy<0);const start=p.y;run(g,.15,[{jump:true}]);assert.ok(p.y<start-35);
  p.y=490;p.vy=0;run(g,.3,[{down:true}]);assert.ok(p.y>510);
  const pier=g.level.platforms.find(b=>b.type==='pier');p.x=pier.x+30;p.y=pier.y+12;p.vy=-250;run(g,.2,[{jump:true}]);assert.ok(p.y+p.h<pier.y+20,'A swimmer can jump through the pier from below');
});
test('boats carry standing players horizontally',()=>{
  const g=begin({chapter:2}),p=g.players[0],boat=g.level.platforms.find(b=>b.kind==='boat');p.x=boat.x+50;p.y=boat.y-p.h;p.vy=0;run(g,.05);assert.equal(p.onPlatform,boat);const offset=p.x-boat.x;run(g,.7);assert.ok(Math.abs(p.x-boat.x-offset)<3);
});
test('both lamps must be activated before the river gate opens; projectiles can light them',()=>{
  const g=begin({chapter:2}),p=g.players[0],gate=g.level.gates[0];assert.equal(gate.open,false);
  const [a,b]=g.level.switches;p.x=a.x;p.y=a.y;p.invincible=2;g.update(1/120);assert.ok(a.active);assert.ok(!gate.open);
  g.projectiles.push({x:b.x,y:b.y,w:10,h:10,vx:0,vy:0,life:1,owner:p});g.update(1/120);g.update(1/120);assert.ok(b.active);assert.ok(gate.open);
});
test('paper fox rescue opens the forest gate, and paper portals require interaction',()=>{
  const g=begin(),p=g.players[0],portal=g.level.portals[0];p.x=portal.x;p.y=portal.y;g.update(1/120);assert.ok(Math.abs(p.x-portal.x)<1);
  g.update(1/120,[{interact:true}]);assert.equal(p.x,portal.targetX);assert.ok(p.portalCooldown>0);
  const fox=g.level.npc;p.x=fox.x;p.y=fox.y;p.vy=0;g.update(1/120);g.update(1/120);assert.ok(fox.rescued);assert.ok(g.level.gates[0].open);
});
test('hunt mode requires every distinct seal, and they cannot be farmed twice',()=>{
  const g=begin({mode:'hunt'}),p=g.players[0];g.level.npc.rescued=true;g.update(1/120);assert.ok(!g.goalAllowed());
  for(const s of g.level.seals){p.x=s.x;p.y=s.y;p.vy=0;g.update(1/120);g.update(1/120);}
  assert.equal(g.sealCount,g.level.seals.length);assert.ok(g.goalAllowed());assert.ok(g.players[0].score>=2250);
});
test('ink guardian telegraphs shockwaves, resists repeated instant hits, and unlocks the final gate',()=>{
  const g=begin({chapter:3}),p=g.players[0],b=g.level.boss;p.x=b.activateX+15;g.update(1/120);assert.ok(b.active);
  run(g,2.7);assert.equal(b.phase,'warning');assert.equal(g.hazards.length,0);run(g,1);assert.equal(g.hazards.length,2);
  const hp=b.hp;g.hurtBoss(p);g.hurtBoss(p);assert.equal(b.hp,hp-1);
  while(!b.defeated){run(g,.9);g.hurtBoss(p);}g.update(1/120);assert.ok(g.level.gates.find(x=>x.requirement==='boss').open);assert.equal(g.hazards.length,0);
});
test('zen mode prevents damage and returns fallen players without consuming lives',()=>{
  const g=begin({mode:'zen'}),p=g.players[0];g.hurt(p);assert.equal(g.lives,3);assert.equal(p.dead,0);p.y=720;g.update(1/120);assert.equal(g.lives,3);assert.equal(g.state,'playing');assert.equal(p.y,462);assert.ok(g.deaths>0);
});
test('cooperative and race players have independent input; pause freezes all game timers',()=>{
  const g=begin({players:2,chapter:1});run(g,.2,[{right:true},{left:true}]);assert.ok(g.players[0].x>140);assert.ok(g.players[1].x<192);
  g.pause();const x=g.players[0].x,t=g.tick;run(g,1,[{right:true}]);assert.equal(g.players[0].x,x);assert.equal(g.tick,t);g.pause();g.players[1].x=g.level.goal;g.players[1].y=g.level.goalY-38;g.update(1/120);assert.equal(g.winner,1);
  g.configure({mode:'race',chapter:1});assert.equal(g.players.length,2);g.start();g.players[0].x=g.level.goal;g.players[0].y=g.level.goalY-38;g.update(1/120);assert.equal(g.winner,0);
});
test('ink tide advances only during active gameplay',()=>{
  const g=new InkGame();g.configure({mode:'tide'});const x=g.tideX;run(g,1);assert.equal(g.tideX,x);g.start();run(g,1);assert.ok(g.tideX>x+50);g.pause();const stopped=g.tideX;run(g,1);assert.equal(g.tideX,stopped);
});
test('all eight long-region routes can be completed with normal input, three lives and their real objectives',()=>{
  for(let chapter=0;chapter<8;chapter++){
    const g=traverse(chapter);assert.equal(g.state,'won',`Chapter ${chapter+1} should be playable`);assert.ok(g.lives>0);assert.ok(g.level.gates.every(g=>g.open));
    if(chapter===0)assert.ok(g.level.npc.rescued);if(chapter===2)assert.ok(g.level.switches.every(s=>s.active));if(chapter===3)assert.ok(g.level.boss.defeated);
  }
});

test('all regional hidden seals are reachable on complete hunt routes, without teleportation or extra lives',()=>{
  for(let chapter=0;chapter<8;chapter++){
    const g=traverse(chapter,{mode:'hunt',waypoints:huntRoute(chapter)});
    assert.equal(g.state,'won',`Chapter ${chapter+1} hunt route should be completable`);
    assert.equal(g.sealCount,g.level.seals.length);assert.ok(g.lives>0);
  }
});

test('pressing down on a boat or pier drops through into the river',()=>{
  const g=begin({chapter:2}),p=g.players[0],pier=g.level.platforms.find(b=>b.type==='pier');
  p.x=pier.x+150;p.y=pier.y-p.h;p.vy=0;run(g,.04);assert.equal(p.onPlatform,pier);
  run(g,.4,[{down:true}]);assert.ok(p.y+p.h>pier.y+40);assert.ok(p.inWater);
});
