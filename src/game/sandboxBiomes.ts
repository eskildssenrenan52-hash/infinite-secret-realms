// @ts-nocheck -- imported game code
import { ROOM_COLS, ROOM_ROWS, type AnyBiomeId } from './types';

// Giant Multi-Directional Celeste Open World: 60 x 20 = 1,200 seamless 40x23 Celeste chambers!
export const SANDBOX_SECTOR_W = ROOM_COLS; // 40
export const SANDBOX_SECTOR_H = ROOM_ROWS; // 23
export const SANDBOX_SECTOR_WIDTH = SANDBOX_SECTOR_W;
export const SANDBOX_SECTOR_HEIGHT = SANDBOX_SECTOR_H;
export const SANDBOX_SECTOR_COLS = 72;
export const SANDBOX_SECTOR_ROWS = 24;
export const SANDBOX_COLS = SANDBOX_SECTOR_COLS * SANDBOX_SECTOR_W; // 2400
export const SANDBOX_ROWS = SANDBOX_SECTOR_ROWS * SANDBOX_SECTOR_H; // 460
export const SANDBOX_SECTOR_TILE_SIZE = SANDBOX_SECTOR_W; // 40 (horizontal reference)
export const SANDBOX_TOTAL_SECTORS = SANDBOX_SECTOR_COLS * SANDBOX_SECTOR_ROWS; // 1200

export type SandboxBiomeId =
  | 'ocean_west'
  | 'ancient_dungeon'
  | 'tundra'
  | 'jade_bamboo'
  | 'crimson_sakura'
  | 'forest'
  | 'desert'
  | 'jungle'
  | 'clockwork_city'
  | 'crimson_canyon'
  | 'twilight_garden'
  | 'obsidian_temple'
  | 'abyss_surface'
  | 'ocean_east'
  | 'sky_islands'
  | 'cloud_monastery'
  | 'aurora_sky'
  | 'caverns'
  | 'sunken_cathedral'
  | 'bone_catacombs'
  | 'alchemical_caves'
  | 'underworld'
  | 'magma_core'
  | 'pandemonium_citadel';

export interface SandboxRegionDef {
  id: SandboxBiomeId;
  minSx: number;
  maxSx: number;
  minTx: number;
  maxTx: number;
  label: string;
  subtitle: string;
  color: string;
  campaignBiome: AnyBiomeId;
  dangerTier: number;
}

/** 14 Seamless Interconnected Open-Air Horizons across 60 chamber columns (2400 tiles) */
export const SANDBOX_SURFACE_REGIONS: SandboxRegionDef[] = [
  {
    id: 'ocean_west',
    minSx: 0,
    maxSx: 3,
    minTx: 0,
    maxTx: 120,
    label: 'Porto Estelar Oeste',
    subtitle: 'Docas estelares, faróis de cristal e recifes luminosos',
    color: '#38bdf8',
    campaignBiome: 'starlight_harbor',
    dangerTier: 1,
  },
  {
    id: 'ancient_dungeon',
    minSx: 3,
    maxSx: 7,
    minTx: 120,
    maxTx: 280,
    label: 'Cripta Ametista',
    subtitle: 'Torres arruinadas, vitrais arcanos e câmaras de eco',
    color: '#818cf8',
    campaignBiome: 'amethyst_crypt',
    dangerTier: 2,
  },
  {
    id: 'tundra',
    minSx: 7,
    maxSx: 11,
    minTx: 280,
    maxTx: 440,
    label: 'Fiorde Glacial Safira',
    subtitle: 'Cristais de gelo, lâminas boreais e rampas de hyper-dash',
    color: '#7ce8ff',
    campaignBiome: 'frostglass',
    dangerTier: 2,
  },
  {
    id: 'jade_bamboo',
    minSx: 11,
    maxSx: 16,
    minTx: 440,
    maxTx: 640,
    label: 'Bosque de Bambu Jade',
    subtitle: 'Cachoeiras suspensas, pagodes aéreos e molas naturais',
    color: '#34d399',
    campaignBiome: 'jade_bamboo',
    dangerTier: 1,
  },
  {
    id: 'crimson_sakura',
    minSx: 16,
    maxSx: 22,
    minTx: 640,
    maxTx: 880,
    label: 'Santuário Sakura Carmesim',
    subtitle: 'Portais Torii, cerejeiras ancestrais e correntes de pétalas',
    color: '#f472b6',
    campaignBiome: 'crimson_sakura',
    dangerTier: 1,
  },
  {
    id: 'forest',
    minSx: 22,
    maxSx: 32,
    minTx: 880,
    maxTx: 1280,
    label: 'Vale de Aethelgard · Hub Central',
    subtitle: 'Coração celeste aberto em 4 direções com forjas, pilão e trilhas',
    color: '#4df0c0',
    campaignBiome: 'silver_ash',
    dangerTier: 1,
  },
  {
    id: 'desert',
    minSx: 32,
    maxSx: 36,
    minTx: 1280,
    maxTx: 1440,
    label: 'Miragem Solar & Zigurate',
    subtitle: 'Obeliscos solares, argolas de arpão e cofres escondidos',
    color: '#fbbf24',
    campaignBiome: 'solar_mirage',
    dangerTier: 2,
  },
  {
    id: 'jungle',
    minSx: 36,
    maxSx: 40,
    minTx: 1440,
    maxTx: 1600,
    label: 'Selva Bioluminescente',
    subtitle: 'Cogumelos elásticos, resin walls e túneis de micélio',
    color: '#2dd4bf',
    campaignBiome: 'bioluminescent',
    dangerTier: 2,
  },
  {
    id: 'clockwork_city',
    minSx: 40,
    maxSx: 45,
    minTx: 1600,
    maxTx: 1800,
    label: 'Torre do Relógio & Subcidade',
    subtitle: 'Esteiras rítmicas, blocos de pulso e engrenagens colossais',
    color: '#22d3ee',
    campaignBiome: 'clockwork_spire',
    dangerTier: 3,
  },
  {
    id: 'crimson_canyon',
    minSx: 45,
    maxSx: 49,
    minTx: 1800,
    maxTx: 1960,
    label: 'Desfiladeiro Carmesim',
    subtitle: 'Abismos rubros, canhões de impulso e veios de titânio',
    color: '#fb923c',
    campaignBiome: 'crimson_canyon',
    dangerTier: 3,
  },
  {
    id: 'twilight_garden',
    minSx: 49,
    maxSx: 52,
    minTx: 1960,
    maxTx: 2080,
    label: 'Jardim Crepuscular',
    subtitle: 'Blocos oníricos etéreos, portais espelho e prismas lunares',
    color: '#e879f9',
    campaignBiome: 'twilight_garden',
    dangerTier: 3,
  },
  {
    id: 'obsidian_temple',
    minSx: 52,
    maxSx: 55,
    minTx: 2080,
    maxTx: 2200,
    label: 'Templo de Obsidiana',
    subtitle: 'Monolitos vulcânicos, cristais duplos e desafios aéreos',
    color: '#a855f7',
    campaignBiome: 'obsidian_temple',
    dangerTier: 4,
  },
  {
    id: 'abyss_surface',
    minSx: 55,
    maxSx: 58,
    minTx: 2200,
    maxTx: 2320,
    label: 'Abismo do Eclipse Rubro',
    subtitle: 'Ventanias sombrias, orbes de estase e altares de chefes',
    color: '#f43f5e',
    campaignBiome: 'blood_eclipse',
    dangerTier: 4,
  },
  {
    id: 'ocean_east',
    minSx: 58,
    maxSx: 60,
    minTx: 2320,
    maxTx: 2400,
    label: 'Abismo de Corais Leste',
    subtitle: 'Recifes luminescentes, bolhas de transporte e santuário final',
    color: '#fb7185',
    campaignBiome: 'coral_abyss',
    dangerTier: 3,
  },
];

export interface SandboxBiomeInfo {
  id: SandboxBiomeId;
  stratum: 'sky' | 'overworld' | 'caverns' | 'underworld';
  label: string;
  subtitle: string;
  color: string;
  campaignBiome: AnyBiomeId;
  dangerTier: number;
}

export const SANDBOX_CAVERN_SY = 11;
export const SANDBOX_UNDERWORLD_SY = 18;

export function getSandboxSurfaceRegion(tx: number): SandboxRegionDef {
  const cx = Math.max(0, Math.min(SANDBOX_COLS - 1, tx));
  for (let i = 0; i < SANDBOX_SURFACE_REGIONS.length; i++) {
    const r = SANDBOX_SURFACE_REGIONS[i];
    if (cx >= r.minTx && cx < r.maxTx) return r;
  }
  return SANDBOX_SURFACE_REGIONS[SANDBOX_SURFACE_REGIONS.length - 1];
}

export function getSandboxSectorCoords(tx: number, ty: number): { sx: number; sy: number; idx: number } {
  const sx = Math.max(0, Math.min(SANDBOX_SECTOR_COLS - 1, Math.floor(tx / SANDBOX_SECTOR_W)));
  const sy = Math.max(0, Math.min(SANDBOX_SECTOR_ROWS - 1, Math.floor(ty / SANDBOX_SECTOR_H)));
  return { sx, sy, idx: sy * SANDBOX_SECTOR_COLS + sx };
}

export function getSandboxBiomeAt(tx: number, ty: number): SandboxBiomeInfo {
  // Biome bands were authored for a 2400-tile-wide world; scale so the bigger map keeps the same layout.
  const cx = Math.floor((Math.max(0, Math.min(SANDBOX_COLS - 1, Math.floor(tx))) * 2400) / SANDBOX_COLS);
  const cy = Math.max(0, Math.min(SANDBOX_ROWS - 1, Math.floor(ty)));
  const sy = Math.floor(cy / SANDBOX_SECTOR_H);

  // Stratum 1: Sky & Celestial Zenith (sy 0..4 => ty 0..114)
  if (sy <= 4) {
    if (cx < 760) {
      return {
        id: 'aurora_sky',
        stratum: 'sky',
        label: 'Zênite da Aurora Celeste',
        subtitle: 'Cimeiras boreais, nuvens elásticas e correntes ascendentes',
        color: '#7ce8ff',
        campaignBiome: 'aurora_zenith',
        dangerTier: 2,
      };
    }
    if (cx < 1640) {
      return {
        id: 'sky_islands',
        stratum: 'sky',
        label: 'Arquipélago Esmeralda Celeste',
        subtitle: 'Ilhas flutuantes, penas astrais e santuários suspensos',
        color: '#5eead4',
        campaignBiome: 'emerald_sky',
        dangerTier: 2,
      };
    }
    return {
      id: 'cloud_monastery',
      stratum: 'sky',
      label: 'Monastério das Nuvens',
      subtitle: 'Templos celestes conectados por sinos, argolas e nuvens',
      color: '#fde047',
      campaignBiome: 'cloud_monastery',
      dangerTier: 3,
    };
  }

  // Stratum 4: Deep Underworld & Magma Core (sy 16..19 => ty 368..459)
  if (sy >= SANDBOX_UNDERWORLD_SY) {
    if (cx < 800) {
      return {
        id: 'underworld',
        stratum: 'underworld',
        label: 'Margens do Estige Profundo',
        subtitle: 'Abismos ocidentais, águas espectrais e relíquias sombrias',
        color: '#2dd4bf',
        campaignBiome: 'styx_ferry',
        dangerTier: 4,
      };
    }
    if (cx < 1680) {
      return {
        id: 'magma_core',
        stratum: 'underworld',
        label: 'Núcleo de Magma & Caldeira',
        subtitle: 'Fornos abissais ricos em Adamantita, Éter e propulsores',
        color: '#ff5522',
        campaignBiome: 'magma_core',
        dangerTier: 5,
      };
    }
    return {
      id: 'pandemonium_citadel',
      stratum: 'underworld',
      label: 'Cidadela do Pandemônio',
      subtitle: 'Fortaleza escarlate final dos soberanos das cinzas',
      color: '#ff2e63',
      campaignBiome: 'pandemonium_citadel',
      dangerTier: 5,
    };
  }

  // Stratum 3: Subterranean Geodes & Ruins (sy 11..15 => ty 253..367)
  if (sy >= SANDBOX_CAVERN_SY) {
    if (cx < 600) {
      return {
        id: 'sunken_cathedral',
        stratum: 'caverns',
        label: 'Catedral Submersa',
        subtitle: 'Galerias inundadas, bolhas de impulso e vitrais antigos',
        color: '#38bdf8',
        campaignBiome: 'sunken_cathedral',
        dangerTier: 3,
      };
    }
    if (cx < 1320) {
      return {
        id: 'caverns',
        stratum: 'caverns',
        label: 'Geodos Prismáticos Profundos',
        subtitle: 'Santuários de Mithril, Ouro, Blocos Oníricos e lagos',
        color: '#67e8f9',
        campaignBiome: 'prism_sanctum',
        dangerTier: 3,
      };
    }
    if (cx < 1900) {
      return {
        id: 'alchemical_caves',
        stratum: 'caverns',
        label: 'Laboratórios Alquímicos',
        subtitle: 'Câmaras de esporos, esteiras rítmicas e veios de Titânio',
        color: '#34d399',
        campaignBiome: 'alchemical_labs',
        dangerTier: 4,
      };
    }
    return {
      id: 'bone_catacombs',
      stratum: 'caverns',
      label: 'Catacumbas do Ossuário',
      subtitle: 'Criptas de marfim antigo, armadilhas e fragmentos de Éter',
      color: '#e2e8f0',
      campaignBiome: 'bone_ossuary',
      dangerTier: 4,
    };
  }

  // Stratum 2: Open Overworld Horizon (sy 5..10 => ty 115..252)
  const surf = getSandboxSurfaceRegion(cx);
  return {
    id: surf.id,
    stratum: 'overworld',
    label: surf.label,
    subtitle: surf.subtitle,
    color: surf.color,
    campaignBiome: surf.campaignBiome,
    dangerTier: surf.dangerTier,
  };
}

export const SANDBOX_BIOMES = SANDBOX_SURFACE_REGIONS;

export function getSandboxSectorBiomeInfo(sx: number, sy: number): SandboxBiomeInfo {
  const tx = Math.max(0, Math.min(SANDBOX_COLS - 1, Math.floor(sx) * SANDBOX_SECTOR_W + Math.floor(SANDBOX_SECTOR_W / 2)));
  const ty = Math.max(0, Math.min(SANDBOX_ROWS - 1, Math.floor(sy) * SANDBOX_SECTOR_H + Math.floor(SANDBOX_SECTOR_H / 2)));
  return getSandboxBiomeAt(tx, ty);
}

export function getSandboxCampaignBiomeAt(tx: number, ty: number): AnyBiomeId {
  return getSandboxBiomeAt(tx, ty).campaignBiome;
}

/** Nominal platform floor height inside a horizon chamber (for hub/landmarks alignment). */
export function getSandboxSurfaceHeightAt(tx: number, seed = 202504): number {
  const hubMin = 1360;
  const hubMax = 1560;
  if (tx >= hubMin && tx <= hubMax) {
    // Center Horizon Chamber (sy=8 => ty 184..206): ground sits cleanly at ty=201
    return 201;
  }
  const wave =
    Math.sin(tx * 0.025 + seed * 0.001) * 4 +
    Math.cos(tx * 0.06) * 2;
  return Math.max(191, Math.min(203, Math.round(199 + wave)));
}

export function markSandboxSectorAt(explored: Uint8Array, tx: number, ty: number): boolean {
  const { sx, sy, idx } = getSandboxSectorCoords(tx, ty);
  let newlyMarked = false;
  // Discover current sector and direct cardinal neighbors when near edges or entering
  if (explored[idx] === 0) {
    explored[idx] = 1;
    newlyMarked = true;
  }
  const lx = tx - sx * SANDBOX_SECTOR_W;
  const ly = ty - sy * SANDBOX_SECTOR_H;
  const neighbors: [number, number][] = [];
  if (lx <= 4) neighbors.push([-1, 0]);
  if (lx >= SANDBOX_SECTOR_W - 5) neighbors.push([1, 0]);
  if (ly <= 3) neighbors.push([0, -1]);
  if (ly >= SANDBOX_SECTOR_H - 4) neighbors.push([0, 1]);
  for (const [dx, dy] of neighbors) {
    const nx = sx + dx;
    const ny = sy + dy;
    if (nx < 0 || nx >= SANDBOX_SECTOR_COLS || ny < 0 || ny >= SANDBOX_SECTOR_ROWS) continue;
    const nIdx = ny * SANDBOX_SECTOR_COLS + nx;
    if (explored[nIdx] === 0) {
      explored[nIdx] = 1;
      newlyMarked = true;
    }
  }
  return newlyMarked;
}

export function getSandboxExplorationPct(explored: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < explored.length; i++) {
    if (explored[i] > 0) count++;
  }
  return Math.round((count / Math.max(1, explored.length)) * 100);
}
