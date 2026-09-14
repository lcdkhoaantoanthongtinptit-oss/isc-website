/**
 * Browser-side Image Compression Utility
 * Resizes and re-encodes images to WebP/JPEG format to optimize upload speed and bandwidth
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  targetFormat?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  isCompressed: boolean;
}

/**
 * Compress an image file using browser HTML5 Canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;

  // SVG, GIF (animations) or non-image files should NOT be processed via Canvas
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    !file.type.startsWith('image/')
  ) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      isCompressed: false,
    };
  }

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    targetFormat = 'image/webp',
  } = options;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            savedPercent: 0,
            isCompressed: false,
          });
        }

        // High quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compression didn't reduce file size, keep original
              return resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                savedPercent: 0,
                isCompressed: false,
              });
            }

            const extension = targetFormat === 'image/webp' ? '.webp' : '.jpg';
            const baseName =
              file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${baseName}${extension}`;

            const compressedFile = new File([blob], newFileName, {
              type: targetFormat,
              lastModified: Date.now(),
            });

            const saved = Math.round(
              ((originalSize - compressedFile.size) / originalSize) * 100
            );

            console.log(
              `[ImageCompressor] ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB (saved ${saved}%)`
            );

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: compressedFile.size,
              savedPercent: saved,
              isCompressed: true,
            });
          },
          targetFormat,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          savedPercent: 0,
          isCompressed: false,
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        isCompressed: false,
      });
    };
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 350 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
