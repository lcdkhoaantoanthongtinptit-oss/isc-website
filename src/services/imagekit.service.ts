/**
 * ImageKit.io Upload Service
 * API Reference: https://imagekit.io/docs/api-reference/upload-file/upload-file
 */

export interface ImageKitConfig {
  publicKey: string;
  privateKey?: string;
  urlEndpoint: string;
}

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  height?: number;
  width?: number;
  size?: number;
  filePath?: string;
}

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';

/**
 * Generate HMAC-SHA1 signature using standard browser Web Crypto API
 */
async function generateHmacSha1(secretKey: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secretKey);
  const msgData = enc.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unique token
 */
function generateToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'ik_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

import { compressImage } from '../utils/imageCompressor';

export const imagekitService = {
  /**
   * Get active ImageKit credentials.
   * Source priority: env vars > lcd_ik_* localStorage (set by Admin Settings page)
   * NEVER reads from lcd_website_settings (public cache).
   */
  getConfig(): ImageKitConfig {
    const pub   = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY    || localStorage.getItem('lcd_ik_public_key')    || '';
    const priv  = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY   || localStorage.getItem('lcd_ik_private_key')   || '';
    const url   = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT  || localStorage.getItem('lcd_ik_url_endpoint')  || '';
    return { publicKey: pub, privateKey: priv, urlEndpoint: url };
  },

  /**
   * Check if ImageKit credentials are configured
   */
  isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(config.publicKey && (config.privateKey || config.urlEndpoint));
  },

  /**
   * Upload file to ImageKit
   */
  async uploadFile(
    file: File,
    options: {
      folder?: string;
      fileName?: string;
      tags?: string[];
    } = {}
  ): Promise<ImageKitUploadResponse> {
    // 1. Automatic high-efficiency browser compression (WebP, optimal resolution)
    const isAvatar = options.folder?.includes('executive-members') || options.folder?.includes('avatar');
    const compression = await compressImage(file, {
      maxWidth: isAvatar ? 800 : 1920,
      maxHeight: isAvatar ? 800 : 1080,
      quality: isAvatar ? 0.85 : 0.82,
      targetFormat: 'image/webp',
    });
    const finalFile = compression.file;

    const cleanFileName =
      options.fileName ||
      finalFile.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

    const folderPath = options.folder || '/lcdattt';

    // Strategy 1: Try serverless endpoint (/api/upload) if available
    try {
      const formData = new FormData();
      formData.append('file', finalFile);
      formData.append('fileName', cleanFileName);
      formData.append('folder', folderPath);
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      const apiRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.url) {
          return data as ImageKitUploadResponse;
        }
      }
    } catch {
      // Serverless endpoint not present or failed, fallback to client-side signed upload
    }

    // Strategy 2: Client-side Signed Upload to ImageKit Upload API
    const config = this.getConfig();
    if (!config.publicKey || !config.privateKey) {
      throw new Error(
        'Chưa cấu hình ImageKit (Vui lòng điền Public Key và Private Key trong file .env hoặc tại trang Cấu hình website).'
      );
    }

    const token = generateToken();
    const expire = Math.floor(Date.now() / 1000) + 2400; // valid for 40 minutes
    const signature = await generateHmacSha1(config.privateKey, token + expire);

    const formData = new FormData();
    formData.append('file', finalFile);
    formData.append('fileName', cleanFileName);
    formData.append('publicKey', config.publicKey);
    formData.append('signature', signature);
    formData.append('expire', expire.toString());
    formData.append('token', token);
    formData.append('folder', folderPath);
    formData.append('useUniqueFileName', 'true');
    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const res = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = `ImageKit upload failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.message) {
          errorMsg = errJson.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const result = (await res.json()) as ImageKitUploadResponse;
    return result;
  },
};
