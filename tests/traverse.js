import {InkGame,makeLevel} from '../src/engine.js';
const routes=[[[820,500],[1110,500],[1560,500],[2035,500],[2500,500],[2970,500],[3440,500]],[[650,435],[1040,360],[1450,280],[1880,365],[2310,300],[2780,400],[3140,440],[3340,440]],[[1020,430],[1780,395],[2570,440],[3230,500],[3590,500]],[[1040,350],[1250,410],[1510,500],[1790,405],[1910,365],[2050,400],[2530,300],[2880,435],[3200,500],[3570,500],[3860,410],[4490,500]]];
routes[3][10][3]='boss';
export function traverse(chapter,{log=false,mode='classic',waypoints=makeLevel(chapter).route}={}){
 const g=new InkGame();g.configure({chapter,mode});g.start();return walkGame(g,waypoints,{log});
}
export function walkGame(g,waypoints,{log=false,finish=null}={}){
 const chapter=g.chapter;let goal=0,last=g.players[0].x,stuck=0;
 for(let f=0;f<120*180&&g.state==='playing';f++){
  const p=g.players[0],boss=g.level.boss;
  let [tx,ty]=waypoints[goal];
  const isBoss=waypoints[goal][2]==='boss'||waypoints[goal][3]==='boss';
  if(isBoss){if(boss.defeated)goal++;else{tx=boss.x+27;ty=boss.y;}}
  const condition=waypoints[goal][2];
  const ready=typeof condition==='function'?condition(g):!condition||condition==='boss'&&boss?.defeated||condition==='npc'&&g.level.npc?.rescued||condition==='sequence'&&g.level.sequence?.solved||condition==='memory'&&g.level.memory?.taken||condition.startsWith('seal:')&&g.level.seals[+condition.split(':')[1]]?.taken||condition.startsWith('switch:')&&g.level.switches[+condition.split(':')[1]]?.active;
  const requiredSwitch=null;
  if(ready&&!isBoss&&(!requiredSwitch||requiredSwitch.active)&&Math.abs(p.x-tx)<45&&((p.grounded&&p.y+p.h<=ty+15)||Math.abs(p.y+p.h-ty)<35)&&goal<waypoints.length-1){goal++;[tx,ty]=waypoints[goal];}
  const dx=tx-p.x,bodyBottom=p.y+p.h,solids=g.solids();
  const sign=dx>7?1:dx< -7?-1:0;
  const ahead=sign>0?p.x+p.w:p.x;
  const standing=p.onPlatform;
  const edge=standing&&(sign>0?standing.x+standing.w-ahead:ahead-standing.x)<22;
  const obstacle=solids.some(b=>!['ledge','spring','moving','vanish','crumble','pier'].includes(b.type)&&((sign>0&&b.x>=ahead-2&&b.x-ahead<65)||(sign<0&&b.x+b.w<=ahead+2&&ahead-b.x-b.w<65))&&b.y<bodyBottom-5&&b.y+b.h>p.y);
  const danger=g.level.enemies.some(e=>!e.dead&&Math.abs(e.x-p.x)<90&&Math.abs(e.y-p.y)<65)||g.level.spikes.some(s=>s.x>=p.x-5&&s.x-p.x<100);
  const onBoss=isBoss;
  let pressJump=p.grounded&&(edge||obstacle||danger||stuck>24||(ty<bodyBottom-30&&Math.abs(dx)<140)||(onBoss&&Math.abs(dx)<130));
  if(!p.grounded&&p.airJumps>0&&p.vy> -60&&!p.inWater&&(Math.abs(dx)>65||bodyBottom>ty+15))pressJump=true;
  const drop=p.grounded&&['ledge','awning','moving','vanish','crumble','pier','paperBridge','phase'].includes(p.onPlatform?.type)&&ty>bodyBottom+35&&Math.abs(dx)<110;
  const dive=p.inWater&&ty>bodyBottom+30&&Math.abs(dx)<180;
  if(drop)pressJump=false;
  if(p.inWater)pressJump=!dive&&f%50===0&&(Math.abs(dx)<180||p.y>480);
  const dash=(danger&&Math.abs(dx)>35&&p.dashCooldown===0)||!p.grounded&&!p.inWater&&p.airJumps===0&&Math.abs(dx)>155&&p.vy>0&&bodyBottom<ty+5&&p.dashCooldown===0;
  g.update(1/120,[{left:sign<0,right:sign>0,jump:true,pressJump,down:dive||drop,interact:(g.level.sequence&&!g.level.sequence.solved&&Math.abs(dx)<35)||false,fire:true,dash}]);
  if(Math.abs(p.x-last)<.1)stuck++;else stuck=0;last=p.x;
  if(log)for(const e of g.events)if(['death','switch','rescue','boss-hit','boss-defeated'].includes(e.type))console.log(chapter,e.type,'point',goal,'at',p.x.toFixed(),p.y.toFixed(),'t',g.tick.toFixed(1));g.events=[];
 }
 if(log)console.log('END',chapter,g.state,'point',goal,g.players[0].x.toFixed(),g.players[0].y.toFixed(),'lives',g.lives,'switches',g.level.switches.map(s=>s.active),'boss',g.level.boss?.hp);
 return g;
}

const seal=i=>g=>g.level.seals[i].taken,switchOn=i=>g=>g.level.switches[i].active;
export const HUNT_ROUTES=[
 [[818,320,seal(0)],[1310,205,seal(1)],[2035,500,g=>g.level.npc.rescued],[2510,320,seal(2)],[3440,500]],
 [[650,435],[1040,360],[1255,170,seal(0)],[1450,280],[1880,365],[2110,175,seal(1)],[2310,300],[2810,400,seal(2)],[2870,400,g=>g.players[0].grounded],[3140,440],[3340,440]],
 [[720,570,seal(0)],[1020,430,switchOn(0)],[1550,570,seal(1)],[1780,395],[2570,440,switchOn(1)],[2880,390,seal(2)],[3230,500],[3590,500]],
 [[430,400,seal(0)],[1040,350,switchOn(0)],[1250,410],[1510,500],[1790,405],[1910,365],[2050,400],[2530,300,switchOn(1)],[2540,250,seal(1)],[2880,435],[3200,500],[3570,500],[3860,410,null,'boss'],[4100,360,seal(2)],[4490,500]]
];

export function huntRoute(chapter){
 const l=makeLevel(chapter);
 const base=chapter<4?HUNT_ROUTES[chapter].filter(p=>p[3]!=='boss'):[];
 const route=base.length?[...base,...l.route.filter(p=>p[0]>=l.baseLength)]:[...l.route];
 const start=chapter<4?3:0;
 for(let id=start;id<l.seals.length;id++){
  const s=l.seals[id],point=[s.x,s.y+62,'seal:'+id];let at=route.findIndex(p=>p[0]>=s.x);if(at<0)at=route.length-1;route.splice(at,0,point);
 }
 return route;
}
