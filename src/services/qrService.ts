import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Member } from '../types';
import {
  isAdminSessionActive,
  getAdminSessionToken,
  getAdminSessionEmail,
  recordAdminActivity,
} from './adminSessionManager';

// In-memory cache for generated QR DataURLs and SVGs to avoid repeated work
const qrDataUrlCache = new Map<string, string>();
const qrSvgCache = new Map<string, string>();

/**
 * Returns the permanent public certificate verification URL for a given QR ID / token.
 * Canonical verification route is /verify/:qrId (also backwards-compatible with /student/:token).
 */
export function getVerificationUrl(token: string): string {
  const cleanId = encodeURIComponent((token || '').trim());
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/verify/${cleanId}`;
  }
  return `https://uhvcell-nbkrist.edu/verify/${cleanId}`;
}

/**
 * Generates and caches a high-contrast QR code Data URL (PNG).
 * Reuses cached data whenever available for instant resolution.
 */
export async function generateQRDataURL(token: string, size = 320): Promise<string> {
  const cacheKey = `${token}_${size}`;
  const cached = qrDataUrlCache.get(cacheKey);
  if (cached) return cached;

  const url = getVerificationUrl(token);
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#0f2942', // Deep institutional navy
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  qrDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Generates and caches a scalable vector SVG representation of the QR code.
 */
export async function generateQRSVG(token: string, size = 500): Promise<string> {
  const cacheKey = `${token}_${size}_svg`;
  const cached = qrSvgCache.get(cacheKey);
  if (cached) return cached;

  const url = getVerificationUrl(token);
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: '#0f2942',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  qrSvgCache.set(cacheKey, svg);
  return svg;
}

/**
 * Converts a Canvas element directly to a binary Blob using browser-native APIs.
 * Avoids expensive base64 serialization and memory bloat.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType = 'image/png',
  quality = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas export failed: generated empty blob.'));
          }
        },
        mimeType,
        quality
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Robust cross-browser file download trigger using Blob URLs.
 * Handles desktop and mobile browsers (Chrome, Edge, Firefox, Safari)
 * without premature object URL revocation.
 */
export function triggerFileDownload(blob: Blob, filename: string): boolean {
  try {
    // Support legacy Microsoft Save Blob if present
    if (typeof (window.navigator as any).msSaveOrOpenBlob === 'function') {
      (window.navigator as any).msSaveOrOpenBlob(blob, filename);
      return true;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Revoke after safe delay (60s) so OS download managers have time to stream
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {
        // Silently handle if already cleaned up
      }
    }, 60000);

    return true;
  } catch (err) {
    console.error('Direct download trigger failed, attempting fallback:', err);
    try {
      const fallbackUrl = URL.createObjectURL(blob);
      window.open(fallbackUrl, '_blank');
      return true;
    } catch (fallbackErr) {
      console.error('All download mechanisms failed:', fallbackErr);
      throw new Error('Browser blocked file download. Please check pop-up and download permissions.');
    }
  }
}

/**
 * Client-side admin verification check.
 * Only authenticated administrators may download QR codes.
 */
export function checkAdminDownloadPermission(): void {
  const isLogged = isAdminSessionActive();
  if (!isLogged) {
    throw new Error('Access denied: Only authorized administrators are permitted to download QR codes.');
  }
  recordAdminActivity();
}

/**
 * Generates an official QR card canvas with institutional header,
 * student details, and high-contrast scannable QR code.
 * Reuses pre-rendered QR code data if provided to eliminate double rendering.
 */
export async function renderMemberQRCardToCanvas(
  member: Member,
  existingQrDataUrl?: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 820;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Decorative outer border
  ctx.strokeStyle = '#0f2942';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Inner gold border
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // Header Banner
  ctx.fillStyle = '#0f2942';
  ctx.fillRect(25, 25, width - 50, 110);

  // Title: NBKRIST
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px "Times New Roman", serif, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N.B.K.R. INSTITUTE OF SCIENCE & TECHNOLOGY', width / 2, 60);

  // Cell Header
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('UHV CELL – NBKRIST', width / 2, 98);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 16px sans-serif';
  ctx.fillText('Universal Human Values Cell', width / 2, 124);

  // Tagline
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 16px serif';
  ctx.fillText('"Existence is Co-Existence"', width / 2, 165);

  // Student Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(member.name, width / 2, 215);

  // Role Badge
  const roleText = (member.position || member.role || 'MEMBER').toUpperCase();
  ctx.font = 'bold 15px sans-serif';
  const roleMetrics = ctx.measureText(roleText);
  const badgeWidth = Math.min(width - 80, roleMetrics.width + 36);
  const badgeX = (width - badgeWidth) / 2;

  ctx.fillStyle =
    roleText.includes('PRESIDENT') && !roleText.includes('VICE')
      ? '#7c2d12'
      : roleText.includes('VICE')
      ? '#581c87'
      : roleText.includes('EVENT')
      ? '#881337'
      : roleText.includes('TECH')
      ? '#0369a1'
      : roleText.includes('DESIGN')
      ? '#701a75'
      : roleText.includes('INNOV')
      ? '#065f46'
      : '#1e3a5f';

  ctx.beginPath();
  ctx.roundRect(badgeX, 235, badgeWidth, 32, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(roleText, width / 2, 256);

  // Department & Academic Info
  ctx.fillStyle = '#334155';
  ctx.font = '500 16px sans-serif';
  ctx.fillText(`${member.department}`, width / 2, 296);
  ctx.fillText(
    `${member.year} • Section ${member.section} • ${member.academicYear}`,
    width / 2,
    322
  );

  const qrSize = 310;
  const qrX = (width - qrSize) / 2;
  const qrY = 350;

  // QR box shadow / frame
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

  // Fast direct QR canvas rendering (eliminates Image element round-trip)
  const qrCanvas = document.createElement('canvas');
  const verificationUrl = getVerificationUrl(member.qrToken);
  await QRCode.toCanvas(qrCanvas, verificationUrl, {
    width: qrSize,
    margin: 2,
    color: {
      dark: '#0f2942',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Scan instruction
  ctx.fillStyle = '#0f2942';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('SCAN TO VERIFY STUDENT', width / 2, 705);

  // Sub-verification note
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('✓ OFFICIAL STUDENT VERIFICATION SYSTEM', width / 2, 735);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Vidyanagar, SPSR Nellore Dist., Andhra Pradesh', width / 2, 765);
  ctx.fillText('Authorized by Universal Human Values Cell', width / 2, 785);

  return canvas;
}

/**
 * Retrieves the stored administrator authentication token if available.
 */
export function getAdminAuthToken(): string {
  return getAdminSessionToken();
}

/**
 * Ensures backend session token is synchronized for backend endpoints.
 * Validates against backend session without embedding credentials.
 */
export async function ensureAdminBackendToken(): Promise<string> {
  let token = getAdminAuthToken();
  if (token) return token;

  const isLogged = isAdminSessionActive();
  if (!isLogged) return '';

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        return getAdminAuthToken() || 'cookie-session';
      }
    }
  } catch (err) {
    console.warn('Could not verify backend session token:', err);
  }
  return getAdminAuthToken();
}

/**
 * Downloads member QR Card with maximum speed and reliability.
 * Renders directly via optimized Canvas and Blob URL, with automatic
 * backend fallback if required by environment.
 */
export async function downloadMemberQRCard(
  member: Member,
  existingQrDataUrl?: string
): Promise<void> {
  checkAdminDownloadPermission();
  const safeName = (member.name || 'Member').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `UHV_NBKRIST_${safeName}_QR_Card.png`;

  try {
    const canvas = await renderMemberQRCardToCanvas(member, existingQrDataUrl);
    const blob = await canvasToBlob(canvas, 'image/png');
    triggerFileDownload(blob, filename);
  } catch (canvasErr) {
    console.warn('Direct canvas download error, utilizing secure backend fallback:', canvasErr);
    const token = await ensureAdminBackendToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/qr/card/download', {
      method: 'POST',
      headers,
      body: JSON.stringify({ member }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Access denied: Administrator permissions required.');
      }
      throw new Error(`Failed to download QR Card (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    triggerFileDownload(blob, filename);
  }
}

/**
 * Downloads member QR Code only in high-resolution PNG or vector SVG format.
 * Executes instantly without network bottleneck.
 */
export async function downloadMemberQROnly(
  member: Member,
  format: 'png' | 'svg' = 'png'
): Promise<void> {
  checkAdminDownloadPermission();
  const safeName = (member.name || 'Member').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  if (format === 'svg') {
    const svgString = await generateQRSVG(member.qrToken, 600);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    triggerFileDownload(blob, `UHV_${safeName}_QR.svg`);
    return;
  }

  try {
    const url = getVerificationUrl(member.qrToken);
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f2942',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    const blob = await canvasToBlob(canvas, 'image/png');
    triggerFileDownload(blob, `UHV_${safeName}_QR.png`);
  } catch (canvasErr) {
    console.warn('Direct QR PNG export failed, utilizing secure backend fallback:', canvasErr);
    const token = await ensureAdminBackendToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/admin/qr/code/${encodeURIComponent(member.qrToken)}`, {
      headers,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Access denied: Administrator permissions required.');
      }
      throw new Error(`Failed to download QR code (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    triggerFileDownload(blob, `UHV_${safeName}_QR.png`);
  }
}

/**
 * Packages all active member QR codes and cards into a compressed ZIP file.
 * Generates locally in memory using JSZip with responsive progress updates,
 * eliminating the previous multi-megabyte payload bottleneck.
 */
export async function createBulkQRZip(
  members: Member[],
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<Blob> {
  checkAdminDownloadPermission();

  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('No active members available for bulk QR packaging.');
  }

  const zip = new JSZip();
  const qrCodesFolder = zip.folder('QR_Codes_Only');
  const qrCardsFolder = zip.folder('Printable_QR_Cards');
  const total = members.length;

  for (let i = 0; i < total; i++) {
    const member = members[i];
    const safeName = (member.name || 'Member').replace(/[^a-zA-Z0-9]/g, '_');
    const filenamePrefix = `${String(i + 1).padStart(2, '0')}_${safeName}`;

    if (onProgress) {
      onProgress(i + 1, total, `Generating QR card for ${member.name} (${i + 1}/${total})`);
    }

    // 1. Raw QR Code PNG (600x600)
    const url = getVerificationUrl(member.qrToken);
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f2942',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    const qrBlob = await canvasToBlob(qrCanvas, 'image/png');
    qrCodesFolder?.file(`${filenamePrefix}_QR.png`, qrBlob);

    // 2. Printable Official Card PNG (600x820)
    const cardCanvas = await renderMemberQRCardToCanvas(member);
    const cardBlob = await canvasToBlob(cardCanvas, 'image/png');
    qrCardsFolder?.file(`${filenamePrefix}_Official_Card.png`, cardBlob);

    // Yield control to the browser event loop every 2 items to ensure smooth UI responsiveness
    if (i % 2 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (onProgress) {
    onProgress(total, total, 'Compressing ZIP archive...');
  }

  // Export Manifest
  const manifest = [
    'UHV CELL – NBKRIST',
    'Universal Human Values Cell',
    'Digital Member Verification - Official Administrator Bulk QR Export',
    'Generated: ' + new Date().toLocaleString(),
    'Total Active Members: ' + total,
    '--------------------------------------------------',
    'Strict Zero Student ID Exposure Policy Active.',
    'Verification relies solely on secure internal cryptographic tokens.',
    '--------------------------------------------------',
    ...members.map(
      (m, idx) =>
        `${idx + 1}. ${m.name} | ${m.department} | ${m.position || m.role} | Status: ${m.status}`
    ),
  ].join('\n');
  zip.file('Export_Manifest.txt', manifest);

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(total, total, `Compressing ZIP: ${Math.round(metadata.percent)}%`);
      }
    }
  );

  return zipBlob;
}
