import {Game} from './game.js';
export class Campaign{
  constructor(tuning,seed=2026){this.tuning=tuning;this.seed=seed;this.night=1;this.wins=new Map();this.game=null;}
  startNight(night=this.night){this.night=night;this.game=new Game({tuning:this.tuning,seed:this.seed+night-1,night});return this.game;}
  finish(){if(this.game?.state==='won')this.wins.set(this.night,this.game.score);return this.totalScore;}
  get totalScore(){return [...this.wins.values()].reduce((a,b)=>a+b,0);}
  next(){if(this.game?.state!=='won'||this.night>=3)return null;this.finish();return this.startNight(this.night+1);}
}
