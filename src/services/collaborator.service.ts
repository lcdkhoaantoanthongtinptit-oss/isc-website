import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isFirebaseConfigured } from './firebase';
import { Collaborator, PublicCollaboratorResult } from '../types';
import { settingsService } from './settings.service';

const LOCAL_COLLABS_KEY = 'lcd_collaborators_data';

function cleanAdminNote(note?: string): string {
  if (!note) return '';
  // Nếu ghi chú trước đó bị auto-fill chứa câu hỏi/câu trả lời form, xóa sạch
  if (note.includes('⏰ Nộp đơn:') || note.includes('💪 Điểm mạnh:')) {
    return '';
  }
  return note;
}

/** Firestore rejects `undefined` field values – strip them before writing */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function getLocalCollaborators(): Collaborator[] {
  const data = localStorage.getItem(LOCAL_COLLABS_KEY);
  if (data) {
    try {
      const list = JSON.parse(data);
      return list.map((item: any) => ({
        ...item,
        adminNote: cleanAdminNote(item.adminNote),
      }));
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalCollaborators(list: Collaborator[]) {
  localStorage.setItem(LOCAL_COLLABS_KEY, JSON.stringify(list));
}

export const collaboratorService = {
  // Public check result for a single student ID (Secure, minimal payload)
  async checkCollaboratorResult(rawStudentId: string): Promise<PublicCollaboratorResult> {
    const studentId = rawStudentId.trim().toUpperCase();
    if (!studentId) {
      return { found: false };
    }

    // Defense-in-depth gate: even if page-level check was bypassed, service
    // blocks lookup when admin hasn't opened results.
    try {
      const settings = await settingsService.getSettings();
      if (!settings.isResultPublic) {
        return { found: false };
      }
    } catch {
      return { found: false };
    }

    // If Firebase Functions is configured, call the backend Cloud Function
    if (isFirebaseConfigured && functions) {
      try {
        const checkFn = httpsCallable<{ studentId: string }, PublicCollaboratorResult>(
          functions,
          'checkCollaboratorResult'
        );
        const result = await checkFn({ studentId });
        return result.data;
      } catch (err) {
        console.warn('[CollaboratorService] Cloud Function call error, falling back to secure Firestore doc lookup:', err);
      }
    }

    // Secure Firestore doc lookup by studentId doc ID (if firestore is configured)
    if (isFirebaseConfigured && db) {
      try {
        // 1. Strictly read from sanitized public projection collection ONLY (No access to master collaborators)
        const pubDocRef = doc(db, 'collaborator_results', studentId);
        const pubSnap = await getDoc(pubDocRef);
        if (!pubSnap.exists()) {
          return { found: false };
        }

        const data = pubSnap.data();
        if (!data) {
          return { found: false };
        }

        // Map department names safely
        let acceptedDeptName = null;
        if (data.acceptedDepartmentId) {
          try {
            const deptDoc = await getDoc(doc(db, 'departments', data.acceptedDepartmentId));
            acceptedDeptName = deptDoc.exists() ? deptDoc.data().name : data.acceptedDepartmentId;
          } catch {
            acceptedDeptName = data.acceptedDepartmentId;
          }
        }

        let appliedDeptName = null;
        if (data.appliedDepartmentId) {
          try {
            const appliedDeptDoc = await getDoc(doc(db, 'departments', data.appliedDepartmentId));
            appliedDeptName = appliedDeptDoc.exists() ? appliedDeptDoc.data().name : data.appliedDepartmentId;
          } catch {
            appliedDeptName = data.appliedDepartmentId;
          }
        }

        // Return STRICTLY sanitized public fields only.
        // Omit phone, email, adminNote, form answers, Facebook URLs, internal metadata.
        return {
          found: true,
          studentId: data.studentId,
          fullName: data.fullName,
          appliedDepartment: appliedDeptName,
          acceptedDepartment: acceptedDeptName,
          position: data.position,
          status: data.status,
          note: data.publicNote || '',
        };
      } catch (error) {
        console.error('[CollaboratorService] Firestore check error:', error);
        return { found: false };
      }
    }

    return { found: false };
  },

  // ADMIN: Get all collaborators
  async getCollaborators(): Promise<Collaborator[]> {
    if (isFirebaseConfigured && db) {
      try {
        const collRef = collection(db, 'collaborators');
        const q = query(collRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            adminNote: cleanAdminNote(d.adminNote),
          };
        }) as Collaborator[];
      } catch (err) {
        console.error('[CollaboratorService] Error getting collaborators:', err);
        return [];
      }
    }

    return [];
  },

  // ADMIN: Get single collaborator by ID
  async getCollaboratorById(id: string): Promise<Collaborator | null> {
    const studentId = id.trim().toUpperCase();
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'collaborators', studentId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        const d = snapshot.data();
        return {
          id: snapshot.id,
          ...d,
          adminNote: cleanAdminNote(d.adminNote),
        } as Collaborator;
      } catch (err) {
        console.error('[CollaboratorService] Error getting collaborator by id:', err);
        return null;
      }
    }

    return null;
  },

  // ADMIN: Create new collaborator (Checks duplicate student ID)
  async createCollaborator(data: Omit<Collaborator, 'id'>): Promise<Collaborator> {
    const studentId = data.studentId.trim().toUpperCase();
    const existing = await this.getCollaboratorById(studentId);
    if (existing) {
      throw new Error(`Mã sinh viên "${studentId}" đã tồn tại trong hệ thống.`);
    }

    const newRecord: Collaborator = {
      ...data,
      id: studentId,
      studentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      // 1. Master document (Full data with phone, email, adminNote - Locked for Admin only)
      const docRef = doc(db, 'collaborators', studentId);
      await setDoc(docRef, {
        ...newRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Public lookup document (Only safe fields: fullName, department, position, status, publicNote)
      try {
        const pubRef = doc(db, 'collaborator_results', studentId);
        await setDoc(pubRef, {
          studentId,
          fullName: newRecord.fullName,
          appliedDepartmentId: newRecord.appliedDepartmentId,
          acceptedDepartmentId: newRecord.acceptedDepartmentId || null,
          position: newRecord.position,
          status: newRecord.status,
          publicNote: newRecord.publicNote || '',
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not sync to collaborator_results:', e);
      }

      return newRecord;
    }

    const all = getLocalCollaborators();
    all.unshift(newRecord);
    saveLocalCollaborators(all);
    return newRecord;
  },

  // ADMIN: Update collaborator
  async updateCollaborator(id: string, data: Partial<Collaborator>): Promise<void> {
    const syncedData: Partial<Collaborator> = { ...data };

    // Nếu cập nhật kết quả phỏng vấn là ĐẠT hoặc KHÔNG ĐẠT thì đồng bộ sang trạng thái CTV
    if (syncedData.interviewStatus === 'DAT') {
      syncedData.status = 'PASSED';
    } else if (syncedData.interviewStatus === 'KHONG_DAT') {
      syncedData.status = 'FAILED';
    }

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'collaborators', id);
      await updateDoc(docRef, {
        ...stripUndefined(syncedData as Record<string, unknown>),
        updatedAt: serverTimestamp(),
      });

      // Sync public lookup doc
      const studentId = (syncedData.studentId || id.split('_dup_')[0]).trim().toUpperCase();
      try {
        const pubRef = doc(db, 'collaborator_results', studentId);
        const pubFields: any = { updatedAt: serverTimestamp() };
        if (syncedData.fullName !== undefined) pubFields.fullName = syncedData.fullName;
        if (syncedData.appliedDepartmentId !== undefined) pubFields.appliedDepartmentId = syncedData.appliedDepartmentId;
        if (syncedData.acceptedDepartmentId !== undefined) pubFields.acceptedDepartmentId = syncedData.acceptedDepartmentId;
        if (syncedData.position !== undefined) pubFields.position = syncedData.position;
        if (syncedData.status !== undefined) pubFields.status = syncedData.status;
        if (syncedData.publicNote !== undefined) pubFields.publicNote = syncedData.publicNote;
        await setDoc(pubRef, pubFields, { merge: true });
      } catch (e) {
        console.warn('Could not sync update to collaborator_results:', e);
      }

      return;
    }

    const all = getLocalCollaborators();
    const index = all.findIndex((c) => c.id === id || c.studentId === id);
    if (index !== -1) {
      all[index] = {
        ...all[index],
        ...syncedData,
        updatedAt: new Date().toISOString(),
      };
      saveLocalCollaborators(all);
    }
  },

  // ADMIN / INTERVIEWER: Fast update interview assessment, scoring and status
  async updateInterviewAssessment(
    id: string,
    assessment: Partial<Collaborator>
  ): Promise<void> {
    await this.updateCollaborator(id, assessment);
  },

  // ADMIN / INTERVIEWER: Search candidate on-demand without prefetching the entire dataset
  async searchCollaboratorsForInterview(keyword: string): Promise<Collaborator[]> {
    const raw = keyword.trim();
    if (!raw) return [];

    const upperKey = raw.toUpperCase();
    const lowerKey = raw.toLowerCase();

    if (isFirebaseConfigured && db) {
      try {
        const resultsMap = new Map<string, Collaborator>();

        // 1. Direct O(1) lookup by studentId doc ID
        try {
          const directDoc = await getDoc(doc(db, 'collaborators', upperKey));
          if (directDoc.exists()) {
            const d = directDoc.data();
            resultsMap.set(directDoc.id, {
              id: directDoc.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator);
          }
        } catch {
          // ignore
        }

        // 2. Query where studentId == upperKey
        try {
          const qStudentId = query(collection(db, 'collaborators'), where('studentId', '==', upperKey));
          const snapStudentId = await getDocs(qStudentId);
          snapStudentId.docs.forEach((docSnap) => {
            const d = docSnap.data();
            resultsMap.set(docSnap.id, {
              id: docSnap.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator);
          });
        } catch {
          // ignore
        }

        // 3. Query where phone == raw
        try {
          const qPhone = query(collection(db, 'collaborators'), where('phone', '==', raw));
          const snapPhone = await getDocs(qPhone);
          snapPhone.docs.forEach((docSnap) => {
            const d = docSnap.data();
            resultsMap.set(docSnap.id, {
              id: docSnap.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator);
          });
        } catch {
          // ignore
        }

        // 4. Query where email == lowerKey
        try {
          const qEmail = query(collection(db, 'collaborators'), where('email', '==', lowerKey));
          const snapEmail = await getDocs(qEmail);
          snapEmail.docs.forEach((docSnap) => {
            const d = docSnap.data();
            resultsMap.set(docSnap.id, {
              id: docSnap.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator);
          });
        } catch {
          // ignore
        }

        // If found by exact studentId/phone/email, return immediately!
        if (resultsMap.size > 0) {
          return Array.from(resultsMap.values());
        }

        // 5. Query by fullName prefix range
        try {
          const qName = query(
            collection(db, 'collaborators'),
            where('fullName', '>=', raw),
            where('fullName', '<=', raw + '\uf8ff')
          );
          const snapName = await getDocs(qName);
          snapName.docs.forEach((docSnap) => {
            const d = docSnap.data();
            resultsMap.set(docSnap.id, {
              id: docSnap.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator);
          });
        } catch {
          // ignore
        }

        if (resultsMap.size > 0) {
          return Array.from(resultsMap.values());
        }

        // 6. Targeted fallback if search keyword is substring: query and filter
        const allSnap = await getDocs(collection(db, 'collaborators'));
        return allSnap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ...d,
              adminNote: cleanAdminNote(d.adminNote),
            } as Collaborator;
          })
          .filter((item) => {
            return (
              item.studentId.toLowerCase().includes(lowerKey) ||
              item.fullName.toLowerCase().includes(lowerKey) ||
              (item.phone && item.phone.toLowerCase().includes(lowerKey)) ||
              (item.email && item.email.toLowerCase().includes(lowerKey)) ||
              (item.className && item.className.toLowerCase().includes(lowerKey))
            );
          });
      } catch (err) {
        console.error('[CollaboratorService] searchCollaboratorsForInterview error:', err);
        return [];
      }
    }

    // Local storage fallback
    const all = getLocalCollaborators();
    return all.filter((item) => {
      return (
        item.studentId.toLowerCase().includes(lowerKey) ||
        item.fullName.toLowerCase().includes(lowerKey) ||
        (item.phone && item.phone.toLowerCase().includes(lowerKey)) ||
        (item.email && item.email.toLowerCase().includes(lowerKey)) ||
        (item.className && item.className.toLowerCase().includes(lowerKey))
      );
    });
  },

  // ADMIN: Delete collaborator
  async deleteCollaborator(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'collaborators', id);
      await deleteDoc(docRef);
      const studentId = id.split('_dup_')[0].trim().toUpperCase();
      try {
        await deleteDoc(doc(db, 'collaborator_results', studentId));
      } catch (e) {
        console.warn('Could not delete from collaborator_results:', e);
      }
      return;
    }

    const all = getLocalCollaborators();
    const filtered = all.filter((c) => c.id !== id);
    saveLocalCollaborators(filtered);
  },

  // ADMIN: Batch import collaborators via Firestore Batch Write (Hỗ trợ import cả trùng lặp)
  async batchCreateCollaborators(
    records: Omit<Collaborator, 'id'>[]
  ): Promise<{ inserted: number; updated: number }> {
    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      let count = 0;
      const usedDocIds = new Set<string>();

      for (const rec of records) {
        const studentId = rec.studentId.trim().toUpperCase();
        let docId = studentId;

        // Nếu mã SV đã xuất hiện trong đợt import này hoặc bản ghi là bản ghi trùng lặp,
        // tạo một document ID riêng để không ghi đè dữ liệu cũ
        if (usedDocIds.has(docId) || rec.isDuplicate) {
          const randSuffix = Math.random().toString(36).substring(2, 7);
          docId = `${studentId}_dup_${Date.now()}_${randSuffix}`;
        }
        usedDocIds.add(docId);

        const docRef = doc(db, 'collaborators', docId);
        batch.set(
          docRef,
          {
            ...rec,
            id: docId,
            studentId,
            isDuplicate: Boolean(rec.isDuplicate),
            duplicateTag: rec.duplicateTag || (rec.isDuplicate ? 'Trùng lặp' : null),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Public safe projection
        const pubRef = doc(db, 'collaborator_results', studentId);
        batch.set(
          pubRef,
          {
            studentId,
            fullName: rec.fullName,
            appliedDepartmentId: rec.appliedDepartmentId,
            acceptedDepartmentId: rec.acceptedDepartmentId || null,
            position: rec.position || 'Cộng tác viên',
            status: rec.status,
            publicNote: rec.publicNote || '',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        count++;
      }

      await batch.commit();
      return { inserted: count, updated: 0 };
    }

    // Local storage batch write
    const all = getLocalCollaborators();
    let inserted = 0;

    for (const rec of records) {
      const studentId = rec.studentId.trim().toUpperCase();
      let id = studentId;
      if (rec.isDuplicate || all.some((c) => c.id === id)) {
        id = `${studentId}_dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      const newRec: Collaborator = {
        ...rec,
        id,
        studentId,
        isDuplicate: Boolean(rec.isDuplicate),
        duplicateTag: rec.duplicateTag || (rec.isDuplicate ? 'Trùng lặp' : undefined),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      all.unshift(newRec);
      inserted++;
    }

    saveLocalCollaborators(all);
    return { inserted, updated: 0 };
  },
};
