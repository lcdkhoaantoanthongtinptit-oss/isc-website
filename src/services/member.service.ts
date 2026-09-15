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
      }
    }

    const localList = getLocalMembers();
    return localList.find((m) => m.id === id) || null;
  },

  /**
   * Tìm kiếm thành viên BCH tương ứng với tài khoản người dùng
   * (theo linkedMemberId, studentId, email hoặc userId)
   */
  async findMemberByUserInfo(info: {
    linkedMemberId?: string | null;
    studentId?: string | null;
    email?: string | null;
    userId?: string | null;
  }): Promise<ExecutiveMember | null> {
    const allMembers = await this.getMembers();

    // 1. Tìm theo linkedMemberId nếu đã có liên kết cụ thể
    if (info.linkedMemberId) {
      const found = allMembers.find((m) => m.id === info.linkedMemberId);
      if (found) return found;
    }

    // 2. Tìm theo userId
    if (info.userId) {
      const found = allMembers.find((m) => m.userId === info.userId);
      if (found) return found;
    }

    // 3. Tìm theo studentId (Mã sinh viên)
    if (info.studentId && info.studentId.trim()) {
      const cleanMsv = info.studentId.trim().toUpperCase();
      const found = allMembers.find(
        (m) => m.studentId && m.studentId.trim().toUpperCase() === cleanMsv
      );
      if (found) return found;
    }

    // 4. Tìm theo email
    if (info.email && info.email.trim()) {
      const cleanEmail = info.email.trim().toLowerCase();
      const found = allMembers.find(
        (m) => m.email && m.email.trim().toLowerCase() === cleanEmail
      );
      if (found) return found;
    }

    return null;
  },

  /**
   * Đồng bộ hai chiều giữa tài khoản User và bản ghi BCH:
   * Cập nhật thông tin và ảnh sang ExecutiveMember tương ứng
   */
  async syncMemberProfile(
    memberId: string,
    data: {
      fullName?: string;
      avatarUrl?: string;
      phone?: string | null;
      studentId?: string | null;
      className?: string | null;
      cohort?: string | null;
      facebook?: string | null;
      email?: string | null;
      userId?: string | null;
    }
  ): Promise<void> {
    const updatePayload: Partial<ExecutiveMember> = {
      updatedAt: new Date().toISOString(),
    };
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
    if (data.avatarUrl !== undefined) updatePayload.avatarUrl = data.avatarUrl;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.studentId !== undefined) updatePayload.studentId = data.studentId;
    if (data.className !== undefined) updatePayload.className = data.className;
    if (data.cohort !== undefined) updatePayload.cohort = data.cohort;
    if (data.facebook !== undefined) updatePayload.facebook = data.facebook;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.userId !== undefined) updatePayload.userId = data.userId;

    await this.updateMember(memberId, updatePayload);
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
