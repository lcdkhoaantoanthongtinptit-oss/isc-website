import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { WebsiteSettings } from '../types';

export const DEFAULT_SETTINGS: WebsiteSettings = {
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
  email: 'lcdattt@ptit.edu.vn',
  phone: '024.3754.7511',
  facebook: 'https://facebook.com/lcdattt',
  address: 'Văn phòng Đoàn TN Khoa ATTT, Học viện Công nghệ Bưu chính Viễn thông',
  imagekitPublicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  imagekitUrlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
};

export const settingsService = {
  /**
   * Public website settings getter (Strictly sanitized, NEVER contains secret keys)
   */
  async getSettings(): Promise<WebsiteSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'website_settings', 'general'));
        if (snap.exists()) {
          const raw = snap.data() as WebsiteSettings;
          // Security filter: strictly strip any sensitive keys from public payload
          const { imagekitPrivateKey, ...safeData } = raw;
          return { ...DEFAULT_SETTINGS, ...safeData };
        }
      } catch (err) {
        console.error('[Settings] Firestore error:', err);
      }
    }

    const { imagekitPrivateKey, ...safeDefault } = DEFAULT_SETTINGS;
    return safeDefault as WebsiteSettings;
  },

  /**
   * Admin-only settings getter (Includes private keys if caller is authorized Admin)
   */
  async getAdminSettings(): Promise<WebsiteSettings> {
    const publicSettings = await this.getSettings();

    if (isFirebaseConfigured && db) {
      try {
        const secretSnap = await getDoc(doc(db, 'system_settings', 'imagekit'));
        if (secretSnap.exists()) {
          const secretData = secretSnap.data();
          return {
            ...publicSettings,
            imagekitPrivateKey: secretData.privateKey || '',
          };
        }
      } catch {
        // Not admin or system_settings not initialized
      }
    }

    const localPriv = localStorage.getItem('lcd_ik_private_key') || '';
    return {
      ...publicSettings,
      imagekitPrivateKey: localPriv,
    };
  },

  /**
   * Update settings with strict isolation:
   * - Public UI fields go to 'website_settings/general'
   * - Secret keys (e.g. imagekitPrivateKey) go to protected 'system_settings/imagekit'
   */
  async updateSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const { imagekitPrivateKey, ...publicData } = data;

    // 1. If private key provided, save into protected admin-only collection
    if (imagekitPrivateKey !== undefined) {
      if (imagekitPrivateKey) {
        localStorage.setItem('lcd_ik_private_key', imagekitPrivateKey);
      }
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(
            doc(db, 'system_settings', 'imagekit'),
            {
              privateKey: imagekitPrivateKey,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('[Settings] Could not save system_settings secret:', err);
        }
      }
    }

    // 2. Save public fields to 'website_settings/general'
    const current = await this.getSettings();
    const updatedPublic: WebsiteSettings = {
      ...current,
      ...publicData,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(
        doc(db, 'website_settings', 'general'),
        {
          ...updatedPublic,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return {
      ...updatedPublic,
      imagekitPrivateKey,
    };
  },
};

