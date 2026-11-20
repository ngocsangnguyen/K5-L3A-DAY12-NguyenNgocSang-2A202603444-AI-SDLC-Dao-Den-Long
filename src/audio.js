// Procedural music and effects. No copyrighted recordings or network audio.
export class Audio{
  constructor(){this.enabled=false;this.volume=.35;this.context=null;this.master=null;this.music=null;this.phrase=0;}
  async configure(settings){this.enabled=settings.enabled;this.volume=settings.volume;if(this.enabled&&!this.context){const A=window.AudioContext||window.webkitAudioContext;if(!A){this.enabled=false;return;}this.context=new A();this.master=this.context.createGain();this.master.connect(this.context.destination);}if(this.context){this.master.gain.value=this.enabled?this.volume:0;if(this.enabled)await this.context.resume();}if(!this.enabled)this.stopMusic();}
  async toggle(){await this.configure({enabled:!this.enabled,volume:this.volume});return this.enabled;}
  chime(notes=[880],volume=.06,type='sine'){
    if(!this.enabled||!this.context)return;
    notes.forEach((f,i)=>{const o=this.context.createOscillator(),g=this.context.createGain(),start=this.context.currentTime+i*.09;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+1);o.connect(g);g.connect(this.master);o.start(start);o.stop(start+1.1);});
  }
  startMusic(night=1){this.stopMusic();if(!this.enabled)return;const scale=[196,246.94,293.66,369.99,392,493.88];const play=()=>{const i=(this.phrase++ +night)%scale.length;this.chime([scale[i],scale[(i+2)%scale.length],scale[(i+4)%scale.length]],.035);};play();this.music=setInterval(play,2400);}
  stopMusic(){if(this.music)clearInterval(this.music);this.music=null;}
  event(name,data={}){const sound={mote_picked:[784,988],deposit:[523,659],lantern_lit:[392,494,587,784],pulse:[220,440,880],player_hit:[175,131],jump:[330,440],dash:[440,740],charm_picked:[660,880,1108],shade_spawned:[130,155],drifter_steal:[294,220],drifter_drop:[440,587],wind:[196,247],countdown:[660],won:[392,494,587,784,988],lost:[262,220,175]};this.chime(sound[name==='game_over'?(data.result==='won'?'won':'lost'):name]??[],name==='mote_picked'?.035:.065);}
}
