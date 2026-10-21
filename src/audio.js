// A small pentatonic score made with Web Audio; no downloaded audio assets.
export class InkAudio {
  constructor(){this.enabled=false;this.ctx=null;this.beat=0;this.nextNote=0;}
  async toggle(){
    this.enabled=!this.enabled;
    if(this.enabled){this.ctx??=new (window.AudioContext||window.webkitAudioContext)();await this.ctx.resume();this.nextNote=this.ctx.currentTime;this.note(659,.15,.05);}
    return this.enabled;
  }
  note(freq,duration=.12,volume=.055,type='triangle',delay=0){
    if(!this.enabled||!this.ctx)return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(this.ctx.destination);osc.start(t);osc.stop(t+duration+.02);
  }
  event(type){
    if(['jump','double-jump','spring','swim'].includes(type)){this.note(330,.09,.025);this.note(495,.12,.025,'triangle',.045);}
    if(type==='coin'){this.note(988,.08,.04,'sine');this.note(1319,.18,.035,'sine',.07);}
    if(type==='bump')this.note(146,.08,.04,'triangle');
    if(type==='stomp'){this.note(220,.07,.04,'square');this.note(110,.12,.03,'triangle',.05);}
    if(type==='fire')this.note(175,.13,.035,'sawtooth');
    if(type==='hurt'||type==='death'){[330,247,165,110].forEach((n,i)=>this.note(n,.18,.035,'triangle',i*.08));}
    if(['power','checkpoint','life','seal','switch','portal','gate','rescue','area-complete','memory','quest','rest'].includes(type)){[330,440,495,659].forEach((n,i)=>this.note(n,.18,.04,'sine',i*.09));}
    if(type==='build'){this.note(392,.15,.025,'sine');this.note(523,.15,.025,'sine',.1);}
    if(type==='dash'){this.note(220,.08,.025,'triangle');this.note(440,.14,.02,'sine',.04);}
    if(type==='boss-hit')this.note(110,.18,.06,'triangle');
    if(type==='won'||type==='boss-defeated'){[523,659,784,1047,784,1047].forEach((n,i)=>this.note(n,.3,.045,'triangle',i*.13));}
  }
  update(playing){
    if(!playing||!this.enabled||!this.ctx)return;
    const notes=[330,0,392,440,523,0,440,392,330,294,330,0,262,294,330,0,392,440,523,587,523,440,392,0,330,392,294,0,262,294,330,0];
    if(this.ctx.currentTime>=this.nextNote){const n=notes[this.beat%notes.length];if(n)this.note(n,.32,.012,'sine');if(this.beat%4===0)this.note(130.81,.65,.009,'triangle');this.beat++;this.nextNote=this.ctx.currentTime+.31;}
  }
}
