import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Activity } from '../types';

const LOCAL_ACTIVITIES_KEY = 'lcd_activities_data';
const LOCAL_DELETED_KEY = 'lcd_deleted_activity_ids';

export const DEFAULT_ACTIVITIES: Activity[] = [];

// Legacy mock activity IDs to purge from existing browser caches
const LEGACY_MOCK_IDS = new Set([
  'act_ptit_ctf_2026',
  'act_workshop_soc_pentest_2026',
  'act_volunteer_summer_2026',
]);

function getDeletedActivityIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set<string>();
}

function addDeletedActivityId(id: string): void {
  const set = getDeletedActivityIds();
  set.add(id);
  localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(set)));
}

function getLocalActivities(): Activity[] {
  const deletedIds = getDeletedActivityIds();
  const data = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
  if (data !== null) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (a: Activity) => !deletedIds.has(a.id) && !LEGACY_MOCK_IDS.has(a.id)
        );
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function saveLocalActivities(list: Activity[]) {
  // Always filter out any legacy mock data before saving
  const cleanList = list.filter((a) => !LEGACY_MOCK_IDS.has(a.id));
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(cleanList));
}

function parseEventTime(dateVal: any): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'object' && 'seconds' in dateVal) {
    return dateVal.seconds * 1000;
  }
  if (typeof dateVal === 'object' && 'toDate' in dateVal && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  const parsed = new Date(dateVal).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export const activityService = {
  async getActivities(onlyPublished = false): Promise<Activity[]> {
    const deletedIds = getDeletedActivityIds();

    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'activities');
        let snap;
        try {
          let q = query(collRef, orderBy('eventDate', 'desc'));
          if (onlyPublished) {
            q = query(collRef, where('isPublished', '==', true), orderBy('eventDate', 'desc'));
          }
          snap = await getDocs(q);
        } catch (queryErr) {
          // Fallback when composite index is not deployed yet
          console.warn('[Activities] Compound query index missing, falling back to full collection query:', queryErr);
          snap = await getDocs(collRef);
        }

        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Activity[];
        if (onlyPublished) {
          docs = docs.filter((a) => a.isPublished !== false);
        }
        docs.sort((a, b) => parseEventTime(b.eventDate) - parseEventTime(a.eventDate));

        // Filter out any explicitly deleted IDs and legacy mock IDs
        docs = docs.filter((a) => !deletedIds.has(a.id) && !LEGACY_MOCK_IDS.has(a.id));

        saveLocalActivities(docs);
        return docs;
      } catch (err) {
        console.error('[Activities] Firestore error, falling back to local:', err);
      }
    }

    const local = getLocalActivities();
    if (onlyPublished) {
      return local.filter((a) => a.isPublished !== false);
    }
    return local;
  },

  async getActivityBySlug(slug: string): Promise<Activity | null> {
    const deletedIds = getDeletedActivityIds();
    if (deletedIds.has(slug)) return null;

    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'activities');
        const q = query(collRef, where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const act = { id: snap.docs[0].id, ...snap.docs[0].data() } as Activity;
          if (!deletedIds.has(act.id)) {
            return act;
          }
          return null;
        }
        // Fallback check by document ID
        return await this.getActivityById(slug);
      } catch (err) {
        console.error('[Activities] Firestore slug error:', err);
        return await this.getActivityById(slug);
      }
    }

    const list = getLocalActivities();
    const found = list.find((a) => (a.slug === slug || a.id === slug) && !deletedIds.has(a.id));
    return found || null;
  },

  async getActivityById(id: string): Promise<Activity | null> {
    const deletedIds = getDeletedActivityIds();
    if (deletedIds.has(id)) return null;

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'activities', id));
        if (snap.exists()) {
          const act = { id: snap.id, ...snap.data() } as Activity;
          if (!deletedIds.has(act.id)) {
            return act;
          }
          return null;
        }
      } catch (err) {
        console.error('[Activities] Firestore ID error:', err);
      }
    }

    const list = getLocalActivities();
    const found = list.find((a) => a.id === id && !deletedIds.has(a.id));
    return found || null;
  },

  async createActivity(data: Omit<Activity, 'id'>): Promise<Activity> {
    const id = `act_${Date.now()}`;
    const newAct: Activity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Make sure ID is not in deleted set
    const deletedIds = getDeletedActivityIds();
    if (deletedIds.has(id)) {
      deletedIds.delete(id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(deletedIds)));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'activities', id), {
          ...newAct,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Activities] Firestore setDoc error (saved locally):', err);
      }
    }

    const list = getLocalActivities();
    list.unshift(newAct);
    saveLocalActivities(list);
    return newAct;
  },

  async updateActivity(id: string, data: Partial<Activity>): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'activities', id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Activities] Firestore updateDoc error (saved locally):', err);
      }
    }

    const list = getLocalActivities();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      saveLocalActivities(list);
    }
  },

  async deleteActivity(id: string): Promise<void> {
    // 1. Mark ID as permanently deleted in local store so default mock never resurrects
    addDeletedActivityId(id);

    // 2. Remove immediately from local activities cache
    const list = getLocalActivities().filter((a) => a.id !== id);
    saveLocalActivities(list);

    // 3. Delete from Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'activities', id));
      } catch (fbErr: any) {
        console.warn('[Activities] Firestore deleteDoc note:', fbErr);
        // If error is permission-denied (e.g. demo staff session), we already deleted locally
        if (fbErr?.code === 'permission-denied' || fbErr?.message?.includes('permission')) {
          console.info('[Activities] Deleted locally for demo/offline session.');
          return;
        }
        throw fbErr;
      }
    }
  },
};
