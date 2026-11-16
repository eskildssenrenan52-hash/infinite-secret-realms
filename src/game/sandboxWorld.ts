// @ts-nocheck -- imported game code
import type { WorldPinData, SandboxCloudPayload } from '../lib/sandboxPersistence';
import type { MaterialId } from './crafting';
import type { CollisionGrid } from './physics';
import {
  SANDBOX_BIOMES,
  SANDBOX_COLS,
  SANDBOX_ROWS,
  SANDBOX_SECTOR_COLS,
  SANDBOX_SECTOR_HEIGHT,
  SANDBOX_SECTOR_ROWS,
  SANDBOX_SECTOR_WIDTH,
  SANDBOX_TOTAL_SECTORS,
  getSandboxBiomeAt,
  getSandboxCampaignBiomeAt,
  getSandboxExplorationPct,
  getSandboxSectorBiomeInfo,
  getSandboxSurfaceHeightAt,
  getSandboxSurfaceRegion,
  markSandboxSectorAt,
} from './sandboxBiomes';
import {
  EntityKind,
  LiveEntity,
  RoomPropDef,
  TILE_SIZE,
  TileType,
} from './types';
import { decorateUniqueChamber } from './sandboxUniqueChambers';

export {
  SANDBOX_BIOMES,
  SANDBOX_COLS,
  SANDBOX_ROWS,
  SANDBOX_SECTOR_COLS,
  SANDBOX_SECTOR_HEIGHT,
  SANDBOX_SECTOR_ROWS,
  SANDBOX_SECTOR_WIDTH,
  SANDBOX_TOTAL_SECTORS,
  getSandboxBiomeAt,
  getSandboxCampaignBiomeAt,
  getSandboxExplorationPct,
  getSandboxSectorBiomeInfo,
  getSandboxSurfaceHeightAt,
  getSandboxSurfaceRegion,
  markSandboxSectorAt,
};
export type { SandboxBiomeId, SandboxBiomeInfo, SandboxRegionDef } from './sandboxBiomes';

export const SANDBOX_WORLD_WIDTH_PX = SANDBOX_COLS * TILE_SIZE;
export const SANDBOX_WORLD_HEIGHT_PX = SANDBOX_ROWS * TILE_SIZE;

// Hub chamber coordinates: central Forest sanctuary ("Vale de Aethelgard")
export const SANDBOX_HUB_SX = 35;
export const SANDBOX_HUB_SY = 8;
export const SANDBOX_HUB_SPAWN_TX = SANDBOX_HUB_SX * SANDBOX_SECTOR_WIDTH + 10; // 1170
export const SANDBOX_HUB_SPAWN_TY = SANDBOX_HUB_SY * SANDBOX_SECTOR_HEIGHT + 14; // 198

/**
 * Tile IDs 0..21 mirror Classic Mode's `TileType` 1:1 so Classic's
 * `drawEnhancedTiles()` & `drawEnhancedTilePolish()` can render Sandbox directly!
 * IDs 22..74 cover ores, builder blocks, stations, and interactive furniture.
 */
export const enum SB_TILE {
  AIR = 0, // TileType.EMPTY
  SOLID = 1, // TileType.SOLID
  ONE_WAY = 2, // TileType.ONE_WAY
  SPIKE_UP = 3, // TileType.SPIKE_UP
  SPIKE_DOWN = 4, // TileType.SPIKE_DOWN
  SPIKE_LEFT = 5, // TileType.SPIKE_LEFT
  SPIKE_RIGHT = 6, // TileType.SPIKE_RIGHT
  CRUMBLE = 7, // TileType.CRUMBLE
  DREAM_BLOCK = 8, // TileType.DREAM_BLOCK
  ICE = 9, // TileType.ICE
  BREAKABLE = 10, // TileType.BREAKABLE
  STICKY_RESIN = 11, // TileType.STICKY_RESIN
  CONVEYOR_LEFT = 12, // TileType.CONVEYOR_LEFT
  CONVEYOR_RIGHT = 13, // TileType.CONVEYOR_RIGHT
  BEAT_A = 14, // TileType.BEAT_A
  BEAT_B = 15, // TileType.BEAT_B
  SECRET_WALL = 16, // TileType.SECRET_WALL
  FRAGILE_GLASS = 17, // TileType.FRAGILE_GLASS
  LIQUID_LETHAL = 18, // TileType.LIQUID_LETHAL
  WATER = 19, // TileType.WATER
  MAGMA_CRUST = 20, // TileType.MAGMA_CRUST
  CLOUD_BOUNCE = 21, // TileType.CLOUD_BOUNCE

  // Natural Terrain & Foliage
  DIRT = 22,
  GRASS = 23,
  STONE = 24,
  SAND = 25,
  SNOW = 26,
  MUD = 27,
  JUNGLE_GRASS = 28,
  ASH = 29,
  HELLSTONE = 30,
  OBSIDIAN = 31,
  DUNGEON_BRICK = 32,
  WOOD_TRUNK = 33,
  LEAVES = 34,

  // Mineable Ore Veins
  COPPER_ORE = 35,
  IRON_ORE = 36,
  GOLD_ORE = 37,
  MITHRIL_ORE = 38,
  TITANIUM_ORE = 39,
  ADAMANTITE_ORE = 40,
  ETHER_ORE = 41,

  // Crafted Builder Blocks
  PLANK = 42,
  SAKURA_PLANK = 43,
  BRICK_BLOCK = 44,
  NEON_BRICK = 45,
  PLATFORM = 46,
  GLASS = 47,
  CARVED_STONE = 48,

  // Craft Stations & Furniture / Interactive Objects
  WORKBENCH = 50,
  FORGE = 51,
  CAULDRON = 52,
  LOOM = 53,
  ANVIL = 54,
  DOOR_CLOSED = 55,
  DOOR_OPEN = 56,
  TABLE = 57,
  CHAIR = 58,
  CHEST = 59,
  BED_SPAWN = 60,
  ALTAR = 61,
  CAMPFIRE = 62,
  TORCH = 63,
  LANTERN = 64,
  BANNER = 65,
  TELEPORT_PYLON = 66,
  SHRINE = 67,
  LORE_TABLET = 68,
  QUEST_BEACON = 69,
  BOUNCE_SHROOM = 70,
  DASH_CRYSTAL = 71,
  LIFE_CRYSTAL = 72,
  POT = 73,
  SPRING_UP = 74,
}

export const enum SB_WALL {
  NONE = 0,
  DIRT_WALL = 1,
  WOOD_WALL = 2,
  STONE_WALL = 3,
  BRICK_WALL = 4,
  GLASS_WALL = 5,
  DUNGEON_WALL = 6,
  SAKURA_WALL = 7,
  NEON_WALL = 8,
}

export interface SandboxTileMeta {
  id: SB_TILE;
  name: string;
  solid: boolean;
  platform: boolean;
  blocksHouse: boolean;
  minToolTier: number;
  hitsRequired: number;
  isOre?: boolean;
  oreRarity?: number;
  color: string;
  highlightColor: string;
  materialDrop?: MaterialId;
  dropQty?: number;
  selfTileDrop?: SB_TILE;
}

export const SANDBOX_TILE_META: Record<number, SandboxTileMeta> = {
  [SB_TILE.AIR]: { id: SB_TILE.AIR, name: 'Ar', solid: false, platform: false, blocksHouse: false, minToolTier: 0, hitsRequired: 0, color: 'transparent', highlightColor: 'transparent' },
  [SB_TILE.SOLID]: { id: SB_TILE.SOLID, name: 'Bloco Ancestral', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 3, color: '#5c6475', highlightColor: '#8d99b3', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.CARVED_STONE },
  [SB_TILE.ONE_WAY]: { id: SB_TILE.ONE_WAY, name: 'Passarela Clássica', solid: false, platform: true, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#b57b4c', highlightColor: '#e8b382', selfTileDrop: SB_TILE.PLATFORM },
  [SB_TILE.SPIKE_UP]: { id: SB_TILE.SPIKE_UP, name: 'Espinhos Cima', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#ff3864', highlightColor: '#ffe066', materialDrop: 'minerio_ferro', dropQty: 1, selfTileDrop: SB_TILE.SPIKE_UP },
  [SB_TILE.SPIKE_DOWN]: { id: SB_TILE.SPIKE_DOWN, name: 'Espinhos Baixo', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#ff3864', highlightColor: '#ffe066', materialDrop: 'minerio_ferro', dropQty: 1, selfTileDrop: SB_TILE.SPIKE_DOWN },
  [SB_TILE.SPIKE_LEFT]: { id: SB_TILE.SPIKE_LEFT, name: 'Espinhos Esq.', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#ff3864', highlightColor: '#ffe066', materialDrop: 'minerio_ferro', dropQty: 1, selfTileDrop: SB_TILE.SPIKE_LEFT },
  [SB_TILE.SPIKE_RIGHT]: { id: SB_TILE.SPIKE_RIGHT, name: 'Espinhos Dir.', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#ff3864', highlightColor: '#ffe066', materialDrop: 'minerio_ferro', dropQty: 1, selfTileDrop: SB_TILE.SPIKE_RIGHT },
  [SB_TILE.CRUMBLE]: { id: SB_TILE.CRUMBLE, name: 'Rocha Frágil', solid: true, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#453759', highlightColor: '#a892c7', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.CRUMBLE },
  [SB_TILE.DREAM_BLOCK]: { id: SB_TILE.DREAM_BLOCK, name: 'Bloco Onírico', solid: true, platform: false, blocksHouse: false, minToolTier: 2, hitsRequired: 3, color: '#1b1036', highlightColor: '#c084fc', materialDrop: 'essencia_sombria', dropQty: 1, selfTileDrop: SB_TILE.DREAM_BLOCK },
  [SB_TILE.ICE]: { id: SB_TILE.ICE, name: 'Gelo Safira', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#5ec8e8', highlightColor: '#bdf3ff', materialDrop: 'cristal_gelo', dropQty: 1, selfTileDrop: SB_TILE.ICE },
  [SB_TILE.BREAKABLE]: { id: SB_TILE.BREAKABLE, name: 'Rocha Quebrável', solid: true, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#785a48', highlightColor: '#c99b7a', materialDrop: 'pedra_runica', dropQty: 2 },
  [SB_TILE.STICKY_RESIN]: { id: SB_TILE.STICKY_RESIN, name: 'Resina Adesiva', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#b45309', highlightColor: '#fbbf24', materialDrop: 'esporo_luminoso', dropQty: 1, selfTileDrop: SB_TILE.STICKY_RESIN },
  [SB_TILE.CONVEYOR_LEFT]: { id: SB_TILE.CONVEYOR_LEFT, name: 'Esteira Esq.', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#39465e', highlightColor: '#52e5ff', materialDrop: 'engrenagem_arcana', dropQty: 1, selfTileDrop: SB_TILE.CONVEYOR_LEFT },
  [SB_TILE.CONVEYOR_RIGHT]: { id: SB_TILE.CONVEYOR_RIGHT, name: 'Esteira Dir.', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#39465e', highlightColor: '#fb923c', materialDrop: 'engrenagem_arcana', dropQty: 1, selfTileDrop: SB_TILE.CONVEYOR_RIGHT },
  [SB_TILE.BEAT_A]: { id: SB_TILE.BEAT_A, name: 'Bloco Ritmo Ciano', solid: true, platform: false, blocksHouse: false, minToolTier: 2, hitsRequired: 2, color: '#0284c7', highlightColor: '#38bdf8', materialDrop: 'engrenagem_arcana', dropQty: 1, selfTileDrop: SB_TILE.BEAT_A },
  [SB_TILE.BEAT_B]: { id: SB_TILE.BEAT_B, name: 'Bloco Ritmo Rosa', solid: true, platform: false, blocksHouse: false, minToolTier: 2, hitsRequired: 2, color: '#be123c', highlightColor: '#fb7185', materialDrop: 'engrenagem_arcana', dropQty: 1, selfTileDrop: SB_TILE.BEAT_B },
  [SB_TILE.SECRET_WALL]: { id: SB_TILE.SECRET_WALL, name: 'Parede Secreta', solid: true, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#4f4669', highlightColor: '#9c8ec4', materialDrop: 'po_fada', dropQty: 1, selfTileDrop: SB_TILE.SECRET_WALL },
  [SB_TILE.FRAGILE_GLASS]: { id: SB_TILE.FRAGILE_GLASS, name: 'Vidro Frágil', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 1, color: '#67e8f9', highlightColor: '#ffffff', materialDrop: 'areia_estelar', dropQty: 1, selfTileDrop: SB_TILE.FRAGILE_GLASS },
  [SB_TILE.LIQUID_LETHAL]: { id: SB_TILE.LIQUID_LETHAL, name: 'Magma / Abismo', solid: false, platform: false, blocksHouse: false, minToolTier: 99, hitsRequired: 99, color: '#ff4d1c', highlightColor: '#fde047' },
  [SB_TILE.WATER]: { id: SB_TILE.WATER, name: 'Água Cristalina', solid: false, platform: false, blocksHouse: false, minToolTier: 99, hitsRequired: 99, color: '#1875ab', highlightColor: '#6be0ff' },
  [SB_TILE.MAGMA_CRUST]: { id: SB_TILE.MAGMA_CRUST, name: 'Crosta de Magma', solid: true, platform: false, blocksHouse: false, minToolTier: 3, hitsRequired: 4, color: '#7a1919', highlightColor: '#ff7733', materialDrop: 'brasa_viva', dropQty: 1, selfTileDrop: SB_TILE.MAGMA_CRUST },
  [SB_TILE.CLOUD_BOUNCE]: { id: SB_TILE.CLOUD_BOUNCE, name: 'Nuvem Elástica', solid: true, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#cbeeff', highlightColor: '#ffffff', materialDrop: 'fio_celestial', dropQty: 1, selfTileDrop: SB_TILE.CLOUD_BOUNCE },

  // Natural Terrain & Foliage
  [SB_TILE.DIRT]: { id: SB_TILE.DIRT, name: 'Solo Ancestral', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#6b442b', highlightColor: '#8d5b3a', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.DIRT },
  [SB_TILE.GRASS]: { id: SB_TILE.GRASS, name: 'Terra Verdejante', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#3aa85b', highlightColor: '#69d97f', materialDrop: 'madeira_ancestral', dropQty: 1, selfTileDrop: SB_TILE.DIRT },
  [SB_TILE.STONE]: { id: SB_TILE.STONE, name: 'Pedra Rúnica', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 3, color: '#5c6475', highlightColor: '#8690a6', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.STONE },
  [SB_TILE.SAND]: { id: SB_TILE.SAND, name: 'Areia Solar', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#d9b56c', highlightColor: '#f5dc93', materialDrop: 'areia_estelar', dropQty: 1, selfTileDrop: SB_TILE.SAND },
  [SB_TILE.SNOW]: { id: SB_TILE.SNOW, name: 'Neve Cristalina', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#cbe6f7', highlightColor: '#ffffff', materialDrop: 'cristal_gelo', dropQty: 1, selfTileDrop: SB_TILE.SNOW },
  [SB_TILE.MUD]: { id: SB_TILE.MUD, name: 'Lama Abissal', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#45352d', highlightColor: '#665046', materialDrop: 'erva_celeste', dropQty: 1, selfTileDrop: SB_TILE.MUD },
  [SB_TILE.JUNGLE_GRASS]: { id: SB_TILE.JUNGLE_GRASS, name: 'Musgo Biolum', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#1fb58d', highlightColor: '#6ef7cd', materialDrop: 'cristal_biolum', dropQty: 1, selfTileDrop: SB_TILE.JUNGLE_GRASS },
  [SB_TILE.ASH]: { id: SB_TILE.ASH, name: 'Cinza Vulcânica', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#38303d', highlightColor: '#594e61', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.ASH },
  [SB_TILE.HELLSTONE]: { id: SB_TILE.HELLSTONE, name: 'Pedra Infernal', solid: true, platform: false, blocksHouse: true, minToolTier: 3, hitsRequired: 5, color: '#9c2424', highlightColor: '#ff7733', materialDrop: 'brasa_viva', dropQty: 2, selfTileDrop: SB_TILE.HELLSTONE },
  [SB_TILE.OBSIDIAN]: { id: SB_TILE.OBSIDIAN, name: 'Obsidiana', solid: true, platform: false, blocksHouse: true, minToolTier: 3, hitsRequired: 5, color: '#241438', highlightColor: '#693fa1', materialDrop: 'obsidiana_viva', dropQty: 2, selfTileDrop: SB_TILE.OBSIDIAN },
  [SB_TILE.DUNGEON_BRICK]: { id: SB_TILE.DUNGEON_BRICK, name: 'Tijolo de Masmorra', solid: true, platform: false, blocksHouse: true, minToolTier: 2, hitsRequired: 4, color: '#293752', highlightColor: '#4c6694', materialDrop: 'osso_antigo', dropQty: 2, selfTileDrop: SB_TILE.DUNGEON_BRICK },
  [SB_TILE.WOOD_TRUNK]: { id: SB_TILE.WOOD_TRUNK, name: 'Tronco Antigo', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#6e4526', highlightColor: '#99653c', materialDrop: 'madeira_ancestral', dropQty: 2, selfTileDrop: SB_TILE.PLANK },
  [SB_TILE.LEAVES]: { id: SB_TILE.LEAVES, name: 'Copa de Folhas', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#2b8a4e', highlightColor: '#56c77a', materialDrop: 'esporo_luminoso', dropQty: 1 },

  // Mineable Ore Veins
  [SB_TILE.COPPER_ORE]: { id: SB_TILE.COPPER_ORE, name: 'Veio de Cobre', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, isOre: true, oreRarity: 1, color: '#8f5238', highlightColor: '#fb923c', materialDrop: 'minerio_cobre', dropQty: 2, selfTileDrop: SB_TILE.COPPER_ORE },
  [SB_TILE.IRON_ORE]: { id: SB_TILE.IRON_ORE, name: 'Veio de Ferro', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 3, isOre: true, oreRarity: 2, color: '#5f6775', highlightColor: '#cbd5e1', materialDrop: 'minerio_ferro', dropQty: 2, selfTileDrop: SB_TILE.IRON_ORE },
  [SB_TILE.GOLD_ORE]: { id: SB_TILE.GOLD_ORE, name: 'Veio de Ouro Solar', solid: true, platform: false, blocksHouse: true, minToolTier: 2, hitsRequired: 3, isOre: true, oreRarity: 3, color: '#96711e', highlightColor: '#fde047', materialDrop: 'minerio_ouro', dropQty: 2, selfTileDrop: SB_TILE.GOLD_ORE },
  [SB_TILE.MITHRIL_ORE]: { id: SB_TILE.MITHRIL_ORE, name: 'Veio de Mitril', solid: true, platform: false, blocksHouse: true, minToolTier: 2, hitsRequired: 4, isOre: true, oreRarity: 4, color: '#1b6e6a', highlightColor: '#34d399', materialDrop: 'minerio_mitril', dropQty: 2, selfTileDrop: SB_TILE.MITHRIL_ORE },
  [SB_TILE.TITANIUM_ORE]: { id: SB_TILE.TITANIUM_ORE, name: 'Veio de Titânio', solid: true, platform: false, blocksHouse: true, minToolTier: 3, hitsRequired: 4, isOre: true, oreRarity: 5, color: '#2b4775', highlightColor: '#60a5fa', materialDrop: 'minerio_titanio', dropQty: 2, selfTileDrop: SB_TILE.TITANIUM_ORE },
  [SB_TILE.ADAMANTITE_ORE]: { id: SB_TILE.ADAMANTITE_ORE, name: 'Veio de Adamantita', solid: true, platform: false, blocksHouse: true, minToolTier: 3, hitsRequired: 5, isOre: true, oreRarity: 6, color: '#7a1936', highlightColor: '#fb7185', materialDrop: 'minerio_adamantita', dropQty: 2, selfTileDrop: SB_TILE.ADAMANTITE_ORE },
  [SB_TILE.ETHER_ORE]: { id: SB_TILE.ETHER_ORE, name: 'Cristal de Éter Puro', solid: true, platform: false, blocksHouse: true, minToolTier: 4, hitsRequired: 5, isOre: true, oreRarity: 7, color: '#5e248a', highlightColor: '#e879f9', materialDrop: 'minerio_eter', dropQty: 2, selfTileDrop: SB_TILE.ETHER_ORE },

  // Crafted Builder Blocks
  [SB_TILE.PLANK]: { id: SB_TILE.PLANK, name: 'Tábua de Madeira', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#8f5d38', highlightColor: '#bd8455', selfTileDrop: SB_TILE.PLANK },
  [SB_TILE.SAKURA_PLANK]: { id: SB_TILE.SAKURA_PLANK, name: 'Tábua Sakura', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#a83c6b', highlightColor: '#ff94c2', selfTileDrop: SB_TILE.SAKURA_PLANK },
  [SB_TILE.BRICK_BLOCK]: { id: SB_TILE.BRICK_BLOCK, name: 'Bloco de Tijolo', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#6b4e57', highlightColor: '#9c7883', selfTileDrop: SB_TILE.BRICK_BLOCK },
  [SB_TILE.NEON_BRICK]: { id: SB_TILE.NEON_BRICK, name: 'Tijolo Cibernético', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#1b3b4f', highlightColor: '#22d3ee', selfTileDrop: SB_TILE.NEON_BRICK },
  [SB_TILE.PLATFORM]: { id: SB_TILE.PLATFORM, name: 'Plataforma', solid: false, platform: true, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#a36e42', highlightColor: '#d49966', selfTileDrop: SB_TILE.PLATFORM },
  [SB_TILE.GLASS]: { id: SB_TILE.GLASS, name: 'Vidro Estelar', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 1, color: '#78d2eb', highlightColor: '#ffffff', selfTileDrop: SB_TILE.GLASS },
  [SB_TILE.CARVED_STONE]: { id: SB_TILE.CARVED_STONE, name: 'Pedra Esculpida', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#475569', highlightColor: '#cbd5e1', materialDrop: 'pedra_runica', dropQty: 1, selfTileDrop: SB_TILE.CARVED_STONE },

  // Craft Stations & Interactive Objects
  [SB_TILE.WORKBENCH]: { id: SB_TILE.WORKBENCH, name: 'Bancada', solid: false, platform: true, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#9c6334', highlightColor: '#d1925c', selfTileDrop: SB_TILE.WORKBENCH },
  [SB_TILE.FORGE]: { id: SB_TILE.FORGE, name: 'Forja Rúnica', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#543540', highlightColor: '#ff7733', selfTileDrop: SB_TILE.FORGE },
  [SB_TILE.CAULDRON]: { id: SB_TILE.CAULDRON, name: 'Caldeirão Alquímico', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#274d4c', highlightColor: '#4df0c0', selfTileDrop: SB_TILE.CAULDRON },
  [SB_TILE.LOOM]: { id: SB_TILE.LOOM, name: 'Tear Celestial', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#6b3280', highlightColor: '#f0abfc', selfTileDrop: SB_TILE.LOOM },
  [SB_TILE.ANVIL]: { id: SB_TILE.ANVIL, name: 'Bigorna Rúnica', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#474359', highlightColor: '#ff8833', selfTileDrop: SB_TILE.ANVIL },
  [SB_TILE.DOOR_CLOSED]: { id: SB_TILE.DOOR_CLOSED, name: 'Porta', solid: true, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#754624', highlightColor: '#b07246', selfTileDrop: SB_TILE.DOOR_CLOSED },
  [SB_TILE.DOOR_OPEN]: { id: SB_TILE.DOOR_OPEN, name: 'Porta Aberta', solid: false, platform: false, blocksHouse: true, minToolTier: 1, hitsRequired: 2, color: '#543118', highlightColor: '#8c5732', selfTileDrop: SB_TILE.DOOR_CLOSED },
  [SB_TILE.TABLE]: { id: SB_TILE.TABLE, name: 'Mesa', solid: false, platform: true, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#8f5932', highlightColor: '#c48656', selfTileDrop: SB_TILE.TABLE },
  [SB_TILE.CHAIR]: { id: SB_TILE.CHAIR, name: 'Cadeira', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#8f5932', highlightColor: '#c48656', selfTileDrop: SB_TILE.CHAIR },
  [SB_TILE.CHEST]: { id: SB_TILE.CHEST, name: 'Baú de Tesouro', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#b58428', highlightColor: '#ffe066', selfTileDrop: SB_TILE.CHEST },
  [SB_TILE.BED_SPAWN]: { id: SB_TILE.BED_SPAWN, name: 'Cama (Spawn)', solid: false, platform: true, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#c43b5a', highlightColor: '#ffd27d', selfTileDrop: SB_TILE.BED_SPAWN },
  [SB_TILE.ALTAR]: { id: SB_TILE.ALTAR, name: 'Altar do Núcleo', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#6b329c', highlightColor: '#e88aff', selfTileDrop: SB_TILE.ALTAR },
  [SB_TILE.CAMPFIRE]: { id: SB_TILE.CAMPFIRE, name: 'Fogueira', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#ff7733', highlightColor: '#ffe875', selfTileDrop: SB_TILE.CAMPFIRE },
  [SB_TILE.TORCH]: { id: SB_TILE.TORCH, name: 'Tocha', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#ffb833', highlightColor: '#fff5b8', selfTileDrop: SB_TILE.TORCH },
  [SB_TILE.LANTERN]: { id: SB_TILE.LANTERN, name: 'Lanterna Ornamental', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#ffb84d', highlightColor: '#fff5b8', selfTileDrop: SB_TILE.LANTERN },
  [SB_TILE.BANNER]: { id: SB_TILE.BANNER, name: 'Estandarte', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#d92b54', highlightColor: '#ffd27d', selfTileDrop: SB_TILE.BANNER },
  [SB_TILE.TELEPORT_PYLON]: { id: SB_TILE.TELEPORT_PYLON, name: 'Pilão de Teleporte', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#66eeff', highlightColor: '#ffe066', selfTileDrop: SB_TILE.TELEPORT_PYLON },
  [SB_TILE.SHRINE]: { id: SB_TILE.SHRINE, name: 'Totem de Bênção', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#52e5ff', highlightColor: '#ffffff', selfTileDrop: SB_TILE.SHRINE },
  [SB_TILE.LORE_TABLET]: { id: SB_TILE.LORE_TABLET, name: 'Estela Ancestral', solid: false, platform: false, blocksHouse: false, minToolTier: 2, hitsRequired: 3, color: '#3b4f78', highlightColor: '#67e8f9', materialDrop: 'po_fada', dropQty: 2 },
  [SB_TILE.QUEST_BEACON]: { id: SB_TILE.QUEST_BEACON, name: 'Farol Astral', solid: false, platform: false, blocksHouse: false, minToolTier: 2, hitsRequired: 3, color: '#1f5c6b', highlightColor: '#52e5ff' },
  [SB_TILE.BOUNCE_SHROOM]: { id: SB_TILE.BOUNCE_SHROOM, name: 'Cogumelo Elástico', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#18b88c', highlightColor: '#a8ffea', materialDrop: 'esporo_luminoso', dropQty: 2, selfTileDrop: SB_TILE.BOUNCE_SHROOM },
  [SB_TILE.DASH_CRYSTAL]: { id: SB_TILE.DASH_CRYSTAL, name: 'Cristal de Dash', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#4df099', highlightColor: '#ffffff', materialDrop: 'cristal_biolum', dropQty: 2, selfTileDrop: SB_TILE.DASH_CRYSTAL },
  [SB_TILE.LIFE_CRYSTAL]: { id: SB_TILE.LIFE_CRYSTAL, name: 'Cristal de Vida', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 2, color: '#ff3864', highlightColor: '#ffd6e0', materialDrop: 'pedra_evolucao', dropQty: 1 },
  [SB_TILE.POT]: { id: SB_TILE.POT, name: 'Pote de Tesouro', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#a85a3a', highlightColor: '#e08e67', materialDrop: 'minerio_cobre', dropQty: 1 },
  [SB_TILE.SPRING_UP]: { id: SB_TILE.SPRING_UP, name: 'Mola de Impulso', solid: false, platform: false, blocksHouse: false, minToolTier: 1, hitsRequired: 1, color: '#ff4d7d', highlightColor: '#ffe066', selfTileDrop: SB_TILE.SPRING_UP },
};

export function isSandboxSolid(tile: number): boolean {
  return Boolean(SANDBOX_TILE_META[tile]?.solid);
}

export function isSandboxPlatform(tile: number): boolean {
  return Boolean(SANDBOX_TILE_META[tile]?.platform);
}

export function isSandboxBlockingHouse(tile: number): boolean {
  return Boolean(SANDBOX_TILE_META[tile]?.blocksHouse);
}

export function isSandboxOre(tile: number): boolean {
  return Boolean(SANDBOX_TILE_META[tile]?.isOre);
}

export interface SandboxNpc {
  id: string;
  name: string;
  role: string;
  accentColor: string;
  spriteKind?: string;
  x: number;
  y: number;
  vx: number;
  homeTx: number;
  homeTy: number;
  dir: 1 | -1;
}

export type SandboxEnemyKind =
  | 'slime'
  | 'demon_eye'
  | 'sand_crawler'
  | 'cave_skeleton'
  | 'hell_imp'
  | 'dungeon_guard'
  | 'cyber_drone'
  | 'crystal_wisp'
  | 'core_boss'
  | 'leviathan_boss'
  | 'chronos_boss'
  | 'magma_boss';

export interface SandboxEnemy {
  id: string;
  kind: SandboxEnemyKind;
  spriteKind?: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  w: number;
  h: number;
  color: string;
  timer: number;
  flash: number;
  isBoss?: boolean;
  shootTimer?: number;
}

/**
 * World-space interactive Celeste entity (matches LiveEntity shape from Classic Mode
 * so `Renderer.drawEntityArray` & Celeste traversal logic handle every object natively!)
 */
export interface SandboxCelesteEntity extends LiveEntity {
  sectorIdx: number;
}

export type SandboxScenicPropKind = RoomPropDef['kind'];

export interface SandboxScenicProp {
  id: string;
  kind: RoomPropDef['kind'];
  tx: number;
  ty: number;
  h?: number;
}

export interface SandboxHouse {
  id: string;
  centerTx: number;
  centerTy: number;
  npcId?: string;
}

export interface SandboxHotbarSlot {
  id: string;
  name: string;
  kind: 'tool' | 'weapon' | 'tile' | 'wall' | 'summon' | 'entity' | 'bomb';
  tile?: SB_TILE;
  wall?: SB_WALL;
  entityKind?: EntityKind;
  bossKind?: 'core_boss' | 'leviathan_boss' | 'chronos_boss' | 'magma_boss';
  count: number;
  color: string;
}

export interface SandboxQuestDef {
  id: string;
  title: string;
  desc: string;
  target: number;
  coinReward: number;
  xpReward: number;
  accent: string;
}

export const SANDBOX_QUESTS: SandboxQuestDef[] = [
  { id: 'sb_cut_wood', title: 'Lenhador de Aethelgard', desc: 'Colete 8 blocos de madeira ou musgo nas rotas.', target: 8, coinReward: 20, xpReward: 40, accent: '#8d5b3a' },
  { id: 'sb_mine_ore', title: 'Veia Mineral Celeste', desc: 'Minere 12 blocos de minério encravados nos desfiladeiros.', target: 12, coinReward: 45, xpReward: 75, accent: '#52e5ff' },
  { id: 'sb_explore_10', title: 'Cartógrafo das 4 Direções', desc: 'Explore pelo menos 10% das 1.200 câmaras conectadas.', target: 10, coinReward: 75, xpReward: 130, accent: '#4df0c0' },
  { id: 'sb_discover_biomes', title: 'Viajante dos 24 Biomas', desc: 'Descubra pelo menos 8 biomas distintos atravessando câmaras.', target: 8, coinReward: 85, xpReward: 150, accent: '#38bdf8' },
  { id: 'sb_light_beacons', title: 'Faróis do Horizonte', desc: 'Acenda 3 Faróis Astrais espalhados pelos biomas [E/Dir].', target: 3, coinReward: 70, xpReward: 130, accent: '#52e5ff' },
  { id: 'sb_read_tablets', title: 'Decifrador das Estelas', desc: 'Decifre 2 Estelas Ancestrais escondidas nas câmaras.', target: 2, coinReward: 55, xpReward: 95, accent: '#c084fc' },
  { id: 'sb_build_house', title: 'Arquiteto do Lar', desc: 'Construa e valide 1 Casa completa (paredes, porta, luz, mesa e cadeira).', target: 1, coinReward: 60, xpReward: 100, accent: '#ffd27d' },
  { id: 'sb_attract_npc', title: 'Vila Despertada', desc: 'Abrigue 3 moradores NPCs em casas validadas.', target: 3, coinReward: 110, xpReward: 170, accent: '#4df0c0' },
  { id: 'sb_upgrade_pick', title: 'Picareta Refinada', desc: 'Evolua sua picareta para Nível 3+ na Forja/Crafting.', target: 1, coinReward: 70, xpReward: 110, accent: '#f59e0b' },
  { id: 'sb_reach_sky', title: 'Ascensão às Nuvens', desc: 'Suba verticalmente até os Picos Celestes (sy ≤ 3).', target: 1, coinReward: 75, xpReward: 120, accent: '#a8f5ff' },
  { id: 'sb_reach_hell', title: 'Descida ao Núcleo', desc: 'Desça os poços profundos até o Submundo (sy ≥ 16).', target: 1, coinReward: 95, xpReward: 160, accent: '#ff5522' },
  { id: 'sb_explore_dungeon', title: 'Caçador de Relíquias', desc: 'Abra 4 baús antigos escondidos em cofres secretos e templos.', target: 4, coinReward: 100, xpReward: 160, accent: '#a855f7' },
  { id: 'sb_defeat_boss', title: 'Soberano dos Guardiões', desc: 'Invoque e derrote 2 Chefes de Bioma no Mundo Sandbox.', target: 2, coinReward: 260, xpReward: 420, accent: '#ff2e63' },
];

export const NPC_ROSTER: Omit<SandboxNpc, 'x' | 'y' | 'vx' | 'homeTx' | 'homeTy' | 'dir'>[] = [
  { id: 'npc_guide', name: 'Guia Lyra', role: 'Exploradora', accentColor: '#52e5ff', spriteKind: 'astra' },
  { id: 'npc_blacksmith', name: 'Ferreiro Korg', role: 'Mestre da Forja', accentColor: '#ff7733', spriteKind: 'ferro' },
  { id: 'npc_alchemist', name: 'Alquimista Vera', role: 'Boticária', accentColor: '#4df0c0', spriteKind: 'alch_vera' },
  { id: 'npc_tamer', name: 'Domador Sol', role: 'Guardião de Pets', accentColor: '#ffd27d', spriteKind: 'kael' },
  { id: 'npc_merchant', name: 'Mercador Astral', role: 'Comerciante', accentColor: '#c084fc', spriteKind: 'morgana' },
  { id: 'npc_chronomancer', name: 'Cronista Aeon', role: 'Engenheiro', accentColor: '#22d3ee', spriteKind: 'chronos' },
  { id: 'npc_sakura', name: 'Mestra Hana', role: 'Sacerdotisa Sakura', accentColor: '#f472b6', spriteKind: 'sakura' },
];

export interface SandboxWorld {
  seed: number;
  cols: number;
  rows: number;
  tiles: Uint8Array;
  walls: Uint8Array;
  tileDamage: Uint8Array;
  exploredSectors: Uint8Array;
  discoveredBiomes: Set<string>;
  spawnTx: number;
  spawnTy: number;
  dayTime: number;
  houses: SandboxHouse[];
  npcs: SandboxNpc[];
  enemies: SandboxEnemy[];
  celesteEntities: SandboxCelesteEntity[];
  celesteBuckets: Map<number, SandboxCelesteEntity[]>;
  scenicProps: SandboxScenicProp[];
  scenicBuckets: Map<number, SandboxScenicProp[]>;
  pylons: { tx: number; ty: number; label: string; color: string }[];
  unlockedPylons: Set<string>;
  collectedEntities: Set<string>;
  openedChests: Set<string>;
  litBeacons: Set<string>;
  readTablets: Set<string>;
  worldPins: WorldPinData[];
  modifiedCells: Map<number, { tile: number; wall: number }>;
  terrainDirtyTiles: number[];
  crumbleTimers: Map<number, { state: 'shaking' | 'gone'; timer: number }>;
  progress: {
    woodGathered: number;
    oresMined: number;
    housesBuilt: number;
    chestsOpened: number;
    reachedHell: number;
    reachedSky: number;
    beaconsLit: number;
    tabletsRead: number;
    bossDefeated: number;
  };
}

export interface SandboxDeltaSave {
  seed: number;
  dayTime: number;
  spawnTx: number;
  spawnTy: number;
  changes: [number, number, number][];
  houses: SandboxHouse[];
  openedChests: string[];
  litBeacons?: string[];
  readTablets?: string[];
  collectedEntities?: string[];
  unlockedPylons?: string[];
  discoveredBiomes?: string[];
  worldPins?: WorldPinData[];
  exploredSectors?: number[];
  progress: SandboxWorld['progress'];
}

function hash2d(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function createStarterHotbar(): SandboxHotbarSlot[] {
  return [
    { id: 'tool_pick', name: 'Picareta', kind: 'tool', count: 1, color: '#52e5ff' },
    { id: 'weapon_blade', name: 'Lâmina Astral', kind: 'weapon', count: 1, color: '#ff5c8a' },
    { id: 'tile_plank', name: 'Tábua', kind: 'tile', tile: SB_TILE.PLANK, count: 64, color: '#bd8455' },
    { id: 'tile_platform', name: 'Plataforma', kind: 'tile', tile: SB_TILE.PLATFORM, count: 32, color: '#d49966' },
    { id: 'wall_wood', name: 'Parede Fundo', kind: 'wall', wall: SB_WALL.WOOD_WALL, count: 80, color: '#70492b' },
    { id: 'tile_torch', name: 'Tocha', kind: 'tile', tile: SB_TILE.TORCH, count: 24, color: '#ffd24d' },
    { id: 'tile_door', name: 'Porta', kind: 'tile', tile: SB_TILE.DOOR_CLOSED, count: 4, color: '#9c6334' },
    { id: 'tile_furniture', name: 'Mesa/Cadeira', kind: 'tile', tile: SB_TILE.TABLE, count: 6, color: '#c48656' },
    { id: 'summon_boss', name: 'Olho Núcleo', kind: 'summon', bossKind: 'core_boss', count: 1, color: '#e879f9' },
  ];
}

export function indexScenicBuckets(props: SandboxScenicProp[]): Map<number, SandboxScenicProp[]> {
  const buckets = new Map<number, SandboxScenicProp[]>();
  for (const pr of props) {
    const sx = Math.max(0, Math.min(SANDBOX_SECTOR_COLS - 1, Math.floor(pr.tx / SANDBOX_SECTOR_WIDTH)));
    const sy = Math.max(0, Math.min(SANDBOX_SECTOR_ROWS - 1, Math.floor(pr.ty / SANDBOX_SECTOR_HEIGHT)));
    const sIdx = sy * SANDBOX_SECTOR_COLS + sx;
    let arr = buckets.get(sIdx);
    if (!arr) {
      arr = [];
      buckets.set(sIdx, arr);
    }
    arr.push(pr);
  }
  return buckets;
}

export function indexCelesteBuckets(entities: SandboxCelesteEntity[]): Map<number, SandboxCelesteEntity[]> {
  const buckets = new Map<number, SandboxCelesteEntity[]>();
  for (const e of entities) {
    let arr = buckets.get(e.sectorIdx);
    if (!arr) {
      arr = [];
      buckets.set(e.sectorIdx, arr);
    }
    arr.push(e);
  }
  return buckets;
}

function makeEntity(
  id: string,
  kind: EntityKind,
  tx: number,
  ty: number,
  extra: Partial<SandboxCelesteEntity> & { txEnd?: number; tyEnd?: number; dir?: -1 | 1; subType?: string; w?: number; h?: number } = {}
): SandboxCelesteEntity {
  const sx = Math.max(0, Math.min(SANDBOX_SECTOR_COLS - 1, Math.floor(tx / SANDBOX_SECTOR_WIDTH)));
  const sy = Math.max(0, Math.min(SANDBOX_SECTOR_ROWS - 1, Math.floor(ty / SANDBOX_SECTOR_HEIGHT)));
  const w =
    extra.w ??
    (kind === 'wind_up' || kind === 'wind_down'
      ? 36
      : kind === 'phase_veil'
        ? 8
        : kind === 'zip_block'
          ? 24
          : kind === 'pulse_fan'
            ? 24
            : 12);
  const h =
    extra.h ??
    (kind === 'wind_up' || kind === 'wind_down'
      ? 80
      : kind === 'phase_veil'
        ? 40
        : kind === 'pulse_fan'
          ? 64
          : kind === 'zip_block'
            ? 12
            : 12);

  return {
    sectorIdx: sy * SANDBOX_SECTOR_COLS + sx,
    def: {
      id,
      kind,
      x: tx * TILE_SIZE,
      y: ty * TILE_SIZE,
      w,
      h,
      tx: extra.txEnd,
      ty: extra.tyEnd,
      dir: extra.dir,
      subType: extra.subType,
    },
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE,
    w,
    h,
    vx: 0,
    vy: 0,
    homeX: tx * TILE_SIZE,
    homeY: ty * TILE_SIZE,
    dir: extra.dir ?? 1,
    state: kind === 'pulse_fan' ? 'active' : 'idle',
    cooldown: 0,
    timer: 0,
    hp: 3,
    maxHp: 3,
    flash: 0,
    collected: false,
    koTimer: 0,
    subType: extra.subType,
  };
}

function fillRect(
  tiles: Uint8Array,
  cols: number,
  rows: number,
  tx: number,
  ty: number,
  w: number,
  h: number,
  val: number
): void {
  const x0 = Math.max(0, tx);
  const y0 = Math.max(0, ty);
  const x1 = Math.min(cols, tx + w);
  const y1 = Math.min(rows, ty + h);
  for (let y = y0; y < y1; y++) {
    const rowOff = y * cols;
    for (let x = x0; x < x1; x++) {
      tiles[rowOff + x] = val;
    }
  }
}

function fillWallRect(
  walls: Uint8Array,
  cols: number,
  rows: number,
  tx: number,
  ty: number,
  w: number,
  h: number,
  val: number
): void {
  const x0 = Math.max(0, tx);
  const y0 = Math.max(0, ty);
  const x1 = Math.min(cols, tx + w);
  const y1 = Math.min(rows, ty + h);
  for (let y = y0; y < y1; y++) {
    const rowOff = y * cols;
    for (let x = x0; x < x1; x++) {
      walls[rowOff + x] = val;
    }
  }
}

function pickOreForStratum(stratum: string, r: number): SB_TILE {
  if (stratum === 'sky') {
    return r < 0.45 ? SB_TILE.GOLD_ORE : r < 0.78 ? SB_TILE.MITHRIL_ORE : SB_TILE.ETHER_ORE;
  }
  if (stratum === 'overworld') {
    return r < 0.5 ? SB_TILE.COPPER_ORE : r < 0.85 ? SB_TILE.IRON_ORE : SB_TILE.GOLD_ORE;
  }
  if (stratum === 'caverns') {
    return r < 0.3 ? SB_TILE.IRON_ORE : r < 0.65 ? SB_TILE.GOLD_ORE : r < 0.9 ? SB_TILE.MITHRIL_ORE : SB_TILE.TITANIUM_ORE;
  }
  // underworld
  return r < 0.25 ? SB_TILE.TITANIUM_ORE : r < 0.7 ? SB_TILE.ADAMANTITE_ORE : SB_TILE.ETHER_ORE;
}

function pickPrimaryStoneForBiome(biomeId: string): SB_TILE {
  if (biomeId === 'tundra' || biomeId === 'crystal_glacier' || biomeId === 'aurora_spire') return SB_TILE.ICE;
  if (biomeId === 'desert' || biomeId === 'sun_pyramid') return SB_TILE.SAND;
  if (biomeId === 'jungle' || biomeId === 'biolum_cave' || biomeId === 'crimson_forest') return SB_TILE.JUNGLE_GRASS;
  if (biomeId === 'magma_core' || biomeId === 'underworld' || biomeId === 'ash_wastes') return SB_TILE.HELLSTONE;
  if (biomeId === 'obsidian_fort' || biomeId === 'void_nebula' || biomeId === 'abyss_trench') return SB_TILE.OBSIDIAN;
  if (biomeId === 'dungeon' || biomeId === 'bone_crypt' || biomeId === 'cathedral') return SB_TILE.DUNGEON_BRICK;
  if (biomeId === 'clockwork' || biomeId === 'cyber_subcity') return SB_TILE.NEON_BRICK;
  if (biomeId === 'sakura_sanctum' || biomeId === 'twilight_garden') return SB_TILE.SAKURA_PLANK;
  if (biomeId === 'sky_aerie' || biomeId === 'star_citadel') return SB_TILE.SOLID;
  return SB_TILE.SOLID;
}

function pickPropForBiome(biomeId: string, r: number): RoomPropDef['kind'] {
  if (biomeId === 'sakura_sanctum') return r < 0.4 ? 'sakura_tree' : r < 0.75 ? 'torii_gate' : 'paper_lantern';
  if (biomeId === 'clockwork' || biomeId === 'cyber_subcity') return r < 0.45 ? 'clock_gear' : r < 0.75 ? 'pendulum' : 'tesla_coil';
  if (biomeId === 'cathedral' || biomeId === 'twilight_garden') return r < 0.4 ? 'stained_window' : r < 0.75 ? 'rose_window' : 'crystal_chandelier';
  if (biomeId === 'coral_ocean' || biomeId === 'abyss_trench') return r < 0.4 ? 'coral_fan' : r < 0.75 ? 'kelp_strand' : 'sunken_anchor';
  if (biomeId === 'sun_pyramid' || biomeId === 'desert') return r < 0.5 ? 'pyramid_obelisk' : 'sun_brazier';
  if (biomeId === 'aurora_spire' || biomeId === 'tundra' || biomeId === 'crystal_glacier') return r < 0.5 ? 'aurora_prism' : 'frost_arch';
  if (biomeId === 'magma_core' || biomeId === 'underworld') return r < 0.5 ? 'brazier' : 'chain';
  if (biomeId === 'biolum_cave' || biomeId === 'jungle') return r < 0.5 ? 'alchemy_vat' : 'hanging_vine';
  if (biomeId === 'sky_aerie' || biomeId === 'star_citadel') return r < 0.5 ? 'floating_island' : 'wind_chime';
  if (biomeId === 'obsidian_fort' || biomeId === 'void_nebula') return r < 0.5 ? 'obelisk' : 'soul_urn';
  return r < 0.35 ? 'pillar' : r < 0.65 ? 'banner' : r < 0.85 ? 'lantern' : 'statue';
}

function stampOreVein(
  tiles: Uint8Array,
  cx: number,
  cy: number,
  ore: SB_TILE,
  seed: number,
  radius = 2
): void {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (x <= 1 || x >= SANDBOX_COLS - 2 || y <= 1 || y >= SANDBOX_ROWS - 2) continue;
      if (hash2d(x, y, seed + 71) < 0.72) {
        const cur = tiles[y * SANDBOX_COLS + x];
        if (cur !== SB_TILE.AIR && cur !== SB_TILE.ONE_WAY) {
          tiles[y * SANDBOX_COLS + x] = ore;
        }
      }
    }
  }
}

export function generateSandboxWorld(seed = 202504): SandboxWorld {
  const cols = SANDBOX_COLS; // 2400
  const rows = SANDBOX_ROWS; // 460
  const tiles = new Uint8Array(cols * rows); // Starts 100% open AIR — pure Celeste chamber architecture!
  const walls = new Uint8Array(cols * rows);
  const tileDamage = new Uint8Array(cols * rows);
  const exploredSectors = new Uint8Array(SANDBOX_TOTAL_SECTORS);
  const celesteEntities: SandboxCelesteEntity[] = [];
  const scenicProps: SandboxScenicProp[] = [];
  const pylons: { tx: number; ty: number; label: string; color: string }[] = [];
  const placedPylonBiomes = new Set<string>();

  const CW = SANDBOX_SECTOR_WIDTH; // 40
  const CH = SANDBOX_SECTOR_HEIGHT; // 23

  // Outer world boundary frame (with open sky feel along top)
  fillRect(tiles, cols, rows, 0, rows - 2, cols, 2, SB_TILE.OBSIDIAN);
  fillRect(tiles, cols, rows, 0, 0, 2, rows, SB_TILE.OBSIDIAN);
  fillRect(tiles, cols, rows, cols - 2, 0, 2, rows, SB_TILE.OBSIDIAN);

  let entSeq = 0;
  let propSeq = 0;

  for (let sy = 0; sy < SANDBOX_SECTOR_ROWS; sy++) {
    for (let sx = 0; sx < SANDBOX_SECTOR_COLS; sx++) {
      const ox = sx * CW;
      const oy = sy * CH;
      const biomeInfo = getSandboxSectorBiomeInfo(sx, sy);
      const bId = biomeInfo.id;
      const stratum = biomeInfo.stratum;
      const solidTile = pickPrimaryStoneForBiome(bId);
      const r0 = hash2d(sx, sy, seed);
      const r1 = hash2d(sx + 17, sy + 53, seed);
      const r2 = hash2d(sx + 91, sy + 7, seed);

      const isHub = sx === SANDBOX_HUB_SX && sy === SANDBOX_HUB_SY;

      // Perimeter shell per chamber with guaranteed 4-direction Celeste exits:
      // Left/Right exits open at ly 12..18; Up/Down shafts open at lx 16..23!
      if (sy > 0) {
        // Top ceiling segments leaving center shaft open (lx 16..23) + side vents for higher sky variety
        fillRect(tiles, cols, rows, ox, oy, 16, 1, solidTile);
        fillRect(tiles, cols, rows, ox + 24, oy, 16, 1, solidTile);
      } else {
        // Topmost Sky boundary cap (still leaves partial clouds/arches)
        fillRect(tiles, cols, rows, ox, oy, 12, 1, SB_TILE.CLOUD_BOUNCE);
        fillRect(tiles, cols, rows, ox + 28, oy, 12, 1, SB_TILE.CLOUD_BOUNCE);
      }

      if (sy < SANDBOX_SECTOR_ROWS - 1) {
        // Bottom floor leaving central drop shaft open (lx 16..23)
        fillRect(tiles, cols, rows, ox, oy + CH - 2, 16, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 24, oy + CH - 2, 16, 2, solidTile);
        // Safe ONE_WAY bridge across drop shaft so walking left<->right never blindly falls!
        fillRect(tiles, cols, rows, ox + 16, oy + CH - 2, 8, 1, SB_TILE.ONE_WAY);
      } else {
        // Bedrock underworld floor with glowing obsidian ledges
        fillRect(tiles, cols, rows, ox, oy + CH - 3, CW, 3, SB_TILE.OBSIDIAN);
      }

      // Side chamber columns leaving wide traversal gates at ly 12..18 (and upper gate ly 5..9 in alternate chambers)
      fillRect(tiles, cols, rows, ox, oy + 1, 1, 11, solidTile);
      fillRect(tiles, cols, rows, ox, oy + 19, 1, 3, solidTile);
      fillRect(tiles, cols, rows, ox + CW - 1, oy + 1, 1, 11, solidTile);
      fillRect(tiles, cols, rows, ox + CW - 1, oy + 19, 1, 3, solidTile);

      // Guaranteed upward traversal from floor to the center sky hatch (lx 16..23):
      // Alternating chambers get springs, boost clouds, or tiered ONE_WAY climbs
      if (!isHub) {
        fillRect(tiles, cols, rows, ox + 17, oy + 12, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 12, oy + 6, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 22, oy + 6, 6, 1, SB_TILE.ONE_WAY);
      }

      if (isHub) {
        // === HUB CHAMBER (sx=29, sy=8): Vale de Aethelgard Sanctuary ===
        fillRect(tiles, cols, rows, ox + 1, oy + 18, CW - 2, 3, SB_TILE.GRASS);
        fillRect(tiles, cols, rows, ox + 16, oy + 18, 8, 1, SB_TILE.ONE_WAY); // drop shaft hatch down
        // Starter House on left side (tx ox+3..ox+15, ty oy+12..oy+18)
        fillWallRect(walls, cols, rows, ox + 4, oy + 12, 11, 6, SB_WALL.WOOD_WALL);
        fillRect(tiles, cols, rows, ox + 4, oy + 11, 11, 1, SB_TILE.PLANK);
        fillRect(tiles, cols, rows, ox + 3, oy + 12, 1, 3, SB_TILE.PLANK);
        fillRect(tiles, cols, rows, ox + 14, oy + 12, 1, 3, SB_TILE.PLANK);
        fillRect(tiles, cols, rows, ox + 3, oy + 15, 1, 3, SB_TILE.DOOR_OPEN);
        fillRect(tiles, cols, rows, ox + 14, oy + 15, 1, 3, SB_TILE.DOOR_OPEN);
        fillRect(tiles, cols, rows, ox + 6, oy + 13, 2, 2, SB_TILE.GLASS);
        fillWallRect(walls, cols, rows, ox + 6, oy + 13, 2, 2, SB_WALL.GLASS_WALL);
        tiles[(oy + 17) * cols + ox + 5] = SB_TILE.BED_SPAWN;
        tiles[(oy + 17) * cols + ox + 7] = SB_TILE.TABLE;
        tiles[(oy + 17) * cols + ox + 8] = SB_TILE.CHAIR;
        tiles[(oy + 17) * cols + ox + 10] = SB_TILE.WORKBENCH;
        tiles[(oy + 17) * cols + ox + 12] = SB_TILE.FORGE;
        tiles[(oy + 13) * cols + ox + 5] = SB_TILE.TORCH;
        tiles[(oy + 13) * cols + ox + 13] = SB_TILE.LANTERN;
        // Open Plaza Crafting Stations & Teleport Pylon
        tiles[(oy + 17) * cols + ox + 20] = SB_TILE.TELEPORT_PYLON;
        tiles[(oy + 17) * cols + ox + 24] = SB_TILE.CAULDRON;
        tiles[(oy + 17) * cols + ox + 26] = SB_TILE.LOOM;
        tiles[(oy + 17) * cols + ox + 28] = SB_TILE.ANVIL;
        tiles[(oy + 17) * cols + ox + 31] = SB_TILE.CAMPFIRE;
        tiles[(oy + 17) * cols + ox + 34] = SB_TILE.SHRINE;
        // Celeste upward balconies & practice obstacles in Hub
        fillRect(tiles, cols, rows, ox + 18, oy + 12, 5, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 26, oy + 10, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 10, oy + 6, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 24, oy + 5, 6, 1, SB_TILE.CLOUD_BOUNCE);
        // Embedded starter Copper & Iron Ore pockets right nearby to test mining immediately!
        fillRect(tiles, cols, rows, ox + 35, oy + 15, 3, 3, SB_TILE.STONE);
        tiles[(oy + 15) * cols + ox + 36] = SB_TILE.COPPER_ORE;
        tiles[(oy + 16) * cols + ox + 36] = SB_TILE.COPPER_ORE;
        tiles[(oy + 16) * cols + ox + 37] = SB_TILE.IRON_ORE;

        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'spring_up', ox + 19, oy + 17),
          makeEntity(`sb_c_${entSeq++}`, 'dash_crystal', ox + 28, oy + 8),
          makeEntity(`sb_c_${entSeq++}`, 'grapple_anchor', ox + 20, oy + 7),
          makeEntity(`sb_c_${entSeq++}`, 'boost_hoop', ox + 32, oy + 12),
          makeEntity(`sb_c_${entSeq++}`, 'lore_tablet', ox + 22, oy + 16),
          makeEntity(`sb_c_${entSeq++}`, 'relic', ox + 27, oy + 3),
          makeEntity(`sb_c_${entSeq++}`, 'signpost', ox + 16, oy + 17)
        );
        scenicProps.push(
          { id: `sb_p_${propSeq++}`, kind: 'banner', tx: ox + 15, ty: oy + 12, h: 4 },
          { id: `sb_p_${propSeq++}`, kind: 'arch', tx: ox + 31, ty: oy + 11, h: 7 },
          { id: `sb_p_${propSeq++}`, kind: 'sakura_tree', tx: ox + 33, ty: oy + 11, h: 7 },
          { id: `sb_p_${propSeq++}`, kind: 'lantern', tx: ox + 22, ty: oy + 1, h: 5 }
        );
        pylons.push({ tx: ox + 20, ty: oy + 17, label: biomeInfo.label, color: biomeInfo.color });
        placedPylonBiomes.add(bId);
        continue;
      }

      // Archetype 0..12 across remaining 1,199 chambers!
      const arch = Math.floor(r0 * 12) + 1;
      const oreTile = pickOreForStratum(stratum, r1);
      const isLandmark = (sx % 4 === 2 && sy % 3 === 1);

      if (arch === 1) {
        // Classic Platformer Valley + Ore Cliff
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 11, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 25, oy + 15, 11, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 15, oy + 15, 9, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 6, oy + 10, 7, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 26, oy + 9, 8, 1, SB_TILE.ONE_WAY);
        stampOreVein(tiles, ox + 7, oy + 16, oreTile, seed + sx, 2);
        stampOreVein(tiles, ox + 31, oy + 15, oreTile, seed + sy, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'spring_up', ox + 11, oy + 15),
          makeEntity(`sb_c_${entSeq++}`, 'astral_coin', ox + 9, oy + 8),
          makeEntity(`sb_c_${entSeq++}`, 'astral_coin', ox + 29, oy + 7)
        );
      } else if (arch === 2) {
        // Dream Block Gauntlet
        fillRect(tiles, cols, rows, ox + 9, oy + 11, 7, 5, SB_TILE.DREAM_BLOCK);
        fillRect(tiles, cols, rows, ox + 24, oy + 8, 7, 5, SB_TILE.DREAM_BLOCK);
        fillRect(tiles, cols, rows, ox + 4, oy + 17, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 30, oy + 17, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 18, oy + 19, 4, 1, SB_TILE.SPIKE_UP);
        stampOreVein(tiles, ox + 35, oy + 14, oreTile, seed + sx * 3, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'dash_crystal', ox + 19, oy + 13),
          makeEntity(`sb_c_${entSeq++}`, 'double_dash_crystal', ox + 20, oy + 7),
          makeEntity(`sb_c_${entSeq++}`, 'star_shard', ox + 27, oy + 5)
        );
      } else if (arch === 3) {
        // Sky Ascent Tower with Grapple & Wind
        fillRect(tiles, cols, rows, ox + 5, oy + 17, 7, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 28, oy + 17, 7, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 13, oy + 13, 14, 1, SB_TILE.CLOUD_BOUNCE);
        fillRect(tiles, cols, rows, ox + 9, oy + 8, 5, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 26, oy + 8, 5, 1, SB_TILE.ONE_WAY);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'spring_up', ox + 8, oy + 16),
          makeEntity(`sb_c_${entSeq++}`, 'grapple_anchor', ox + 20, oy + 8),
          makeEntity(`sb_c_${entSeq++}`, 'wind_up', ox + 31, oy + 7, { w: 28, h: 72 }),
          makeEntity(`sb_c_${entSeq++}`, 'feather_aura', ox + 20, oy + 4)
        );
      } else if (arch === 4) {
        // Crumble Chasm & Jump Orbs
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 5, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 10, oy + 14, 4, 1, SB_TILE.CRUMBLE);
        fillRect(tiles, cols, rows, ox + 18, oy + 13, 4, 1, SB_TILE.CRUMBLE);
        fillRect(tiles, cols, rows, ox + 26, oy + 14, 4, 1, SB_TILE.CRUMBLE);
        fillRect(tiles, cols, rows, ox + 32, oy + 16, 5, 2, solidTile);
        stampOreVein(tiles, ox + 34, oy + 16, oreTile, seed + sy * 5, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'jump_orb', ox + 15, oy + 10),
          makeEntity(`sb_c_${entSeq++}`, 'jump_orb', ox + 23, oy + 10),
          makeEntity(`sb_c_${entSeq++}`, 'boost_hoop', ox + 20, oy + 6),
          makeEntity(`sb_c_${entSeq++}`, 'winged_relic', ox + 20, oy + 3)
        );
      } else if (arch === 5) {
        // Clockwork Conveyor & Cannon Barrel Chamber
        fillRect(tiles, cols, rows, ox + 5, oy + 15, 11, 2, SB_TILE.CONVEYOR_RIGHT);
        fillRect(tiles, cols, rows, ox + 24, oy + 15, 11, 2, SB_TILE.CONVEYOR_LEFT);
        fillRect(tiles, cols, rows, ox + 15, oy + 9, 10, 2, solidTile);
        stampOreVein(tiles, ox + 20, oy + 9, oreTile, seed + sx + sy, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'cannon_barrel', ox + 11, oy + 13, { dir: 1 }),
          makeEntity(`sb_c_${entSeq++}`, 'dash_crystal', ox + 20, oy + 6),
          makeEntity(`sb_c_${entSeq++}`, 'astral_coin', ox + 19, oy + 12)
        );
      } else if (arch === 6) {
        // Cryo Ice Slopes & Icicles
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 12, 2, SB_TILE.ICE);
        fillRect(tiles, cols, rows, ox + 25, oy + 14, 12, 2, SB_TILE.ICE);
        fillRect(tiles, cols, rows, ox + 14, oy + 10, 12, 1, SB_TILE.ONE_WAY);
        stampOreVein(tiles, ox + 9, oy + 16, oreTile, seed + 13, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'falling_icicle', ox + 14, oy + 2),
          makeEntity(`sb_c_${entSeq++}`, 'falling_icicle', ox + 26, oy + 2),
          makeEntity(`sb_c_${entSeq++}`, 'bubble', ox + 19, oy + 15),
          makeEntity(`sb_c_${entSeq++}`, 'dash_crystal', ox + 20, oy + 7)
        );
      } else if (arch === 7) {
        // Rhythm Beat Temple
        fillRect(tiles, cols, rows, ox + 4, oy + 16, 5, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 10, oy + 14, 5, 1, SB_TILE.BEAT_A);
        fillRect(tiles, cols, rows, ox + 17, oy + 12, 6, 1, SB_TILE.BEAT_B);
        fillRect(tiles, cols, rows, ox + 25, oy + 14, 5, 1, SB_TILE.BEAT_A);
        fillRect(tiles, cols, rows, ox + 31, oy + 16, 5, 2, solidTile);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'phase_veil', ox + 20, oy + 7, { w: 8, h: 38 }),
          makeEntity(`sb_c_${entSeq++}`, 'star_shard', ox + 12, oy + 11),
          makeEntity(`sb_c_${entSeq++}`, 'star_shard', ox + 27, oy + 11),
          makeEntity(`sb_c_${entSeq++}`, 'treasure_chest', ox + 33, oy + 14)
        );
      } else if (arch === 8) {
        // Zip Mover & Bumper Arena
        fillRect(tiles, cols, rows, ox + 4, oy + 17, 6, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 30, oy + 17, 6, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 15, oy + 7, 10, 2, solidTile);
        stampOreVein(tiles, ox + 20, oy + 7, oreTile, seed + 44, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'zip_block', ox + 10, oy + 14, { txEnd: (ox + 26) * TILE_SIZE, tyEnd: (oy + 14) * TILE_SIZE }),
          makeEntity(`sb_c_${entSeq++}`, 'bumper_orb', ox + 13, oy + 9),
          makeEntity(`sb_c_${entSeq++}`, 'bumper_orb', ox + 26, oy + 9),
          makeEntity(`sb_c_${entSeq++}`, 'spring_up', ox + 7, oy + 16)
        );
      } else if (arch === 9) {
        // Submerged Coral Grotto
        fillRect(tiles, cols, rows, ox + 7, oy + 16, 26, 4, SB_TILE.WATER);
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 4, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 33, oy + 16, 4, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 15, oy + 15, 10, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 10, oy + 10, 6, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 24, oy + 10, 6, 1, SB_TILE.ONE_WAY);
        stampOreVein(tiles, ox + 5, oy + 16, oreTile, seed + 88, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'tether_ring', ox + 20, oy + 9),
          makeEntity(`sb_c_${entSeq++}`, 'stamina_orb', ox + 12, oy + 7),
          makeEntity(`sb_c_${entSeq++}`, 'astral_coin', ox + 26, oy + 7)
        );
      } else if (arch === 10) {
        // Gravity Inversion Sanctum
        fillRect(tiles, cols, rows, ox + 6, oy + 5, 8, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 26, oy + 5, 8, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 11, oy + 17, 18, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 18, oy + 16, 4, 1, SB_TILE.SPIKE_UP);
        stampOreVein(tiles, ox + 30, oy + 5, oreTile, seed + 99, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'gravity_crystal', ox + 14, oy + 12),
          makeEntity(`sb_c_${entSeq++}`, 'gravity_crystal', ox + 26, oy + 12),
          makeEntity(`sb_c_${entSeq++}`, 'dash_crystal', ox + 20, oy + 8)
        );
      } else if (arch === 11) {
        // Magma Forge & Obsidian Overpass (safe ONE_WAY & spring crossings!)
        const pitTile = stratum === 'underworld' ? SB_TILE.LIQUID_LETHAL : SB_TILE.WATER;
        fillRect(tiles, cols, rows, ox + 8, oy + 19, 24, 2, pitTile);
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 6, 2, SB_TILE.MAGMA_CRUST);
        fillRect(tiles, cols, rows, ox + 11, oy + 15, 7, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 22, oy + 15, 7, 1, SB_TILE.ONE_WAY);
        fillRect(tiles, cols, rows, ox + 31, oy + 16, 6, 2, SB_TILE.MAGMA_CRUST);
        stampOreVein(tiles, ox + 34, oy + 16, oreTile, seed + 123, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'steam_geyser', ox + 19, oy + 16),
          makeEntity(`sb_c_${entSeq++}`, 'spinner', ox + 19, oy + 9),
          makeEntity(`sb_c_${entSeq++}`, 'boost_hoop', ox + 20, oy + 5)
        );
      } else {
        // Secret Relic Vault & Breakable Ore Cache
        fillRect(tiles, cols, rows, ox + 3, oy + 16, 12, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 25, oy + 16, 12, 2, solidTile);
        fillRect(tiles, cols, rows, ox + 29, oy + 8, 8, 7, solidTile);
        fillRect(tiles, cols, rows, ox + 30, oy + 9, 6, 5, SB_TILE.AIR);
        fillRect(tiles, cols, rows, ox + 29, oy + 10, 1, 4, SB_TILE.SECRET_WALL);
        stampOreVein(tiles, ox + 33, oy + 8, oreTile, seed + sx * 11, 2);
        stampOreVein(tiles, ox + 6, oy + 16, oreTile, seed + sy * 11, 2);
        celesteEntities.push(
          makeEntity(`sb_c_${entSeq++}`, 'treasure_chest', ox + 33, oy + 12),
          makeEntity(`sb_c_${entSeq++}`, 'relic', ox + 31, oy + 12),
          makeEntity(`sb_c_${entSeq++}`, 'spring_up', ox + 12, oy + 15),
          makeEntity(`sb_c_${entSeq++}`, 'pulse_fan', ox + 20, oy + 10, { w: 22, h: 64 })
        );
      }

      // Landmarks, Teleport Pylons (1 guaranteed per biome!), Lore Tablets, Quest Beacons & Blessing Shrines
      if (isLandmark || !placedPylonBiomes.has(bId)) {
        const platY = oy + 17;
        fillRect(tiles, cols, rows, ox + 17, platY, 6, 1, solidTile);
        if (!placedPylonBiomes.has(bId)) {
          placedPylonBiomes.add(bId);
          tiles[(platY - 1) * cols + ox + 19] = SB_TILE.TELEPORT_PYLON;
          pylons.push({ tx: ox + 19, ty: platY - 1, label: biomeInfo.label, color: biomeInfo.color });
        } else if (r2 < 0.35) {
          celesteEntities.push(makeEntity(`sb_c_${entSeq++}`, 'quest_beacon', ox + 19, platY - 2));
        } else if (r2 < 0.7) {
          celesteEntities.push(makeEntity(`sb_c_${entSeq++}`, 'lore_tablet', ox + 19, platY - 2));
        } else {
          celesteEntities.push(makeEntity(`sb_c_${entSeq++}`, 'blessing_shrine', ox + 19, platY - 2));
        }
      }

      // Scenic Classic Mode Background Props inside chambers
      if (r1 < 0.85) {
        const px1 = ox + 5 + Math.floor(r2 * 6);
        const propKind = pickPropForBiome(bId, r2);
        scenicProps.push({
          id: `sb_p_${propSeq++}`,
          kind: propKind,
          tx: px1,
          ty: oy + 10,
          h: 6,
        });
      }
      if (r2 > 0.35) {
        const px2 = ox + 28 + Math.floor(r1 * 5);
        const propKind2 = pickPropForBiome(bId, (r1 + r2) * 0.5);
        scenicProps.push({
          id: `sb_p_${propSeq++}`,
          kind: propKind2,
          tx: px2,
          ty: oy + 9,
          h: 6,
        });
      }
      decorateUniqueChamber({
        tiles, walls, cols, rows, ox, oy, sx, sy, seed, CW, CH,
        solidTile, oreTile, stratum,
        addEntity: (kind, tx, ty, extra) => celesteEntities.push(makeEntity(`sb_c_${entSeq++}`, kind, tx, ty, extra)),
        addProp: (kind, tx, ty, h) => scenicProps.push({ id: `sb_p_${propSeq++}`, kind, tx, ty, h }),
      });
    }
  }

  // Initial explored sectors around Hub
  markSandboxSectorAt(exploredSectors, SANDBOX_HUB_SPAWN_TX, SANDBOX_HUB_SPAWN_TY);
  const startBiome = getSandboxBiomeAt(SANDBOX_HUB_SPAWN_TX, SANDBOX_HUB_SPAWN_TY);

  const npcs: SandboxNpc[] = [
    {
      ...NPC_ROSTER[0],
      x: (SANDBOX_HUB_SPAWN_TX - 2) * TILE_SIZE,
      y: (SANDBOX_HUB_SPAWN_TY + 1) * TILE_SIZE,
      vx: 0,
      homeTx: SANDBOX_HUB_SPAWN_TX - 2,
      homeTy: SANDBOX_HUB_SPAWN_TY + 1,
      dir: 1,
    },
    {
      ...NPC_ROSTER[1],
      x: (SANDBOX_HUB_SPAWN_TX + 5) * TILE_SIZE,
      y: (SANDBOX_HUB_SPAWN_TY + 1) * TILE_SIZE,
      vx: 0,
      homeTx: SANDBOX_HUB_SPAWN_TX + 5,
      homeTy: SANDBOX_HUB_SPAWN_TY + 1,
      dir: -1,
    },
  ];

  const unlockedPylons = new Set<string>();
  const hubPylon =
    pylons.find((p) => Math.abs(p.tx - SANDBOX_HUB_SPAWN_TX) < 40 && Math.abs(p.ty - SANDBOX_HUB_SPAWN_TY) < 25) ??
    pylons[0];
  if (hubPylon) {
    unlockedPylons.add(`${hubPylon.tx},${hubPylon.ty}`);
  }

  return {
    seed,
    cols,
    rows,
    tiles,
    walls,
    tileDamage,
    exploredSectors,
    discoveredBiomes: new Set([startBiome.id]),
    spawnTx: SANDBOX_HUB_SPAWN_TX,
    spawnTy: SANDBOX_HUB_SPAWN_TY,
    dayTime: 9.0,
    houses: [
      {
        id: 'hub_sanctuary',
        centerTx: SANDBOX_HUB_SX * CW + 9,
        centerTy: SANDBOX_HUB_SY * CH + 16,
        npcId: NPC_ROSTER[0].id,
      },
    ],
    npcs,
    enemies: [],
    celesteEntities,
    celesteBuckets: indexCelesteBuckets(celesteEntities),
    scenicProps,
    scenicBuckets: indexScenicBuckets(scenicProps),
    pylons,
    unlockedPylons,
    collectedEntities: new Set(),
    openedChests: new Set(),
    litBeacons: new Set(),
    readTablets: new Set(),
    worldPins: [],
    modifiedCells: new Map(),
    terrainDirtyTiles: [],
    crumbleTimers: new Map(),
    progress: {
      woodGathered: 0,
      oresMined: 0,
      housesBuilt: 1,
      chestsOpened: 0,
      reachedHell: 0,
      reachedSky: 0,
      beaconsLit: 0,
      tabletsRead: 0,
      bossDefeated: 0,
    },
  };
}

export function setSandboxTile(world: SandboxWorld, tx: number, ty: number, tile: number): void {
  if (tx < 0 || tx >= world.cols || ty < 0 || ty >= world.rows) return;
  const idx = ty * world.cols + tx;
  world.tiles[idx] = tile;
  world.tileDamage[idx] = 0;
  world.modifiedCells.set(idx, { tile, wall: world.walls[idx] });
  world.terrainDirtyTiles.push(idx);
}

export function setSandboxWall(world: SandboxWorld, tx: number, ty: number, wall: number): void {
  if (tx < 0 || tx >= world.cols || ty < 0 || ty >= world.rows) return;
  const idx = ty * world.cols + tx;
  world.walls[idx] = wall;
  world.modifiedCells.set(idx, { tile: world.tiles[idx], wall });
  world.terrainDirtyTiles.push(idx);
}

export function addSandboxCelesteEntity(
  world: SandboxWorld,
  kind: EntityKind,
  tx: number,
  ty: number
): SandboxCelesteEntity {
  const ent = makeEntity(`sb_placed_${tx}_${ty}_${Date.now()}`, kind, tx, ty);
  world.celesteEntities.push(ent);
  let bucket = world.celesteBuckets.get(ent.sectorIdx);
  if (!bucket) {
    bucket = [];
    world.celesteBuckets.set(ent.sectorIdx, bucket);
  }
  bucket.push(ent);
  return ent;
}

export function getActiveSandboxCelesteEntities(
  world: SandboxWorld,
  centerTx: number,
  centerTy: number
): SandboxCelesteEntity[] {
  const csx = Math.max(0, Math.min(SANDBOX_SECTOR_COLS - 1, Math.floor(centerTx / SANDBOX_SECTOR_WIDTH)));
  const csy = Math.max(0, Math.min(SANDBOX_SECTOR_ROWS - 1, Math.floor(centerTy / SANDBOX_SECTOR_HEIGHT)));
  const result: SandboxCelesteEntity[] = [];
  for (let sy = Math.max(0, csy - 1); sy <= Math.min(SANDBOX_SECTOR_ROWS - 1, csy + 1); sy++) {
    for (let sx = Math.max(0, csx - 1); sx <= Math.min(SANDBOX_SECTOR_COLS - 1, csx + 1); sx++) {
      const b = world.celesteBuckets.get(sy * SANDBOX_SECTOR_COLS + sx);
      if (b) {
        for (const item of b) result.push(item);
      }
    }
  }
  return result;
}

export interface MineResult {
  status: 'empty' | 'too_hard' | 'damaged' | 'broken';
  materialDrop?: MaterialId;
  dropQty?: number;
  selfTileDrop?: SB_TILE;
  extraChainCount?: number;
  isCrit?: boolean;
}

export function mineSandboxTile(
  world: SandboxWorld,
  tx: number,
  ty: number,
  toolTier: number,
  miningPowerMult = 1
): MineResult {
  if (tx <= 0 || tx >= world.cols - 1 || ty <= 0 || ty >= world.rows - 1) return { status: 'empty' };
  const idx = ty * world.cols + tx;
  const tile = world.tiles[idx];
  if (tile === SB_TILE.AIR || tile === SB_TILE.WATER || tile === SB_TILE.LIQUID_LETHAL) {
    return { status: 'empty' };
  }
  const meta = SANDBOX_TILE_META[tile];
  if (!meta) return { status: 'empty' };
  if (toolTier < meta.minToolTier) {
    return { status: 'too_hard' };
  }
  const hitPower = Math.max(1, Math.round((1 + Math.max(0, toolTier - meta.minToolTier)) * miningPowerMult));
  world.tileDamage[idx] = Math.min(255, world.tileDamage[idx] + hitPower);
  if (world.tileDamage[idx] < meta.hitsRequired) {
    return { status: 'damaged' };
  }

  let totalDropQty = meta.dropQty ?? 1;
  let extraChainCount = 0;

  // Break primary tile
  setSandboxTile(world, tx, ty, SB_TILE.AIR);

  // Vein-Chain Mining bonus (Tool Tier 4+ or high mining power breaks up to 6 connected matching ore tiles!)
  if (meta.isOre && toolTier >= 4) {
    const queue: [number, number][] = [[tx, ty]];
    const seen = new Set<number>([idx]);
    while (queue.length > 0 && extraChainCount < 6) {
      const [cx, cy] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx <= 0 || nx >= world.cols - 1 || ny <= 0 || ny >= world.rows - 1) continue;
        const nIdx = ny * world.cols + nx;
        if (seen.has(nIdx)) continue;
        seen.add(nIdx);
        if (world.tiles[nIdx] === tile) {
          setSandboxTile(world, nx, ny, SB_TILE.AIR);
          extraChainCount += 1;
          totalDropQty += meta.dropQty ?? 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  // Critical mining strike bonus (+1 ore)
  const isCrit = Boolean(meta.isOre && hash2d(tx, ty, world.seed + world.progress.oresMined) < 0.2);
  if (isCrit) totalDropQty += 1;

  if (tile === SB_TILE.WOOD_TRUNK || tile === SB_TILE.PLANK || tile === SB_TILE.GRASS || tile === SB_TILE.LEAVES) {
    world.progress.woodGathered += 1;
  }
  if (meta.isOre) {
    world.progress.oresMined += 1 + extraChainCount;
  }

  return {
    status: 'broken',
    materialDrop: meta.materialDrop,
    dropQty: totalDropQty,
    selfTileDrop: meta.selfTileDrop,
    extraChainCount,
    isCrit,
  };
}

/** Seismic Mining Bomb: blasts ores, dirt, and breakable stone in a 5×5 area. */
export function detonateSeismicBomb(
  world: SandboxWorld,
  cx: number,
  cy: number,
  toolTier: number
): { brokenCount: number; materials: Partial<Record<MaterialId, number>> } {
  let brokenCount = 0;
  const materials: Partial<Record<MaterialId, number>> = {};
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = cx + dx;
      const ty = cy + dy;
      if (tx <= 1 || tx >= world.cols - 2 || ty <= 1 || ty >= world.rows - 2) continue;
      const t = world.tiles[ty * world.cols + tx];
      if (t === SB_TILE.AIR || t === SB_TILE.TELEPORT_PYLON || t === SB_TILE.BED_SPAWN || t === SB_TILE.CHEST) continue;
      const meta = SANDBOX_TILE_META[t];
      if (!meta || meta.minToolTier > Math.max(3, toolTier + 1)) continue;
      setSandboxTile(world, tx, ty, SB_TILE.AIR);
      brokenCount += 1;
      if (meta.materialDrop) {
        materials[meta.materialDrop] = (materials[meta.materialDrop] ?? 0) + (meta.dropQty ?? 1);
      }
      if (meta.isOre) world.progress.oresMined += 1;
    }
  }
  return { brokenCount, materials };
}

/** Find nearest rare ore tile within 24 tiles for the Ore Radar HUD / Elixir */
export function computeNearbyOreHint(
  world: SandboxWorld,
  centerTx: number,
  centerTy: number,
  radius = 22
): { name: string; color: string; dx: number; dy: number; dist: number } | null {
  let best: { name: string; color: string; dx: number; dy: number; dist: number; rarity: number } | null = null;
  const x0 = Math.max(1, centerTx - radius);
  const x1 = Math.min(world.cols - 2, centerTx + radius);
  const y0 = Math.max(1, centerTy - radius);
  const y1 = Math.min(world.rows - 2, centerTy + radius);

  for (let y = y0; y <= y1; y++) {
    const rowOff = y * world.cols;
    for (let x = x0; x <= x1; x++) {
      const t = world.tiles[rowOff + x];
      const meta = SANDBOX_TILE_META[t];
      if (!meta?.isOre) continue;
      const dist = Math.hypot(x - centerTx, y - centerTy);
      const rarity = meta.oreRarity ?? 1;
      if (!best || rarity > best.rarity || (rarity === best.rarity && dist < best.dist)) {
        best = {
          name: meta.name,
          color: meta.highlightColor,
          dx: x - centerTx,
          dy: y - centerTy,
          dist: Math.round(dist),
          rarity,
        };
      }
    }
  }
  if (!best) return null;
  return { name: best.name, color: best.color, dx: best.dx, dy: best.dy, dist: best.dist };
}

export function validateHouseAt(
  world: SandboxWorld,
  originTx: number,
  originTy: number
): { valid: boolean; reason: string; centerTx: number; centerTy: number } {
  const x0 = Math.max(1, originTx - 9);
  const x1 = Math.min(world.cols - 2, originTx + 9);
  const y0 = Math.max(1, originTy - 6);
  const y1 = Math.min(world.rows - 2, originTy + 6);
  let wallCount = 0;
  let doorCount = 0;
  let lightCount = 0;
  let tableCount = 0;
  let chairCount = 0;
  let solidBorder = 0;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = y * world.cols + x;
      const t = world.tiles[idx];
      const w = world.walls[idx];
      if (w !== SB_WALL.NONE) wallCount++;
      if (t === SB_TILE.DOOR_CLOSED || t === SB_TILE.DOOR_OPEN) doorCount++;
      if (t === SB_TILE.TORCH || t === SB_TILE.LANTERN || t === SB_TILE.CAMPFIRE) lightCount++;
      if (t === SB_TILE.TABLE || t === SB_TILE.WORKBENCH || t === SB_TILE.BED_SPAWN) tableCount++;
      if (t === SB_TILE.CHAIR || t === SB_TILE.BED_SPAWN) chairCount++;
      if (isSandboxBlockingHouse(t)) solidBorder++;
    }
  }

  if (solidBorder < 14) return { valid: false, reason: 'Precisa de piso, teto e paredes sólidas fechadas (14+ blocos).', centerTx: originTx, centerTy: originTy };
  if (wallCount < 16) return { valid: false, reason: 'Faltam paredes de fundo na área (mín. 16 blocos).', centerTx: originTx, centerTy: originTy };
  if (doorCount < 1) return { valid: false, reason: 'Falta uma Porta na entrada.', centerTx: originTx, centerTy: originTy };
  if (lightCount < 1) return { valid: false, reason: 'Falta iluminação (Tocha, Lanterna ou Fogueira).', centerTx: originTx, centerTy: originTy };
  if (tableCount < 1 || chairCount < 1) return { valid: false, reason: 'Precisa de Mesa + Cadeira (ou Cama).', centerTx: originTx, centerTy: originTy };

  return { valid: true, reason: 'Casa válida e habitável!', centerTx: originTx, centerTy: originTy };
}

export function registerValidatedHouse(
  world: SandboxWorld,
  check: { valid: boolean; centerTx: number; centerTy: number }
): { registered: boolean; newNpc?: SandboxNpc } {
  if (!check.valid) return { registered: false };
  const duplicate = world.houses.some((h) => Math.hypot(h.centerTx - check.centerTx, h.centerTy - check.centerTy) < 12);
  if (duplicate) return { registered: false };

  const houseId = `house_${world.houses.length + 1}_${check.centerTx}_${check.centerTy}`;
  let newNpc: SandboxNpc | undefined;
  const nextNpcTemplate = NPC_ROSTER.find((tpl) => !world.npcs.some((n) => n.id === tpl.id));
  if (nextNpcTemplate) {
    newNpc = {
      ...nextNpcTemplate,
      x: check.centerTx * TILE_SIZE,
      y: check.centerTy * TILE_SIZE,
      vx: 0,
      homeTx: check.centerTx,
      homeTy: check.centerTy,
      dir: 1,
    };
    world.npcs.push(newNpc);
  }
  world.houses.push({ id: houseId, centerTx: check.centerTx, centerTy: check.centerTy, npcId: newNpc?.id });
  world.progress.housesBuilt = world.houses.length;
  return { registered: true, newNpc };
}

export function spawnSandboxBoss(
  world: SandboxWorld,
  nearPxX: number,
  nearPxY: number,
  kind: 'core_boss' | 'leviathan_boss' | 'chronos_boss' | 'magma_boss' = 'core_boss'
): SandboxEnemy {
  const BOSS_PRESETS = {
    core_boss: { name: 'Guardião do Núcleo', spriteKind: 'boss_colossus', color: '#e879f9', hp: 55 },
    leviathan_boss: { name: 'Leviatã Abissal', spriteKind: 'boss_hydra', color: '#38bdf8', hp: 70 },
    chronos_boss: { name: 'Arcanjo Cronos', spriteKind: 'boss_seraph', color: '#fbbf24', hp: 85 },
    magma_boss: { name: 'Imperador de Magma', spriteKind: 'boss_inferno', color: '#ff5522', hp: 105 },
  };
  const cfg = BOSS_PRESETS[kind];
  const boss: SandboxEnemy = {
    id: `sb_boss_${Date.now()}`,
    kind,
    spriteKind: cfg.spriteKind,
    name: cfg.name,
    x: nearPxX + 85,
    y: Math.max(48, nearPxY - 60),
    vx: 0,
    vy: 0,
    hp: cfg.hp,
    maxHp: cfg.hp,
    w: 22,
    h: 22,
    color: cfg.color,
    timer: 0,
    flash: 0,
    isBoss: true,
    shootTimer: 1.5,
  };
  world.enemies.push(boss);
  return boss;
}

export function isSandboxNight(dayTime: number): boolean {
  return dayTime >= 19.5 || dayTime < 5.5;
}

/** Map Sandbox tile to Classic `TileType` for exact Classic physics & rendering behavior! */
export function buildSandboxCollisionGrid(
  world: SandboxWorld,
  onTileTrigger?: (tx: number, ty: number, tile: number, kind: 'land' | 'dash' | 'grab') => void,
  beatPhase = 0
): CollisionGrid {
  const getTileAt = (tx: number, ty: number): number => {
    if (tx < 0 || ty < 0 || tx >= world.cols || ty >= world.rows) return SB_TILE.OBSIDIAN;
    const idx = ty * world.cols + tx;
    const t = world.tiles[idx];
    if (t === SB_TILE.CRUMBLE || t === SB_TILE.FRAGILE_GLASS) {
      const cState = world.crumbleTimers.get(idx);
      if (cState?.state === 'gone') return SB_TILE.AIR;
    }
    return t;
  };

  return {
    isSolidAtPixel: (px: number, py: number, player?: { dashTimer?: number; inDream?: boolean }) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      if (tx < 0 || ty < 0 || tx >= world.cols || ty >= world.rows) return true;
      const t = getTileAt(tx, ty);
      if (t === SB_TILE.DREAM_BLOCK) {
        if (player && ((player.dashTimer ?? 0) > 0 || player.inDream)) return false;
        return true;
      }
      if (t === SB_TILE.BEAT_A) return beatPhase === 0;
      if (t === SB_TILE.BEAT_B) return beatPhase === 1;
      if (isSandboxSolid(t)) return true;

      // Check solid active Celeste entities in nearby sectors (zip_block, switch_gate, lock_door)
      const nearby = getActiveSandboxCelesteEntities(world, tx, ty);
      for (const e of nearby) {
        if (e.state === 'open' || e.state === 'dead') continue;
        const k = e.def.kind;
        if (k === 'zip_block' || k === 'switch_gate' || k === 'lock_door') {
          if (px >= e.x && px < e.x + e.w && py >= e.y && py < e.y + e.h) return true;
        }
      }
      return false;
    },
    isOneWayAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return isSandboxPlatform(getTileAt(tx, ty));
    },
    isDreamAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.DREAM_BLOCK;
    },
    isIceAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.ICE;
    },
    isStickyAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.STICKY_RESIN;
    },
    isMagmaAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.MAGMA_CRUST;
    },
    isWaterAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.WATER;
    },
    isCloudBounceAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      return getTileAt(tx, ty) === SB_TILE.CLOUD_BOUNCE;
    },
    getConveyorAtPixel: (px: number, py: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      const t = getTileAt(tx, ty);
      if (t === SB_TILE.CONVEYOR_LEFT) return -42;
      if (t === SB_TILE.CONVEYOR_RIGHT) return 42;
      return 0;
    },
    isHazardAtPixel: (px: number, py: number, _vx: number, vy: number) => {
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      const t = getTileAt(tx, ty);
      if (t === SB_TILE.LIQUID_LETHAL) return true;
      if (t === SB_TILE.SPIKE_UP && vy >= -10) return true;
      if (t === SB_TILE.SPIKE_DOWN && vy <= 10) return true;
      if (t === SB_TILE.SPIKE_LEFT || t === SB_TILE.SPIKE_RIGHT) return true;
      return false;
    },
    onTileTouched: (tx: number, ty: number, kind: 'land' | 'dash' | 'grab') => {
      if (tx < 0 || ty < 0 || tx >= world.cols || ty >= world.rows) return;
      const idx = ty * world.cols + tx;
      const realTile = world.tiles[idx];
      if (realTile === SB_TILE.CRUMBLE && kind === 'land') {
        if (!world.crumbleTimers.has(idx)) {
          world.crumbleTimers.set(idx, { state: 'shaking', timer: 0.45 });
        }
        onTileTrigger?.(tx, ty, realTile, kind);
      } else if (realTile === SB_TILE.FRAGILE_GLASS && kind === 'land') {
        if (!world.crumbleTimers.has(idx)) {
          world.crumbleTimers.set(idx, { state: 'shaking', timer: 0.14 });
        }
        onTileTrigger?.(tx, ty, realTile, kind);
      } else if (
        (realTile === SB_TILE.SECRET_WALL || realTile === SB_TILE.BREAKABLE || realTile === SB_TILE.FRAGILE_GLASS) &&
        kind === 'dash'
      ) {
        setSandboxTile(world, tx, ty, SB_TILE.AIR);
        onTileTrigger?.(tx, ty, realTile, kind);
      } else if (realTile === SB_TILE.CLOUD_BOUNCE && kind === 'land') {
        onTileTrigger?.(tx, ty, realTile, kind);
      }
    },
  };
}

export function dropWorldPin(
  world: SandboxWorld,
  tx: number,
  ty: number,
  label: string,
  color = '#ffd27d'
): WorldPinData | null {
  if (world.worldPins.length >= 50) return null;
  const pin: WorldPinData = {
    id: `pin_${Date.now()}_${Math.floor(Math.random() * 999)}`,
    tx: Math.max(0, Math.min(world.cols - 1, Math.round(tx))),
    ty: Math.max(0, Math.min(world.rows - 1, Math.round(ty))),
    label: label.slice(0, 32) || 'Marcador',
    color,
  };
  world.worldPins.push(pin);
  return pin;
}

export function removeWorldPin(world: SandboxWorld, pinId: string): boolean {
  const idx = world.worldPins.findIndex((p) => p.id === pinId);
  if (idx === -1) return false;
  world.worldPins.splice(idx, 1);
  return true;
}

export function exportSandboxDelta(world: SandboxWorld): SandboxDeltaSave {
  const changes: [number, number, number][] = [];
  for (const [idx, v] of world.modifiedCells.entries()) {
    changes.push([idx, v.tile, v.wall]);
  }
  const exploredList: number[] = [];
  for (let i = 0; i < world.exploredSectors.length; i++) {
    if (world.exploredSectors[i] > 0) exploredList.push(i);
  }
  return {
    seed: world.seed,
    dayTime: world.dayTime,
    spawnTx: world.spawnTx,
    spawnTy: world.spawnTy,
    changes: changes.slice(0, 4000),
    houses: [...world.houses],
    openedChests: Array.from(world.openedChests),
    litBeacons: Array.from(world.litBeacons),
    readTablets: Array.from(world.readTablets),
    collectedEntities: Array.from(world.collectedEntities),
    unlockedPylons: Array.from(world.unlockedPylons),
    discoveredBiomes: Array.from(world.discoveredBiomes),
    worldPins: [...world.worldPins],
    exploredSectors: exploredList,
    progress: { ...world.progress },
  };
}

export function applySandboxDelta(world: SandboxWorld, delta: SandboxDeltaSave): void {
  if (!delta) return;
  if (typeof delta.dayTime === 'number') world.dayTime = delta.dayTime;
  if (typeof delta.spawnTx === 'number') world.spawnTx = Math.max(2, Math.min(world.cols - 3, delta.spawnTx));
  if (typeof delta.spawnTy === 'number') world.spawnTy = Math.max(2, Math.min(world.rows - 3, delta.spawnTy));

  for (const [idx, tile, wall] of delta.changes ?? []) {
    if (idx >= 0 && idx < world.tiles.length) {
      world.tiles[idx] = tile;
      world.walls[idx] = wall;
      world.modifiedCells.set(idx, { tile, wall });
      world.terrainDirtyTiles.push(idx);
    }
  }
  for (const k of delta.openedChests ?? []) world.openedChests.add(k);
  for (const k of delta.litBeacons ?? []) world.litBeacons.add(k);
  for (const k of delta.readTablets ?? []) world.readTablets.add(k);
  for (const k of delta.collectedEntities ?? []) world.collectedEntities.add(k);
  for (const k of delta.unlockedPylons ?? []) world.unlockedPylons.add(k);
  for (const b of delta.discoveredBiomes ?? []) world.discoveredBiomes.add(b);
  if (Array.isArray(delta.worldPins)) {
    world.worldPins = delta.worldPins.slice(0, 50);
  }
  for (const sIdx of delta.exploredSectors ?? []) {
    if (sIdx >= 0 && sIdx < world.exploredSectors.length) {
      world.exploredSectors[sIdx] = 1;
    }
  }
  for (const ce of world.celesteEntities) {
    if (world.collectedEntities.has(ce.def.id) || world.openedChests.has(ce.def.id)) {
      ce.collected = true;
    }
    if (world.litBeacons.has(ce.def.id) || world.readTablets.has(ce.def.id)) {
      ce.state = 'lit';
    }
  }
  if (delta.houses && delta.houses.length > 0) {
    world.houses = [...delta.houses];
    for (const h of world.houses) {
      if (h.npcId && !world.npcs.some((n) => n.id === h.npcId)) {
        const tpl = NPC_ROSTER.find((n) => n.id === h.npcId);
        if (tpl) {
          world.npcs.push({
            ...tpl,
            x: h.centerTx * TILE_SIZE,
            y: h.centerTy * TILE_SIZE,
            vx: 0,
            homeTx: h.centerTx,
            homeTy: h.centerTy,
            dir: 1,
          });
        }
      }
    }
  }
  if (delta.progress) {
    world.progress = { ...world.progress, ...delta.progress };
  }
}

export function exportCloudPayloadFromSandbox(
  world: SandboxWorld,
  opts: {
    playerTx: number;
    playerTy: number;
    toolTier: number;
    astralCoins: number;
    craftingMaterials: Record<string, number>;
    hotbar: SandboxHotbarSlot[];
    backpack: SandboxHotbarSlot[];
    claimedQuests: string[];
    activeHeroId: string;
  }
): SandboxCloudPayload {
  const delta = exportSandboxDelta(world);
  const tileOverrides: Record<string, number> = {};
  for (const [idx, tile, wall] of delta.changes) {
    tileOverrides[String(idx)] = (wall << 8) | (tile & 0xff);
  }
  const collectedIds: string[] = [
    ...Array.from(world.collectedEntities).map((s) => `c:${s}`),
    ...Array.from(world.openedChests).map((s) => `h:${s}`),
    ...Array.from(world.litBeacons).map((s) => `b:${s}`),
    ...Array.from(world.readTablets).map((s) => `t:${s}`),
  ];
  const exploredList = delta.exploredSectors ?? [];
  return {
    heroId: opts.activeHeroId,
    seed: world.seed,
    playerTx: Math.max(0, Math.min(world.cols, Math.floor(opts.playerTx))),
    playerTy: Math.max(0, Math.min(world.rows, Math.floor(opts.playerTy))),
    spawnTx: world.spawnTx,
    spawnTy: world.spawnTy,
    toolTier: opts.toolTier,
    exploredSectorsCount: exploredList.length,
    exploredSectorIndices: exploredList,
    discoveredBiomes: Array.from(world.discoveredBiomes),
    unlockedPylons: Array.from(world.unlockedPylons),
    collectedIds,
    tileOverrides,
    materials: opts.craftingMaterials,
    hotbar: opts.hotbar.map((s) => ({
      id: s.id,
      name: s.name,
      count: s.count,
      color: s.color,
      kind: s.kind,
      tileId: s.tile ?? s.wall ?? 0,
    })),
    backpack: opts.backpack.map((s) => ({
      id: s.id,
      name: s.name,
      count: s.count,
      color: s.color,
      kind: s.kind,
      tileId: s.tile ?? s.wall ?? 0,
    })),
    questsClaimed: opts.claimedQuests,
    worldPins: world.worldPins,
    stats: { ...world.progress, astralCoins: opts.astralCoins, dayTimeTenths: Math.round(world.dayTime * 10) },
    clientUpdatedAtMs: Date.now(),
  };
}

export function applyCloudPayloadToSandbox(world: SandboxWorld, payload: SandboxCloudPayload): void {
  if (!payload) return;
  const changes: [number, number, number][] = [];
  for (const [k, packed] of Object.entries(payload.tileOverrides ?? {})) {
    const idx = Number(k);
    if (!Number.isInteger(idx) || idx < 0 || idx >= world.tiles.length) continue;
    const tile = packed & 0xff;
    const wall = (packed >> 8) & 0xff;
    changes.push([idx, tile, wall]);
  }
  const collectedEntities: string[] = [];
  const openedChests: string[] = [];
  const litBeacons: string[] = [];
  const readTablets: string[] = [];
  for (const raw of payload.collectedIds ?? []) {
    if (raw.startsWith('c:')) collectedEntities.push(raw.slice(2));
    else if (raw.startsWith('h:')) openedChests.push(raw.slice(2));
    else if (raw.startsWith('b:')) litBeacons.push(raw.slice(2));
    else if (raw.startsWith('t:')) readTablets.push(raw.slice(2));
    else collectedEntities.push(raw);
  }
  const dayTime =
    typeof payload.stats?.dayTimeTenths === 'number'
      ? (payload.stats.dayTimeTenths / 10) % 24
      : world.dayTime;

  applySandboxDelta(world, {
    seed: payload.seed ?? world.seed,
    dayTime,
    spawnTx: payload.spawnTx ?? world.spawnTx,
    spawnTy: payload.spawnTy ?? world.spawnTy,
    changes,
    houses: world.houses,
    openedChests,
    litBeacons,
    readTablets,
    collectedEntities,
    unlockedPylons: payload.unlockedPylons ?? [],
    discoveredBiomes: payload.discoveredBiomes ?? [],
    worldPins: payload.worldPins ?? [],
    exploredSectors: payload.exploredSectorIndices ?? [],
    progress: {
      woodGathered: payload.stats?.woodGathered ?? world.progress.woodGathered,
      oresMined: payload.stats?.oresMined ?? world.progress.oresMined,
      housesBuilt: payload.stats?.housesBuilt ?? world.progress.housesBuilt,
      chestsOpened: payload.stats?.chestsOpened ?? world.progress.chestsOpened,
      reachedHell: payload.stats?.reachedHell ?? world.progress.reachedHell,
      reachedSky: payload.stats?.reachedSky ?? world.progress.reachedSky,
      beaconsLit: payload.stats?.beaconsLit ?? world.progress.beaconsLit,
      tabletsRead: payload.stats?.tabletsRead ?? world.progress.tabletsRead,
      bossDefeated: payload.stats?.bossDefeated ?? world.progress.bossDefeated,
    },
  });
}
