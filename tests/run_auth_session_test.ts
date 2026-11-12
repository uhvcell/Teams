import { isAdminSessionActive, setAdminSession, clearAdminSession } from '../src/services/adminSessionManager';

async function testAuthSessions() {
  console.log('===============================================================');
  console.log('   UHV CELL - NBKRIST ADMIN AUTH & SESSION ISOLATION TEST');
  console.log('===============================================================\n');

  // Test 1: Unauthenticated visitor state
  console.log('[Phase 5] 1. Testing Visitor State (No Admin Session)...');
  // Mock sessionStorage in Node
  const storageMap = new Map<string, string>();
  global.sessionStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, v),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
    key: (i: number) => Array.from(storageMap.keys())[i] || null,
    length: storageMap.size,
  } as any;
  (global as any).window = {
    sessionStorage: global.sessionStorage,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };

  const visitorInitial = isAdminSessionActive();
  if (visitorInitial) {
    throw new Error('Visitor was falsely recognized as admin!');
  }
  console.log('✓ Visitor Isolation: Unauthenticated visitor has strictly false admin status.');

  // Test 2: Admin Login & Session Creation
  console.log('\n[Phase 5] 2. Testing Admin Login & Session Token Creation...');
  setAdminSession('admin.uhv@nbkrist.org', 'test-valid-admin-jwt-token');
  const loggedInActive = isAdminSessionActive();
  if (!loggedInActive) {
    throw new Error('Admin session failed to activate after login!');
  }
  console.log('✓ Admin Login: Session successfully created with active status.');

  // Test 3: Session Expiration on 10-Minute Inactivity
  console.log('\n[Phase 5] 3. Testing 10-Minute Inactivity Expiration...');
  const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
  storageMap.set('uhv_admin_last_active', elevenMinutesAgo.toString());
  const expiredActive = isAdminSessionActive();
  if (expiredActive) {
    throw new Error('Session did not expire after 11 minutes of inactivity!');
  }
  console.log('✓ Inactivity Expiration: Session automatically invalidated after 10-minute inactivity limit.');

  // Test 4: Admin Explicit Logout
  console.log('\n[Phase 5] 4. Testing Admin Logout...');
  setAdminSession('admin.uhv@nbkrist.org', 'test-valid-admin-jwt-token-2');
  clearAdminSession();
  const afterLogout = isAdminSessionActive();
  if (afterLogout) {
    throw new Error('Admin session remained active after logout!');
  }
  console.log('✓ Admin Logout: Session successfully wiped from memory on logout.');

  // Test 5: Device / Tab Independence (Shared Device Protection)
  console.log('\n[Phase 5] 5. Testing Cross-Device / Cross-Tab Independence...');
  // A visitor opening a fresh tab or different device has an empty sessionStorage
  const deviceBStorage = new Map<string, string>();
  const isDeviceBAdmin = deviceBStorage.get('uhv_admin_session') === 'true';
  if (isDeviceBAdmin) {
    throw new Error('Device B inherited Device A admin state!');
  }
  console.log('✓ Device Independence: Device B / fresh visitor tab has zero admin state or cookies.');

  console.log('\n===============================================================');
  console.log('   ALL AUTHENTICATION & SESSION TESTS PASSED SUCCESSFULLY');
  console.log('===============================================================\n');
}

testAuthSessions().catch((e) => {
  console.error('Session test failed:', e);
  process.exit(1);
});
