import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InkGame,CHAPTERS,makeLevel} from '../src/engine.js';
import {WORLD_LINKS,REGION_GIFTS,normalizeWorld} from '../src/world.js';
import {walkGame} from './traverse.js';
const begin=()=>{const g=new InkGame();g.loadWorld(null);g.start();return g;};
const run=(g,t,input=[{}])=>{for(let i=0;i<t*120;i++)g.update(1/120,input);};

test('eight genuinely long regions form a connected graph with physical bidirectional exits',()=>{
 assert.equal(CHAPTERS.length,8);assert.ok(WORLD_LINKS.length>CHAPTERS.length);
 const visited=new Set([0]);for(let i=0;i<8;i++)for(const [a,b]of WORLD_LINKS){if(visited.has(a))visited.add(b);if(visited.has(b))visited.add(a);}assert.equal(visited.size,8);
 for(let i=0;i<8;i++){
  const l=makeLevel(i);assert.ok(l.length>=12000);assert.ok(l.route.length>=20);assert.equal(l.hiddenRooms.length,2);assert.ok(l.checkpoints.length>=7);
  for(const d of l.doors){assert.ok(d.x>=0&&d.x<l.length);assert.ok(l.platforms.some(p=>d.x+d.w>p.x&&d.x<p.x+p.w&&Math.abs(p.y-d.y-d.h)<1),`Door in region ${i} should have ground at its actual height`);if(d.room===null)assert.ok(makeLevel(d.to).doors.some(back=>back.room===null&&back.to===i));}
 }
});
test('world pickups, bridges, health, powers and position survive travel and a serialized reload',()=>{
 const g=begin(),p=g.players[0],coin=g.level.coins[0];p.x=coin.x;p.y=coin.y;g.update(1/120);assert.ok(coin.taken);assert.equal(g.world.wallet,1);
 p.x=150;p.y=160;p.vy=0;g.makeBridge(p);assert.equal(g.world.paper,3);g.grow(p,2);g.lives=5;g.elapsed=88;
 g.loadArea(4,null,{x:180,y:500});g.fastTravel(0);assert.ok(g.level.coins[0].taken);assert.ok(g.level.platforms.some(b=>b.built));
 const snapshot=g.exportWorld(),copy=new InkGame();copy.loadWorld(JSON.parse(JSON.stringify(snapshot)));
 assert.equal(copy.world.wallet,1);assert.equal(copy.world.paper,3);assert.equal(copy.lives,5);assert.equal(copy.elapsed,88);assert.equal(copy.players[0].power,2);assert.equal(copy.players[0].y,g.players[0].y);assert.ok(copy.level.platforms.some(b=>b.built));
});
test('hidden spaces return to their real entrance and retain lit lamps and read memories',()=>{
 const g=begin(),door=g.level.doors.find(d=>d.room===0),x=door.x,y=door.y+door.h;
 assert.ok(g.travelDoor(door));assert.equal(g.areaRoom,0);g.activateSwitch(g.level.switches[0],g.players[0]);g.level.memory.taken=true;g.world.memories.push('0:0');
 g.travelDoor(g.level.doors[0]);assert.equal(g.areaRoom,null);assert.equal(g.players[0].x,x);assert.equal(g.players[0].y,y-g.players[0].h);
 g.travelDoor(g.level.doors.find(d=>d.room===0));assert.ok(g.level.switches[0].active);assert.ok(g.level.memory.taken);assert.ok(g.world.memories.includes('0:0'));
});
test('locked hidden doors explain abilities and become enterable when revisiting with the right gift',()=>{
 const g=begin(),door=g.level.doors.find(d=>d.hidden);assert.ok(door.requires);assert.equal(g.travelDoor(door),false);assert.equal(g.areaRoom,null);
 assert.ok(g.events.some(e=>e.type==='locked'));g.world.abilities[door.requires]=true;assert.ok(g.travelDoor(door));assert.equal(g.areaRoom,1);
});
test('paper bridges spend real resources, have a per-room limit, and camps replenish them for free',()=>{
 const g=begin(),p=g.players[0];for(let i=0;i<5;i++){p.x=120+i*220;p.y=55;g.makeBridge(p);}assert.equal(g.level.platforms.filter(b=>b.built).length,4);assert.equal(g.world.paper,0);
 const wallet=g.world.wallet;g.restAtCamp();assert.equal(g.world.paper,g.world.paperMax);assert.equal(g.lives,5);assert.equal(g.world.wallet,wallet);
});
test('world exploration preserves progress after defeat while independent challenges remain separate',()=>{
 const g=begin();g.world.wallet=8;g.lives=1;g.level.coins[0].taken=true;g.die(g.players[0]);assert.equal(g.state,'playing');assert.equal(g.lives,3);assert.equal(g.world.wallet,6);
 g.configure({mode:'classic'});assert.equal(g.level.coins[0].taken,false);g.configure({mode:'world'});assert.equal(g.level.coins[0].taken,true);assert.equal(g.world.wallet,6);
});
test('cross-region character quests require their clues and produce permanent rewards',()=>{
 const g=begin();assert.equal(g.answerDialogue('letter'),false);g.world.completed.push(1);assert.ok(g.answerDialogue('letter'));assert.ok(g.world.abilities.lotus);
 assert.equal(g.answerDialogue('fox-name'),false);g.world.npcFlags.fox=true;g.world.memories.push('0:0','0:1','1:0');assert.ok(g.answerDialogue('fox-name'));assert.equal(g.world.paperMax,9);
 assert.equal(g.answerDialogue('blank-name'),false);g.world.abilities.echo=true;assert.ok(g.answerDialogue('blank-name'));
 assert.equal(g.answerDialogue('home-lamp'),false);g.world.wallet=7;assert.ok(g.answerDialogue('lantern'));assert.equal(g.world.wallet,1);assert.ok(g.answerDialogue('home-lamp'));assert.ok(g.world.abilities.warmth);
});
test('all seven regions are required for the last gate, and the two endings have different rewards',()=>{
 const g=begin();g.loadArea(7,null,{x:180,y:500});const gate=g.level.gates.find(g=>g.requirement==='world');assert.ok(!gate.open);g.world.completed=[0,1,2,3,4,5];g.updatePlatforms(0);assert.ok(!gate.open);g.world.completed.push(6);g.updatePlatforms(0);assert.ok(gate.open);
 g.completeArea();assert.ok(g.world.completed.includes(7));assert.ok(g.events.some(e=>e.type==='ending-choice'));assert.ok(g.chooseEnding('leave-white'));assert.equal(g.world.ending,'leave-white');assert.ok(g.chooseEnding('open-scroll'));assert.equal(g.world.ending,'open-scroll');
});
test('region restoration grants abilities exactly once and fast travel cannot reveal unvisited places',()=>{
 const g=begin();assert.equal(g.fastTravel(6),false);
 for(let i=0;i<7;i++){g.loadArea(i,null,{x:180,y:500});g.completeArea();const n=g.world.completed.length;g.completeArea();assert.equal(g.world.completed.length,n);if(REGION_GIFTS[i])assert.ok(g.world.abilities[REGION_GIFTS[i]]);}
 assert.ok(g.fastTravel(6));assert.equal(g.chapter,6);
});
test('echo crystals are an intentional ordered puzzle, and flipping pages changes real collision',()=>{
 const g=begin();g.loadArea(5,null,{x:180,y:500});const [mountain,water,moon]=g.level.switches,p=g.players[0];g.activateSwitch(mountain,p);assert.equal(g.level.sequence.progress,0);run(g,1.1);g.activateSwitch(moon,p);assert.equal(g.level.sequence.progress,1);g.activateSwitch(mountain,p);g.activateSwitch(water,p);assert.ok(g.level.sequence.solved);g.updatePlatforms(0);assert.ok(g.level.gates.some(s=>s.requirement==='sequence'&&s.open));
 g.loadArea(7,null,{x:180,y:500});g.level.phase='sun';const a=g.solids().filter(b=>b.phaseKey),sun=a.map(b=>b.x);g.level.phase='moon';const moonSet=g.solids().filter(b=>b.phaseKey);assert.ok(moonSet.length);assert.ok(!moonSet.some(b=>sun.includes(b.x)));
});
test('invalid old saves fall back safely while valid exploration flags remain bounded',()=>{
 const w=normalizeWorld({version:999,current:100});assert.equal(w.current,0);const v=normalizeWorld({version:1,current:80,visited:[0,1,-1,99],completed:[1,1],memories:['0:0','9:9'],paper:999,wallet:-5});assert.deepEqual(v.visited,[0,1]);assert.deepEqual(v.completed,[1]);assert.deepEqual(v.memories,['0:0']);assert.equal(v.paper,v.paperMax);assert.equal(v.wallet,0);
});
test('all sixteen hidden rooms can be explored from their entrances using actual movement and lamps',()=>{
 for(let area=0;area<8;area++)for(let slot=0;slot<2;slot++){
  const g=begin();g.loadArea(area,slot,{x:140,y:500});const l=g.level,points=[[l.switches[0].x,l.switches[0].y+48,'switch:0'],...l.route,[l.switches[1].x,l.switches[1].y+48,'switch:1'],[l.memory.x,l.memory.y+70,'memory']];
  walkGame(g,points,{finish:g=>g.level.memory.taken});assert.ok(l.memory.taken,`${area}:${slot} should be reachable`);assert.ok(g.world.memories.includes(`${area}:${slot}`));assert.ok(g.deaths<=2);
 }
});

test('question blocks stay used on revisits and malformed imported bridge entries cannot break a save',()=>{
 const g=begin(),b=g.level.platforms.find(b=>b.type==='question'&&b.item==='coin');g.hitBlock(b,g.players[0]);assert.ok(b.used);const wallet=g.world.wallet;g.loadArea(4,null,{x:180,y:500});g.fastTravel(0);const same=g.level.platforms.find(q=>q.x===b.x&&q.y===b.y);assert.ok(same.used);g.hitBlock(same,g.players[0]);assert.equal(g.world.wallet,wallet);
 const snapshot=g.exportWorld();snapshot.areas['0'].bridges=[null,{x:NaN,y:0},{x:200,y:200,w:130}];snapshot.returnPoints={'0:0':null,'9:4':{x:12,y:9},'0:1':{x:900,y:500}};
 const copy=new InkGame();assert.doesNotThrow(()=>copy.loadWorld(snapshot));assert.ok(copy.level.platforms.some(b=>b.built));assert.deepEqual(Object.keys(copy.world.returnPoints),['0:1']);
});
