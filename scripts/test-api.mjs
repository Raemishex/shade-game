const BASE_URL = 'http://localhost:3000';

const results = [];
function log(name, status, details) {
  results.push({name, status, details});
  console.log(`[${status}] ${name}: ${details}`);
}

async function run() {
  console.log('Testing APIs...');
  
  // 1. Categories
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    const data = await res.json();
    if(res.ok && data.categories?.length === 16) {
      log('GET /api/categories', 'PASS', `Got ${data.categories.length} categories`);
    } else {
      log('GET /api/categories', 'FAIL', `Expected 16, got ${data.categories?.length}. Status: ${res.status}`);
    }
  } catch(e) { log('GET /api/categories', 'FAIL', e.message); }

  // 2. Auth Flow
  let cookie = '';
  let userId = '';
  const dummyUser = { displayName: 'TestUser', email: `test${Date.now()}@test.com`, password: 'password123' };
  
  // Register
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dummyUser)
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await res.json();
    if (res.ok && data.success) {
      userId = data.user.id;
      log('POST /api/auth/register', 'PASS', `User created: ${userId}`);
    } else {
      log('POST /api/auth/register', 'FAIL', `Failed: ${JSON.stringify(data)}`);
    }
  } catch(e) { log('POST /api/auth/register', 'FAIL', e.message); }

  // Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dummyUser.email, password: dummyUser.password })
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await res.json();
    if (res.ok && data.success) {
      log('POST /api/auth/login', 'PASS', `Logged in`);
    } else {
      log('POST /api/auth/login', 'FAIL', `Failed: ${JSON.stringify(data)}`);
    }
  } catch(e) { log('POST /api/auth/login', 'FAIL', e.message); }

  // Me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      log('GET /api/auth/me', 'PASS', `User verified ${data.user.email}`);
    } else {
      log('GET /api/auth/me', 'FAIL', `Failed: ${JSON.stringify(data)}`);
    }
  } catch(e) { log('GET /api/auth/me', 'FAIL', e.message); }

  // 3. Rooms
  let roomCode = '';
  try {
    const res = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ hostId: userId, displayName: dummyUser.displayName })
    });
    const data = await res.json();
    if (res.ok && data.success && data.room?.code) {
      roomCode = data.room.code;
      log('POST /api/rooms', 'PASS', `Room created: ${roomCode}`);
    } else {
      log('POST /api/rooms', 'FAIL', `Failed: ${JSON.stringify(data)}`);
    }
  } catch(e) { log('POST /api/rooms', 'FAIL', e.message); }

  // 4. Leaderboard
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard`);
    const data = await res.json();
    if (res.ok && data.success) {
      log('GET /api/leaderboard', 'PASS', `Got leaderboard data`);
    } else {
      log('GET /api/leaderboard', 'FAIL', `Failed: ${JSON.stringify(data)}`);
    }
  } catch(e) { log('GET /api/leaderboard', 'FAIL', e.message); }

  // 5. History
  try {
    if (userId) {
      const res = await fetch(`${BASE_URL}/api/users/${userId}/history`);
      const data = await res.json();
      if (res.ok && data.success) {
        log('GET /api/users/[id]/history', 'PASS', `Got user history (count: ${data.history?.length})`);
      } else {
        log('GET /api/users/[id]/history', 'FAIL', `Failed: ${JSON.stringify(data)}`);
      }
    } else {
      log('GET /api/users/[id]/history', 'WARN', 'Skipped due to no userId');
    }
  } catch(e) { log('GET /api/users/[id]/history', 'FAIL', e.message); }

  // 6. Pages
  console.log('\nTesting Pages...');
  const pages = ['/', '/home', '/profile', '/leaderboard', '/history', '/settings', '/auth/login', '/auth/register', '/lobby/create', '/modes'];
  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      if (res.ok) {
        log(`Page ${page}`, 'PASS', `Status: ${res.status}`);
      } else {
        log(`Page ${page}`, 'FAIL', `Status: ${res.status}`);
      }
    } catch(e) {
      log(`Page ${page}`, 'FAIL', e.message);
    }
  }

  console.log('\nAPI Results Summary:');
  console.log(JSON.stringify(results, null, 2));
}

run();
