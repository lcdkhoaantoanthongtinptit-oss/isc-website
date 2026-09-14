import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

export const storageService = {
  // Validate file before upload
  validateImageFile(file: File, options: UploadOptions = DEFAULT_OPTIONS): { valid: boolean; error?: string } {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (!opts.allowedTypes?.includes(file.type)) {
      return {
        valid: false,
        error: `Định dạng tệp không được hỗ trợ (${file.type}). Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF.`,
      };
    }
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > (opts.maxSizeMB || 5)) {
      return {
        valid: false,
        error: `Kích thước tệp vượt quá giới hạn cho phép (${sizeInMB.toFixed(2)}MB / tối đa ${opts.maxSizeMB}MB).`,
      };
    }
    return { valid: true };
  },

  // Upload image to Firebase Storage or convert to data URL in Demo mode
  async uploadImage(path: string, file: File): Promise<string> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (isFirebaseConfigured && storage) {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    }

    // Local/Demo mode: return Base64 Data URL
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
