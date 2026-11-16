// @ts-nocheck -- UI module
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../../game/engine';
import {
  SANDBOX_COLS,
  SANDBOX_ROWS,
  SANDBOX_SECTOR_COLS,
  SANDBOX_SECTOR_H,
  SANDBOX_SECTOR_ROWS,
  SANDBOX_SECTOR_W,
  SANDBOX_SURFACE_REGIONS,
  getSandboxBiomeAt,
} from '../../game/sandboxBiomes';
import { SANDBOX_TILE_META, SB_TILE } from '../../game/sandboxWorld';
import { HudSnapshot, TILE_SIZE } from '../../game/types';
import { PixelButton, PixelWindow } from './PixelUi';

interface SandboxWorldMapModalProps {
  engine: GameEngine;
  hud: HudSnapshot;
  onTeleportPylon: (tx: number, ty: number) => void;
  onClose: () => void;
}

const MAP_W = 600; // 2400 / 4 = 600 exact 1:4 ratio
const MAP_H = 115; // 460 / 4 = 115 exact 1:4 ratio

export const SandboxWorldMapModal: React.FC<SandboxWorldMapModalProps> = ({
  engine,
  hud,
  onTeleportPylon,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPylon, setHoveredPylon] = useState<{
    tx: number;
    ty: number;
    label: string;
    color: string;
  } | null>(null);
  const [mapMode, setMapMode] = useState<'warp' | 'pin'>('warp');
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const c = canvasRef.current;
    const world = engine.sandboxWorld;
    if (!c || !world) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    // Sky-to-abyss gradient background matching 4 Celeste strata
    const bg = ctx.createLinearGradient(0, 0, 0, MAP_H);
    bg.addColorStop(0, '#0c1836');
    bg.addColorStop(0.25, '#13244a');
    bg.addColorStop(0.27, '#16132b');
    bg.addColorStop(0.55, '#120e21');
    bg.addColorStop(0.8, '#1a0a16');
    bg.addColorStop(1, '#2b080d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Downsample 2400x460 tiles at exact 4x4 blocks -> 600x115
    const img = ctx.getImageData(0, 0, MAP_W, MAP_H);
    const data = img.data;
    const hexCache = new Map<number, [number, number, number]>();
    const getRgb = (tile: number): [number, number, number] => {
      let c3 = hexCache.get(tile);
      if (c3) return c3;
      const hex = SANDBOX_TILE_META[tile]?.color ?? '#64748b';
      const clean = hex.replace('#', '');
      const num = parseInt(clean.length >= 6 ? clean.slice(0, 6) : '64748b', 16);
      c3 = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      hexCache.set(tile, c3);
      return c3;
    };

    for (let my = 0; my < MAP_H; my++) {
      const ty = my * 4 + 2;
      const sy = Math.min(SANDBOX_SECTOR_ROWS - 1, Math.floor(ty / SANDBOX_SECTOR_H));
      for (let mx = 0; mx < MAP_W; mx++) {
        const tx = mx * 4 + 2;
        const sx = Math.min(SANDBOX_SECTOR_COLS - 1, Math.floor(tx / SANDBOX_SECTOR_W));
        const explored = world.exploredSectors[sy * SANDBOX_SECTOR_COLS + sx] > 0;

        let picked = world.tiles[ty * world.cols + tx];
        if (picked === SB_TILE.AIR) {
          const t2 = ty >= 1 ? world.tiles[(ty - 1) * world.cols + tx] : SB_TILE.AIR;
          const t3 = tx + 1 < world.cols ? world.tiles[ty * world.cols + (tx + 1)] : SB_TILE.AIR;
          picked = t2 !== SB_TILE.AIR ? t2 : t3;
        }
        if (picked === SB_TILE.AIR) continue;

        const [r, g, b] = getRgb(picked);
        const pIdx = (my * MAP_W + mx) * 4;
        const dim = explored ? 1 : 0.34;
        data[pIdx] = Math.round(r * dim);
        data[pIdx + 1] = Math.round(g * dim);
        data[pIdx + 2] = Math.round(b * dim);
        data[pIdx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Subtle Fog-of-War overlay on unexplored 40x23 chambers (10x5.75 map px)
    const cw = SANDBOX_SECTOR_W / 4; // 10
    const ch = SANDBOX_SECTOR_H / 4; // 5.75
    for (let sy = 0; sy < SANDBOX_SECTOR_ROWS; sy++) {
      for (let sx = 0; sx < SANDBOX_SECTOR_COLS; sx++) {
        if (world.exploredSectors[sy * SANDBOX_SECTOR_COLS + sx] === 0) {
          ctx.fillStyle = 'rgba(4, 3, 9, 0.56)';
          ctx.fillRect(sx * cw, sy * ch, cw, ch + 0.3);
        }
      }
    }

    // Stratum divider lines (Sky <= 4, Overworld 5..10, Caverns 11..15, Underworld 16..19)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    for (const syBoundary of [5, 11, 16]) {
      const yLine = Math.round(syBoundary * ch) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yLine);
      ctx.lineTo(MAP_W, yLine);
      ctx.stroke();
    }

    // Surface region divider lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    const overworldTop = 5 * ch;
    const overworldBottom = 11 * ch;
    for (const reg of SANDBOX_SURFACE_REGIONS) {
      const rx = Math.round(reg.minTx / 4) + 0.5;
      if (rx > 1) {
        ctx.beginPath();
        ctx.moveTo(rx, overworldTop);
        ctx.lineTo(rx, overworldBottom);
        ctx.stroke();
      }
    }

    // Validated Houses
    for (const h of world.houses) {
      ctx.fillStyle = '#4df0c0';
      ctx.fillRect(Math.round(h.centerTx / 4) - 2, Math.round(h.centerTy / 4) - 2, 4, 4);
    }

    // Teleport Pylons
    for (const py of world.pylons) {
      const px = Math.round(py.tx / 4);
      const ppy = Math.round(py.ty / 4);
      const unlocked = world.unlockedPylons.has(`${py.tx},${py.ty}`);
      ctx.fillStyle = '#07050d';
      ctx.fillRect(px - 3, ppy - 3, 6, 6);
      ctx.fillStyle = unlocked ? py.color : '#64748b';
      ctx.fillRect(px - 2, ppy - 2, 4, 4);
    }

    // Custom World Pins
    for (const pin of world.worldPins ?? []) {
      const px = Math.round(pin.tx / 4);
      const py = Math.round(pin.ty / 4);
      ctx.fillStyle = '#07050d';
      ctx.fillRect(px - 3, py - 4, 6, 6);
      ctx.fillStyle = pin.color || '#ffd27d';
      ctx.fillRect(px - 2, py - 3, 4, 4);
    }

    // Active Bosses
    for (const foe of world.enemies) {
      if (foe.isBoss && foe.hp > 0) {
        const bx = Math.round(foe.x / TILE_SIZE / 4);
        const by = Math.round(foe.y / TILE_SIZE / 4);
        ctx.fillStyle = '#ff2e63';
        ctx.fillRect(bx - 3, by - 3, 6, 6);
      }
    }

    // Player Marker
    const plX = Math.round(hud.sandboxPlayerTx / 4);
    const plY = Math.round(hud.sandboxPlayerTy / 4);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plX - 4, plY - 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(plX - 2, plY - 2, 4, 4);
  }, [
    engine.sandboxWorld,
    hud.sandboxPlayerTx,
    hud.sandboxPlayerTy,
    hud.sandboxExplorationPct,
    hud.sandboxPins.length,
    renderTick,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickTx = Math.max(2, Math.min(SANDBOX_COLS - 3, Math.round(((e.clientX - rect.left) / rect.width) * SANDBOX_COLS)));
    const clickTy = Math.max(2, Math.min(SANDBOX_ROWS - 3, Math.round(((e.clientY - rect.top) / rect.height) * SANDBOX_ROWS)));

    if (mapMode === 'pin') {
      const biome = getSandboxBiomeAt(clickTx, clickTy);
      engine.addSandboxPin(clickTx, clickTy, biome.label, biome.color);
      setRenderTick((t) => t + 1);
      return;
    }

    let best: { tx: number; ty: number; label: string; color: string } | null = null;
    let bestD = 120;
    for (const py of hud.sandboxPylons) {
      const d = Math.hypot(py.tx - clickTx, (py.ty - clickTy) * 2.2);
      if (d < bestD) {
        bestD = d;
        best = py;
      }
    }
    if (best) {
      onTeleportPylon(best.tx, best.ty);
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverTx = ((e.clientX - rect.left) / rect.width) * SANDBOX_COLS;
    const hoverTy = ((e.clientY - rect.top) / rect.height) * SANDBOX_ROWS;
    let best: { tx: number; ty: number; label: string; color: string } | null = null;
    let bestD = 100;
    for (const py of hud.sandboxPylons) {
      const d = Math.hypot(py.tx - hoverTx, (py.ty - hoverTy) * 2.2);
      if (d < bestD) {
        bestD = d;
        best = py;
      }
    }
    setHoveredPylon(best);
  };

  const unlockedSet = engine.sandboxWorld?.unlockedPylons ?? new Set<string>();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atlas do Mundo Aberto Celeste"
      data-testid="sandbox-world-map-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#05040a]/90 p-3 sm:p-4 pointer-events-auto"
    >
      <PixelWindow
        title="Atlas do Mundo Aberto Celeste"
        subtitle={`${SANDBOX_COLS}×${SANDBOX_ROWS} blocos · ${(SANDBOX_SECTOR_COLS * SANDBOX_SECTOR_ROWS).toLocaleString('pt-BR')} Câmaras · Biomas ${hud.sandboxDiscoveredBiomesCount}/24 · ${hud.sandboxExplorationPct}% Explorado`}
        accentColor="#4df0c0"
        onClose={onClose}
        closeLabel="Fechar Atlas Mundial"
        maxWidthClass="max-w-5xl"
      >
        <div className="flex flex-col gap-2.5">
          {/* Top Metrics & Map Mode Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#07050d] bg-[#0b0816] px-3 py-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-pixel text-[#4df0c0]">
                Bioma: <strong style={{ color: hud.sandboxActiveBiomeColor || '#f5efe6' }}>{hud.sandboxBiomeName}</strong>
              </span>
              <span className="font-mono-num text-[#52e5ff]">
                Pos: ({hud.sandboxPlayerTx}, {hud.sandboxPlayerTy})
              </span>
              <span className="font-mono-num text-[#ffe066]">
                Biomas: {hud.sandboxDiscoveredBiomesCount}/24
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PixelButton
                type="button"
                variant={mapMode === 'warp' ? 'cyan' : 'slate'}
                onClick={() => setMapMode('warp')}
                className="!px-2 !py-0.5 text-[10px]"
              >
                Modo: Teleporte
              </PixelButton>
              <PixelButton
                type="button"
                variant={mapMode === 'pin' ? 'gold' : 'slate'}
                data-testid="map-mode-pin-btn"
                onClick={() => setMapMode('pin')}
                className="!px-2 !py-0.5 text-[10px]"
              >
                Modo: Marcar Pin
              </PixelButton>
            </div>
          </div>

          {/* 600x115 World Canvas + Surface Region Headers */}
          <div className="relative overflow-hidden border-2 border-[#41385e] bg-[#07050e] p-2">
            <div className="mb-1 flex text-[8px] font-pixel text-[#b8afc9]">
              {SANDBOX_SURFACE_REGIONS.map((reg) => {
                const widthPct = ((reg.maxTx - reg.minTx) / SANDBOX_COLS) * 100;
                return (
                  <div
                    key={reg.id}
                    style={{ width: `${widthPct}%`, color: reg.color }}
                    title={reg.label}
                    className="truncate border-l border-[#29223d] pl-1"
                  >
                    {reg.label.split(' ')[0]}
                  </div>
                );
              })}
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={MAP_W}
                height={MAP_H}
                data-testid="sandbox-world-map-canvas"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMove}
                onMouseLeave={() => setHoveredPylon(null)}
                style={{ imageRendering: 'pixelated' }}
                className="w-full cursor-crosshair border-2 border-[#07050d] bg-[#05040a]"
              />
              {/* Compact 4-strata vertical legend */}
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[9px] font-pixel text-[#b8afc9]">
                <span>↑ Céu &amp; Monastérios · ↔ Superfície (14 Biomas) · ↓ Cavernas &amp; Geodos · ↓↓ Submundo</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <i className="inline-block h-2 w-2 border border-[#ffe066] bg-white" /> Você
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="inline-block h-2 w-2 bg-[#52e5ff]" /> Pilão
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="inline-block h-2 w-2 bg-[#ffd27d]" /> Pins ({hud.sandboxPins.length})
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="inline-block h-2 w-2 bg-[#4df0c0]" /> Casas ({hud.sandboxHousesCount})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="font-body-pixel text-[#c7bddb]">
                {mapMode === 'pin'
                  ? 'Clique em qualquer ponto do mapa para adicionar um Pin persistente.'
                  : hoveredPylon
                    ? `Clique para teleportar até: ${hoveredPylon.label} (${hoveredPylon.tx}, ${hoveredPylon.ty})`
                    : 'Clique perto de um Pilão colorido no mapa (ou nos cartões abaixo) para viajar instantaneamente.'}
              </span>
              <span className="font-mono-num text-[#ffd27d]">
                {unlockedSet.size}/{hud.sandboxPylons.length} Pilões Desbloqueados
              </span>
            </div>
          </div>

          {/* Custom World Pins List (if any) */}
          {hud.sandboxPins.length > 0 && (
            <div className="border border-[#382d52] bg-[#0c0918] px-2.5 py-1.5">
              <div className="mb-1 font-pixel text-[10px] uppercase tracking-wider text-[#ffd27d]">
                Pins Marcados ({hud.sandboxPins.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hud.sandboxPins.map((pin) => (
                  <div
                    key={pin.id}
                    style={{ borderColor: pin.color || '#ffd27d' }}
                    className="flex items-center gap-1.5 border bg-[#150f26] px-2 py-0.5 text-[10px]"
                  >
                    <span style={{ color: pin.color || '#ffd27d' }} className="font-pixel font-bold">
                      ⚑ {pin.label}
                    </span>
                    <span className="font-mono-num text-[9px] text-[#b8afc9]">
                      ({pin.tx},{pin.ty})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        engine.removeSandboxPin(pin.id);
                        setRenderTick((t) => t + 1);
                      }}
                      title="Remover Pin"
                      className="ml-0.5 font-pixel text-[10px] text-[#ff708d] hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clickable Biome Pylon Teleport Grid */}
          <div>
            <div className="mb-1.5 font-pixel text-[11px] uppercase tracking-wider text-[#ffd27d]">
              Rede de Teleporte Interligada (Céu · Superfície · Cavernas · Submundo)
            </div>
            <div className="grid max-h-[180px] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-5 pixel-scroll">
              {hud.sandboxPylons.map((py) => {
                const unlocked = unlockedSet.has(`${py.tx},${py.ty}`);
                return (
                  <button
                    key={`${py.tx}_${py.ty}`}
                    type="button"
                    data-testid={`map-pylon-${py.tx}-${py.ty}`}
                    onClick={() => onTeleportPylon(py.tx, py.ty)}
                    style={{ borderColor: unlocked ? py.color : '#332b4d' }}
                    className={`flex flex-col justify-between border-2 p-2 text-left transition-transform hover:-translate-y-0.5 ${
                      unlocked ? 'bg-[#120d21] hover:bg-[#1e1638]' : 'bg-[#0b0814] opacity-85 hover:bg-[#161129]'
                    }`}
                  >
                    <span
                      style={{ color: unlocked ? py.color : '#b8afc9' }}
                      className="truncate font-pixel text-[10px] font-bold"
                    >
                      {unlocked ? '✦' : '◇'} {py.label}
                    </span>
                    <span className="mt-1 font-mono-num text-[9px] text-[#b8afc9]">
                      X:{py.tx} · Y:{py.ty}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <PixelButton type="button" variant="slate" onClick={onClose} className="px-4 py-1.5 text-xs">
              Voltar ao Mundo [M / Esc]
            </PixelButton>
          </div>
        </div>
      </PixelWindow>
    </div>
  );
};
