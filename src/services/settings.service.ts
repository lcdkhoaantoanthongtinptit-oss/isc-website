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
};

export const settingsService = {
  async getSettings(): Promise<WebsiteSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'website_settings', 'general'));
        if (snap.exists()) {
          return snap.data() as WebsiteSettings;
        }
      } catch (err) {
        console.error('[Settings] Firestore error:', err);
      }
    }

    return DEFAULT_SETTINGS;
  },

  async updateSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const current = await this.getSettings();
    const updated: WebsiteSettings = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(
        doc(db, 'website_settings', 'general'),
        {
          ...updated,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return updated;
  },
};

