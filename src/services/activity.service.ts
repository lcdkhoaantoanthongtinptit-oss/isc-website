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

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act_ptit_ctf_2026',
    title: 'Giải đấu Cyber Security CTF Thường niên 2026 - PTIT CTF',
    slug: 'giai-dau-cyber-security-ctf-ptit-2026',
    category: 'Công nghệ',
    isFeatured: true,
    isPublished: true,
    location: 'Hội trường A2 - Học viện Công nghệ Bưu chính Viễn thông',
    eventDate: '2026-04-18T08:00:00.000Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    shortDescription:
      'Sân chơi học thuật bảo mật chuyên sâu dành cho sinh viên Học viện với các mảng Web Exploitation, Reverse Engineering, Pwnable, Cryptography và Forensic.',
    description: `Giải đấu Cyber Security CTF là sự kiện thường niên do Liên chi đoàn Khoa An toàn thông tin tổ chức, nhằm tạo sân chơi thực chiến giúp sinh viên rèn luyện tư duy phân tích, giải mã và khai thác lỗ hổng bảo mật.
    
Các đội thi sẽ tranh tài liên tục trong 12 giờ ở các thử thách đa dạng từ cơ bản đến nâng cao. Ban tổ chức và các cựu sinh viên đang làm việc tại các tập đoàn an ninh mạng hàng đầu sẽ trực tiếp chấm điểm và trao giải.`,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'act_workshop_soc_pentest_2026',
    title: 'Hội thảo Công nghệ: Lộ trình nghề nghiệp SOC & Pentest trong kỷ nguyên AI',
    slug: 'hoi-thao-lo-trinh-nghe-nghiep-soc-pentest',
    category: 'Học thuật',
    isFeatured: true,
    isPublished: true,
    location: 'Phòng Hội thảo Quốc tế - Học viện CNBCVT',
    eventDate: '2026-03-28T14:00:00.000Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
    shortDescription:
      'Gặp gỡ và đối thoại cùng các chuyên gia hàng đầu từ các trung tâm giám sát an ninh mạng, giải đáp lộ trình nghề nghiệp và định hướng kỹ năng thực tế.',
    description: `Hội thảo mang đến cái nhìn toàn cảnh về thị trường việc làm An toàn thông tin hiện nay, đặc biệt là vai trò của kỹ sư SOC (Security Operations Center) và chuyên gia đánh giá lỗ hổng Pentest.
    
Sinh viên tham gia sẽ được chia sẻ kinh nghiệm ứng tuyển, thực tập và phương pháp tự xây dựng lab thực hành tại nhà.`,
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'act_volunteer_summer_2026',
    title: 'Chiến dịch Tình nguyện Mùa hè xanh - Tuổi trẻ ATTT vì cộng đồng số',
    slug: 'chien-dich-tinh-nguyen-mua-he-xanh-2026',
    category: 'Tình nguyện',
    isFeatured: true,
    isPublished: true,
    location: 'Địa bàn tỉnh miền núi phía Bắc',
    eventDate: '2026-07-10T07:30:00.000Z',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop',
    shortDescription:
      'Hành trình mang tri thức số, tuyên truyền kỹ năng phòng chống lừa đảo trực tuyến và an toàn trên mạng xã hội cho thanh thiếu niên địa phương.',
    description: `Chiến dịch tình nguyện cao điểm của đoàn viên thanh niên Liên chi đoàn Khoa ATTT. Bên cạnh các hoạt động an sinh xã hội, đội ngũ tình nguyện viên sẽ trực tiếp đứng lớp hướng dẫn người dân và học sinh kỹ năng sử dụng Internet an toàn, bảo vệ thông tin cá nhân.`,
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
  },
];

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
        return parsed.filter((a: Activity) => !deletedIds.has(a.id));
      }
    } catch {
      // ignore
    }
  }
  // Initialize default activities only if never set before, respecting any deleted IDs
  const initial = DEFAULT_ACTIVITIES.filter((a) => !deletedIds.has(a.id));
  saveLocalActivities(initial);
  return initial;
}

function saveLocalActivities(list: Activity[]) {
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(list));
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

        // Filter out any explicitly deleted IDs
        docs = docs.filter((a) => !deletedIds.has(a.id));

        if (docs.length > 0) {
          saveLocalActivities(docs);
          return docs;
        }

        // When Firestore collection has 0 documents (empty or not seeded yet),
        // fallback to local activities which respect deleted IDs
        const local = getLocalActivities();
        if (onlyPublished) {
          return local.filter((a) => a.isPublished !== false);
        }
        return local;
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
