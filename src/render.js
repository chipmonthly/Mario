import {W,H,FLOOR,CHAPTERS,clamp,makeLevel} from './engine.js';
import {drawZones,drawFeatures,waterSurface,specialPlatform,drawWorld,drawWeather} from './world-art.js';
const TAU=Math.PI*2;
const serif='"Noto Serif SC", "Noto Serif CJK SC", "Songti SC", STSong, serif';
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.time=0;this.scenes=new Map();this.grain=this.createGrain();}
  createGrain(){const c=document.createElement('canvas');c.width=280;c.height=150;const ctx=c.getContext('2d'),d=ctx.createImageData(280,150),r=rng(318);for(let i=0;i<d.data.length;i+=4){const n=r()*100;d.data[i]=d.data[i+1]=d.data[i+2]=n;d.data[i+3]=r()*12;}ctx.putImageData(d,0,0);return c;}
  mountain(ctx,x,y,w,h,color,seed){
    const r=rng(seed);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);
    const points=[];for(let i=0;i<=32;i++){const t=i/32;const peak=Math.sin(t*Math.PI)**1.2;const yy=y-peak*h*(.74+r()*.26);points.push([x+t*w,yy]);ctx.lineTo(x+t*w,yy);}ctx.lineTo(x+w,y+20);ctx.closePath();ctx.fill();
    ctx.save();ctx.clip();ctx.globalAlpha=.12;ctx.strokeStyle='#3e594a';ctx.lineWidth=.7;
    for(let i=0;i<60;i++){const sx=x+r()*w;ctx.beginPath();ctx.moveTo(sx,y-h*.7+r()*h*.3);ctx.bezierCurveTo(sx-20,y-h*.35,sx+30,y-h*.2,sx-45,y+15);ctx.stroke();}ctx.restore();
  }
  background(ctx,index,cam,time,width=W){
    const info=CHAPTERS[index],p=info.palette;
    let grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,p[0]);grad.addColorStop(.7,index===2?'#e7e9df':'#f2f1e3');grad.addColorStop(1,p[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,width,H);
    // A faded cinnabar sun, scattered ink birds, and layered mountains.
    ctx.save();ctx.globalAlpha=index===2?.62:.24;ctx.fillStyle=index===2?'#faf5df':'#bd7057';ctx.beginPath();ctx.arc(819-cam*.045,111,index===2?39:44,0,TAU);ctx.fill();ctx.restore();
    for(let layer=0;layer<3;layer++){
      const r=rng(info.seed+layer*74),spacing=layer===0?410:350,offset=cam*(.055+layer*.065);
      for(let i=-1;i<18;i++){
        const x=i*spacing-offset,y=315+layer*58,h=135+r()*130-layer*10,w=420+r()*190;
        if(x>width+100||x+w< -100)continue;
        ctx.globalAlpha=[.48,.40,.28][layer];this.mountain(ctx,x,y,w,h,p[layer+1],info.seed+i*7+layer*13);
      }
    }
    ctx.globalAlpha=1;
    let mist=ctx.createLinearGradient(0,260,0,455);mist.addColorStop(0,'#f2f2e600');mist.addColorStop(.4,index===2?'#e2e8df99':'#f1f2e6cc');mist.addColorStop(1,'#e4ebd200');ctx.fillStyle=mist;ctx.fillRect(0,260,width,210);
    ctx.strokeStyle=p[3];ctx.lineWidth=1.2;ctx.globalAlpha=.44;
    for(let i=0;i<6;i++){const bx=235+i*21-cam*.07+Math.sin(time*.2+i)*6,by=117+(i%3)*11;ctx.beginPath();ctx.moveTo(bx-6,by-2);ctx.quadraticCurveTo(bx-2,by-3,bx,by+1);ctx.quadraticCurveTo(bx+3,by-4,bx+7,by-2);ctx.stroke();}ctx.globalAlpha=1;
    // River brush bands.
    ctx.fillStyle=index===2?'#b3c8c655':'#b9cdb03b';ctx.beginPath();ctx.moveTo(0,407);ctx.bezierCurveTo(190,390,360,434,580,405);ctx.bezierCurveTo(780,390,930,424,width,409);ctx.lineTo(width,500);ctx.lineTo(0,500);ctx.fill();
    ctx.strokeStyle=p[3]+'35';ctx.lineWidth=.7;for(let i=0;i<12;i++){const x=(i*137-cam*.17+width*3)%(width+100)-50,y=432+i%4*13;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+30,y-3,x+64,y);ctx.stroke();}
    // A distant pavilion gives the landscape a place to travel to.
    const templeX=940-cam*.12;if(templeX> -180&&templeX<width+100)this.pavilion(ctx,templeX,365,.7,index===3?'#7e6d58':'#6f8371',.34);
    const r=rng(info.seed);for(let i=0;i<19;i++){const x=i*258-cam*.32-40;if(x< -100||x>width+100)continue;if(index===0)this.bamboo(ctx,x,489,.46+r()*.35,time,.27,p[3]);else this.tree(ctx,x,495,.5+r()*.2,index,time,.28);}
    ctx.save();ctx.globalAlpha=.19;ctx.drawImage(this.grain,0,0,width,H);ctx.restore();
  }
  bamboo(ctx,x,y,scale,time=0,alpha=.8,color='#4e7156'){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;const sway=Math.sin(time*.65+x)*4;
    for(let j=0;j<3;j++){
      const bx=j*24-22,lean=(j-1)*23+sway,height=260+j%2*65;
      ctx.strokeStyle=color;ctx.lineWidth=j===1?5:3.5;ctx.beginPath();ctx.moveTo(bx,0);ctx.quadraticCurveTo(bx+lean*.4,-height*.5,bx+lean,-height);ctx.stroke();
      for(let n=1;n<6;n++){
        const by=-n*height/6,sx=bx+lean*n/6;ctx.strokeStyle='#e0e6d0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-3,by);ctx.lineTo(sx+4,by-1);ctx.stroke();
        if(n>1){const dir=n%2?1:-1;this.leaves(ctx,sx,by,dir,color,n*3+j);}
      }
    }ctx.restore();
  }
  leaves(ctx,x,y,dir,color,seed){const r=rng(seed);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dir*28,y-26,x+dir*67,y-30);ctx.stroke();ctx.fillStyle=color;for(let n=0;n<7;n++){const lx=x+dir*(12+n*8),ly=y-11-n*3;ctx.beginPath();ctx.moveTo(lx,ly);ctx.quadraticCurveTo(lx+dir*(10+r()*9),ly-30-r()*14,lx+dir*20,ly-38);ctx.quadraticCurveTo(lx+dir*11,ly-8,lx,ly);ctx.fill();if(n%2===0){ctx.beginPath();ctx.moveTo(lx,ly);ctx.quadraticCurveTo(lx+dir*18,ly+4,lx+dir*30,ly+18);ctx.quadraticCurveTo(lx+dir*8,ly+16,lx,ly);ctx.fill();}}}
  tree(ctx,x,y,scale,index,time,alpha=.65){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.strokeStyle='#596757';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-15,-70,22,-120,0,-202);ctx.moveTo(-1,-83);ctx.quadraticCurveTo(-50,-123,-76,-132);ctx.moveTo(9,-132);ctx.lineTo(61,-177);ctx.stroke();const r=rng(Math.round(x)+99);for(let i=0;i<40;i++){const cx=(r()-.5)*180,cy=-130-r()*98;ctx.fillStyle=index===3?['#ac614688','#bc795b88','#8e705688'][i%3]:'#536d6188';ctx.beginPath();ctx.ellipse(cx,cy,12+r()*15,5+r()*12,r()*3,0,TAU);ctx.fill();}ctx.restore();}
  pavilion(ctx,x,y,s,color,alpha=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-36,0);ctx.lineTo(-36,-63);ctx.moveTo(36,0);ctx.lineTo(36,-63);ctx.moveTo(-48,0);ctx.lineTo(48,0);ctx.stroke();ctx.beginPath();ctx.moveTo(-75,-60);ctx.quadraticCurveTo(-30,-66,0,-95);ctx.quadraticCurveTo(30,-66,75,-60);ctx.quadraticCurveTo(43,-45,0,-51);ctx.quadraticCurveTo(-43,-45,-75,-60);ctx.fill();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-37,-27);ctx.lineTo(37,-27);ctx.moveTo(-37,-23);ctx.lineTo(37,-23);ctx.stroke();ctx.restore();}
  draw(game,time){
    this.time=time;const ctx=this.ctx,width=this.canvas.width,height=this.canvas.height;ctx.clearRect(0,0,width,H);
    if(game.splitScreen){
      for(let i=0;i<2;i++){
        ctx.save();const stacked=game.splitStacked;
        ctx.beginPath();ctx.rect(stacked?0:i*width/2,stacked?i*H/2:0,stacked?width:width/2,stacked?H/2:H);ctx.clip();
        ctx.translate(stacked?0:i*width/2,stacked?i*H/2:0);if(stacked)ctx.scale(.5,.5);
        this.scene(ctx,game,game.cameras[i]||0,stacked?width*2:width/2,time,i,stacked?H:height);
        ctx.fillStyle=i===0?'#ab493a':'#55784e';ctx.font=`13px ${serif}`;ctx.fillText(i===0?'朱红 · 玩家一':'青竹 · 玩家二',18,50);ctx.restore();
      }
      ctx.fillStyle='#f4f1e8';if(game.splitStacked)ctx.fillRect(0,H/2-2,width,4);else ctx.fillRect(width/2-2,0,4,H);
    }else this.scene(ctx,game,game.camera,width,time,null,height);
    if(game.state==='ready'){ctx.save();ctx.fillStyle='#657958';ctx.font=`11px ${serif}`;ctx.fillText('向右行，故事就开始了',73,557);ctx.restore();}
  }
  scene(ctx,g,cam,width,time,focus=null,viewHeight=H){
    const lv=g.level;this.background(ctx,lv.index,cam,time,width);
    if(lv.theme==='cave'||lv.isRoom){ctx.fillStyle='#324f4b22';ctx.fillRect(0,0,width,H);ctx.fillStyle='#526d5c55';for(let x=0;x<width;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+42,60+(x%3)*12);ctx.lineTo(x+80,0);ctx.fill();}}ctx.save();const subject=g.players[focus??0];const cameraY=clamp(subject.y-viewHeight*.48,0,H-viewHeight);ctx.translate(-Math.round(cam),-cameraY);
    // World foliage, a hand painted trail marker and worn ground.
    for(const x of [74,1220,1780,2520,3160,3550,4100]){if(x-cam< -180||x-cam>width+180)continue;if(lv.index===0)this.bamboo(ctx,x,FLOOR,1,time,.65);else if(lv.index===3)this.tree(ctx,x,FLOOR,.85,lv.index,time,.60);}
    drawZones(ctx,lv,time);
    for(const b of lv.platforms){if(b.destroyed||b.x+b.w<cam-60||b.x>cam+width+60)continue;this.platform(ctx,b,g.tick,time,lv.index);}
    for(const s of lv.spikes){ctx.fillStyle='#687561';for(let x=s.x;x<s.x+s.w;x+=16){ctx.beginPath();ctx.moveTo(x,FLOOR);ctx.lineTo(x+8,FLOOR-18);ctx.lineTo(x+16,FLOOR);ctx.fill();ctx.strokeStyle='#f2f1df';ctx.lineWidth=1;ctx.stroke();}}
    this.sign(ctx,200,FLOOR,['寻狐 →','风驿 ↑','月河 →','鸣钟 →'][lv.index]);
    for(const c of lv.coins)if(!c.taken&&c.x>cam-30&&c.x<cam+width+30)this.coin(ctx,c.x,c.y+Math.sin(time*2+c.x)*3,time);
    for(const c of lv.checkpoints)this.checkpoint(ctx,c.x,c.y,c.active,time);
    this.goal(ctx,lv.goal,lv.goalY,time,g.state==='won',lv.index);
    drawFeatures(ctx,g,time);
    drawWorld(ctx,g,time,CHAPTERS);
    for(const item of g.items)this.item(ctx,item,time);
    for(const e of lv.enemies)if(!e.dead||e.timer>0)this.enemy(ctx,e,time);
    for(const p of g.players){if(focus!==null&&p.id!==focus){ctx.save();ctx.globalAlpha=.6;this.player(ctx,p,time);ctx.restore();}else this.player(ctx,p,time);}
    waterSurface(ctx,lv,time);
    for(const f of g.projectiles){ctx.fillStyle='#b74f30';ctx.beginPath();ctx.arc(f.x+5,f.y+5,7,0,TAU);ctx.fill();ctx.fillStyle='#edc977';ctx.beginPath();ctx.arc(f.x+5,f.y+4,4,0,TAU);ctx.fill();for(let i=1;i<4;i++){ctx.fillStyle=`rgba(181,80,47,${.3/i})`;ctx.fillRect(f.x-i*8*Math.sign(f.vx),f.y+2,5,5);}}
    for(const a of g.particles){ctx.globalAlpha=clamp(a.life*2,0,1);ctx.fillStyle=a.color;ctx.fillRect(a.x,a.y,a.size,a.size);}ctx.globalAlpha=1;
    for(const a of g.popups){ctx.globalAlpha=clamp(a.life*2,0,1);ctx.fillStyle=a.color;ctx.font=`600 12px ${serif}`;ctx.textAlign='center';ctx.fillText(a.text,a.x+10,a.y);}ctx.textAlign='left';ctx.globalAlpha=1;
    if(g.mode==='tide')this.tide(ctx,g.tideX,time);
    ctx.restore();
    // Soft wash at the very edges of the scroll.
    const wash=ctx.createLinearGradient(0,0,width,0);wash.addColorStop(0,'#ebeee320');wash.addColorStop(.07,'#ebeee300');wash.addColorStop(.95,'#ebeee300');wash.addColorStop(1,'#ebeee330');ctx.fillStyle=wash;ctx.fillRect(0,0,width,H);
    drawWeather(ctx,lv,time,cam,width);
    if(lv.index===2){ctx.fillStyle='#f9efbd';for(let i=0;i<18;i++){const x=((i*173+Math.sin(time*.4+i)*25-cam*.6)%width+width)%width,y=280+Math.sin(time*.5+i*2)*115;ctx.globalAlpha=.2+Math.sin(time*2+i)*.15;ctx.beginPath();ctx.arc(x,y,1.7,0,TAU);ctx.fill();}ctx.globalAlpha=1;}
  }
  platform(ctx,b,t,time,index){
    ctx.save();ctx.translate(b.x,b.y-(b.bump>0?Math.sin(b.bump/.22*Math.PI)*8:0));
    if(specialPlatform(ctx,b,time)){ctx.restore();return;}
    if(b.type==='ground'){
      const grad=ctx.createLinearGradient(0,0,0,115);grad.addColorStop(0,index===3?'#a8a58a':'#a3ae90');grad.addColorStop(.08,index===3?'#c7c1a7':'#bcc6a7');grad.addColorStop(1,index===3?'#d4cdb8':'#d3d7be');ctx.fillStyle=grad;ctx.fillRect(0,0,b.w,b.h);
      ctx.fillStyle='#5e7754';ctx.beginPath();ctx.moveTo(0,0);const r=rng(Math.round(b.x)+30);for(let x=0;x<=b.w;x+=9)ctx.lineTo(x,Math.sin(x*.09)*2+r()*3);ctx.lineTo(b.w,7);ctx.lineTo(0,7);ctx.fill();
      ctx.strokeStyle='#7f8d704f';ctx.lineWidth=.8;ctx.beginPath();for(let row=0;row<3;row++){const yy=row*35+13;ctx.moveTo(0,yy);for(let x=0;x<b.w;x+=20)ctx.lineTo(x,yy+Math.sin(x*.1+row)*2);for(let x=row%2*22;x<b.w;x+=44){ctx.moveTo(x,yy);ctx.lineTo(x+Math.sin(x)*4,yy+35);}}ctx.stroke();
      ctx.fillStyle='#728b59';for(let x=7;x<b.w;x+=27){const hh=3+r()*7;ctx.beginPath();ctx.moveTo(x,4);ctx.lineTo(x-4,-hh);ctx.lineTo(x+1,-1);ctx.lineTo(x+4,-hh*.7);ctx.lineTo(x+3,4);ctx.fill();}
      ctx.strokeStyle='#465e3b55';ctx.strokeRect(.5,1,b.w-1,b.h);ctx.restore();return;
    }
    if(b.type==='pipe'){
      ctx.fillStyle='#809575';ctx.fillRect(5,8,b.w-10,b.h-8);ctx.fillStyle='#9caf8d';ctx.fillRect(8,10,12,b.h-12);ctx.fillStyle='#5d7859';ctx.fillRect(b.w-17,8,9,b.h-8);ctx.fillStyle='#a2b48f';ctx.fillRect(0,0,b.w,14);ctx.strokeStyle='#536d4d';ctx.lineWidth=1.5;ctx.strokeRect(1,1,b.w-2,13);ctx.strokeRect(5,14,b.w-10,b.h-14);ctx.strokeStyle='#e5e8ce66';ctx.beginPath();ctx.moveTo(8,6);ctx.lineTo(b.w-7,6);ctx.stroke();
    }else if(['ledge','moving','vanish'].includes(b.type)){
      if(b.type==='vanish'){ctx.globalAlpha=b.active?.55+Math.sin(t*1.25+b.phase)*.25:.1;ctx.setLineDash([5,4]);}
      ctx.fillStyle=b.type==='moving'?'#b4bbaa':'#a8b59b';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(b.w,0);ctx.lineTo(b.w-9,b.h);ctx.lineTo(8,b.h+2);ctx.fill();ctx.strokeStyle='#728269';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#667f57';ctx.fillRect(1,0,b.w-2,4);
      if(b.type==='moving'){ctx.fillStyle='#61795b';ctx.font=`10px ${serif}`;ctx.textAlign='center';ctx.fillText(b.axis==='x'?'↔':'↕',b.w/2,15);ctx.textAlign='left';}
      if(b.type==='vanish'){ctx.fillStyle='#456570';ctx.font=`11px ${serif}`;ctx.fillText('墨',b.w/2-6,15);}
    }else{
      ctx.fillStyle=b.type==='question'&&!b.used?'#cbb578':b.used?'#a5aa91':'#9daa8a';ctx.fillRect(1,1,38,38);ctx.strokeStyle=b.type==='question'&&!b.used?'#978455':'#687d5d';ctx.lineWidth=1.3;ctx.strokeRect(1.5,1.5,37,37);ctx.strokeStyle='#f6eed55c';ctx.beginPath();ctx.moveTo(3,37);ctx.lineTo(3,3);ctx.lineTo(37,3);ctx.stroke();
      if(b.type==='question'&&!b.used){ctx.fillStyle='#746744';ctx.font=`bold 28px ${serif}`;ctx.textAlign='center';ctx.fillText('?',20,30);ctx.textAlign='left';ctx.fillRect(5,5,2,2);ctx.fillRect(33,33,2,2);}
      else if(!b.used){ctx.strokeStyle='#687d5d99';ctx.beginPath();ctx.moveTo(2,20);ctx.lineTo(38,20);ctx.moveTo(20,1);ctx.lineTo(20,20);ctx.moveTo(10,20);ctx.lineTo(10,38);ctx.moveTo(30,20);ctx.lineTo(30,38);ctx.stroke();}
      else{ctx.fillStyle='#747f64';ctx.fillRect(17,17,6,6);}
    }ctx.restore();
  }
  coin(ctx,x,y,time){ctx.save();ctx.translate(x+8,y+10);ctx.scale(.65+Math.abs(Math.cos(time*2+x))*.35,1);ctx.fillStyle='#c8b36d';ctx.strokeStyle='#9b884e';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,0,8,10,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#eee7c7';ctx.fillRect(-2.5,-3.5,5,7);ctx.strokeStyle='#9b884e';ctx.strokeRect(-2.5,-3.5,5,7);ctx.restore();}
  sign(ctx,x,y,text){ctx.save();ctx.translate(x,y);ctx.fillStyle='#7d8b6a';ctx.fillRect(-2,-53,4,53);ctx.fillStyle='#d2cfad';ctx.fillRect(-29,-63,65,24);ctx.strokeStyle='#92967a';ctx.strokeRect(-29,-63,65,24);ctx.fillStyle='#627456';ctx.font=`11px ${serif}`;ctx.fillText(text,-20,-47);ctx.restore();}
  checkpoint(ctx,x,y,active,time){ctx.strokeStyle='#7a805f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-95);ctx.stroke();ctx.fillStyle=active?'#ad4936':'#98a58b';ctx.beginPath();ctx.moveTo(x,y-95);ctx.quadraticCurveTo(x+22,y-102+Math.sin(time*2)*3,x+38,y-90);ctx.lineTo(x+34,y-65);ctx.quadraticCurveTo(x+18,y-76+Math.sin(time*2)*3,x,y-67);ctx.fill();ctx.fillStyle='#faf0d4';ctx.font=`12px ${serif}`;ctx.fillText(active?'存':'亭',x+10,y-78);ctx.fillStyle='#7b8668';ctx.fillRect(x-9,y-5,18,5);}
  goal(ctx,x,y,time,won,index){ctx.save();ctx.translate(x,y);ctx.fillStyle='#747e61';ctx.fillRect(-4,-225,7,225);ctx.fillStyle='#c1b377';ctx.beginPath();ctx.arc(0,-229,6,0,TAU);ctx.fill();const fy=won?-60:-219;ctx.fillStyle='#ad4936';ctx.beginPath();ctx.moveTo(0,fy);ctx.quadraticCurveTo(25,fy-8+Math.sin(time*2)*4,58,fy+3);ctx.lineTo(54,fy+57);ctx.quadraticCurveTo(25,fy+49+Math.sin(time*2)*5,0,fy+54);ctx.fill();ctx.fillStyle='#f6e8cb';ctx.font=`27px ${serif}`;ctx.fillText('印',13,fy+38);ctx.fillStyle='#8e997b';ctx.fillRect(-15,-10,30,10);this.pavilion(ctx,99,-1,.67,'#5c7157',.9);ctx.fillStyle='#b4563c';ctx.fillRect(75,-36,14,35);ctx.fillRect(108,-36,14,35);ctx.fillStyle='#f0ddaa';ctx.font=`9px ${serif}`;ctx.fillText('山',78,-18);ctx.fillText('河',111,-18);ctx.restore();}
  player(ctx,p,time){
    if(p.dashTime>0){ctx.save();ctx.fillStyle='#547d7280';for(let n=1;n<5;n++){ctx.globalAlpha=.5/n;ctx.fillRect(p.x-p.face*n*12,p.y+8,p.w,p.h-10);}ctx.restore();}
    if(p.inWater){ctx.strokeStyle='#d3e6db99';ctx.beginPath();ctx.arc(p.x+14,p.y+19,23,0,TAU);ctx.stroke();}
    if(p.invincible>0&&Math.floor(time*14)%2===0&&!p.dead)return;
    const size=p.power?3:2.5;const palette=p.id===0?{r:'#b64532',b:'#4b6059',s:'#e8c39a',h:'#493e2f'}:{r:'#5f8057',b:'#4e6661',s:'#e6c49d',h:'#493e2f'};
    if(p.star>0){palette.r=['#be6d36','#a69348','#678763','#6f8f9a'][Math.floor(time*9)%4];ctx.save();ctx.shadowBlur=15;ctx.shadowColor='#d7c36c';}
    const sprites={
      idle:['....rrrrr.....','...rrrrrrrrr..','...hhhsshs....','..hshssshsss..','..hshhssshsss.','...hsssshhhh..','....sssssss...','...rrbrrbrr...','..rrrbrrbrrr..','.rrrrbbbbrrrr.','.ssrbbyybbrss.','.sssbbbbbbsss.','...bbbbbbbb...','..bbb....bbb..','.hhhh....hhhh.','hhhhhh..hhhhhh'],
      walk:['....rrrrr.....','...rrrrrrrrr..','...hhhsshs....','..hshssshsss..','..hshhssshsss.','...hsssshhhh..','....sssssss...','...rrbrrbrr...','..rrrbrrbrrr..','.ssrrbbbbrrss.','.sssbbyybbsss.','....bbbbbb....','...bbbbbbbb...','..bbb...bbb...','.hhhh....hh...','hhhhhh........'],
      jump:['....rrrrr..ss.','...rrrrrrrrss.','...hhhsshs.ss.','..hshssshsssr.','..hshhssshssr.','...hsssshhhrr.','....ssssssrr..','...rrbrrbrr...','..rrrbrrbrr...','.rrrbbbbbbr...','.ssrbbyybbb...','.sssbbbbbbbbh.','...bbbbbbbhhh.','..hbbb..bhhhh.','.hhhhh........','hhhhhh........']
    };
    let sprite=!p.grounded?sprites.jump:Math.abs(p.vx)>15&&Math.floor(p.anim)%2?sprites.walk:sprites.idle;
    ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h);if(p.face<0)ctx.scale(-1,1);if(p.dead)ctx.rotate(Math.sin(time*4)*.15);ctx.translate(-7*size,-16*size);
    ctx.fillStyle='#334a3820';ctx.beginPath();ctx.ellipse(7*size,16*size,15,3,0,0,TAU);ctx.fill();
    for(let row=0;row<sprite.length;row++)for(let col=0;col<sprite[row].length;col++){const c=sprite[row][col];if(c==='.'){continue;}ctx.fillStyle=c==='y'?'#d5b365':palette[c];ctx.fillRect(col*size,row*size,size+.15,size+.15);}
    ctx.fillStyle='#f6ecd3';ctx.fillRect(5*size,1.2*size,2*size,1.3*size);ctx.restore();if(p.star>0)ctx.restore();
    if(p.power===2){ctx.fillStyle='#cb6740';ctx.beginPath();ctx.arc(p.x+14,p.y-7,3+Math.sin(time*4),0,TAU);ctx.fill();}
    if(p.id===1){ctx.fillStyle='#54744c';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('2P',p.x+14,p.y-12);ctx.textAlign='left';}
  }
  enemy(ctx,e,time){
    ctx.save();ctx.translate(e.x+15,e.y+30);if(e.dead){ctx.scale(1,.25);ctx.globalAlpha=clamp(e.timer*3,0,1);}
    const walk=Math.sin(time*9+e.x)*3;
    if(e.type==='fish'||e.type==='wisp'){ctx.fillStyle=e.type==='fish'?'#9e7b70':'#607e76';ctx.beginPath();ctx.ellipse(0,-16,15,9,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(10,-16);ctx.lineTo(23,-26);ctx.lineTo(23,-6);ctx.fill();ctx.fillStyle='#efdbb2';ctx.fillRect(-9,-20,4,4);ctx.restore();return;}
    if(e.type==='goomba'){
      ctx.fillStyle='#5b6350';ctx.fillRect(-13,-7,10,7+walk*.3);ctx.fillRect(4,-7,10,7-walk*.3);ctx.fillStyle='#c8bd96';ctx.beginPath();ctx.ellipse(0,-11,11,9,0,0,TAU);ctx.fill();ctx.fillStyle='#8c7e58';ctx.beginPath();ctx.moveTo(-16,-14);ctx.bezierCurveTo(-15,-37,15,-37,16,-14);ctx.quadraticCurveTo(0,-9,-16,-14);ctx.fill();ctx.strokeStyle='#625b44';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#eee6cc';ctx.fillRect(-8,-22,5,8);ctx.fillRect(3,-22,5,8);ctx.fillStyle='#333f31';ctx.fillRect(-5,-21,2,6);ctx.fillRect(3,-21,2,6);ctx.strokeStyle='#3b4b34';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-23);ctx.lineTo(-2,-20);ctx.moveTo(2,-20);ctx.lineTo(9,-23);ctx.stroke();
    }else{
      const hopper=e.type==='hopper';ctx.fillStyle=hopper?'#9a8177':'#718765';ctx.beginPath();ctx.ellipse(0,-15,14,14,0,0,TAU);ctx.fill();ctx.strokeStyle=hopper?'#695b58':'#4e6d46';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(-12,-16);ctx.lineTo(12,-16);ctx.moveTo(0,-28);ctx.lineTo(0,-3);ctx.moveTo(-10,-23);ctx.lineTo(9,-8);ctx.stroke();ctx.fillStyle='#c4c09a';ctx.beginPath();ctx.ellipse(e.vx<0?-14:14,-18,8,10,0,0,TAU);ctx.fill();ctx.fillStyle='#33462f';ctx.fillRect(e.vx<0?-17:16,-23,2,4);ctx.fillStyle='#6d7756';ctx.fillRect(-11,-3,9,4+walk*.3);ctx.fillRect(4,-3,9,4-walk*.3);if(hopper){ctx.fillStyle='#e5d6b8';ctx.beginPath();ctx.ellipse(-6,-32,3,10,-.4,0,TAU);ctx.ellipse(3,-33,3,11,.2,0,TAU);ctx.fill();}
    }ctx.restore();
  }
  item(ctx,i,time){ctx.save();ctx.translate(i.x+13,i.y+28);if(i.type==='mushroom'){ctx.fillStyle='#ead5ad';ctx.fillRect(-7,-13,14,13);ctx.fillStyle='#ba5140';ctx.beginPath();ctx.ellipse(0,-17,15,12,0,Math.PI,TAU);ctx.lineTo(15,-13);ctx.lineTo(-15,-13);ctx.fill();ctx.fillStyle='#ecdec0';for(const [x,y] of [[-8,-21],[4,-23],[9,-16]]){ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}}else if(i.type==='flower'){ctx.fillStyle='#698255';ctx.fillRect(-2,-14,4,14);ctx.beginPath();ctx.ellipse(-7,-8,7,3,.4,0,TAU);ctx.fill();ctx.fillStyle='#b8543c';for(let n=0;n<5;n++){ctx.beginPath();ctx.ellipse(Math.cos(n*TAU/5)*7,-22+Math.sin(n*TAU/5)*5,5,7,n*TAU/5,0,TAU);ctx.fill();}ctx.fillStyle='#e8c870';ctx.beginPath();ctx.arc(0,-22,4,0,TAU);ctx.fill();}else{ctx.rotate(Math.sin(time*4)*.2);ctx.fillStyle='#d3b65e';ctx.strokeStyle='#a68d43';ctx.beginPath();for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=n%2?7:15;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r-15);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#685b37';ctx.fillRect(-5,-19,2,5);ctx.fillRect(3,-19,2,5);}ctx.restore();}
  tide(ctx,x,time){ctx.save();const grad=ctx.createLinearGradient(x-150,0,x+35,0);grad.addColorStop(0,'#253c3be8');grad.addColorStop(.8,'#344d49ad');grad.addColorStop(1,'#344d4900');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(x-1000,0);ctx.lineTo(x-15,0);for(let y=0;y<=H;y+=12)ctx.lineTo(x+Math.sin(y*.028+time*2)*18,y);ctx.lineTo(x-1000,H);ctx.fill();ctx.strokeStyle='#2e484869';ctx.lineWidth=4;ctx.beginPath();for(let y=0;y<=H;y+=6)ctx.lineTo(x+Math.sin(y*.028+time*2)*18,y);ctx.stroke();ctx.restore();}
  thumbnail(canvas,index){
    const ctx=canvas.getContext('2d'),l=makeLevel(index);ctx.save();ctx.scale(canvas.width/W,canvas.height/H);this.background(ctx,index,110,0);
    if(index===0)this.bamboo(ctx,100,600,1.5,0,.5);else if(index===3)this.tree(ctx,980,620,1.5,index,0,.6);
    ctx.fillStyle=l.palette[3]+'99';for(const p of l.platforms){const x=p.x/l.length*W,y=270+p.y*.43;ctx.fillRect(x,y,Math.max(5,p.w/l.length*W),p.type==='ground'?600-y:8);}
    if(index===1){ctx.fillStyle='#edf3e6';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(180+i*240,270-i%2*30,70,18,0,0,TAU);ctx.fill();}}
    if(index===2){ctx.fillStyle='#668e9766';ctx.fillRect(0,505,W,95);}
    if(index===3)this.pavilion(ctx,820,460,1.3,l.palette[3],.75);ctx.restore();
  }
}
