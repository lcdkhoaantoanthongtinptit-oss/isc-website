import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { WebsiteSettings } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// SENSITIVE FIELDS: These fields MUST NEVER appear in website_settings/general.
// They are allowed only in system_settings/imagekit (admin-only Firestore)
// and lcd_ik_* localStorage keys (admin client only).
// ─────────────────────────────────────────────────────────────────────────────
const SENSITIVE_FIELDS = ['imagekitPrivateKey', 'imagekitPublicKey', 'imagekitUrlEndpoint'] as const;

type SensitiveKey = typeof SENSITIVE_FIELDS[number];

/** Strip ALL imagekit keys from any arbitrary object before writing to public store */
function stripSensitive<T extends Record<string, any>>(obj: T): Omit<T, SensitiveKey> {
  const result = { ...obj };
  for (const key of SENSITIVE_FIELDS) {
    delete result[key];
  }
  return result as Omit<T, SensitiveKey>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default PUBLIC settings — NO imagekit keys here
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: Omit<WebsiteSettings, SensitiveKey> = {
  organizationName: 'LIÊN CHI ĐOÀN KHOA AN TOÀN THÔNG TIN',
  shortName: 'ISC - Information Security Council',
  foundedYear: '2025',
  heroTitle: 'LIÊN CHI ĐOÀN KHOA AN TOÀN THÔNG TIN',
  heroSubtitle: 'Đoàn kết - Tiên phong - Sáng tạo - Bản lĩnh thời đại số',
  heroDescription:
    'Môi trường rèn luyện toàn diện, gắn kết sinh viên Khoa An toàn thông tin cùng phát triển học thuật, kỹ năng và khát vọng tuổi trẻ.',
  aboutDescription:
    'Liên chi đoàn Khoa An toàn thông tin (ISC - Information Security Council) được thành lập năm 2025 theo Nghị quyết của Đoàn Học viện Công nghệ Bưu chính Viễn thông.',
  recruitmentTitle: 'TUYỂN CỘNG TÁC VIÊN THẾ HỆ MỚI',
  recruitmentSubtitle: 'Đồng hành cùng LCĐ Khoa An toàn thông tin xây dựng môi trường phát triển toàn diện',
  totalStudents: 1500,
  totalActivities: 35,
  totalCollaborators: 80,
  activeYears: 2,
  email: 'lcdkhoaantoanthongtinptit@gmail.com',
  phone: '038 800 7519',
  facebook: 'https://www.facebook.com/lcd.attt.ptit',
  address: 'Văn phòng Đoàn TN Khoa ATTT, Học viện Công nghệ Bưu chính Viễn thông, 96A, Trần Phú, Hà Đông, Hà Nội',
  isResultPublic: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — imagekit credentials stored in SEPARATE keys
// ─────────────────────────────────────────────────────────────────────────────
const LS_PUBLIC_SETTINGS = 'lcd_website_settings'; // safe public settings cache
const LS_IK_PUBLIC = 'lcd_ik_public_key';
const LS_IK_PRIVATE = 'lcd_ik_private_key';
const LS_IK_ENDPOINT = 'lcd_ik_url_endpoint';

export const settingsService = {
  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC API — Never returns any imagekit credentials
  // ───────────────────────────────────────────────────────────────────────────
  async getSettings(): Promise<WebsiteSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'website_settings', 'general'));
        if (snap.exists()) {
          // Forcefully strip ALL sensitive fields regardless of what Firestore returns
          const safeData = stripSensitive(snap.data());
          return { ...DEFAULT_SETTINGS, ...safeData } as WebsiteSettings;
        }
      } catch (err) {
        console.error('[Settings] Firestore error:', err);
      }
    }

    // Offline/demo mode: load from local cache (also stripped on write)
    const localRaw = localStorage.getItem(LS_PUBLIC_SETTINGS);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        const safeData = stripSensitive(parsed);
        return { ...DEFAULT_SETTINGS, ...safeData } as WebsiteSettings;
      } catch {
        // ignore
      }
    }

    return { ...DEFAULT_SETTINGS } as WebsiteSettings;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ADMIN API — Merges public settings with imagekit credentials from the
  // protected system_settings/imagekit collection (admin-only Firestore rules)
  // ───────────────────────────────────────────────────────────────────────────
  async getAdminSettings(): Promise<WebsiteSettings> {
    const publicSettings = await this.getSettings();

    // Read imagekit credentials from their own isolated sources
    let imagekitPublicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';
    let imagekitPrivateKey = '';
    let imagekitUrlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';

    if (isFirebaseConfigured && db) {
      try {
        const secretSnap = await getDoc(doc(db, 'system_settings', 'imagekit'));
        if (secretSnap.exists()) {
          const d = secretSnap.data();
          if (d.publicKey) imagekitPublicKey = d.publicKey;
          if (d.privateKey) imagekitPrivateKey = d.privateKey;
          if (d.urlEndpoint) imagekitUrlEndpoint = d.urlEndpoint;
        }
      } catch {
        // Not admin or system_settings not initialized — fall through to localStorage
      }
    }

    // localStorage fallback for offline/demo mode
    if (!imagekitPublicKey) imagekitPublicKey = localStorage.getItem(LS_IK_PUBLIC) || '';
    if (!imagekitPrivateKey) imagekitPrivateKey = localStorage.getItem(LS_IK_PRIVATE) || '';
    if (!imagekitUrlEndpoint) imagekitUrlEndpoint = localStorage.getItem(LS_IK_ENDPOINT) || '';

    return {
      ...publicSettings,
      imagekitPublicKey,
      imagekitPrivateKey,
      imagekitUrlEndpoint,
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Update settings with strict security isolation:
  //   • imagekitPublicKey / imagekitPrivateKey / imagekitUrlEndpoint
  //     → ONLY written to protected system_settings/imagekit (admin Firestore)
  //     → NEVER touch website_settings/general
  //   • All other public UI fields → website_settings/general (public-readable)
  // ───────────────────────────────────────────────────────────────────────────
  async updateSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const {
      imagekitPublicKey,
      imagekitPrivateKey,
      imagekitUrlEndpoint,
      ...rawPublicData
    } = data;

    // 1. Save imagekit credentials to protected isolated storage
    const hasIkUpdate = imagekitPublicKey !== undefined || imagekitPrivateKey !== undefined || imagekitUrlEndpoint !== undefined;
    if (hasIkUpdate) {
      // localStorage (offline/demo)
      if (imagekitPublicKey !== undefined) localStorage.setItem(LS_IK_PUBLIC, imagekitPublicKey);
      if (imagekitPrivateKey !== undefined) localStorage.setItem(LS_IK_PRIVATE, imagekitPrivateKey);
      if (imagekitUrlEndpoint !== undefined) localStorage.setItem(LS_IK_ENDPOINT, imagekitUrlEndpoint);

      // Firestore protected collection (will fail silently if not admin)
      if (isFirebaseConfigured && db) {
        try {
          const ikPayload: Record<string, any> = { updatedAt: serverTimestamp() };
          if (imagekitPublicKey !== undefined) ikPayload.publicKey = imagekitPublicKey;
          if (imagekitPrivateKey !== undefined) ikPayload.privateKey = imagekitPrivateKey;
          if (imagekitUrlEndpoint !== undefined) ikPayload.urlEndpoint = imagekitUrlEndpoint;
          await setDoc(doc(db, 'system_settings', 'imagekit'), ikPayload, { merge: true });
        } catch (err) {
          console.warn('[Settings] Could not save system_settings/imagekit:', err);
        }
      }
    }

    // 2. Save public UI fields — with a hard strip to guarantee no leak
    const publicData = stripSensitive(rawPublicData);
    const current = await this.getSettings();
    const updatedPublic = stripSensitive({
      ...current,
      ...publicData,
      updatedAt: new Date().toISOString(),
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(
          doc(db, 'website_settings', 'general'),
          { ...updatedPublic, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        console.warn('[Settings] Could not save website_settings/general:', err);
      }
    }

    // Cache public-only data locally (safe, no imagekit keys)
    localStorage.setItem(LS_PUBLIC_SETTINGS, JSON.stringify(updatedPublic));

    // Return full admin view for the UI to reflect saved values
    return {
      ...updatedPublic,
      imagekitPublicKey: imagekitPublicKey ?? localStorage.getItem(LS_IK_PUBLIC) ?? '',
      imagekitPrivateKey: imagekitPrivateKey ?? localStorage.getItem(LS_IK_PRIVATE) ?? '',
      imagekitUrlEndpoint: imagekitUrlEndpoint ?? localStorage.getItem(LS_IK_ENDPOINT) ?? '',
    } as WebsiteSettings;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // One-time cleanup: removes any previously leaked imagekit keys from
  // the public Firestore document. Call once after upgrading.
  // ───────────────────────────────────────────────────────────────────────────
  async purgeLeakedKeysFromPublicDoc(): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const snap = await getDoc(doc(db, 'website_settings', 'general'));
      if (!snap.exists()) return;
      const raw = snap.data() as Record<string, any>;
      const hasLeak = SENSITIVE_FIELDS.some((k) => k in raw);
      if (!hasLeak) return;

      // Overwrite with a clean version — Firestore setDoc with explicit fields
      const clean = stripSensitive(raw);
      await setDoc(doc(db, 'website_settings', 'general'), clean);
      console.info('[Settings] ✅ Purged leaked imagekit keys from website_settings/general');
    } catch (err) {
      console.warn('[Settings] Could not purge leaked keys:', err);
    }
  },
};
