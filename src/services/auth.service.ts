import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  IdTokenResult,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { AdminUser, AdminRole } from '../types';

const LOCAL_ADMIN_KEY = 'lcd_admin_session';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<
  AdminRole,
  {
    label: string;
    description: string;
    allowedPaths: string[];
  }
> = {
  admin: {
    label: 'Quản trị viên Cấp cao',
    description: 'Toàn quyền truy cập và quản lý tất cả các chức năng hệ thống',
    allowedPaths: [
      '/admin/dashboard',
      '/admin/collaborators',
      '/admin/interview',
      '/admin/activities',
      '/admin/executive-members',
      '/admin/accounts',
      '/admin/settings',
      '/admin/profile',
    ],
  },
  secretary: {
    label: 'Bí thư LCĐ',
    description: 'Lãnh đạo cao nhất Liên chi đoàn, toàn quyền quản trị và điều hành toàn bộ hệ thống',
    allowedPaths: [
      '/admin/dashboard',
      '/admin/collaborators',
      '/admin/interview',
      '/admin/activities',
      '/admin/executive-members',
      '/admin/accounts',
      '/admin/settings',
      '/admin/profile',
    ],
  },
  deputy_secretary: {
    label: 'Phó Bí thư LCĐ',
    description: 'Phó Bí thư Liên chi đoàn, phụ trách chỉ đạo và điều hành công tác Đoàn - Hội',
    allowedPaths: [
      '/admin/dashboard',
      '/admin/collaborators',
      '/admin/interview',
      '/admin/activities',
      '/admin/executive-members',
      '/admin/accounts',
      '/admin/profile',
    ],
  },
  lead: {
    label: 'Trưởng ban',
    description: 'Truy cập Tổng quan, Quản lý hồ sơ CTV, Phỏng vấn, Hoạt động & Sự kiện và Ban Chấp hành',
    allowedPaths: [
      '/admin/dashboard',
      '/admin/collaborators',
      '/admin/interview',
      '/admin/activities',
      '/admin/executive-members',
      '/admin/profile',
    ],
  },
  deputy_lead: {
    label: 'Phó Ban',
    description: 'Phó trưởng ban chuyên môn, phối hợp quản lý CTV, phỏng vấn và hoạt động ban',
    allowedPaths: [
      '/admin/dashboard',
      '/admin/collaborators',
      '/admin/interview',
      '/admin/activities',
      '/admin/executive-members',
      '/admin/profile',
    ],
  },
  interviewer: {
    label: 'Cán bộ Phỏng vấn',
    description: 'Được quyền tra cứu, phỏng vấn và chấm điểm hồ sơ thí sinh CTV',
    allowedPaths: ['/admin/interview', '/admin/collaborators'],
  },
  recruiter: {
    label: 'Cán bộ Tuyển CTV',
    description: 'Chỉ có quyền xem Quản lý hồ sơ ứng viên / CTV',
    allowedPaths: ['/admin/collaborators', '/admin/interview'],
  },
  editor: {
    label: 'Cán bộ Truyền thông',
    description: 'Chỉ có quyền Quản lý Hoạt động & Sự kiện và Ban Chấp hành',
    allowedPaths: ['/admin/activities', '/admin/executive-members'],
  },
};

// Helper to check if a user has permission to access a path
export function hasPathPermission(user: AdminUser | null, pathname: string): boolean {
  if (!user) return false;

  // The base admin root entry point is allowed for any authenticated staff user
  if (pathname === '/admin' || pathname === '/admin/') {
    return true;
  }

  // 1. If user has custom explicit permissions configured, STRICTLY enforce them!
  if (Array.isArray(user.permissions)) {
    return user.permissions.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  // 2. Fallback: only if user has no explicit custom permissions configured
  if (['admin', 'secretary'].includes(user.role)) return true;

  const config = ROLE_PERMISSIONS[user.role];
  if (!config) return false;
  return config.allowedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const authService = {
  // Sign in with Email and Password ONLY
  async login(email: string, pass: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();

    // Authenticate with Firebase Authentication
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const user = userCredential.user;
        const adminUser = await this.resolveUserProfile(user);

        // Save session locally
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminUser));
        return adminUser;
      } catch (fbErr: any) {
        console.error('Firebase Auth Login Error:', fbErr);

        let errMsg = 'Email hoặc mật khẩu không chính xác.';
        if (fbErr.code === 'auth/admin-restricted-operation') {
          errMsg =
            'Chưa bật phương thức tạo tài khoản';
        } else if (fbErr.code === 'auth/user-not-found') {
          errMsg = 'Tài khoản không tồn tại trên hệ thống. Vui lòng kiểm tra lại email.';
        } else if (
          fbErr.code === 'auth/wrong-password' ||
          fbErr.code === 'auth/invalid-credential' ||
          fbErr.code === 'auth/invalid-login-credentials'
        ) {
          errMsg = 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        } else if (fbErr.code === 'auth/invalid-email') {
          errMsg = 'Địa chỉ email không hợp lệ.';
        } else if (fbErr.code === 'auth/too-many-requests') {
          errMsg = 'Đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau vài phút.';
        } else if (fbErr.message) {
          errMsg = fbErr.message;
        }
        throw new Error(errMsg);
      }
    }

    throw new Error(
      'Hệ thống xác thực Firebase chưa được kết nối. Vui lòng cấu hình biến môi trường Firebase.'
    );
  },

  // Resolve user role & permissions from Firestore 'users' collection or custom claims
  async resolveUserProfile(user: User): Promise<AdminUser> {
    try {
      const email = (user.email || '').toLowerCase();

      // 1. Check token custom claim if assigned via Firebase Admin SDK
      try {
        const tokenResult: IdTokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.role) {
          const role = tokenResult.claims.role as AdminRole;
          if (
            [
              'admin',
              'secretary',
              'deputy_secretary',
              'lead',
              'deputy_lead',
              'interviewer',
              'recruiter',
              'editor',
            ].includes(role)
          ) {
            return {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Cán bộ LCĐ',
              role,
              permissions: ROLE_PERMISSIONS[role]?.allowedPaths || [],
            };
          }
        }
      } catch (tokenErr) {
        console.warn('Could not read custom claims:', tokenErr);
      }

      // 2. Check Firestore 'users' collection
      if (db) {
        let userDocData: any = null;

        // A. Look up by user.uid
        try {
          const uidDocRef = doc(db, 'users', user.uid);
          const uidSnap = await getDoc(uidDocRef);
          if (uidSnap.exists()) {
            userDocData = uidSnap.data();
          }
        } catch (e) {
          console.warn('UID lookup note:', e);
        }

        // B. Look up by Email document ID (if created in Console with email as ID)
        if (!userDocData && email) {
          try {
            const emailDocRef = doc(db, 'users', email);
            const emailSnap = await getDoc(emailDocRef);
            if (emailSnap.exists()) {
              userDocData = emailSnap.data();
            }
          } catch (e) {
            console.warn('Email ID lookup note:', e);
          }
        }

        // C. Look up by query where('email', '==', email)
        if (!userDocData && email) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userDocData = qSnap.docs[0].data();
            }
          } catch (e) {
            console.warn('Email query note:', e);
          }
        }

        // If user document found in Firestore, use its role
        if (userDocData) {
          const rawRole = (userDocData.role || 'admin').toLowerCase();
          const validRole: AdminRole = [
            'admin',
            'secretary',
            'deputy_secretary',
            'lead',
            'deputy_lead',
            'interviewer',
            'recruiter',
            'editor',
          ].includes(rawRole)
            ? (rawRole as AdminRole)
            : 'admin';

          return {
            uid: user.uid,
            email: user.email,
            displayName:
              userDocData.displayName ||
              user.displayName ||
              email.split('@')[0] ||
              'Cán bộ LCĐ',
            photoURL: userDocData.photoURL || userDocData.avatarUrl || user.photoURL || null,
            avatarUrl: userDocData.avatarUrl || userDocData.photoURL || user.photoURL || null,
            phone: userDocData.phone || null,
            studentId: userDocData.studentId || null,
            className: userDocData.className || null,
            cohort: userDocData.cohort || null,
            bio: userDocData.bio || null,
            facebookUrl: userDocData.facebookUrl || null,
            role: validRole,
            position: userDocData.position || null,
            linkedMemberId: userDocData.linkedMemberId || null,
            departmentId: userDocData.departmentId || null,
            departmentName: userDocData.departmentName || null,
            permissions:
              userDocData.permissions || ROLE_PERMISSIONS[validRole]?.allowedPaths || [],
          };
        }

        // D. If no document exists in Firestore 'users' yet:
        // Automatically create a user document with role: 'admin' so the user doesn't get locked out!
        try {
          const autoData = {
            email: user.email,
            displayName: user.displayName || email.split('@')[0] || 'Quản trị viên',
            photoURL: user.photoURL || null,
            role: 'admin',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', user.uid), autoData, { merge: true });
        } catch (setErr) {
          console.warn('Could not auto-create user document in users collection:', setErr);
        }
      }

      // Default: If successfully authenticated via Firebase Auth, grant admin role
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0] || 'Quản trị viên LCĐ',
        photoURL: user.photoURL || null,
        avatarUrl: user.photoURL || null,
        role: 'admin',
        permissions: ROLE_PERMISSIONS['admin'].allowedPaths,
      };
    } catch (err) {
      console.error('Error resolving user profile:', err);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email || 'Quản trị viên LCĐ',
        photoURL: user.photoURL || null,
        avatarUrl: user.photoURL || null,
        role: 'admin',
        permissions: ROLE_PERMISSIONS['admin'].allowedPaths,
      };
    }
  },

  // Update current logged-in user profile
  async updateCurrentUserProfile(data: {
    displayName?: string;
    photoURL?: string | null;
    phone?: string | null;
    studentId?: string | null;
    className?: string | null;
    cohort?: string | null;
    bio?: string | null;
    facebookUrl?: string | null;
    position?: string | null;
    linkedMemberId?: string | null;
    newPassword?: string;
  }): Promise<AdminUser> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    // 1. Update Firebase Auth Profile & Password if Firebase is configured
    if (isFirebaseConfigured && auth && auth.currentUser) {
      const fbUser = auth.currentUser;
      const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (data.displayName !== undefined) profileUpdates.displayName = data.displayName;
      if (data.photoURL !== undefined) profileUpdates.photoURL = data.photoURL;

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(fbUser, profileUpdates);
      }

      if (data.newPassword && data.newPassword.trim()) {
        try {
          await updatePassword(fbUser, data.newPassword.trim());
        } catch (pwErr: any) {
          console.error('Error updating password:', pwErr);
          if (pwErr.code === 'auth/requires-recent-login') {
            throw new Error(
              'Để đổi mật khẩu, bạn cần đăng xuất và đăng nhập lại gần đây nhằm xác thực bảo mật.'
            );
          } else if (pwErr.code === 'auth/weak-password') {
            throw new Error('Mật khẩu mới quá yếu. Vui lòng nhập tối thiểu 6 ký tự.');
          }
          throw pwErr;
        }
      }
    }

    // 2. Update Firestore 'users' collection
    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        const firestoreData: any = {
          updatedAt: serverTimestamp(),
        };
        if (data.displayName !== undefined) firestoreData.displayName = data.displayName;
        if (data.photoURL !== undefined) {
          firestoreData.photoURL = data.photoURL;
          firestoreData.avatarUrl = data.photoURL;
        }
        if (data.phone !== undefined) firestoreData.phone = data.phone;
        if (data.studentId !== undefined) firestoreData.studentId = data.studentId;
        if (data.className !== undefined) firestoreData.className = data.className;
        if (data.cohort !== undefined) firestoreData.cohort = data.cohort;
        if (data.bio !== undefined) firestoreData.bio = data.bio;
        if (data.facebookUrl !== undefined) firestoreData.facebookUrl = data.facebookUrl;
        if (data.position !== undefined) firestoreData.position = data.position;
        if (data.linkedMemberId !== undefined) firestoreData.linkedMemberId = data.linkedMemberId;

        await setDoc(doc(db, 'users', currentUser.uid), firestoreData, { merge: true });
      } catch (fsErr) {
        console.warn('Could not update profile in Firestore:', fsErr);
      }
    }

    // 3. Update localStorage session
    const updatedUser: AdminUser = {
      ...currentUser,
      displayName: data.displayName !== undefined ? data.displayName : currentUser.displayName,
      photoURL: data.photoURL !== undefined ? data.photoURL : currentUser.photoURL,
      avatarUrl: data.photoURL !== undefined ? data.photoURL : currentUser.avatarUrl,
      phone: data.phone !== undefined ? data.phone : currentUser.phone,
      studentId: data.studentId !== undefined ? data.studentId : currentUser.studentId,
      className: data.className !== undefined ? data.className : currentUser.className,
      cohort: data.cohort !== undefined ? data.cohort : currentUser.cohort,
      bio: data.bio !== undefined ? data.bio : currentUser.bio,
      facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl : currentUser.facebookUrl,
      position: data.position !== undefined ? data.position : currentUser.position,
      linkedMemberId: data.linkedMemberId !== undefined ? data.linkedMemberId : currentUser.linkedMemberId,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Logout
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout warning:', e);
      }
    }
    localStorage.removeItem(LOCAL_ADMIN_KEY);
  },

  // Get current logged-in user
  getCurrentUser(): Promise<AdminUser | null> {
    return new Promise((resolve) => {
      if (isFirebaseConfigured && auth) {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (!user) {
            const saved = localStorage.getItem(LOCAL_ADMIN_KEY);
            if (saved) {
              try {
                resolve(JSON.parse(saved));
                return;
              } catch {
                resolve(null);
                return;
              }
            }
            resolve(null);
            return;
          }

          const adminUser = await this.resolveUserProfile(user);
          localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminUser));
          resolve(adminUser);
        });
      } else {
        const saved = localStorage.getItem(LOCAL_ADMIN_KEY);
        if (saved) {
          try {
            resolve(JSON.parse(saved));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }
    });
  },
};

