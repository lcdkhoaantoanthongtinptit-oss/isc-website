import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { ExecutiveMember } from '../types';

const LOCAL_MEMBERS_KEY = 'lcd_executive_members_data';

function getLocalMembers(): ExecutiveMember[] {
  const data = localStorage.getItem(LOCAL_MEMBERS_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.map((m: any) => {
        if (!m.cohort && m.fullName && m.fullName.includes(' - ')) {
          const parts = m.fullName.split(' - ');
          return {
            ...m,
            fullName: parts[0].trim(),
            cohort: parts[1].trim(),
          };
        }
        return m;
      });
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalMembers(list: ExecutiveMember[]) {
  localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(list));
}

export const memberService = {
  async getMembers(): Promise<ExecutiveMember[]> {
    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'executive_members');
        const q = query(collRef, orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ExecutiveMember[];
      } catch (err) {
        console.error('[Members] Firestore query error:', err);
        return [];
      }
    }

    return [];
  },

  async getMemberById(id: string): Promise<ExecutiveMember | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'executive_members', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as ExecutiveMember;
      } catch (err) {
        console.error('[Members] Firestore get error:', err);
        return null;
      }
    }

    return null;
  },

  async createMember(data: Omit<ExecutiveMember, 'id'>): Promise<ExecutiveMember> {
    const id = `exec_${Date.now()}`;
    const newMember: ExecutiveMember = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'executive_members', id), {
        ...newMember,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newMember;
    }

    const list = getLocalMembers();
    list.push(newMember);
    saveLocalMembers(list);
    return newMember;
  },

  async updateMember(id: string, data: Partial<ExecutiveMember>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'executive_members', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const list = getLocalMembers();
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      saveLocalMembers(list);
    }
  },

  async deleteMember(id: string): Promise<void> {
    const list = getLocalMembers().filter((m) => m.id !== id);
    saveLocalMembers(list);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'executive_members', id));
      } catch (fbErr: any) {
        console.warn('[Members] deleteDoc error:', fbErr);
        if (fbErr?.code === 'permission-denied' || fbErr?.message?.includes('permission')) {
          return;
        }
        throw fbErr;
      }
    }
  },
};
