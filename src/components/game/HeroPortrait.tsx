// @ts-nocheck -- imported game code, written for a looser TS config
import React, { useEffect, useRef } from 'react';
import { getHeroDef, getHeroSkinDef, HeroId } from '../../game/heroes';
import {
  drawHeroStudioPortraitBust,
  drawHeroStudioSprite,
} from '../../game/heroArtRenderer';
import {
  drawHeroEvolutionBackLayers,
  drawHeroEvolutionFrontLayers,
} from '../../game/heroEvolutionRenderer';
import { colorWithAlpha } from '../../game/visualFx';

interface HeroPortraitProps {
  heroId: HeroId;
  skinId?: string;
  size?: number;
  animate?: boolean;
  evolutionTier?: number;
  className?: string;
}

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  heroId,
  skinId = 'default',
  size = 64,
  animate = false,
  evolutionTier = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let lastDraw = 0;
    const render = (now = 0) => {
      if (animate && lastDraw !== 0 && now - lastDraw < 70) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      t += 0.08;
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const W = c.width;
        const H = c.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawHeroStudioPortraitBust(ctx, heroId, skinId, W, H, animate ? t : 0.35);

        const auraColor = evolutionTier >= 3 ? '#ffe066' : skin.badgeColor;
        // Crisp studio frame bevel & corner filigree
        ctx.strokeStyle = colorWithAlpha(auraColor, 0.72);
        ctx.lineWidth = 3;
        ctx.strokeRect(2.5, 2.5, W - 5, H - 5);

        ctx.fillStyle = colorWithAlpha(auraColor, 0.92);
        ctx.fillRect(5, 5, 10, 2.5);
        ctx.fillRect(5, 5, 2.5, 10);
        ctx.fillRect(W - 15, 5, 10, 2.5);
        ctx.fillRect(W - 7.5, 5, 2.5, 10);

        if (evolutionTier >= 1) {
          ctx.fillStyle = '#090712';
          ctx.fillRect(W * 0.5 - 16, 4, 32, 9);
          ctx.fillStyle = auraColor;
          ctx.fillRect(W * 0.5 - 14, 5.5, 28, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(W * 0.5 - 6, 6.5, 12, 2.5);
        }
      }
      if (animate) {
        raf = requestAnimationFrame(render);
      }
    };
    render();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroId, skinId, animate, evolutionTier, hero.modifiers.baseDashes, skin]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      style={{ width: size, height: size }}
      className={`block border-2 border-[#07050d] bg-[#080512] ${className}`}
    />
  );
};

export const HeroFullSpriteCanvas: React.FC<{
  heroId: HeroId;
  skinId?: string;
  evolutionTier?: number;
  size?: number;
}> = ({ heroId, skinId = 'default', evolutionTier = 0, size = 128 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    let lastDraw = 0;
    const render = (now = 0) => {
      if (lastDraw !== 0 && now - lastDraw < 75) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      t += 0.08;
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const V = 48;
        const scale = c.width / V;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, V, V);

        const evoColor =
          evolutionTier >= 3
            ? '#ffe066'
            : evolutionTier >= 2
              ? hero.accentColor
              : skin.badgeColor;

        // Atmospheric studio aura halo
        const pulse = 0.85 + 0.15 * Math.sin(t * 2);
        const aura = ctx.createRadialGradient(24, 24, 2, 24, 24, 22);
        aura.addColorStop(0, colorWithAlpha(evoColor, evolutionTier >= 1 ? 0.48 : 0.36));
        aura.addColorStop(0.58, colorWithAlpha(evoColor, 0.16));
        aura.addColorStop(1, 'rgba(7,5,13,0)');
        ctx.globalAlpha = pulse;
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, V, V);
        ctx.globalAlpha = 1;

        // Sculpted rune pedestal
        ctx.fillStyle = '#07050d';
        ctx.beginPath();
        ctx.ellipse(24, 42.5, 13.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const pedGrad = ctx.createLinearGradient(11, 39, 37, 45);
        pedGrad.addColorStop(0, '#2b204d');
        pedGrad.addColorStop(0.5, '#191130');
        pedGrad.addColorStop(1, '#100a22');
        ctx.fillStyle = pedGrad;
        ctx.beginPath();
        ctx.ellipse(24, 41.5, 12.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colorWithAlpha(evoColor, 0.78);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(24, 41.4, 11.2, 2.0, 0, 0, Math.PI * 2);
        ctx.stroke();

        const bob = Math.sin(t * 2.2) * 0.7;
        const feetY = 41.5 + bob;
        const heroWorldH = 26;
        const headTopY = feetY - heroWorldH;

        drawHeroEvolutionBackLayers(ctx, {
          heroId,
          tier: evolutionTier,
          time: t,
          cx: 24,
          cy: feetY - heroWorldH * 0.45,
          headTopY,
          feetY,
          facing: 1,
          scale: 1.12,
        });

        drawHeroStudioSprite(
          ctx,
          heroId,
          skinId,
          'idle',
          Math.floor(t * 2) % 4,
          hero.modifiers.baseDashes,
          false,
          false,
          24,
          feetY,
          false,
          1,
          1,
          heroWorldH
        );

        drawHeroEvolutionFrontLayers(ctx, {
          heroId,
          tier: evolutionTier,
          time: t,
          cx: 24,
          cy: feetY - heroWorldH * 0.45,
          headTopY,
          feetY,
          facing: 1,
          scale: 1.12,
        });
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroId, skinId, evolutionTier, hero.modifiers.baseDashes, hero.accentColor, skin]);

  return (
    <canvas
      ref={canvasRef}
      width={192}
      height={192}
      style={{ width: size, height: size }}
      className="block"
    />
  );
};
