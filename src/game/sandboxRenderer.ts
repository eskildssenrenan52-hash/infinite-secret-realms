// @ts-nocheck -- imported game code
import { drawEnhancedBackdrop, drawEnhancedForeground } from './backdropRenderer';
import { drawBiomeDecorBackdrop, drawBiomeDecorForeground } from './biomeDecor';
import type { GameEngine } from './engine';
import type { Renderer } from './renderer';
import {
  SANDBOX_COLS,
  SANDBOX_ROWS,
  SANDBOX_SECTOR_COLS,
  SANDBOX_SECTOR_HEIGHT,
  SANDBOX_SECTOR_ROWS,
  SANDBOX_SECTOR_WIDTH,
  SANDBOX_TILE_META,
  SB_TILE,
  SB_WALL,
  computeNearbyOreHint,
  getActiveSandboxCelesteEntities,
  getSandboxBiomeAt,
  getSandboxCampaignBiomeAt,
  isSandboxNight,
  isSandboxPlatform,
  isSandboxSolid,
} from './sandboxWorld';
import {
  ENEMY_SPRITES,
  NPC_SPRITES,
  PROP_SPRITES,
  PixelPalette,
  drawPixelSprite,
} from './sprites';
import { drawEnhancedTilePolish, drawEnhancedTiles } from './tileRenderer';
import { RoomDef, TILE_SIZE, TileType, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './types';
import { drawCachedGlow } from './visualFx';
import { getAnyBiomeMeta } from './worldDataUnderworld';

const WALL_COLORS: Record<number, { base: string; seam: string }> = {
  [SB_WALL.DIRT_WALL]: { base: '#3d271a', seam: '#2b190f' },
  [SB_WALL.WOOD_WALL]: { base: '#54351e', seam: '#3b2413' },
  [SB_WALL.STONE_WALL]: { base: '#343a47', seam: '#232833' },
  [SB_WALL.BRICK_WALL]: { base: '#4a333c', seam: '#2e1e25' },
  [SB_WALL.GLASS_WALL]: { base: '#2c5a6e', seam: '#6be0ff' },
  [SB_WALL.DUNGEON_WALL]: { base: '#1a2338', seam: '#101626' },
  [SB_WALL.SAKURA_WALL]: { base: '#54203b', seam: '#8a3560' },
  [SB_WALL.NEON_WALL]: { base: '#112738', seam: '#1b4f69' },
};

export const SANDBOX_OBJECT_SPRITES: Record<string, { palette: PixelPalette; frames: string[][] }> = {
  workbench: {
    palette: { o: '#090712', w: '#d49966', m: '#9c6334', d: '#633c1c', s: '#cbd5e1' },
    frames: [
      [
        'oo..oooooooooo',
        'ossoowwwwwwwwo',
        'oooooooooooooom',
        '.ommmmmmmmmmmo',
        '.oodmmo..ommdo',
        '..oddo....oddo',
        '..oddo....oddo',
        '..oooo....oooo',
      ].map((r) => (r.length > 14 ? r.slice(0, 14) : r.padEnd(14, '.'))),
    ],
  },
  forge: {
    palette: {
      o: '#090712',
      s: '#6a6280',
      h: '#a89ec2',
      d: '#38324a',
      f: '#ff4d1c',
      y: '#ffe066',
      w: '#ffffff',
    },
    frames: [
      [
        '..oooooooooo..',
        '.ohhhhhhhhhho.',
        '.osssssssssso.',
        'oossddddddssso',
        'oshddofffodddo',
        'oshdofyywfdddo',
        'ossdofwwwwdddo',
        'osddoffffodddo',
        'oddddddddddddd'.slice(0, 14),
        '.oooooooooooo.',
      ].map((r) => r.padEnd(14, '.')),
      [
        '..oooooooooo..',
        '.ohhhhhhhhhho.',
        '.osssssssssso.',
        'oossddddddssso',
        'oshddoffyodddo',
        'oshdofwwwfdddo',
        'ossdofyyffdddo',
        'osddoffffodddo',
        'oddddddddddddd'.slice(0, 14),
        '.oooooooooooo.',
      ].map((r) => r.padEnd(14, '.')),
    ],
  },
  cauldron: {
    palette: { o: '#061210', m: '#365e5e', l: '#649e9e', d: '#1a3030', g: '#4df0c0', w: '#ffffff' },
    frames: [
      [
        '..oo..w..oo.',
        '..ogggggggo.',
        '.olmmmmmmmlo',
        '.ommmmmmmmmo',
        'ommmmlmmmmmo',
        'ommdddddddmo',
        '.omddddddmo.',
        '.ooddddddoo.',
        '..oo....oo..',
      ],
      [
        '.w..oo..o...',
        '..oggwggggo.',
        '.olmmmmmmmlo',
        '.ommmmmmmmmo',
        'ommmmlmmmmmo',
        'ommdddddddmo',
        '.omddddddmo.',
        '.ooddddddoo.',
        '..oo....oo..',
      ],
    ],
  },
  bed: {
    palette: { o: '#090712', w: '#d49966', d: '#784824', r: '#e11d48', h: '#fda4af', p: '#f8fafc' },
    frames: [
      [
        'oo..............',
        'owo..oooo.......',
        'owoopppppoooooo.',
        'owoorrrrrrrrrrwo',
        'owooohhhhhhhhhwo',
        'owooooooooooooow',
        'oddddddddddddddo',
        '.oo..........oo.',
      ],
    ],
  },
  loom: {
    palette: { o: '#090712', w: '#bd8455', d: '#6b3e1b', t: '#f0abfc', s: '#67e8f9', g: '#ffe066' },
    frames: [
      [
        '..oooooooooo..',
        '.owttttttttwo.',
        '.owtsssssswto.',
        '.owtgttttgtwo.',
        'oowwwwwwwwwwoo',
        'oddo.osso.oddo',
        'oddo......oddo',
        'oooo......oooo',
      ],
    ],
  },
  anvil: {
    palette: { o: '#090712', l: '#cbd5e1', m: '#64748b', d: '#334155', f: '#fb923c' },
    frames: [
      [
        'oooooooooooo',
        'ollllllllllo',
        '.oommmmmmoo.',
        '...ommmmo...',
        '...omddmo...',
        '..oomddmoo..',
        '.oddddddddo.',
        '.oooooooooo.',
      ],
    ],
  },
  pylon: {
    palette: { o: '#060c14', b: '#475569', h: '#94a3b8', c: '#38bdf8', w: '#ffffff', g: '#ffe066' },
    frames: [
      [
        '....oo....',
        '...owwo...',
        '..occcco..',
        '..ocwwco..',
        '...ocoo...',
        '.oggggggo.',
        '.ohhhhhho.',
        'oobbbbbboo',
        'oooooooooo',
      ],
    ],
  },
};

function safeFrame<T>(arr: T[], idx: number): T {
  const n = arr.length;
  return arr[((Math.floor(idx) % n) + n) % n];
}

// Reusable visible RoomDef slice buffer for Classic `drawEnhancedTiles` (0 GC churn per frame)
const SLICE_PAD = 2;
const SLICE_COLS = Math.ceil(VIRTUAL_WIDTH / TILE_SIZE) + SLICE_PAD * 2 + 2; // 46
const SLICE_ROWS = Math.ceil(VIRTUAL_HEIGHT / TILE_SIZE) + SLICE_PAD * 2 + 2; // 29
const SLICE_TILES = new Array<number>(SLICE_COLS * SLICE_ROWS).fill(0);

function toClassicRenderTile(sbTile: number, idx: number, world: NonNullable<GameEngine['sandboxWorld']>): number {
  if (sbTile <= 21) {
    if (sbTile === SB_TILE.CRUMBLE) {
      const cState = world.crumbleTimers.get(idx);
      if (cState?.state === 'gone') return TileType.EMPTY;
    }
    return sbTile; // Exact 1:1 Classic TileType match!
  }
  if (sbTile === SB_TILE.DOOR_OPEN) return TileType.EMPTY;
  if (sbTile === SB_TILE.PLATFORM) return TileType.ONE_WAY;
  if (isSandboxSolid(sbTile)) return TileType.SOLID;
  return TileType.EMPTY;
}

export function renderSandboxWorld(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  time: number,
  drawOverlay: () => void,
  rendererRef?: Renderer
): void {
  const world = engine.sandboxWorld;
  if (!world) return;

  const camX = Math.round(engine.cameraX);
  const camY = Math.round(engine.cameraY);
  const centerTx = Math.max(0, Math.min(SANDBOX_COLS - 1, Math.floor((camX + VIRTUAL_WIDTH * 0.5) / TILE_SIZE)));
  const centerTy = Math.max(0, Math.min(SANDBOX_ROWS - 1, Math.floor((camY + VIRTUAL_HEIGHT * 0.5) / TILE_SIZE)));
  const biomeInfo = getSandboxBiomeAt(centerTx, centerTy);
  const campaignBiome = getSandboxCampaignBiomeAt(centerTx, centerTy);
  const meta = getAnyBiomeMeta(campaignBiome);
  const night = isSandboxNight(world.dayTime);

  const csx = Math.floor(centerTx / SANDBOX_SECTOR_WIDTH);
  const csy = Math.floor(centerTy / SANDBOX_SECTOR_HEIGHT);

  // 1. Classic Mode Multi-Layer Parallax Backdrop & Biome Decor!
  drawEnhancedBackdrop(ctx, campaignBiome, csx, csy, camX, camY, time, engine);
  drawBiomeDecorBackdrop(ctx, campaignBiome, camX, camY, time);

  // Celestial Day/Night atmospheric sky wash
  if (night && biomeInfo.stratum !== 'underworld') {
    ctx.fillStyle = 'rgba(8, 12, 32, 0.34)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  ctx.save();
  ctx.translate(-camX, -camY);

  const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - SLICE_PAD);
  const endTx = Math.min(SANDBOX_COLS - 1, startTx + SLICE_COLS - 1);
  const startTy = Math.max(0, Math.floor(camY / TILE_SIZE) - SLICE_PAD);
  const endTy = Math.min(SANDBOX_ROWS - 1, startTy + SLICE_ROWS - 1);

  // 2. Sandbox Placed Interior House Background Walls
  for (let ty = startTy; ty <= endTy; ty++) {
    const rowOff = ty * world.cols;
    for (let tx = startTx; tx <= endTx; tx++) {
      const w = world.walls[rowOff + tx];
      if (w === SB_WALL.NONE) continue;
      const wc = WALL_COLORS[w];
      if (!wc) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      ctx.fillStyle = wc.base;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = wc.seam;
        ctx.fillRect(x, y + 7, TILE_SIZE, 1);
        ctx.fillRect(x + ((ty % 2) * 4), y, 1, TILE_SIZE);
      }
    }
  }

  // 3. Populate Reusable Visible Slice -> Render with Classic `drawEnhancedTiles` & `drawEnhancedTilePolish`!
  const sliceCols = endTx - startTx + 1;
  const sliceRows = endTy - startTy + 1;
  SLICE_TILES.fill(0);
  for (let sy = 0; sy < sliceRows; sy++) {
    const wy = startTy + sy;
    const rowOff = wy * world.cols;
    const sRowOff = sy * sliceCols;
    for (let sx = 0; sx < sliceCols; sx++) {
      const wx = startTx + sx;
      const idx = rowOff + wx;
      SLICE_TILES[sRowOff + sx] = toClassicRenderTile(world.tiles[idx], idx, world);
    }
  }

  const sliceRoom: RoomDef = {
    id: `sb_slice_${csx}_${csy}`,
    chapterIndex: 0,
    stageIndex: 0,
    gx: csx,
    gy: csy,
    cols: sliceCols,
    rows: sliceRows,
    biome: campaignBiome,
    name: biomeInfo.label,
    tiles: SLICE_TILES,
    entities: [],
    props: [],
    spawnX: 0,
    spawnY: 0,
  };

  ctx.save();
  ctx.translate(startTx * TILE_SIZE, startTy * TILE_SIZE);
  drawEnhancedTiles(ctx, sliceRoom, engine, time, 0, 0);
  drawEnhancedTilePolish(ctx, sliceRoom, time, 0, 0);
  ctx.restore();

  // 4. Classic Mode Biome Architectural Props (Torii Gates, Sakura Trees, Stained Glass, Clock Gears, etc.)
  if (rendererRef) {
    const minSx = Math.max(0, csx - 1);
    const maxSx = Math.min(SANDBOX_SECTOR_COLS - 1, csx + 1);
    const minSy = Math.max(0, csy - 1);
    const maxSy = Math.min(SANDBOX_SECTOR_ROWS - 1, csy + 1);
    const px = engine.player.x;
    const py = engine.player.y;
    for (let sy = minSy; sy <= maxSy; sy++) {
      for (let sx = minSx; sx <= maxSx; sx++) {
        const list = world.scenicBuckets.get(sy * SANDBOX_SECTOR_COLS + sx);
        if (!list) continue;
        for (const pr of list) {
          const x = pr.tx * TILE_SIZE;
          const y = pr.ty * TILE_SIZE;
          const hPx = (pr.h ?? 6) * TILE_SIZE;
          if (x + 48 < camX || x - 48 > camX + VIRTUAL_WIDTH || y + hPx + 24 < camY || y - 24 > camY + VIRTUAL_HEIGHT) {
            continue;
          }
          rendererRef.drawSingleProp(ctx, pr, x, y, hPx, VIRTUAL_HEIGHT, meta, px, py, time);
        }
      }
    }
  }

  // 5. Overlay Material/Ore Vein Gleams, Builder Accents, Mining Cracks, Stations & Placed Furniture
  for (let ty = startTy; ty <= endTy; ty++) {
    const rowOff = ty * world.cols;
    for (let tx = startTx; tx <= endTx; tx++) {
      const idx = rowOff + tx;
      const t = world.tiles[idx];
      if (t === SB_TILE.AIR) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      const tMeta = SANDBOX_TILE_META[t];

      // Ore vein crystals & metallic nuggets embedded cleanly into Classic tile silhouettes!
      if (tMeta?.isOre) {
        const pulse = Math.sin(time * 4 + tx * 0.7 + ty * 1.1) > 0.3;
        ctx.fillStyle = tMeta.color + 'aa';
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = tMeta.highlightColor;
        ctx.fillRect(x + 1, y + 2, 2, 2);
        ctx.fillRect(x + 4, y + 4, 3, 2);
        if (pulse) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 2, y + 2, 1, 1);
          ctx.fillRect(x + 5, y + 5, 1, 1);
        }
      } else if (t === SB_TILE.PLANK || t === SB_TILE.SAKURA_PLANK) {
        ctx.fillStyle = tMeta.color;
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = tMeta.highlightColor;
        ctx.fillRect(x + 1, y + 1, 6, 1);
        ctx.fillRect(x + 1, y + 4, 6, 1);
      } else if (t === SB_TILE.NEON_BRICK) {
        ctx.fillStyle = '#0f2536';
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(x + 2, y + 3, 4, 1);
      } else if (t === SB_TILE.GLASS) {
        ctx.fillStyle = 'rgba(120, 210, 235, 0.35)';
        ctx.fillRect(x, y, 8, 8);
        ctx.strokeStyle = '#bae6fd';
        ctx.strokeRect(x + 0.5, y + 0.5, 7, 7);
        ctx.fillStyle = '#ffffffcc';
        ctx.fillRect(x + 2, y + 2, 2, 1);
      } else if (t === SB_TILE.DOOR_CLOSED) {
        ctx.fillStyle = '#4a2914';
        ctx.fillRect(x + 1, y, 6, 8);
        ctx.fillStyle = '#bd8455';
        ctx.fillRect(x + 2, y + 1, 4, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(x + 5, y + 4, 1, 1);
      } else if (t === SB_TILE.TORCH) {
        ctx.fillStyle = '#70492b';
        ctx.fillRect(x + 3, y + 3, 2, 5);
        const flick = Math.floor(time * 12 + tx) % 2;
        ctx.fillStyle = '#ff6622';
        ctx.fillRect(x + 2, y + 1, 4, 3);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(x + 3, y - flick, 2, 3);
        drawCachedGlow(ctx, x + 4, y + 2, 18, '#ffb84d', 0.25, 1, true);
      } else if (t === SB_TILE.LANTERN) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + 3, y, 2, 2);
        ctx.fillStyle = '#ffaa33';
        ctx.fillRect(x + 2, y + 2, 4, 5);
        ctx.fillStyle = '#fff5b8';
        ctx.fillRect(x + 3, y + 3, 2, 3);
        drawCachedGlow(ctx, x + 4, y + 4, 22, '#ffd27d', 0.28, 1, true);
      } else if (t === SB_TILE.WORKBENCH) {
        const sp = SANDBOX_OBJECT_SPRITES.workbench;
        drawPixelSprite(ctx, 'sb_wb', sp.frames[0], sp.palette, x - 3, y);
      } else if (t === SB_TILE.FORGE) {
        const sp = SANDBOX_OBJECT_SPRITES.forge;
        const f = Math.floor(time * 6) % sp.frames.length;
        drawPixelSprite(ctx, `sb_fg_${f}`, sp.frames[f], sp.palette, x - 3, y - 2);
      } else if (t === SB_TILE.CAULDRON) {
        const sp = SANDBOX_OBJECT_SPRITES.cauldron;
        const f = Math.floor(time * 4) % sp.frames.length;
        drawPixelSprite(ctx, `sb_ca_${f}`, sp.frames[f], sp.palette, x - 2, y - 1);
      } else if (t === SB_TILE.LOOM) {
        const sp = SANDBOX_OBJECT_SPRITES.loom;
        drawPixelSprite(ctx, 'sb_lm', sp.frames[0], sp.palette, x - 3, y);
      } else if (t === SB_TILE.ANVIL) {
        const sp = SANDBOX_OBJECT_SPRITES.anvil;
        drawPixelSprite(ctx, 'sb_an', sp.frames[0], sp.palette, x - 2, y);
      } else if (t === SB_TILE.BED_SPAWN) {
        const sp = SANDBOX_OBJECT_SPRITES.bed;
        drawPixelSprite(ctx, 'sb_bed', sp.frames[0], sp.palette, x - 4, y);
      } else if (t === SB_TILE.TELEPORT_PYLON) {
        const sp = SANDBOX_OBJECT_SPRITES.pylon;
        const bob = Math.round(Math.sin(time * 3.5 + tx) * 1.5);
        drawCachedGlow(ctx, x + 4, y + 2, 20, '#38bdf8', 0.35, 1, true);
        drawPixelSprite(ctx, 'sb_pyl', sp.frames[0], sp.palette, x - 1, y - 1 + bob);
      } else if (t === SB_TILE.CAMPFIRE) {
        const f = Math.floor(time * 9) % PROP_SPRITES.campfire.frames.length;
        drawCachedGlow(ctx, x + 4, y + 3, 20, '#ff7733', 0.28, 1, true);
        drawPixelSprite(ctx, `sb_cf_${f}`, PROP_SPRITES.campfire.frames[f], PROP_SPRITES.campfire.palette, x - 2, y);
      } else if (t === SB_TILE.TABLE) {
        ctx.fillStyle = '#4f2c16';
        ctx.fillRect(x - 2, y + 2, 12, 2);
        ctx.fillRect(x, y + 4, 2, 4);
        ctx.fillRect(x + 6, y + 4, 2, 4);
        ctx.fillStyle = '#bd8455';
        ctx.fillRect(x - 1, y + 2, 10, 1);
      } else if (t === SB_TILE.CHAIR) {
        ctx.fillStyle = '#4f2c16';
        ctx.fillRect(x + 1, y + 1, 2, 7);
        ctx.fillRect(x + 1, y + 4, 5, 2);
        ctx.fillRect(x + 4, y + 6, 2, 2);
      } else if (t === SB_TILE.SHRINE) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y + 1, 8, 7);
        ctx.fillStyle = '#52e5ff';
        ctx.fillRect(x + 2, y - 2 + Math.round(Math.sin(time * 4)), 4, 4);
      } else if (t === SB_TILE.CHEST) {
        const opened = world.openedChests.has(`${tx},${ty}`);
        ctx.fillStyle = opened ? '#475569' : '#96651e';
        ctx.fillRect(x, y + 1, 8, 7);
        ctx.fillStyle = opened ? '#94a3b8' : '#ffe066';
        ctx.fillRect(x, y + 3, 8, 2);
      } else if (t === SB_TILE.DASH_CRYSTAL) {
        const bob = Math.round(Math.sin(time * 4 + tx) * 1.5);
        const f = Math.floor(time * 4) % PROP_SPRITES.crystal.frames.length;
        drawPixelSprite(ctx, `sb_dc_${f}`, PROP_SPRITES.crystal.frames[f], { o: '#08060f', c: '#4df099', w: '#ffffff', d: '#199958' }, x - 1, y - 1 + bob);
      } else if (t === SB_TILE.SPRING_UP || t === SB_TILE.BOUNCE_SHROOM) {
        ctx.fillStyle = t === SB_TILE.SPRING_UP ? '#ff3864' : '#34d399';
        ctx.fillRect(x, y + 3, 8, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 3, 6, 1);
      }

      // Mining crack overlay when tile is damaged
      const dmg = world.tileDamage[idx];
      if (dmg > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x + 2, y + 1, 1, 5);
        ctx.fillRect(x + 3, y + 3, 3, 1);
        if (dmg >= 2) {
          ctx.fillRect(x + 5, y + 2, 1, 4);
        }
      }
    }
  }

  // 6. Active Classic Celeste Interactive Entities across the visible 3×3 chambers!
  const visibleCeleste = getActiveSandboxCelesteEntities(world, centerTx, centerTy);
  if (rendererRef && visibleCeleste.length > 0) {
    rendererRef.drawEntityArray(ctx, engine, visibleCeleste, time);
  }

  // 7. NPCs using Classic `NPC_SPRITES`
  for (const npc of world.npcs) {
    if (npc.x < camX - 40 || npc.x > camX + VIRTUAL_WIDTH + 40 || npc.y < camY - 40 || npc.y > camY + VIRTUAL_HEIGHT + 40) continue;
    const sp = NPC_SPRITES[npc.spriteKind ?? 'astra'] ?? NPC_SPRITES.astra;
    const frame = safeFrame(sp.frames, time * 4 + npc.homeTx);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(Math.round(npc.x) - 4, Math.round(npc.y) + 6, 8, 2);
    drawPixelSprite(ctx, `sb_npc_${npc.id}`, frame, sp.palette, Math.round(npc.x), Math.round(npc.y), npc.dir < 0, 1, 1, true);
    if (Math.hypot(engine.player.x - npc.x, engine.player.y - npc.y) < 34) {
      ctx.fillStyle = 'rgba(9, 7, 18, 0.85)';
      ctx.fillRect(Math.round(npc.x) - 24, Math.round(npc.y) - 18, 48, 9);
      ctx.font = 'bold 5px monospace';
      ctx.fillStyle = npc.accentColor;
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, Math.round(npc.x), Math.round(npc.y) - 11.5);
      ctx.textAlign = 'left';
    }
  }

  // 8. Biome Enemies & Summoned Bosses using Classic `ENEMY_SPRITES`
  for (const foe of world.enemies) {
    if (foe.hp <= 0) continue;
    if (foe.x < camX - 60 || foe.x > camX + VIRTUAL_WIDTH + 60 || foe.y < camY - 60 || foe.y > camY + VIRTUAL_HEIGHT + 60) continue;
    const sp = ENEMY_SPRITES[foe.spriteKind ?? 'enemy_slime_king'] ?? ENEMY_SPRITES.enemy_slime_king;
    const fIdx = Math.floor(time * 6) % sp.frames.length;
    const frame = sp.frames[fIdx];
    const scale = foe.isBoss ? 1.5 : 1;
    if (foe.isBoss) {
      drawCachedGlow(ctx, foe.x + foe.w * 0.5, foe.y + foe.h * 0.5, 24, foe.color, 0.35, 1, true);
    }
    drawPixelSprite(
      ctx,
      `sb_foe_${foe.id}_${fIdx}`,
      frame,
      foe.flash > 0 ? { ...sp.palette, c: '#ffffff', d: '#ffffff' } : sp.palette,
      Math.round(foe.x + foe.w * 0.5),
      Math.round(foe.y + foe.h),
      foe.vx < 0,
      scale,
      scale,
      true
    );
    if (foe.hp < foe.maxHp || foe.isBoss) {
      const bw = foe.isBoss ? 28 : 14;
      const bx = Math.round(foe.x + foe.w * 0.5 - bw * 0.5);
      const by = Math.round(foe.y - 6);
      ctx.fillStyle = '#090712';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = foe.color;
      ctx.fillRect(bx, by, Math.max(1, Math.round((foe.hp / foe.maxHp) * bw)), 2);
    }
  }

  // 9. Custom World Pins visible in viewport
  for (const pin of world.worldPins) {
    const px = pin.tx * TILE_SIZE;
    const py = pin.ty * TILE_SIZE;
    if (px < camX - 24 || px > camX + VIRTUAL_WIDTH + 24 || py < camY - 24 || py > camY + VIRTUAL_HEIGHT + 24) continue;
    const bob = Math.round(Math.sin(time * 4 + pin.tx) * 1.5);
    ctx.fillStyle = '#090712';
    ctx.fillRect(px - 2, py - 10 + bob, 5, 5);
    ctx.fillStyle = pin.color || '#ffd27d';
    ctx.fillRect(px - 1, py - 9 + bob, 3, 3);
    ctx.fillRect(px, py - 5 + bob, 1, 4);
  }

  // 10. Projectiles & Overlay (Hero Studio Sprite, Spirits, Shockwaves, Particles, Floating Texts)
  for (const pr of engine.projectiles) {
    if (!pr.active) continue;
    ctx.fillStyle = pr.color;
    ctx.beginPath();
    ctx.arc(Math.round(pr.x), Math.round(pr.y), pr.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  drawOverlay();

  // 11. Mining / Tool Swing Arc & Hover Tile Target Cursor
  if (engine.sandboxSwingTimer > 0) {
    const px = engine.player.x + 4;
    const py = engine.player.y + 4;
    const ang = engine.sandboxSwingAngle;
    const prog = 1 - engine.sandboxSwingTimer / 0.18;
    const sweep = ang - 0.75 + prog * 1.5;
    ctx.strokeStyle = engine.sandboxSwingKind === 'weapon' ? '#ff5c8a' : '#52e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 14, sweep - 0.45, sweep + 0.45);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  if (engine.sandboxHoverTx >= 0 && engine.sandboxHoverTy >= 0) {
    const hx = engine.sandboxHoverTx * TILE_SIZE;
    const hy = engine.sandboxHoverTy * TILE_SIZE;
    const ptx = Math.floor((engine.player.x + 4) / TILE_SIZE);
    const pty = Math.floor((engine.player.y + 5) / TILE_SIZE);
    const inRange = Math.hypot(engine.sandboxHoverTx - ptx, engine.sandboxHoverTy - pty) <= 10;
    ctx.strokeStyle = inRange ? 'rgba(82, 229, 255, 0.85)' : 'rgba(255, 102, 136, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(hx + 0.4, hy + 0.4, TILE_SIZE - 0.8, TILE_SIZE - 0.8);
  }

  ctx.restore(); // End world camera space

  // 12. Classic Mode Foreground Parallax & Atmospheric Biome Decor
  drawBiomeDecorForeground(ctx, campaignBiome, camX, time);
  drawEnhancedForeground(ctx, campaignBiome, time, engine, camX, camY);

  // Subtle Ore Radar Ping Overlay when Elixir Radar active
  const hasRadar = engine.activeAlchemyBuffs?.some((b) => b.id === 'elixir_radar');
  if (hasRadar) {
    const ptx = Math.floor((engine.player.x + 4) / TILE_SIZE);
    const pty = Math.floor((engine.player.y + 5) / TILE_SIZE);
    const hint = computeNearbyOreHint(world, ptx, pty, 24);
    if (hint) {
      const ang = Math.atan2(hint.dy, hint.dx);
      const ix = Math.round(VIRTUAL_WIDTH * 0.5 + Math.cos(ang) * 44);
      const iy = Math.round(VIRTUAL_HEIGHT * 0.5 + Math.sin(ang) * 44);
      ctx.fillStyle = hint.color;
      ctx.beginPath();
      ctx.arc(ix, iy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 13. Compact Bottom-Right Chamber Radar Minimap (3x3 chambers centered on player!)
  drawChamberMinimap(ctx, world, csx, csy, centerTx, centerTy, biomeInfo.color);
}

let cachedMinimapCanvas: HTMLCanvasElement | null = null;
let cachedMinimapKey = '';

function drawChamberMinimap(
  ctx: CanvasRenderingContext2D,
  world: NonNullable<GameEngine['sandboxWorld']>,
  csx: number,
  csy: number,
  playerTx: number,
  playerTy: number,
  accentColor: string
): void {
  const mw = 54;
  const mh = 32;
  const mx = VIRTUAL_WIDTH - mw - 6;
  const my = VIRTUAL_HEIGHT - mh - 14;

  ctx.fillStyle = 'rgba(8, 6, 18, 0.78)';
  ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
  ctx.strokeStyle = accentColor + 'aa';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(mx - 0.5, my - 0.5, mw + 1, mh + 1);

  // Sample 162x96 tile window at 3:1 compression onto cached offscreen canvas
  const spanX = 162;
  const spanY = 96;
  const x0 = Math.max(0, Math.min(world.cols - spanX, playerTx - (spanX >> 1)));
  const y0 = Math.max(0, Math.min(world.rows - spanY, playerTy - (spanY >> 1)));
  const key = `${x0 >> 1}_${y0 >> 1}_${world.modifiedCells?.size ?? 0}`;

  if (typeof document !== 'undefined') {
    if (!cachedMinimapCanvas) {
      cachedMinimapCanvas = document.createElement('canvas');
      cachedMinimapCanvas.width = mw;
      cachedMinimapCanvas.height = mh;
    }
    if (key !== cachedMinimapKey) {
      cachedMinimapKey = key;
      const mctx = cachedMinimapCanvas.getContext('2d');
      if (mctx) {
        mctx.clearRect(0, 0, mw, mh);
        for (let py = 0; py < mh; py++) {
          const wy = y0 + py * 3;
          if (wy >= world.rows) continue;
          const rowOff = wy * world.cols;
          for (let px = 0; px < mw; px++) {
            const wx = x0 + px * 3;
            if (wx >= world.cols) continue;
            const t = world.tiles[rowOff + wx];
            if (t === SB_TILE.AIR) continue;
            const meta = SANDBOX_TILE_META[t];
            mctx.fillStyle = meta?.isOre ? meta.highlightColor : meta?.color ?? '#64748b';
            mctx.fillRect(px, py, 1, 1);
          }
        }
      }
    }
    ctx.drawImage(cachedMinimapCanvas, mx, my);
  }

  // Player dot
  const pdx = Math.round(((playerTx - x0) / spanX) * mw);
  const pdy = Math.round(((playerTy - y0) / spanY) * mh);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx + pdx - 1, my + pdy - 1, 2, 2);

  // Active sector badge
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 5px monospace';
  ctx.fillText(`S ${csx},${csy}`, mx + 2, my + 6);
}
