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

function getLocalActivities(): Activity[] {
  const data = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalActivities(list: Activity[]) {
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(list));
}

export const activityService = {
  async getActivities(onlyPublished = false): Promise<Activity[]> {
    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'activities');
        let q = query(collRef, orderBy('eventDate', 'desc'));
        if (onlyPublished) {
          q = query(collRef, where('isPublished', '==', true), orderBy('eventDate', 'desc'));
        }
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Activity[];
      } catch (err) {
        console.error('[Activities] Firestore error:', err);
        return [];
      }
    }

    return [];
  },

  async getActivityBySlug(slug: string): Promise<Activity | null> {
    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'activities');
        const q = query(collRef, where('slug', '==', slug));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Activity;
      } catch (err) {
        console.error('[Activities] Firestore slug error:', err);
        return null;
      }
    }

    return null;
  },

  async getActivityById(id: string): Promise<Activity | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'activities', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Activity;
      } catch (err) {
        console.error('[Activities] Firestore ID error:', err);
        return null;
      }
    }

    return null;
  },

  async createActivity(data: Omit<Activity, 'id'>): Promise<Activity> {
    const id = `act_${Date.now()}`;
    const newAct: Activity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'activities', id), {
        ...newAct,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newAct;
    }

    const list = getLocalActivities();
    list.unshift(newAct);
    saveLocalActivities(list);
    return newAct;
  },

  async updateActivity(id: string, data: Partial<Activity>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'activities', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const list = getLocalActivities();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      saveLocalActivities(list);
    }
  },

  async deleteActivity(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'activities', id));
      return;
    }

    const list = getLocalActivities().filter((a) => a.id !== id);
    saveLocalActivities(list);
  },
};
