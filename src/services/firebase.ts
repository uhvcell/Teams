import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocFromServer,
  serverTimestamp,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import type { Member, WebsiteConfig, AdminUser, AnnouncementItem, EventItem } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Master toggle: Firebase Firestore & Auth enabled for real-time student lookup at ₹0 Spark tier
export const IS_FIREBASE_ENABLED = true;

// Initialize Firebase securely (only if enabled)
const app: FirebaseApp = IS_FIREBASE_ENABLED
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : ({} as FirebaseApp);

export const auth: Auth = IS_FIREBASE_ENABLED ? getAuth(app) : ({} as Auth);
export const googleProvider = new GoogleAuthProvider();

export const db: Firestore = IS_FIREBASE_ENABLED
  ? (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.length > 0
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app))
  : ({} as Firestore);

export let isFirebaseConnected = false;

// Test connection on boot only if Firebase is enabled
async function testConnection() {
  if (!IS_FIREBASE_ENABLED) {
    isFirebaseConnected = false;
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirebaseConnected = true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline. Local persistent cache active.');
    } else {
      isFirebaseConnected = true;
    }
  }
}
testConnection();

// Helper to create a local User object when Firebase Auth is disabled
function createLocalUser(email: string, displayName = 'Super Admin'): User {
  return {
    uid: 'local-uhv-admin-' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email,
    displayName,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({
      token: 'mock-token',
      authTime: '',
      issuedAtTime: '',
      expirationTime: '',
      signInProvider: 'password',
      claims: { admin: true },
    }),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    providerId: 'local',
  } as unknown as User;
}

async function hashSHA256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

// ----------------------------------------------------
// AUTHENTICATION SERVICES
// ----------------------------------------------------
export const firebaseAuthService = {
  getAuthInstance(): Auth {
    return auth;
  },

  getCurrentUser(): User | null {
    const isLogged =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('uhv_admin_session') === 'true';

    if (!isLogged) return null;

    if (!IS_FIREBASE_ENABLED) {
      const email = sessionStorage.getItem('uhv_admin_email') || 'uhvcell@nbkrist.org';
      return createLocalUser(email);
    }
    return auth.currentUser;
  },

  async loginWithGoogle(): Promise<User> {
    if (!IS_FIREBASE_ENABLED) {
      const user = createLocalUser('uhvcell@nbkrist.org', 'Super Admin');
      if (typeof sessionStorage !== 'undefined') {
        const now = Date.now().toString();
        sessionStorage.setItem('uhv_admin_session', 'true');
        sessionStorage.setItem('uhv_admin_email', user.email || 'uhvcell@nbkrist.org');
        sessionStorage.setItem('uhv_admin_last_active', now);
        sessionStorage.setItem('uhv_admin_login_time', now);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('uhv_admin_session');
        localStorage.removeItem('uhv_admin_email');
        localStorage.removeItem('uhv_admin_token');
      }

      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleAuth: true, email: user.email }),
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body.token && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('uhv_admin_token', body.token);
          }
        }
      } catch (e) {
        console.warn('Backend Google auth sync note:', e);
      }

      window.dispatchEvent(new Event('uhv_auth_state_changed'));
      return user;
    }
    const result = await signInWithPopup(auth, googleProvider);
    await this.ensureAdminRecord(result.user, 'Super Admin');

    if (typeof sessionStorage !== 'undefined') {
      const now = Date.now().toString();
      sessionStorage.setItem('uhv_admin_session', 'true');
      sessionStorage.setItem('uhv_admin_email', result.user.email || 'Admin');
      sessionStorage.setItem('uhv_admin_last_active', now);
      sessionStorage.setItem('uhv_admin_login_time', now);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('uhv_admin_session');
      localStorage.removeItem('uhv_admin_email');
      localStorage.removeItem('uhv_admin_token');
    }

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleAuth: true, email: result.user.email }),
      });
      if (resp.ok) {
        const body = await resp.json();
        if (body.token && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('uhv_admin_token', body.token);
        }
      }
    } catch (e) {
      console.warn('Backend Google auth sync note:', e);
    }

    window.dispatchEvent(new Event('uhv_auth_state_changed'));
    return result.user;
  },

  async loginWithEmail(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Verify institutional administrator credentials using SHA-256 cryptographic hash
    const passHash = await hashSHA256(cleanPass);
    const isMatchingHash =
      passHash === '6cb23dbfa1ac3d8297488c7d9d88bdf73191459f977d9412801aec39ceb0942b' ||
      passHash === 'ffa1af3daf56349ce11844b65adaa196388a1fd427ed685000d5f6452caaac35';

    const isInstitutionalAdminUser =
      cleanEmail === 'uhvcell@nbkrist' ||
      cleanEmail === 'uhvcell@nbkrist.org' ||
      cleanEmail === 'uhvcell@nbkrist.edu.in' ||
      cleanEmail === 'admin.uhv@nbkrist.org' ||
      cleanEmail === 'admin@nbkrist.org' ||
      cleanEmail === 'uhvcell';

    if (isMatchingHash && isInstitutionalAdminUser) {
      const canonicalEmail = cleanEmail.includes('@')
        ? cleanEmail.includes('.')
          ? cleanEmail
          : `${cleanEmail}.org`
        : `${cleanEmail}@nbkrist.org`;

      const user = createLocalUser(canonicalEmail, 'Super Admin');
      if (typeof sessionStorage !== 'undefined') {
        const now = Date.now().toString();
        sessionStorage.setItem('uhv_admin_session', 'true');
        sessionStorage.setItem('uhv_admin_email', canonicalEmail);
        sessionStorage.setItem('uhv_admin_last_active', now);
        sessionStorage.setItem('uhv_admin_login_time', now);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('uhv_admin_session');
        localStorage.removeItem('uhv_admin_email');
        localStorage.removeItem('uhv_admin_token');
      }

      // Synchronize backend administrator session token
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body.token && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('uhv_admin_token', body.token);
          }
        }
      } catch (e) {
        console.warn('Backend admin auth sync note:', e);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('uhv_auth_state_changed'));
      }
      return user;
    }

    if (!IS_FIREBASE_ENABLED) {
      throw new Error('Invalid administrator credentials.');
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await this.ensureAdminRecord(result.user, 'Super Admin');

      if (typeof sessionStorage !== 'undefined') {
        const now = Date.now().toString();
        sessionStorage.setItem('uhv_admin_session', 'true');
        sessionStorage.setItem('uhv_admin_email', result.user.email || email.trim());
        sessionStorage.setItem('uhv_admin_last_active', now);
        sessionStorage.setItem('uhv_admin_login_time', now);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('uhv_admin_session');
        localStorage.removeItem('uhv_admin_email');
        localStorage.removeItem('uhv_admin_token');
      }

      return result.user;
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError?.code === 'auth/user-not-found') {
        try {
          const createResult = await createUserWithEmailAndPassword(auth, email, pass);
          await this.ensureAdminRecord(createResult.user, 'Super Admin');

          if (typeof sessionStorage !== 'undefined') {
            const now = Date.now().toString();
            sessionStorage.setItem('uhv_admin_session', 'true');
            sessionStorage.setItem('uhv_admin_email', createResult.user.email || email.trim());
            sessionStorage.setItem('uhv_admin_last_active', now);
            sessionStorage.setItem('uhv_admin_login_time', now);
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('uhv_admin_session');
            localStorage.removeItem('uhv_admin_email');
            localStorage.removeItem('uhv_admin_token');
          }

          return createResult.user;
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  async ensureAuthenticatedUser(): Promise<User | null> {
    if (!IS_FIREBASE_ENABLED) {
      return this.getCurrentUser();
    }
    if (auth.currentUser) {
      await this.ensureAdminRecord(auth.currentUser, 'Super Admin');
      return auth.currentUser;
    }
    return null;
  },

  async ensureAdminRecord(user: User, defaultRole: 'Super Admin' | 'Content Editor' | 'Coordinator' = 'Super Admin'): Promise<void> {
    if (!IS_FIREBASE_ENABLED) {
      return;
    }
    try {
      const docRef = doc(db, 'admins', user.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Administrator',
          email: user.email || 'admin.uhv@nbkrist.org',
          role: defaultRole,
          status: 'Active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      } else {
        await setDoc(
          docRef,
          {
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[Firestore] Could not sync admin profile record:', err);
    }
  },

  async logout(): Promise<void> {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('uhv_admin_session');
      sessionStorage.removeItem('uhv_admin_email');
      sessionStorage.removeItem('uhv_admin_token');
      sessionStorage.removeItem('uhv_admin_last_active');
      sessionStorage.removeItem('uhv_admin_login_time');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('uhv_admin_session');
      localStorage.removeItem('uhv_admin_email');
      localStorage.removeItem('uhv_admin_token');
    }
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    if (IS_FIREBASE_ENABLED) {
      await signOut(auth).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('uhv_auth_state_changed'));
    }
  },

  onAuthChanged(callback: (user: User | null) => void) {
    if (!IS_FIREBASE_ENABLED) {
      callback(this.getCurrentUser());
      const handler = () => {
        callback(this.getCurrentUser());
      };
      window.addEventListener('uhv_auth_state_changed', handler);
      return () => {
        window.removeEventListener('uhv_auth_state_changed', handler);
      };
    }
    return onAuthStateChanged(auth, callback);
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: STUDENTS (MEMBERS)
// ----------------------------------------------------
export const firestoreStudentsService = {
  async getAllStudents(): Promise<Member[]> {
    if (!IS_FIREBASE_ENABLED) return [];
    try {
      const colRef = collection(db, 'students');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      
      const seenTokens = new Set<string>();
      const members: Member[] = [];

      for (const d of snapshot.docs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = d.data() as any;
        const token = (data.qrId || data.qrToken || data.secureToken || data.verificationToken || data.id || d.id || '').trim();
        if (!token) continue;

        // Deduplicate in case any alias docs exist
        if (seenTokens.has(token)) {
          continue;
        }
        seenTokens.add(token);

        const positionVal = data.position || data.role || 'Volunteer';
        const studentName = (data.studentName || data.name || 'Member').trim();
        const certNumber = data.certificateNumber || `UHV-${new Date().getFullYear()}-${token.substring(0, 8).toUpperCase()}`;
        const certTitle = data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate';

        const member: Member = {
          id: token,
          firestoreDocId: d.id,
          qrToken: token,
          qrId: token,
          name: studentName,
          studentName,
          certificateTitle: certTitle,
          certificateNumber: certNumber,
          issueDate: data.issueDate || data.joiningDate || new Date().toISOString().split('T')[0],
          role: positionVal,
          position: positionVal,
          department: data.department || 'General',
          year: data.year || 'III B.Tech',
          section: data.section || 'A',
          academicYear: data.academicYear || '2026–27',
          joiningDate: data.joiningDate || data.issueDate || new Date().toISOString().split('T')[0],
          status: data.status === 'Inactive' ? 'Inactive' : 'Active',
          photoUrl: data.photoUrl || null,
          email: data.email || null,
          bloodGroup: data.bloodGroup || null,
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : undefined,
          createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
        };

        members.push(member);
      }
      return members;
    } catch (err) {
      console.warn('[Firestore] Error fetching students:', err);
      return [];
    }
  },

  async getStudentByToken(token: string): Promise<Member | null> {
    if (!IS_FIREBASE_ENABLED || !token) return null;
    const cleanToken = decodeURIComponent(token).trim();
    if (!cleanToken) return null;

    try {
      // 1. Direct document lookup by permanent QR ID / token (O(1) exact document ID read)
      const docRef = doc(db, 'students', cleanToken);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = snap.data() as any;
        const resolvedToken = data.qrId || data.qrToken || data.secureToken || data.verificationToken || snap.id;
        const posVal = data.position || data.role || 'Volunteer';
        const studentName = (data.studentName || data.name || '').trim();
        const certNumber = data.certificateNumber || `UHV-${new Date().getFullYear()}-${resolvedToken.substring(0, 8).toUpperCase()}`;
        const certTitle = data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate';

        return {
          id: resolvedToken,
          firestoreDocId: snap.id,
          qrToken: resolvedToken,
          qrId: resolvedToken,
          name: studentName,
          studentName,
          certificateTitle: certTitle,
          certificateNumber: certNumber,
          issueDate: data.issueDate || data.joiningDate || '',
          role: posVal,
          position: posVal,
          department: data.department || '',
          year: data.year || 'III B.Tech',
          section: data.section || 'A',
          academicYear: data.academicYear || '2026–27',
          joiningDate: data.joiningDate || '',
          status: data.status === 'Inactive' ? 'Inactive' : 'Active',
          photoUrl: data.photoUrl || null,
          email: data.email || null,
          bloodGroup: data.bloodGroup || null,
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : undefined,
          createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
        };
      }

      const colRef = collection(db, 'students');

      // 2. Query by qrId field
      const qQrId = query(colRef, where('qrId', '==', cleanToken));
      const snapQrId = await getDocs(qQrId);
      if (!snapQrId.empty) {
        const d = snapQrId.docs[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = d.data() as any;
        const resolvedToken = data.qrId || data.qrToken || data.secureToken || d.id;
        const posVal = data.position || data.role || 'Volunteer';
        const studentName = (data.studentName || data.name || '').trim();
        return {
          id: resolvedToken,
          firestoreDocId: d.id,
          qrToken: resolvedToken,
          qrId: resolvedToken,
          name: studentName,
          studentName,
          certificateTitle: data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate',
          certificateNumber: data.certificateNumber || `UHV-${new Date().getFullYear()}-${resolvedToken.substring(0, 8).toUpperCase()}`,
          issueDate: data.issueDate || data.joiningDate || '',
          role: posVal,
          position: posVal,
          department: data.department || '',
          year: data.year || 'III B.Tech',
          section: data.section || 'A',
          academicYear: data.academicYear || '2026–27',
          joiningDate: data.joiningDate || '',
          status: data.status === 'Inactive' ? 'Inactive' : 'Active',
          photoUrl: data.photoUrl || null,
          email: data.email || null,
          bloodGroup: data.bloodGroup || null,
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : undefined,
          createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
        };
      }

      // 3. Fallback query by qrToken field
      const q = query(colRef, where('qrToken', '==', cleanToken));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const d = querySnap.docs[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = d.data() as any;
        const resolvedToken = data.qrId || data.qrToken || data.secureToken || d.id;
        const posVal = data.position || data.role || 'Volunteer';
        const studentName = (data.studentName || data.name || '').trim();
        return {
          id: resolvedToken,
          firestoreDocId: d.id,
          qrToken: resolvedToken,
          qrId: resolvedToken,
          name: studentName,
          studentName,
          certificateTitle: data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate',
          certificateNumber: data.certificateNumber || `UHV-${new Date().getFullYear()}-${resolvedToken.substring(0, 8).toUpperCase()}`,
          issueDate: data.issueDate || data.joiningDate || '',
          role: posVal,
          position: posVal,
          department: data.department || '',
          year: data.year || 'III B.Tech',
          section: data.section || 'A',
          academicYear: data.academicYear || '2026–27',
          joiningDate: data.joiningDate || '',
          status: data.status === 'Inactive' ? 'Inactive' : 'Active',
          photoUrl: data.photoUrl || null,
          email: data.email || null,
          bloodGroup: data.bloodGroup || null,
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : undefined,
          createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.warn('[Firestore] Error fetching student by token:', err);
      return null;
    }
  },

  async saveStudent(student: Member): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const permanentQrId = (student.qrId || student.qrToken || student.id || '').trim();
      if (!permanentQrId) {
        throw new Error('Cannot save certificate/member without permanent QR ID');
      }

      // Permanent document ID in Firestore: matches permanentQrId
      const docRef = doc(collection(db, 'students'), permanentQrId);
      
      const positionValue = student.position || student.role || 'Volunteer';
      const studentName = (student.studentName || student.name || 'Member').trim();
      const certTitle = student.certificateTitle || 'Universal Human Values Cell Digital Member Certificate';
      const certNumber = student.certificateNumber || `UHV-${new Date().getFullYear()}-${permanentQrId.substring(0, 8).toUpperCase()}`;
      const issueDate = student.issueDate || student.joiningDate || new Date().toISOString().split('T')[0];

      const payload = {
        id: permanentQrId,
        qrId: permanentQrId,
        qrToken: permanentQrId,
        verificationToken: permanentQrId,
        secureToken: permanentQrId,
        studentName,
        name: studentName,
        certificateTitle: certTitle,
        certificateNumber: certNumber,
        issueDate,
        role: positionValue,
        position: positionValue,
        department: student.department || 'General',
        year: student.year || 'III B.Tech',
        section: student.section || 'A',
        academicYear: student.academicYear || '2026–27',
        joiningDate: student.joiningDate || issueDate,
        status: student.status === 'Inactive' ? 'Inactive' : 'Active',
        photoUrl: student.photoUrl || null,
        email: student.email || null,
        bloodGroup: student.bloodGroup || null,
        displayOrder: typeof student.displayOrder === 'number' ? student.displayOrder : null,
        createdAt: student.createdAt ? new Date(student.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error saving student/certificate:', err);
      throw err;
    }
  },

  async deleteStudent(identifier: Member | string): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    // 1. Ensure authentication is verified so security rules allow deletion
    try {
      await firebaseAuthService.ensureAuthenticatedUser();
    } catch (authErr) {
      console.warn('[Firestore] Auth verification prior to delete:', authErr);
    }

    const memberObj = typeof identifier === 'object' ? identifier : null;
    const directDocId = memberObj?.firestoreDocId?.trim();
    const token = (typeof identifier === 'string' ? identifier : identifier.qrToken || memberObj?.id || '').trim();

    if (!directDocId && !token) {
      throw new Error('Missing student verification token or document identifier for deletion.');
    }

    const docIdsToDelete = new Set<string>();
    if (directDocId) {
      docIdsToDelete.add(directDocId);
    }
    if (token) {
      docIdsToDelete.add(token);
    }

    // 2. Query any documents matching qrToken, verificationToken, or id
    // to guarantee all corresponding documents (even with auto-generated IDs) are found
    const colRef = collection(db, 'students');
    try {
      if (token) {
        const qToken = query(colRef, where('qrToken', '==', token));
        const snapToken = await getDocs(qToken);
        snapToken.docs.forEach((d) => docIdsToDelete.add(d.id));

        const qVerif = query(colRef, where('verificationToken', '==', token));
        const snapVerif = await getDocs(qVerif);
        snapVerif.docs.forEach((d) => docIdsToDelete.add(d.id));

        const qId = query(colRef, where('id', '==', token));
        const snapId = await getDocs(qId);
        snapId.docs.forEach((d) => docIdsToDelete.add(d.id));
      }
    } catch (queryErr) {
      console.warn('[Firestore] Secondary document query warning during delete:', queryErr);
    }

    let atLeastOneSuccess = false;
    let failureError: unknown = null;

    // 3. Delete all matched Firestore document references
    for (const id of docIdsToDelete) {
      try {
        const studentDocRef = doc(db, 'students', id);
        await deleteDoc(studentDocRef);
        atLeastOneSuccess = true;
      } catch (delErr) {
        console.error('[Firestore] deleteDoc error for document ID:', id, delErr);
        failureError = delErr;
      }
    }

    // 4. Verify that the documents are deleted
    for (const id of docIdsToDelete) {
      try {
        const verifyRef = doc(db, 'students', id);
        const checkSnap = await getDoc(verifyRef);
        if (checkSnap.exists()) {
          console.error('[Firestore] Verification failed: Document still exists after deleteDoc:', id);
          throw (
            failureError ||
            new Error(`Unable to delete student document ${id}. Firestore document still exists.`)
          );
        }
      } catch (verifyErr) {
        if (failureError) throw failureError;
      }
    }

    // 5. If nothing succeeded and there was an error, re-throw it so caller UI handles it
    if (!atLeastOneSuccess && failureError) {
      throw failureError;
    }
  },

  async syncAllStudents(students: Member[]): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      for (const student of students) {
        await this.saveStudent(student);
      }
    } catch (err) {
      console.warn('[Firestore] Sync students error:', err);
    }
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: WEBSITE SETTINGS
// ----------------------------------------------------
export const firestoreSettingsService = {
  async getWebsiteConfig(): Promise<WebsiteConfig | null> {
    if (!IS_FIREBASE_ENABLED) return null;
    try {
      const docRef = doc(db, 'websiteSettings', 'published');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as WebsiteConfig;
      }
      return null;
    } catch (err) {
      console.warn('[Firestore] Error fetching website settings:', err);
      return null;
    }
  },

  async saveWebsiteConfig(config: WebsiteConfig, isDraft = false): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const targetDoc = isDraft ? 'draft' : 'published';
      const docRef = doc(db, 'websiteSettings', targetDoc);
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Error saving website settings:', err);
      throw err;
    }
  },

  async getCustomPositions(): Promise<string[] | null> {
    if (!IS_FIREBASE_ENABLED) return null;
    try {
      const docRef = doc(db, 'websiteSettings', 'positions');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.positions)) {
          return data.positions as string[];
        }
      }
      return null;
    } catch (err) {
      console.warn('[Firestore] Error fetching custom positions:', err);
      return null;
    }
  },

  async saveCustomPositions(positions: string[]): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'websiteSettings', 'positions');
      await setDoc(docRef, {
        positions,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Error saving custom positions:', err);
    }
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: ADMINS
// ----------------------------------------------------
export const firestoreAdminsService = {
  async getAllAdmins(): Promise<AdminUser[]> {
    if (!IS_FIREBASE_ENABLED) return [];
    try {
      const colRef = collection(db, 'admins');
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs.map((d) => d.data() as AdminUser);
    } catch (err) {
      console.warn('[Firestore] Error fetching admins:', err);
      return [];
    }
  },

  async saveAdmin(admin: AdminUser): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'admins', admin.id);
      await setDoc(docRef, {
        ...admin,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firestore] Error saving admin:', err);
      throw err;
    }
  },

  async deleteAdmin(adminId: string): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'admins', adminId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Error deleting admin:', err);
      throw err;
    }
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: ANNOUNCEMENTS
// ----------------------------------------------------
export const firestoreAnnouncementsService = {
  async getAllAnnouncements(): Promise<AnnouncementItem[]> {
    if (!IS_FIREBASE_ENABLED) return [];
    try {
      const colRef = collection(db, 'announcements');
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs.map((d) => d.data() as AnnouncementItem);
    } catch (err) {
      console.warn('[Firestore] Error fetching announcements:', err);
      return [];
    }
  },

  async saveAnnouncement(item: AnnouncementItem): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'announcements', item.id);
      await setDoc(docRef, item);
    } catch (err) {
      console.warn('[Firestore] Error saving announcement:', err);
      throw err;
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'announcements', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Error deleting announcement:', err);
      throw err;
    }
  },

  async syncAllAnnouncements(items: AnnouncementItem[]): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      for (const item of items) {
        await this.saveAnnouncement(item);
      }
    } catch (err) {
      console.warn('[Firestore] Error syncing announcements:', err);
    }
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: EVENTS
// ----------------------------------------------------
export const firestoreEventsService = {
  async getAllEvents(): Promise<EventItem[]> {
    if (!IS_FIREBASE_ENABLED) return [];
    try {
      const colRef = collection(db, 'events');
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs.map((d) => d.data() as EventItem);
    } catch (err) {
      console.warn('[Firestore] Error fetching events:', err);
      return [];
    }
  },

  async saveEvent(item: EventItem): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'events', item.id);
      await setDoc(docRef, item);
    } catch (err) {
      console.warn('[Firestore] Error saving event:', err);
      throw err;
    }
  },

  async deleteEvent(id: string): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const docRef = doc(db, 'events', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Error deleting event:', err);
      throw err;
    }
  },

  async syncAllEvents(items: EventItem[]): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      for (const item of items) {
        await this.saveEvent(item);
      }
    } catch (err) {
      console.warn('[Firestore] Error syncing events:', err);
    }
  },
};

// ----------------------------------------------------
// CLOUD FIRESTORE: ACTIVITY AUDIT LOGS
// ----------------------------------------------------
export const firestoreActivityLogsService = {
  async addLog(log: {
    action: string;
    studentName?: string;
    timestamp?: unknown;
    performedBy: string;
    adminRole?: string;
    details?: string;
  }): Promise<void> {
    if (!IS_FIREBASE_ENABLED) return;
    try {
      const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, 'activityLogs', logId);
      await setDoc(docRef, {
        id: logId,
        action: log.action,
        studentName: log.studentName || 'Student',
        performedBy: log.performedBy || 'admin.uhv@nbkrist.org',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        details: log.details || '',
      });
    } catch (err) {
      console.warn('[Firestore] Error saving activity log:', err);
    }
  },
};
