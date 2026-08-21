(() => {
  const btnYes = document.getElementById('btnYes');
  const btnNo  = document.getElementById('btnNo');
  const ask    = document.getElementById('ask');
  const board  = document.querySelector('.board');
  const reveal = document.getElementById('reveal');

  const SAFE = 20; // px margin from viewport edges

  let dodges = 0;
  const MAX_GROWTH = 8;

  function randomSpot(el){
    const w = el.offsetWidth  || 132;
    const h = el.offsetHeight || 52;
    const maxX = Math.max(SAFE, window.innerWidth  - w - SAFE);
    const maxY = Math.max(SAFE, window.innerHeight - h - SAFE);
    const x = SAFE + Math.random() * (maxX - SAFE);
    const y = SAFE + Math.random() * (maxY - SAFE);
    return { x, y };
  }

  function flee(){
    if (!btnNo.classList.contains('fleeing')){
      // freeze current size before detaching from flex layout
      const rect = btnNo.getBoundingClientRect();
      btnNo.style.width  = rect.width + 'px';
      btnNo.classList.add('fleeing');
    }
    const { x, y } = randomSpot(btnNo);
    btnNo.style.left = x + 'px';
    btnNo.style.top  = y + 'px';

    dodges = Math.min(dodges + 1, MAX_GROWTH);
    const grow   = 1 + dodges * 0.045;
    const shrink = Math.max(0.62, 1 - dodges * 0.045);
    btnYes.style.transform = `scale(${grow})`;
    btnNo.style.opacity = shrink;
  }

  // Desktop: dodge on hover approach. Mobile: dodge before the tap lands.
  btnNo.addEventListener('mouseenter', flee);
  btnNo.addEventListener('pointerdown', (e) => { e.preventDefault(); flee(); });
  btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); flee(); }, { passive:false });
  btnNo.addEventListener('click', (e) => { e.preventDefault(); flee(); });

  window.addEventListener('resize', () => {
    if (btnNo.classList.contains('fleeing')){
      const { x, y } = randomSpot(btnNo);
      btnNo.style.left = x + 'px';
      btnNo.style.top  = y + 'px';
    }
  });

  // ---------------- Yes ----------------
  btnYes.addEventListener('click', () => {
    ask.classList.add('hidden');
    board.classList.add('hidden');
    setTimeout(() => reveal.classList.add('visible'), 250);
    launchConfetti();
    launchHearts();
  });

  // ---------------- Confetti ----------------
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId = null;

  const PALETTE = ['#b8697a', '#c9a24d', '#8a9575', '#fbf6ef', '#8f4a5b', '#eec9a3', '#cbb8dd'];

  function resizeCanvas(){
    canvas.width  = window.innerWidth  * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function spawnPiece(side){
    const fromLeft = side === 'left';
    return {
      x: fromLeft ? -6 - Math.random() * 24 : window.innerWidth + 6 + Math.random() * 24,
      y: -20 - Math.random() * window.innerHeight * 0.4,
      vx: (fromLeft ? 1 : -1) * (0.3 + Math.random() * 0.9),
      vy: 1.6 + Math.random() * 2.2,
      size: 5 + Math.random() * 6,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      life: 0,
      maxLife: 420 + Math.random() * 240
    };
  }

  function tick(){
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gentle gravity
      p.vx *= 0.996;
      p.rot += p.vr;
      p.life++;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect'){
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    particles = particles.filter(p => p.life < p.maxLife && p.y < window.innerHeight + 40);

    if (particles.length > 0){
      rafId = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function launchConfetti(){
    const burst = () => {
      for (let i = 0; i < 3; i++){
        particles.push(spawnPiece('left'));
        particles.push(spawnPiece('right'));
      }
    };
    burst();
    let bursts = 0;
    const interval = setInterval(() => {
      burst();
      bursts++;
      if (bursts > 60) clearInterval(interval);
    }, 160);

    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // ---------------- Rising hearts ----------------
  const heartStyleTag = document.createElement('style');
  heartStyleTag.textContent = `
    @keyframes heartRise{
      0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
      10%  { opacity: .9; }
      100% { transform: translateY(-92vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
    }
    .floating-heart{
      position: fixed;
      bottom: -6vh;
      z-index: 32;
      pointer-events: none;
      animation: heartRise linear forwards;
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(heartStyleTag);

  const HEART_COLORS = ['#b8697a', '#c9a24d', '#8a9575'];

  function spawnHeart(){
    const el = document.createElement('span');
    el.className = 'floating-heart';
    const size = 14 + Math.random() * 16;
    el.style.left = (Math.random() * 92 + 4) + 'vw';
    el.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    el.style.setProperty('--spin', (Math.random() * 50 - 25) + 'deg');
    el.style.animationDuration = (5 + Math.random() * 3) + 's';
    el.style.fontSize = size + 'px';
    el.style.color = HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0];
    el.style.opacity = '.85';
    el.textContent = '♥';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function launchHearts(){
    let count = 0;
    const interval = setInterval(() => {
      spawnHeart();
      count++;
      if (count > 18) clearInterval(interval);
    }, 420);
  }
})();
