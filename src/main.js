import { Game, DT, distanceXZ } from './core/game.js';
import { World } from './world.js';
import { Audio } from './audio.js';

const $ = (id) => document.getElementById(id);
const audio = new Audio();
let game, world, tuning, home = true, paused = false, yaw = .48, cameraDistance = 17;
let accumulator = 0, last = performance.now(), toastUntil = 0, lastHudTick = -1, pointer = null;
const keys = new Set(), markers = new Map();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function showToast(message, duration = 2600) {
  $('toast').textContent = message; $('toast').classList.add('visible'); toastUntil = performance.now() + duration;
}
function setSoundButton(enabled) {
  $('sound-button').setAttribute('aria-pressed', String(enabled));
  $('sound-button').setAttribute('aria-label', enabled ? 'Tắt âm thanh' : 'Bật âm thanh');
  $('sound-button').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z${enabled ? ' M15 8q5 4 0 8 M18 5q8 7 0 14' : ' M16 9l5 6m0-6-5 6'}"/></svg>`;
}
function input() {
  return {
    move: [(keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)],
    cam_yaw_deg: yaw * 180 / Math.PI,
    jump: keys.has('Space'), interact: keys.has('KeyE'), pulse: keys.has('KeyQ')
  };
}

function resetGame() {
  game = new Game({ seed: 2026, tuning });
  world.reset(game); keys.clear(); accumulator = 0; lastHudTick = -1;
  $('markers').replaceChildren(); markers.clear();
  for (const lamp of game.lanterns) {
    const marker = document.createElement('div'); marker.className = 'lamp-marker'; marker.innerHTML = `<span class="dot"></span>Đèn ${lamp.id.slice(1).padStart(2, '0')}`;
    $('markers').append(marker); markers.set(lamp.id, marker);
  }
  $('lamp-progress').innerHTML = Array.from({ length: tuning.lantern_count_night1 }, () => '<span class="lamp-light"></span>').join('');
  updateHUD();
}
function startGame() {
  for (const id of ['end-dialog', 'pause-dialog', 'help-dialog']) $(id).close();
  home = false; paused = false; yaw = .48; cameraDistance = innerWidth < 720 ? 21 : 17;
  resetGame(); $('home').hidden = true; $('hud').hidden = false; $('pause-button').hidden = false;
  $('pulse-status').hidden = false; $('touch-controls').hidden = false; document.body.classList.add('playing');
  $('world').focus({ preventScroll: true });
  showToast('Chào Mây! Gom đom đóm và mang ánh sáng về 5 ngọn đèn.', 4200);
}
function pause(show = true) {
  if (home || game.state !== 'playing') return;
  paused = show; keys.clear(); accumulator = 0;
  if (show) { if (!$('pause-dialog').open) $('pause-dialog').showModal(); }
  else { $('pause-dialog').close(); $('world').focus({ preventScroll: true }); }
}
function endGame(event) {
  keys.clear();
  const won = event.data.result === 'won';
  $('end-symbol').textContent = won ? '✺' : '☾';
  $('end-eyebrow').textContent = won ? 'BÌNH MINH TRÊN ĐẢO BẾN' : 'MỘT ĐÊM CHƯA TRỌN VẸN';
  $('end-title').textContent = won ? 'Ánh sáng đã trở về.' : 'Một đốm sáng vẫn còn.';
  $('end-description').textContent = won ? 'Năm ngọn đèn thức giấc, sương đen tan dần. Cảm ơn Mây đã giữ gìn những điều nhỏ bé.' : event.data.reason === 'dawn' ? 'Bình minh đã đến trước khi những ngọn đèn được thắp hết. Thử một hành trình nữa nhé.' : 'Ngọn lửa của Mây đã tắt. Hãy dùng tỏa sáng và tìm nơi trú dưới những chiếc đèn trong lần tiếp theo.';
  $('end-score').textContent = game.score.toLocaleString('vi-VN');
  $('end-lamps').textContent = `${game.lanterns.filter((l) => l.lit).length} / ${tuning.lantern_count_night1}`;
  $('interaction').hidden = true;
  if (!$('end-dialog').open) $('end-dialog').showModal();
  if (won) audio.chime([392, 493.88, 587.33, 783.99, 987.77], .05);
}
function handleEvent(event) {
  audio.event(event.name);
  if (event.name === 'lantern_lit') showToast('Một ngọn đèn thức giấc. Vòng sáng này sẽ bảo vệ Mây.');
  if (event.name === 'player_hit') showToast(`Bóng Mực chạm vào Mây! Còn ${event.data.flames} ngọn lửa.`, 1900);
  if (event.name === 'pulse') world.pulse(game.player.pos);
  if (event.name === 'game_over') endGame(event);
}

function updateHUD() {
  $('carried').textContent = game.player.carried;
  $('capacity').textContent = `/ ${tuning.carry_capacity}`;
  $('capacity-fill').style.width = `${game.player.carried / tuning.carry_capacity * 100}%`;
  $('flames').innerHTML = Array.from({ length: tuning.flames }, (_, i) => `<span${i >= game.player.flames ? ' class="empty"' : ''}><svg width="18" height="25" viewBox="0 0 20 28" aria-hidden="true"><path fill="currentColor" d="M11 1C14 9 19 10 19 17a9 9 0 0 1-18 0c0-5 3-8 5-10-1 5 1 6 3 7 3-4 1-9 2-13Z"/><path fill="#fff0c0" d="M10 15c3 3 4 4 4 6a4 4 0 0 1-8 0c0-2 2-4 4-6Z"/></svg></span>`).join('');
  $('flames').setAttribute('aria-label', `${game.player.flames} ngọn lửa`);
  const seconds = Math.max(0, Math.ceil(game.timeLeft));
  $('timer').textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  $('timer').classList.toggle('urgent', seconds < 45);
  $('score').textContent = game.score.toLocaleString('vi-VN');
  const count = game.lanterns.filter((l) => l.lit).length;
  $('lamp-count').textContent = `${count} / ${tuning.lantern_count_night1} ngọn đèn`;
  [...$('lamp-progress').children].forEach((node, i) => node.classList.toggle('lit', game.lanterns[i].lit));
  const nearest = game.lanterns.filter((l) => !l.lit && distanceXZ(l.pos, game.player.pos) <= tuning.interact_radius).sort((a, b) => distanceXZ(a.pos, game.player.pos) - distanceXZ(b.pos, game.player.pos))[0];
  $('interaction').hidden = !nearest || home || game.state !== 'playing';
  if (nearest) $('interaction-text').textContent = game.player.carried ? `Nạp ánh sáng · ${nearest.deposited}/${tuning.lantern_cost}` : `Cần đom đóm · ${nearest.deposited}/${tuning.lantern_cost}`;
  const cooldown = Math.max(0, (game.pulseReadyAt - game.tick) / 60);
  $('pulse-hint').textContent = cooldown > 0 ? `Hồi lại sau ${cooldown.toFixed(1)}s` : `Q · ${tuning.pulse_cost} đom đóm`;
  $('pulse-status').classList.toggle('unavailable', cooldown > 0 || game.player.carried < tuning.pulse_cost);
  $('pulse-ring').style.opacity = cooldown > 0 ? .2 : .8;
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, .1); last = now;
  if (!home && !paused && game.state === 'playing') {
    accumulator += dt;
    while (accumulator >= DT) {
      const before = game.player.carried;
      const command = input();
      const events = game.step(command);
      if (command.pulse && !events.some((e) => e.name === 'pulse') && before < tuning.pulse_cost && game.tick % 30 === 0) showToast(`Cần ${tuning.pulse_cost} đom đóm để tỏa sáng.`, 1500);
      events.forEach(handleEvent); accumulator -= DT;
      if (game.state !== 'playing') break;
    }
  }
  if (lastHudTick !== game.tick) { updateHUD(); lastHudTick = game.tick; }
  if (now > toastUntil) $('toast').classList.remove('visible');
  world.update(game, now / 1000, dt, { home, yaw, distance: cameraDistance, reduceMotion });
  for (const lamp of game.lanterns) {
    const marker = markers.get(lamp.id);
    const projected = world.project([lamp.pos[0], 3.9, lamp.pos[2]]);
    marker.style.display = !home && projected.visible && !paused ? 'block' : 'none';
    marker.style.left = `${projected.x}px`; marker.style.top = `${projected.y}px`; marker.classList.toggle('lit', lamp.lit);
  }
  requestAnimationFrame(frame);
}

async function init() {
  document.body.classList.add('loading');
  const response = await fetch('/game.contract.json');
  if (!response.ok) throw new Error('Không tải được game.contract.json. Hãy mở game bằng npm start.');
  tuning = (await response.json()).tuning;
  world = new World($('world'), tuning); resetGame();
  $('help-cost').textContent = tuning.lantern_cost; $('help-pulse').textContent = tuning.pulse_cost;
  $('start-button').addEventListener('click', startGame);
  $('restart-button').addEventListener('click', startGame);
  $('restart-pause').addEventListener('click', startGame);
  $('pause-button').addEventListener('click', () => pause());
  $('resume-button').addEventListener('click', () => pause(false));
  $('pause-dialog').addEventListener('cancel', (event) => { event.preventDefault(); pause(false); });
  $('help-button').addEventListener('click', () => {
    if (!home && game.state === 'playing') { paused = true; keys.clear(); accumulator = 0; }
    $('help-dialog').showModal();
  });
  const closeHelp = () => { $('help-dialog').close(); paused = false; keys.clear(); accumulator = 0; };
  $('close-help').addEventListener('click', closeHelp);
  $('help-dialog').addEventListener('cancel', (event) => { event.preventDefault(); closeHelp(); });
  $('end-dialog').addEventListener('cancel', (event) => event.preventDefault());
  $('home-button').addEventListener('click', () => {
    $('end-dialog').close(); home = true; paused = false; resetGame();
    $('home').hidden = false; $('hud').hidden = true; $('pause-button').hidden = true; $('interaction').hidden = true;
    $('pulse-status').hidden = true; $('touch-controls').hidden = true; document.body.classList.remove('playing');
  });
  $('sound-button').addEventListener('click', async () => { try { setSoundButton(await audio.toggle()); } catch { showToast('Trình duyệt chưa cho phép phát âm thanh.'); } });
  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) && !home) event.preventDefault();
    if (event.code === 'Escape' && !home && !$('help-dialog').open && !$('pause-dialog').open && !$('end-dialog').open) { event.preventDefault(); pause(); return; }
    if (!home && !paused && game.state === 'playing') keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); if (!home && !paused && game.state === 'playing') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !home && !paused && game.state === 'playing') pause(); });
  window.addEventListener('resize', () => world.resize());
  $('world').addEventListener('pointerdown', (event) => { if (home || paused) return; pointer = { id: event.pointerId, x: event.clientX }; $('world').setPointerCapture(event.pointerId); });
  $('world').addEventListener('pointermove', (event) => { if (pointer?.id !== event.pointerId) return; yaw -= (event.clientX - pointer.x) * .006; pointer.x = event.clientX; });
  $('world').addEventListener('pointerup', () => { pointer = null; });
  $('world').addEventListener('pointercancel', () => { pointer = null; });
  $('world').addEventListener('wheel', (event) => { event.preventDefault(); cameraDistance = Math.max(11, Math.min(29, cameraDistance + event.deltaY * .012)); }, { passive: false });
  for (const button of document.querySelectorAll('[data-key]')) {
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(button.dataset.key); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => keys.delete(button.dataset.key));
  }
  document.body.classList.remove('loading'); last = performance.now(); requestAnimationFrame(frame);
}

init().catch((error) => {
  console.error(error); $('error-message').textContent = error.message; $('error-panel').hidden = false; $('home').hidden = true;
});
