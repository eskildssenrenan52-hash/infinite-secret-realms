// @ts-nocheck -- imported game code
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from './firebase';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface WorldPinData {
  id: string;
  tx: number;
  ty: number;
  label: string;
  color: string;
}

export interface SandboxCloudPayload {
  heroId: string;
  seed: number;
  playerTx: number;
  playerTy: number;
  spawnTx: number;
  spawnTy: number;
  toolTier: number;
  exploredSectorsCount: number;
  exploredSectorIndices: number[];
  discoveredBiomes: string[];
  unlockedPylons: string[];
  collectedIds: string[];
  tileOverrides: Record<string, number>;
  materials: Record<string, number>;
  hotbar: { id: string; name: string; count: number; color: string; kind: string; tileId?: number }[];
  backpack: { id: string; name: string; count: number; color: string; kind: string; tileId?: number }[];
  questsClaimed: string[];
  worldPins: WorldPinData[];
  stats: Record<string, number>;
  clientUpdatedAtMs: number;
}

const LOCAL_EXPLORATION_KEY = 'aethelgard_sandbox_realtime_v3';

export function loadLocalSandboxSave(): SandboxCloudPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_EXPLORATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SandboxCloudPayload;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.exploredSectorIndices)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalSandboxSave(payload: SandboxCloudPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_EXPLORATION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage quota
  }
}

function sanitizePayloadForFirestore(payload: SandboxCloudPayload, ownerId: string) {
  const safeSectors = payload.exploredSectorIndices
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 2000)
    .slice(0, 1500);
  const safeBiomes = payload.discoveredBiomes.map((s) => String(s).slice(0, 64)).slice(0, 32);
  const safePylons = payload.unlockedPylons.map((s) => String(s).slice(0, 64)).slice(0, 32);
  const safeCollected = payload.collectedIds.map((s) => String(s).slice(0, 80)).slice(0, 3000);
  const safeQuests = payload.questsClaimed.map((s) => String(s).slice(0, 64)).slice(0, 64);

  const safeOverrides: Record<string, number> = {};
  let overrideCount = 0;
  for (const [k, v] of Object.entries(payload.tileOverrides || {})) {
    if (overrideCount >= 4000) break;
    if (typeof v === 'number' && Number.isFinite(v)) {
      safeOverrides[String(k).slice(0, 24)] = Math.floor(v);
      overrideCount++;
    }
  }

  const safeMaterials: Record<string, number> = {};
  let matCount = 0;
  for (const [k, v] of Object.entries(payload.materials || {})) {
    if (matCount >= 64) break;
    if (typeof v === 'number' && Number.isFinite(v)) {
      safeMaterials[String(k).slice(0, 48)] = Math.max(0, Math.floor(v));
      matCount++;
    }
  }

  const safeStats: Record<string, number> = {};
  let statCount = 0;
  for (const [k, v] of Object.entries(payload.stats || {})) {
    if (statCount >= 32) break;
    if (typeof v === 'number' && Number.isFinite(v)) {
      safeStats[String(k).slice(0, 48)] = Math.floor(v);
      statCount++;
    }
  }

  const safeHotbar = (payload.hotbar || []).slice(0, 12).map((s) => ({
    id: String(s.id).slice(0, 48),
    name: String(s.name).slice(0, 64),
    count: Math.max(0, Math.floor(s.count || 0)),
    color: String(s.color || '#ffffff').slice(0, 16),
    kind: String(s.kind || 'block').slice(0, 24),
    tileId: typeof s.tileId === 'number' ? Math.floor(s.tileId) : 0,
  }));

  const safeBackpack = (payload.backpack || []).slice(0, 120).map((s) => ({
    id: String(s.id).slice(0, 48),
    name: String(s.name).slice(0, 64),
    count: Math.max(0, Math.floor(s.count || 0)),
    color: String(s.color || '#ffffff').slice(0, 16),
    kind: String(s.kind || 'block').slice(0, 24),
    tileId: typeof s.tileId === 'number' ? Math.floor(s.tileId) : 0,
  }));

  const safePins = (payload.worldPins || []).slice(0, 50).map((p) => ({
    id: String(p.id).slice(0, 32),
    tx: Math.max(0, Math.min(4800, Math.floor(p.tx))),
    ty: Math.max(0, Math.min(1000, Math.floor(p.ty))),
    label: String(p.label || 'Marcador').slice(0, 48),
    color: String(p.color || '#ffe066').slice(0, 16),
  }));

  return {
    ownerId,
    heroId: String(payload.heroId || 'lyra').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64),
    seed: Math.max(0, Math.floor(payload.seed || 202504)),
    playerTx: Math.max(0, Math.min(4800, Math.floor(payload.playerTx || 0))),
    playerTy: Math.max(0, Math.min(1000, Math.floor(payload.playerTy || 0))),
    spawnTx: Math.max(0, Math.min(4800, Math.floor(payload.spawnTx || 0))),
    spawnTy: Math.max(0, Math.min(1000, Math.floor(payload.spawnTy || 0))),
    toolTier: Math.max(1, Math.min(6, Math.floor(payload.toolTier || 1))),
    exploredSectorsCount: safeSectors.length,
    exploredSectorIndices: safeSectors,
    discoveredBiomes: safeBiomes,
    unlockedPylons: safePylons,
    collectedIds: safeCollected,
    tileOverrides: safeOverrides,
    materials: safeMaterials,
    hotbar: safeHotbar,
    backpack: safeBackpack,
    questsClaimed: safeQuests,
    worldPins: safePins,
    stats: safeStats,
  };
}

export class RealtimeSandboxPersistence {
  private user: User | null = null;
  private saveUnsub: Unsubscribe | null = null;
  private statusListeners: Set<(status: SyncStatus, lastSyncMs: number | null) => void> = new Set();
  private status: SyncStatus = 'local';
  private lastSyncMs: number | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPayload: SandboxCloudPayload | null = null;
  private lastLoggedSectors: Set<number> = new Set();
  private userDocEnsured = false;

  public getStatus(): { status: SyncStatus; lastSyncMs: number | null; user: User | null } {
    return { status: this.status, lastSyncMs: this.lastSyncMs, user: this.user };
  }

  public onStatusChange(cb: (status: SyncStatus, lastSyncMs: number | null) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.status, this.lastSyncMs);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    if (status === 'synced') {
      this.lastSyncMs = Date.now();
    }
    this.statusListeners.forEach((cb) => cb(this.status, this.lastSyncMs));
  }

  public async attachUser(
    user: User | null,
    onRemoteSave: (remote: SandboxCloudPayload) => void
  ): Promise<void> {
    if (this.saveUnsub) {
      this.saveUnsub();
      this.saveUnsub = null;
    }
    this.user = user;
    this.userDocEnsured = false;

    if (!user || !user.emailVerified) {
      this.setStatus('local');
      return;
    }

    await this.ensureUserProfile(user);

    const savePath = `users/${user.uid}/sandboxSaves/primary`;
    const saveRef = doc(db, 'users', user.uid, 'sandboxSaves', 'primary_v3');

    this.saveUnsub = onSnapshot(
      saveRef,
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        if (!d) return;
        if (Array.isArray(d.exploredSectorIndices)) {
          for (const idx of d.exploredSectorIndices) {
            if (typeof idx === 'number') this.lastLoggedSectors.add(idx);
          }
        }
        onRemoteSave({
          heroId: d.heroId ?? 'lyra',
          seed: d.seed ?? 202504,
          playerTx: d.playerTx ?? 0,
          playerTy: d.playerTy ?? 0,
          spawnTx: d.spawnTx ?? 0,
          spawnTy: d.spawnTy ?? 0,
          toolTier: d.toolTier ?? 1,
          exploredSectorsCount: d.exploredSectorsCount ?? 0,
          exploredSectorIndices: Array.isArray(d.exploredSectorIndices) ? d.exploredSectorIndices : [],
          discoveredBiomes: Array.isArray(d.discoveredBiomes) ? d.discoveredBiomes : [],
          unlockedPylons: Array.isArray(d.unlockedPylons) ? d.unlockedPylons : [],
          collectedIds: Array.isArray(d.collectedIds) ? d.collectedIds : [],
          tileOverrides: (d.tileOverrides as Record<string, number>) ?? {},
          materials: (d.materials as Record<string, number>) ?? {},
          hotbar: Array.isArray(d.hotbar) ? d.hotbar : [],
          backpack: Array.isArray(d.backpack) ? d.backpack : [],
          questsClaimed: Array.isArray(d.questsClaimed) ? d.questsClaimed : [],
          worldPins: Array.isArray(d.worldPins) ? d.worldPins : [],
          stats: (d.stats as Record<string, number>) ?? {},
          clientUpdatedAtMs: Date.now(),
        });
        this.setStatus('synced');
      },
      (error) => {
        this.setStatus('error');
        handleFirestoreError(error, OperationType.GET, savePath);
      }
    );

    if (this.pendingPayload) {
      void this.flushNow(this.pendingPayload);
    }
  }

  private async ensureUserProfile(user: User): Promise<void> {
    if (this.userDocEnsured) return;
    const profilePath = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: (user.displayName || 'Explorador').slice(0, 120),
          ...(user.email ? { email: user.email.slice(0, 254) } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          displayName: (user.displayName || 'Explorador').slice(0, 120),
          ...(user.email ? { email: user.email.slice(0, 254) } : {}),
          updatedAt: serverTimestamp(),
        });
      }
      this.userDocEnsured = true;
    } catch (error) {
      this.setStatus('error');
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  }

  public queueSave(payload: SandboxCloudPayload, immediate = false): void {
    saveLocalSandboxSave(payload);
    this.pendingPayload = payload;

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) {
      this.setStatus('local');
      return;
    }

    if (immediate) {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
      void this.flushNow(payload);
      return;
    }

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        if (this.pendingPayload) {
          void this.flushNow(this.pendingPayload);
        }
      }, 900);
    }
  }

  public async flushNow(payload: SandboxCloudPayload): Promise<void> {
    saveLocalSandboxSave(payload);
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) {
      this.setStatus('local');
      return;
    }

    await this.ensureUserProfile(currentUser);
    this.setStatus('syncing');

    const savePath = `users/${currentUser.uid}/sandboxSaves/primary`;
    const saveRef = doc(db, 'users', currentUser.uid, 'sandboxSaves', 'primary_v3');
    const clean = sanitizePayloadForFirestore(payload, currentUser.uid);

    try {
      const existingSnap = await getDoc(saveRef);
      if (!existingSnap.exists()) {
        await setDoc(saveRef, {
          ...clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const { ownerId: _o, seed: _s, ...updatable } = clean;
        await updateDoc(saveRef, {
          ...updatable,
          updatedAt: serverTimestamp(),
        });
      }
      this.setStatus('synced');
    } catch (error) {
      this.setStatus('error');
      handleFirestoreError(error, OperationType.WRITE, savePath);
    }
  }

  public async logSectorDiscovery(
    sectorIndex: number,
    sectorX: number,
    sectorY: number,
    biomeId: string,
    biomeLabel: string
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) return;
    if (this.lastLoggedSectors.has(sectorIndex)) return;
    this.lastLoggedSectors.add(sectorIndex);

    await this.ensureUserProfile(currentUser);
    const sectorKey = `sec_${sectorX}_${sectorY}`;
    const logPath = `users/${currentUser.uid}/explorationLogs/${sectorKey}`;
    const logRef = doc(db, 'users', currentUser.uid, 'explorationLogs', sectorKey);
    try {
      const snap = await getDoc(logRef);
      if (!snap.exists()) {
        await setDoc(logRef, {
          ownerId: currentUser.uid,
          sectorIndex: Math.floor(sectorIndex),
          sectorX: Math.floor(sectorX),
          sectorY: Math.floor(sectorY),
          biomeId: String(biomeId).slice(0, 64),
          biomeLabel: String(biomeLabel).slice(0, 100),
          discoveredAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, logPath);
    }
  }
}

export const realtimePersistence = new RealtimeSandboxPersistence();
