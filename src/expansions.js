import {REGION_LENGTHS,WORLD_LINKS,MEMORY_TEXTS} from './world.js';
const ground=(x,y,w,type='ground')=>({x,y,w,h:620-y,type});
const ledge=(x,y,w,type='ledge',extra={})=>({x,y,w,h:20,type,...extra});
const moving=(x,y,w,axis,range,kind='cloud')=>ledge(x,y,w,'moving',{baseX:x,baseY:y,axis,range,speed:.65,phase:-Math.PI/2,kind});
const enemy=(x,y,type='goomba')=>({x,y:y-30,w:30,h:30,vx:-36,vy:0,type,dead:false,grounded:false,timer:0,spawnX:x,baseY:y-30});
const sw=(x,y,name,group)=>({x,y:y-48,w:36,h:48,name,group,active:false,cooldown:0});
const flag=(x,y)=>({x,y,active:false,camp:true});
const question=(x,y,item='coin')=>({x,y,w:40,h:40,type:'question',item,used:false,bump:0});
function line(l,x,y,n=4){for(let i=0;i<n;i++)l.coins.push({x:x+i*30,y:y-Math.sin(i/(n-1)*Math.PI)*15,w:17,h:22,taken:false});}
const marker=(x,y,needs)=>[x,y,needs];
export const EXTRA_REGIONS=[
 {name:'不夜灯市',numeral:'伍',subtitle:'第五卷 · 修一盏等人归来的灯',description:'穿过屋檐和水巷，和灯匠交换一段归期。',feature:'聚落 · 灯市与屋檐',palette:['#e7e3d5','#c7c9b4','#9ba68e','#6f8170'],length:12400,seed:331,spirit:'灯之印',theme:'market',speaker:'灯市匠人',story:'夜市从不熄灯。匠人说，山河的暗处并非没有路，只是缺一盏肯回头寻找的灯。屋檐上有旧纸，巷子里也有人在等你。',ending:'灯市连成一条暖色的街。照影灯已交到你手里：回竹林的旧井看看吧，有些门只在灯下出现。',hint:'探键与匠人交谈，屋檐和巷道都能走。三盏归乡灯点亮后，街尾的灯印才会回应。',mechanic:'可交谈聚落 · 修灯交易 · 屋檐支路 · 家书线索'},
 {name:'听泉溶洞',numeral:'陆',subtitle:'第六卷 · 听见被擦掉的声音',description:'循水入洞，沿晶石的回音读出旧名字。',feature:'地下 · 回声与晶石',palette:['#d9e4df','#afc9bd','#7d9f92','#456d65'],length:12600,seed:446,spirit:'泉之印',theme:'cave',speaker:'石壁回声',story:'山、月、水，三枚晶石各记得一个声音。先找到刻在洞壁的次序，再让它们替你说完一句三十年前的话。',ending:'石壁的回声回来了。你学会读出被擦去的字。请回古寺，问老僧：画师为什么不肯留下空白？',hint:'回声谜题的次序是「月 → 山 → 水」。靠近晶石按探，依次唤醒；输错可以重试，纸门会缩短回头的路。',mechanic:'地下支路 · 顺序晶石 · 低顶洞穴 · 回访读碑'},
 {name:'霜岭归灯',numeral:'柒',subtitle:'第七卷 · 风雪里，为谁留一碗茶',description:'走过冰原与避风屋，把灯带回雪里。',feature:'雪域 · 冰面与逆风',palette:['#edf0e9','#d1ded7','#a3bcb5','#78988f'],length:13200,seed:557,spirit:'雪之印',theme:'snow',speaker:'霜岭守灯人',story:'雪地里的每间小屋，都替远行人留一碗热茶。先点亮三处避风灯，再把灯市的照影灯送到守灯人手里。',ending:'霜岭的风口重新有了灯。你得到暖墨护身，旧狐窟的冰封可以化开。山外的脚印，并没有被雪抹去。',hint:'冰面会打滑，提早松开方向。探键可在暖炉边歇脚；照影灯能完成守灯人的心愿。',mechanic:'有惯性的冰面 · 周期逆风 · 温暖营地 · 雪屋旧事'},
 {name:'星河旧卷',numeral:'捌',subtitle:'第八卷 · 把最后一笔留给远方',description:'走入折叠的旧画，决定最后的空白。',feature:'终章 · 翻页与星河',palette:['#dce1e7','#bfc8d6','#8e9eB8','#60758d'],length:14600,seed:668,spirit:'星之印',theme:'astral',speaker:'未写完的画',story:'这里收着山河所有没有写完的故事。先唤醒三座忆碑，再带着七方地域复苏的消息，去见守在留白处的墨魇。',ending:'远行不是遗忘，等待也不必成为牢笼。现在，由你决定：保留一页空白，还是为画卷打开新的窗。',hint:'星河中有低重力区域。靠近翻页石按探，可以切换日页与月页；另一页的虚影也可能是一条路。',mechanic:'低重力星廊 · 日月翻页 · 折叠捷径 · 双结局'},
];
function forestSector(l,x,j){
 const stepped=j%4===3;
 if(stepped){l.platforms.push(ground(x,500,170),ground(x+170,440,180),ground(x+350,390,170),ground(x+520,460,230));l.route.push(marker(x+240,440),marker(x+425,390),marker(x+690,460));}
 else{l.platforms.push(ground(x,500,500),ground(x+630,500,120));l.route.push(marker(x+430,500),marker(x+700,500));l.pits.push([x+500,x+630]);}
 l.platforms.push(ledge(x+90,405,145),ledge(x+310,320,160,j%3===0?'crumble':'ledge'),ledge(x+530,245,150));
 if(j%3===1)l.platforms.push(ledge(x+270,485,48,'spring'));
 if(j%3===2)l.platforms.push(moving(x+470,405,110,'x',100));
 l.enemies.push(enemy(x+390,stepped?390:500,j%2?'hopper':'goomba'));line(l,x+100,350);line(l,x+540,200,3);
}
function skySector(l,x,j){
 const mid=[370,410,330,390][j%4];
 l.platforms.push({...ground(x,440,210),type:'island',h:40},{...ground(x+325,mid,215),type:'island',h:40},{...ground(x+650,440,100),type:'island',h:40});
 l.platforms.push(ledge(x+150,270,125),ledge(x+435,185,130));
 if(j%2===0)l.winds.push({x:x+205,y:110,w:120,h:440});else l.platforms.push(moving(x+190,430,125,'x',140));
 if(j%3===0)l.platforms.push(ledge(x+60,425,48,'spring'));
 l.route.push(marker(x+130,440),marker(x+420,mid),marker(x+710,440));
 l.enemies.push(enemy(x+405,mid,j%2?'turtle':'goomba'));line(l,x+335,mid-55,5);line(l,x+445,140,3);l.pits.push([x+210,x+325],[x+540,x+650]);
}
function riverSector(l,x,j){
 l.platforms.push(ground(x,570,750),ledge(x,440,160,'pier'),ledge(x+590,440,160,'pier'),moving(x+185,460,190,'x',200,'boat'),ledge(x+340,360,125,j%2?'vanish':'ledge',{active:true,phase:j}));
 l.water.push({x,y:466,w:750,h:150});l.route.push(marker(x+75,440),marker(x+650,440));
 if(j%3===1){const id=l.switches.length;l.switches.push(sw(x+650,440,'上游灯 '+(j+1),'river'));l.route.push(marker(x+650,440,'switch:'+id));}
 l.enemies.push(enemy(x+400,525,'fish'));line(l,x+240,515,5);line(l,x+345,310,3);
}
function templeSector(l,x,j){
 if(j%3===1){l.platforms.push(ground(x,500,180),ledge(x+190,435,110,'crumble'),ledge(x+350,385,115,'crumble'),ledge(x+510,435,110,'crumble'),ground(x+650,500,100));l.route.push(marker(x+235,435),marker(x+400,385),marker(x+565,435),marker(x+710,500));}
 else{l.platforms.push(ground(x,500,180),ground(x+180,430,170),ground(x+350,360,180),ground(x+530,430,220));l.route.push(marker(x+245,430),marker(x+430,360),marker(x+700,430));}
 l.platforms.push(ledge(x+80,340,110),moving(x+550,310,100,'y',60,'lift'));line(l,x+355,310,4);
 l.enemies.push(enemy(x+95,500,j%2?'turtle':'goomba'));
 if(j===3||j===7){const surface=j%3===1?435:430,id=l.switches.length;l.switches.push(sw(x+245,surface,'镇墨钟 '+(j===3?'东':'西'),'temple'));l.route.splice(l.route.length-(j%3===1?3:2),0,marker(x+245,surface,'switch:'+id));}
}
function marketSector(l,x,j){
 l.platforms.push(ground(x,500,750),ledge(x+80,410,180,'awning'),ledge(x+320,320,220,'awning'),ledge(x+610,405,140,'awning'));
 l.route.push(marker(x+680,500));line(l,x+335,265,5);line(l,x+200,438,4);
 if([2,6,10].includes(j)){const id=l.switches.length;l.switches.push(sw(x+460,500,'归乡灯 '+(id+1),'market'));l.route.splice(l.route.length-1,0,marker(x+460,500,'switch:'+id));}
 if(j%4===3)l.enemies.push(enemy(x+400,320,'wisp'));
}
function caveSector(l,x,j){
 if(j===6){l.platforms.push(ground(x,500,750));for(let n=0;n<3;n++)l.switches.push(sw(x+100+n*160,500,['山','水','月'][n],'echo'));l.sequence={order:['月','山','水'],progress:0,solved:false};l.route.push(marker(x+420,500,'switch:2'),marker(x+100,500,'switch:0'),marker(x+260,500,'sequence'));l.gates.push({x:x+650,y:325,w:35,h:175,requirement:'sequence',open:false});}
 else{l.platforms.push(ground(x,500,180),ground(x+180,430,170),ground(x+350,400,200),ground(x+550,500,200));l.route.push(marker(x+240,430),marker(x+440,400),marker(x+680,500));}
 l.platforms.push(ledge(x+80,315,130),ledge(x+315,235,150));line(l,x+340,185,4);
 if(j%3===2){l.water.push({x:x+550,y:466,w:200,h:150});l.enemies.push(enemy(x+620,520,'fish'));}
 else l.enemies.push(enemy(x+80,500,j%2?'hopper':'goomba'));
}
function snowSector(l,x,j){
 l.platforms.push(ground(x,500,750,'ice'),ledge(x+180,405,150),ledge(x+420,320,190));l.route.push(marker(x+660,500));
 l.blizzards.push({x:x+200,y:160,w:360,h:340,direction:j%2?1:-1});l.fires.push({x:x+60,y:500});
 if([2,6,10].includes(j)){const id=l.switches.length;l.switches.push(sw(x+650,500,'避风灯 '+(id+1),'snow'));l.route.splice(l.route.length-1,0,marker(x+650,500,'switch:'+id));}
 l.enemies.push(enemy(x+420,500,j%3?'goomba':'turtle'));line(l,x+430,270,5);line(l,x+180,430,3);
}
function astralSector(l,x,j){
 l.platforms.push(ground(x,500,510),ground(x+650,500,100),ledge(x+90,405,140,'phase',{phaseKey:'sun'}),ledge(x+300,315,165,'phase',{phaseKey:'moon'}),ledge(x+525,405,125));l.pits.push([x+510,x+650]);
 l.route.push(marker(x+430,500),marker(x+705,500));l.gravityZones.push({x:x+150,y:70,w:350,h:440});l.phaseAnchors.push({x:x+65,y:450,w:32,h:50});
 if([2,6,10].includes(j)){const id=l.switches.length;l.switches.push(sw(x+420,500,'忆碑 '+(id+1),'astral'));l.route.splice(l.route.length-1,0,marker(x+420,500,'switch:'+id));}
 l.enemies.push(enemy(x+350,440,'wisp'));line(l,x+315,260,4);line(l,x+535,350,3);
}
function nearestSurface(l,x){
 const land=l.platforms.filter(b=>['ground','ice','island'].includes(b.type)&&b.w>=80);
 const under=land.filter(b=>x>=b.x+20&&x<b.x+b.w-40).sort((a,b)=>b.y-a.y)[0];
 const p=under||land.reduce((a,b)=>Math.abs((a.x+a.w/2)-x)<Math.abs((b.x+b.w/2)-x)?a:b);
 return {x:under?x:p.x+p.w/2,y:p.y};
}
function connections(l){
 const neighbors=WORLD_LINKS.filter(e=>e.includes(l.index)).map(e=>e.find(n=>n!==l.index));
 l.doors=neighbors.map((to,i)=>{const f=nearestSurface(l,i===0?260:i===neighbors.length-1?l.length-320:l.length*(.28+i*.12));return{x:f.x,y:f.y-58,w:44,h:58,to,room:null,name:'通往远方',requires:l.index===0&&to===5?'lantern':null};});
 l.hiddenRooms=[0,1].map(slot=>{const target=slot===0?(l.index<4?[1310,1450,1550,2500][l.index]:l.length*.28):l.length*.72;const f=nearestSurface(l,target);if(slot===0&&l.index===0)f.y=205;return {x:f.x,y:f.y-54,w:40,h:54,to:l.index,room:slot,name:['隐庐','旧井','水府','藏经阁','后巷','晶窟','雪屋','留白'][l.index]+(slot?'深处':'外间'),requires:slot===1?(['lantern','glide','lantern','echo','lantern','glide','warmth','echo'][l.index]):null,hidden:slot===1};});
 l.doors.push(...l.hiddenRooms);
 l.people=[{...nearestSurface(l,340),role:l.index===4?'artisan':l.index===2?'ferryman':l.index===3?'monk':l.index===6?'keeper':'guide'}].map(n=>({...n,y:n.y-44,w:32,h:44}));
 if(l.index===4){const f=nearestSurface(l,1040);l.people.push({x:f.x,y:f.y-44,w:32,h:44,role:'fox'});}
}
export function expandLevel(l){
 const old=[3600,3500,3750,4650],base=old[l.index]||0;
 l.baseLength=base;l.theme=l.theme||['forest','sky','river','temple'][l.index];l.length=REGION_LENGTHS[l.index];l.goal=l.length-160;l.goalY=l.index===1?440:500;
 l.route=[[[820,500],[1110,500],[1560,500],[2035,500,'npc'],[2500,500],[2970,500],[3440,500]],[[650,435],[1040,360],[1450,280],[1880,365],[2310,300],[2780,400],[3140,440],[3340,440]],[[1020,430,'switch:0'],[1780,395],[2570,440,'switch:1'],[3230,500],[3590,500]],[[1040,350,'switch:0'],[1250,410],[1510,500],[1790,405],[1910,365],[2050,400],[2530,300,'switch:1'],[2880,435],[3200,500],[3570,500],[4490,500]]][l.index]||[];
 l.fires=[];l.blizzards=[];l.gravityZones=[];l.phaseAnchors=[];l.resources=[];l.phase='sun';
 for(const gate of l.gates)if(gate.requirement==='switches')gate.switchIds=l.switches.map((_,i)=>i);
 if(l.index===3){const oldBossGate=l.gates.find(g=>g.requirement==='boss');oldBossGate.requirement='switches';oldBossGate.switchIds=[0,1];}
 if(base)for(const p of l.platforms)if(p.x<base&&p.x+p.w>base)p.w=base-p.x;
 const count=Math.floor((l.length-base-750)/750),sector=[forestSector,skySector,riverSector,templeSector,marketSector,caveSector,snowSector,astralSector][l.index];
 for(let j=0;j<count;j++){
   const x=base+j*750;sector(l,x,j);
   const f=nearestSurface(l,x+70);if(j%2===0)l.checkpoints.push(flag(f.x,f.y));
   l.resources.push({x:f.x+60,y:f.y-60,w:22,h:25,type:'paper',taken:false});
   l.sections.push({x,name:(['竹海回廊','云上驿路','月河上游','寺后栈道','灯影长街','泉音石廊','风雪归路','旧卷星廊'][l.index])+' · '+(j+1)});
   if(j%3===0)l.platforms.push(question(x+360,270,j%2?'mushroom':'flower'));
   if(j===3||j===8){const f2=nearestSurface(l,x+420);l.seals.push({x:f2.x,y:f2.y-62,w:26,h:30,name:['遗落的色','回家的光'][j===3?0:1],taken:false});}
 }
 const tail=base+count*750;l.platforms.push(ground(tail,l.goalY,l.length-tail+100));l.route.push(marker(tail+120,l.goalY));
 if(l.index===1)l.goalY=440;
 if(l.index===2||l.index===4||l.index===6)l.gates.push({x:l.length-500,y:320,w:35,h:180,requirement:'switches',switchIds:l.switches.map((_,i)=>i),open:false});
 if(l.index===3||l.index===7){
   const x=l.length-850;l.boss={x,y:410,w:82,h:90,homeX:x,hp:l.index===7?7:5,maxHp:l.index===7?7:5,active:false,defeated:false,invincible:0,clock:0,phase:'waiting',attackCycle:0,activateX:x-300};
   l.gates.push({x:l.length-400,y:290,w:35,h:210,requirement:'boss',open:false});
   if(l.index===3)l.gates.push({x:x-340,y:300,w:35,h:200,requirement:'switches',switchIds:l.switches.map((_,i)=>i),open:false});
   if(l.index===7)l.gates.push({x:x-340,y:300,w:35,h:200,requirement:'world',open:false});
   l.route.push(marker(x+27,410,'boss'));
 }
 l.route.push(marker(l.goal,l.goalY));
 if(l.seals.length===2){const f=nearestSurface(l,l.length*.45);l.seals.push({x:f.x,y:f.y-60,w:26,h:30,name:'街巷旧梦',taken:false});}
 const camp=nearestSurface(l,180);l.checkpoints.unshift(flag(camp.x,camp.y));
 connections(l);
 const hint={market:'灯市的匠人修得好灯，也补得好纸。探键交谈；屋檐上有不必走地面的另一条街。',cave:'晶石的次序刻在墙上：月、山、水。别怕走错，回声会等你重来。',snow:'冰面滑，先松手再转向。避风屋和营地能补纸；暖墨会让逆风变轻。',astral:'日页与月页重叠在同一幅画里。探键翻页，有些路只在另一页显现。'};
 l.triggers.push({x:l.length*.4,text:hint[l.theme]||'走得再远，也能从营地展开山河图。旧地域会记住被点亮的灯，新能力会照出旧路上的暗门。',seen:false});
}
export function makeHiddenRoom(info,area,slot){
 const length=1900+area*75+slot*200,l={...info,index:area,theme:info.theme||['forest','sky','river','temple'][area],roomSlot:slot,roomKey:`${area}:${slot}`,name:(slot?'记忆深处':'隐秘外间')+' · '+info.name,length,platforms:[],coins:[],enemies:[],pits:[],spikes:[],seals:[],switches:[],gates:[],winds:[],water:[],portals:[],checkpoints:[flag(160,500)],sections:[{x:0,name:'未绘之处'}],goal:length+500,goalY:500,npc:null,boss:null,people:[],doors:[],hiddenRooms:[],fires:[],blizzards:[],gravityZones:[],phaseAnchors:[],resources:[],triggers:[],route:[],phase:'sun',isRoom:true};
 const style=(area+slot)%4;
 if(style===0){l.platforms=[ground(0,500,650),ground(800,500,length-800),ledge(380,400,140),ledge(610,310,130,'crumble'),ledge(835,230,170),ledge(1090,325,170)];l.route=[[500,500],[900,500],[1400,500]];l.pits=[[650,800]];}
 if(style===1){l.platforms=[ground(0,500,390),ground(540,420,240),ground(930,340,270),ground(1330,420,length-1330),ledge(275,485,48,'spring'),moving(780,400,130,'x',110)];l.route=[[640,420],[1040,340],[1480,420]];}
 if(style===2){l.platforms=[ground(0,500,400),ground(400,570,length-800),ground(length-400,500,400),ledge(850,400,180,'pier'),moving(450,460,180,'x',200,'boat')];l.water=[{x:400,y:466,w:length-800,h:150}];l.route=[[940,400],[length-270,500]];}
 if(style===3){l.platforms=[ground(0,500,470),ground(470,430,260),ground(730,355,260),ground(990,430,290),ground(1270,500,length-1270),ledge(1040,250,150)];l.route=[[580,430],[840,355],[1140,430],[length-270,500]];}
 const end=l.platforms.filter(p=>['ground','ice'].includes(p.type)&&p.x+p.w>=length-200).at(-1);l.memory={x:length-235,y:end.y-70,w:30,h:34,key:`${area}:${slot}`,text:MEMORY_TEXTS[area][slot],taken:false};
 for(let i=0;i<2;i++){const f=nearestSurface(l,300+i*(length-700));l.switches.push(sw(f.x,f.y,['记忆灯 · 昔','记忆灯 · 今'][i],'room'));}
 l.doors=[{x:130,y:442,w:44,h:58,to:area,room:null,returnFromRoom:true,name:'回到原来的路'},{x:length-120,y:end.y-58,w:44,h:58,to:area,room:null,returnFromRoom:true,name:'回到原来的路'}];
 l.resources.push({x:230,y:425,w:22,h:25,type:'paper',taken:false});line(l,260,425,5);line(l,960,300,5);
 l.story='这里收藏的不是宝物，是被主画卷擦掉的一小段记忆。点亮两盏昔今灯，再去读那页旧纸。';l.hint='可以随时从入口返回；记忆和灯火会保存，不必一次找完。';l.subtitle='隐藏空间 · '+(slot?'记忆深处':'隐秘外间');
 l.checkpoint=160;return l;
}
