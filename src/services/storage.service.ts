import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';
import { imagekitService, ImageKitUploadResponse } from './imagekit.service';
import { compressImage, formatFileSize, CompressionResult } from '../utils/imageCompressor';

export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 15,
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
    if (sizeInMB > (opts.maxSizeMB || 15)) {
      return {
        valid: false,
        error: `Kích thước tệp vượt quá giới hạn cho phép (${sizeInMB.toFixed(2)}MB / tối đa ${opts.maxSizeMB}MB).`,
      };
    }
    return { valid: true };
  },

  /**
   * Upload image with auto-compression using ImageKit.io as priority service
   * Falls back to Firebase Storage or Base64 demo URL if ImageKit is not configured
   */
  async uploadImage(path: string, file: File): Promise<string> {
    const result = await this.uploadImageWithDetails(path, file);
    return result.url;
  },

  /**
   * Upload image and return both the CDN URL and compression statistics
   */
  async uploadImageWithDetails(
    path: string,
    file: File
  ): Promise<{ url: string; compression: CompressionResult }> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 1. High-efficiency client compression (WebP / 82% quality / max 1920x1080)
    const isAvatar = path.includes('executive-members') || path.includes('avatar');
    const compression = await compressImage(file, {
      maxWidth: isAvatar ? 800 : 1920,
      maxHeight: isAvatar ? 800 : 1080,
      quality: isAvatar ? 0.85 : 0.82,
      targetFormat: 'image/webp',
    });
    const fileToUpload = compression.file;

    // 2. Try ImageKit.io first if configured
    if (imagekitService.isConfigured()) {
      try {
        const folder = path.includes('/') ? `/${path.split('/')[0]}` : '/lcdattt';
        const res: ImageKitUploadResponse = await imagekitService.uploadFile(fileToUpload, { folder });
        if (res && res.url) {
          return { url: res.url, compression };
        }
      } catch (err: any) {
        console.warn('[Storage] ImageKit upload error, attempting fallback:', err);
        if (!isFirebaseConfigured && !storage) {
          throw new Error(`Lỗi tải ảnh lên ImageKit: ${err.message || err}`);
        }
      }
    }

    // 3. Fallback to Firebase Storage if configured
    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, fileToUpload, {
          contentType: fileToUpload.type,
        });
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return { url: downloadUrl, compression };
      } catch (err: any) {
        console.warn('[Storage] Firebase Storage upload error, falling back to local data URL:', err);
      }
    }

    // 4. Local/Demo fallback: Base64 Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ url: reader.result as string, compression });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileToUpload);
    });
  },
};

export { imagekitService, compressImage, formatFileSize };
