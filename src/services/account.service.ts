import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { db, isFirebaseConfigured, firebaseConfig } from './firebase';
import { AdminRole, AdminUser } from '../types';
import { ROLE_PERMISSIONS } from './auth.service';

const LOCAL_MANAGED_KEY = 'lcd_managed_accounts';

// Legacy mock staff emails to purge
const MOCK_STAFF_EMAILS = new Set([
  'admin@lcdattt.edu.vn',
  'tuyendung@lcdattt.edu.vn',
  'truyenthong@lcdattt.edu.vn',
  'truongban@lcdattt.edu.vn',
  'phongvan@lcdattt.edu.vn',
]);

export interface CreateAccountInput {
  email: string;
  password: string;
  displayName: string;
  role: AdminRole;
  departmentId?: string | null;
  departmentName?: string | null;
  permissions?: string[];
}

export interface ManagedAccountItem extends AdminUser {
  pass?: string;
  departmentName?: string | null;
}

function getLocalAccounts(): ManagedAccountItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MANAGED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter((a) => !MOCK_STAFF_EMAILS.has((a.email || '').toLowerCase()));
      }
    }
  } catch (err) {
    console.error('Error parsing local accounts:', err);
  }

  return [];
}

function saveLocalAccounts(list: ManagedAccountItem[]) {
  const cleanList = list.filter((a) => !MOCK_STAFF_EMAILS.has((a.email || '').toLowerCase()));
  localStorage.setItem(LOCAL_MANAGED_KEY, JSON.stringify(cleanList));
}

export const accountService = {
  // Lấy toàn bộ danh sách tài khoản cán bộ thực tế
  async getAccounts(): Promise<ManagedAccountItem[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const firestoreUsers: ManagedAccountItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              email: data.email || '',
              displayName: data.displayName || 'Cán bộ LCĐ',
              role: (data.role as AdminRole) || 'interviewer',
              departmentId: data.departmentId || null,
              departmentName: data.departmentName || null,
              permissions:
                data.permissions || ROLE_PERMISSIONS[data.role as AdminRole]?.allowedPaths || [],
              createdAt: data.createdAt
                ? data.createdAt?.toDate
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : new Date().toISOString(),
            };
          });

          // Filter out any mock emails
          return firestoreUsers.filter(
            (u) => !MOCK_STAFF_EMAILS.has((u.email || '').toLowerCase())
          );
        }
        return [];
      } catch (err) {
        console.warn('[AccountService] Firestore query error:', err);
        return [];
      }
    }

    return getLocalAccounts();
  },

  // Tạo tài khoản mới
  async createAccount(input: CreateAccountInput): Promise<ManagedAccountItem> {
    const cleanEmail = input.email.trim().toLowerCase();
    const role = input.role;
    const permissions =
      Array.isArray(input.permissions)
        ? input.permissions
        : ROLE_PERMISSIONS[role]?.allowedPaths || [];

    let newUid = `user_${Date.now()}`;

    // 1. If Firebase is active, create user via secondary Firebase App to preserve Admin session
    if (isFirebaseConfigured && firebaseConfig.apiKey) {
      let secondaryApp;
      try {
        secondaryApp = initializeApp(firebaseConfig, `SecondaryAuth_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, input.password);
        newUid = userCred.user.uid;

        if (input.displayName) {
          await updateProfile(userCred.user, { displayName: input.displayName });
        }
        await signOut(secondaryAuth);
      } catch (authErr: any) {
        console.error('[AccountService] Firebase Auth creation error:', authErr);
        let msg = authErr.message;
        if (authErr.code === 'auth/admin-restricted-operation') {
          msg =
            'Chưa bật Email/Password trên Firebase Console: Bạn cần vào Firebase Console > Authentication > Sign-in method và BẬT (Enable) "Email/Password" để có thể tạo và đăng nhập tài khoản.';
        } else if (authErr.code === 'auth/email-already-in-use') {
          msg = 'Email này đã được sử dụng bởi một tài khoản khác.';
        } else if (authErr.code === 'auth/weak-password') {
          msg = 'Mật khẩu quá yếu, vui lòng chọn tối thiểu 6 ký tự.';
        } else if (authErr.code === 'auth/invalid-email') {
          msg = 'Địa chỉ email không đúng định dạng.';
        }
        throw new Error(msg);
      } finally {
        if (secondaryApp) {
          try {
            await deleteApp(secondaryApp);
          } catch {
            // ignore
          }
        }
      }

      // 2. Save user metadata into Firestore 'users' collection
      if (db) {
        try {
          await setDoc(doc(db, 'users', newUid), {
            uid: newUid,
            email: cleanEmail,
            displayName: input.displayName,
            role,
            departmentId: input.departmentId || null,
            departmentName: input.departmentName || null,
            permissions,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.error('[AccountService] Firestore save user error:', dbErr);
        }
      }
    }

    // 3. Update local cache
    const newItem: ManagedAccountItem = {
      uid: newUid,
      email: cleanEmail,
      displayName: input.displayName,
      role,
      departmentId: input.departmentId || null,
      departmentName: input.departmentName || null,
      permissions,
      pass: input.password,
      createdAt: new Date().toISOString(),
    };

    const list = getLocalAccounts().filter((a) => (a.email || '').toLowerCase() !== cleanEmail);
    list.unshift(newItem);
    saveLocalAccounts(list);

    return newItem;
  },

  // Cập nhật thông tin / quyền hạn tài khoản
  async updateAccount(
    uid: string,
    data: {
      displayName?: string;
      role?: AdminRole;
      departmentId?: string | null;
      departmentName?: string | null;
      permissions?: string[];
      password?: string;
    }
  ): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const updatePayload: any = {
          updatedAt: serverTimestamp(),
        };
        if (data.displayName !== undefined) updatePayload.displayName = data.displayName;
        if (data.role !== undefined) updatePayload.role = data.role;
        if (data.departmentId !== undefined) updatePayload.departmentId = data.departmentId;
        if (data.departmentName !== undefined) updatePayload.departmentName = data.departmentName;
        if (data.permissions !== undefined) updatePayload.permissions = data.permissions;

        await updateDoc(doc(db, 'users', uid), updatePayload);
      } catch (err) {
        console.warn('[AccountService] updateDoc error:', err);
      }
    }

    // Update local cache
    const list = getLocalAccounts();
    const idx = list.findIndex((a) => a.uid === uid);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (data.password) {
        list[idx].pass = data.password;
      }
      saveLocalAccounts(list);
    }

    // Synchronize active logged in session if editing current user
    try {
      const activeRaw = localStorage.getItem('lcd_admin_session');
      if (activeRaw) {
        const activeUser = JSON.parse(activeRaw);
        if (
          activeUser.uid === uid ||
          (idx !== -1 && activeUser.email?.toLowerCase() === list[idx].email?.toLowerCase())
        ) {
          const updatedActive = {
            ...activeUser,
            ...(data.displayName !== undefined && { displayName: data.displayName }),
            ...(data.role !== undefined && { role: data.role }),
            ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
            ...(data.departmentName !== undefined && { departmentName: data.departmentName }),
            ...(data.permissions !== undefined && { permissions: data.permissions }),
          };
          localStorage.setItem('lcd_admin_session', JSON.stringify(updatedActive));
        }
      }
    } catch (sessionErr) {
      console.warn('[AccountService] Could not update active session:', sessionErr);
    }
  },

  // Xóa tài khoản cán bộ
  async deleteAccount(uid: string, currentUid?: string): Promise<void> {
    if (currentUid && uid === currentUid) {
      throw new Error('Bạn không thể tự xóa tài khoản của chính mình đang đăng nhập!');
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.warn('[AccountService] deleteDoc error:', err);
      }
    }

    const list = getLocalAccounts().filter((a) => a.uid !== uid);
    saveLocalAccounts(list);
  },
};
