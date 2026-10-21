import {expandLevel,EXTRA_REGIONS} from './expansions.js';
import {REGION_LENGTHS} from './world.js';
export const CHAPTERS = [
  { name:'竹林初晴',numeral:'壹',subtitle:'第一卷 · 寻回失散的纸狐',description:'踏上树冠岔路，唤醒竹林的第一声笛。',feature:'寻踪 · 树冠秘径',palette:['#e9eedf','#cbd6be','#9eb49b','#6d8e76'],length:3600,seed:17,
    spirit:'竹之印',speaker:'纸鹤信使',story:'墨魇偷走了山河的颜色。纸狐阿砚困在竹林深处，请带它去找到第一枚灵印。',ending:'阿砚吹响竹笛，第一抹青绿回到了画卷。它指向云海：风驿还在等信。',hint:'沿树冠找支路；触碰纸狐救援，走近传送门后按 ↓ / S / 探。',mechanic:'树冠岔路 · 弹竹 · 易碎桥 · 纸门秘径' },
  { name:'云山问道',numeral:'贰',subtitle:'第二卷 · 把一封信送进风里',description:'乘上风驿浮舟，在悬空群岛间传信。',feature:'乘风 · 云海浮岛',palette:['#e9ede9','#c8d4d0','#98b1ab','#6d8e87'],length:3500,seed:83,
    spirit:'风之印',speaker:'风驿守望者',story:'风驿的信断了太久。踏弹竹升空，在风柱中借力，把竹林苏醒的消息带到云海尽头。',ending:'云中驿铃再次响起，信纸化作一阵顺风。山下的月河，仍有两盏灯没有亮。',hint:'风柱会托起你；空中再按跳跃可二段跃，踏墨能横跨远处浮岛。',mechanic:'悬空群岛 · 上升气流 · 垂直弹射 · 往返浮舟' },
  { name:'月下听澜',numeral:'叁',subtitle:'第三卷 · 为归人点亮两岸灯',description:'潜入月河捡拾旧梦，乘舟点亮归航灯。',feature:'渡河 · 水下寻灯',palette:['#d8e0df','#b5c7c8','#869ea5','#536f7a'],length:3750,seed:126,
    spirit:'月之印',speaker:'摆渡人',story:'两岸灯火熄灭，月河忘了归路。请点亮两座灯台；水底没有危险的窒息，放心去寻失落的月印。',ending:'两岸的灯照亮了归途，倒影中浮出最后一座古寺。墨魇正守着山河的心。',hint:'水中按跳跃向上游，按 ↓ / S 下潜；触碰两座灯台，开启归航闸门。',mechanic:'可游月河 · 往返渡船 · 水下藏印 · 双灯开闸' },
  { name:'丹霞古寺',numeral:'肆',subtitle:'终卷 · 敲醒钟声，归还山河',description:'登阶鸣钟，越过崩桥，与墨魇最后对话。',feature:'决战 · 双钟镇墨',palette:['#eee8db','#dbceba','#baa88f','#8f8c72'],length:4650,seed:255,
    spirit:'心之印',speaker:'寺中老僧',story:'墨魇不是怪物，是被遗忘太久的一团墨。敲响上下两口古钟，打开山门，再用跳跃、踏墨或莲火唤醒它。',ending:'墨魇终于记起：墨也能画出光。四印归位，山河重生。这一路走过的风景，都是你留下的颜色。',hint:'走过阶梯与升降台，触碰两口铜钟开门。守卫蓄力时跳开，踩头、踏墨或火球都能破墨。',mechanic:'多层寺院 · 古钟机关 · 崩落栈道 · 墨魇首领' },
];

CHAPTERS.push(...EXTRA_REGIONS);
CHAPTERS.forEach((c,i)=>{c.length=REGION_LENGTHS[i];c.theme=c.theme||['forest','sky','river','temple'][i];});
CHAPTERS[0].story='一幅画卷失去了通向山外的路。先找到纸狐阿砚，再去灯市问问旧画师的故事。往左、往右，树冠或井底，都可能是下一段旅程。';
CHAPTERS[0].ending='竹笛又响了。纸狐请你去不夜灯市寻一盏照影灯：旧井里的门，也许还等着被看见。';
CHAPTERS[1].ending='云驿找回一封写给月河渡口的家书。它晚了三十年，请带它去见那位每天多留一个船座的摆渡人。';
CHAPTERS[2].hint='先点亮两岸灯，再向上游寻找归灯。水中跳跃划水，探键下潜；若收到云驿家书，记得回访摆渡人。';
CHAPTERS[3].subtitle='第四卷 · 古钟背后的空白';
CHAPTERS[3].ending='寺中的墨魇安静了下来。老僧说，还有一句话留在听泉溶洞的回声里；听懂它，再回来问那个被擦去的名字。';

const block=(x,y,type='brick',extra={})=>({x,y,w:40,h:40,type,used:false,bump:0,...extra});
const ledge=(x,y,w,type='ledge',extra={})=>({x,y,w,h:20,type,...extra});
const ground=(x,y,w)=>({x,y,w,h:620-y,type:'ground'});
const moving=(x,y,w,axis,range,speed=.7,kind='cloud')=>ledge(x,y,w,'moving',{baseX:x,baseY:y,axis,range,speed,phase:-Math.PI/2,kind});
const enemy=(x,surface,type='goomba')=>({x,y:surface-30,w:30,h:30,vx:type==='turtle'?-48:-36,vy:0,type,dead:false,grounded:false,timer:0,spawnX:x,baseY:surface-30});
const seal=(x,y,name)=>({x,y,w:26,h:30,name,taken:false});
const checkpoint=(x,y)=>({x,y,active:false});
const switchAt=(x,y,name)=>({x,y,w:36,h:48,name,active:false});
function coinsAlong(coins,x,y,n=4,step=30,arc=14){for(let i=0;i<n;i++)coins.push({x:x+i*step,y:y-Math.sin(i/(n-1||1)*Math.PI)*arc,w:17,h:22,taken:false});}

function forest(l){
  l.platforms=[ground(0,500,900),ground(1030,500,720),ground(1910,500,840),ground(2880,500,820),
    block(390,380),block(430,380,'question',{item:'mushroom'}),block(470,380),block(510,380,'question',{item:'coin'}),
    ledge(570,405,130),ledge(760,320,160),ledge(990,265,145,'crumble'),ledge(1215,205,210),
    ledge(1540,320,120),ledge(1760,400,115,'crumble'),ledge(2200,410,140),ledge(2420,320,210),
    ledge(2680,390,110,'crumble'),ledge(3010,410,125),block(3160,375,'question',{item:'flower'}),
    ledge(680,485,48,'spring'),ledge(2260,395,48,'spring')];
  l.enemies=[enemy(830,500),enemy(1100,500),enemy(1430,500,'turtle'),enemy(2200,500,'hopper'),enemy(2590,500),enemy(3090,500,'turtle')];
  l.seals=[seal(818,274,'竹梢藏风'),seal(1310,160,'云上小径'),seal(2510,275,'纸门余音')];
  l.checkpoints=[checkpoint(1190,500),checkpoint(2110,500),checkpoint(3010,500)];
  l.npc={x:2030,y:458,w:36,h:42,rescued:false,name:'纸狐阿砚'};
  l.portals=[{x:1400,y:152,w:40,h:53,targetX:2440,targetY:282,name:'竹影门',cooldown:0},{x:2440,y:267,w:40,h:53,targetX:1360,targetY:167,name:'归竹门',cooldown:0}];
  l.gates=[{x:2890,y:330,w:35,h:170,requirement:'fox',open:false}];
  l.sections=[{x:0,name:'竹林入口'},{x:700,name:'树冠岔路'},{x:1900,name:'纸狐的笛声'},{x:2880,name:'归竹亭'}];
  for(const a of [[240,432,3],[590,360,4],[790,270,4],[1020,218,3],[1250,160,5],[1510,438,5],[1920,425,4],[2210,360,4],[2460,265,4],[2870,350,4],[3230,430,5]])coinsAlong(l.coins,...a);
  l.pits=[[900,1030],[1750,1910],[2750,2880]];
}
function sky(l){
  l.platforms=[ground(0,500,480),ground(560,435,240),ground(960,360,200),ground(1380,280,220),ground(1800,365,200),ground(2240,300,210),ground(2680,400,230),ground(3040,440,560),
    ledge(320,485,48,'spring'),ledge(1100,345,48,'spring'),ledge(1225,170,110),ledge(2080,175,100),
    moving(810,430,125,'x',150,.8),moving(1600,350,145,'x',140,.7),moving(2480,350,130,'x',140,.85),
    block(650,310,'question',{item:'flower'}),block(1430,160,'question',{item:'star'}),block(2760,280,'question',{item:'mushroom'})];
  for(const p of l.platforms)if(p.type==='ground'&&p.x>0&&p.x<3040){p.type='island';p.h=42;}
  l.winds=[{x:815,y:150,w:140,h:380},{x:1990,y:105,w:245,h:440}];
  l.enemies=[enemy(650,435),enemy(1460,280,'turtle'),enemy(1860,365),enemy(2320,300,'hopper'),enemy(2760,400),enemy(3120,440,'turtle'),enemy(1730,220,'wisp'),enemy(2520,230,'wisp')];
  l.seals=[seal(1255,125,'九霄来信'),seal(2110,130,'风眼之心'),seal(2810,354,'云驿回声')];
  l.checkpoints=[checkpoint(1440,280),checkpoint(2310,300),checkpoint(2760,400)];l.goalY=440;
  l.sections=[{x:0,name:'风起驿台'},{x:800,name:'借风云廊'},{x:1600,name:'云海浮舟'},{x:2240,name:'九霄风眼'},{x:3040,name:'回信亭'}];
  for(const a of [[220,425,4],[590,385,5],[840,330,3],[980,310,4],[1240,125,3],[1410,230,5],[1820,315,5],[2070,245,4],[2250,250,5],[2710,350,5],[3110,390,5]])coinsAlong(l.coins,...a);
  l.pits=[[480,560],[800,960],[1160,1380],[1600,1800],[2000,2240],[2450,2680],[2910,3040]];
}
function river(l){
  l.platforms=[ground(0,500,450),ground(450,570,2650),ground(3100,500,750),ledge(920,430,190,'pier'),ledge(1700,395,200,'pier'),ledge(2470,440,220,'pier'),
    moving(510,460,200,'x',250,.52,'boat'),moving(1290,455,190,'x',240,.6,'boat'),moving(2050,465,210,'x',260,.48,'boat'),
    moving(1140,470,90,'y',12,1.3,'lotus'),moving(1940,460,95,'y',14,1.1,'lotus'),
    ledge(2820,390,110,'vanish',{phase:0,active:true}),ledge(2970,420,100,'vanish',{phase:1.2,active:true}),
    block(260,380,'question',{item:'flower'}),block(1770,275,'question',{item:'star'})];
  l.water=[{x:450,y:466,w:2650,h:140}];
  l.switches=[switchAt(1000,382,'西岸灯'),switchAt(2560,392,'东岸灯')];
  l.gates=[{x:3040,y:335,w:40,h:235,requirement:'switches',open:false}];
  l.enemies=[enemy(980,430,'turtle'),enemy(1800,395,'hopper'),enemy(2540,440),enemy(3290,500,'turtle'),enemy(1510,515,'fish'),enemy(2250,515,'fish')];
  l.seals=[seal(720,525,'河底星砂'),seal(1550,525,'沉月旧梦'),seal(2880,345,'灯外月影')];
  l.checkpoints=[checkpoint(975,430),checkpoint(1790,395),checkpoint(2550,440)];
  l.sections=[{x:0,name:'月河渡口'},{x:450,name:'随舟听澜'},{x:1200,name:'沉月水府'},{x:2400,name:'两岸归灯'},{x:3100,name:'归航闸'}];
  for(const a of [[220,430,4],[600,410,5],[980,335,3],[1210,512,5],[1460,510,5],[1720,345,4],[2060,410,5],[2500,385,4],[2810,335,4],[3260,430,5]])coinsAlong(l.coins,...a);
}
function temple(l){
  l.platforms=[ground(0,500,650),ground(650,450,150),ground(800,400,150),ground(950,350,180),ground(1130,410,250),ground(1390,500,260),
    ledge(1650,445,90,'crumble'),ledge(1760,405,90,'crumble'),ledge(1870,365,90,'crumble'),ground(1970,400,240),
    moving(2250,420,130,'y',120,.75,'lift'),ground(2420,300,250),ground(2670,370,150),ground(2820,435,150),ground(2970,500,1680),
    ledge(340,400,120),block(380,280,'question',{item:'flower'}),block(1470,380,'question',{item:'mushroom'}),block(3130,380,'question',{item:'flower'}),ledge(3600,380,110),ledge(4050,360,115)];
  l.switches=[switchAt(1030,302,'晨钟'),switchAt(2530,252,'暮钟')];
  l.gates=[{x:3350,y:290,w:35,h:210,requirement:'switches',open:false},{x:4270,y:290,w:35,h:210,requirement:'boss',open:false}];
  l.spikes=[{x:1520,y:482,w:65,h:18},{x:3035,y:482,w:75,h:18}];
  l.boss={x:3820,y:410,w:82,h:90,homeX:3820,hp:5,maxHp:5,active:false,defeated:false,invincible:0,clock:0,phase:'waiting',attackCycle:0};
  l.enemies=[enemy(550,500,'turtle'),enemy(1000,350),enemy(1230,410,'hopper'),enemy(1460,500),enemy(2020,400,'turtle'),enemy(2490,300,'hopper'),enemy(2870,435),enemy(3240,500,'turtle')];
  l.seals=[seal(430,355,'檐下红笺'),seal(2540,205,'暮钟长鸣'),seal(4100,315,'墨中微光')];
  l.checkpoints=[checkpoint(1200,410),checkpoint(2500,300),checkpoint(3500,500)];
  l.sections=[{x:0,name:'丹霞山门'},{x:650,name:'百步问心阶'},{x:1650,name:'将倾栈道'},{x:2240,name:'升云钟楼'},{x:3500,name:'墨魇的心事'},{x:4270,name:'山河归色'}];
  for(const a of [[220,430,4],[680,395,3],[830,345,3],[980,295,4],[1220,355,4],[1660,395,3],[1870,315,3],[1990,345,4],[2450,245,5],[2830,380,3],[3170,430,4],[3590,330,4],[4080,310,3]])coinsAlong(l.coins,...a);
  l.pits=[[1380,1390],[1650,1970],[2210,2420]];
}

export function makeLevel(index){
  const info=CHAPTERS[index];
  const l={...info,index,platforms:[],enemies:[],coins:[],pits:[],spikes:[],seals:[],switches:[],gates:[],winds:[],water:[],portals:[],checkpoints:[],sections:[],goal:info.length-160,goalY:500,npc:null,boss:null};
  if(index<4)[forest,sky,river,temple][index](l);
  l.checkpoint=l.checkpoints[0]?.x||180;
  l.triggers=[{x:500,text:info.hint,seen:false},{x:info.length*.55,text:index>=4?info.hint:index===0?'纸狐的笛声就在附近。树冠上的灵印，也值得回头看看。':index===1?'每座云岛都能歇脚。先看准落点，再二段跃或踏墨横渡。':index===2?'水下藏着两枚灵印。按住下潜，跳跃上浮；返回岸边的灯台别忘了点亮。':'两口钟齐鸣，山门才会打开。升降台旁的高处有暮钟。',seen:false}];
  expandLevel(l);
  return l;
}
