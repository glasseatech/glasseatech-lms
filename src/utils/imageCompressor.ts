/**
 * Image compression and Firestore data sanitization utilities
 * Prevents oversized payloads (Firestore 1MB limit), connection drops, and RangeError during serialization.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses an image File using HTML5 Canvas to a lightweight base64 DataURL (WebP/JPEG).
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Provided file is not a valid image.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if dimensions exceed maximums
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
            // Fallback to original dataUrl if canvas context unavailable
            resolve(dataUrl);
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting to WebP first, fallback to JPEG
          let result = canvas.toDataURL(mimeType, quality);
          if (!result.startsWith('data:' + mimeType)) {
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result);
        } catch (err) {
          console.warn('Canvas compression failed, falling back to original:', err);
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 DataURL if it is larger than a safe threshold (~100KB).
 */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl; // Return standard URLs or empty strings untouched
  }

  // If the base64 string is already reasonably small (< 80KB), keep as is
  if (dataUrl.length < 80000) {
    return dataUrl;
  }

  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl); // Fallback to original
    img.onload = () => {
      try {
        let { width, height } = img;

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
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let result = canvas.toDataURL(mimeType, quality);
        if (!result.startsWith('data:' + mimeType)) {
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      } catch {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}

/**
 * Sanitizes objects for Firestore by recursively removing `undefined` properties
 * and filtering undefined array entries. Firestore rejects any object containing `undefined`.
 */
export function sanitizeForFirestore<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }

  return obj;
}

/**
 * Pre-processes full course metadata to compress any attached media files
 * and ensure Firestore size and schema compliance.
 */
export async function sanitizeAndCompressCoursePayload(courseData: any): Promise<any> {
  const cloned = JSON.parse(JSON.stringify(courseData));

  // 1. Compress main course thumbnail
  if (cloned.thumbnail && cloned.thumbnail.startsWith('data:image/')) {
    cloned.thumbnail = await compressDataUrl(cloned.thumbnail, { maxWidth: 800, maxHeight: 450, quality: 0.75 });
  }

  // 2. Compress author avatar
  if (cloned.authorImage && cloned.authorImage.startsWith('data:image/')) {
    cloned.authorImage = await compressDataUrl(cloned.authorImage, { maxWidth: 250, maxHeight: 250, quality: 0.8 });
  }

  // 3. Compress chapter and lesson thumbnails
  if (Array.isArray(cloned.chapters)) {
    for (const chapter of cloned.chapters) {
      if (chapter.thumbnail && chapter.thumbnail.startsWith('data:image/')) {
        chapter.thumbnail = await compressDataUrl(chapter.thumbnail, { maxWidth: 400, maxHeight: 225, quality: 0.7 });
      }

      if (Array.isArray(chapter.lessons)) {
        for (const lesson of chapter.lessons) {
          if (lesson.thumbnail && lesson.thumbnail.startsWith('data:image/')) {
            lesson.thumbnail = await compressDataUrl(lesson.thumbnail, { maxWidth: 400, maxHeight: 225, quality: 0.7 });
          }
        }
      }
    }
  }

  // 4. Sanitize all undefined fields
  return sanitizeForFirestore(cloned);
}
