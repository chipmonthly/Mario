// World state is serializable. Runtime physics objects and DOM nodes never enter saves.
export const WORLD_VERSION=1;
export const REGION_LENGTHS=[13000,12900,13150,14500,12400,12600,13200,14600];
export const ABILITIES={bridge:'折纸桥',lantern:'照影灯',glide:'御风纸鸢',lotus:'莲步渡水',echo:'回声读碑',warmth:'暖墨护身'};
export const REGION_POSITIONS=[[17,57],[36,19],[51,75],[73,46],[35,54],[61,93],[60,14],[88,20]];
export const WORLD_LINKS=[[0,4],[0,1],[0,5],[1,6],[1,3],[4,2],[4,6],[4,5],[2,5],[2,3],[3,7],[5,7],[6,7]];
export const NEXT_REGION=[1,6,3,7,2,2,7,0];
export const REGION_GIFTS=[null,'glide','lotus',null,'lantern','echo','warmth',null];
export const QUESTS=[
 {id:'letter',name:'一封晚了三十年的信',description:'在云驿找到未送出的家书，再交给月河摆渡人。',reward:'莲步渡水',from:1,to:2},
 {id:'fox-name',name:'阿砚真正的名字',description:'救出纸狐，收集三片暗室记忆，再去夜市询问阿砚。',reward:'纸张上限 +3，解锁纸狐往事',from:0,to:4},
 {id:'blank-name',name:'石碑上的空白',description:'学会溶洞回声后回访古寺，听老僧说完画师的故事。',reward:'星河守卫墨障减少两层',from:5,to:3},
 {id:'home-lamp',name:'把一盏灯带回雪里',description:'在灯市取得照影灯，再探访霜岭的守灯人。',reward:'暖墨护身，开启霜岭暗室',from:4,to:6},
];
export const MEMORY_TEXTS=[
 ['阿砚原是画师给女儿折的第一只纸狐。它忘了名字，却一直记得回家的竹林。','画师在井壁写道：我不愿她离开，于是擦掉了那条通往山外的路。'],
 ['一封没有寄出的信：爹，我不是不回家。我只是想把海的颜色带给你。','云驿最后一笔投递记录停在三十年前。寄件人的名字，叫疏桐。'],
 ['摆渡人每天都留一个空座。那是女儿第一次独自过河时，坐过的地方。','月河从来没有忘记归路。忘记的，是不肯让船离岸的人。'],
 ['老僧不是外人。他曾替画师磨墨，亲眼看见第一道擦去的远山。','墨魇捧着一张泛黄的画。上面只有一个孩子的笑脸，没有怪物。'],
 ['匠人的灯里装着远行人的归期。他知道有些灯等不到人，也还是每晚点亮。','阿砚终于想起：疏桐叫它“小砚”，说等看过海，就来接它。'],
 ['石壁的回声不是预言。它只是把被擦掉的声音，一句句保存了下来。','最后一句回声：爹，请别把空白填满。我还想画上新的山。'],
 ['守灯人替每位上山的人留一碗热茶。她说，等待不是把门锁上。','雪地里的脚印向山外延伸。那一年，疏桐真的走出了这幅画。'],
 ['留白不是被遗忘的地方。它是给尚未归来的故事，留的一扇窗。','画卷背面写着：愿她去远方，也愿她知道，回家的灯一直亮着。'],
];
export function freshWorld(){return {version:WORLD_VERSION,current:0,room:null,visited:[0],completed:[],areas:{},returnPoints:{},memories:[],quests:{},abilities:{bridge:true},paper:4,paperMax:6,wallet:0,npcFlags:{},lastCamp:{area:0,x:140,y:500},lastPosition:{area:0,room:null,x:140,y:462},ending:null,health:3,time:0,playerCount:1,powers:[0,0]};}
export function normalizeWorld(value){
 const w=freshWorld();if(!value||value.version!==WORLD_VERSION)return w;
 w.current=Number.isInteger(value.current)&&value.current>=0&&value.current<8?value.current:0;
 w.room=Number.isInteger(value.room)&&value.room>=0&&value.room<2?value.room:null;
 w.visited=[...new Set([0,...(Array.isArray(value.visited)?value.visited:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<8)])];
 w.completed=[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<8))];
 for(const name of ['areas','quests','npcFlags'])if(value[name]&&typeof value[name]==='object'&&!Array.isArray(value[name]))w[name]=value[name];
 if(value.returnPoints&&typeof value.returnPoints==='object')for(const [key,p] of Object.entries(value.returnPoints)){if(/^[0-7]:[01]$/.test(key)&&p&&Number.isFinite(p.x)&&Number.isFinite(p.y))w.returnPoints[key]={x:Math.max(0,Math.min(REGION_LENGTHS[+key[0]],p.x)),y:Math.max(50,Math.min(570,p.y))};}
 w.memories=[...new Set((Array.isArray(value.memories)?value.memories:[]).filter(s=>/^\d:[01]$/.test(s)&&+s[0]<8))];
 for(const ability of Object.keys(ABILITIES))w.abilities[ability]=ability==='bridge'||value.abilities?.[ability]===true;
 w.paperMax=Math.max(6,Math.min(12,+value.paperMax||6));w.paper=Math.max(0,Math.min(w.paperMax,+value.paper||0));w.wallet=Math.max(0,Math.min(9999,+value.wallet||0));
 for(const name of ['lastCamp','lastPosition']){const p=value[name];if(p&&Number.isInteger(p.area)&&p.area>=0&&p.area<8&&Number.isFinite(p.x)&&Number.isFinite(p.y))w[name]={area:p.area,room:Number.isInteger(p.room)?p.room:null,x:Math.max(0,Math.min(REGION_LENGTHS[p.area],p.x)),y:Math.max(30,Math.min(570,p.y))};}
 w.health=Math.max(1,Math.min(5,+value.health||3));w.time=Math.max(0,Math.min(999999,+value.time||0));w.playerCount=value.playerCount===2?2:1;w.powers=[0,1].map(i=>Math.max(0,Math.min(2,+value.powers?.[i]||0)));
 if(['leave-white','open-scroll'].includes(value.ending))w.ending=value.ending;return w;
}
export function worldKey(area,room=null){return room===null?String(area):`${area}:${room}`;}
export function questStage(w,id){
 if(w.quests[id])return '已完成';
 if(id==='letter')return w.completed.includes(1)?'家书已找到 · 去月河交信':'先去云驿找信';
 if(id==='fox-name')return w.npcFlags.fox&&w.memories.length>=3?'线索齐了 · 去夜市见阿砚':`纸狐${w.npcFlags.fox?'已救出':'待寻找'} · 记忆 ${Math.min(3,w.memories.length)}/3`;
 if(id==='blank-name')return w.abilities.echo?'回声已学会 · 回古寺问老僧':'先去溶洞学会回声';
 return w.abilities.lantern?'提灯回访霜岭守灯人':'先去灯市寻照影灯';
}
export function npcDialogue(game,npc){
 const w=game.world,chapter=game.chapter;
 if(npc.role==='guide')return {speaker:'纸鹤 · 山河引路人',text:'这里不再是只能向右的一条路。路牌与纸门通向别的地域，红旗会记住你的脚步。按 Q 或「造」可折一座桥；在营地打开山河图，可以回到已点亮的营地。',choices:[{id:'rest',label:'歇脚补纸（免费）'},{id:'map',label:'展开山河图'},{id:'leave',label:'继续走走'}]};
 if(npc.role==='artisan')return {speaker:'灯市匠人 · 阿灯',text:w.abilities.lantern?'照影灯会照出那些被擦掉的门。补过的纸桥也能成为你的路；回竹林的旧井看看吧。':'我修的不是灯，是一个人愿意回头的念想。六枚铜钱，替你点亮照影灯；它能找到普通目光看不见的暗室。',choices:[{id:'lantern',label:w.abilities.lantern?'照影灯已修好':'修照影灯 · 6 铜钱',disabled:!!w.abilities.lantern},{id:'paper',label:'补三张纸 · 2 铜钱'},{id:'bridge-upgrade',label:'加固纸桥 · 8 铜钱'},{id:'leave',label:'先看看夜市'}]};
 if(npc.role==='fox')return {speaker:'纸狐阿砚',text:w.quests['fox-name']?'原来我叫小砚。她说等看过海就来接我……我想在这里等，也想陪你多看几处山河。':w.memories.length>=3&&w.npcFlags.fox?'这些旧纸片……我好像听见了自己的名字。你能陪我，把它读出来吗？':'我记得竹笛的调子，却忘了谁曾吹给我听。暗室里的记忆，也许能帮我找回名字。',choices:[{id:'fox-name',label:questStage(w,'fox-name'),disabled:!!w.quests['fox-name']||!w.npcFlags.fox||w.memories.length<3},{id:'leave',label:'我会继续找'}]};
 if(npc.role==='ferryman')return {speaker:'月河摆渡人',text:w.quests.letter?'她去看海了，不是忘了回家。谢谢你。我会让这条河，记住每一位远行人。':w.completed.includes(1)?'这是云驿压了三十年的家书？字迹还是她小时候的样子……请念给我听。':'我每天多留一个船座。若你去云驿，能替我看看有没有一封写给渡口的信吗？',choices:[{id:'letter',label:w.quests.letter?'家书已交付':w.completed.includes(1)?'交出未送达的家书':'还没有找到家书',disabled:!!w.quests.letter||!w.completed.includes(1)},{id:'leave',label:'先去河上看看'}]};
 if(npc.role==='monk')return {speaker:'古寺老僧',text:w.quests['blank-name']?'疏桐离开后，画师擦去了山外的路。墨魇只是替他守着不敢面对的空白。带着这句话去星河吧：爱一个人，不是把她留在画里。':w.abilities.echo?'你听见了石壁最后的回声？那我也该说完这个故事。': '两口钟能开山门，不能解心结。溶洞保留着被擦去的声音，学会回声，再来问我空白上的名字。',choices:[{id:'blank-name',label:questStage(w,'blank-name'),disabled:!!w.quests['blank-name']||!w.abilities.echo},{id:'leave',label:'记住这句话'}]};
 if(npc.role==='keeper')return {speaker:'霜岭守灯人',text:w.quests['home-lamp']?'灯很暖。你穿过的风雪，也会记得这份暖。旧狐窟的冰封，现在可以化开了。':w.abilities.lantern?'你带来的灯，像极了从前那盏。愿意替我把它放到风口吗？':'寒风会让纸变脆。去灯市修一盏照影灯，再回来吧；我给你一杯热茶，也有一条旧路要托付。',choices:[{id:'home-lamp',label:questStage(w,'home-lamp'),disabled:!!w.quests['home-lamp']||!w.abilities.lantern},{id:'rest',label:'喝茶歇脚（免费）'},{id:'leave',label:'再去雪中走走'}]};
 return {speaker:npc.name||'旧卷中的人',text:chapter===7?'有些颜色要找回来，有些空白值得保留。等你听完七方山河的故事，再决定如何落下最后一笔。':'世界会记住你点亮的灯，也会记住你愿意回来的路。',choices:[{id:'rest',label:'歇脚补纸（免费）'},{id:'leave',label:'继续探索'}]};
}
