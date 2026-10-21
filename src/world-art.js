const TAU=Math.PI*2,font='"Noto Serif CJK SC", "Songti SC", serif';
export function drawZones(c,l,t){
  for(const w of l.winds){
    const wash=c.createLinearGradient(w.x,0,w.x+w.w,0);wash.addColorStop(0,'#edf4e500');wash.addColorStop(.5,'#f3f8e4a0');wash.addColorStop(1,'#edf4e500');c.fillStyle=wash;c.fillRect(w.x,w.y,w.w,w.h);
    c.strokeStyle='#799a8d65';c.lineWidth=1.5;
    for(let i=0;i<8;i++){const x=w.x+15+i*w.w/8,y=w.y+w.h-((t*85+i*57)%w.h);c.beginPath();c.moveTo(x,y+25);c.quadraticCurveTo(x+15,y+9,x,y-13);c.stroke();c.beginPath();c.moveTo(x-5,y-6);c.lineTo(x,y-13);c.lineTo(x+5,y-6);c.stroke();}
    c.fillStyle='#617e71';c.font=`12px ${font}`;c.fillText('借 风 ↑',w.x+18,w.y+22);
  }
  for(const w of l.water){
    const g=c.createLinearGradient(0,w.y,0,600);g.addColorStop(0,'#8bb5b377');g.addColorStop(1,'#507c8999');c.fillStyle=g;c.fillRect(w.x,w.y,w.w,w.h);
    c.strokeStyle='#ecf1df88';c.lineWidth=1;
    for(let i=0;i<40;i++){const x=w.x+(i*87)%w.w,y=w.y+24+(i%5)*22;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+18,y-3,x+45,y);c.stroke();}
    c.fillStyle='#d9e9db88';for(let i=0;i<18;i++){const x=w.x+85+i*137,y=w.y+110-((t*12+i*19)%100);c.beginPath();c.arc(x,y,2+i%3,0,TAU);c.fill();}
  }
}
export function waterSurface(c,l,t){for(const w of l.water){c.strokeStyle='#e5efdcbb';c.lineWidth=2;c.beginPath();for(let x=0;x<w.w;x+=8)c.lineTo(w.x+x,w.y+Math.sin(x*.04+t*2)*3);c.stroke();}}
export function specialPlatform(c,b,t){
  if(b.type==='paperBridge'){
    c.fillStyle='#e8ddbb';c.strokeStyle='#a4a784';c.lineWidth=1.2;c.fillRect(0,0,b.w,b.h);c.strokeRect(0,0,b.w,b.h);c.setLineDash([4,3]);c.beginPath();c.moveTo(0,7);c.lineTo(b.w,7);c.stroke();for(let x=20;x<b.w;x+=25){c.beginPath();c.moveTo(x,1);c.lineTo(x-8,b.h);c.stroke();}return true;
  }
  if(b.type==='phase'){c.globalAlpha=b.phaseActive===false?.18:.8;c.fillStyle=b.phaseKey==='sun'?'#bba56b':'#8b9db3';c.fillRect(0,0,b.w,b.h);c.strokeStyle='#6e7b7c';c.setLineDash(b.phaseActive===false?[5,4]:[]);c.strokeRect(0,0,b.w,b.h);return true;}
  if(b.type==='ice'){c.fillStyle='#c3d8cf';c.fillRect(0,0,b.w,b.h);c.fillStyle='#edf2e6';c.fillRect(0,0,b.w,7);c.strokeStyle='#8daea388';for(let x=0;x<b.w;x+=50){c.beginPath();c.moveTo(x,15);c.lineTo(x+30,40);c.lineTo(x+20,75);c.stroke();}return true;}
  if(b.type==='awning'){c.fillStyle='#a96e4f';c.fillRect(0,0,b.w,b.h);c.strokeStyle='#d8bf8d';c.lineWidth=2;for(let x=12;x<b.w;x+=26){c.beginPath();c.moveTo(x,1);c.lineTo(x-5,20);c.stroke();}return true;}

  if(b.type==='island'){
    c.fillStyle='#839c90';c.beginPath();c.moveTo(0,0);c.lineTo(b.w,0);c.lineTo(b.w-17,23);c.lineTo(b.w*.6,49);c.lineTo(b.w*.47,65);c.lineTo(18,25);c.closePath();c.fill();c.fillStyle='#c2d3bb';c.fillRect(0,0,b.w,8);c.strokeStyle='#536f6577';for(let i=20;i<b.w-10;i+=30){c.beginPath();c.moveTo(i,10);c.lineTo(i-12,27);c.stroke();}return true;
  }
  if(b.type==='spring'){
    c.fillStyle='#60815c';c.fillRect(0,0,b.w,7);c.strokeStyle='#8c9d65';c.lineWidth=3;c.beginPath();c.moveTo(8,8);c.lineTo(b.w-10,12);c.lineTo(10,16);c.lineTo(b.w-8,20);c.stroke();c.fillStyle='#788957';c.fillRect(-3,19,b.w+6,4);c.fillStyle='#486d46';c.font=`12px ${font}`;c.fillText('↑',b.w/2-5,-8);return true;
  }
  if(b.kind==='boat'){
    c.fillStyle='#948469';c.beginPath();c.moveTo(-8,0);c.lineTo(b.w+8,0);c.lineTo(b.w-12,24);c.quadraticCurveTo(b.w/2,35,12,24);c.closePath();c.fill();c.strokeStyle='#625e4a';c.stroke();c.fillStyle='#c6b58c';c.fillRect(0,0,b.w,5);c.strokeStyle='#786f54';c.lineWidth=3;c.beginPath();c.moveTo(30,-1);c.lineTo(30,-56);c.stroke();c.fillStyle='#b56850';c.beginPath();c.moveTo(32,-55);c.lineTo(72,-37);c.lineTo(32,-19);c.fill();return true;
  }
  if(b.kind==='lotus'){
    c.fillStyle='#829c70';c.beginPath();c.ellipse(b.w/2,8,b.w/2,11,0,0,TAU);c.fill();c.strokeStyle='#576f4c';c.beginPath();c.moveTo(3,4);c.lineTo(b.w/2,9);c.lineTo(b.w-7,3);c.stroke();return true;
  }
  if(b.type==='pier'){
    c.fillStyle='#8a8069';c.fillRect(0,0,b.w,b.h);c.fillStyle='#b3a585';c.fillRect(0,0,b.w,5);c.strokeStyle='#6d6f5a';c.lineWidth=3;for(let x=12;x<b.w;x+=35){c.beginPath();c.moveTo(x,19);c.lineTo(x,130);c.stroke();}return true;
  }
  if(b.type==='crumble'){
    if(b.fallen>0){c.globalAlpha=.16;c.setLineDash([4,5]);c.strokeStyle='#6b7058';c.strokeRect(0,0,b.w,b.h);return true;}
    c.translate(b.crack?Math.sin(t*55)*2:0,0);c.fillStyle='#b2ad94';c.fillRect(0,0,b.w,b.h);c.strokeStyle=b.crack?'#a24f3e':'#7d8067';c.lineWidth=1.5;c.strokeRect(0,0,b.w,b.h);c.beginPath();c.moveTo(b.w*.4,0);c.lineTo(b.w*.5,7);c.lineTo(b.w*.44,13);c.lineTo(b.w*.62,20);c.stroke();return true;
  }
  if(b.kind==='lift'){c.strokeStyle='#6c756080';c.lineWidth=1.5;c.setLineDash([4,4]);c.beginPath();c.moveTo(10,-230);c.lineTo(10,190);c.moveTo(b.w-10,-230);c.lineTo(b.w-10,190);c.stroke();c.setLineDash([]);}
  return false;
}
export function drawFeatures(c,g,t){
  const l=g.level;
  for(const s of l.seals){if(s.taken)continue;c.save();c.translate(s.x+13,s.y+15+Math.sin(t*2)*4);c.shadowBlur=16;c.shadowColor='#d7c076';c.fillStyle='#bd9550';c.rotate(Math.PI/4);c.fillRect(-12,-12,24,24);c.strokeStyle='#fbefc3';c.strokeRect(-9,-9,18,18);c.rotate(-Math.PI/4);c.shadowBlur=0;c.fillStyle='#f9f1d4';c.font=`15px ${font}`;c.textAlign='center';c.fillText('印',0,6);c.restore();}
  for(const p of l.portals){c.save();c.translate(p.x,p.y);c.fillStyle='#e9dfc6a6';c.fillRect(0,0,40,53);c.strokeStyle='#a65c4999';c.lineWidth=3;c.strokeRect(1,1,38,51);c.strokeStyle='#8b9c7788';c.lineWidth=1;c.beginPath();c.moveTo(20,0);c.lineTo(20,53);c.moveTo(0,26);c.lineTo(40,26);c.stroke();c.fillStyle='#9d5949';c.font=`11px ${font}`;c.fillText('↓ 入',8,39);c.fillText('纸门',5,-10);c.restore();}
  if(l.npc&&!l.npc.rescued){const n=l.npc;c.save();c.translate(n.x+18,n.y+20);c.fillStyle='#d6aa78';c.beginPath();c.moveTo(-17,17);c.quadraticCurveTo(-30,2,-23,-12);c.lineTo(-8,8);c.fill();c.fillStyle='#e5d7ac';c.beginPath();c.moveTo(-12,-11);c.lineTo(-13,-25);c.lineTo(-2,-15);c.lineTo(9,-25);c.lineTo(12,-7);c.lineTo(4,14);c.lineTo(-7,14);c.closePath();c.fill();c.fillStyle='#504e3c';c.fillRect(-6,-10,2,3);c.fillRect(4,-10,2,3);c.fillStyle='#a65d43';c.font=`10px ${font}`;c.fillText('阿砚',-10,-35);c.restore();}
  for(const s of l.switches){c.save();c.translate(s.x+18,s.y+48);const color=s.active?'#c48a45':'#708479';c.strokeStyle='#5e6e5b';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,-52);c.stroke();c.fillStyle=color;c.beginPath();if(l.theme==='temple'||l.theme==='cave'){c.moveTo(-15,-20);c.quadraticCurveTo(-12,-50,0,-50);c.quadraticCurveTo(12,-50,15,-20);c.closePath();}else c.ellipse(0,-30,14,20,0,0,TAU);c.fill();if(s.active){c.shadowBlur=24;c.shadowColor='#eed38e';c.fillStyle='#f5df97';c.beginPath();c.arc(0,-31,7,0,TAU);c.fill();}c.shadowBlur=0;c.fillStyle=s.active?'#a36f37':'#596d60';c.font=`11px ${font}`;c.textAlign='center';c.fillText(s.name+(s.active?' ✓':''),0,-66);c.restore();}
  for(const gate of l.gates){c.save();c.translate(gate.x,gate.y);if(gate.open)c.globalAlpha=.18;c.fillStyle='#8a6b56';c.fillRect(-8,0,gate.w+16,12);c.fillStyle='#a8674e';c.fillRect(0,10,gate.w,gate.h-10);c.strokeStyle='#574f42';c.lineWidth=2;for(let x=5;x<gate.w;x+=9){c.beginPath();c.moveTo(x,14);c.lineTo(x,gate.h);c.stroke();}c.fillStyle='#e7d6ad';c.font=`12px ${font}`;c.fillText(gate.open?'开':'封',gate.w/2-6,45);c.restore();}
  if(l.boss&&!l.boss.defeated){const b=l.boss;c.save();c.translate(b.x+41,b.y+45);if(b.invincible>0)c.globalAlpha=.6;if(b.phase==='warning'){c.fillStyle='#b951352b';c.beginPath();c.ellipse(0,43,160,14,0,0,TAU);c.fill();c.fillStyle='#a84632';c.font=`15px ${font}`;c.textAlign='center';c.fillText('墨浪将至 · 跃！',0,-75);}
    c.fillStyle='#354f4c';c.beginPath();for(let i=0;i<=36;i++){const a=i*TAU/36,r=42+Math.sin(i*3.7+t*2)*4;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.fill();c.fillStyle='#536a5c';c.beginPath();c.moveTo(-30,-29);c.lineTo(-29,-57);c.lineTo(-7,-35);c.lineTo(20,-53);c.lineTo(30,-23);c.fill();c.fillStyle='#f1d9a0';c.fillRect(-21,-8,13,8);c.fillRect(9,-8,13,8);c.fillStyle='#2c3e38';c.fillRect(-14,-8,4,7);c.fillRect(10,-8,4,7);c.strokeStyle='#c4b98b';c.lineWidth=2;c.beginPath();c.moveTo(-13,20);c.quadraticCurveTo(0,26,14,18);c.stroke();c.restore();}
  for(const h of g.hazards){c.fillStyle='#49635caa';c.beginPath();c.moveTo(h.x,h.y+h.h);c.quadraticCurveTo(h.x+15,h.y-14,h.x+30,h.y+h.h);c.fill();}
}

export function drawWorld(c,g,t,chapters){
 if(!g.isWorld)return;const l=g.level,w=g.world;
 if(!l.isRoom&&l.theme==='market')for(const roof of l.platforms.filter(p=>p.type==='awning')){
   c.fillStyle='#a48e6e44';c.fillRect(roof.x+8,roof.y+20,roof.w-16,500-roof.y-20);c.strokeStyle='#8b87615c';c.lineWidth=2;for(let x=roof.x+20;x<roof.x+roof.w-10;x+=45){c.strokeRect(x,roof.y+40,25,35);}c.fillStyle='#997855';c.font=`14px ${font}`;c.fillText(['茶','纸','灯'][Math.floor(roof.x/750)%3],roof.x+roof.w/2-7,roof.y+80);
 }
 for(const storm of l.blizzards||[]){c.strokeStyle='#e8f0e1a0';c.lineWidth=1.5;for(let i=0;i<9;i++){const x=storm.x+((i*47+t*70*storm.direction)%storm.w+storm.w)%storm.w,y=storm.y+55+i*27;c.beginPath();c.moveTo(x,y);c.lineTo(x+storm.direction*35,y+3);c.stroke();}}
 for(const z of l.gravityZones||[]){c.strokeStyle='#bcc7d744';c.lineWidth=1;c.beginPath();c.ellipse(z.x+z.w/2,z.y+z.h/2,z.w/2,z.h/2,0,0,TAU);c.stroke();}

 for(const r of l.resources||[])if(!r.taken){c.save();c.translate(r.x,r.y+Math.sin(t*2)*3);c.fillStyle='#f3e7c9';c.fillRect(0,0,22,25);c.strokeStyle='#9e9d77';c.strokeRect(0,0,22,25);c.strokeStyle='#899570';c.beginPath();c.moveTo(5,7);c.lineTo(17,7);c.moveTo(5,12);c.lineTo(15,12);c.stroke();c.restore();}
 for(const d of l.doors||[]){
   const locked=d.requires&&!w.abilities[d.requires];c.save();c.translate(d.x,d.y);
   if(d.hidden&&locked)c.globalAlpha=.22;
   c.fillStyle=d.room!==null?'#dcceb28c':'#a3b7a057';c.fillRect(0,0,d.w,d.h);c.strokeStyle=locked?'#9e9984':d.room!==null?'#ac8257':'#607e69';c.lineWidth=2;c.strokeRect(0,0,d.w,d.h);
   c.beginPath();c.moveTo(d.w/2,1);c.lineTo(d.w/2,d.h-1);c.moveTo(1,d.h*.42);c.lineTo(d.w-1,d.h*.42);c.stroke();c.fillStyle=locked?'#8e8e78':'#7e6749';c.font=`14px ${font}`;c.textAlign='center';c.fillText(locked?'？':d.returnFromRoom?'归':d.room!==null?'隐':'路',d.w/2,39);c.font=`9px ${font}`;c.fillText(d.returnFromRoom?'返回原路':d.room!==null?locked?'待照之门':d.name:chapters[d.to].name,d.w/2,-9);c.restore();
 }
 for(const n of l.people||[]){
   if(n.role==='fox'&&!w.npcFlags.fox)continue;c.save();c.translate(n.x+16,n.y+44);
   c.fillStyle=n.role==='artisan'?'#9b6650':n.role==='monk'?'#968567':'#6c8872';c.beginPath();c.moveTo(-12,-30);c.lineTo(10,-30);c.lineTo(17,-2);c.lineTo(-16,-2);c.closePath();c.fill();c.fillStyle='#ddc598';c.beginPath();c.arc(0,-37,9,0,TAU);c.fill();c.fillStyle='#65725b';c.beginPath();c.moveTo(-15,-41);c.lineTo(15,-41);c.lineTo(0,-51);c.closePath();c.fill();c.fillStyle='#746b52';c.fillRect(-10,-2,8,4);c.fillRect(4,-2,8,4);c.fillStyle='#587151';c.font=`9px ${font}`;c.textAlign='center';c.fillText(({guide:'纸鹤',artisan:'灯市匠人',fox:'阿砚',ferryman:'摆渡人',monk:'老僧',keeper:'守灯人'})[n.role],0,-60);c.fillText('↓',0,-75+Math.sin(t*2)*3);c.restore();
 }
 for(const f of l.fires||[]){c.save();c.translate(f.x,f.y);c.fillStyle='#99846a';c.fillRect(-14,-8,28,8);c.fillStyle='#b87540';c.beginPath();c.moveTo(-9,-7);c.quadraticCurveTo(-12,-25,1,-38-Math.sin(t*8)*3);c.quadraticCurveTo(12,-20,9,-7);c.fill();c.fillStyle='#ead68c';c.beginPath();c.ellipse(0,-13,4,8,0,0,TAU);c.fill();c.restore();}
 for(const a of l.phaseAnchors||[]){c.fillStyle=l.phase==='sun'?'#c0a56e':'#8a9eb6';c.fillRect(a.x,a.y,a.w,a.h);c.strokeStyle='#7d8b7a';c.strokeRect(a.x,a.y,a.w,a.h);c.fillStyle='#f2ecd4';c.font=`15px ${font}`;c.fillText(l.phase==='sun'?'日':'月',a.x+8,a.y+26);}
 if(l.memory&&!l.memory.taken){const m=l.memory;c.save();c.translate(m.x+15,m.y+17+Math.sin(t*2)*3);c.shadowBlur=18;c.shadowColor='#e1cb83';c.fillStyle='#e7d4a4';c.fillRect(-15,-17,30,34);c.shadowBlur=0;c.strokeStyle='#b39460';c.strokeRect(-15,-17,30,34);c.fillStyle='#9b7148';c.font=`19px ${font}`;c.textAlign='center';c.fillText('忆',0,8);c.font=`9px ${font}`;c.fillText(l.switches.every(s=>s.active)?'旧纸上的记忆':'两灯照昔今',0,-29);c.restore();}
}
export function drawWeather(c,l,t,cam,width){
 if(l.theme==='snow'){
   c.fillStyle='#f9f9ebaa';for(let i=0;i<55;i++){const x=((i*109+t*25-cam*.3)%(width+40)+width+40)%(width+40)-20,y=(i*57+t*31)%600;c.beginPath();c.arc(x,y,1+i%3*.5,0,TAU);c.fill();}
 }
 if(l.theme==='astral'){
   for(let i=0;i<32;i++){c.fillStyle=i%3?'#e8e4ba88':'#c2cedfbb';const x=((i*163-cam*.1)%(width+30)+width+30)%(width+30),y=40+i*71%430;c.beginPath();c.arc(x,y,1.3+Math.sin(t+i)*.4,0,TAU);c.fill();}
 }
 if(l.theme==='market')for(let i=0;i<8;i++){const x=(i*227-cam*.2+width*8)%(width+150)-50,y=100+i%3*28;c.strokeStyle='#917f6366';c.beginPath();c.moveTo(x,0);c.lineTo(x,y);c.stroke();c.fillStyle='#b5775666';c.beginPath();c.ellipse(x,y,12,17,0,0,TAU);c.fill();}
}
