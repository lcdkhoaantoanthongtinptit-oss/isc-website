import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';
import { imagekitService, ImageKitUploadResponse } from './imagekit.service';

export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
};

export const storageService = {
  // Validate file before upload
  validateImageFile(file: File, options: UploadOptions = DEFAULT_OPTIONS): { valid: boolean; error?: string } {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (!opts.allowedTypes?.includes(file.type)) {
      return {
        valid: false,
        error: `Định dạng tệp không được hỗ trợ (${file.type}). Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, SVG.`,
      };
    }
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > (opts.maxSizeMB || 10)) {
      return {
        valid: false,
        error: `Kích thước tệp vượt quá giới hạn cho phép (${sizeInMB.toFixed(2)}MB / tối đa ${opts.maxSizeMB}MB).`,
      };
    }
    return { valid: true };
  },

  /**
   * Upload image using ImageKit.io as priority service
   * Falls back to Firebase Storage or Base64 demo URL if ImageKit is not configured
   */
  async uploadImage(path: string, file: File): Promise<string> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 1. Try ImageKit.io first if configured
    if (imagekitService.isConfigured()) {
      try {
        const folder = path.includes('/') ? `/${path.split('/')[0]}` : '/lcdattt';
        const res: ImageKitUploadResponse = await imagekitService.uploadFile(file, { folder });
        if (res && res.url) {
          return res.url;
        }
      } catch (err: any) {
        console.warn('[Storage] ImageKit upload error, attempting fallback:', err);
        // If ImageKit specifically failed due to bad keys, rethrow or try Firebase if available
        if (!isFirebaseConfigured && !storage) {
          throw new Error(`Lỗi tải ảnh lên ImageKit: ${err.message || err}`);
        }
      }
    }

    // 2. Fallback to Firebase Storage if configured
    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type,
        });
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
      } catch (err: any) {
        console.warn('[Storage] Firebase Storage upload error, falling back to local data URL:', err);
      }
    }

    // 3. Local/Demo fallback: Base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },
};

export { imagekitService };
