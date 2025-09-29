// Clean single-file Drum Kit implementation
(function () {
  'use strict';

  const defaultKeyMap = {
    w: { sound: 'tom-1.mp3', label: 'Tom 1' },
    a: { sound: 'tom-2.mp3', label: 'Tom 2' },
    s: { sound: 'tom-3.mp3', label: 'Tom 3' },
    d: { sound: 'tom-4.mp3', label: 'Tom 4' },
    j: { sound: 'snare.mp3', label: 'Snare' },
    k: { sound: 'crash.mp3', label: 'Crash' },
    l: { sound: 'kick-bass.mp3', label: 'Kick' }
  };

  function loadJSON(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  let keyMap = loadJSON('drumKeyMap', defaultKeyMap);
  let volume = Number(localStorage.getItem('drumVolume') || 1);

  (function injectCSS() {
    const css = `
body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:18px;background:#0f0f11;color:#f4f4f4}
.set{display:flex;gap:12px;flex-wrap:wrap;max-width:720px}
.drum{background:linear-gradient(180deg,#3b3b3b,#1f1f1f);border:2px solid rgba(255,255,255,0.04);color:#fff;padding:22px 18px;border-radius:8px;font-size:18px;cursor:pointer;position:relative;transition:transform .06s ease,box-shadow .06s ease}
.drum.pressed{transform:scale(.98);box-shadow:0 6px 18px rgba(0,0,0,.6),inset 0 -6px 16px rgba(0,0,0,.4)}
.controls{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.panel{background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.03)}
.panel h3{margin:0 0 6px 0;font-size:13px}
.drum-ripple{position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);}
@keyframes ripple{0%{opacity:0.9;transform:translate(-50%,-50%) scale(.38)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}
.drum-ripple.anim{animation:ripple 260ms linear}
footer{margin-top:18px;color:#bdbdbd}
input[type=range]{vertical-align:middle}
button{cursor:pointer}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  })();

  function soundPath(name) { return name; }

  function injectUI() {
    const container = document.createElement('div'); container.className = 'controls';

    const volPanel = document.createElement('div'); volPanel.className = 'panel';
    volPanel.innerHTML = `<h3>Volume</h3><label><input id='drum-vol' type='range' min='0' max='1' step='0.01' value='${volume}'> <span id='drum-vol-val'>${Math.round(volume*100)}%</span></label>`;
    container.appendChild(volPanel);

    const remapPanel = document.createElement('div'); remapPanel.className = 'panel'; remapPanel.innerHTML = `<h3>Key Remap</h3><div id='remap-list'></div>`; container.appendChild(remapPanel);

    const recPanel = document.createElement('div'); recPanel.className = 'panel';
    recPanel.innerHTML = `<h3>Recording</h3><div><button id='rec-btn'>Record</button> <button id='stop-btn' disabled>Stop</button> <button id='play-btn' disabled>Play</button> <button id='clear-btn'>Clear</button></div><div id='rec-status' style='margin-top:6px;font-size:13px;color:#ccc'>Idle</div>`;
    container.appendChild(recPanel);

    const metroPanel = document.createElement('div'); metroPanel.className = 'panel';
    metroPanel.innerHTML = `<h3>Metronome</h3><label>BPM: <input id='metro-bpm' type='number' min='40' max='240' value='120' style='width:66px'></label> <button id='metro-btn'>Start</button>`;
    container.appendChild(metroPanel);

    document.body.insertBefore(container, document.body.firstChild);

    const remapList = remapPanel.querySelector('#remap-list'); remapList.innerHTML = '';
    Object.entries(keyMap).forEach(([k, { label }]) => {
      const row = document.createElement('div'); row.style.marginBottom = '6px';
      row.innerHTML = `${label}: <input data-old='${k}' class='remap-input' value='${k}' maxlength='1' style='width:26px;text-align:center;margin-left:6px'> <button class='remap-set' data-old='${k}' style='margin-left:6px'>Set</button>`;
      remapList.appendChild(row);
    });

    const volEl = document.getElementById('drum-vol'); const volVal = document.getElementById('drum-vol-val');
    volEl.addEventListener('input', e => { volume = Number(e.target.value); volVal.textContent = Math.round(volume*100) + '%'; localStorage.setItem('drumVolume', String(volume)); });

    remapList.querySelectorAll('.remap-set').forEach(btn => {
      btn.addEventListener('click', () => {
        const oldKey = btn.getAttribute('data-old'); const input = btn.parentElement.querySelector('.remap-input'); const newKey = (input.value || '').toLowerCase();
        if (!newKey.match(/^[a-z0-9]$/)) { alert('Invalid key (use alphanumeric).'); input.value = oldKey; return; }
        if (newKey === oldKey) return; if (keyMap[newKey]) { alert('Key already in use'); input.value = oldKey; return; }
        keyMap[newKey] = keyMap[oldKey]; delete keyMap[oldKey]; saveJSON('drumKeyMap', keyMap); location.reload();
      });
    });
  }

  injectUI();

  const drumButtons = Array.from(document.querySelectorAll('.drum'));

  function playSound(key) { const mapping = keyMap[key]; if (!mapping) return; const audio = new Audio(soundPath(mapping.sound)); audio.volume = volume; audio.currentTime = 0; audio.play().catch(() => {}); }

  function animateButton(key) { const btn = drumButtons.find(b => b.textContent.trim().toLowerCase() === key); if (!btn) return; btn.classList.add('pressed'); createRipple(btn); setTimeout(() => btn.classList.remove('pressed'), 160); }

  function createRipple(btn) {
    const rect = btn.getBoundingClientRect(); const ripple = document.createElement('span'); ripple.className = 'drum-ripple anim';
    ripple.style.left = (rect.width / 2) + 'px'; ripple.style.top = (rect.height / 2) + 'px'; ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    ripple.style.background = 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)'; ripple.style.zIndex = '6'; btn.style.position = 'relative'; btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  let isRecording = false, recordSequence = [], recordStart = 0;
  function triggerHit(key) { playSound(key); animateButton(key); if (isRecording) recordSequence.push({ key, time: Date.now() - recordStart }); }

  drumButtons.forEach(btn => btn.addEventListener('click', () => triggerHit(btn.textContent.trim().toLowerCase())));
  document.addEventListener('keydown', e => { const key = (e.key || '').toLowerCase(); if (keyMap[key]) triggerHit(key); });

  function setupRecordingControls() {
    const recBtn = document.getElementById('rec-btn'); const stopBtn = document.getElementById('stop-btn'); const playBtn = document.getElementById('play-btn'); const clearBtn = document.getElementById('clear-btn'); const status = document.getElementById('rec-status');
    recBtn.addEventListener('click', () => { isRecording = true; recordSequence = []; recordStart = Date.now(); recBtn.disabled = true; stopBtn.disabled = false; playBtn.disabled = true; status.textContent = 'Recording...'; });
    stopBtn.addEventListener('click', () => { isRecording = false; recBtn.disabled = false; stopBtn.disabled = true; playBtn.disabled = recordSequence.length === 0; status.textContent = `Recorded ${recordSequence.length} hits`; });
    playBtn.addEventListener('click', () => { if (!recordSequence.length) return; status.textContent = 'Playing...'; recordSequence.forEach(hit => setTimeout(() => triggerHit(hit.key), hit.time)); setTimeout(() => status.textContent = 'Idle', recordSequence[recordSequence.length - 1].time + 200); });
    clearBtn.addEventListener('click', () => { recordSequence = []; playBtn.disabled = true; status.textContent = 'Cleared'; });
  }

  setupRecordingControls();

  let metroTimer = null;
  function playTick() { const tick = new Audio(soundPath('snare.mp3')); tick.volume = Math.min(1, volume * 0.6); tick.play().catch(() => {}); }
  const metroBtn = document.getElementById('metro-btn'); metroBtn.addEventListener('click', () => { if (metroTimer) stopMetro(); else startMetro(); });
  function startMetro() { const bpm = Number(document.getElementById('metro-bpm').value) || 120; const interval = 60000 / bpm; metroTimer = setInterval(playTick, interval); metroBtn.textContent = 'Stop'; }
  function stopMetro() { clearInterval(metroTimer); metroTimer = null; metroBtn.textContent = 'Start'; }

  window._drumkit = { keyMap, setKeyMap: (m) => { keyMap = m; saveJSON('drumKeyMap', m); }, getVolume: () => volume };

})();
