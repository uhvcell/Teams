/**
 * ZERO-COST Client-Side Image Compression Utility
 *
 * Runs 100% in the user's browser using native HTML5 Canvas.
 * Requires ZERO external API calls, ZERO paid storage, and ZERO server processing.
 * Compresses uploaded photos to ~10KB - 25KB, allowing hundreds of student photos
 * to fit comfortably within Firestore's 1GB free tier and browser storage limits at ₹0 cost.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 320,
    maxHeight = 320,
    quality = 0.78,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        // If image loading fails, fallback to raw data URL
        resolve(reader.result as string);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate aspect ratio preserving dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          // Fill white background in case of transparent PNG converted to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw and smoothly resample
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight data URL
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to raw data URL on any canvas error
          resolve(reader.result as string);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
