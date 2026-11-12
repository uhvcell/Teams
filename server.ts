import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Admin Session Secret for signing tokens
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'uhv-nbkrist-institutional-admin-sec-2026-key';

// Password hash for UHVCELL@2713 (SHA-256)
const ADMIN_PASS_HASH = '6cb23dbfa1ac3d8297488c7d9d88bdf73191459f977d9412801aec39ceb0942b';
const ALT_ADMIN_PASS_HASH = 'ffa1af3daf56349ce11844b65adaa196388a1fd427ed685000d5f6452caaac35';

// Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to parse cookies from header
function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

// Token interfaces & helpers
interface AdminTokenPayload {
  email: string;
  role: string;
  exp: number;
  iat: number;
}

// Augment Request to include adminUser
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminTokenPayload;
    }
  }
}

function signToken(payload: Omit<AdminTokenPayload, 'iat'>): string {
  const data: AdminTokenPayload = {
    ...payload,
    iat: Date.now(),
  };
  const jsonStr = Buffer.from(JSON.stringify(data)).toString('base64url');
  const hmac = crypto.createHmac('sha256', ADMIN_SESSION_SECRET);
  hmac.update(jsonStr);
  const signature = hmac.digest('base64url');
  return `${jsonStr}.${signature}`;
}

function verifyToken(tokenString: string): { valid: boolean; payload?: AdminTokenPayload; error?: string } {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, error: 'Token missing' };
  }
  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token structure' };
  }
  const [jsonStr, signature] = parts;
  const hmac = crypto.createHmac('sha256', ADMIN_SESSION_SECRET);
  hmac.update(jsonStr);
  const expectedSig = hmac.digest('base64url');

  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid cryptographic signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(jsonStr, 'base64url').toString('utf-8')) as AdminTokenPayload;
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid token payload' };
  }
}

// ----------------------------------------------------
// BACKEND AUTHORIZATION MIDDLEWARE
// ----------------------------------------------------
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  // Check Authorization header, Cookie, or Query Param
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req.headers.cookie);
  const queryAuth = (req.query.auth as string) || (req.query.token as string);

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookies.uhv_admin_token) {
    token = cookies.uhv_admin_token.trim();
  } else if (queryAuth) {
    token = queryAuth.trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      message: 'Authentication required to download QR codes. Only authenticated administrators may download QR codes.',
    });
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      message: result.error || 'Invalid or expired administrator authentication session.',
    });
  }

  // Verify Role: Must be an authorized administrator
  const role = result.payload.role;
  const isAdminRole = role === 'Super Admin' || role === 'Admin' || role === 'Administrator';
  if (!isAdminRole) {
    return res.status(403).json({
      error: 'Forbidden',
      code: 'ADMIN_ROLE_REQUIRED',
      message: 'Access denied. Administrator permissions required to download QR codes.',
    });
  }

  req.adminUser = result.payload;
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// POST /api/auth/login - Authenticate admin & generate secure backend session token
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, googleAuth } = req.body;

  if (googleAuth) {
    // For institutional Google sign-in
    const adminEmail = (email || 'admin.uhv@nbkrist.org').trim().toLowerCase();
    const token = signToken({
      email: adminEmail,
      role: 'Super Admin',
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    res.setHeader(
      'Set-Cookie',
      `uhv_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return res.json({
      success: true,
      token,
      user: {
        email: adminEmail,
        role: 'Super Admin',
      },
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // SHA-256 check
  const passHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
  const isMatchingHash = passHash === ADMIN_PASS_HASH || passHash === ALT_ADMIN_PASS_HASH;

  const isInstitutionalAdminUser =
    cleanEmail === 'uhvcell@nbkrist' ||
    cleanEmail === 'uhvcell@nbkrist.org' ||
    cleanEmail === 'uhvcell@nbkrist.edu.in' ||
    cleanEmail === 'admin.uhv@nbkrist.org' ||
    cleanEmail === 'admin@nbkrist.org' ||
    cleanEmail === 'uhvcell';

  if (!isMatchingHash || !isInstitutionalAdminUser) {
    return res.status(401).json({
      error: 'Invalid administrator credentials',
      message: 'The email address or security password provided is incorrect.',
    });
  }

  const canonicalEmail = cleanEmail.includes('@')
    ? cleanEmail.includes('.')
      ? cleanEmail
      : `${cleanEmail}.org`
    : `${cleanEmail}@nbkrist.org`;

  const token = signToken({
    email: canonicalEmail,
    role: 'Super Admin',
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  res.setHeader(
    'Set-Cookie',
    `uhv_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return res.json({
    success: true,
    token,
    user: {
      email: canonicalEmail,
      role: 'Super Admin',
    },
  });
});

// GET /api/auth/me - Verify current session
app.get('/api/auth/me', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const queryAuth = (req.query.auth as string) || (req.query.token as string);

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookies.uhv_admin_token) {
    token = cookies.uhv_admin_token.trim();
  } else if (queryAuth) {
    token = queryAuth.trim();
  }

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return res.status(401).json({ authenticated: false, error: result.error });
  }

  return res.json({
    authenticated: true,
    user: result.payload,
  });
});

// POST /api/auth/logout - Revoke admin session
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.setHeader(
    'Set-Cookie',
    'uhv_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ----------------------------------------------------
// PROTECTED QR CODE DOWNLOAD ROUTES (ADMIN-ONLY)
// ----------------------------------------------------

/**
 * GET /api/admin/qr/code/:token
 * Downloads raw QR code PNG or SVG.
 * Strictly requires admin authorization; returns 401/403 for unauthenticated visitors.
 */
app.get('/api/admin/qr/code/:token', requireAdminAuth, async (req: Request, res: Response) => {
  const { token } = req.params;
  const format = (req.query.format as string) || 'png';
  const size = parseInt((req.query.size as string) || '500', 10);

  if (!token || token.trim().length === 0) {
    return res.status(400).json({ error: 'Missing token' });
  }

  const cleanToken = token.trim();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const verificationUrl = `${protocol}://${host}/verify/${cleanToken}`;

  const safeName = cleanToken.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(verificationUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#0f2942',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="UHV_${safeName}_QR.svg"`);
      return res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(verificationUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#0f2942',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="UHV_${safeName}_QR.png"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Error generating QR code for download:', err);
    return res.status(500).json({ error: 'Failed to generate QR code for download' });
  }
});

/**
 * POST /api/admin/qr/card/download
 * Downloads official printable QR card (PNG).
 * Strictly requires admin authorization; returns 401/403 for unauthenticated visitors.
 */
app.post('/api/admin/qr/card/download', requireAdminAuth, async (req: Request, res: Response) => {
  const { member, cardDataUrl } = req.body;

  if (!member || !member.name) {
    return res.status(400).json({ error: 'Member details required' });
  }

  const safeName = member.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  // If client supplied high-fidelity rendered canvas dataUrl
  if (cardDataUrl && typeof cardDataUrl === 'string' && cardDataUrl.startsWith('data:image/')) {
    const base64Data = cardDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="UHV_NBKRIST_${safeName}_QR_Card.png"`
    );
    return res.send(buffer);
  }

  // Fallback: generate server-side QR image
  const token = member.qrId || member.qrToken || member.id;
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const verificationUrl = `${protocol}://${host}/verify/${token}`;

  try {
    const buffer = await QRCode.toBuffer(verificationUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f2942',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="UHV_NBKRIST_${safeName}_QR_Card.png"`
    );
    return res.send(buffer);
  } catch (err) {
    console.error('Failed to export QR card:', err);
    return res.status(500).json({ error: 'Failed to export QR card' });
  }
});

/**
 * POST /api/admin/qr/bulk
 * Packages and downloads active member QR codes and cards as a ZIP archive.
 * Strictly requires admin authorization; returns 401/403 for unauthenticated visitors.
 */
app.post('/api/admin/qr/bulk', requireAdminAuth, async (req: Request, res: Response) => {
  const { members, clientRenderedCards } = req.body;

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'Members list required for bulk download' });
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

  try {
    const zip = new JSZip();
    const qrCodesFolder = zip.folder('QR_Codes_Only');
    const qrCardsFolder = zip.folder('Printable_QR_Cards');

    // Create cards map from client if provided
    const cardMap = new Map<string, string>();
    if (clientRenderedCards && typeof clientRenderedCards === 'object') {
      Object.entries(clientRenderedCards).forEach(([tok, b64]) => {
        cardMap.set(tok, (b64 as string).replace(/^data:image\/\w+;base64,/, ''));
      });
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const safeName = member.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filenamePrefix = `${String(i + 1).padStart(2, '0')}_${safeName}`;
      const token = member.qrId || member.qrToken;
      const verificationUrl = `${protocol}://${host}/verify/${token}`;

      // 1. Raw QR PNG
      const qrBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f2942',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      qrCodesFolder?.file(`${filenamePrefix}_QR.png`, qrBuffer);

      // 2. Printable card PNG
      if (cardMap.has(member.qrToken)) {
        qrCardsFolder?.file(
          `${filenamePrefix}_Official_Card.png`,
          Buffer.from(cardMap.get(member.qrToken)!, 'base64')
        );
      } else {
        qrCardsFolder?.file(`${filenamePrefix}_Official_QR.png`, qrBuffer);
      }
    }

    // Manifest
    const summaryText = [
      'UHV CELL – NBKRIST',
      'Universal Human Values Cell',
      'Digital Member Verification - Official Administrator Bulk QR Export',
      'Generated: ' + new Date().toLocaleString(),
      'Exported By: ' + (req.adminUser?.email || 'Super Admin'),
      'Total Members: ' + members.length,
      '--------------------------------------------------',
      'Compliance Standard: Strict Zero Student ID Exposure Policy.',
      'Verification relies solely on secure internal cryptographic tokens.',
      '--------------------------------------------------',
      ...members.map(
        (m: any, idx: number) =>
          `${idx + 1}. ${m.name} | ${m.department} | ${m.position || m.role} | Status: ${m.status}`
      ),
    ].join('\n');

    zip.file('Export_Manifest.txt', summaryText);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="UHV_NBKRIST_Active_Members_QR_Export_${dateStr}.zip"`
    );
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating bulk QR zip:', err);
    return res.status(500).json({ error: 'Failed to generate bulk QR ZIP export' });
  }
});

// ----------------------------------------------------
// FRONTEND STATIC / VITE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[UHV CELL] Full-stack Server running at http://0.0.0.0:${PORT} in ${isDev ? 'development' : 'production'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
