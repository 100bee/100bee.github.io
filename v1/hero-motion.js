(() => {
  'use strict';

  // A small, dependency-free 3D geometric composition. Content remains readable
  // without JavaScript or canvas; motion stops offscreen and for reduced motion.
  const canvas = document.querySelector('#hero-canvas');
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-art');
  const context = canvas?.getContext('2d');
  if (!context || !hero || !art) return;

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let scale = 1;
  let clock = .9;
  let lastTime = 0;
  let frame = 0;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  let easedX = 0;
  let easedY = 0;
  let seed = 107;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const normalize = ([x, y, z]) => {
    const magnitude = Math.hypot(x, y, z);
    return [x / magnitude, y / magnitude, z / magnitude];
  };
  const golden = (1 + Math.sqrt(5)) / 2;
  const vertices = [
    [-1,golden,0],[1,golden,0],[-1,-golden,0],[1,-golden,0],
    [0,-1,golden],[0,1,golden],[0,-1,-golden],[0,1,-golden],
    [golden,0,-1],[golden,0,1],[-golden,0,-1],[-golden,0,1]
  ].map(normalize);
  const faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
  ];
  const nodes = Array.from({ length: 76 }, (_, i) => {
    const y = 1 - (i / 75) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = Math.PI * (3 - Math.sqrt(5)) * i;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  });
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.hypot(...nodes[i].map((n, axis) => n - nodes[j][axis])) < .48) edges.push([i,j]);
    }
  }
  const shards = Array.from({ length: 36 }, () => ({
    angle: random() * Math.PI * 2,
    elevation: (random() - .5) * 1.9,
    radius: 205 + random() * 105,
    size: 3 + random() * 9,
    turn: random() * Math.PI,
    blue: random() > .6
  }));
  const rotate = ([x, y, z], yaw, pitch) => {
    const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
    const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
    return [x1, y * Math.cos(pitch) - z1 * Math.sin(pitch), y * Math.sin(pitch) + z1 * Math.cos(pitch)];
  };
  const project = ([x, y, z]) => {
    const perspective = 900 / (900 - z);
    return [width * .51 + x * perspective * scale, height * .5 + y * perspective * scale, z];
  };
  const polygon = (points) => {
    context.beginPath();
    points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
  };
  const draw = () => {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const yaw = clock * .12 + easedX * .12;
    const pitch = -.28 + easedY * .09;
    const shell = nodes.map((n) => rotate(n.map(v => v * 185), yaw, pitch));
    const projectedNodes = shell.map(project);

    for (let ring = 0; ring < 3; ring++) {
      context.beginPath();
      for (let step = 0; step <= 150; step++) {
        const a = step / 150 * Math.PI * 2;
        const point = project(rotate([Math.cos(a) * 225, Math.sin(a) * 225, 0], yaw + ring * 1.05, .65 + ring * .55));
        if (step) context.lineTo(point[0], point[1]);
        else context.moveTo(point[0], point[1]);
      }
      context.strokeStyle = ring === 1 ? 'rgba(37,99,235,.2)' : 'rgba(36,63,112,.14)';
      context.lineWidth = .75;
      context.stroke();
    }

    for (const [from, to] of edges) {
      const depth = (shell[from][2] + shell[to][2]) / 370;
      context.beginPath();
      context.moveTo(projectedNodes[from][0], projectedNodes[from][1]);
      context.lineTo(projectedNodes[to][0], projectedNodes[to][1]);
      context.strokeStyle = `rgba(51,88,156,${.11 + (depth + 1) * .12})`;
      context.lineWidth = .6;
      context.stroke();
    }
    for (const [x, y, z] of projectedNodes) {
      context.beginPath();
      context.arc(x, y, (z > 30 ? 1.7 : 1.1) * scale, 0, Math.PI * 2);
      context.fillStyle = z > 40 ? '#3567b8' : '#a8b9d4';
      context.fill();
    }

    const core = vertices.map(v => rotate(v.map(n => n * 121), -yaw * 1.2 + .4, pitch + .3));
    const orderedFaces = faces.map((indices) => ({
      indices,
      depth: indices.reduce((sum, index) => sum + core[index][2], 0) / 3
    })).sort((a, b) => a.depth - b.depth);
    for (const { indices } of orderedFaces) {
      const [a, b, c] = indices.map(i => core[i]);
      const ab = b.map((n, i) => n - a[i]);
      const ac = c.map((n, i) => n - a[i]);
      const normal = normalize([ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]]);
      const light = Math.max(0, Math.min(1, (normal[0] * -.3 + normal[1] * -.6 + normal[2] * .7 + 1) / 2));
      const r = Math.round(15 + light * 70);
      const g = Math.round(40 + light * 100);
      const bColor = Math.round(104 + light * 151);
      polygon(indices.map(i => project(core[i])));
      context.fillStyle = `rgb(${r},${g},${bColor})`;
      context.fill();
      context.strokeStyle = 'rgba(155,190,255,.28)';
      context.lineWidth = .6;
      context.stroke();
    }

    for (const shard of shards) {
      const angle = shard.angle + clock * .03;
      const location = rotate([Math.cos(angle) * shard.radius, Math.sin(angle) * shard.radius * .78, Math.sin(shard.elevation) * 170], yaw * .25, .13);
      const [x, y, z] = project(location);
      const size = shard.size * scale * (900 / (900 - z));
      context.save();
      context.translate(x, y);
      context.rotate(shard.turn + clock * .07);
      polygon([[0, -size], [size * .74, size * .58], [-size * .62, size * .35]]);
      context.fillStyle = shard.blue ? 'rgba(37,99,235,.74)' : (z > 0 ? 'rgba(27,43,69,.64)' : 'rgba(120,146,189,.35)');
      context.fill();
      polygon([[0, -size], [size * .74, size * .58], [0, 0]]);
      context.fillStyle = 'rgba(183,210,255,.45)';
      context.fill();
      context.restore();
    }
  };
  const animate = (now) => {
    frame = 0;
    if (!visible || document.hidden || motionPreference.matches) return;
    if (now - lastTime >= 1000 / 30) {
      clock += Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      easedX += (pointerX - easedX) * .04;
      easedY += (pointerY - easedY) * .04;
      draw();
    }
    frame = requestAnimationFrame(animate);
  };
  const syncMotion = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    draw();
    if (visible && !document.hidden && !motionPreference.matches) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  };
  const resize = () => {
    const bounds = art.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    scale = Math.min(width, height) / 670;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(art);
  else addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncMotion();
  }, { threshold: 0 }).observe(hero);
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || motionPreference.matches) return;
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  document.addEventListener('visibilitychange', syncMotion);
  motionPreference.addEventListener('change', syncMotion);
  resize();
  art.classList.add('is-ready');
  syncMotion();
})();
