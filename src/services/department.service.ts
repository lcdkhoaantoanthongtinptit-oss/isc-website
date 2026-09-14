import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Department } from '../types';

const LOCAL_DEPTS_KEY = 'lcd_departments_data';

function getLocalDepartments(): Department[] {
  const data = localStorage.getItem(LOCAL_DEPTS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'departments'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Department[];
      } catch (err) {
        console.error('[Departments] Firestore error:', err);
        return [];
      }
    }
    return [];
  },

  async createDepartment(data: Omit<Department, 'id'>): Promise<Department> {
    const id = data.slug || `dept_${Date.now()}`;
    const newDept: Department = { ...data, id };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'departments', id), newDept);
      return newDept;
    }

    const list = getLocalDepartments();
    list.push(newDept);
    localStorage.setItem(LOCAL_DEPTS_KEY, JSON.stringify(list));
    return newDept;
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'departments', id), data);
      return;
    }

    const list = getLocalDepartments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      localStorage.setItem(LOCAL_DEPTS_KEY, JSON.stringify(list));
    }
  },

  async deleteDepartment(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'departments', id));
      return;
    }

    const list = getLocalDepartments().filter((d) => d.id !== id);
    localStorage.setItem(LOCAL_DEPTS_KEY, JSON.stringify(list));
  },
};
