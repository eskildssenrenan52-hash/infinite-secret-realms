// @ts-nocheck -- test suite
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { CRAFT_RECIPES } from './crafting';
import { HERO_VISUAL_PROFILES } from './heroArtRenderer';
import { HEROES } from './heroes';
import { createInitialPlayer } from './physics';
import {
  SANDBOX_COLS,
  SANDBOX_ROWS,
  SANDBOX_SECTOR_COLS,
  SANDBOX_SECTOR_H,
  SANDBOX_SECTOR_ROWS,
  SANDBOX_SECTOR_W,
  SANDBOX_SURFACE_REGIONS,
  SANDBOX_TOTAL_SECTORS,
  getSandboxBiomeAt,
  getSandboxExplorationPct,
  markSandboxSectorAt,
} from './sandboxBiomes';
import {
  SANDBOX_HUB_SPAWN_TX,
  SANDBOX_HUB_SPAWN_TY,
  SANDBOX_HUB_SX,
  SANDBOX_HUB_SY,
  SANDBOX_QUESTS,
  SANDBOX_SECTOR_HEIGHT,
  SANDBOX_SECTOR_WIDTH,
  SB_TILE,
  SB_WALL,
  addSandboxCelesteEntity,
  applyCloudPayloadToSandbox,
  applySandboxDelta,
  buildSandboxCollisionGrid,
  computeNearbyOreHint,
  detonateSeismicBomb,
  dropWorldPin,
  exportCloudPayloadFromSandbox,
  exportSandboxDelta,
  generateSandboxWorld,
  getActiveSandboxCelesteEntities,
  mineSandboxTile,
  registerValidatedHouse,
  removeWorldPin,
  setSandboxTile,
  setSandboxWall,
  spawnSandboxBoss,
  validateHouseAt,
} from './sandboxWorld';
import { TILE_SIZE } from './types';

test('generateSandboxWorld builds a 2400x460 4-directional Celeste world with 1200 chambers and 24 biomes', () => {
  const world = generateSandboxWorld(202504);

  assert.equal(SANDBOX_COLS, 2880);
  assert.equal(SANDBOX_ROWS, 552);
  assert.equal(SANDBOX_SECTOR_COLS, 72);
  assert.equal(SANDBOX_SECTOR_ROWS, 24);
  assert.equal(SANDBOX_SECTOR_WIDTH, 40);
  assert.equal(SANDBOX_SECTOR_HEIGHT, 23);
  assert.equal(SANDBOX_TOTAL_SECTORS, 1728);

  assert.equal(world.cols, 2880);
  assert.equal(world.rows, 552);
  assert.equal(world.tiles.length, SANDBOX_COLS * SANDBOX_ROWS);
  assert.equal(world.walls.length, SANDBOX_COLS * SANDBOX_ROWS);
  assert.equal(world.exploredSectors.length, SANDBOX_TOTAL_SECTORS);
  assert.equal(SANDBOX_SURFACE_REGIONS.length, 14);
  assert.ok(world.pylons.length >= 20, `expected >= 20 pylons, got ${world.pylons.length}`);
  assert.ok(world.unlockedPylons.size >= 1);
  assert.ok(SANDBOX_QUESTS.length >= 12);

  // Sample all 24 biome strata across sky, overworld, caverns, and underworld
  const seenBiomes = new Set<string>();
  for (const reg of SANDBOX_SURFACE_REGIONS) {
    const midTx = Math.floor((reg.minTx + reg.maxTx) / 2);
    seenBiomes.add(getSandboxBiomeAt(midTx, 185).id);
  }
  for (const tx of [300, 1200, 2000]) {
    seenBiomes.add(getSandboxBiomeAt(tx, 50).id);
    seenBiomes.add(getSandboxBiomeAt(tx, 410).id);
  }
  for (const tx of [300, 900, 1600, 2150]) {
    seenBiomes.add(getSandboxBiomeAt(tx, 300).id);
  }
  assert.equal(seenBiomes.size, 24);

  // Hub chamber sits at (29, 8) with open air around spawn
  assert.equal(SANDBOX_HUB_SX, 29);
  assert.equal(SANDBOX_HUB_SY, 8);
  assert.equal(world.spawnTx, SANDBOX_HUB_SPAWN_TX);
  assert.equal(world.spawnTy, SANDBOX_HUB_SPAWN_TY);
  assert.equal(world.tiles[world.spawnTy * world.cols + world.spawnTx], SB_TILE.AIR);
  assert.equal(world.tiles[(world.spawnTy - 1) * world.cols + world.spawnTx], SB_TILE.AIR);

  // Verify Hub chamber has open directional gateways (Left, Right, Up, Down)
  const hubX0 = SANDBOX_HUB_SX * SANDBOX_SECTOR_W;
  const hubY0 = SANDBOX_HUB_SY * SANDBOX_SECTOR_H;
  const hasLeftExit = Array.from({ length: SANDBOX_SECTOR_H }, (_, dy) =>
    world.tiles[(hubY0 + dy) * world.cols + hubX0]
  ).some((t) => t === SB_TILE.AIR);
  const hasRightExit = Array.from({ length: SANDBOX_SECTOR_H }, (_, dy) =>
    world.tiles[(hubY0 + dy) * world.cols + (hubX0 + SANDBOX_SECTOR_W - 1)]
  ).some((t) => t === SB_TILE.AIR);
  const hasTopExit = Array.from({ length: SANDBOX_SECTOR_W }, (_, dx) =>
    world.tiles[hubY0 * world.cols + (hubX0 + dx)]
  ).some((t) => t === SB_TILE.AIR);
  const hasBottomExit = Array.from({ length: SANDBOX_SECTOR_W }, (_, dx) =>
    world.tiles[(hubY0 + SANDBOX_SECTOR_H - 1) * world.cols + (hubX0 + dx)]
  ).some((t) => t === SB_TILE.AIR);

  assert.equal(hasLeftExit, true);
  assert.equal(hasRightExit, true);
  assert.equal(hasTopExit, true);
  assert.equal(hasBottomExit, true);

  // Verify Classic scenic props and Celeste entities populate the world
  assert.ok(world.scenicProps.length > 500);
  assert.ok(world.celesteEntities.length > 500);
});

test('buildSandboxCollisionGrid exposes Campaign physics surfaces (Dream Block, Cloud Bounce, Conveyor, Crumble, Secret Wall)', () => {
  const world = generateSandboxWorld(202504);
  const grid = buildSandboxCollisionGrid(world);
  const player = createInitialPlayer(SANDBOX_HUB_SPAWN_TX * TILE_SIZE, SANDBOX_HUB_SPAWN_TY * TILE_SIZE);

  const tx = SANDBOX_HUB_SPAWN_TX - 8;
  const ty = SANDBOX_HUB_SPAWN_TY - 4;
  setSandboxTile(world, tx, ty, SB_TILE.DREAM_BLOCK);
  setSandboxTile(world, tx + 1, ty, SB_TILE.CLOUD_BOUNCE);
  setSandboxTile(world, tx + 2, ty, SB_TILE.CONVEYOR_RIGHT);
  setSandboxTile(world, tx + 3, ty, SB_TILE.CONVEYOR_LEFT);
  setSandboxTile(world, tx + 4, ty, SB_TILE.CRUMBLE);
  setSandboxTile(world, tx + 5, ty, SB_TILE.SECRET_WALL);

  const px = (idx: number) => (tx + idx) * TILE_SIZE + 4;
  const py = ty * TILE_SIZE + 4;

  player.dashTimer = 0;
  player.inDream = false;
  assert.equal(grid.isSolidAtPixel(px(0), py, player), true);
  assert.equal(grid.isDreamAtPixel(px(0), py), true);
  player.dashTimer = 0.1;
  assert.equal(grid.isSolidAtPixel(px(0), py, player), false);

  assert.equal(grid.isCloudBounceAtPixel?.(px(1), py), true);
  assert.equal(grid.getConveyorAtPixel(px(2), py), 42);
  assert.equal(grid.getConveyorAtPixel(px(3), py), -42);

  // Crumble triggers shaking timer and Secret Wall breaks on dash
  grid.onTileTouched?.(tx + 4, ty, 'land');
  assert.equal(world.crumbleTimers.get(ty * world.cols + (tx + 4))?.state, 'shaking');
  grid.onTileTouched?.(tx + 5, ty, 'dash');
  assert.equal(world.tiles[ty * world.cols + (tx + 5)], SB_TILE.AIR);
});

test('mineSandboxTile supports tier gating, T4+ vein-chain mining, Seismic Bombs, and Ore Radar', () => {
  const world = generateSandboxWorld(202504);
  const tx = 1150;
  const ty = 192;

  setSandboxTile(world, tx, ty, SB_TILE.ETHER_ORE);
  setSandboxTile(world, tx + 1, ty, SB_TILE.ETHER_ORE);
  setSandboxTile(world, tx + 2, ty, SB_TILE.ETHER_ORE);

  const blocked = mineSandboxTile(world, tx, ty, 2);
  assert.equal(blocked.status, 'too_hard');

  // Tier 6 Cosmic Drill breaks Ether Ore after hitting durability threshold and vein-chains connected ores
  let mined = mineSandboxTile(world, tx, ty, 6, 1);
  for (let i = 0; i < 6 && mined.status === 'damaged'; i++) {
    mined = mineSandboxTile(world, tx, ty, 6, 1);
  }
  assert.equal(mined.status, 'broken');
  assert.equal(mined.materialDrop, 'minerio_eter');
  assert.ok((mined.dropQty ?? 0) >= 3);
  assert.ok((mined.extraChainCount ?? 0) >= 2);
  assert.equal(world.tiles[ty * world.cols + tx], SB_TILE.AIR);
  assert.equal(world.progress.oresMined >= 3, true);

  // Ore Radar detects nearby placed Mithril Ore
  setSandboxTile(world, tx + 6, ty - 2, SB_TILE.MITHRIL_ORE);
  const hint = computeNearbyOreHint(world, tx, ty, 20);
  assert.ok(hint && hint.name.includes('Mitril'));

  // Seismic Bomb blasts surrounding ores
  const bombRes = detonateSeismicBomb(world, tx + 6, ty - 2, 4);
  assert.ok(bombRes.brokenCount >= 1);
  assert.equal(world.tiles[(ty - 2) * world.cols + (tx + 6)], SB_TILE.AIR);
});

test('Celeste entity placement & active chamber query work cleanly', () => {
  const world = generateSandboxWorld(202504);
  const placed = addSandboxCelesteEntity(world, 'dash_crystal', SANDBOX_HUB_SPAWN_TX + 2, SANDBOX_HUB_SPAWN_TY - 2);
  assert.equal(placed.def.kind, 'dash_crystal');

  const active = getActiveSandboxCelesteEntities(world, SANDBOX_HUB_SPAWN_TX, SANDBOX_HUB_SPAWN_TY);
  assert.ok(active.some((e) => e.def.id === placed.def.id));
});

test('validateHouseAt & registerValidatedHouse detect enclosed homes and recruit NPCs', () => {
  const world = generateSandboxWorld(202504);
  const baseTx = 1190;
  const baseTy = 196;

  for (let y = baseTy - 6; y <= baseTy + 1; y++) {
    for (let x = baseTx - 1; x <= baseTx + 9; x++) {
      setSandboxTile(world, x, y, SB_TILE.AIR);
      setSandboxWall(world, x, y, SB_WALL.NONE);
    }
  }
  for (let x = baseTx; x <= baseTx + 8; x++) {
    setSandboxTile(world, x, baseTy, SB_TILE.PLANK);
    setSandboxTile(world, x, baseTy - 5, SB_TILE.PLANK);
  }
  for (let y = baseTy - 4; y <= baseTy - 1; y++) {
    setSandboxTile(world, baseTx, y, y >= baseTy - 2 ? SB_TILE.DOOR_CLOSED : SB_TILE.PLANK);
    setSandboxTile(world, baseTx + 8, y, SB_TILE.PLANK);
    for (let x = baseTx + 1; x <= baseTx + 7; x++) {
      setSandboxWall(world, x, y, SB_WALL.WOOD_WALL);
    }
  }
  setSandboxTile(world, baseTx + 2, baseTy - 1, SB_TILE.TABLE);
  setSandboxTile(world, baseTx + 3, baseTy - 1, SB_TILE.CHAIR);
  setSandboxTile(world, baseTx + 4, baseTy - 3, SB_TILE.TORCH);

  const check = validateHouseAt(world, baseTx + 4, baseTy - 2);
  assert.equal(check.valid, true, check.reason);

  const housesBefore = world.houses.length;
  const reg = registerValidatedHouse(world, check);
  assert.equal(reg.registered, true);
  assert.ok(reg.newNpc);
  assert.equal(world.houses.length, housesBefore + 1);
});

test('exploration tracking, world pins, boss spawning, and cloud/delta round-trip preserve full state', () => {
  const world = generateSandboxWorld(202504);
  const initialPct = getSandboxExplorationPct(world.exploredSectors);
  assert.ok(initialPct >= 0);

  const marked = markSandboxSectorAt(world.exploredSectors, 100, 185);
  assert.equal(marked, true);
  assert.ok(getSandboxExplorationPct(world.exploredSectors) >= initialPct);

  setSandboxTile(world, 1172, 198, SB_TILE.SAKURA_PLANK);
  setSandboxWall(world, 1172, 198, SB_WALL.SAKURA_WALL);
  world.litBeacons.add('beacon_test');
  world.readTablets.add('tablet_test');
  world.openedChests.add('chest_test');
  world.discoveredBiomes.add('aurora_sky');
  world.unlockedPylons.add('100,185');

  const pin = dropWorldPin(world, 500, 200, 'Tesouro Celeste', '#52e5ff');
  assert.ok(pin);
  assert.equal(world.worldPins.length, 1);

  const boss = spawnSandboxBoss(world, SANDBOX_HUB_SPAWN_TX * TILE_SIZE, SANDBOX_HUB_SPAWN_TY * TILE_SIZE, 'leviathan_boss');
  assert.equal(boss.isBoss, true);
  assert.equal(boss.kind, 'leviathan_boss');

  const saved = exportSandboxDelta(world);
  const restoredDelta = generateSandboxWorld(202504);
  applySandboxDelta(restoredDelta, saved);
  assert.equal(restoredDelta.tiles[198 * restoredDelta.cols + 1172], SB_TILE.SAKURA_PLANK);
  assert.equal(restoredDelta.walls[198 * restoredDelta.cols + 1172], SB_WALL.SAKURA_WALL);

  const cloudPayload = exportCloudPayloadFromSandbox(world, {
    playerTx: 500,
    playerTy: 200,
    toolTier: 4,
    astralCoins: 777,
    craftingMaterials: { minerio_mitril: 12 },
    hotbar: [],
    backpack: [],
    claimedQuests: ['sb_wood'],
    activeHeroId: 'aetherion',
  });
  const restoredCloud = generateSandboxWorld(202504);
  applyCloudPayloadToSandbox(restoredCloud, cloudPayload);

  assert.equal(restoredCloud.tiles[198 * restoredCloud.cols + 1172], SB_TILE.SAKURA_PLANK);
  assert.equal(restoredCloud.walls[198 * restoredCloud.cols + 1172], SB_WALL.SAKURA_WALL);
  assert.equal(restoredCloud.litBeacons.has('beacon_test'), true);
  assert.equal(restoredCloud.readTablets.has('tablet_test'), true);
  assert.equal(restoredCloud.openedChests.has('chest_test'), true);
  assert.equal(restoredCloud.discoveredBiomes.has('aurora_sky'), true);
  assert.equal(restoredCloud.unlockedPylons.has('100,185'), true);
  assert.equal(restoredCloud.worldPins.length, 1);
  assert.equal(restoredCloud.worldPins[0].label, 'Tesouro Celeste');
  assert.ok(restoredCloud.exploredSectors.some((v) => v > 0));

  const removed = removeWorldPin(restoredCloud, pin.id);
  assert.equal(removed, true);
  assert.equal(restoredCloud.worldPins.length, 0);
});

test('48 studio-grade heroes and expanded crafting recipes are complete', () => {
  assert.equal(HEROES.length, 48);
  for (const hero of HEROES) {
    assert.ok(HERO_VISUAL_PROFILES[hero.id], `Missing HERO_VISUAL_PROFILES entry for ${hero.id}`);
    assert.equal(hero.skins.length, 3, `Expected 3 skins for ${hero.id}`);
  }
  assert.ok(CRAFT_RECIPES.length >= 60, `Expected >= 60 crafting recipes, got ${CRAFT_RECIPES.length}`);
});

test('every chamber layout is unique (no repeated rooms) and secrets exist', () => {
  const world = generateSandboxWorld(202504);
  const seen = new Set<string>();
  let secretWalls = 0;
  for (let sy = 0; sy < SANDBOX_SECTOR_ROWS; sy++) {
    for (let sx = 0; sx < SANDBOX_SECTOR_COLS; sx++) {
      let sig = '';
      for (let ly = 0; ly < SANDBOX_SECTOR_H; ly++) {
        const row = (sy * SANDBOX_SECTOR_H + ly) * world.cols + sx * SANDBOX_SECTOR_W;
        sig += Array.from(world.tiles.subarray(row, row + SANDBOX_SECTOR_W)).join(',') + '|';
      }
      seen.add(sig);
    }
  }
  for (let i = 0; i < world.tiles.length; i++) if (world.tiles[i] === SB_TILE.SECRET_WALL) secretWalls++;
  assert.equal(seen.size, SANDBOX_TOTAL_SECTORS);
  assert.ok(secretWalls > 300, `expected many secret walls, got ${secretWalls}`);
});
