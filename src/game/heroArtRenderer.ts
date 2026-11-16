// @ts-nocheck -- imported game code
// Studio-Grade 4x Supersampled Hero Character & Portrait Art Renderer
// Elevates all 48 heroes (36 classic + 12 new) with distinct silhouettes, bespoke weapons,
// layered armor/robes, expressive anime/Celeste eyes, specular rim-lighting, and flowing capes.
import { getHeroDef, getHeroSkinDef, type HeroId } from './heroes';
import { buildHeroPalette, type HeroAnimKey } from './sprites';
import { colorWithAlpha } from './visualFx';

export type SilhouetteArchetype =
  | 'ranger'
  | 'knight'
  | 'mage'
  | 'assassin'
  | 'seraph'
  | 'samurai'
  | 'valkyrie'
  | 'draconic'
  | 'kitsune'
  | 'mecha'
  | 'witch'
  | 'monk'
  | 'alchemist'
  | 'royal'
  | 'reaper'
  | 'druid';

export type HairStyleKind =
  | 'flowing'
  | 'ponytail'
  | 'twintails'
  | 'spiky'
  | 'bob'
  | 'long_noble'
  | 'braid'
  | 'hooded'
  | 'wild_mane';

export type HeadgearKind =
  | 'none'
  | 'crown'
  | 'halo'
  | 'horns'
  | 'kitsune_ears'
  | 'visor'
  | 'witch_hat'
  | 'valkyrie_wings'
  | 'kabuto'
  | 'plague_mask'
  | 'flower_crown'
  | 'antlers'
  | 'goggles'
  | 'jester_cap'
  | 'tiara';

export type WeaponKind =
  | 'blade'
  | 'katana'
  | 'staff'
  | 'greatsword'
  | 'bow'
  | 'scythe'
  | 'spear'
  | 'twin_daggers'
  | 'hammer'
  | 'astrolabe'
  | 'grimoire'
  | 'jetpack'
  | 'halberd'
  | 'scepter'
  | 'shield'
  | 'orb';

export type CloakKind =
  | 'flowing_cape'
  | 'scarf'
  | 'ribbons'
  | 'seraph_wings'
  | 'dragon_wings'
  | 'butterfly_wings'
  | 'mecha_thrusters'
  | 'tattered_cloak'
  | 'fur_mantle'
  | 'star_mantle';

export interface HeroVisualProfile {
  archetype: SilhouetteArchetype;
  hair: HairStyleKind;
  headgear: HeadgearKind;
  weapon: WeaponKind;
  cloak: CloakKind;
  emblem: 'star' | 'crest' | 'gem' | 'moon' | 'flame' | 'bolt' | 'leaf';
}

export const HERO_VISUAL_PROFILES: Record<HeroId, HeroVisualProfile> = {
  lyra: { archetype: 'ranger', hair: 'flowing', headgear: 'none', weapon: 'blade', cloak: 'scarf', emblem: 'star' },
  zephyr: { archetype: 'assassin', hair: 'spiky', headgear: 'goggles', weapon: 'twin_daggers', cloak: 'scarf', emblem: 'bolt' },
  nyx: { archetype: 'assassin', hair: 'bob', headgear: 'hooded' as unknown as HeadgearKind, weapon: 'twin_daggers', cloak: 'tattered_cloak', emblem: 'moon' },
  ignis: { archetype: 'knight', hair: 'spiky', headgear: 'horns', weapon: 'greatsword', cloak: 'tattered_cloak', emblem: 'flame' },
  seraphina: { archetype: 'seraph', hair: 'long_noble', headgear: 'halo', weapon: 'spear', cloak: 'seraph_wings', emblem: 'star' },
  volt: { archetype: 'mecha', hair: 'spiky', headgear: 'visor', weapon: 'blade', cloak: 'scarf', emblem: 'bolt' },
  umbra: { archetype: 'witch', hair: 'long_noble', headgear: 'tiara', weapon: 'orb', cloak: 'star_mantle', emblem: 'moon' },
  aegis: { archetype: 'knight', hair: 'bob', headgear: 'valkyrie_wings', weapon: 'shield', cloak: 'flowing_cape', emblem: 'crest' },
  kitsune: { archetype: 'kitsune', hair: 'ponytail', headgear: 'kitsune_ears', weapon: 'staff', cloak: 'ribbons', emblem: 'flame' },
  chronos_mage: { archetype: 'mage', hair: 'flowing', headgear: 'tiara', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'gem' },
  tidal: { archetype: 'druid', hair: 'flowing', headgear: 'tiara', weapon: 'spear', cloak: 'ribbons', emblem: 'gem' },
  solaris: { archetype: 'royal', hair: 'long_noble', headgear: 'crown', weapon: 'scepter', cloak: 'flowing_cape', emblem: 'star' },
  valkyrie: { archetype: 'valkyrie', hair: 'ponytail', headgear: 'valkyrie_wings', weapon: 'spear', cloak: 'seraph_wings', emblem: 'crest' },
  ronin: { archetype: 'samurai', hair: 'ponytail', headgear: 'kabuto', weapon: 'katana', cloak: 'scarf', emblem: 'flame' },
  draco: { archetype: 'draconic', hair: 'wild_mane', headgear: 'horns', weapon: 'greatsword', cloak: 'dragon_wings', emblem: 'flame' },
  nebula: { archetype: 'mage', hair: 'twintails', headgear: 'halo', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'star' },
  druid: { archetype: 'druid', hair: 'braid', headgear: 'antlers', weapon: 'staff', cloak: 'fur_mantle', emblem: 'leaf' },
  golem_knight: { archetype: 'knight', hair: 'bob', headgear: 'visor', weapon: 'hammer', cloak: 'fur_mantle', emblem: 'crest' },
  jester: { archetype: 'assassin', hair: 'twintails', headgear: 'jester_cap', weapon: 'twin_daggers', cloak: 'ribbons', emblem: 'gem' },
  siren: { archetype: 'seraph', hair: 'long_noble', headgear: 'tiara', weapon: 'scepter', cloak: 'ribbons', emblem: 'moon' },
  reaper: { archetype: 'reaper', hair: 'hooded', headgear: 'none', weapon: 'scythe', cloak: 'tattered_cloak', emblem: 'moon' },
  paladin: { archetype: 'knight', hair: 'flowing', headgear: 'halo', weapon: 'shield', cloak: 'flowing_cape', emblem: 'crest' },
  alchemist_hero: { archetype: 'alchemist', hair: 'bob', headgear: 'goggles', weapon: 'orb', cloak: 'scarf', emblem: 'gem' },
  phantom_thief: { archetype: 'assassin', hair: 'spiky', headgear: 'visor', weapon: 'blade', cloak: 'flowing_cape', emblem: 'moon' },
  sphinx_guard: { archetype: 'royal', hair: 'braid', headgear: 'crown', weapon: 'halberd', cloak: 'ribbons', emblem: 'star' },
  cryo_queen: { archetype: 'royal', hair: 'long_noble', headgear: 'crown', weapon: 'scepter', cloak: 'star_mantle', emblem: 'gem' },
  thunder_monk: { archetype: 'monk', hair: 'spiky', headgear: 'none', weapon: 'orb', cloak: 'ribbons', emblem: 'bolt' },
  star_dancer: { archetype: 'seraph', hair: 'twintails', headgear: 'tiara', weapon: 'scepter', cloak: 'ribbons', emblem: 'star' },
  mech_pilot: { archetype: 'mecha', hair: 'ponytail', headgear: 'visor', weapon: 'jetpack', cloak: 'mecha_thrusters', emblem: 'bolt' },
  blood_hunter: { archetype: 'reaper', hair: 'wild_mane', headgear: 'none', weapon: 'scythe', cloak: 'tattered_cloak', emblem: 'flame' },
  wind_archer: { archetype: 'ranger', hair: 'ponytail', headgear: 'none', weapon: 'bow', cloak: 'scarf', emblem: 'leaf' },
  void_walker: { archetype: 'reaper', hair: 'wild_mane', headgear: 'horns', weapon: 'blade', cloak: 'star_mantle', emblem: 'moon' },
  sun_priest: { archetype: 'mage', hair: 'long_noble', headgear: 'halo', weapon: 'staff', cloak: 'flowing_cape', emblem: 'star' },
  plague_doc: { archetype: 'alchemist', hair: 'hooded', headgear: 'plague_mask', weapon: 'staff', cloak: 'tattered_cloak', emblem: 'gem' },
  crystal_mage: { archetype: 'mage', hair: 'long_noble', headgear: 'tiara', weapon: 'staff', cloak: 'star_mantle', emblem: 'gem' },
  storm_king: { archetype: 'royal', hair: 'wild_mane', headgear: 'crown', weapon: 'halberd', cloak: 'seraph_wings', emblem: 'bolt' },
  celestia: { archetype: 'mage', hair: 'long_noble', headgear: 'tiara', weapon: 'astrolabe', cloak: 'star_mantle', emblem: 'star' },
  kurogane: { archetype: 'samurai', hair: 'ponytail', headgear: 'kabuto', weapon: 'katana', cloak: 'scarf', emblem: 'flame' },
  sylph: { archetype: 'seraph', hair: 'flowing', headgear: 'flower_crown', weapon: 'bow', cloak: 'butterfly_wings', emblem: 'leaf' },
  morrigan: { archetype: 'witch', hair: 'flowing', headgear: 'witch_hat', weapon: 'grimoire', cloak: 'tattered_cloak', emblem: 'moon' },
  boreas: { archetype: 'knight', hair: 'wild_mane', headgear: 'horns', weapon: 'halberd', cloak: 'fur_mantle', emblem: 'gem' },
  aurelia: { archetype: 'valkyrie', hair: 'flowing', headgear: 'valkyrie_wings', weapon: 'spear', cloak: 'seraph_wings', emblem: 'star' },
  kestrel: { archetype: 'mecha', hair: 'spiky', headgear: 'goggles', weapon: 'jetpack', cloak: 'mecha_thrusters', emblem: 'bolt' },
  vesperis: { archetype: 'kitsune', hair: 'ponytail', headgear: 'kitsune_ears', weapon: 'scythe', cloak: 'ribbons', emblem: 'moon' },
  flora: { archetype: 'druid', hair: 'braid', headgear: 'flower_crown', weapon: 'staff', cloak: 'ribbons', emblem: 'leaf' },
  oberon: { archetype: 'royal', hair: 'flowing', headgear: 'antlers', weapon: 'scepter', cloak: 'butterfly_wings', emblem: 'leaf' },
  emberlyn: { archetype: 'alchemist', hair: 'ponytail', headgear: 'goggles', weapon: 'hammer', cloak: 'fur_mantle', emblem: 'flame' },
  aetherion: { archetype: 'seraph', hair: 'wild_mane', headgear: 'crown', weapon: 'greatsword', cloak: 'seraph_wings', emblem: 'star' },
};

const STUDIO_BAKE_CACHE = new Map<string, HTMLCanvasElement>();
const BAKE_W = 96;
const BAKE_H = 108;

function resolveHeadgear(heroId: HeroId, skinHeadgear?: string): HeadgearKind {
  const base = HERO_VISUAL_PROFILES[heroId]?.headgear ?? 'none';
  if (skinHeadgear && skinHeadgear !== 'none') {
    if (skinHeadgear === 'crown') return 'crown';
    if (skinHeadgear === 'horns') return 'horns';
    if (skinHeadgear === 'halo') return 'halo';
    if (skinHeadgear === 'ears') return 'kitsune_ears';
    if (skinHeadgear === 'visor') return 'visor';
    if (skinHeadgear === 'crest') return 'valkyrie_wings';
  }
  return base;
}

function drawOutlinedShape(
  ctx: CanvasRenderingContext2D,
  outline: string,
  fill: string | CanvasGradient,
  lineWidth: number,
  buildPath: () => void
): void {
  ctx.beginPath();
  buildPath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = outline;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  emblem: HeroVisualProfile['emblem'],
  col: string,
  hi: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = col;
  ctx.strokeStyle = '#090712';
  ctx.lineWidth = 1.6;
  if (emblem === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 4.4 : 1.7;
      const a = (Math.PI * i) / 4 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  } else if (emblem === 'gem') {
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(3.6, 0);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-3.6, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  } else if (emblem === 'moon') {
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0.4, Math.PI * 1.7);
    ctx.arc(1.8, -0.5, 2.8, Math.PI * 1.6, 0.5, true);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 3.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  }
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(-0.9, -1.1, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderHeroStudioToCanvas(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean
): void {
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);
  const prof = HERO_VISUAL_PROFILES[heroId] ?? HERO_VISUAL_PROFILES.lyra;
  const pal = buildHeroPalette(heroId, dashes, featherActive, lowStaminaFlash, skinId);
  const headgear = resolveHeadgear(heroId, skin.palette.headgear);

  const outline = pal.o || '#090712';
  const skinCol = pal.s || '#f5d7c4';
  const skinSh = pal.S || '#cfa086';
  const hairDark = pal.d || '#2a1a40';
  const hairMain = pal.h || '#c84b6b';
  const hairHi = pal.H || '#ff9ebe';
  const cloakDark = pal.D || '#1a2444';
  const cloakMid = pal.C || '#2d4b8a';
  const cloakHi = pal.c || '#6dc2ff';
  const metal = pal.g || '#d99e30';
  const metalHi = pal.G || '#fff2a6';
  const acc = pal.a || hero.accentColor;
  const accHi = pal.A || '#ffffff';
  const eyeCol = pal.e || hero.accentColor;
  const bootDark = pal.b || '#221a30';
  const bootLight = pal.L || '#52436e';

  // Pose kinematics
  const phase = frameIdx % 4;
  const isRun = anim === 'run';
  const isDash = anim === 'dash';
  const isJump = anim === 'jump';
  const isFall = anim === 'fall';
  const isCrouch = anim === 'crouch';
  const isClimb = anim === 'climb';

  const bobY =
    isCrouch ? 8 :
    isDash ? 2 :
    isRun ? (phase % 2 === 1 ? -2.2 : 0.8) :
    isJump ? -3 :
    isFall ? -1 :
    (phase === 1 || phase === 3 ? -1.4 : 0);

  const leanDeg =
    isDash ? 0.24 :
    isRun ? 0.11 :
    isFall ? -0.06 :
    isCrouch ? 0.12 : 0;

  const stride = isRun
    ? (phase === 0 ? -10 : phase === 1 ? 0 : phase === 2 ? 10 : 0)
    : isJump ? 6 : isFall ? -5 : isDash ? 11 : 0;

  const armSwing = isRun ? -stride * 0.7 : isDash ? -10 : isJump ? -8 : 0;

  const cx = BAKE_W * 0.5;
  const footY = BAKE_H - 8;

  ctx.save();
  ctx.translate(cx, footY + bobY);
  ctx.rotate(leanDeg);

  // 1. BACK CLOAK / WINGS / THRUSTERS
  const flap = (phase % 2 === 1 ? -4 : 3);
  if (prof.cloak === 'seraph_wings' || prof.cloak === 'butterfly_wings' || prof.cloak === 'dragon_wings') {
    for (const side of [-1, 1] as const) {
      ctx.save();
      ctx.translate(side * 6, -42);
      if (prof.cloak === 'seraph_wings') {
        for (let f = 0; f < 4; f++) {
          const ang = side * (0.28 + f * 0.22) + (side * flap * 0.03);
          const len = 27 - f * 3.5;
          drawOutlinedShape(ctx, outline, f % 2 === 0 ? accHi : acc, 3.2, () => {
            ctx.moveTo(0, f * 3);
            ctx.quadraticCurveTo(Math.cos(ang) * len * 0.65 * side, -8 + f * 5 + flap * 0.4, Math.cos(ang) * len * side, f * 4 + flap);
            ctx.quadraticCurveTo(Math.cos(ang) * len * 0.45 * side, 4 + f * 4, 0, f * 3 + 4);
            ctx.closePath();
          });
        }
      } else if (prof.cloak === 'butterfly_wings') {
        drawOutlinedShape(ctx, outline, colorWithAlpha(acc, 0.88), 3.0, () => {
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(side * 24, -22 + flap, side * 32, -4 + flap, side * 14, 8);
          ctx.bezierCurveTo(side * 26, 16, side * 16, 26, 0, 12);
          ctx.closePath();
        });
        ctx.fillStyle = accHi;
        ctx.beginPath();
        ctx.arc(side * 16, -5 + flap * 0.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawOutlinedShape(ctx, outline, cloakDark, 3.2, () => {
          ctx.moveTo(0, 0);
          ctx.lineTo(side * 24, -18 + flap);
          ctx.lineTo(side * 28, -4 + flap);
          ctx.lineTo(side * 18, 10 + flap * 0.5);
          ctx.lineTo(side * 10, 4);
          ctx.closePath();
        });
        ctx.strokeStyle = acc;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * 23, -15 + flap);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Flowing back cape / mantle / ribbons
  const capeSway = isDash ? -18 : isRun ? -11 - (phase % 2) * 3 : -4 + Math.sin(phase * 1.5) * 3;
  const capeGrad = ctx.createLinearGradient(-18, -46, 12, -4);
  capeGrad.addColorStop(0, cloakHi);
  capeGrad.addColorStop(0.55, cloakMid);
  capeGrad.addColorStop(1, cloakDark);

  if (prof.cloak === 'mecha_thrusters') {
    drawOutlinedShape(ctx, outline, metal, 3.2, () => {
      ctx.roundRect(-17, -46, 10, 16, 3);
    });
    ctx.fillStyle = accHi;
    ctx.beginPath();
    ctx.moveTo(-15, -30);
    ctx.lineTo(-9, -30);
    ctx.lineTo(-13 + capeSway * 0.3, -16);
    ctx.closePath();
    ctx.fill();
  } else {
    drawOutlinedShape(ctx, outline, capeGrad, 3.4, () => {
      ctx.moveTo(-4, -48);
      ctx.quadraticCurveTo(-18 + capeSway * 0.6, -34, -22 + capeSway, -10);
      ctx.quadraticCurveTo(-10 + capeSway * 0.4, -5, 4, -14);
      ctx.lineTo(6, -46);
      ctx.closePath();
    });
    // Specular cape fold highlight
    ctx.strokeStyle = colorWithAlpha(accHi, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -44);
    ctx.quadraticCurveTo(-15 + capeSway * 0.5, -30, -17 + capeSway * 0.85, -13);
    ctx.stroke();
  }

  // 2. BESPOKE BACK / HAND WEAPON
  ctx.save();
  ctx.translate(-9, -34);
  if (prof.weapon === 'katana' || prof.weapon === 'blade' || prof.weapon === 'greatsword') {
    const bladeLen = prof.weapon === 'greatsword' ? 44 : 36;
    const bladeW = prof.weapon === 'greatsword' ? 6.5 : 4.2;
    ctx.rotate(-0.62);
    drawOutlinedShape(ctx, outline, '#e2e8f0', 3, () => {
      ctx.moveTo(-bladeW * 0.5, 4);
      ctx.lineTo(-bladeW * 0.4, -bladeLen);
      ctx.lineTo(bladeW * 0.5, -bladeLen - 6);
      ctx.lineTo(bladeW * 0.5, 4);
      ctx.closePath();
    });
    ctx.fillStyle = acc;
    ctx.fillRect(-1.2, -bladeLen + 4, 2.2, bladeLen - 6);
    // Crossguard
    drawOutlinedShape(ctx, outline, metal, 2.4, () => {
      ctx.roundRect(-7, 2, 14, 4, 1.5);
    });
  } else if (prof.weapon === 'staff' || prof.weapon === 'scepter' || prof.weapon === 'halberd' || prof.weapon === 'spear' || prof.weapon === 'scythe') {
    ctx.rotate(-0.42);
    drawOutlinedShape(ctx, outline, metal, 2.8, () => {
      ctx.roundRect(-2, -46, 4, 62, 1.5);
    });
    if (prof.weapon === 'scythe') {
      drawOutlinedShape(ctx, outline, accHi, 3, () => {
        ctx.moveTo(0, -46);
        ctx.quadraticCurveTo(22, -52, 24, -26);
        ctx.quadraticCurveTo(12, -40, 0, -39);
        ctx.closePath();
      });
    } else if (prof.weapon === 'spear' || prof.weapon === 'halberd') {
      drawOutlinedShape(ctx, outline, metalHi, 2.8, () => {
        ctx.moveTo(-4, -44);
        ctx.lineTo(0, -58);
        ctx.lineTo(4, -44);
        ctx.closePath();
      });
    } else {
      drawOutlinedShape(ctx, outline, acc, 2.6, () => {
        ctx.arc(0, -49, 6.2, 0, Math.PI * 2);
      });
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1.5, -50.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prof.weapon === 'bow') {
    ctx.rotate(-0.2);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.arc(4, -10, 22, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = metalHi;
    ctx.lineWidth = 3.2;
    ctx.stroke();
  } else if (prof.weapon === 'hammer') {
    ctx.rotate(-0.55);
    drawOutlinedShape(ctx, outline, metal, 2.6, () => {
      ctx.roundRect(-2, -38, 4, 48, 1);
    });
    drawOutlinedShape(ctx, outline, cloakHi, 3, () => {
      ctx.roundRect(-11, -46, 22, 13, 3);
    });
    ctx.fillStyle = acc;
    ctx.fillRect(-7, -43, 14, 3);
  } else if (prof.weapon === 'astrolabe' || prof.weapon === 'grimoire' || prof.weapon === 'orb') {
    ctx.translate(-8, -14);
    drawOutlinedShape(ctx, outline, metalHi, 2.4, () => {
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
    });
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. BACK HAIR LAYER (for flowing / long_noble / twintails / braid)
  if (prof.hair === 'flowing' || prof.hair === 'long_noble') {
    drawOutlinedShape(ctx, outline, hairDark, 3.2, () => {
      ctx.moveTo(-10, -64);
      ctx.quadraticCurveTo(-20 + capeSway * 0.4, -46, -15 + capeSway * 0.5, -24);
      ctx.lineTo(10, -28);
      ctx.quadraticCurveTo(14, -48, 9, -64);
      ctx.closePath();
    });
  } else if (prof.hair === 'twintails') {
    for (const side of [-1, 1] as const) {
      drawOutlinedShape(ctx, outline, hairMain, 3, () => {
        ctx.moveTo(side * 10, -62);
        ctx.quadraticCurveTo(side * 24, -48, side * 19 + capeSway * 0.3, -24);
        ctx.quadraticCurveTo(side * 12, -30, side * 9, -54);
        ctx.closePath();
      });
    }
  } else if (prof.hair === 'ponytail') {
    drawOutlinedShape(ctx, outline, hairMain, 3, () => {
      ctx.moveTo(-8, -66);
      ctx.quadraticCurveTo(-24 + capeSway * 0.4, -64, -22 + capeSway * 0.5, -38);
      ctx.quadraticCurveTo(-13, -46, -7, -58);
      ctx.closePath();
    });
  }

  // 4. ARTICULATED LEGS & ARMORED BOOTS
  const legSpread = isCrouch ? 5 : 4;
  // Back leg
  ctx.save();
  ctx.translate(-legSpread + stride * 0.45, -21);
  drawOutlinedShape(ctx, outline, cloakDark, 3, () => {
    ctx.roundRect(-3.5, 0, 7, 13, 2.5);
  });
  drawOutlinedShape(ctx, outline, bootDark, 3, () => {
    ctx.roundRect(-4.5, 10, 9.5, 10, 3);
  });
  ctx.fillStyle = metal;
  ctx.fillRect(-3, 10, 6.5, 2.2);
  ctx.restore();

  // Front leg
  ctx.save();
  ctx.translate(legSpread - stride * 0.45, -21);
  drawOutlinedShape(ctx, outline, cloakMid, 3, () => {
    ctx.roundRect(-3.8, 0, 7.6, 13, 2.5);
  });
  const bootGrad = ctx.createLinearGradient(-4, 10, 5, 20);
  bootGrad.addColorStop(0, bootLight);
  bootGrad.addColorStop(1, bootDark);
  drawOutlinedShape(ctx, outline, bootGrad, 3, () => {
    ctx.roundRect(-4.2, 10, 10, 10, 3);
  });
  ctx.fillStyle = metalHi;
  ctx.fillRect(-2.8, 10, 7, 2.4);
  ctx.restore();

  // 5. BACK ARM
  ctx.save();
  ctx.translate(-8, -42);
  ctx.rotate((armSwing * 0.04) - 0.15);
  drawOutlinedShape(ctx, outline, cloakDark, 2.8, () => {
    ctx.roundRect(-3, 0, 6, 15, 3);
  });
  drawOutlinedShape(ctx, outline, skinSh, 2.4, () => {
    ctx.arc(0, 16, 3.2, 0, Math.PI * 2);
  });
  ctx.restore();

  // 6. SCULPTED TORSO (ARMOR / ROBE / TUNIC)
  const torsoGrad = ctx.createLinearGradient(-12, -48, 12, -18);
  torsoGrad.addColorStop(0, cloakHi);
  torsoGrad.addColorStop(0.45, cloakMid);
  torsoGrad.addColorStop(1, cloakDark);

  const isRobed =
    prof.archetype === 'mage' ||
    prof.archetype === 'witch' ||
    prof.archetype === 'seraph' ||
    prof.archetype === 'druid' ||
    prof.archetype === 'royal';

  drawOutlinedShape(ctx, outline, torsoGrad, 3.2, () => {
    if (isRobed) {
      ctx.moveTo(-9, -46);
      ctx.lineTo(9, -46);
      ctx.lineTo(14, -14);
      ctx.quadraticCurveTo(0, -10, -14, -14);
      ctx.closePath();
    } else {
      ctx.moveTo(-10, -46);
      ctx.lineTo(10, -46);
      ctx.lineTo(9, -20);
      ctx.lineTo(-9, -20);
      ctx.closePath();
    }
  });

  // Waist Sash / Metallic Belt & Buckle
  drawOutlinedShape(ctx, outline, cloakDark, 2.4, () => {
    ctx.roundRect(-10.5, -26, 21, 5.5, 2);
  });
  ctx.fillStyle = metal;
  ctx.fillRect(-3.5, -26, 7, 5.5);
  ctx.fillStyle = accHi;
  ctx.fillRect(-1.8, -24.5, 3.6, 2.5);

  // Chest Emblem & Scarf/Collar
  drawEmblem(ctx, 1, -35, prof.emblem, acc, accHi);

  // Ornate Shoulder Pauldrons / Mantle Collar
  for (const side of [-1, 1] as const) {
    drawOutlinedShape(ctx, outline, side > 0 ? metalHi : metal, 2.6, () => {
      ctx.ellipse(side * 10, -44, 5.8, 4.2, side * 0.28, 0, Math.PI * 2);
    });
  }
  drawOutlinedShape(ctx, outline, acc, 2.6, () => {
    ctx.roundRect(-9, -49, 18, 5.5, 2.5);
  });

  // 7. HEAD, EXPRESSIVE ANIME/CELESTE EYES & LAYERED HAIR
  ctx.save();
  ctx.translate(0, -61);

  // Face base
  const faceGrad = ctx.createLinearGradient(0, -11, 0, 12);
  faceGrad.addColorStop(0, skinCol);
  faceGrad.addColorStop(1, skinSh);
  drawOutlinedShape(ctx, outline, faceGrad, 3.2, () => {
    ctx.moveTo(-10.5, -4);
    ctx.quadraticCurveTo(-11, 9, 0, 11.5);
    ctx.quadraticCurveTo(11, 9, 10.5, -4);
    ctx.quadraticCurveTo(10, -13, 0, -13);
    ctx.quadraticCurveTo(-10, -13, -10.5, -4);
    ctx.closePath();
  });

  // Soft cheek blush
  ctx.fillStyle = colorWithAlpha('#ff6b8b', 0.28);
  ctx.beginPath();
  ctx.ellipse(-5.5, 4.5, 2.6, 1.3, 0, 0, Math.PI * 2);
  ctx.ellipse(6.5, 4.5, 2.6, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Eyes (or Plague Mask / Cyber Visor!)
  if (headgear === 'plague_mask') {
    drawOutlinedShape(ctx, outline, '#e2e8f0', 2.4, () => {
      ctx.moveTo(-8, -2);
      ctx.lineTo(15, 3);
      ctx.lineTo(2, 9);
      ctx.lineTo(-8, 6);
      ctx.closePath();
    });
    ctx.fillStyle = eyeCol;
    ctx.beginPath();
    ctx.arc(3, 0.5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2.2, -0.3, 0.9, 0, Math.PI * 2);
    ctx.fill();
  } else if (headgear === 'visor') {
    drawOutlinedShape(ctx, outline, '#090d1a', 2.4, () => {
      ctx.roundRect(-8, -3.5, 19, 6.5, 3);
    });
    ctx.fillStyle = acc;
    ctx.fillRect(-5, -1.5, 14, 2.6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, -1.5, 5, 1.2);
  } else {
    const blink = anim === 'idle' && frameIdx === 2;
    for (const ex of [-2.8, 5.4]) {
      if (blink) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ex - 2.2, 1.2);
        ctx.lineTo(ex + 2.2, 1.2);
        ctx.stroke();
      } else {
        // Sclera
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, 0.8, 2.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Iris
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.ellipse(ex + 0.4, 1.0, 1.7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupil + lash + catchlight
        ctx.fillStyle = '#090712';
        ctx.beginPath();
        ctx.arc(ex + 0.5, 1.3, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 0.3, -0.3, 0.95, 0, Math.PI * 2);
        ctx.fill();
        // Upper lash
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, 0.6, 2.8, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    }
  }

  // Front Hair Bangs & Crown Highlights
  const hairGrad = ctx.createLinearGradient(-10, -16, 10, 4);
  hairGrad.addColorStop(0, hairHi);
  hairGrad.addColorStop(0.55, hairMain);
  hairGrad.addColorStop(1, hairDark);

  drawOutlinedShape(ctx, outline, hairGrad, 3.0, () => {
    if (prof.hair === 'hooded') {
      ctx.moveTo(-12, 8);
      ctx.quadraticCurveTo(-14, -15, 0, -17);
      ctx.quadraticCurveTo(14, -15, 12, 8);
      ctx.lineTo(9, -3);
      ctx.quadraticCurveTo(0, -10, -9, -3);
      ctx.closePath();
    } else if (prof.hair === 'spiky' || prof.hair === 'wild_mane') {
      ctx.moveTo(-12, 2);
      ctx.lineTo(-14, -9);
      ctx.lineTo(-7, -14);
      ctx.lineTo(-3, -19);
      ctx.lineTo(3, -14);
      ctx.lineTo(10, -18);
      ctx.lineTo(14, -8);
      ctx.lineTo(11, 2);
      ctx.lineTo(7, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(-1, -5);
      ctx.lineTo(-6, 1);
      ctx.closePath();
    } else {
      ctx.moveTo(-12, 4);
      ctx.quadraticCurveTo(-13, -14, 0, -16);
      ctx.quadraticCurveTo(13, -14, 12, 4);
      ctx.quadraticCurveTo(7, -6, 2, -2);
      ctx.lineTo(0, -6);
      ctx.lineTo(-4, -1);
      ctx.quadraticCurveTo(-8, -5, -12, 4);
      ctx.closePath();
    }
  });

  // Specular hair highlight arc
  ctx.strokeStyle = hairHi;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.quadraticCurveTo(0, -13, 6, -9);
  ctx.stroke();

  // 8. HEADGEAR (Crown, Halo, Horns, Kitsune Ears, Witch Hat, Valkyrie Wings, Antlers, Goggles, Kabuto)
  if (headgear === 'crown' || headgear === 'tiara') {
    const h = headgear === 'crown' ? 10 : 7;
    drawOutlinedShape(ctx, outline, metalHi, 2.4, () => {
      ctx.moveTo(-9, -12);
      ctx.lineTo(-7, -12 - h);
      ctx.lineTo(-3, -14);
      ctx.lineTo(0, -14 - h);
      ctx.lineTo(3, -14);
      ctx.lineTo(7, -12 - h);
      ctx.lineTo(9, -12);
      ctx.closePath();
    });
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.arc(0, -14.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (headgear === 'halo') {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.ellipse(0, -20, 11, 3.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = metalHi;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  } else if (headgear === 'horns' || headgear === 'antlers') {
    for (const side of [-1, 1] as const) {
      drawOutlinedShape(ctx, outline, headgear === 'antlers' ? accHi : metal, 2.4, () => {
        ctx.moveTo(side * 6, -12);
        ctx.quadraticCurveTo(side * 16, -20, side * 12, -28);
        ctx.quadraticCurveTo(side * 10, -20, side * 3, -13);
        ctx.closePath();
      });
    }
  } else if (headgear === 'kitsune_ears') {
    for (const side of [-1, 1] as const) {
      drawOutlinedShape(ctx, outline, hairMain, 2.4, () => {
        ctx.moveTo(side * 4, -12);
        ctx.lineTo(side * 11, -24);
        ctx.lineTo(side * 11, -10);
        ctx.closePath();
      });
      ctx.fillStyle = accHi;
      ctx.beginPath();
      ctx.moveTo(side * 6, -13);
      ctx.lineTo(side * 10, -20);
      ctx.lineTo(side * 10, -12);
      ctx.closePath();
      ctx.fill();
    }
  } else if (headgear === 'witch_hat') {
    drawOutlinedShape(ctx, outline, cloakDark, 2.8, () => {
      ctx.ellipse(0, -12, 18, 4.5, -0.06, 0, Math.PI * 2);
    });
    drawOutlinedShape(ctx, outline, cloakMid, 2.8, () => {
      ctx.moveTo(-10, -13);
      ctx.lineTo(-2, -31);
      ctx.lineTo(10, -26);
      ctx.lineTo(9, -13);
      ctx.closePath();
    });
    ctx.fillStyle = metalHi;
    ctx.fillRect(-7, -16, 14, 3);
  } else if (headgear === 'valkyrie_wings') {
    for (const side of [-1, 1] as const) {
      drawOutlinedShape(ctx, outline, metalHi, 2.2, () => {
        ctx.moveTo(side * 8, -8);
        ctx.lineTo(side * 18, -20);
        ctx.lineTo(side * 14, -10);
        ctx.lineTo(side * 10, -6);
        ctx.closePath();
      });
    }
  } else if (headgear === 'kabuto') {
    drawOutlinedShape(ctx, outline, cloakDark, 2.8, () => {
      ctx.arc(0, -10, 12.5, Math.PI, 0);
      ctx.closePath();
    });
    drawOutlinedShape(ctx, outline, metalHi, 2.2, () => {
      ctx.moveTo(-9, -18);
      ctx.lineTo(0, -14);
      ctx.lineTo(9, -18);
      ctx.lineTo(0, -26);
      ctx.closePath();
    });
  } else if (headgear === 'goggles') {
    drawOutlinedShape(ctx, outline, metal, 2.4, () => {
      ctx.roundRect(-10, -15, 20, 6, 2.5);
    });
    ctx.fillStyle = accHi;
    ctx.fillRect(-7, -13.5, 5, 3);
    ctx.fillRect(2, -13.5, 5, 3);
  } else if (headgear === 'flower_crown') {
    for (const fx of [-7, 0, 7]) {
      drawOutlinedShape(ctx, outline, fx === 0 ? accHi : acc, 2, () => {
        ctx.arc(fx, -13, 3.2, 0, Math.PI * 2);
      });
    }
  } else if (headgear === 'jester_cap') {
    for (const side of [-1, 1] as const) {
      drawOutlinedShape(ctx, outline, side < 0 ? cloakHi : acc, 2.4, () => {
        ctx.moveTo(0, -14);
        ctx.quadraticCurveTo(side * 12, -25, side * 16, -16);
        ctx.quadraticCurveTo(side * 8, -16, side * 6, -12);
        ctx.closePath();
      });
    }
  }

  ctx.restore(); // end head

  // 9. FRONT ARM (with glowing gauntlets / sleeves)
  ctx.save();
  ctx.translate(8, -41);
  ctx.rotate((-armSwing * 0.04) + 0.12);
  drawOutlinedShape(ctx, outline, cloakHi, 2.8, () => {
    ctx.roundRect(-3.2, 0, 6.4, 15, 3);
  });
  drawOutlinedShape(ctx, outline, metal, 2.2, () => {
    ctx.roundRect(-3.5, 10, 7, 4.5, 1.5);
  });
  drawOutlinedShape(ctx, outline, skinCol, 2.2, () => {
    ctx.arc(0, 16, 3.1, 0, Math.PI * 2);
  });
  ctx.restore();

  ctx.restore(); // end character root
}

export function getOrBakeHeroStudioSprite(
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const dashKey = featherActive ? 'f' : dashes >= 2 ? '2' : dashes === 1 ? '1' : '0';
  const safeFrame = frameIdx % 4;
  const key = `${heroId}_${skinId}_${anim}_${safeFrame}_${dashKey}_${lowStaminaFlash ? 'w' : 'n'}`;
  const existing = STUDIO_BAKE_CACHE.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const g = canvas.getContext('2d');
  if (!g) return null;

  renderHeroStudioToCanvas(
    g,
    heroId,
    skinId,
    anim,
    safeFrame,
    dashes,
    featherActive,
    lowStaminaFlash
  );
  STUDIO_BAKE_CACHE.set(key, canvas);
  return canvas;
}

export function drawHeroStudioSprite(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  anim: HeroAnimKey,
  frameIdx: number,
  dashes: number,
  featherActive: boolean,
  lowStaminaFlash: boolean,
  dx: number,
  dy: number,
  flipX = false,
  scaleX = 1,
  scaleY = 1,
  targetWorldH = 24
): void {
  const sprite = getOrBakeHeroStudioSprite(
    heroId,
    skinId,
    anim,
    frameIdx,
    dashes,
    featherActive,
    lowStaminaFlash
  );
  if (!sprite) return;
  const targetW = (BAKE_W / BAKE_H) * targetWorldH;
  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale((flipX ? -1 : 1) * scaleX, scaleY);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sprite, -targetW * 0.5, -targetWorldH, targetW, targetWorldH);
  ctx.restore();
}

export function drawHeroStudioPortraitBust(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  skinId: string,
  width: number,
  height: number,
  time: number
): void {
  const hero = getHeroDef(heroId);
  const skin = getHeroSkinDef(heroId, skinId);
  const accent = skin.id !== 'default' ? skin.badgeColor : hero.accentColor;

  ctx.clearRect(0, 0, width, height);
  // Deep celestial backdrop gradient
  const bg = ctx.createRadialGradient(width * 0.5, height * 0.45, 2, width * 0.5, height * 0.5, width * 0.72);
  bg.addColorStop(0, colorWithAlpha(accent, 0.42));
  bg.addColorStop(0.55, '#160f29');
  bg.addColorStop(1, '#080512');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle geometric arcane halo ring
  ctx.strokeStyle = colorWithAlpha(accent, 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.46, width * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  const sprite = getOrBakeHeroStudioSprite(
    heroId,
    skinId,
    'idle',
    Math.floor(time * 2) % 4,
    hero.modifiers.baseDashes,
    false,
    false
  );
  if (sprite) {
    // Bust crop focusing on head, crown/headgear, shoulders, and upper weapon
    const srcW = BAKE_W * 0.78;
    const srcH = BAKE_H * 0.62;
    const srcX = (BAKE_W - srcW) * 0.5;
    const srcY = 2;
    const bob = Math.sin(time * 2.4) * 1.4;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sprite, srcX, srcY, srcW, srcH, 2, 2 + bob, width - 4, height - 2);
  }
}
