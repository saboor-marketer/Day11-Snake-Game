import {
  ArenaMode,
  DigestWave,
  Direction,
  FloatingPopup,
  FoodItem,
  GridFlash,
  Particle,
  Point,
  ShockwaveRing,
} from '../types/game';

export const GRID_SIZE = 20;

export interface RenderState {
  snake: Point[];
  prevSnake: Point[];
  direction: Direction;
  tickProgress: number;
  foods: FoodItem[];
  particles: Particle[];
  shockwaves: ShockwaveRing[];
  gridFlashes: GridFlash[];
  popups: FloatingPopup[];
  digestWaves: DigestWave[];
  combo: number;
  comboTimerProgress: number; // 0..1
  arenaMode: ArenaMode;
  isDead: boolean;
  deathFlashAlpha: number;
  now: number;
}

// Interpolate a single coordinate with wrap-around awareness
function lerpCoord(prev: number, curr: number, t: number): number {
  const diff = curr - prev;
  if (Math.abs(diff) > 1.5) {
    // Wrapped around GRID_SIZE
    if (diff < 0) {
      // e.g. 19 -> 0
      const val = prev + (curr + GRID_SIZE - prev) * t;
      return val >= GRID_SIZE ? val - GRID_SIZE : val;
    } else {
      // e.g. 0 -> 19
      const val = prev - (prev + GRID_SIZE - curr) * t;
      return val < 0 ? val + GRID_SIZE : val;
    }
  }
  return prev + diff * t;
}

export function getInterpolatedPoint(prev: Point, curr: Point, t: number): Point {
  return {
    x: lerpCoord(prev.x, curr.x, t),
    y: lerpCoord(prev.y, curr.y, t),
  };
}

// Helper for drawing rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function renderArena(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderState
) {
  const cellSize = width / GRID_SIZE;
  const {
    snake,
    prevSnake,
    direction,
    tickProgress,
    foods,
    particles,
    shockwaves,
    gridFlashes,
    popups,
    digestWaves,
    combo,
    arenaMode,
    isDead,
    deathFlashAlpha,
    now,
  } = state;

  // Smooth cubic ease-out for visual interpolation within a tick (kept mostly linear for continuous motion)
  const t = Math.max(0, Math.min(1, tickProgress));

  // Precalculate interpolated snake positions
  const interpSnake: Point[] = snake.map((seg, i) => {
    const prev = prevSnake[i] || seg;
    return getInterpolatedPoint(prev, seg, t);
  });

  const headPos = interpSnake[0] || { x: 10, y: 10 };

  // 1. Base Playfield Floor (#0F141C)
  ctx.fillStyle = '#0F141C';
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Radial Glow under Snake Head and Food Cores
  const headPx = (headPos.x + 0.5) * cellSize;
  const headPy = (headPos.y + 0.5) * cellSize;

  const headGlow = ctx.createRadialGradient(
    headPx,
    headPy,
    cellSize * 0.2,
    headPx,
    headPy,
    cellSize * 4.2
  );
  if (isDead) {
    headGlow.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
    headGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  } else if (combo >= 4) {
    headGlow.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
    headGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
    headGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  } else {
    headGlow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    headGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  }
  ctx.fillStyle = headGlow;
  ctx.fillRect(0, 0, width, height);

  for (const food of foods) {
    const fx = (food.x + 0.5) * cellSize;
    const fy = (food.y + 0.5) * cellSize;
    const fGlow = ctx.createRadialGradient(fx, fy, cellSize * 0.1, fx, fy, cellSize * 3.5);
    if (food.kind === 'GOLDEN') {
      fGlow.addColorStop(0, 'rgba(245, 158, 11, 0.24)');
      fGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      fGlow.addColorStop(0, 'rgba(244, 63, 94, 0.20)');
      fGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    }
    ctx.fillStyle = fGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Subtle Grid Flashes (when food is eaten or snake turns sharply)
  for (const gf of gridFlashes) {
    const alpha = Math.max(0, (gf.life / gf.maxLife) * 0.45);
    ctx.fillStyle = gf.color.replace('1)', `${alpha})`);
    ctx.fillRect(gf.x * cellSize + 1, gf.y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  // 4. Precision Cyber-Grid Hairlines & Intersection Dots
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.075)';
  ctx.beginPath();
  for (let i = 1; i < GRID_SIZE; i++) {
    const pos = Math.floor(i * cellSize) + 0.5;
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
  }
  ctx.stroke();

  // Subtle grid intersection reticles every 5 cells
  ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
  for (let gx = 5; gx < GRID_SIZE; gx += 5) {
    for (let gy = 5; gy < GRID_SIZE; gy += 5) {
      const cx = gx * cellSize;
      const cy = gy * cellSize;
      ctx.fillRect(cx - 2.5, cy - 0.5, 5, 1);
      ctx.fillRect(cx - 0.5, cy - 2.5, 1, 5);
    }
  }

  // 5. Wall Proximity Warning Glow (in Classic WALLS mode)
  if (arenaMode === 'WALLS' && !isDead && snake.length > 0) {
    const head = snake[0];
    const warnDist = 2;
    ctx.save();
    if (direction === 'UP' && head.y <= warnDist) {
      const grad = ctx.createLinearGradient(0, 0, 0, cellSize * 1.4);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, cellSize * 1.4);
    } else if (direction === 'DOWN' && head.y >= GRID_SIZE - 1 - warnDist) {
      const grad = ctx.createLinearGradient(0, height, 0, height - cellSize * 1.4);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - cellSize * 1.4, width, cellSize * 1.4);
    } else if (direction === 'LEFT' && head.x <= warnDist) {
      const grad = ctx.createLinearGradient(0, 0, cellSize * 1.4, 0);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cellSize * 1.4, height);
    } else if (direction === 'RIGHT' && head.x >= GRID_SIZE - 1 - warnDist) {
      const grad = ctx.createLinearGradient(width, 0, width - cellSize * 1.4, 0);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(width - cellSize * 1.4, 0, cellSize * 1.4, height);
    }
    ctx.restore();
  }

  // 6. Shockwave Rings
  for (const ring of shockwaves) {
    const progress = 1 - ring.life / ring.maxLife;
    const currentRadius = (ring.radius + (ring.maxRadius - ring.radius) * progress) * cellSize;
    const alpha = Math.max(0, (ring.life / ring.maxLife) * 0.75);

    ctx.save();
    ctx.beginPath();
    ctx.arc(ring.x * cellSize, ring.y * cellSize, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1, ring.lineWidth * (1 - progress * 0.6));
    ctx.stroke();
    ctx.restore();
  }

  // 7. Food / Energy Cores
  for (const food of foods) {
    const cx = (food.x + 0.5) * cellSize;
    const cy = (food.y + 0.5) * cellSize;
    const pulse = Math.sin(now * 0.008) * 0.1 + 1;

    ctx.save();
    if (food.kind === 'STANDARD') {
      // Outer Radar Ping Ring
      const pingPhase = ((now - food.spawnTime) % 1400) / 1400;
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * (0.35 + pingPhase * 0.55), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 113, 133, ${(1 - pingPhase) * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glowing Hyper Coral Energy Core (#F43F5E)
      ctx.translate(cx, cy);
      ctx.rotate(now * 0.0022);

      ctx.shadowColor = '#F43F5E';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#F43F5E';

      const coreRadius = cellSize * 0.36 * pulse;
      roundRect(ctx, -coreRadius, -coreRadius, coreRadius * 2, coreRadius * 2, coreRadius * 0.38);
      ctx.fill();

      // Secondary counter-rotated diamond
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#FB7185';
      const innerR = coreRadius * 0.72;
      roundRect(ctx, -innerR, -innerR, innerR * 2, innerR * 2, innerR * 0.25);
      ctx.fill();

      // White-hot center point
      ctx.fillStyle = '#FFF1F2';
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (food.kind === 'GOLDEN') {
      // Timed Solar Amber Multiplier Core (#F59E0B)
      const elapsed = now - food.spawnTime;
      const duration = food.duration || 7500;
      const remainingRatio = Math.max(0, 1 - elapsed / duration);

      // Urgency flicker when < 2 seconds left
      const flicker =
        remainingRatio < 0.25 ? (Math.floor(now / 80) % 2 === 0 ? 0.5 : 1.0) : 1.0;

      ctx.globalAlpha = flicker;

      // Countdown Ring around the Golden Core
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        cellSize * 0.56,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * remainingRatio
      );
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Rotating Star / Octagon Core
      ctx.translate(cx, cy);
      ctx.rotate(-now * 0.004);
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#F59E0B';

      const r = cellSize * 0.38 * pulse;
      for (let k = 0; k < 2; k++) {
        ctx.rotate(Math.PI / 4);
        roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.25);
        ctx.fill();
      }

      // Bright core center
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Snake Body & Head Rendering
  const totalLen = interpSnake.length;

  // Draw segments from tail to head so the head always overlaps cleanly on top
  for (let i = totalLen - 1; i >= 0; i--) {
    const seg = interpSnake[i];
    const isHead = i === 0;
    const isTail = i === totalLen - 1;

    // Calculate Digest Wave boost on this segment
    let waveBoost = 0;
    for (const wave of digestWaves) {
      const dist = Math.abs(wave.segmentIndexFloat - i);
      if (dist < 2.2) {
        waveBoost = Math.max(waveBoost, (1 - dist / 2.2) * wave.intensity);
      }
    }

    const segRatio = i / Math.max(1, totalLen - 1); // 0 at head, 1 at tail
    // Base size tapers slightly toward the tail, swells with digest wave
    const baseScale = isHead
      ? 0.86
      : isTail
      ? 0.58
      : 0.78 - segRatio * 0.16;
    const finalScale = Math.min(0.98, baseScale + waveBoost * 0.18);

    const segW = cellSize * finalScale;
    const cx = (seg.x + 0.5) * cellSize;
    const cy = (seg.y + 0.5) * cellSize;

    // Draw connector bridge to previous segment (closer to head) if adjacent
    if (i > 0) {
      const nextSeg = interpSnake[i - 1];
      const dx = nextSeg.x - seg.x;
      const dy = nextSeg.y - seg.y;
      // Only draw bridge if not wrapping across the arena edge
      if (Math.abs(dx) <= 1.5 && Math.abs(dy) <= 1.5) {
        const ncx = (nextSeg.x + 0.5) * cellSize;
        const ncy = (nextSeg.y + 0.5) * cellSize;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ncx, ncy);
        ctx.strokeStyle = isDead
          ? '#DC2626'
          : waveBoost > 0.2
          ? '#34D399'
          : combo >= 4
          ? `rgba(16, 185, 129, ${0.95 - segRatio * 0.35})`
          : `rgba(5, 150, 105, ${0.9 - segRatio * 0.35})`;
        ctx.lineWidth = segW * 0.82;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.save();
    // Segment color calculation
    if (isDead) {
      ctx.fillStyle = isHead ? '#FCA5A5' : i % 2 === 0 ? '#EF4444' : '#B91C1C';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = isHead ? 16 : 6;
    } else if (isHead) {
      ctx.fillStyle = combo >= 5 ? '#34D399' : '#10B981';
      ctx.shadowColor = combo >= 4 ? '#F59E0B' : '#10B981';
      ctx.shadowBlur = 14;
    } else {
      // Smooth gradient from Phosphor Emerald (#10B981) to Deep Jade (#059669)
      if (waveBoost > 0.15) {
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 10 * waveBoost;
      } else {
        // Interpolate RGB between #10B981 (16, 185, 129) and #047857 (4, 120, 87)
        const r = Math.round(16 - segRatio * 12);
        const g = Math.round(185 - segRatio * 65);
        const b = Math.round(129 - segRatio * 42);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      }
    }

    const radius = isHead ? segW * 0.34 : segW * 0.38;
    roundRect(ctx, cx - segW / 2, cy - segW / 2, segW, segW, radius);
    ctx.fill();

    // Inner cyber-core highlight on body segments
    if (!isHead && !isDead) {
      const coreSize = segW * 0.42;
      ctx.fillStyle =
        waveBoost > 0.2
          ? 'rgba(236, 253, 245, 0.75)'
          : combo >= 4 && i % 2 === 0
          ? 'rgba(251, 191, 36, 0.35)'
          : 'rgba(167, 243, 208, 0.22)';
      roundRect(
        ctx,
        cx - coreSize / 2,
        cy - coreSize / 2,
        coreSize,
        coreSize,
        coreSize * 0.3
      );
      ctx.fill();
    }

    // Articulated Viper Head details (Eyes & Sensor Tongue)
    if (isHead) {
      ctx.translate(cx, cy);
      let angle = 0;
      if (direction === 'RIGHT') angle = 0;
      else if (direction === 'DOWN') angle = Math.PI / 2;
      else if (direction === 'LEFT') angle = Math.PI;
      else if (direction === 'UP') angle = -Math.PI / 2;
      ctx.rotate(angle);

      // Subtle holographic sensor fork when near food or periodically
      const nearestFood = foods[0];
      const distToFood = nearestFood
        ? Math.hypot(nearestFood.x - seg.x, nearestFood.y - seg.y)
        : 99;
      if (!isDead && (distToFood < 4.5 || Math.sin(now * 0.01) > 0.65)) {
        const tongueExtend =
          cellSize * (0.28 + Math.sin(now * 0.035) * 0.08);
        ctx.strokeStyle = combo >= 4 ? '#FBBF24' : '#38BDF8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(segW * 0.45, 0);
        ctx.lineTo(segW * 0.45 + tongueExtend, 0);
        ctx.lineTo(segW * 0.45 + tongueExtend + 3.5, -3.5);
        ctx.moveTo(segW * 0.45 + tongueExtend, 0);
        ctx.lineTo(segW * 0.45 + tongueExtend + 3.5, 3.5);
        ctx.stroke();
      }

      // Eyes
      const eyeOffsetX = segW * 0.16;
      const eyeOffsetY = segW * 0.24;
      const eyeRadius = Math.max(2.2, cellSize * 0.1);

      ctx.fillStyle = isDead ? '#450A0A' : '#062E22';
      ctx.beginPath();
      ctx.arc(eyeOffsetX, -eyeOffsetY, eyeRadius * 1.25, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Pupils
      ctx.fillStyle = isDead ? '#FCA5A5' : combo >= 4 ? '#FEF08A' : '#ECFDF5';
      ctx.beginPath();
      ctx.arc(eyeOffsetX + 0.8, -eyeOffsetY, eyeRadius * 0.75, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX + 0.8, eyeOffsetY, eyeRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 9. Particle System (Directional velocity sparks)
  for (const p of particles) {
    const px = p.x * cellSize;
    const py = p.y * cellSize;
    const alpha = Math.max(0, p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;

    const s = p.size * (0.4 + 0.6 * alpha);
    if (p.shape === 'SPARK') {
      ctx.fillRect(-s * 1.6, -s * 0.45, s * 3.2, s * 0.9);
    } else if (p.shape === 'SQUARE') {
      ctx.fillRect(-s, -s, s * 2, s * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 10. Floating Score & Combo Popups
  for (const pop of popups) {
    const progress = 1 - pop.life / pop.maxLife;
    const alpha = progress < 0.7 ? 1 : Math.max(0, (1 - progress) / 0.3);
    const px = Math.min(
      width - 42,
      Math.max(42, (pop.x + 0.5) * cellSize)
    );
    const py = Math.max(
      24,
      (pop.y + 0.2 - progress * 1.15) * cellSize
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    const popScale =
      progress < 0.15
        ? 0.7 + (progress / 0.15) * 0.45
        : 1.15 - (progress - 0.15) * 0.15;
    ctx.scale(popScale * pop.scale, popScale * pop.scale);

    ctx.font = `700 ${Math.max(13, Math.round(cellSize * 0.56))}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Crisp dark outline for legibility
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(10, 13, 18, 0.92)';
    ctx.strokeText(pop.text, 0, 0);

    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, 0, 0);

    if (pop.subText) {
      ctx.font = `700 ${Math.max(10, Math.round(cellSize * 0.36))}px "JetBrains Mono", monospace`;
      ctx.strokeText(pop.subText, 0, cellSize * 0.45);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(pop.subText, 0, cellSize * 0.45);
    }
    ctx.restore();
  }

  // 11. Death Impact Red Vignette Flash
  if (deathFlashAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(239, 68, 68, ${deathFlashAlpha * 0.38})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
