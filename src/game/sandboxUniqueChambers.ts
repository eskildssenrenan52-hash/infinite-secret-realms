// @ts-nocheck -- sandbox generation helper
/**
 * Gives every sandbox chamber its own identity: a seeded set-piece, scattered
 * micro-structures, accent palette, decor, and (sometimes) hidden secret vaults.
 * Exits/traversal corridors are protected so connectivity never breaks.
 */
import { SB_TILE, SB_WALL } from './sandboxWorld';

function rngFrom(a: number, b: number, seed: number) {
  let s = (Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663) ^ Math.imul(seed, 83492791)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const getAccents = (): Record<string, number[]> => ({
  sky: [SB_TILE.CLOUD_BOUNCE, SB_TILE.GLASS, SB_TILE.CARVED_STONE, SB_TILE.ICE],
  overworld: [SB_TILE.DIRT, SB_TILE.GRASS, SB_TILE.STONE, SB_TILE.WOOD_TRUNK, SB_TILE.MUD, SB_TILE.SAND, SB_TILE.BRICK_BLOCK],
  caverns: [SB_TILE.STONE, SB_TILE.CARVED_STONE, SB_TILE.DUNGEON_BRICK, SB_TILE.MUD, SB_TILE.ICE],
  underworld: [SB_TILE.ASH, SB_TILE.HELLSTONE, SB_TILE.OBSIDIAN, SB_TILE.MAGMA_CRUST, SB_TILE.NEON_BRICK],
});
const getWallSet = () => [SB_WALL.DIRT_WALL, SB_WALL.STONE_WALL, SB_WALL.BRICK_WALL, SB_WALL.DUNGEON_WALL, SB_WALL.SAKURA_WALL, SB_WALL.NEON_WALL, SB_WALL.WOOD_WALL, SB_WALL.GLASS_WALL];
const PROPS = ['pillar', 'arch', 'banner', 'lantern', 'chain', 'statue', 'crystal_cluster', 'tree_pine', 'shroom_giant', 'brazier', 'ruin_tower', 'crystal_spire', 'hanging_vine', 'obelisk', 'torii_gate', 'sakura_tree', 'paper_lantern', 'coral_fan', 'kelp_strand', 'clock_gear', 'pendulum', 'wind_chime', 'sun_dial', 'waterfall', 'bird_perch'];

export interface UniqueChamberCtx {
  tiles: Uint8Array;
  walls: Uint8Array;
  cols: number;
  rows: number;
  ox: number;
  oy: number;
  sx: number;
  sy: number;
  seed: number;
  CW: number;
  CH: number;
  solidTile: number;
  oreTile: number;
  stratum: string;
  addEntity: (kind: string, tx: number, ty: number, extra?: any) => void;
  addProp: (kind: string, tx: number, ty: number, h: number) => void;
}

/** Returns number of secret vaults stamped (0..2). */
export function decorateUniqueChamber(c: UniqueChamberCtx): number {
  const { tiles, walls, cols, ox, oy, CW, CH, stratum } = c;
  const rnd = rngFrom(c.sx * 31 + 7, c.sy * 17 + 3, c.seed ^ 0x5eed);
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];

  // Corridors that must stay walkable: center shaft, side gates, floor band.
  const isProtected = (lx: number, ly: number) =>
    lx <= 0 || lx >= CW - 1 || ly <= 0 || ly >= CH - 3 ||
    (lx >= 15 && lx <= 24) ||
    ((lx <= 4 || lx >= CW - 5) && ly >= 11 && ly <= 19);
  const idx = (lx: number, ly: number) => (oy + ly) * cols + ox + lx;
  const get = (lx: number, ly: number) => tiles[idx(lx, ly)];
  const setAir = (lx: number, ly: number, t: number) => {
    if (lx < 1 || lx > CW - 2 || ly < 1 || ly > CH - 3 || isProtected(lx, ly)) return false;
    if (get(lx, ly) !== SB_TILE.AIR) return false;
    tiles[idx(lx, ly)] = t;
    return true;
  };
  const force = (lx: number, ly: number, t: number) => {
    if (lx < 1 || lx > CW - 2 || ly < 1 || ly > CH - 3 || isProtected(lx, ly)) return;
    tiles[idx(lx, ly)] = t;
  };
  const accent = pick(getAccents()[stratum] ?? getAccents().overworld);
  const side = rnd() < 0.5 ? 0 : 1; // which half the set piece lives in
  const bx = side === 0 ? ri(2, 6) : ri(26, 29);

  // 1) Background wall mural — unique tint/shape per chamber
  if (rnd() < 0.7) {
    const w = ri(4, 11), h = ri(3, 8), x0 = ri(2, CW - w - 2), y0 = ri(2, CH - h - 4);
    const wall = pick(getWallSet());
    const shape = ri(0, 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (shape === 1 && (x + y) % 2) continue; // checker
      if (shape === 2 && y > 0 && y < h - 1 && x > 0 && x < w - 1) continue; // frame
      walls[idx(x0 + x, y0 + y)] = wall;
    }
  }

  // 2) Signature set piece (one of 16)
  const piece = ri(0, 15);
  switch (piece) {
    case 0: { // floating island cluster
      for (let k = 0; k < ri(2, 4); k++) {
        const x = bx + ri(-1, 4), y = ri(3, 10), w = ri(3, 6);
        for (let i = 0; i < w; i++) setAir(x + i, y, accent);
        for (let i = 1; i < w - 1; i++) setAir(x + i, y + 1, c.solidTile);
        if (rnd() < 0.5) setAir(x + Math.floor(w / 2), y + 2, c.oreTile);
      }
      break;
    }
    case 1: { // stalactite ceiling with spikes
      for (let x = bx; x < bx + 9; x++) {
        const len = ri(0, 3);
        for (let y = 1; y <= len; y++) setAir(x, y, c.solidTile);
        if (len > 0 && rnd() < 0.6) setAir(x, len + 1, SB_TILE.SPIKE_DOWN);
      }
      break;
    }
    case 2: { // pillar colonnade of varied heights
      for (let x = bx; x < bx + 10; x += ri(2, 3)) {
        const h = ri(2, 7);
        for (let y = CH - 3 - h; y < CH - 3; y++) setAir(x, y, accent);
        setAir(x, CH - 4 - h, SB_TILE.TORCH);
      }
      break;
    }
    case 3: { // staircase
      const dir = side === 0 ? 1 : -1;
      const startX = side === 0 ? bx : bx + 8;
      for (let s = 0; s < ri(5, 8); s++) setAir(startX + s * dir, CH - 4 - s, SB_TILE.PLATFORM);
      break;
    }
    case 4: { // ore geode ring
      const cx = bx + 4, cy = ri(5, 10), r = ri(2, 3);
      for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
        const d = Math.hypot(x, y);
        if (d <= r + 1 && d > r) setAir(cx + x, cy + y, c.solidTile);
        else if (d <= r && rnd() < 0.45) setAir(cx + x, cy + y, c.oreTile);
      }
      break;
    }
    case 5: { // water pool
      const w = ri(5, 9), y = CH - 4;
      for (let x = 0; x < w; x++) { setAir(bx + x, y + 1, SB_TILE.WATER); setAir(bx + x, y, SB_TILE.WATER); }
      setAir(bx - 1, y, c.solidTile); setAir(bx + w, y, c.solidTile);
      break;
    }
    case 6: { // crumble bridge with spikes below
      const y = ri(8, 12);
      for (let x = bx; x < bx + 9; x++) { setAir(x, y, SB_TILE.CRUMBLE); setAir(x, CH - 4, SB_TILE.SPIKE_UP); }
      break;
    }
    case 7: { // dream block tunnel
      const y = ri(5, 10);
      for (let x = bx; x < bx + 8; x++) for (let k = 0; k < 2; k++) setAir(x, y + k, SB_TILE.DREAM_BLOCK);
      break;
    }
    case 8: { // ice slide
      for (let i = 0; i < 8; i++) setAir(bx + i, 6 + Math.floor(i / 2), SB_TILE.ICE);
      break;
    }
    case 9: { // cloud chain
      for (let i = 0; i < 4; i++) setAir(bx + i * 2, 4 + (i % 2) * 3, SB_TILE.CLOUD_BOUNCE);
      break;
    }
    case 10: { // ruined arch
      const h = ri(4, 7), w = ri(5, 8), y0 = CH - 3 - h;
      for (let y = y0; y < CH - 3; y++) { setAir(bx, y, SB_TILE.CARVED_STONE); setAir(bx + w, y, SB_TILE.CARVED_STONE); }
      for (let x = bx; x <= bx + w; x++) if (rnd() < 0.8) setAir(x, y0, SB_TILE.CARVED_STONE);
      setAir(bx + Math.floor(w / 2), y0 + 1, SB_TILE.LANTERN);
      break;
    }
    case 11: { // tree
      const tx = bx + 4, h = ri(4, 7);
      for (let y = CH - 3 - h; y < CH - 3; y++) setAir(tx, y, SB_TILE.WOOD_TRUNK);
      const ly = CH - 3 - h;
      for (let y = -2; y <= 0; y++) for (let x = -3 + Math.abs(y); x <= 3 - Math.abs(y); x++) setAir(tx + x, ly + y, SB_TILE.LEAVES);
      break;
    }
    case 12: { // conveyor line
      const y = ri(7, 12), t = rnd() < 0.5 ? SB_TILE.CONVEYOR_LEFT : SB_TILE.CONVEYOR_RIGHT;
      for (let x = bx; x < bx + 8; x++) setAir(x, y, t);
      break;
    }
    case 13: { // rhythm platforms
      for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) setAir(bx + i * 2 + k, 12 - i * 2, i % 2 ? SB_TILE.BEAT_B : SB_TILE.BEAT_A);
      break;
    }
    case 14: { // sticky resin climbing wall
      const x = side === 0 ? bx + 1 : bx + 7;
      for (let y = 4; y < CH - 3; y++) setAir(x, y, SB_TILE.STICKY_RESIN);
      break;
    }
    default: { // camp: campfire + pots + banner
      const y = CH - 4;
      setAir(bx + 2, y, SB_TILE.CAMPFIRE);
      setAir(bx + 4, y, SB_TILE.POT);
      if (rnd() < 0.5) setAir(bx + 5, y, SB_TILE.POT);
      setAir(bx + 1, y - 2, SB_TILE.BANNER);
    }
  }

  // 3) Scattered micro-structures in the other half
  const ox2 = side === 0 ? 26 : 2;
  for (let k = 0; k < ri(1, 4); k++) {
    const w = ri(2, 5), x = ox2 + ri(0, 8), y = ri(3, 15);
    const t = pick([SB_TILE.ONE_WAY, accent, c.solidTile, SB_TILE.CRUMBLE, SB_TILE.PLATFORM]);
    for (let i = 0; i < w; i++) setAir(x + i, y, t);
    if (rnd() < 0.3) setAir(x + ri(0, w - 1), y - 1, pick([SB_TILE.POT, SB_TILE.TORCH, SB_TILE.BOUNCE_SHROOM, SB_TILE.DASH_CRYSTAL]));
  }
  // ore sprinkles
  for (let k = 0; k < ri(0, 3); k++) {
    const x = ri(2, CW - 3), y = ri(2, CH - 4);
    if (get(x, y) === c.solidTile && !isProtected(x, y)) tiles[idx(x, y)] = c.oreTile;
  }

  // 4) Decor props & a random celeste gimmick
  for (let k = 0; k < ri(1, 3); k++) c.addProp(pick(PROPS), ox + ri(3, CW - 4), oy + ri(4, 12), ri(4, 8));
  if (rnd() < 0.45) {
    const g = pick(['dash_crystal', 'boost_hoop', 'spring_up', 'grapple_anchor', 'feather_aura', 'bumper_orb', 'astral_coin', 'star_shard', 'jump_orb']);
    const gx = ox2 + ri(1, 8), gy = ri(3, 12);
    if (get(gx, gy) === SB_TILE.AIR) c.addEntity(g, ox + gx, oy + gy);
  }

  // 5) Secrets
  let secrets = 0;
  const vaultChance = c.sy >= 11 ? 0.32 : 0.2;
  if (rnd() < vaultChance) {
    // Sealed vault in an upper corner, one face made of dash-breakable SECRET_WALL
    const left = rnd() < 0.5;
    const vx = left ? ri(2, 5) : ri(27, 30), vy = ri(2, 5);
    const vw = 8, vh = 5;
    for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
      const edge = x === 0 || y === 0 || x === vw - 1 || y === vh - 1;
      force(vx + x, vy + y, edge ? c.solidTile : SB_TILE.AIR);
      walls[idx(vx + x, vy + y)] = SB_WALL.DUNGEON_WALL;
    }
    const doorX = left ? vx + vw - 1 : vx;
    for (let y = 1; y < vh - 1; y++) force(doorX, vy + y, SB_TILE.SECRET_WALL);
    // ledge under the door so it's reachable
    for (let i = 1; i <= 3; i++) setAir(left ? doorX + i : doorX - i, vy + vh - 1, SB_TILE.ONE_WAY);
    const ry = vy + vh - 2;
    const reward = rnd();
    force(vx + 2, ry, SB_TILE.CHEST);
    if (reward < 0.35) force(vx + 4, ry, SB_TILE.LIFE_CRYSTAL);
    else if (reward < 0.6) force(vx + 4, ry, SB_TILE.LORE_TABLET);
    else force(vx + 4, ry, c.oreTile);
    force(vx + 5, ry - 1, SB_TILE.TORCH);
    if (rnd() < 0.5) c.addEntity('relic', ox + vx + 5, oy + ry);
    secrets++;
  }
  if (rnd() < 0.12) {
    // Hidden pocket behind a breakable floor slab under the floor band (dig to find it)
    const x = left2(rnd) ? ri(5, 11) : ri(28, 33);
    force(x, CH - 5, SB_TILE.BREAKABLE);
    force(x + 1, CH - 5, SB_TILE.BREAKABLE);
    force(x, CH - 4, SB_TILE.LIFE_CRYSTAL);
    force(x + 1, CH - 4, SB_TILE.POT);
    secrets++;
  }
  return secrets;
}

function left2(rnd: () => number) {
  return rnd() < 0.5;
}
