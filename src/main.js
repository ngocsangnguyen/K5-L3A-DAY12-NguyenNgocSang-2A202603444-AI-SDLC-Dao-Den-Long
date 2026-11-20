import {Game,DT,distanceXZ} from './core/game.js';
import {Campaign} from './core/campaign.js';
import {World} from './world.js';
import {Audio} from './audio.js';
import {loadSettings,saveSettings} from './settings.js';
const $=id=>document.getElementById(id),audio=new Audio();
let settings=loadSettings(localStorage),tuning,game,world,campaign,selectedNight=1,mode='home',yaw=.48,cameraDistance=19;
let acc=0,last=performance.now(),toastUntil=0,pointer=null,lastHUD=-1,lastSecond=-1,settingsReturn='home';
let fpsFrames=0,fpsElapsed=0,fpsWarmup=0,fpsLast=0,fpsDone=false;
const keys=new Set(),markers=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stories=['','Ông Đăng: “Mỗi đốm sáng đều biết đường về. Hãy bắt đầu từ những ngọn đèn trên Đảo Bến, Mây nhé.”','Ông Đăng: “Cầu tre nối hai bờ, còn lòng can đảm nối những điều xa hơn. Bùa đỏ sẽ giúp con băng qua gió.”','Ông Đăng: “Theo hai con dốc lên tầng cao, rồi nhờ bục nhảy đến ngọn đèn bên tháp. Bình minh đang chờ tiếng chuông cuối.”'];
function write(id,value){const text=String(value);if($(id).textContent!==text)$(id).textContent=text;}
function toast(message,duration=2600){write('toast',message);$('toast').classList.add('visible');toastUntil=performance.now()+duration;}
function soundUI(){const enabled=settings.enabled&&settings.volume>0;$('sound-button').setAttribute('aria-pressed',String(enabled));$('sound-button').setAttribute('aria-label',enabled?'Tắt âm thanh':'Bật âm thanh');$('sound-button').innerHTML=`<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z${enabled?' M15 8q5 4 0 8 M18 5q8 7 0 14':' M16 9l5 6m0-6-5 6'}"/></svg>`;}
function input(){return {move:[(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)],cam_yaw_deg:yaw*180/Math.PI,jump:keys.has('Space'),interact:keys.has('KeyE'),pulse:keys.has('KeyQ'),dash:keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('KeyR'),pause:false};}
function closeDialogs(){for(const d of document.querySelectorAll('dialog'))d.close();}
function setGame(next){
  game=next;if(!world||world.level.night!==game.night){world?.dispose();world=new World($('world'),tuning,game.level);}world.reset(game);acc=0;keys.clear();lastHUD=-1;
  $('markers').replaceChildren();markers.clear();
  for(const l of game.lanterns){const m=document.createElement('div');m.className='lamp-marker';m.innerHTML=`<span class="dot"></span>Đèn ${l.id.slice(1).padStart(2,'0')}`;$('markers').append(m);markers.set(l.id,m);}
  $('lamp-progress').innerHTML=game.lanterns.map(()=>'<span class="lamp-light"></span>').join('');
  $('mote-slots').innerHTML=Array.from({length:10},()=>'<i></i>').join('');write('fps-value','');delete $('fps-value').dataset.report;
  write('night-number',`Đêm ${game.night}`);write('island-name',game.level.name);document.title=`Đảo Đèn Lồng — Đêm ${game.night} · ${game.level.name}`;
  document.querySelector('.chapter>span:last-child').innerHTML=`ĐÊM 0${game.night}<small>${game.level.name}</small>`;updateHUD();
}
function showPlayUI(visible){for(const id of ['hud','pause-button','pulse-status','dash-status','mote-slots','touch-controls','fps-value'])$(id).hidden=!visible;$('home').hidden=visible;document.body.classList.toggle('playing',visible);}
function introduce(next){closeDialogs();mode='intro';setGame(next);showPlayUI(true);write('intro-night',`ĐÊM ${game.night} · ${game.timeLeft/60} PHÚT`);write('intro-title',game.level.name);write('intro-story',stories[game.night]);write('intro-goal',`Thắp ${game.lanterns.length} ngọn đèn. Mỗi đèn cần 10 đom đóm. Giữ 3 ngọn lửa của Mây.`);$('intro-dialog').showModal();audio.stopMusic();}
function startCampaign(){campaign=new Campaign(tuning);introduce(campaign.startNight(selectedNight));}
function enter(){closeDialogs();mode='play';keys.clear();acc=0;fpsFrames=0;fpsElapsed=0;fpsWarmup=0;fpsDone=false;fpsLast=performance.now();$('world').focus({preventScroll:true});audio.configure(settings).then(()=>audio.startMusic(game.night)).catch(()=>{});toast(`Chào Mây! Tìm đom đóm và thắp ${game.lanterns.length} ngọn đèn trên ${game.level.name}.`,3200);}
function toMenu(){closeDialogs();mode='home';audio.stopMusic();keys.clear();$('toast').classList.remove('visible');toastUntil=0;showPlayUI(false);for(const id of ['interaction','charm-status','direction-cue','wind-warning'])$(id).hidden=true;campaign=new Campaign(tuning);setGame(campaign.startNight(selectedNight));}
function paused(want,dialog=true){
  if(mode!=='play'||!['playing','paused'].includes(game.state))return;
  if((game.state==='paused')!==want){if(game.input.pause)game.step({pause:false});game.step({pause:true,move:[0,0],jump:false,pulse:false,interact:false,dash:false}).forEach(event);}
  keys.clear();acc=0;lastHUD=-1;if(dialog){if(want&&!$('pause-dialog').open)$('pause-dialog').showModal();if(!want){$('pause-dialog').close();$('world').focus({preventScroll:true});}}
}
function ending(e){
  mode='end';keys.clear();audio.stopMusic();campaign.finish();const won=e.data.result==='won',final=won&&game.night===3;
  write('end-symbol',won?'✺':'☾');write('end-eyebrow',final?'BÌNH MINH · BA HÒN ĐẢO':`${game.level.name.toUpperCase()} · ĐÊM ${game.night}`);write('end-title',final?'Bình Minh':won?'Một hòn đảo đã thức giấc.':'Một đốm sáng vẫn còn.');
  write('end-description',final?`Tiếng chuông vang qua biển mây. Tổng điểm các đêm đã thắng: ${campaign.totalScore.toLocaleString('vi-VN')}.`:won?'Ngọn đèn cuối đã sáng. Ông Đăng đang chờ Mây ở hòn đảo kế tiếp.':e.data.reason==='dawn'?'Bình minh đến trước khi những ngọn đèn được thắp hết. Thử lại đêm này nhé.':'Ngọn lửa đã tắt. Hãy tìm nơi trú dưới đèn, dùng lướt và tỏa sáng để bảo vệ Mây.');
  write('end-score',final?campaign.totalScore:game.score);write('end-lamps',`${game.lanterns.filter(l=>l.lit).length} / ${game.lanterns.length}`);$('next-night').hidden=!won||final;$('restart-button').hidden=won;closeDialogs();$('end-dialog').showModal();$('interaction').hidden=true;
}
function event(e){audio.event(e.name,e.data);if(e.name==='pulse')world.pulse(game.player.pos);if(e.name==='lantern_lit')toast('Một ngọn đèn thức giấc. Vòng sáng này sẽ bảo vệ Mây.');if(e.name==='player_hit')toast(e.data.by==='fall'?`Mây đang trở về bến. Còn ${e.data.flames} ngọn lửa.`:`Bóng Mực chạm vào Mây! Còn ${e.data.flames} ngọn lửa.`,1800);if(e.name==='drifter_steal')toast('Gió Lạc đã cướp đom đóm! Tỏa sáng để lấy lại.');if(e.name==='charm_picked')toast('Bùa Gió · Tăng tốc và lướt không hồi chiêu trong 10 giây.');if(e.name==='paused')audio.stopMusic();if(e.name==='resumed')audio.startMusic(game.night);if(e.name==='game_over')ending(e);}
function updateHUD(){
  const p=game.player;write('carried',p.carried);write('capacity','/ 10');$('capacity-fill').style.width=`${p.carried*10}%`;
  if($('flames').dataset.count!==String(p.flames)){$('flames').innerHTML=Array.from({length:3},(_,i)=>`<span class="${i>=p.flames?'empty':''}"><svg width="18" height="25" viewBox="0 0 20 28" aria-hidden="true"><path fill="currentColor" d="M11 1C14 9 19 10 19 17a9 9 0 0 1-18 0c0-5 3-8 5-10-1 5 1 6 3 7 3-4 1-9 2-13Z"/></svg></span>`).join('');$('flames').dataset.count=p.flames;$('flames').setAttribute('aria-label',`${p.flames} ngọn lửa`);}
  const seconds=Math.max(0,Math.ceil(game.timeLeft));write('timer',`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`);$('timer').classList.toggle('urgent',game.timeLeft<=30);
  if(mode==='play'&&game.state==='playing'&&seconds<=10&&seconds!==lastSecond)audio.event('countdown');lastSecond=seconds;
  write('score',game.score);write('lamp-count',`${game.lanterns.filter(l=>l.lit).length} / ${game.lanterns.length} ngọn đèn`);
  [...$('lamp-progress').children].forEach((n,i)=>n.classList.toggle('lit',game.lanterns[i].lit));[...$('mote-slots').children].forEach((n,i)=>n.classList.toggle('filled',i<p.carried));
  const nearest=game.lanterns.filter(l=>!l.lit).sort((a,b)=>distanceXZ(a.pos,p.pos)-distanceXZ(b.pos,p.pos))[0],can=nearest&&distanceXZ(nearest.pos,p.pos)<=2;
  $('interaction').hidden=!can||mode!=='play'||game.state==='paused';if(can)write('interaction-text',`Nạp ánh sáng (${nearest.deposited}/10)`);
  write('pulse-hint',p.pulseCd>0?`${(p.pulseCd/60).toFixed(1)}s`:'Q · 3 đom đóm');$('pulse-status').classList.toggle('unavailable',p.pulseCd>0||p.carried<3);write('dash-hint',p.dashCd>0?`${(p.dashCd/60).toFixed(1)}s`:'Shift / R · sẵn sàng');$('dash-status').classList.toggle('unavailable',p.dashCd>0&&p.charm===0);
  $('charm-status').hidden=p.charm===0||mode!=='play';write('charm-time',`${Math.ceil(p.charm/60)}s`);$('wind-warning').hidden=!game.wind.warning||mode!=='play';if(game.wind.warning&&!updateHUD.wasWind)audio.event('wind');updateHUD.wasWind=game.wind.warning;
  if(nearest&&mode==='play'&&game.state==='playing'){const projected=world.project([nearest.pos[0],nearest.pos[1]+2,nearest.pos[2]]);$('direction-cue').hidden=projected.visible;const dx=nearest.pos[0]-p.pos[0],dz=nearest.pos[2]-p.pos[2],screenX=dx*Math.cos(yaw)-dz*Math.sin(yaw),depth=dx*Math.sin(yaw)+dz*Math.cos(yaw);$('direction-arrow').style.transform=`rotate(${Math.atan2(screenX,-depth)}rad)`;write('direction-text',`${nearest.id} · ${Math.round(distanceXZ(nearest.pos,p.pos))}m`);}else $('direction-cue').hidden=true;
}
function fps(now,raw){
  if(!fpsDone&&mode==='play'&&game.state==='playing'&&!document.hidden){fpsWarmup+=raw;if(fpsWarmup>2){fpsFrames++;fpsElapsed+=raw;}if((now-fpsLast>1000||fpsElapsed>=10)&&fpsElapsed>0){const mean=fpsFrames/fpsElapsed;fpsDone=fpsElapsed>=10;write('fps-value',`${mean.toFixed(1)} FPS${fpsDone?' · 10s':''}`);$('fps-value').dataset.report=JSON.stringify({kind:'browser-render',sample_window_s:10,complete:fpsDone,width:innerWidth,height:innerHeight,pixel_ratio:world.renderer.getPixelRatio(),render_calls:world.renderer.info.render.calls,frames:fpsFrames,elapsed_s:fpsElapsed,average_fps:mean,night:game.night,user_agent:navigator.userAgent});fpsLast=now;}}
}
function frame(now){const raw=Math.max(0,(now-last)/1000),dt=Math.min(raw,.25);last=now;
  if(mode==='play'&&['playing','paused'].includes(game.state)){acc+=dt;while(acc>=DT){const command=input();if(command.jump&&!game.input.jump&&game.player.grounded&&game.state==='playing')audio.event('jump');game.step(command).forEach(event);acc-=DT;if(mode!=='play')break;}}
  if(lastHUD!==game.tick){updateHUD();lastHUD=game.tick;}if(now>toastUntil)$('toast').classList.remove('visible');world.update(game,now/1000,dt,{home:mode==='home'||mode==='intro',yaw,distance:cameraDistance,reduceMotion:reduced});
  for(const l of game.lanterns){const m=markers.get(l.id),p=world.project([l.pos[0],l.pos[1]+3.9,l.pos[2]]);m.style.display=mode==='play'&&game.state!=='paused'&&p.visible?'block':'none';m.style.left=`${p.x}px`;m.style.top=`${p.y}px`;m.classList.toggle('lit',l.lit);}fps(now,raw);requestAnimationFrame(frame);
}
function openSettings(){settingsReturn=mode==='play'?'pause':'home';if(mode==='play')paused(true,false);$('pause-dialog').close();$('volume').value=settings.volume*100;$('sensitivity').value=settings.sensitivity*100;$('audio-enabled').checked=settings.enabled;write('volume-value',`${Math.round(settings.volume*100)}%`);write('sensitivity-value',`${settings.sensitivity.toFixed(1)}×`);$('settings-dialog').showModal();}
async function applySettings(){settings=saveSettings(localStorage,{volume:Number($('volume').value)/100,sensitivity:Number($('sensitivity').value)/100,enabled:$('audio-enabled').checked});await audio.configure(settings);soundUI();write('volume-value',`${Math.round(settings.volume*100)}%`);write('sensitivity-value',`${settings.sensitivity.toFixed(1)}×`);}
async function init(){
  const response=await fetch('/game.contract.json');if(!response.ok)throw new Error('Không tải được game.contract.json. Hãy dùng npm start.');tuning=(await response.json()).tuning;campaign=new Campaign(tuning);setGame(campaign.startNight());soundUI();write('help-cost',10);write('help-pulse',3);
  $('start-button').onclick=startCampaign;$('enter-night').onclick=enter;$('intro-home').onclick=toMenu;$('pause-home').onclick=toMenu;$('home-button').onclick=toMenu;$('restart-button').onclick=()=>introduce(campaign.startNight());$('restart-pause').onclick=()=>introduce(campaign.startNight());$('next-night').onclick=()=>{const next=campaign.next();if(next)introduce(next);};$('pause-button').onclick=()=>paused(true);$('resume-button').onclick=()=>paused(false);
  $('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();paused(false);});for(const id of ['intro-dialog','end-dialog'])$(id).addEventListener('cancel',e=>e.preventDefault());
  $('help-button').onclick=()=>{if(mode==='play')paused(true,false);$('help-dialog').showModal();};const closeHelp=()=>{$('help-dialog').close();if(mode==='play')paused(false,false);};$('close-help').onclick=closeHelp;$('help-dialog').addEventListener('cancel',e=>{e.preventDefault();closeHelp();});
  $('settings-button').onclick=openSettings;$('close-settings').onclick=async()=>{await applySettings();$('settings-dialog').close();if(settingsReturn==='pause')$('pause-dialog').showModal();};$('settings-dialog').addEventListener('cancel',e=>{e.preventDefault();$('close-settings').click();});for(const id of ['volume','sensitivity','audio-enabled'])$(id).addEventListener('input',()=>applySettings().catch(console.error));
  $('sound-button').onclick=async()=>{settings.enabled=!settings.enabled;settings=saveSettings(localStorage,settings);await audio.configure(settings);if(mode==='play'&&game.state==='playing')audio.startMusic(game.night);soundUI();};
  for(const b of document.querySelectorAll('[data-night]'))b.onclick=()=>{selectedNight=Number(b.dataset.night);for(const n of document.querySelectorAll('[data-night]'))n.setAttribute('aria-pressed',String(n===b));campaign=new Campaign(tuning);setGame(campaign.startNight(selectedNight));};
  addEventListener('keydown',e=>{if(mode==='play'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(mode==='play'&&(e.code==='Escape'||e.code==='KeyP')&&!$('settings-dialog').open&&!$('help-dialog').open){e.preventDefault();if(!e.repeat)paused(game.state!=='paused');return;}if(mode==='play'&&game.state==='playing')keys.add(e.code);});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(mode==='play'&&game.state==='playing')paused(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play'&&game.state==='playing')paused(true);});addEventListener('resize',()=>world.resize());
  $('world').addEventListener('pointerdown',e=>{if(mode!=='play'||game.state!=='playing')return;pointer={id:e.pointerId,x:e.clientX};$('world').setPointerCapture(e.pointerId);});$('world').addEventListener('pointermove',e=>{if(pointer?.id!==e.pointerId)return;yaw-=(e.clientX-pointer.x)*.006*settings.sensitivity;pointer.x=e.clientX;});for(const type of ['pointerup','pointercancel'])$('world').addEventListener(type,()=>pointer=null);$('world').addEventListener('wheel',e=>{e.preventDefault();cameraDistance=Math.max(11,Math.min(35,cameraDistance+e.deltaY*.012));},{passive:false});
  for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
  last=performance.now();requestAnimationFrame(frame);
}
init().catch(e=>{console.error(e);write('error-message',e.message);$('error-panel').hidden=false;$('home').hidden=true;});
