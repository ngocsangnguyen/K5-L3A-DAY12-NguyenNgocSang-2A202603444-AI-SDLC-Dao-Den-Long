// Procedural soundtrack and effects. No recordings, downloads or copyrighted samples.
export const MUSIC_MODES=Object.freeze({
  1:{root:196,steps:[0,4,7,11,7,4,2,7],bass:[0,0,5,3],wave:'sine'},
  2:{root:174.61,steps:[0,3,7,10,7,5,3,7],bass:[0,5,3,7],wave:'triangle'},
  3:{root:146.83,steps:[0,7,10,12,10,7,5,3],bass:[0,3,5,7],wave:'triangle'}
});
const frequency=(root,semitones)=>root*2**(semitones/12);
export class Audio{
  constructor(){this.enabled=false;this.volume=.45;this.context=null;this.master=null;this.musicBus=null;this.sfxBus=null;this.musicTimer=null;this.musicToken=0;this.phrase=0;this.lastPickup=-Infinity;this.pickupStep=0;}
  async configure(settings){
    this.enabled=settings.enabled;this.volume=settings.volume;
    if(this.enabled&&!this.context){const A=window.AudioContext||window.webkitAudioContext;if(!A){this.enabled=false;return;}this.context=new A();this.master=this.context.createGain();this.musicBus=this.context.createGain();this.sfxBus=this.context.createGain();this.musicBus.gain.value=.72;this.sfxBus.gain.value=1;this.musicBus.connect(this.master);this.sfxBus.connect(this.master);this.master.connect(this.context.destination);}
    if(this.context){this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.025);if(this.enabled)await this.context.resume();}
    if(!this.enabled)this.stopMusic();
  }
  tone(frequencyValue,{when=0,duration=.35,volume=.04,type='sine',bus=this.sfxBus,attack=.012}={}){
    if(!this.enabled||!this.context||!bus)return;const start=this.context.currentTime+when,o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(frequencyValue,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+attack);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(bus);o.start(start);o.stop(start+duration+.03);
  }
  noise({when=0,duration=.12,volume=.012,highpass=1800}={}){
    if(!this.enabled||!this.context)return;const rate=this.context.sampleRate,length=Math.ceil(rate*duration),buffer=this.context.createBuffer(1,length,rate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain(),start=this.context.currentTime+when;filter.type='highpass';filter.frequency.value=highpass;gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(this.sfxBus);source.start(start);source.stop(start+duration);
  }
  chime(notes=[880],volume=.06,type='sine'){notes.forEach((f,i)=>this.tone(f,{when:i*.075,duration:.58,volume,type}));}
  pickup(){const now=this.context?.currentTime??0;if(now-this.lastPickup<.045)return;this.lastPickup=now;const base=[987.77,1174.66,1318.51,1567.98][this.pickupStep++%4];this.tone(base,{duration:.16,volume:.045,type:'sine',attack:.004});this.tone(base*1.5,{when:.045,duration:.22,volume:.032,type:'triangle',attack:.004});this.noise({duration:.08,volume:.009,highpass:3200});}
  scheduleBar(night,token){if(token!==this.musicToken||!this.enabled||!this.context)return;const mode=MUSIC_MODES[night]??MUSIC_MODES[1],bar=this.phrase++,beat=.4,start=.06;for(let i=0;i<8;i++){const note=frequency(mode.root,mode.steps[(i+bar)%mode.steps.length]+12);this.tone(note,{when:start+i*beat,duration:.52,volume:.018,type:mode.wave,bus:this.musicBus,attack:.08});if(i%2===0)this.tone(frequency(mode.root,mode.bass[(bar+i/2)%mode.bass.length]-12),{when:start+i*beat,duration:1.05,volume:.027,type:'sine',bus:this.musicBus,attack:.12});}this.tone(frequency(mode.root,7),{when:start,duration:3.15,volume:.012,type:'sine',bus:this.musicBus,attack:.45});}
  startMusic(night=1){this.stopMusic();if(!this.enabled||!this.context)return;const token=++this.musicToken;this.phrase=0;this.scheduleBar(night,token);this.musicTimer=setInterval(()=>this.scheduleBar(night,token),3200);}
  stopMusic(){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;this.musicToken++;}
  event(name,data={}){
    if(name==='mote_picked'){this.pickup();return;}
    const sound={deposit:[523,659],refuel:[587,740],lantern_lit:[392,494,587,784],lantern_out:[247,196],pulse:[220,440,880],player_hit:[175,131],jump:[330,440],dash:[440,740],charm_picked:[660,880,1108],shade_spawned:[130,155],drifter_steal:[294,220],drifter_drop:[440,587],wind:[196,247],countdown:[660],won:[392,494,587,784,988],lost:[262,220,175]};const key=name==='game_over'?(data.result==='won'?'won':'lost'):name;this.chime(sound[key]??[],key==='countdown'?.04:.065,key==='player_hit'?'sawtooth':'sine');
  }
}
