/* Pizza Spin — keyboard, one player.
   The game itself is untouched: it reads controllers through navigator.getGamepads(), so this file hands it two
   virtual ones. Pad 0 is the keyboard (and the mouse for the dough); a real controller, if one is plugged in, drives
   it too. Pad 1 is the computer: it joins, picks the other chef and steps aside, so one person can play. */
(function () {
  'use strict';
  var BTN = { A: 0, B: 1, X: 2, RB: 5, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  function makePad(id, index) {
    var b = []; for (var i = 0; i < 17; i++) b.push({ pressed: false, value: 0, touched: false });
    return { id: id, index: index, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: b, vibrationActuator: null };
  }
  var kb = makePad('Keyboard', 0), cpu = makePad('Computer', 1);
  var realGet = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : function () { return []; };
  navigator.getGamepads = function () { return [kb, cpu]; };

  /* ---- keys (by physical position, so an Arabic keyboard layout works the same) ---- */
  var down = {};
  var GAME_KEYS = /^(Key[WASDEF]|Arrow(Up|Down|Left|Right)|Space|Enter|NumpadEnter|Escape|Backspace)$/;
  addEventListener('keydown', function (e) { if (GAME_KEYS.test(e.code)) { e.preventDefault(); down[e.code] = true; } }, true);
  addEventListener('keyup', function (e) { if (GAME_KEYS.test(e.code)) { e.preventDefault(); down[e.code] = false; } }, true);
  addEventListener('blur', function () { down = {}; });
  function k() { for (var i = 0; i < arguments.length; i++) if (down[arguments[i]]) return true; return false; }

  /* ---- the mouse is the stick for the dough ---- */
  var mouse = { x: 0, y: 0, at: 0 };
  addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.at = performance.now(); }, { passive: true });
  function canvasRect() { var c = document.getElementById('game'); return c ? c.getBoundingClientRect() : null; }
  // the dough panel is centred at (320, 422) of the game's 1280×720 picture, and a full push of the stick is 160 px
  function mouseStick() {
    var r = canvasRect(); if (!r || !r.width) return null;
    var x = (mouse.x - r.left) * 1280 / r.width, y = (mouse.y - r.top) * 720 / r.height;
    return [(x - 320) / 160, (y - 422) / 160];
  }

  function G() { try { return game; } catch (e) { return null; } } // the game's own state, read only (except one line below)
  var spinAng = -Math.PI / 2, flip = false, cpuT = 0;

  function setBtn(pad, b, on) { pad.buttons[b].pressed = !!on; pad.buttons[b].value = on ? 1 : 0; }
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(.05, (now - (tick.last || now)) / 1000); tick.last = now; flip = !flip;
    var g = G(), scr = g ? g.screen : '', p1 = g && g.players ? g.players[0] : null, p2 = g && g.players ? g.players[1] : null;
    var real = null; try { var list = realGet() || []; for (var i = 0; i < list.length; i++) if (list[i] && list[i].connected) { real = list[i]; break; } } catch (e) {}
    function rb(b) { return !!(real && real.buttons[b] && (real.buttons[b].pressed || real.buttons[b].value > .5)); }
    function ra(a) { return real && real.axes[a] ? real.axes[a] : 0; }

    var menus = scr !== 'play';
    var fwd = k('KeyW', 'ArrowUp'), back = k('KeyS', 'ArrowDown'), left = k('KeyA', 'ArrowLeft'), right = k('KeyD', 'ArrowRight');
    setBtn(kb, BTN.A, k('Space', 'Enter', 'NumpadEnter') || rb(0));
    setBtn(kb, BTN.B, k('KeyF', 'Backspace') || (menus && k('Escape')) || rb(1));
    setBtn(kb, BTN.X, k('KeyE') || rb(2));
    setBtn(kb, BTN.RB, rb(5));
    setBtn(kb, BTN.START, (!menus && k('Escape')) || rb(9));
    setBtn(kb, BTN.UP, fwd || rb(12)); setBtn(kb, BTN.DOWN, back || rb(13));
    setBtn(kb, BTN.LEFT, left || rb(14)); setBtn(kb, BTN.RIGHT, right || rb(15));

    // walking and turning: W/S walk, A/D turn (the left stick and the right stick of a controller)
    var ax = [ra(0), ra(1), ra(2), ra(3)];
    if (fwd || back) ax[1] = (back ? 1 : 0) - (fwd ? 1 : 0);
    if (left || right) ax[2] = (right ? 1 : 0) - (left ? 1 : 0);

    // the dough: A/D turn a cursor round the ring at a steady pace, W tosses; or the mouse is the stick
    if (p1 && p1.mini === 'dough') {
      var d = p1.dough || {};
      if (left || right) {
        spinAng += (right ? 1 : -1) * (d.step === 2 ? 2.2 : .75) * 6.2832 * dt;
        ax[2] = Math.cos(spinAng) * (d.step === 2 ? 1 : .7); ax[3] = -Math.sin(spinAng) * (d.step === 2 ? 1 : .7);
      } else if (fwd) { ax[2] = 0; ax[3] = -1; }
      else if (now - mouse.at < 1500) { var m = mouseStick(); if (m) { ax[2] = m[0]; ax[3] = m[1]; } }
      else if (!real) { ax[2] = 0; ax[3] = 0; }
      ax[1] = real ? ax[1] : 0; // the stick that walks does nothing here
    }
    kb.axes = ax; kb.timestamp = now;

    /* ---- the computer player ---- */
    var cA = false, cL = false, cR = false;
    if (g && p1 && p2) {
      if (scr === 'bind') { // join both players without asking anyone to press anything
        if (p1.pad === null) setBtn(kb, BTN.A, flip); else if (p2.pad === null) cA = flip; else setBtn(kb, BTN.A, flip);
      } else if (scr === 'charselect') { // wait for the player, then take the other chef
        if (p1.charConfirmed && !p2.charConfirmed) {
          var want = 1 - p1.charIdx, rtl = g.lang === 'ar';
          if (p2.charIdx !== want) { if ((want === 0) !== rtl) cL = flip; else cR = flip; } else cA = flip;
        }
      } else if (scr === 'play' && p1.finished && !p2.finished) {
        // the computer never cooks, so once the player has served the round ends instead of waiting out the clock
        cpuT += dt; if (cpuT > 1.2) { p2.finished = true; p2.phase = 'done'; cpuT = 0; }
      } else cpuT = 0;
    }
    setBtn(cpu, BTN.A, cA); setBtn(cpu, BTN.LEFT, cL); setBtn(cpu, BTN.RIGHT, cR);
    cpu.timestamp = now;
    help(scr, g, p1);
  }
  requestAnimationFrame(tick);

  /* ---- what the keys do, on screen: over the computer's half while playing, a bar in the menus ---- */
  var T = {
    en: { rival: 'Your rival is the computer: it stays out of your way, so cook fast and score high.', mode: 'Practice · 1 player · keyboard', walk: 'walk', turn: 'turn', use: 'use · pick · catch — hold to heat the oven', shove: 'shove', item: 'use your item', pause: 'pause',
      dough: 'Dough: circle the mouse around it (or hold A / D), W to toss', start: 'Walk to the customer first to hear the order.', pads: 'Two players? Plug in two controllers',
      bar: '<b>Enter</b> = A &nbsp;·&nbsp; <b>Esc</b> = back &nbsp;·&nbsp; <b>← →</b> choose' },
    ar: { rival: 'منافسك هو الكمبيوتر: لن يعترض طريقك، فاطبخ بسرعة واجمع أعلى النقاط.', mode: 'تدريب · لاعب واحد · لوحة المفاتيح', walk: 'المشي', turn: 'الالتفاف', use: 'استخدم · التقط · امسك — اضغط مطوّلًا لتسخين الفرن', shove: 'ادفع', item: 'استخدم الأداة', pause: 'إيقاف مؤقت',
      dough: 'العجين: حرّك الفأرة في دوائر حوله (أو اضغط A / D)، و W للرمي', start: 'اذهب إلى الزبون أولًا لتسمع الطلب.', pads: 'لاعبان؟ وصّل يدَي تحكم',
      bar: '<b>Enter</b> = A &nbsp;·&nbsp; <b>Esc</b> = رجوع &nbsp;·&nbsp; <b>← →</b> اختيار' }
  };
  var css = document.createElement('style');
  css.textContent =
    '#kb-panel,#kb-bar{position:fixed;z-index:5;font:600 14px/1.45 "Segoe UI",Tahoma,system-ui,sans-serif;color:#4a2e17;pointer-events:none}' +
    '#kb-panel{display:none;flex-direction:column;justify-content:center;gap:10px;padding:26px 30px;box-sizing:border-box;background:linear-gradient(#fbf3e2,#f2e2c3);border-inline-start:6px solid #6b4426}' +
    '#kb-panel h2{margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#c8462b}' +
    '#kb-panel ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}' +
    '#kb-panel li{display:flex;gap:10px;align-items:baseline}' +
    '#kb-panel kbd,#kb-bar b{display:inline-block;min-width:22px;padding:1px 7px;border-radius:6px;border:2px solid #6b4426;border-bottom-width:4px;background:#fffaf0;font:800 12px/1.5 "Segoe UI",system-ui,sans-serif;text-align:center;color:#4a2e17;white-space:nowrap}' +
    '#kb-panel p{margin:4px 0 0;font-weight:600}#kb-panel .tip{color:#c8462b}' +
    '#kb-panel a{pointer-events:auto;color:#2a8f83;font-size:13px}' +
    '#kb-bar{display:none;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:999px;background:rgba(255,250,240,.94);box-shadow:0 6px 20px rgba(60,35,10,.25);white-space:nowrap}';
  document.head.appendChild(css);
  var panel = document.createElement('div'); panel.id = 'kb-panel';
  var bar = document.createElement('div'); bar.id = 'kb-bar';
  function mount() { if (document.body && !panel.parentNode) { document.body.appendChild(panel); document.body.appendChild(bar); } }
  var shown = '';
  function help(scr, g, p1) {
    mount();
    var lang = g && g.lang === 'ar' ? 'ar' : 'en', t = T[lang], r = canvasRect();
    if (!r || !r.width) return;
    var playing = scr === 'play';
    panel.style.display = playing ? 'flex' : 'none';
    bar.style.display = playing ? 'none' : 'block';
    if (playing) { // cover the computer's half of the split screen
      var top = r.top;
      panel.style.left = (r.left + r.width / 2) + 'px'; panel.style.top = top + 'px';
      panel.style.width = r.width / 2 + 'px'; panel.style.height = (r.bottom - top) + 'px';
      panel.style.fontSize = Math.max(11, Math.min(15, r.width / 85)) + 'px';
    } else { bar.style.bottom = Math.max(8, innerHeight - r.bottom + 10) + 'px'; }
    var key = lang + scr + (p1 && p1.mini === 'dough' ? 'd' : '');
    if (key === shown) return; shown = key;
    panel.dir = bar.dir = lang === 'ar' ? 'rtl' : 'ltr';
    bar.innerHTML = t.bar;
    panel.innerHTML = '<h2>' + t.mode + '</h2><p>' + t.rival + '</p><ul>' +
      '<li><kbd>W</kbd><kbd>S</kbd> ' + t.walk + '</li>' +
      '<li><kbd>A</kbd><kbd>D</kbd> ' + t.turn + '</li>' +
      '<li><kbd>Space</kbd> ' + t.use + '</li>' +
      '<li><kbd>F</kbd> ' + t.shove + ' &nbsp; <kbd>E</kbd> ' + t.item + '</li>' +
      '<li><kbd>Esc</kbd> ' + t.pause + '</li></ul>' +
      '<p class="tip">' + (p1 && p1.mini === 'dough' ? t.dough : t.start) + '</p>' +
      '<p><a href="pizza-spin.html">' + t.pads + ' →</a></p>';
  }
})();
